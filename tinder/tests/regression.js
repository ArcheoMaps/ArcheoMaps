// Scribe Curator — executable regression suite.
//
// This exists because of audit finding L-02: the prototype's README claimed
// an automated headless-browser pass, but shipped no tests, fixtures, command
// or expected output to reproduce it. This file is that reproduction. It
// also exercises, as executable assertions rather than verbal claims, most
// of the "required regression suite" the audit specified alongside its
// Critical/High findings (C-01..C-03, H-01..H-07, plus a few Medium/Low).
//
// What this suite does NOT cover (and why), so nobody mistakes a green run
// here for a full clearance:
//   - How the drag/swipe gesture actually feels on a real device (spring
//     stiffness, thresholds) — this drives the buttons directly, which
//     exercise the exact same commitCardOutcome() code path as a completed
//     swipe, but obviously can't judge feel.
//   - The service-worker "update available" banner across a real two-
//     deployment upgrade (H-07's fetch-strategy fix is code-reviewable and
//     documented in service-worker.js, but a true install→activate→banner
//     cycle needs two real fetches of two real served versions, which a
//     single local static-file-server run can't produce).
//   - Real desktop-Scribe round-trip rejection of a decisions export — that
//     requires the actual desktop app, which doesn't exist in this repo.
//   - True on-device performance at the "well beyond recommended" bundle
//     size (the size-confirmation prompt itself IS tested below).
//
// Requirements: `npm install` once, then `npx playwright install chromium`.
// Set CHROMIUM_PATH only when intentionally using a system-managed binary.
//
// Usage:
//   node tests/regression.js [baseUrl]
// Defaults to serving this folder on http://localhost:8934 via
// `python3 -m http.server` if no server is already listening there; pass an
// explicit baseUrl (e.g. one already served over GitHub Pages) to skip that.

const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const FIXTURES = path.join(__dirname, "fixtures");
const DEFAULT_PORT = 8934;
const LEGACY_CHROMIUM_PATH = "/opt/pw-browsers/chromium";

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), "utf8");
}

async function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch (e) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function main() {
  const results = [];
  let passed = 0, failed = 0;

  function record(name, ok, detail) {
    results.push({ name, ok, detail });
    if (ok) { passed++; console.log(`  PASS  ${name}`); }
    else { failed++; console.log(`  FAIL  ${name}\n        ${detail}`); }
  }

  async function test(name, fn) {
    try {
      await fn();
      record(name, true);
    } catch (err) {
      record(name, false, err && err.stack ? err.stack : String(err));
    }
  }

  function assert(cond, msg) {
    if (!cond) throw new Error(msg || "assertion failed");
  }

  // ---- serve the app -------------------------------------------------
  let explicitBaseUrl = process.argv[2];
  let serverProc = null;
  let baseUrl = explicitBaseUrl;

  if (!baseUrl) {
    baseUrl = `http://localhost:${DEFAULT_PORT}`;
    const alreadyUp = await waitForServer(baseUrl + "/index.html", 2);
    if (!alreadyUp) {
      serverProc = spawn("python3", ["-m", "http.server", String(DEFAULT_PORT)], {
        cwd: ROOT,
        stdio: "ignore",
      });
      const up = await waitForServer(baseUrl + "/index.html", 40);
      if (!up) throw new Error(`Could not start/reach a static server at ${baseUrl}`);
    }
  }

  const requestedChromium = process.env.CHROMIUM_PATH;
  const executablePath = requestedChromium || (fs.existsSync(LEGACY_CHROMIUM_PATH) ? LEGACY_CHROMIUM_PATH : undefined);
  let browser;
  try {
    browser = await chromium.launch(executablePath ? { executablePath } : {});
  } catch (err) {
    throw new Error(
      `Chromium could not start. Run "npx playwright install chromium" or set CHROMIUM_PATH to a valid executable.\n${err.message}`
    );
  }

  async function freshPage(opts) {
    const acceptDialogs = !!(opts && opts.acceptDialogs);
    const context = await browser.newContext();
    const page = await context.newPage();
    const dialogs = [];
    page.on("dialog", async (d) => {
      dialogs.push({ type: d.type(), message: d.message() });
      // Auto-dismiss by default (equivalent to a user backing out); a test
      // that deliberately needs to go through with a confirm() (e.g.
      // resetSession's "Start a new session?") passes acceptDialogs instead.
      try {
        if (acceptDialogs) await d.accept();
        else await d.dismiss();
      } catch (e) { /* already handled */ }
    });
    await page.goto(`${baseUrl}/index.html`);
    return { context, page, dialogs };
  }

  async function importJson(page, jsonText) {
    await page.setInputFiles("#fileInput", {
      name: "bundle.json",
      mimeType: "application/json",
      buffer: Buffer.from(jsonText),
    });
  }

  async function loadSample(page) {
    await page.click("#loadSampleBtn");
    await page.waitForSelector("#cardStack .card.top", { timeout: 5000 });
  }

  async function skipUntilTitleIncludes(page, needle, maxSkips = 20) {
    for (let i = 0; i < maxSkips; i++) {
      const title = await page.locator("#cardStack .card.top .card-title h3").textContent();
      if (title && title.includes(needle)) return title;
      await page.click("#btnSkip");
      await page.waitForTimeout(30);
    }
    throw new Error(`Never found a top card titled like "${needle}" within ${maxSkips} skips`);
  }

  async function exportDecisionsAndRead(page) {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#exportDecisionsBtn"),
    ]);
    const filename = download.suggestedFilename();
    const filePath = await download.path();
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { filename, content };
  }

  console.log(`\nScribe Curator regression suite — target ${baseUrl}\n`);

  // ---- C-01: stored XSS is inert -------------------------------------
  await test("C-01: hostile values never execute and never render live", async () => {
    const { context, page, dialogs } = await freshPage();
    try {
      await importJson(page, readFixture("xss-bundle.json"));
      await page.waitForSelector("#cardStack .card.top", { timeout: 5000 });
      await page.waitForTimeout(150);

      const pwned = await page.evaluate(() => ({
        pwned: window.__pwned,
        pwned2: window.__pwned2,
      }));
      assert(pwned.pwned === undefined, "window.__pwned was set — an injected handler executed");
      assert(pwned.pwned2 === undefined, "window.__pwned2 was set — an injected <script> executed");
      assert(dialogs.length === 0, `a dialog fired: ${JSON.stringify(dialogs)}`);

      const titleText = await page.locator("#cardStack .card.top .card-title h3").textContent();
      assert(titleText.includes("<img"), "hostile name should render as literal escaped text, not be stripped");

      const hasRawImgTag = await page.evaluate(() => {
        const h3 = document.querySelector("#cardStack .card.top .card-title h3");
        return h3.innerHTML.includes("<img");
      });
      assert(!hasRawImgTag, "title innerHTML contains a live <img> tag — escaping failed");

      const hasCardImage = await page.evaluate(() =>
        !!document.querySelector("#cardStack .card.top .card-image")
      );
      assert(!hasCardImage, "a javascript: image URL should never produce a live <img>, only the placeholder");

      const hasEvilSrcLink = await page.evaluate(() =>
        !!document.querySelector('#cardStack .card.top a[href^="javascript:"]')
      );
      assert(!hasEvilSrcLink, "a javascript: source URL must never be rendered as a clickable link");
    } finally {
      await context.close();
    }
  });

  // ---- C-02: identity-deferred locks dependents -----------------------
  await test("C-02: explicitly deferring identity locks dependent fields on accept", async () => {
    const { context, page } = await freshPage();
    try {
      await loadSample(page);
      await skipUntilTitleIncludes(page, "Nan Madol");

      // Open the "..." sheet on the Identity row and defer it explicitly.
      const identityRow = page.locator("#cardStack .card.top .field-row").filter({ hasText: "Identity" }).first();
      await identityRow.locator(".field-more").click();
      await page.locator("#fieldActionButtons button", { hasText: "Defer this field only" }).click();
      await page.waitForTimeout(60);

      // Not every field on this card depends on identity (Countries/Image
      // are deliberately identity-independent in the mock data, matched by
      // coordinates instead) — ask the app itself, via its own `.locked`
      // styling, which proposals it considers dependent, rather than
      // assuming every sibling field is.
      const lockedIds = await page.evaluate(() =>
        Array.from(document.querySelectorAll("#cardStack .card.top .field-row.locked[data-proposal]")).map(
          (el) => el.dataset.proposal
        )
      );
      assert(lockedIds.length > 0, "expected at least one dependent field to be visibly locked after deferring identity");

      await page.click("#btnAccept");
      await page.waitForTimeout(600); // card-exit animation (transition is .42s + a 500ms safety net)

      const { content } = await exportDecisionsAndRead(page);
      const identityDecision = content.decisions.find((d) => d.decision === "deferred" && d.proposalId.toLowerCase().includes("identity"));
      assert(identityDecision, "expected an Identity proposal decided 'deferred' in the export");

      const wronglyAccepted = lockedIds
        .map((id) => content.decisions.find((d) => d.proposalId === id))
        .filter((d) => d && d.decision === "accepted");
      assert(
        wronglyAccepted.length === 0,
        `field(s) the app itself showed as identity-locked resolved 'accepted' anyway: ${JSON.stringify(wronglyAccepted)}`
      );
    } finally {
      await context.close();
    }
  });

  // ---- C-03: duplicate proposalId rejected on import -------------------
  await test("C-03: a bundle with a duplicate proposalId is rejected, not silently loaded", async () => {
    const { context, page } = await freshPage();
    try {
      await importJson(page, readFixture("duplicate-proposal-id.json"));
      await page.waitForTimeout(150);
      const errorText = await page.locator("#importError").textContent();
      assert(/duplicate proposalId/i.test(errorText || ""), `expected a duplicate-proposalId error, got: "${errorText}"`);
      const stackVisible = await page.evaluate(() => document.querySelector("#cardStack").children.length);
      assert(stackVisible === 0, "the hostile bundle should never have reached the review UI");
    } finally {
      await context.close();
    }
  });

  // ---- H-03/H-04: unsupported schema version rejected ------------------
  await test("H-03: an unsupported schemaVersion is rejected, not run through anyway", async () => {
    const { context, page } = await freshPage();
    try {
      await importJson(page, readFixture("bad-schema-version.json"));
      await page.waitForTimeout(150);
      const errorText = await page.locator("#importError").textContent();
      assert(/unsupported schemaVersion/i.test(errorText || ""), `expected an unsupported-schemaVersion error, got: "${errorText}"`);
    } finally {
      await context.close();
    }
  });

  // ---- H-04: a corrupted autosave is discarded, not trusted ------------
  await test("H-04: a corrupted saved session falls back to the import screen instead of loading", async () => {
    const { context, page } = await freshPage();
    try {
      // Seed IndexedDB directly with a structurally-broken "saved session"
      // (decisions reference a proposalId that doesn't exist) before the
      // app's own boot() ever runs, simulating a half-written save or
      // manual tampering (audit H-04).
      await page.evaluate(() => {
        return new Promise((resolve, reject) => {
          const req = indexedDB.open("scribe-curator-db", 1);
          req.onupgradeneeded = () => req.result.createObjectStore("kv");
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction("kv", "readwrite");
            tx.objectStore("kv").put(
              {
                schemaVersion: "scribe.mobile.v1",
                batchId: "corrupt",
                sourceFingerprint: "sha256:corrupt",
                locations: [{ recordId: "r1", name: "R1", proposals: [{ proposalId: "p1", field: "Type" }] }],
                order: ["r1"],
                cursor: 0,
                decisions: { "does-not-exist": { decision: "accepted", timestamp: null } },
                toggles: {},
                explicit: {},
                competingSelection: {},
                counts: { accepted: 0, rejected: 0, deferred: 0 },
                cardOutcomes: {},
              },
              "app-state"
            );
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => reject(tx.error);
          };
          req.onerror = () => reject(req.error);
        });
      });

      await page.reload();
      await page.waitForTimeout(300);

      const importScreenVisible = await page.evaluate(
        () => getComputedStyle(document.querySelector("#importScreen")).display !== "none"
      );
      assert(importScreenVisible, "a corrupted autosave must fall through to the import screen, not silently render");
      const errorText = await page.locator("#importError").textContent();
      assert(/couldn't be loaded/i.test(errorText || ""), `expected a discard-and-reset message, got: "${errorText}"`);
    } finally {
      await context.close();
    }
  });

  // ---- H-05: low-confidence proposals default OFF ----------------------
  await test("H-05: a low-confidence proposal is not pre-enabled by default", async () => {
    const { context, page } = await freshPage();
    try {
      await loadSample(page);
      await skipUntilTitleIncludes(page, "Nan Madol");
      // Nan Madol's Tags proposal is lane:"low" in the mock data.
      const tagsRow = page.locator("#cardStack .card.top .field-row").filter({ hasText: "Tags" }).first();
      const isOn = await tagsRow.locator(".pill-toggle").getAttribute("aria-checked");
      assert(isOn === "false", `expected the low-lane Tags proposal to default off, aria-checked was "${isOn}"`);
    } finally {
      await context.close();
    }
  });

  // ---- H-06: oversized import is rejected without hanging --------------
  await test("H-06: an oversized import file is rejected before being parsed", async () => {
    const { context, page } = await freshPage();
    try {
      const big = {
        schemaVersion: "scribe.mobile.v1",
        batchId: "huge",
        sourceFingerprint: "sha256:huge",
        locations: [{ recordId: "r1", name: "R1", proposals: [] }],
        padding: "x".repeat(9 * 1024 * 1024), // > MAX_IMPORT_FILE_BYTES (8 MB)
      };
      await page.setInputFiles("#fileInput", {
        name: "huge.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(big)),
      });
      await page.waitForTimeout(150);
      const errorText = await page.locator("#importError").textContent();
      assert(/MB, over this app's/i.test(errorText || ""), `expected a size-limit error, got: "${errorText}"`);
    } finally {
      await context.close();
    }
  });

  // ---- H-01: Undo restores the counter it actually changed --------------
  await test("H-01: Undo decrements the counter the accept actually incremented", async () => {
    const { context, page } = await freshPage();
    try {
      await loadSample(page);
      const before = await page.locator("#cntAccepted").textContent();
      await page.click("#btnAccept");
      await page.waitForTimeout(600); // card-exit animation
      const after = await page.locator("#cntAccepted").textContent();
      assert(Number(after) === Number(before) + 1, `expected accepted count to go from ${before} to ${Number(before) + 1}, got ${after}`);

      await page.click("#btnUndo");
      await page.waitForTimeout(150);
      const restored = await page.locator("#cntAccepted").textContent();
      assert(Number(restored) === Number(before), `expected Undo to restore accepted count to ${before}, got ${restored}`);
    } finally {
      await context.close();
    }
  });

  // ---- H-02: Undo works from the completed/done screen -------------------
  await test("H-02: Undo is reachable and works after the very last card", async () => {
    const { context, page } = await freshPage();
    try {
      await loadSample(page);
      // Drive every card to "reject" until the queue empties.
      for (let i = 0; i < 20; i++) {
        const doneVisible = await page.evaluate(
          () => getComputedStyle(document.querySelector("#doneScreen")).display !== "none"
        );
        if (doneVisible) break;
        await page.click("#btnReject");
        await page.waitForTimeout(600); // card-exit animation
      }
      const doneVisible = await page.evaluate(
        () => getComputedStyle(document.querySelector("#doneScreen")).display !== "none"
      );
      assert(doneVisible, "queue never reached the done screen within 20 rejects");

      const undoVisible = await page.evaluate(
        () => getComputedStyle(document.querySelector("#undoFromDone")).display !== "none"
      );
      assert(undoVisible, "the done screen's Undo button should be visible right after finishing");

      await page.click("#undoFromDone");
      await page.waitForTimeout(150);
      const backToReview = await page.evaluate(
        () => getComputedStyle(document.querySelector("#actionBar")).display !== "none"
      );
      assert(backToReview, "Undo from the done screen should return to the review UI");
    } finally {
      await context.close();
    }
  });

  // ---- M-01: a competing group can be explicitly rejected as a whole -----
  await test("M-01: a competing-candidate field can be explicitly rejected in full, like a normal row", async () => {
    const { context, page } = await freshPage();
    try {
      await loadSample(page);
      await skipUntilTitleIncludes(page, "Sacsayhuam");

      const groupRow = page.locator("#cardStack .card.top [data-group-row]").first();
      await page.waitForSelector("#cardStack .card.top [data-group-row]", { timeout: 3000 });
      const memberIds = await groupRow.locator(".chip[data-choice]").evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-choice")).filter((v) => v !== "none" && v !== "later")
      );
      assert(memberIds.length >= 2, `expected at least 2 competing candidates, found ${memberIds.length}`);

      await groupRow.locator(".field-more").click();
      await page.locator("#fieldActionButtons button", { hasText: "Explicitly reject this field" }).click();
      await page.waitForTimeout(60);

      await page.click("#btnAccept");
      await page.waitForTimeout(600); // card-exit animation

      const { content } = await exportDecisionsAndRead(page);
      for (const id of memberIds) {
        const d = content.decisions.find((x) => x.proposalId === id);
        assert(d, `no export decision found for competing candidate ${id}`);
        assert(d.decision === "rejected", `expected candidate ${id} to be rejected, got "${d.decision}"`);
      }
    } finally {
      await context.close();
    }
  });

  // ---- M-07: falsy-but-real values are not displayed as missing ---------
  await test("M-07: a real 0/false value displays as itself, not a dash", async () => {
    const { context, page } = await freshPage();
    try {
      await importJson(page, readFixture("falsy-values.json"));
      await page.waitForSelector("#cardStack .card.top", { timeout: 5000 });
      const text = await page.locator("#cardStack .card.top .field-values").first().textContent();
      assert(text.includes("0"), `expected the proposed value "0" to be shown, got: "${text}"`);
      assert(!/^\s*—/.test(text), `current value "false" should not render as a bare dash, got: "${text}"`);
    } finally {
      await context.close();
    }
  });

  // ---- L-04: export filenames are a bounded safe slug --------------------
  await test("L-04: exported decisions filename is a safe, bounded slug", async () => {
    const { context, page } = await freshPage();
    try {
      await loadSample(page);
      const { filename } = await exportDecisionsAndRead(page);
      assert(
        /^scribe-decisions-[A-Za-z0-9_-]+-\d+\.json$/.test(filename),
        `filename "${filename}" is not a safe bounded slug`
      );
    } finally {
      await context.close();
    }
  });

  // ---- v0.3.1: a reset raced against a pending autosave stays clean -----
  // Added while independently re-verifying v0.3.1's own claims (this repo
  // has a real Chromium available, unlike the environment that produced
  // it): persistState() debounces writes by 250ms. Before this version, a
  // write already in flight when resetSession() ran could still land in
  // IndexedDB *after* idbClear(), resurrecting the pre-reset state. The fix
  // is a generation counter that invalidates any save queued before a
  // reset/import. This drives that exact race — accept, then immediately
  // reset — and reads IndexedDB directly afterward rather than trusting
  // the UI, since a stale write could leave the UI looking fine while the
  // persisted copy is wrong.
  await test("v0.3.1: reset wins a race against a pending autosave, no stale resurrection", async () => {
    const { context, page } = await freshPage({ acceptDialogs: true });
    try {
      await loadSample(page);
      await page.click("#btnAccept"); // queues a debounced autosave of the post-accept state
      await page.click("#aboutBtn");
      await page.click("#resetBtn"); // confirm() auto-accepted; resetSession() should win the race
      await page.waitForTimeout(700); // well past the 250ms debounce plus write time

      const saved = await page.evaluate(() => {
        return new Promise((resolve, reject) => {
          const req = indexedDB.open("scribe-curator-db", 1);
          req.onupgradeneeded = () => req.result.createObjectStore("kv");
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction("kv", "readonly");
            const getReq = tx.objectStore("kv").get("app-state");
            getReq.onsuccess = () => { db.close(); resolve(getReq.result); };
            getReq.onerror = () => { db.close(); reject(getReq.error); };
          };
          req.onerror = () => reject(req.error);
        });
      });
      assert(
        saved === undefined || saved === null || !saved.cardOutcomes || Object.keys(saved.cardOutcomes).length === 0,
        `reset should leave no reviewed cards behind, but IndexedDB has: ${JSON.stringify(saved && saved.cardOutcomes)}`
      );

      const importScreenVisible = await page.evaluate(
        () => getComputedStyle(document.querySelector("#importScreen")).display !== "none"
      );
      assert(importScreenVisible, "after a reset the app should show the import screen, not a resumed queue");
    } finally {
      await context.close();
    }
  });

  await browser.close();
  if (serverProc) serverProc.kill();

  console.log(`\n${passed} passed, ${failed} failed (${results.length} total)\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("Regression suite crashed:", err);
  process.exit(2);
});
