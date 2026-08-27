'use strict';
/**
 * curator.js — ArcheoMaps Phase 4.1A curator workbench (DOM layer).
 *
 * This file is a curator WORKBENCH, not an importer:
 *   - it never writes to archeomaps_data*.json
 *   - it never contacts GitHub
 *   - it never embeds a token or credential
 *   - every button here saves a *decision*, never a data mutation
 *
 * Depends on curator-core.js (must be loaded first, exposes window.CuratorCore).
 * No frameworks, no build step, no external runtime dependency besides the
 * browser itself.
 */

// ===========================================================================
// 1. Configuration — data source paths. Kept in one place and easy to
//    repoint if this tool is ever hosted somewhere the relative layout
//    differs.
// ===========================================================================

var DATA_CONFIG = {
  // Primary, and for Phase 4.1A (IDENTITY_MATCH only) *sufficient* data
  // source: the generated, self-contained review queue.
  queuePath: './review_queue.json',

  // --- Rare free-typed EDIT path only (see ensureFullDataset below) -------
  //
  // Only the DIRECTORY is configured here. The FILENAME is taken at
  // runtime from review_queue.json's own `inputs.dataset.path` field (see
  // scripts/generate-review-queue.js), so this file can never silently
  // drift out of sync with whichever dataset the queue was actually
  // generated from — there is exactly one place that filename is recorded.
  //
  // IMPORTANT — if this tool is deployed on GitHub Pages, this directory
  // must be kept in sync with wherever the authoritative checkpoint
  // (matching queue.inputs.dataset.path, e.g.
  // "archeomaps_data_unesco_enriched_corrected.json") is actually served
  // from, relative to this curator/ directory. The default '../' assumes
  // the checkpoint sits one level up, next to the main ArcheoMaps app.
  //
  // This path is ONLY used for the rare case where a curator EDITs a
  // decision to point at an ArcheoMaps id that was not one of the
  // pre-embedded top-3 candidates for that proposal — the top-three
  // candidate flow never needs this and works entirely from
  // review_queue.json. If this directory is wrong, that one rare path
  // will show a clear error rather than silently using the wrong file:
  // see the sha256 integrity check in ensureFullDataset below, which
  // refuses to use a fetched file that doesn't match the exact dataset
  // the loaded queue was generated from.
  archeomapsDatasetDir: '../',
};

// ===========================================================================
// 2. DOM construction helpers — the ONLY way this file puts data on the
//    page. No innerHTML is ever used for content that originated from
//    review_queue.json, an imported file, or a curator note. (Section 12.)
// ===========================================================================

function h(tag, attrs) {
  var node = document.createElement(tag);
  attrs = attrs || {};
  Object.keys(attrs).forEach(function (key) {
    var val = attrs[key];
    if (val === null || val === undefined || val === false) return;
    if (key === 'class') node.className = val;
    else if (key === 'text') node.textContent = val;
    else if (key === 'html_UNSAFE_STATIC_ONLY') node.innerHTML = val; // only ever called with string literals in this file
    else if (key.indexOf('on') === 0 && typeof val === 'function') node.addEventListener(key.slice(2), val);
    else if (key === 'checked' || key === 'disabled' || key === 'selected') { if (val) node.setAttribute(key, key); node[key] = val; }
    else node.setAttribute(key, val);
  });
  for (var i = 2; i < arguments.length; i++) {
    appendChild(node, arguments[i]);
  }
  return node;
}

function appendChild(node, child) {
  if (child === null || child === undefined || child === false) return;
  if (Array.isArray(child)) { child.forEach(function (c) { appendChild(node, c); }); return; }
  if (typeof child === 'string' || typeof child === 'number') { node.appendChild(document.createTextNode(String(child))); return; }
  node.appendChild(child);
}

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function safeLink(url, label) {
  if (CuratorCore.isSafeHttpUrl(url)) {
    return h('a', { href: url, target: '_blank', rel: 'noopener noreferrer nofollow' }, label || url);
  }
  return h('span', { class: 'unsafe-url', text: label || String(url) + ' (link not rendered: not a valid http/https URL)' });
}

function fmtNum(n, digits) {
  if (typeof n !== 'number' || Number.isNaN(n)) return '\u2014';
  return digits === undefined ? String(n) : n.toFixed(digits);
}

function fmtYear(y) {
  if (typeof y !== 'number') return '\u2014';
  return y < 0 ? Math.abs(y) + ' BCE' : y + ' CE';
}

function fmtPct(n) { return typeof n === 'number' ? n + '%' : '\u2014'; }

// ===========================================================================
// 3. Application state — single source of truth, mirroring the same
//    "one state object, one re-render trigger, one eligibility predicate"
//    pattern used by the main ArcheoMaps app.
// ===========================================================================

var state = {
  queue: null,
  queueItemsById: {},
  knownArcheomapsIds: new Set(),
  snapshotCache: {}, // archeomapsId -> snapshot (embedded ones + any lazily fetched)
  fullDatasetPromise: null, // lazy-loaded only if needed

  decisionsByProposalId: {},
  lastSavedAt: null,

  filters: { decision: 'all', confidenceBand: 'all', distanceBand: 'all', serialOnly: false, completenessBand: 'all', search: '' },
  sortKey: 'queue-order',
  visibleItems: [],
  currentIndex: 0,

  editDraft: null, // { selectedArcheomapsId, note } while EDIT sub-form is open for the current item
  reasonDraft: {}, // { proposalId: { reason, note } } transient draft for REJECT/NEEDS_RESEARCH inline enrichment

  otherNamespaceWarning: null,

  // Incremented at the start of every render() call. Async callbacks
  // (currently: the lazy full-dataset fetch in renderComparison) capture
  // this value when they start and check it before touching the DOM when
  // they resolve — if a newer render has since superseded them, they
  // silently no-op instead of mutating a DOM tree render() has already
  // rebuilt. Guards against a real, reproducible race: two renders close
  // together in time (e.g. a duplicate 'change' event) can otherwise leave
  // a stale .then()/.catch() callback fighting the current render for the
  // same DOM nodes, which throws "node is no longer a child of this node".
  renderGeneration: 0,
};

function currentItem() {
  return state.visibleItems[state.currentIndex] || null;
}

// ===========================================================================
// 4. localStorage persistence
// ===========================================================================

function storageKey(suffix) {
  return CuratorCore.storageNamespace(state.queue.queueVersion, state.queue.queueFingerprint) + '::' + suffix;
}

function saveDecisionsToStorage() {
  try {
    localStorage.setItem(storageKey('decisions'), JSON.stringify(state.decisionsByProposalId));
    state.lastSavedAt = new Date().toISOString();
    localStorage.setItem(storageKey('lastSavedAt'), state.lastSavedAt);
    return true;
  } catch (e) {
    console.error('[curator] autosave failed', e);
    return false;
  }
}

function loadDecisionsFromStorage() {
  try {
    var raw = localStorage.getItem(storageKey('decisions'));
    state.decisionsByProposalId = raw ? JSON.parse(raw) : {};
    state.lastSavedAt = localStorage.getItem(storageKey('lastSavedAt'));
  } catch (e) {
    console.error('[curator] failed to load saved progress', e);
    state.decisionsByProposalId = {};
  }
}

/** Warn (without loading) if progress exists under a DIFFERENT queue namespace. */
function detectOtherNamespaceProgress() {
  var mine = CuratorCore.storageNamespace(state.queue.queueVersion, state.queue.queueFingerprint);
  var others = [];
  for (var i = 0; i < localStorage.length; i++) {
    var key = localStorage.key(i);
    if (key && key.indexOf('archeomaps-curator::') === 0 && key.indexOf(mine) !== 0) {
      var ns = key.split('::').slice(0, 2).join('::');
      if (others.indexOf(ns) === -1) others.push(ns);
    }
  }
  state.otherNamespaceWarning = others.length ? others : null;
}

function clearLocalProgress() {
  localStorage.removeItem(storageKey('decisions'));
  localStorage.removeItem(storageKey('lastSavedAt'));
  state.decisionsByProposalId = {};
  state.lastSavedAt = null;
  clear(el.importResult); // clear any stale import success/error banner from a prior, unrelated action
  applyFiltersAndSort();
  render();
}

function downloadDecisionsJson() {
  var exportObj = CuratorCore.buildExport(state.queue, state.decisionsByProposalId);
  var blob = new Blob([JSON.stringify(exportObj, null, 2) + '\n'], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = h('a', { href: url, download: 'review_decisions.json' });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===========================================================================
// 5. Data loading
// ===========================================================================

function loadQueue() {
  return fetch(DATA_CONFIG.queuePath)
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' loading ' + DATA_CONFIG.queuePath);
      return res.json();
    })
    .then(function (queue) {
      state.queue = queue;
      state.queueItemsById = {};
      state.snapshotCache = {};
      queue.items.forEach(function (item) {
        state.queueItemsById[item.proposalId] = item;
        item.evidence.candidates.forEach(function (c) {
          state.snapshotCache[c.archeomapsId] = c.archeomapsSnapshot;
        });
      });
      state.knownArcheomapsIds = new Set(queue.knownArcheomapsIds || []);
      loadDecisionsFromStorage();
      detectOtherNamespaceProgress();
      applyFiltersAndSort();
    });
}

/**
 * Lazily fetch the full authoritative dataset ONLY if a free-typed EDIT id
 * isn't already in the snapshot cache. Verifies the fetched file's sha256
 * against the exact hash review_queue.json recorded for the dataset it was
 * generated from (queue.inputs.dataset.sha256) — per spec §5, this tool
 * must never silently fall back to using a possibly-different dataset. If
 * the hash doesn't match (wrong file at the configured path, a stale
 * checkpoint, etc.), this rejects with a clear error instead of proceeding.
 */
function ensureFullDataset() {
  if (!state.fullDatasetPromise) {
    var datasetMeta = state.queue && state.queue.inputs && state.queue.inputs.dataset;
    if (!datasetMeta || !datasetMeta.path) {
      state.fullDatasetPromise = Promise.reject(new Error(
        'review_queue.json does not record inputs.dataset.path — cannot locate the authoritative dataset for this rare EDIT lookup.'));
      return state.fullDatasetPromise;
    }
    var url = DATA_CONFIG.archeomapsDatasetDir + datasetMeta.path;
    state.fullDatasetPromise = fetch(url)
      .then(function (res) {
        if (!res.ok) {
          throw new Error('HTTP ' + res.status + ' loading ' + url + '. Check DATA_CONFIG.archeomapsDatasetDir in curator.js matches where "' + datasetMeta.path + '" is actually deployed.');
        }
        return res.text();
      })
      .then(function (text) {
        if (!(window.crypto && window.crypto.subtle)) {
          // SubtleCrypto requires a secure context (https, or localhost for
          // local dev). Both deployment paths documented in README satisfy
          // this, so this branch should not normally be hit — but if it is,
          // fail closed rather than silently skipping the integrity check.
          throw new Error('Cannot verify dataset integrity: Web Crypto (SubtleCrypto) is unavailable in this context (page must be served over https or from localhost).');
        }
        return sha256HexBrowser(text).then(function (actualSha) {
          if (datasetMeta.sha256 && actualSha !== datasetMeta.sha256) {
            throw new Error(
              'Dataset integrity check failed: "' + url + '" does not match the checkpoint this queue was generated from ' +
              '(expected sha256 ' + datasetMeta.sha256 + ', got ' + actualSha + '). Refusing to use it — this tool never ' +
              'silently substitutes a different dataset. Update DATA_CONFIG.archeomapsDatasetDir in curator.js to point at the correct file.');
          }
          return JSON.parse(text);
        });
      });
  }
  return state.fullDatasetPromise;
}

function sha256HexBrowser(text) {
  var enc = new TextEncoder().encode(text);
  return window.crypto.subtle.digest('SHA-256', enc).then(function (digestBuf) {
    return Array.prototype.map.call(new Uint8Array(digestBuf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  });
}

function lookupOrComputeSnapshot(archeomapsId) {
  if (state.snapshotCache[archeomapsId]) return Promise.resolve(state.snapshotCache[archeomapsId]);
  if (!state.knownArcheomapsIds.has(archeomapsId)) return Promise.resolve(null);
  return ensureFullDataset().then(function (dataset) {
    var record = dataset.find(function (r) { return r.id === archeomapsId; });
    if (!record) return null;
    var snap = CuratorCore.buildArcheomapsSnapshot(record);
    state.snapshotCache[archeomapsId] = snap;
    return snap;
  });
  // Errors (HTTP failure, integrity-check failure) intentionally propagate
  // to the caller as a rejected promise; see renderComparison's .catch for
  // how this surfaces to the curator instead of failing silently.
}

// ===========================================================================
// 6. Derived state: filtering + sorting
// ===========================================================================

function applyFiltersAndSort() {
  var prevProposalId = currentItem() && currentItem().proposalId;
  var filtered = CuratorCore.filterItems(state.queue.items, state.decisionsByProposalId, state.filters);
  state.visibleItems = CuratorCore.sortItems(filtered, state.sortKey);
  if (prevProposalId) {
    var idx = state.visibleItems.findIndex(function (it) { return it.proposalId === prevProposalId; });
    state.currentIndex = idx !== -1 ? idx : 0;
  } else {
    state.currentIndex = 0;
  }
  if (state.currentIndex >= state.visibleItems.length) state.currentIndex = Math.max(0, state.visibleItems.length - 1);
}

// ===========================================================================
// 7. Decision actions
// ===========================================================================

function saveDecision(item, decisionValue, extra) {
  var decision = CuratorCore.buildDecision(Object.assign({
    proposalId: item.proposalId,
    queueVersion: item.queueVersion,
    proposalType: item.proposalType,
    source: item.source,
    externalId: item.externalId,
    targetArcheomapsId: item.targetArcheomapsId,
    decision: decisionValue,
    reviewedAt: new Date().toISOString(),
    evidenceVersion: item.evidenceVersion,
    proposalFingerprint: item.proposalFingerprint,
  }, extra || {}));

  var result = CuratorCore.validateDecision(decision, state.queueItemsById, state.knownArcheomapsIds);
  if (!result.valid) {
    alert('Could not save decision:\n' + result.errors.join('\n'));
    return false;
  }
  state.decisionsByProposalId[item.proposalId] = decision;
  saveDecisionsToStorage();
  return true;
}

function handleQuickDecision(decisionValue) {
  var item = currentItem();
  if (!item) return;
  if (decisionValue === 'EDIT') {
    state.editDraft = { selectedArcheomapsId: item.targetArcheomapsId, note: '' };
    render();
    return;
  }
  var existing = state.decisionsByProposalId[item.proposalId];
  var extra = {};
  if (existing && (decisionValue === 'REJECT' || decisionValue === 'NEEDS_RESEARCH')) {
    // Preserve any reason/note already entered for this item when just
    // toggling the headline decision.
    if (existing.rejectReason) extra.rejectReason = existing.rejectReason;
    if (existing.needsResearchReason) extra.needsResearchReason = existing.needsResearchReason;
    if (existing.curatorNote) extra.curatorNote = existing.curatorNote;
  }
  saveDecision(item, decisionValue, extra);
  state.editDraft = null;
  render();
}

function handleConfirmEdit() {
  var item = currentItem();
  if (!item || !state.editDraft) return;
  var id = (state.editDraft.selectedArcheomapsId || '').trim();
  var note = (state.editDraft.note || '').trim();
  if (!id) { alert('Select or enter an existing ArcheoMaps ID.'); return; }
  if (!state.knownArcheomapsIds.has(id)) { alert('"' + id + '" does not exist in the loaded dataset. New ArcheoMaps IDs cannot be created from this page.'); return; }
  if (!note) { alert('A curator note explaining the change is required for EDIT.'); return; }
  var ok = saveDecision(item, 'EDIT', { selectedArcheomapsId: id, curatorNote: note });
  if (ok) { state.editDraft = null; render(); }
}

function handleReasonNoteChange(item, field, value) {
  var existing = state.decisionsByProposalId[item.proposalId];
  if (!existing) return; // reason/note only editable once a REJECT/NEEDS_RESEARCH decision exists
  var extra = {};
  extra.rejectReason = field === 'rejectReason' ? value : existing.rejectReason;
  extra.needsResearchReason = field === 'needsResearchReason' ? value : existing.needsResearchReason;
  extra.curatorNote = field === 'curatorNote' ? value : existing.curatorNote;
  saveDecision(item, existing.decision, extra);
}

// ===========================================================================
// 8. Rendering
// ===========================================================================

var el = {}; // cached top-level DOM references, populated in init()

function render() {
  state.renderGeneration++;
  renderHeader();
  renderWarningBanner();
  renderFilterBar();
  var item = currentItem();
  if (!item) {
    el.reviewSections.classList.add('hidden');
    el.emptyState.classList.remove('hidden');
    return;
  }
  el.reviewSections.classList.remove('hidden');
  el.emptyState.classList.add('hidden');
  renderCaseNav();
  renderComparison(item);
  renderCandidateStrip(item);
  renderEvidencePanel(item);
  renderDecisionPanel(item);
}

function renderHeader() {
  var counts = CuratorCore.computeCounts(state.queue.items, state.decisionsByProposalId);
  clear(el.headerMeta);
  el.headerMeta.appendChild(h('span', { class: 'queue-meta' }, state.queue.queueVersion + ' \u00b7 ' + state.queue.itemCount + ' proposals'));
  el.headerMeta.appendChild(h('span', { class: 'progress-meta' },
    (state.queue.itemCount - counts.unreviewed) + ' of ' + state.queue.itemCount + ' reviewed'));

  clear(el.headerCounts);
  [
    ['APPROVE', 'approve'], ['EDIT', 'edit'], ['NEEDS_RESEARCH', 'research'],
    ['REJECT', 'reject'], ['DEFER', 'defer'], ['unreviewed', 'unreviewed'],
  ].forEach(function (pair) {
    var key = pair[0], cls = pair[1];
    el.headerCounts.appendChild(h('span', { class: 'count-badge count-' + cls },
      h('span', { class: 'count-num', text: String(counts[key]) }),
      h('span', { class: 'count-label', text: key === 'unreviewed' ? 'unreviewed' : key.replace('_', ' ').toLowerCase() })));
  });

  clear(el.autosaveStatus);
  el.autosaveStatus.appendChild(h('span', {}, state.lastSavedAt ? ('Autosaved ' + relativeTime(state.lastSavedAt)) : 'No local progress saved yet'));
}

function relativeTime(iso) {
  var diffMs = Date.now() - new Date(iso).getTime();
  var s = Math.round(diffMs / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return s + 's ago';
  var m = Math.round(s / 60);
  if (m < 60) return m + 'm ago';
  var hrs = Math.round(m / 60);
  return hrs + 'h ago';
}

function renderWarningBanner() {
  clear(el.warningBanner);
  if (state.otherNamespaceWarning) {
    el.warningBanner.appendChild(h('div', { class: 'banner banner-warning' },
      h('strong', {}, 'Heads up: '),
      'Local progress was found for a different queue version/fingerprint and was NOT loaded. ',
      'This queue: ' + state.queue.queueVersion + '.',
      h('button', { class: 'link-btn', onclick: function () { state.otherNamespaceWarning = null; renderWarningBanner(); } }, 'Dismiss')));
  }
}

function renderFilterBar() {
  // Built once; values kept in sync via direct element references cached on first render.
  if (el.filterBarBuilt) { syncFilterBarValues(); return; }
  el.filterBarBuilt = true;
  clear(el.filterBar);

  var search = h('input', {
    type: 'search', placeholder: 'Search UNESCO name, ArcheoMaps name, id, country, region\u2026', class: 'search-input',
    oninput: function (e) { state.filters.search = e.target.value; applyFiltersAndSort(); render(); },
  });
  el.searchInput = search;

  var decisionSelect = buildSelect('decision', [
    ['all', 'All cases'], ['unresolved', 'Unresolved only'],
    ['APPROVE', 'Approved'], ['EDIT', 'Edited'], ['NEEDS_RESEARCH', 'Needs research'], ['REJECT', 'Rejected'], ['DEFER', 'Deferred'],
  ], function (v) { state.filters.decision = v; applyFiltersAndSort(); render(); });

  var confidenceSelect = buildSelect('confidenceBand', [
    ['all', 'Any confidence'], ['high', 'High confidence'], ['moderate', 'Moderate confidence'], ['low', 'Low confidence'],
  ], function (v) { state.filters.confidenceBand = v; applyFiltersAndSort(); render(); });

  var distanceSelect = buildSelect('distanceBand', [
    ['all', 'Any distance'], ['very-close', 'Very close'], ['close', 'Close'], ['moderate', 'Moderate'], ['far', 'Far'], ['strong-conflict', 'Strong conflict'],
  ], function (v) { state.filters.distanceBand = v; applyFiltersAndSort(); render(); });

  var completenessSelect = buildSelect('completenessBand', [
    ['all', 'Any completeness'], ['green', 'Green (70\u2013100%)'], ['yellow', 'Yellow (50\u201369%)'], ['red', 'Red (0\u201349%)'], ['grey', 'Not computable'],
  ], function (v) { state.filters.completenessBand = v; applyFiltersAndSort(); render(); });

  var serialCheckbox = h('label', { class: 'checkbox-label' },
    h('input', { type: 'checkbox', onchange: function (e) { state.filters.serialOnly = e.target.checked; applyFiltersAndSort(); render(); } }),
    ' Serial/component only');
  el.serialCheckbox = serialCheckbox.querySelector('input');

  var sortSelect = buildSelectPlain('sortKey', [
    ['queue-order', 'Queue order'], ['confidence-desc', 'Confidence \u2193'], ['confidence-asc', 'Confidence \u2191'],
    ['distance-asc', 'Distance \u2191'], ['distance-desc', 'Distance \u2193'],
    ['completeness-desc', 'Completeness \u2193'], ['completeness-asc', 'Completeness \u2191'],
    ['unesco-name-asc', 'UNESCO name A\u2013Z'], ['archeomaps-name-asc', 'ArcheoMaps name A\u2013Z'],
  ], function (v) { state.sortKey = v; applyFiltersAndSort(); render(); });

  el.filterBar.appendChild(h('div', { class: 'filter-row' },
    search,
    h('label', { class: 'select-label' }, 'Decision', decisionSelect),
    h('label', { class: 'select-label' }, 'Confidence', confidenceSelect),
    h('label', { class: 'select-label' }, 'Distance', distanceSelect),
    h('label', { class: 'select-label' }, 'Completeness', completenessSelect),
    serialCheckbox,
    h('label', { class: 'select-label' }, 'Sort', sortSelect)));

  function buildSelect(name, options, onChange) {
    var sel = h('select', { onchange: function (e) { onChange(e.target.value); } });
    options.forEach(function (o) { sel.appendChild(h('option', { value: o[0] }, o[1])); });
    el[name + 'Select'] = sel;
    return sel;
  }
  function buildSelectPlain(name, options, onChange) { return buildSelect(name, options, onChange); }
}

function syncFilterBarValues() {
  if (el.searchInput) el.searchInput.value = state.filters.search;
  if (el.decisionSelect) el.decisionSelect.value = state.filters.decision;
  if (el.confidenceBandSelect) el.confidenceBandSelect.value = state.filters.confidenceBand;
  if (el.distanceBandSelect) el.distanceBandSelect.value = state.filters.distanceBand;
  if (el.completenessBandSelect) el.completenessBandSelect.value = state.filters.completenessBand;
  if (el.serialCheckbox) el.serialCheckbox.checked = state.filters.serialOnly;
  if (el.sortKeySelect) el.sortKeySelect.value = state.sortKey;
}

function renderCaseNav() {
  clear(el.caseNav);
  var total = state.visibleItems.length;
  var pos = total ? state.currentIndex + 1 : 0;

  var jumpInput = h('input', {
    type: 'number', min: 1, max: Math.max(1, total), value: String(pos), class: 'jump-input',
    onchange: function (e) {
      var n = parseInt(e.target.value, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= total) { state.currentIndex = n - 1; render(); }
    },
  });

  el.caseNav.appendChild(h('div', { class: 'case-nav-row' },
    h('button', { class: 'nav-btn', disabled: state.currentIndex <= 0, onclick: function () { goPrev(); } }, '\u2190 Previous'),
    h('span', { class: 'case-position' }, 'Case ', jumpInput, ' of ' + total + ' (current filter/sort)'),
    h('button', { class: 'nav-btn', disabled: state.currentIndex >= total - 1, onclick: function () { goNext(); } }, 'Next \u2192')));
}

function goPrev() { if (state.currentIndex > 0) { state.currentIndex--; state.editDraft = null; render(); } }
function goNext() { if (state.currentIndex < state.visibleItems.length - 1) { state.currentIndex++; state.editDraft = null; render(); } }

// --- Comparison: LEFT (ArcheoMaps) / RIGHT (UNESCO) -------------------------

function renderComparison(item) {
  clear(el.leftPanel);
  clear(el.rightPanel);
  var myGeneration = state.renderGeneration;

  var leftId = (state.editDraft && state.editDraft.selectedArcheomapsId) || item.targetArcheomapsId;
  var snap = state.snapshotCache[leftId];
  if (snap) {
    el.leftPanel.appendChild(renderArcheomapsSnapshot(snap, leftId !== item.targetArcheomapsId));
  } else {
    el.leftPanel.appendChild(h('p', { class: 'loading' }, 'Loading record\u2026'));
    lookupOrComputeSnapshot(leftId).then(function (s) {
      if (state.renderGeneration !== myGeneration) return; // a newer render has already taken over these DOM nodes
      if (currentItem() !== item) return; // navigated away (kept as an extra, redundant guard)
      if (!s) { clear(el.leftPanel); el.leftPanel.appendChild(h('p', { class: 'error-state' }, 'Could not resolve ArcheoMaps id "' + leftId + '".')); return; }
      clear(el.leftPanel);
      el.leftPanel.appendChild(renderArcheomapsSnapshot(s, leftId !== item.targetArcheomapsId));
    }).catch(function (err) {
      if (state.renderGeneration !== myGeneration) return;
      if (currentItem() !== item) return; // navigated away
      clear(el.leftPanel);
      el.leftPanel.appendChild(h('p', { class: 'error-state' }, 'Could not load "' + leftId + '": ' + err.message));
      console.error('[curator] lookupOrComputeSnapshot failed', err);
    });
  }

  el.rightPanel.appendChild(renderUnescoProposal(item));
}

function renderArcheomapsSnapshot(s, isAlternateSelection) {
  var frag = h('div', { class: 'panel-content' });
  frag.appendChild(h('div', { class: 'panel-title-row' },
    h('h3', {}, s.name || '(untitled record)'),
    isAlternateSelection ? h('span', { class: 'chip chip-alt' }, 'Selected alternate') : null));
  frag.appendChild(fieldRow('ArcheoMaps ID', s.id));
  frag.appendChild(fieldRow('Coordinates', fmtNum(s.lat, 4) + ', ' + fmtNum(s.lon, 4)));
  frag.appendChild(fieldRow('Chronology (year)', fmtYear(s.year)));
  frag.appendChild(fieldRow('Era', [s.eraLabel, s.era ? ('(' + s.era + ')') : null].filter(Boolean).join(' ')));
  frag.appendChild(fieldRow('Canonical type', s.canonicalType || emptyStatusLabel(s.workflowState)));
  frag.appendChild(fieldRow('Legacy type / category', [s.legacyType, s.category].filter(Boolean).join(' / ') || '\u2014'));
  if (s.secondaryType) frag.appendChild(fieldRow('Secondary type', s.secondaryType));
  frag.appendChild(chipsRow('Tags', s.tags));
  if (s.functions && s.functions.length) frag.appendChild(chipsRow('Functions', s.functions));
  frag.appendChild(fieldRow('Culture', s.culture || '\u2014'));
  if (s.partOf) frag.appendChild(fieldRow('Part of', s.partOf));
  frag.appendChild(fieldRow('Continent', s.continent || '\u2014'));
  frag.appendChild(h('div', { class: 'field-row' }, h('span', { class: 'field-label' }, 'Description'),
    h('p', { class: 'field-value description-text' }, s.description || '\u2014')));
  frag.appendChild(fieldRow('Image', s.image ? 'present' : 'none on file'));
  frag.appendChild(fieldRow('Source', s.source ? safeLink(s.source) : '\u2014'));
  frag.appendChild(fieldRow('Reliability', 'Not tracked in current dataset (no reliability field exists)'));
  if (s.dataQualityProvisional) {
    frag.appendChild(h('div', { class: 'field-row warn-row' }, h('span', { class: 'field-label' }, 'Data quality'),
      h('span', { class: 'field-value' }, s.dataQualityNote || 'Marked provisional by the migration pipeline.')));
  }
  if (s.alreadyLinkedUnesco) {
    frag.appendChild(h('div', { class: 'field-row warn-row' }, h('span', { class: 'field-label' }, '\u26a0 Already UNESCO-linked'),
      h('span', { class: 'field-value' }, 'This record already has UNESCO ID ' + (s.existingUnescoIdNo != null ? s.existingUnescoIdNo : '(unknown)') + ' attached — an APPROVE here would create a second link. Check carefully.')));
  }
  frag.appendChild(renderCompleteness(s.completeness));
  return frag;
}

function emptyStatusLabel(workflowState) {
  if (workflowState === 'research') return 'Not set \u2014 researched, insufficient evidence to classify';
  if (workflowState === 'review') return 'Not set \u2014 pending human review';
  return 'Not set';
}

function fieldRow(label, value) {
  return h('div', { class: 'field-row' }, h('span', { class: 'field-label' }, label), h('span', { class: 'field-value' }, (value === null || value === undefined || value === '') ? '\u2014' : value));
}

function chipsRow(label, items) {
  var wrap = h('div', { class: 'field-row' }, h('span', { class: 'field-label' }, label));
  var chipWrap = h('span', { class: 'chip-wrap' });
  if (!items || !items.length) chipWrap.appendChild(h('span', { class: 'field-value' }, '\u2014'));
  else items.forEach(function (t) { chipWrap.appendChild(h('span', { class: 'chip' }, t)); });
  wrap.appendChild(chipWrap);
  return wrap;
}

function renderCompleteness(c) {
  var wrap = h('div', { class: 'completeness-block' });
  wrap.appendChild(h('div', { class: 'completeness-header' },
    h('span', { class: 'completeness-dot band-' + c.band }),
    h('span', { class: 'completeness-pct' }, fmtPct(c.percentage) + ' complete'),
    c.provisional ? h('span', { class: 'chip chip-provisional', title: c.provisionalReason }, 'provisional') : null));
  var details = h('details', { class: 'completeness-details' }, h('summary', {}, 'Completeness breakdown'));
  var list = h('ul', { class: 'completeness-dims' });
  c.dimensions.forEach(function (d) {
    list.appendChild(h('li', { class: 'dim-' + d.status },
      h('span', { class: 'dim-label' }, d.label + (d.weight ? ' (' + d.weight + '%)' : ' (n/a)')),
      h('span', { class: 'dim-status' }, statusLabel(d.status))));
  });
  details.appendChild(list);
  if (c.provisional) details.appendChild(h('p', { class: 'provisional-note' }, c.provisionalReason));
  wrap.appendChild(details);
  return wrap;
}

function statusLabel(status) {
  return { populated: 'populated', researched_empty: 'researched \u2014 empty', not_yet_researched: 'not yet researched', unavailable: 'unavailable in this dataset' }[status] || status;
}

function renderUnescoProposal(item) {
  var u = item.unesco, p = item.proposal;
  var frag = h('div', { class: 'panel-content' });
  frag.appendChild(h('div', { class: 'panel-title-row' }, h('h3', {}, u.officialName || '(unnamed UNESCO property)')));
  frag.appendChild(fieldRow('UNESCO ID', u.unescoId));
  frag.appendChild(fieldRow('Category', u.category || '\u2014'));
  frag.appendChild(fieldRow('State(s) Party', (u.states || []).join(', ') || '\u2014'));
  frag.appendChild(fieldRow('UNESCO region', u.region || '\u2014'));
  var mainCoord = u.coordinates && u.coordinates.main;
  frag.appendChild(fieldRow('Coordinates', mainCoord ? (fmtNum(mainCoord.lat, 4) + ', ' + fmtNum(mainCoord.lon, 4)) : '\u2014'));
  if (u.coordinates && u.coordinates.note) frag.appendChild(h('p', { class: 'field-note' }, u.coordinates.note));

  frag.appendChild(h('div', { class: 'field-row inscription-row' }, h('span', { class: 'field-label' }, 'Inscription year'),
    h('span', { class: 'field-value' }, u.dateInscribedAvailable ? u.dateInscribed : h('em', {}, 'not available in this proposal (inscription metadata is populated only after identity is confirmed)'))));
  frag.appendChild(h('div', { class: 'field-row inscription-row' }, h('span', { class: 'field-label' }, 'Criteria'),
    h('span', { class: 'field-value' }, u.criteriaAvailable ? JSON.stringify(u.criteria) : h('em', {}, 'not available in this proposal'))));

  frag.appendChild(fieldRow('Components', u.componentsCount != null ? String(u.componentsCount) : '\u2014'));
  frag.appendChild(fieldRow('Transboundary', u.transboundary ? 'Yes' : 'No'));
  frag.appendChild(chipsRow('Secondary flags', u.secondaryFlags));

  frag.appendChild(h('hr'));
  frag.appendChild(fieldRow('Automated rule', p.automatedRuleId || '\u2014'));
  frag.appendChild(fieldRow('Proposal confidence', p.confidence != null ? (Math.round(p.confidence * 100) + '% (' + CuratorCore.confidenceBand(p.confidence) + ')') : '\u2014'));
  frag.appendChild(fieldRow('Requires human review', p.requiresHumanReview ? 'Yes' : 'No'));
  if (p.reviewReason) frag.appendChild(h('div', { class: 'field-row' }, h('span', { class: 'field-label' }, 'Review reason'), h('p', { class: 'field-value' }, p.reviewReason)));
  if (p.reasons && p.reasons.length) {
    frag.appendChild(h('div', { class: 'field-row' }, h('span', { class: 'field-label' }, 'Matching reasons'),
      h('ul', { class: 'reasons-list' }, p.reasons.map(function (r) { return h('li', {}, r); }))));
  }
  frag.appendChild(fieldRow('Official source', u.sourceUrl ? safeLink(u.sourceUrl, 'whc.unesco.org record') : '\u2014'));
  return frag;
}

// --- Candidate strip (top 3) --------------------------------------------

function renderCandidateStrip(item) {
  clear(el.candidateStrip);
  el.candidateStrip.appendChild(h('h4', { class: 'strip-title' }, 'Top 3 identity candidates'));
  var row = h('div', { class: 'candidate-row' });
  item.evidence.candidates.forEach(function (c) {
    var isSelectedLeft = ((state.editDraft && state.editDraft.selectedArcheomapsId) || item.targetArcheomapsId) === c.archeomapsId;
    row.appendChild(h('div', { class: 'candidate-card' + (isSelectedLeft ? ' candidate-active' : '') },
      h('div', { class: 'candidate-rank' }, '#' + c.rank),
      h('div', { class: 'candidate-name' }, c.archeomapsSnapshot.name || c.archeomapsId),
      h('div', { class: 'candidate-id' }, c.archeomapsId),
      h('div', { class: 'candidate-stats' },
        h('span', {}, 'score ' + fmtNum(c.score)),
        h('span', {}, 'name ' + fmtNum(c.nameScore, 2)),
        h('span', {}, fmtNum(c.distanceMeters) + ' m'),
        c.band ? h('span', { class: 'chip chip-band-' + c.band }, c.band) : null),
      c.isContainment ? h('span', { class: 'chip chip-info' }, 'containment match') : null,
      h('button', { class: 'small-btn', onclick: function () { previewCandidate(c.archeomapsId); } }, 'Preview as left panel'),
      h('button', { class: 'small-btn', onclick: function () { openEditWithCandidate(c.archeomapsId); } }, 'Use for EDIT')));
  });
  el.candidateStrip.appendChild(row);
}

function previewCandidate(archeomapsId) {
  var item = currentItem();
  if (!item) return;
  state.editDraft = state.editDraft || { selectedArcheomapsId: item.targetArcheomapsId, note: '' };
  state.editDraft.selectedArcheomapsId = archeomapsId;
  render();
}

function openEditWithCandidate(archeomapsId) {
  state.editDraft = { selectedArcheomapsId: archeomapsId, note: (state.editDraft && state.editDraft.note) || '' };
  render();
}

// --- Evidence panel -----------------------------------------------------

function renderEvidencePanel(item) {
  clear(el.evidencePanel);
  var ev = item.evidence;

  el.evidencePanel.appendChild(h('h4', {}, 'Evidence'));

  if (item.unesco.componentsCount > 1 || (item.unesco.secondaryFlags || []).indexOf('SERIAL_PROPERTY') !== -1) {
    el.evidencePanel.appendChild(h('p', { class: 'warning-note' },
      '\u26a0 Serial/component property (' + item.unesco.componentsCount + ' components). The coordinate shown is a single representative point \u2014 verify which component this ArcheoMaps record actually corresponds to.'));
  }
  var topBand = item.evidence.candidates[0] && item.evidence.candidates[0].band;
  if (topBand === 'far' || topBand === 'strong-conflict') {
    el.evidencePanel.appendChild(h('p', { class: 'warning-note' }, '\u26a0 Coordinate distance band is "' + topBand + '" \u2014 treat the identity match with extra scrutiny.'));
  }

  el.evidencePanel.appendChild(evidenceList('Qualifying claims (supporting)', ev.qualifyingClaims, function (c) {
    return h('div', { class: 'evidence-item evidence-support' },
      h('div', { class: 'evidence-phrase' }, '\u201c' + c.phrase + '\u201d \u00b7 ' + c.tier + ' \u00b7 ' + c.status),
      h('div', { class: 'evidence-field' }, 'field: ' + c.evidenceField),
      h('blockquote', { class: 'evidence-quote' }, c.evidenceText));
  }));

  el.evidencePanel.appendChild(evidenceList('Rejected claims', ev.rejectedClaims, function (c) {
    return h('div', { class: 'evidence-item evidence-rejected' },
      h('div', { class: 'evidence-phrase' }, '\u201c' + c.phrase + '\u201d \u00b7 ' + c.status),
      h('div', { class: 'evidence-field' }, c.rejectionReason),
      h('blockquote', { class: 'evidence-quote' }, c.sentence));
  }));

  el.evidencePanel.appendChild(evidenceList('Ambiguous concepts', ev.ambiguousConcepts, function (c) {
    return h('div', { class: 'evidence-item' }, c.phrase + ' \u2014 ' + c.tier);
  }));

  el.evidencePanel.appendChild(h('div', { class: 'evidence-stats' },
    h('span', {}, 'Independent evidence count: ' + (ev.independentEvidenceCount ?? '\u2014')),
    h('span', {}, 'Raw occurrences: ' + (ev.rawOccurrences ?? '\u2014')),
    h('span', {}, 'Description length: ' + (ev.totalDescriptionTextLength ?? '\u2014') + ' chars')));

  // Reusable structure for future non-identity proposal types (spec §6):
  // shown collapsed here since Phase 4.1A only populates IDENTITY_MATCH.
  var future = h('details', { class: 'future-evidence-shape' },
    h('summary', {}, 'Evidence panel shape for future proposal types (not populated this phase)'));
  future.appendChild(h('div', { class: 'future-evidence-template' },
    fieldRow('Current value', '[existing values]'),
    fieldRow('Proposed addition', 'e.g. Funerary'),
    fieldRow('Evidence', 'exact source sentence'),
    fieldRow('Source', 'e.g. Pleiades'),
    fieldRow('Evidence type', 'DIRECT / INFERRED'),
    fieldRow('Proposal confidence', 'High / Medium / Low')));
  el.evidencePanel.appendChild(future);
}

function evidenceList(title, items, renderItem) {
  var wrap = h('div', { class: 'evidence-group' });
  wrap.appendChild(h('h5', {}, title + ' (' + (items ? items.length : 0) + ')'));
  if (!items || !items.length) { wrap.appendChild(h('p', { class: 'empty-state-small' }, 'None recorded.')); return wrap; }
  items.forEach(function (it) { wrap.appendChild(renderItem(it)); });
  return wrap;
}

// --- Decision panel -------------------------------------------------------

function renderDecisionPanel(item) {
  clear(el.decisionPanel);
  var existing = state.decisionsByProposalId[item.proposalId];

  var btnRow = h('div', { class: 'decision-buttons' });
  [
    ['APPROVE', 'Approve'], ['EDIT', 'Edit'], ['NEEDS_RESEARCH', 'Needs research'], ['REJECT', 'Reject'], ['DEFER', 'Defer'],
  ].forEach(function (pair) {
    var val = pair[0], label = pair[1];
    var active = existing && existing.decision === val;
    btnRow.appendChild(h('button', {
      class: 'decision-btn decision-btn-' + val.toLowerCase() + (active ? ' active' : ''),
      onclick: function () { handleQuickDecision(val); },
    }, label));
  });
  el.decisionPanel.appendChild(btnRow);

  if (state.editDraft) {
    el.decisionPanel.appendChild(renderEditForm(item));
  } else if (existing && (existing.decision === 'REJECT' || existing.decision === 'NEEDS_RESEARCH')) {
    el.decisionPanel.appendChild(renderReasonForm(item, existing));
  }

  if (existing) {
    el.decisionPanel.appendChild(h('p', { class: 'decision-status' },
      'Saved: ' + existing.decision + ' at ' + new Date(existing.reviewedAt).toLocaleString()));
  }
}

function renderEditForm(item) {
  var wrap = h('div', { class: 'edit-form' });
  wrap.appendChild(h('h5', {}, 'Confirm EDIT target'));

  var radios = h('div', { class: 'edit-candidates' });
  var radioInputs = {};
  item.evidence.candidates.forEach(function (c) {
    var id = 'edit-cand-' + c.archeomapsId;
    var radio = h('input', {
      type: 'radio', name: 'editCandidate', id: id,
      checked: state.editDraft.selectedArcheomapsId === c.archeomapsId,
      onchange: function () {
        state.editDraft.selectedArcheomapsId = c.archeomapsId;
        render();
      },
    });
    radioInputs[c.archeomapsId] = radio;
    radios.appendChild(h('label', { class: 'radio-label', for: id }, radio, ' #' + c.rank + ' ' + (c.archeomapsSnapshot.name || c.archeomapsId) + ' (' + c.archeomapsId + ')'));
  });
  wrap.appendChild(radios);

  var errorMsg = h('p', { class: 'error-text hidden' });
  function setErrorText(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.toggle('hidden', !msg);
  }

  var isPreselectedCandidate = item.evidence.candidates.some(function (c) { return c.archeomapsId === state.editDraft.selectedArcheomapsId; });
  var otherId = h('input', {
    type: 'text', id: 'editOtherIdInput', placeholder: 'Or type another existing ArcheoMaps ID\u2026',
    value: isPreselectedCandidate ? '' : (state.editDraft.selectedArcheomapsId || ''),
    // Deliberately NOT triggering a full render() on every keystroke: doing
    // so would tear down and recreate this very input element (losing
    // keyboard focus and cursor position after every character). Instead
    // update state + this small error message in place.
    oninput: function (e) {
      var val = e.target.value.trim();
      state.editDraft.selectedArcheomapsId = val;
      Object.keys(radioInputs).forEach(function (id) { radioInputs[id].checked = false; });
      if (!val) { setErrorText(''); return; }
      if (!state.knownArcheomapsIds.has(val)) {
        setErrorText('"' + val + '" does not exist in the loaded dataset. A new ArcheoMaps ID cannot be created here.');
      } else {
        setErrorText('');
        // Warm the snapshot cache in the background so the left-panel
        // preview is ready if the curator switches to it; does not steal
        // focus. Failure here is non-fatal — if the dataset can't be
        // fetched/verified, the same error will surface clearly when the
        // curator actually confirms EDIT and the left panel tries to
        // render it (renderComparison's .catch). Swallow it here only to
        // avoid an unhandled-rejection console warning for a background
        // pre-warm the curator didn't explicitly ask to see yet.
        lookupOrComputeSnapshot(val).catch(function (err) {
          console.warn('[curator] background snapshot warm-up failed for ' + val + ':', err.message);
        });
      }
    },
    // On blur (focus has already left the field, so a full rebuild here
    // costs nothing): re-render so the left panel actually shows the
    // preview for whatever was typed — including surfacing an integrity-
    // check failure clearly, rather than leaving it silently warmed in
    // the cache with no visible feedback until Confirm EDIT.
    //
    // Deferred via setTimeout rather than called synchronously: rebuilding
    // this input's own DOM subtree from directly inside its 'change'
    // handler races the browser's own internal focus/blur bookkeeping for
    // the element dispatching the event (observed as a genuine
    // "removeChild: node is no longer a child" error in testing). Yielding
    // one tick lets the browser finish handling the event on the old DOM
    // before render() tears it down.
    onchange: function () { setTimeout(render, 0); },
  });
  wrap.appendChild(h('label', { class: 'select-label' }, 'Other ArcheoMaps ID', otherId));
  wrap.appendChild(errorMsg);
  if (state.editDraft.selectedArcheomapsId && !isPreselectedCandidate && !state.knownArcheomapsIds.has(state.editDraft.selectedArcheomapsId)) {
    setErrorText('"' + state.editDraft.selectedArcheomapsId + '" does not exist in the loaded dataset. A new ArcheoMaps ID cannot be created here.');
  }

  var note = h('textarea', {
    placeholder: 'Required: explain why this target is correct\u2026', rows: 3,
    oninput: function (e) { state.editDraft.note = e.target.value; },
  }, state.editDraft.note || '');
  wrap.appendChild(h('label', { class: 'select-label' }, 'Curator note (required)', note));

  wrap.appendChild(h('div', { class: 'edit-form-actions' },
    h('button', { class: 'confirm-btn', onclick: handleConfirmEdit }, 'Confirm EDIT'),
    h('button', { class: 'cancel-btn', onclick: function () { state.editDraft = null; render(); } }, 'Cancel')));

  return wrap;
}

function renderReasonForm(item, existing) {
  var wrap = h('div', { class: 'reason-form' });
  var reasons = existing.decision === 'REJECT' ? CuratorCore.REJECT_REASONS : CuratorCore.NEEDS_RESEARCH_REASONS;
  var field = existing.decision === 'REJECT' ? 'rejectReason' : 'needsResearchReason';

  var select = h('select', { onchange: function (e) { handleReasonNoteChange(item, field, e.target.value); } });
  select.appendChild(h('option', { value: '' }, '(no reason selected)'));
  reasons.forEach(function (r) { select.appendChild(h('option', { value: r.value, selected: existing[field] === r.value }, r.label)); });
  wrap.appendChild(h('label', { class: 'select-label' }, 'Reason (optional)', select));

  var note = h('textarea', { placeholder: 'Note (optional)\u2026', rows: 2 }, existing.curatorNote || '');
  note.addEventListener('blur', function (e) { handleReasonNoteChange(item, 'curatorNote', e.target.value); });
  wrap.appendChild(h('label', { class: 'select-label' }, 'Note', note));

  return wrap;
}

// ===========================================================================
// 9. Import
// ===========================================================================

function handleImportFile(file) {
  var reader = new FileReader();
  reader.onload = function () {
    var payload;
    try {
      payload = JSON.parse(reader.result);
    } catch (e) {
      showImportResult(false, ['Selected file is not valid JSON: ' + e.message]);
      return;
    }
    var result = CuratorCore.validateImportPayload(payload, state.queue, state.knownArcheomapsIds);
    if (!result.valid) {
      showImportResult(false, result.errors);
      return;
    }
    var conflicting = Object.keys(result.decisionsByProposalId).filter(function (id) {
      var cur = state.decisionsByProposalId[id];
      return cur && cur.decision !== result.decisionsByProposalId[id].decision;
    });
    var proceed = true;
    if (conflicting.length) {
      proceed = confirm(conflicting.length + ' imported decision(s) would overwrite a different locally-saved decision for the same proposal. Continue?');
    }
    if (!proceed) { showImportResult(false, ['Import cancelled by curator (conflict not confirmed).']); return; }
    state.decisionsByProposalId = Object.assign({}, state.decisionsByProposalId, result.decisionsByProposalId);
    saveDecisionsToStorage();
    applyFiltersAndSort();
    render();
    showImportResult(true, [Object.keys(result.decisionsByProposalId).length + ' decision(s) imported.']);
  };
  reader.readAsText(file);
}

function showImportResult(ok, messages) {
  clear(el.importResult);
  el.importResult.appendChild(h('div', { class: 'banner ' + (ok ? 'banner-success' : 'banner-error') },
    h('ul', {}, messages.map(function (m) { return h('li', {}, m); })),
    h('button', { class: 'link-btn', onclick: function () { clear(el.importResult); } }, 'Dismiss')));
}

// ===========================================================================
// 10. Keyboard shortcuts
// ===========================================================================

function isTypingTarget(target) {
  var tag = target && target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (target && target.isContentEditable);
}

document.addEventListener('keydown', function (e) {
  if (isTypingTarget(e.target)) return;
  if (!state.queue) return;
  switch (e.key) {
    case 'ArrowRight': case 'j': goNext(); break;
    case 'ArrowLeft': case 'k': goPrev(); break;
    case '1': handleQuickDecision('APPROVE'); break;
    case '2': handleQuickDecision('EDIT'); break;
    case '3': handleQuickDecision('NEEDS_RESEARCH'); break;
    case '4': handleQuickDecision('REJECT'); break;
    case '5': handleQuickDecision('DEFER'); break;
    case '/': e.preventDefault(); if (el.searchInput) el.searchInput.focus(); break;
    default: return;
  }
});

// ===========================================================================
// 11. Bootstrapping
// ===========================================================================

function cacheTopLevelRefs() {
  el.headerMeta = document.getElementById('headerMeta');
  el.headerCounts = document.getElementById('headerCounts');
  el.autosaveStatus = document.getElementById('autosaveStatus');
  el.warningBanner = document.getElementById('warningBanner');
  el.filterBar = document.getElementById('filterBar');
  el.caseBody = document.getElementById('caseBody');
  el.emptyState = document.getElementById('emptyState');
  el.reviewSections = document.getElementById('reviewSections');
  el.caseNav = document.getElementById('caseNav');
  el.leftPanel = document.getElementById('leftPanel');
  el.rightPanel = document.getElementById('rightPanel');
  el.candidateStrip = document.getElementById('candidateStrip');
  el.evidencePanel = document.getElementById('evidencePanel');
  el.decisionPanel = document.getElementById('decisionPanel');
  el.importResult = document.getElementById('importResult');
}

function wireToolbar() {
  document.getElementById('exportBtn').addEventListener('click', downloadDecisionsJson);
  document.getElementById('backupBtn').addEventListener('click', downloadDecisionsJson);
  document.getElementById('clearProgressBtn').addEventListener('click', function () {
    if (confirm('Clear all locally-saved curator progress for this queue? This cannot be undone (export a backup first if unsure).')) {
      clearLocalProgress();
    }
  });
  document.getElementById('importFileInput').addEventListener('change', function (e) {
    if (e.target.files && e.target.files[0]) handleImportFile(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('filterToggleBtn').addEventListener('click', function () {
    document.getElementById('filterBar').classList.toggle('collapsed');
  });
}

function init() {
  cacheTopLevelRefs();
  wireToolbar();
  loadQueue()
    .then(render)
    .catch(function (err) {
      console.error(err);
      el.reviewSections.classList.add('hidden');
      el.emptyState.classList.add('hidden');
      var errorBox = h('p', { class: 'error-state' }, 'Failed to load review_queue.json: ' + err.message);
      el.caseBody.insertBefore(errorBox, el.caseBody.firstChild);
    });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

// Exposed for manual debugging in the browser console only.
if (typeof window !== 'undefined') window.__curatorState = state;
