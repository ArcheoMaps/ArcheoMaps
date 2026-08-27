// tests/test-lazy-dataset-fetch.js
//
// Playwright check for the rare free-typed EDIT path (spec §5): verifies
// the lazy full-dataset fetch + sha256 integrity check actually works
// end-to-end in a real browser, both when the deployed dataset file is
// correct and when it's been tampered with (must be REJECTED, never
// silently used).
//
// Self-contained: builds its own GitHub-Pages-style temp layout (curator/
// next to the dataset) from the real curator/ directory plus a
// user-supplied copy of the authoritative dataset. Does not assume any
// pre-existing scratch directory.
//
// Usage:
//   ARCHEOMAPS_DATASET_PATH=/path/to/archeomaps_data_unesco_enriched_corrected.json \
//     node tests/test-lazy-dataset-fetch.js
//   node tests/test-lazy-dataset-fetch.js --dataset=/path/to/dataset.json
'use strict';
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

function parseArgs(argv) {
  const out = {};
  for (const a of argv.slice(2)) {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const cliArgs = parseArgs(process.argv);
const DATASET_PATH = cliArgs.dataset
  ? path.resolve(cliArgs.dataset)
  : (process.env.ARCHEOMAPS_DATASET_PATH ? path.resolve(process.env.ARCHEOMAPS_DATASET_PATH) : null);

if (!DATASET_PATH || !fs.existsSync(DATASET_PATH)) {
  console.error('\n[test-lazy-dataset-fetch] FATAL: could not locate the authoritative ArcheoMaps dataset.\n');
  console.error('This test needs a real copy of archeomaps_data_unesco_enriched_corrected.json to build a GitHub-Pages-style layout. Supply it with:');
  console.error('  node tests/test-lazy-dataset-fetch.js --dataset=/path/to/dataset.json');
  console.error('  ARCHEOMAPS_DATASET_PATH=/path/to/dataset.json node tests/test-lazy-dataset-fetch.js\n');
  process.exit(1);
}

const CURATOR_SRC = path.join(__dirname, '..', 'curator');
const WORKDIR = fs.mkdtempSync(path.join(os.tmpdir(), 'archeomaps-lazy-fetch-'));
const SHOT_DIR = process.env.SHOT_DIR || '/tmp/curator-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

function waitForServer(url, retries) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      try {
        execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', url], { timeout: 2000 });
        resolve();
      } catch (e) {
        if (n <= 0) return reject(new Error('server never became ready'));
        setTimeout(() => attempt(n - 1), 300);
      }
    };
    attempt(retries);
  });
}

function assert(cond, msg) { if (!cond) throw new Error('ASSERTION FAILED: ' + msg); console.log('  OK:', msg); }

async function main() {
  // --- Build a GitHub-Pages-style layout: curator/ next to the dataset ---
  const goodRoot = path.join(WORKDIR, 'good');
  fs.mkdirSync(goodRoot, { recursive: true });
  fs.cpSync(CURATOR_SRC, path.join(goodRoot, 'curator'), { recursive: true });
  fs.copyFileSync(DATASET_PATH, path.join(goodRoot, path.basename(DATASET_PATH)));
  // curator/review_queue.json's inputs.dataset.path must match this basename
  // for the app to look in the right place — confirm that assumption holds
  // rather than silently testing the wrong thing.
  const queue = JSON.parse(fs.readFileSync(path.join(goodRoot, 'curator', 'review_queue.json'), 'utf8'));
  const recordedName = queue.inputs && queue.inputs.dataset && queue.inputs.dataset.path;
  if (recordedName !== path.basename(DATASET_PATH)) {
    console.error(`[test-lazy-dataset-fetch] FATAL: review_queue.json was generated from "${recordedName}", but --dataset points at a file named "${path.basename(DATASET_PATH)}". Regenerate the queue from this exact dataset first.`);
    process.exit(1);
  }

  const PORT = process.env.LAZY_TEST_PORT || '8793';
  const server = spawn('python3', ['-m', 'http.server', PORT, '--bind', '127.0.0.1'], { cwd: goodRoot, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverExited = false;
  server.on('exit', () => { serverExited = true; });

  try {
    await waitForServer(`http://127.0.0.1:${PORT}/curator/index.html`, 20);
    console.log('server ready (correct dataset)');

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(`http://127.0.0.1:${PORT}/curator/index.html`, { waitUntil: 'networkidle' });

    // --- Part 1: correct dataset at the configured path -> integrity check passes ---
    await page.click('.decision-btn-edit');
    await page.waitForTimeout(150);
    // site-0735 (Batu Caves) exists in the dataset but is not one of the
    // first proposal's top-3 candidates (site-0083 / site-0001 / site-0002).
    // Real keystrokes + a real Tab press (not .fill()) — exactly what an
    // actual curator does, and avoids any ambiguity about synthetic events.
    await page.click('#editOtherIdInput');
    await page.keyboard.type('site-0735', { delay: 20 });
    await page.waitForTimeout(150);
    const errText = await page.textContent('.edit-form .error-text').catch(() => '');
    assert(!errText || errText.trim() === '', 'no inline "does not exist" error for a genuinely valid off-top-3 id');

    await page.keyboard.press('Tab');
    await page.waitForFunction(() => {
      const el = document.getElementById('leftPanel');
      return el && el.textContent.includes('Batu Caves');
    }, { timeout: 10000 });
    const leftPanelText = await page.textContent('#leftPanel');
    assert(leftPanelText.includes('Batu Caves'), 'lazy-fetched + integrity-verified snapshot renders correctly for an off-top-3 id');
    assert(leftPanelText.includes('Selected alternate'), 'left panel is clearly labeled as showing an alternate selection');

    console.log('errors so far:', errors);
    assert(errors.length === 0, 'no page errors during the successful lazy-fetch path');

    await page.screenshot({ path: path.join(SHOT_DIR, 'lazy-dataset-fetch-success.png') });
    await browser.close();
  } finally {
    if (!serverExited) server.kill('SIGTERM');
  }

  // --- Part 2: tampered dataset at the configured path -> integrity check MUST fail ---
  const tamperedRoot = path.join(WORKDIR, 'tampered');
  fs.mkdirSync(tamperedRoot, { recursive: true });
  fs.cpSync(path.join(goodRoot, 'curator'), path.join(tamperedRoot, 'curator'), { recursive: true });
  // A byte-different "dataset" at the same configured filename.
  fs.writeFileSync(path.join(tamperedRoot, path.basename(DATASET_PATH)), '[{"id":"site-0001","n":"Tampered","lat":0,"lon":0}]');

  const PORT2 = process.env.LAZY_TEST_PORT2 || '8794';
  const server2 = spawn('python3', ['-m', 'http.server', PORT2, '--bind', '127.0.0.1'], { cwd: tamperedRoot, stdio: ['ignore', 'pipe', 'pipe'] });
  let server2Exited = false;
  server2.on('exit', () => { server2Exited = true; });

  try {
    await waitForServer(`http://127.0.0.1:${PORT2}/curator/index.html`, 20);
    console.log('tampered-dataset server ready');

    const browser2 = await chromium.launch();
    const page2 = await browser2.newPage({ viewport: { width: 1280, height: 900 } });
    const errors2 = [];
    page2.on('pageerror', (e) => errors2.push(e.message));
    await page2.goto(`http://127.0.0.1:${PORT2}/curator/index.html`, { waitUntil: 'networkidle' });

    await page2.click('.decision-btn-edit');
    await page2.waitForTimeout(150);
    await page2.click('#editOtherIdInput');
    await page2.keyboard.type('site-0735', { delay: 20 });
    await page2.waitForTimeout(150);
    await page2.keyboard.press('Tab');

    await page2.waitForFunction(() => {
      const el = document.getElementById('leftPanel');
      return el && (el.textContent.includes('Could not load') || el.textContent.includes('integrity'));
    }, { timeout: 10000 });
    const leftPanelText2 = await page2.textContent('#leftPanel');
    assert(/integrity/i.test(leftPanelText2) || /Could not load/.test(leftPanelText2), 'tampered dataset at the configured path is REJECTED, not silently used');
    assert(!leftPanelText2.includes('Batu Caves'), 'tampered dataset never gets used to render a snapshot');
    console.log('errors (part 2):', errors2);
    assert(errors2.length === 0, 'no page errors during the integrity-failure path either');

    await page2.screenshot({ path: path.join(SHOT_DIR, 'lazy-dataset-fetch-integrity-failure.png') });
    await browser2.close();
  } finally {
    if (!server2Exited) server2.kill('SIGTERM');
    fs.rmSync(WORKDIR, { recursive: true, force: true });
  }

  console.log('\nALL LAZY-DATASET-FETCH CHECKS PASSED');
}

main().catch((e) => {
  console.error('\nFAILED:', e.message);
  process.exitCode = 1;
});
