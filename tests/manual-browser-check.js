// tests/manual-browser-check.js
// Not part of the shipped deliverable's runtime — a Playwright-driven
// interaction + visual check used during development, and the basis for
// docs/manual-visual-check-report.md. Requires the curator/ directory to be
// served over HTTP (not file://) at BASE_URL.
'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.CURATOR_BASE_URL || 'http://127.0.0.1:8791';
const SHOT_DIR = process.env.SHOT_DIR || '/tmp/curator-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

function log(label, value) { console.log(`[check] ${label}:`, value); }
function assert(cond, msg) { if (!cond) throw new Error('ASSERTION FAILED: ' + msg); console.log('  OK:', msg); }

async function run() {
  const browser = await chromium.launch();
  const results = [];

  // ---------------- Desktop pass ----------------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

    await page.goto(BASE_URL + '/index.html', { waitUntil: 'networkidle' });

    let meta = await page.textContent('#headerMeta');
    assert(meta.includes('0 of 62 reviewed'), 'starts at 0 of 62 reviewed');

    // queue-order sort should start on unescoId=4 (L'Anse aux Meadows) per generator's numeric sort
    let rightPanel = await page.textContent('#rightPanel');
    assert(rightPanel.includes('Meadows'), 'first case in queue order is unescoId=4 (L\u2019Anse aux Meadows), not string-sorted');

    // APPROVE
    await page.click('.decision-btn-approve');
    await page.waitForTimeout(150);
    meta = await page.textContent('#headerMeta');
    assert(meta.includes('1 of 62 reviewed'), 'count updates after APPROVE');
    let autosave = await page.textContent('#autosaveStatus');
    assert(/Autosaved/.test(autosave), 'autosave status updates after APPROVE');

    // NEXT + EDIT flow
    await page.click('.nav-btn:has-text("Next")');
    await page.waitForTimeout(100);
    await page.click('.decision-btn-edit');
    await page.waitForTimeout(100);
    const radios = await page.$$('.edit-candidates input[type=radio]');
    assert(radios.length === 3, 'EDIT form shows exactly 3 candidate radios');
    await radios[1].click();
    // Confirm without note should be rejected (native alert) — verify guarded via dialog handler
    let alertSeen = false;
    page.once('dialog', async (d) => { alertSeen = true; await d.accept(); });
    await page.click('.confirm-btn');
    await page.waitForTimeout(150);
    assert(alertSeen, 'EDIT without a curator note is rejected with an alert');
    await page.fill('.edit-form textarea', 'Manual QA note: candidate #2 is the correct target.');
    await page.click('.confirm-btn');
    await page.waitForTimeout(150);
    let decisionStatus = await page.textContent('.decision-status');
    assert(decisionStatus.includes('EDIT'), 'EDIT decision saved with note');
    meta = await page.textContent('#headerMeta');
    assert(meta.includes('2 of 62 reviewed'), 'count updates after EDIT');

    // Invalid free-text EDIT id on a fresh case
    await page.click('.nav-btn:has-text("Next")');
    await page.waitForTimeout(100);
    await page.click('.decision-btn-edit');
    await page.waitForTimeout(100);
    await page.fill('.edit-form input[type=text]', 'site-9999-not-real');
    await page.waitForTimeout(100);
    const errorText = await page.textContent('.edit-form .error-text');
    assert(/does not exist/.test(errorText), 'invalid free-text ArcheoMaps id shows inline error');
    await page.click('.cancel-btn');

    // REJECT with reason
    await page.click('.decision-btn-reject');
    await page.waitForTimeout(100);
    await page.selectOption('.reason-form select', 'name-coincidence');
    await page.waitForTimeout(100);
    meta = await page.textContent('#headerMeta');
    assert(meta.includes('3 of 62 reviewed'), 'count updates after REJECT (3rd decision total)');

    // NEEDS_RESEARCH + DEFER on next two
    await page.click('.nav-btn:has-text("Next")');
    await page.click('.decision-btn-needs_research');
    await page.waitForTimeout(100);
    await page.click('.nav-btn:has-text("Next")');
    await page.click('.decision-btn-defer');
    await page.waitForTimeout(100);
    meta = await page.textContent('#headerMeta');
    assert(meta.includes('5 of 62 reviewed'), 'all 5 decision types recorded (5 of 62)');

    // Search filter: a query with ZERO matches must show the empty state
    // WITHOUT destroying page chrome (regression test for the caseBody-wipe bug).
    await page.fill('.search-input', 'zzz-definitely-no-match-zzz');
    await page.waitForTimeout(150);
    let emptyVisible = await page.isVisible('#emptyState');
    assert(emptyVisible, 'empty state shown for a query with zero matches');
    let reviewHidden = !(await page.isVisible('#reviewSections'));
    assert(reviewHidden, 'review sections hidden (not destroyed) when empty');

    // Clear search -> chrome must come back and still be interactive (this is exactly
    // where the earlier bug caused a permanent hang).
    await page.fill('.search-input', '');
    await page.waitForTimeout(150);
    let navEl = await page.$('#caseNav');
    assert(navEl !== null, '#caseNav still exists in DOM after clearing search (no permanent DOM wipe)');
    let caseNavText = await page.textContent('#caseNav');
    assert(/Case/.test(caseNavText), 'case navigation renders again after clearing search');

    // Search that matches something specific
    await page.fill('.search-input', 'Meadows');
    await page.waitForTimeout(150);
    const jumpVal = await page.inputValue('.jump-input');
    const caseNavTextAfterSearch = await page.textContent('#caseNav');
    assert(jumpVal === '1' && /of 1 /.test(caseNavTextAfterSearch), 'search "Meadows" narrows to exactly 1 case');
    await page.fill('.search-input', '');
    await page.waitForTimeout(150);

    // Filter by decision = unresolved should exclude the 5 decided cases
    await page.selectOption('#filterBar select', { label: 'Unresolved only' });
    await page.waitForTimeout(150);
    let caseNav3 = await page.textContent('#caseNav');
    const m = /of (\d+)/.exec(caseNav3);
    assert(m && parseInt(m[1], 10) === 57, 'Unresolved-only filter shows 57 (62 - 5 decided)');
    await page.selectOption('#filterBar select', { label: 'All cases' });
    await page.waitForTimeout(100);

    // Keyboard shortcuts (not while typing)
    await page.click('body');
    await page.keyboard.press('j'); // next
    await page.waitForTimeout(100);
    await page.keyboard.press('1'); // approve
    await page.waitForTimeout(150);
    meta = await page.textContent('#headerMeta');
    assert(meta.includes('6 of 62 reviewed'), 'keyboard shortcuts (j = next, 1 = approve) work');

    // Keyboard shortcuts must NOT fire while typing in the search box
    await page.click('.search-input');
    await page.keyboard.press('1');
    await page.waitForTimeout(100);
    meta = await page.textContent('#headerMeta');
    assert(meta.includes('6 of 62 reviewed'), 'digit keys do not trigger decisions while search box is focused');
    await page.keyboard.press('Escape');

    // Export triggers a download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('#exportBtn'),
    ]);
    const exportPath = path.join(SHOT_DIR, 'review_decisions.exported.json');
    await download.saveAs(exportPath);
    const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
    assert(exported.decisionCounts.total === 62, 'exported file has correct total');
    assert(exported.decisions.length === 6, 'exported file contains exactly the 6 decisions made');
    assert(exported.queueFingerprint === (await page.evaluate(() => window.__curatorState.queue.queueFingerprint)), 'exported queueFingerprint matches loaded queue');

    // Reload -> decisions must persist via localStorage (autosave)
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    meta = await page.textContent('#headerMeta');
    assert(meta.includes('6 of 62 reviewed'), 'decisions persist across reload (localStorage autosave)');
    let autosave2 = await page.textContent('#autosaveStatus');
    assert(/Autosaved/.test(autosave2), 'autosave status restored after reload');

    // Import: build a payload with a new decision on an undecided item.
    // Per the full ReviewDecision/export contract (v1.1), decisions +
    // unreviewedProposalIds must together account for every queue item
    // exactly once, so this hand-built file must enumerate all the other
    // 61 proposalIds as unreviewed, not just declare an empty array.
    const currentQueue = await page.evaluate(() => window.__curatorState.queue);
    const existingDecisions = await page.evaluate(() => window.__curatorState.decisionsByProposalId);
    const undecided = currentQueue.items.find((it) => !existingDecisions[it.proposalId]);
    const allOtherProposalIds = currentQueue.items.map((it) => it.proposalId).filter((id) => id !== undecided.proposalId);
    const importPayload = {
      schemaVersion: 'phase4.1a-review-decision-v1',
      queueVersion: currentQueue.queueVersion,
      queueFingerprint: currentQueue.queueFingerprint,
      exportedAt: new Date().toISOString(),
      decisionCounts: { APPROVE: 1, EDIT: 0, NEEDS_RESEARCH: 0, REJECT: 0, DEFER: 0, total: 62, unreviewed: 61 },
      decisions: [{
        proposalId: undecided.proposalId,
        queueVersion: undecided.queueVersion,
        proposalType: undecided.proposalType,
        source: undecided.source,
        externalId: undecided.externalId,
        targetArcheomapsId: undecided.targetArcheomapsId,
        decision: 'APPROVE',
        selectedArcheomapsId: null,
        editedValues: null,
        curatorNote: 'Imported via manual QA script.',
        reviewedAt: new Date().toISOString(),
        evidenceVersion: undecided.evidenceVersion,
        proposalFingerprint: undecided.proposalFingerprint,
      }],
      unreviewedProposalIds: allOtherProposalIds,
    };
    const importFile = path.join(SHOT_DIR, 'import-test.json');
    fs.writeFileSync(importFile, JSON.stringify(importPayload, null, 2));
    await page.setInputFiles('#importFileInput', importFile);
    await page.waitForTimeout(200);
    meta = await page.textContent('#headerMeta');
    assert(meta.includes('7 of 62 reviewed'), 'import adds a new decision (7 of 62)');
    let importMsg = await page.textContent('#importResult');
    assert(/1 decision\(s\) imported/.test(importMsg), 'import success banner shown');

    // Malformed import must be rejected, not partially applied
    const badImportFile = path.join(SHOT_DIR, 'import-bad.json');
    fs.writeFileSync(badImportFile, '{ not valid json');
    await page.setInputFiles('#importFileInput', badImportFile);
    await page.waitForTimeout(200);
    let importMsg2 = await page.textContent('#importResult');
    assert(/not valid JSON/.test(importMsg2), 'malformed JSON import rejected with clear error');
    meta = await page.textContent('#headerMeta');
    assert(meta.includes('7 of 62 reviewed'), 'malformed import does not change decision count (no partial import)');

    // Explicitly-labeled error-state screenshot (spec §6): documents the
    // malformed-import banner as an intentional error-handling test, kept
    // separate from the clean initial-state screenshots taken below.
    await page.screenshot({ path: path.join(SHOT_DIR, 'desktop-ERROR-STATE-malformed-import.png'), fullPage: true });

    // Clear local progress
    page.once('dialog', async (d) => { await d.accept(); });
    await page.click('#clearProgressBtn');
    await page.waitForTimeout(200);
    meta = await page.textContent('#headerMeta');
    assert(meta.includes('0 of 62 reviewed'), 'clear local progress resets to 0 of 62');

    // Regression test: the stale import-error banner must NOT survive an
    // unrelated "Clear local progress" action (previously it did, and
    // leaked into what was supposed to be a clean initial-state screenshot).
    const importResultAfterClear = await page.textContent('#importResult');
    assert(importResultAfterClear.trim() === '', 'import-result banner is cleared by "Clear local progress" (regression test for stale-banner bug)');
    const errorBannerVisible = await page.isVisible('.banner-error');
    assert(!errorBannerVisible, 'no error banner visible after clearing local progress');

    log('console/page errors (desktop pass)', errors);
    assert(errors.length === 0, 'zero console/page errors during full desktop interaction pass');

    // Clean screenshots: genuinely clean now (both the fix and the
    // assertions above confirm no stale banner survives into these).
    await page.screenshot({ path: path.join(SHOT_DIR, 'desktop-full-page.png'), fullPage: true });
    await page.screenshot({ path: path.join(SHOT_DIR, 'desktop-viewport.png') });
    await context.close();
    results.push({ pass: 'desktop', errors });
  }

  // ---------------- Other-namespace warning check ----------------
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    await page.goto(BASE_URL + '/index.html', { waitUntil: 'networkidle' });
    // Seed a bogus other-namespace key before reload
    await page.evaluate(() => localStorage.setItem('archeomaps-curator::some-other-version::abcdef1234567890::decisions', '{}'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    const bannerVisible = await page.isVisible('.banner-warning');
    assert(bannerVisible, 'other-namespace progress produces a warning banner without auto-loading it');
    let meta = await page.textContent('#headerMeta');
    assert(meta.includes('0 of 62 reviewed'), 'other-namespace decisions are NOT silently loaded into current queue');
    await page.screenshot({ path: path.join(SHOT_DIR, 'desktop-other-namespace-warning.png') });
    await context.close();
  }

  // ---------------- Mobile pass ----------------
  {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });

    await page.goto(BASE_URL + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(SHOT_DIR, 'mobile-initial.png'), fullPage: true });

    // Comparison grid should stack (1 column) below 860px
    const leftBox = await page.locator('#leftPanel').boundingBox();
    const rightBox = await page.locator('#rightPanel').boundingBox();
    assert(leftBox && rightBox && Math.abs(leftBox.x - rightBox.x) < 2, 'left/right panels stack vertically on mobile (same x offset)');
    assert(rightBox.y > leftBox.y, 'right panel renders below left panel on mobile');

    await page.click('.decision-btn-approve');
    await page.waitForTimeout(150);
    const meta = await page.textContent('#headerMeta');
    assert(meta.includes('1 of 62 reviewed'), 'decisions work on mobile viewport');
    await page.screenshot({ path: path.join(SHOT_DIR, 'mobile-after-approve.png'), fullPage: true });

    // Filters toggle
    await page.click('#filterToggleBtn');
    await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(SHOT_DIR, 'mobile-filters-open.png') });

    log('console/page errors (mobile pass)', errors);
    assert(errors.length === 0, 'zero console/page errors on mobile viewport');
    await context.close();
    results.push({ pass: 'mobile', errors });
  }

  await browser.close();
  console.log('\nALL CHECKS PASSED');
  return results;
}

run().catch((e) => {
  console.error('\nCHECK SUITE FAILED:', e.message);
  process.exitCode = 1;
});
