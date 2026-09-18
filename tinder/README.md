# Scribe Curator — prototype v0.3.2

A phone-first, offline-capable companion for reviewing Scribe enrichment proposals, built to the pilot design brief. This is a working first pass, tested with mock data — no real desktop export required to try it.

## What's in this folder

- `index.html` — the entire app (HTML, CSS and JS, all inline). This is the only file that has to load first; everything else supports it.
- `manifest.json` — makes the app installable as a home-screen PWA.
- `service-worker.js` — caches the app shell so the queue works with no connection, and includes an "update available" banner so a later revision never silently overwrites what you're looking at mid-session.
- `icon-192.png`, `icon-512.png` — placeholder app icons (navy/ivory/gold "S" stamp). Swap these for anything nicer whenever you like — same filenames, same sizes.
- `tests/logic-regression.js`, `tests/regression.js`, and `tests/fixtures/*.json` — fast state-invariant tests plus the Playwright browser suite.
- `package.json` / `package-lock.json` — pinned test tooling and reproducible commands.
- `TEST_RESULTS.md` — the verification record for this exact archive.

## Deploying to GitHub Pages

1. Create a repo (a new small one, e.g. `scribe-curator` — keeping it separate from the ArcheoMaps repo avoids entangling the two projects) or a subfolder in an existing repo.
2. Commit these five files as-is, at the repo root (or the subfolder root, if you go that route — GitHub Pages can serve from `/` or `/docs`).
3. In the repo's Settings → Pages, set the source to that branch/folder.
4. GitHub gives you a `https://<username>.github.io/<repo>/` URL. Open it on the phone.
5. On Android Chrome, use the "⋮" menu → **Add to Home screen** (or Chrome will prompt automatically after a bit of use) to install it as a standalone app.

Total footprint is under 300 KB — this will not add anything meaningful to a GitHub repo.

## Testing it right now (before any real Scribe export exists)

Open `index.html` (served over `http://` or `https://` — not `file://`, since IndexedDB and the service worker both need a real origin) and tap **"Load sample batch (mock data)"**. That loads seven real, well-known archaeological sites (Göbekli Tepe, Nan Madol, Sacsayhuamán, Ħaġar Qim, Great Zimbabwe, Mesa Verde, Petra) with invented proposals shaped exactly like the schema in the brief — including one competing-Type example (Sacsayhuamán) and one identity-dependency example (Nan Madol) — so you can exercise every interaction path without touching real catalogue data.

A quick static file server works fine for local testing, e.g. from this folder:

```
python3 -m http.server 8080
```

then visit `http://localhost:8080/index.html` (or your machine's LAN IP, from the phone, to test at :8080 before it's on GitHub Pages).

## What's implemented

- Card stack with drag-to-follow, rotation, progressive colored edge glow, ACCEPT/REJECT/DEFER stamps, threshold-based commit vs. spring-back, and the next card rising from underneath.
- Accept / Reject / Defer / Skip / Undo, both as buttons and as gestures (right/left/up swipe); Undo restores the full previous toggle and decision state, not just the label.
- Large pill toggles per proposal field, with All/None; disabled proposals are never applied and never blank an existing value.
- Competing-proposal groups render as a chip selector (candidate / candidate / None / Decide later) instead of independent toggles.
- Per-field explicit reject/defer via a "⋯" menu on each row, which also has a **View full details** option (same as tapping the row) plus a Cancel, and dismisses on a backdrop tap — used instead of a long-press gesture, which is unreliable to detect cleanly alongside drag (see note below).
- Tap any field row to expand it in place and see the complete current/proposed values (not just the compact one-line preview) plus that field's own evidence and sources.
- The card body genuinely scrolls — only the image/title area up top is the swipe/drag zone, exactly as intended, so scrolling the field list underneath never fights with the drag gesture. All seven sample cards now carry a full field set specifically so this is testable immediately, without waiting on a real export.
- Identity-dependency locking: turning off (or explicitly rejecting) the identity proposal greys out and disables its dependent field family.
- Expandable Evidence & sources panel per card.
- Counters (accepted/rejected/deferred) and `done / total` progress, both surviving reload.
- IndexedDB autosave (debounced) of the entire session — queue order, toggles, explicit overrides, decisions, counts — plus a request for persistent storage on boot.
- **Export Decisions** — the schema-compliant, decisions-only file (schema version, batch ID, fingerprint, every proposal ID with its resolved decision and a timestamp) meant for desktop Scribe's import/validation.
- **Export Backup** — a full-session file that can be re-imported into this same app to restore exactly where you left off, independent of the decision export.
- Import: a real file picker that accepts either a desktop bundle or one of this app's own backup files, with strict recursive schema and state-invariant validation and an inline error message on anything malformed.
- Online/offline indicator that never implies the queue itself needs a connection; failed images fall back to a placeholder automatically.
- An "about" sheet showing the loaded batch's schema version, batch ID and fingerprint, for confirming you've got the right bundle loaded.
- A service-worker "update available" banner, so testing multiple revisions today won't leave a stale cached copy silently running.
- Haptic buzz on decision commit (`navigator.vibrate`, Android Chrome only — iOS Safari ignores it silently).

What I could not test from here is how the drag physics actually *feel* in your hand on the A52 — spring stiffness, threshold distance, rotation amount are all single numbers near the top of the `<script>` block (`THRESH_X`, `THRESH_Y_UP`, and the `/18` rotation divisor) and are trivial to tune once you've felt it.

**Fixed since the first pass:** the card body wasn't actually scrollable — two separate CSS bugs combined to make it look like there was simply no way to see the rest of a card. `touch-action:none` was set on the whole card (needed only on the drag handle, to stop the browser fighting the custom swipe gesture) which also blocked native scrolling everywhere inside it; and `.card-inner` wasn't a flex container, so the body's `flex:1` had no effect and the overflow was just silently clipped with no scrollbar at all. Both are fixed — the body now genuinely scrolls, and the drag/swipe gesture still only engages from the image/title area at the top, same as before.

## Adversarial audit — what was fixed

The prototype has now had two adversarial security/correctness passes. Version 0.3.1 closes the state-integrity gaps the second pass found in 0.3.0 as well as retaining the first pass's fixes.

### Decision history in v0.3.2

- The Accepted, Rejected, and Deferred counters are now buttons that open a list of every reviewed location in that category.
- Selecting a past location opens its complete card in a clearly marked re-review mode. A replacement Accept/Reject/Defer updates the existing decision and counters, then returns to the exact untouched queue position.
- **Back to queue** discards every draft toggle, competing-group, and explicit-field change before returning.
- Historical drafts are kept out of IndexedDB until committed, so reloading mid-edit resumes the last fully valid saved session rather than persisting a temporarily inconsistent decision.
- Re-review works after queue completion as well as during an active queue; it never moves or reorders pending cards.

Everything below was independently re-verified rather than taken on faith: the second pass's own logic suite was re-run here, and the first pass's full browser suite was re-run against v0.3.1 unmodified (it still passes — nothing was quietly regressed). The one claim that genuinely needed a live browser to check — that a reset can't be raced by a stale pending autosave — didn't have browser access in the environment that made the claim, so a new test for exactly that race was written and run here; it passed. See `TEST_RESULTS.md` for the full account, including what still can't be verified from any sandbox (real device feel, a live two-deployment service-worker upgrade, real desktop-Scribe round-tripping).

### Second-pass hardening in v0.3.1

- Every attacker-controlled ID map uses a null-prototype dictionary, so IDs such as `__proto__`, `constructor`, and `toString` are ordinary keys rather than inherited object behavior.
- Competing groups use an encoded `[recordId, groupId]` tuple key, eliminating delimiter collisions; group lookup compares the full key instead of parsing it.
- The supported schema permits at most one identity proposal per record, rejects identity proposals inside competing groups, and requires exactly one identity when any field depends on identity.
- Bundle validation now recursively checks images, evidence, sources, labels, booleans, confidence range, non-empty proposals, and competing-group consistency.
- Saved state validation now requires the exact state format, exact proposal/group maps, an integer cursor, exact reviewed-card outcomes, recomputed decisions, valid timestamps, and counters derived from those outcomes. Unknown or missing state is rejected.
- Low-confidence competing candidates can no longer win by default. The best non-low candidate is selected; an all-low group starts at **Decide later**.
- Autosaves are serialized and generation-guarded so an older write cannot race a reset or replacement session. About distinguishes **Saving**, **OK**, and **Failing**.
- An already-waiting service worker is surfaced immediately; activation claims clients inside `waitUntil`; app and cache versions are both 0.3.1.
- Imported IDs are no longer inserted into CSS selectors. Remaining chips, All/None controls, switches, evidence controls, Undo, and Skip have at least 44 px touch targets.
- The Playwright runner no longer assumes a private `/opt/...` Chromium path. It uses Playwright's installed browser by default or an explicit `CHROMIUM_PATH`.

### First-pass fixes retained

- **C-01 (stored XSS)** — every attacker-reachable string (image/source URLs, evidence text, proposal/location names and values, imported IDs) is now HTML-escaped before it reaches the page, image and source URLs are scheme-validated (only `http:`/`https:` render; anything else — `javascript:`, `data:`, etc. — is silently dropped in favour of the placeholder), and the one inline `onerror=""` attribute the app used to emit itself is gone, replaced with a real event listener. A Content-Security-Policy is also now set; its `script-src` still needs `'unsafe-inline'` because this is a hand-edited single static file with no build step to generate a nonce or hash per release — that's a documented, deliberate tradeoff, not a substitute for closing the actual injection points, which is what the escaping above does.
- **C-02 (identity-deferred didn't actually lock dependents)** — explicitly *deferring* an identity match now locks its dependent fields exactly like explicitly rejecting it did before; previously only "rejected" (or the toggle being off) counted, so a deferred-but-still-toggled-on identity let dependent fields sail through to "accepted" on a card-level accept.
- **C-03 (no duplicate-ID protection)** — importing a bundle with a duplicate `recordId` or `proposalId` anywhere in it is now refused outright with a specific error, instead of silently corrupting whichever record came second. Competing-group IDs are additionally namespaced internally by record, so a legal group-ID reuse across records can never leak one record's chip selection into another's.
- **H-01 (Undo didn't actually decrement anything)** — Undo now restores the exact counter it changed; the previous version tried to recover that from state captured before the decision was ever applied, which was always empty on a first decision, i.e. always.
- **H-02 (Undo vanished after the last card)** — the done screen now has its own Undo button when there's a decision to undo, since the action bar (the only place Undo used to live) disappears the moment the queue empties — previously an accidental swipe on the final card, especially in a one-card batch, had no way back at all.
- **H-03 / H-04 (schema/backup validation too weak)** — only the exact supported schema version string is accepted (not a prefix match); a corrupted or tampered autosave/backup is now fully re-validated (record/proposal shape, ID uniqueness, decision/toggle/order consistency) before ever being trusted, and falls back cleanly to the import screen with an explanation if it fails, instead of being loaded almost blind.
- **H-05 (low-confidence proposals silently rode along on Accept)** — a low-lane proposal now defaults to *off* and needs a deliberate opt-in; previously every proposal defaulted on regardless of confidence, so a single green swipe could accept a low-confidence guess along with everything else on the card.
- **H-06 (no import size limits)** — a hard 8 MB file-size cap is enforced before the file is ever handed to the JSON parser.
- **H-07 (stale cache, no update signal)** — the service worker's cache version now travels with the app version, and the HTML document itself is fetched network-first (falling back to cache only when offline), so a release is visible on the very next load instead of only "eventually, in the background, maybe."
- **M-01 (competing groups had no parity with normal fields)** — a competing-candidate field can now be explicitly rejected or deferred as a whole via the same "⋯" menu every other field has, shows the same explicit-decision tag, and is greyed out the same way when it depends on identity.
- **M-02 (autosave failures were invisible)** — the About sheet now shows autosave status plainly (last successful save time, or a failure reason in red) instead of failing silently.
- **M-03 (IndexedDB connections never closed)** — every open connection is closed once its transaction settles.
- **M-05 (accessibility)** — pinch-zoom is no longer disabled; every icon-only button has a real accessible name (not just a `title`); the "⋯" buttons are a full 44×44 px tap target; the evidence toggle is a real `<button>`, not a `<div>`; there's a visible keyboard-focus outline; and the previously blanket `user-select: none` (needed so dragging a card doesn't select its own text) no longer blocks copying evidence/source text, which is the text you're most likely to actually want to copy.
- **M-06 (safe-area insets double-counted)** — the bottom safe-area inset is applied once, on the lowest bar actually on screen, not stacked on two containers at once.
- **M-07 (falsy real values displayed as "missing")** — a genuinely `0` or `false` value now displays as itself; previously anything JavaScript considers falsy was indistinguishable from "nothing was proposed."
- **L-01 (README location count)** — fixed (seven, Petra included).
- **L-02 (claimed test pass wasn't reproducible)** — see the next section; it's a real, runnable file now, not a sentence.
- **L-04 (unsanitized export filename)** — export filenames now use a bounded, allowlisted-character slug derived from the batch ID; the real `batchId` inside the exported JSON is never touched.

**Deliberately left as documented limitations, not code fixes** (both are called out explicitly rather than silently left):
- **M-04 (image/source loading leaks browsing context, isn't offline-complete)** — proposal images and source links are still loaded straight from whatever remote host the bundle names, which is a real infrastructure question (an image proxy, or requiring locally-cached thumbnails in the export) rather than something this app can respond to at the sink level. Worth deciding on deliberately before wide use, not something to quietly work around here.
- **M-08 (fingerprint is trusted, not verified)** — `sourceFingerprint` is displayed and round-tripped faithfully but never hashed or verified against the bundle's actual contents; as the audit itself notes, that verification has to live on the desktop Scribe side, which is the only place that can know what the "correct" fingerprint for a given export should be.

Two more bugs surfaced purely by writing the regression suite below (not called out by the audit itself, but real): the Content-Security-Policy's `img-src` didn't include `'self'`, so the app's own favicon silently failed to load under it; and the service worker's very first install on a brand-new visit triggered an unconditional auto-reload of the page it had just finished loading (meant only for a genuine version update, not a first install). Both are fixed.

## Regression suite

`tests/logic-regression.js` executes the real inline application code with inert DOM shims and checks the highest-risk state invariants: prototype-shaped IDs, delimiter-collision group IDs, ambiguous identity rejection, recursive nested validation, low-group defaults, required saved-state maps, integer cursor, derived counters, group membership, and decision recomputation.

`tests/regression.js` drives headless Chromium against the app (file import, button-driven accept/reject/defer/undo/skip, IndexedDB tampering, and real download interception). It remains the end-to-end layer. It does **not** cover gesture feel on a real device, a true two-deployment service-worker upgrade, desktop-Scribe round-trip rejection, or large-batch phone performance.

To run it yourself:

```
npm install
npx playwright install chromium
npm run test
```

For a fast no-browser pass, run `npm run test:logic`. The browser runner starts its own local server on port 8934 if needed; pass a deployed URL directly to `node tests/regression.js <url>` to test that copy. See `TEST_RESULTS.md` for what was actually run on this exact build rather than relying on a stale claimed count.

## Known simplifications, worth knowing about

- **Long-press** from the brief is implemented as a tap on a small "⋯" button per field instead, since true long-press detection tends to fight with the drag gesture on the same element. Functionally equivalent; feel free to ask for a real long-press if the extra button bothers you visually.
- **Undo** is single-level (reverses the last card only), matching the brief exactly, not a full history stack.
- Re-enabling a locked identity-dependent field currently resets it to its default enabled state rather than restoring whatever you'd individually set before it got locked — a reasonable edge case to leave as-is for a pilot.
- Images are loaded straight from their remote URL with no opportunistic offline caching yet (the placeholder-on-failure path is implemented and tested; pre-caching viewed images for later offline viewing was flagged as a nice-to-have, not yet built).
- Mock data lives in `generateMockBundle()` inside `index.html` — delete or ignore it once you're importing real bundles; it costs nothing at rest.
