#!/usr/bin/env node
'use strict';

/* ArcheoMaps Geometry Layer System v0.1 — Phase 5
 * Real-browser interaction test runner (GEOMETRY_PHASE5 §11 "UI tests").
 *
 * The build's own Leaflet/MapLibre/topojson dependencies load from public
 * CDNs (cdnjs/unpkg), which this environment's outbound-network policy
 * does not allow (confirmed: CONNECT to cdnjs.cloudflare.com/unpkg.com
 * both returned 403 from the egress proxy). Rather than fall back to
 * regex/static-source assertions, this runner assembles a byte-for-byte
 * copy of index.html in a scratch directory, rewrites ONLY the two CDN
 * references the app actually needs (Leaflet + Leaflet.markercluster +
 * topojson — MapLibre is left untouched and simply 404s, which is
 * harmless: it only matters if a test selects the "OpenFreeMap" basemap,
 * which none of these do) to same-version packages vendored locally from
 * the npm registry (an allowed host), and serves that copy over a local
 * HTTP server. The SHIPPED index.html in this package is never modified
 * by this script — only a throwaway copy is patched, purely to route
 * around a network policy this sandbox enforces, not the app's own
 * design. A real, headless Chromium (Playwright, pre-installed in this
 * environment) then drives real DOM/Leaflet interactions against it.
 *
 * Usage: node tests/browser/run-phase5-browser-tests.js [--vendor-dir=path]
 * Exit code 0 = all scenarios passed. Prints a transcript to stdout and
 * writes the same to test-output/geometry-phase5-browser-test-transcript.txt.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');

const ROOT = path.join(__dirname, '..', '..');
const vendorDirArg = process.argv.find(a => a.startsWith('--vendor-dir='));
const VENDOR_DIR = vendorDirArg ? vendorDirArg.split('=')[1] : path.join(ROOT, '..', 'vendor_assets');

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.json': 'application/json', '.geojson': 'application/json',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};

function serveDir(dir){
  return new Promise((resolve, reject)=>{
    const server = http.createServer((req, res)=>{
      let urlPath = decodeURIComponent(req.url.split('?')[0]);
      if(urlPath === '/') urlPath = '/index.html';
      const filePath = path.join(dir, urlPath);
      if(!filePath.startsWith(dir)){ res.writeHead(403); res.end(); return; }
      fs.readFile(filePath, (err, data)=>{
        if(err){ res.writeHead(404); res.end('not found: ' + urlPath); return; }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', ()=> resolve(server));
    server.on('error', reject);
  });
}

function copyRecursive(src, dest){
  fs.mkdirSync(dest, { recursive: true });
  for(const entry of fs.readdirSync(src, { withFileTypes: true })){
    const s = path.join(src, entry.name), d = path.join(dest, entry.name);
    if(entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

async function buildFixture(){
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'archeomaps-phase5-browser-'));
  copyRecursive(path.join(ROOT, 'scripts'), path.join(tmpDir, 'scripts'));
  copyRecursive(path.join(ROOT, 'layers'), path.join(tmpDir, 'layers'));
  fs.copyFileSync(path.join(ROOT, 'tests', 'browser', 'synthetic-archeomaps_data.json'), path.join(tmpDir, 'archeomaps_data.json'));

  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const replacements = [
    ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css', 'vendor/leaflet.min.css'],
    ['https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css', 'vendor/MarkerCluster.css'],
    ['https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', 'vendor/leaflet.min.js'],
    ['https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js', 'vendor/leaflet.markercluster.js'],
    ['https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js', 'vendor/topojson.min.js'],
  ];
  const missing = [];
  replacements.forEach(([from, to])=>{
    if(!html.includes(from)) missing.push(from);
    html = html.split(from).join(to);
  });
  if(missing.length) throw new Error('Fixture setup: expected CDN reference(s) not found in index.html: ' + missing.join(', '));
  fs.writeFileSync(path.join(tmpDir, 'index.html'), html);

  copyRecursive(VENDOR_DIR, path.join(tmpDir, 'vendor'));
  return tmpDir;
}

const results = [];
function record(name, fn){
  return Promise.resolve().then(fn).then(
    ()=>{ results.push({ name, pass: true }); console.log(`PASS  ${name}`); },
    error=>{ results.push({ name, pass: false, error: String(error && error.stack || error) }); console.log(`FAIL  ${name}\n      ${error}`); }
  );
}
function assert(cond, message){ if(!cond) throw new Error(message || 'assertion failed'); }

async function main(){
  let playwright;
  try{ playwright = require('playwright'); }
  catch(error){
    console.log('BROWSER TESTS UNAVAILABLE: the `playwright` package is not resolvable in this environment.');
    console.log('Reporting this limitation honestly rather than substituting static-source assertions for it.');
    process.exitCode = 2;
    return;
  }

  const tmpDir = await buildFixture();
  const server = await serveDir(tmpDir);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/index.html`;

  const consoleErrors = [];
  const pageErrors = [];

  const browser = await playwright.chromium.launch({
    headless: true,
    executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined,
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on('console', msg=>{ if(msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err=> pageErrors.push(String(err)));

  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.waitForFunction(()=> Boolean(window.ArcheoTestHooks && window.ArcheoTestHooks.getGeometrySelectionController), { timeout: 15000 });

  await record('app loads with real Leaflet and Phase 4/5 scripts, no page errors during boot', async ()=>{
    assert(pageErrors.length === 0, `unexpected page errors during load: ${pageErrors.join(' | ')}`);
    const siteCount = await page.evaluate(()=> window.ArcheoTestHooks.getSites().length);
    assert(siteCount === 4, `expected 4 synthetic sites, got ${siteCount}`);
  });

  // The timeline's default map year is the present day, well outside
  // Hadrian's Wall's 122-400 validity window — correctly so (§6: the
  // timeline stays authoritative over any Site relationship). Tests that
  // need to see an actual highlight move the timeline into range first,
  // exactly as a person dragging the slider would.
  async function setMapYear(year){
    await page.evaluate((y)=>{ window.ArcheoTestHooks.getState().yMax = y; window.ArcheoTestHooks.applyFilters(); }, year);
  }

  await record('a Site selected while the timeline is outside the Geometry\'s valid range loads it but never highlights it, and the drawer says so', async ()=>{
    await page.evaluate(()=>{
      const site = window.ArcheoTestHooks.getSites().find(s=>s.id === 'test-site-accepted');
      window.ArcheoTestHooks.selectSite(site);
    });
    await page.waitForFunction(()=> window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall')?.selectionEnabled === true, { timeout: 10000 });
    await page.waitForTimeout(200);
    const text = await page.evaluate(()=> document.getElementById('drawerLinkedGeometry')?.textContent || '');
    assert(/Outside current map year/.test(text), `expected an Outside-current-map-year label by default, got: ${text}`);
    const highlighted = await page.evaluate(()=>{
      const layer = window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall');
      return layer._highlightedFeatureIds ? layer._highlightedFeatureIds.size : 0;
    });
    assert(highlighted === 0, 'must not highlight a feature outside its valid interval merely because it loaded');
  });

  await record('moving the timeline into range reveals and highlights the already-selected relationship without re-selecting the Site', async ()=>{
    await setMapYear(200);
    await page.waitForFunction(()=>{
      const layer = window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall');
      return layer && layer._highlightedFeatureIds && layer._highlightedFeatureIds.size > 0;
    }, { timeout: 10000 });
    const text = await page.evaluate(()=> document.getElementById('drawerLinkedGeometry')?.textContent || '');
    assert(/Displayed/.test(text), `expected a Displayed label once inside the valid range, got: ${text}`);
  });

  await record('moving the timeline back out of range removes the highlight and the checkbox stays unchecked', async ()=>{
    await setMapYear(1800);
    await page.waitForFunction(()=>{
      const layer = window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall');
      return layer && (!layer._highlightedFeatureIds || layer._highlightedFeatureIds.size === 0);
    }, { timeout: 10000 });
    const checkboxChecked = await page.evaluate(()=> document.querySelector('[data-layer-id="hadrians-wall"]').checked);
    assert(checkboxChecked === false, 'checkbox must remain manual-state-only throughout');
  });

  await record('selecting a Site with an accepted relationship reveals and highlights the layer without checking its manual checkbox', async ()=>{
    await setMapYear(200);
    await page.evaluate(()=>{
      const site = window.ArcheoTestHooks.getSites().find(s=>s.id === 'test-site-accepted');
      window.ArcheoTestHooks.selectSite(site);
    });
    await page.waitForFunction(()=>{
      const layer = window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall');
      return layer && layer.selectionEnabled === true;
    }, { timeout: 10000 });
    const state = await page.evaluate(()=>{
      const layer = window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall');
      return { manualEnabled: layer.manualEnabled, selectionEnabled: layer.selectionEnabled, highlighted: layer._highlightedFeatureIds ? [...layer._highlightedFeatureIds] : [] };
    });
    assert(state.manualEnabled === false, 'manual checkbox state must remain untouched by selection reveal');
    assert(state.selectionEnabled === true, 'selectionEnabled must be true after an eligible reveal');
    assert(state.highlighted.includes('geometry-hadrians-wall-openhistoricalmap-main-line'), 'the targeted feature must be highlighted');
    const checkboxChecked = await page.evaluate(()=> document.querySelector('[data-layer-id="hadrians-wall"]').checked);
    assert(checkboxChecked === false, 'the Layers-panel checkbox must stay unchecked (manual state only)');
    const badge = await page.evaluate(()=> Boolean(document.querySelector('[data-role="temporarily-shown"]')));
    assert(badge, 'a "Temporarily shown" badge should render for a selection-only reveal');
  });

  await record('the Site drawer\'s Linked geometry section renders the relationship', async ()=>{
    const text = await page.evaluate(()=> document.getElementById('drawerLinkedGeometry')?.textContent || '');
    assert(text.includes('Linked geometry'), 'section label missing');
    assert(/Hadrian/i.test(text), 'geometry display name missing');
    assert(/located-on/.test(text), 'relationshipType missing');
  });

  await record('closing the Site record clears the temporary reveal and highlight', async ()=>{
    await page.click('#drawerClose');
    await page.waitForFunction(()=>{
      const layer = window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall');
      return layer && layer.selectionEnabled === false;
    }, { timeout: 10000 });
    const highlighted = await page.evaluate(()=>{
      const layer = window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall');
      return layer._highlightedFeatureIds ? layer._highlightedFeatureIds.size : 0;
    });
    assert(highlighted === 0, 'highlight set must be empty after closing the record');
  });

  await record('a proposed relationship is revealed and visibly labelled proposed', async ()=>{
    await page.evaluate(()=>{
      const site = window.ArcheoTestHooks.getSites().find(s=>s.id === 'test-site-proposed');
      window.ArcheoTestHooks.selectSite(site);
    });
    await page.waitForFunction(()=>{
      const layer = window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall');
      return layer && layer.selectionEnabled === true;
    }, { timeout: 10000 });
    const text = await page.evaluate(()=> document.getElementById('drawerLinkedGeometry')?.textContent || '');
    assert(/Proposed relationship/.test(text), `expected a Proposed relationship label, got: ${text}`);
    await page.click('#drawerClose');
    await page.waitForFunction(()=>{
      const layer = window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall');
      return layer && layer.selectionEnabled === false;
    }, { timeout: 10000 });
  });

  await record('a rejected relationship never auto-reveals and is labelled Rejected in the drawer', async ()=>{
    await page.evaluate(()=>{
      const site = window.ArcheoTestHooks.getSites().find(s=>s.id === 'test-site-rejected');
      window.ArcheoTestHooks.selectSite(site);
    });
    await page.waitForTimeout(300);
    const state = await page.evaluate(()=>({
      selectionEnabled: window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall').selectionEnabled,
      text: document.getElementById('drawerLinkedGeometry')?.textContent || '',
    }));
    assert(state.selectionEnabled === false, 'a rejected relationship must never set selectionEnabled');
    assert(/Rejected/.test(state.text), `expected a Rejected label, got: ${state.text}`);
  });

  await record('manually enabling the layer via the checkbox is independent of selection state and persists to the share URL', async ()=>{
    await page.click('#drawerClose');
    await page.evaluate(()=> document.getElementById('layersBtn').click());
    await page.click('[data-layer-id="hadrians-wall"]');
    await page.waitForFunction(()=> window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall').manualEnabled === true, { timeout: 10000 });
    const shareUrl = await page.evaluate(()=> window.ArcheoTestHooks.buildShareUrl());
    assert(shareUrl.includes('lyr=hadrians-wall'), `manual layer must be persisted in the share URL, got: ${shareUrl}`);
    // Selecting an unlinked Site must not disturb the manual toggle.
    await page.evaluate(()=>{
      const site = window.ArcheoTestHooks.getSites().find(s=>s.id === 'test-site-unlinked');
      window.ArcheoTestHooks.selectSite(site);
    });
    await page.waitForTimeout(300);
    const manualStillOn = await page.evaluate(()=> window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall').manualEnabled);
    assert(manualStillOn === true, 'manual state must survive selecting an unrelated Site');
    // Reset must clear it again.
    await page.click('#resetBtn');
    await page.waitForFunction(()=> window.ArcheoTestHooks.getTemporalLayers().get('hadrians-wall').manualEnabled === false, { timeout: 10000 });
  });

  await record('the mobile drawer layout does not overflow the viewport', async ()=>{
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(()=>{
      const site = window.ArcheoTestHooks.getSites().find(s=>s.id === 'test-site-accepted');
      window.ArcheoTestHooks.selectSite(site);
    });
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(()=> document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 1, `page overflows horizontally on a 390px viewport by ${overflow}px`);
  });

  await record('no unhandled page exceptions occurred anywhere in the run (network-asset noise aside)', async ()=>{
    // This offline, locally-vendored environment has no route to the real
    // tile servers, sprite-atlas host, or MapLibre CDN the live site would
    // reach in production — those failures are artifacts of running
    // air-gapped, not Phase 5 (or app) bugs, so resource-loading noise is
    // excluded here. Actual JS runtime exceptions (`pageerror`, tracked
    // throughout the whole run, not just at boot) are what this asserts.
    assert(pageErrors.length === 0, `unexpected uncaught page errors: ${pageErrors.join(' | ')}`);
    const nonNetworkConsoleErrors = consoleErrors.filter(m => !/Failed to load resource|ERR_TUNNEL_CONNECTION_FAILED|net::ERR_/i.test(m));
    assert(nonNetworkConsoleErrors.length === 0, `unexpected non-network console errors: ${JSON.stringify(nonNetworkConsoleErrors)}`);
  });

  await browser.close();
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const passCount = results.filter(r=>r.pass).length;
  const failCount = results.length - passCount;
  const transcript = [
    `ArcheoMaps Geometry Phase 5 — browser interaction test transcript`,
    `Run at: ${new Date().toISOString()}`,
    `Vendored (locally, from the npm registry) rather than CDN-loaded: Leaflet 1.9.4, Leaflet.markercluster 1.5.3, topojson-client 3 — the sandbox's egress policy returns 403 for cdnjs.cloudflare.com and unpkg.com (confirmed via curl before writing this runner). The shipped index.html is unmodified; only a scratch copy used for this run had its CDN <script>/<link> URLs pointed at the vendored files.`,
    '',
    ...results.map(r=> `${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass ? '' : '\n      ' + r.error}`),
    '',
    `${passCount} passed, ${failCount} failed, ${results.length} total.`,
  ].join('\n');
  const outDir = path.join(ROOT, 'test-output');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'geometry-phase5-browser-test-transcript.txt'), transcript);
  console.log('\n' + transcript);

  process.exitCode = failCount > 0 ? 1 : 0;
}

main().catch(error=>{
  console.error('Browser test runner crashed:', error);
  process.exitCode = 1;
});
