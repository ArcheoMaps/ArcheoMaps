/**
 * curator-core.js — ArcheoMaps Phase 4.1A curator workbench, pure logic.
 *
 * No DOM access anywhere in this file. Everything here is a pure function
 * over plain data, specifically so it can be unit-tested from Node without
 * a browser (see tests/test-curator-core.js) per spec §17's fallback:
 * "create deterministic unit tests for the pure JavaScript state,
 * validation, filtering and export/import functions."
 *
 * Loaded two ways:
 *   - In the browser: <script src="curator-core.js"></script> attaches
 *     window.CuratorCore.
 *   - In Node tests: const CuratorCore = require('./curator-core.js');
 *
 * Zero dependencies, vanilla JS only (ES2017-ish, no build step).
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = mod;
  } else {
    root.CuratorCore = mod;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Contract constants
  // ---------------------------------------------------------------------

  var DECISIONS = ['APPROVE', 'EDIT', 'NEEDS_RESEARCH', 'REJECT', 'DEFER'];

  var REJECT_REASONS = [
    { value: 'different-entity', label: 'Different entity' },
    { value: 'nearby-but-not-identical', label: 'Nearby but not identical' },
    { value: 'parent-vs-component-mismatch', label: 'Parent vs. component mismatch' },
    { value: 'name-coincidence', label: 'Name coincidence' },
    { value: 'incorrect-coordinates', label: 'Incorrect coordinates' },
    { value: 'other', label: 'Other' },
  ];

  var NEEDS_RESEARCH_REASONS = [
    { value: 'insufficient-identity-evidence', label: 'Insufficient identity evidence' },
    { value: 'chronology-unclear', label: 'Chronology unclear' },
    { value: 'coordinates-unclear', label: 'Coordinates unclear' },
    { value: 'parent-component-ambiguity', label: 'Parent/component ambiguity' },
    { value: 'conflicting-sources', label: 'Conflicting sources' },
    { value: 'other', label: 'Other' },
  ];

  var COMPLETENESS_BAND_COLOR = { green: '#2e7d32', yellow: '#b8860b', red: '#b3261e', grey: '#6b6b6b' };

  var DECISION_SCHEMA_VERSION = 'phase4.1a-review-decision-v1';

  // ---------------------------------------------------------------------
  // ReviewDecision / export contract constants (v1.1)
  //
  // These mirror curator/schemas/review-decisions.schema.json exactly.
  // Having a schema FILE is not enough on its own — see validateDecision
  // and validateImportPayload below, which are the runtime enforcement of
  // this same contract, shared by the browser import path and the
  // command-line validator so the two can never drift apart.
  // ---------------------------------------------------------------------

  var REVIEW_DECISION_REQUIRED_STRING_FIELDS = [
    'proposalId', 'queueVersion', 'proposalType', 'source', 'externalId',
    'targetArcheomapsId', 'evidenceVersion', 'proposalFingerprint',
  ];

  // Fields cross-checked against the matching queue item's own values.
  // proposalFingerprint is checked separately (format + match, see below).
  var REVIEW_DECISION_CROSS_CHECK_FIELDS = [
    'queueVersion', 'proposalType', 'source', 'externalId', 'targetArcheomapsId', 'evidenceVersion',
  ];

  var REVIEW_DECISION_ALLOWED_KEYS = new Set([
    'proposalId', 'queueVersion', 'proposalType', 'source', 'externalId',
    'targetArcheomapsId', 'decision', 'selectedArcheomapsId', 'editedValues',
    'curatorNote', 'reviewedAt', 'evidenceVersion', 'proposalFingerprint',
    'blacklistExactProposal', 'rejectReason', 'needsResearchReason',
  ]);

  var EXPORT_ALLOWED_KEYS = new Set([
    'schemaVersion', 'queueVersion', 'queueFingerprint', 'exportedAt',
    'decisionCounts', 'decisions', 'unreviewedProposalIds',
  ]);

  var DECISION_COUNTS_REQUIRED_KEYS = ['APPROVE', 'EDIT', 'NEEDS_RESEARCH', 'REJECT', 'DEFER', 'total', 'unreviewed'];

  // sha256 hex: exactly 64 lowercase hex characters.
  var SHA256_HEX_RE = /^[0-9a-f]{64}$/;
  // Reasonably strict ISO 8601 date-time (the subset JSON Schema's
  // "date-time" format and JS's own Date parser both accept): a full
  // calendar date, 'T', a full time, optional fractional seconds, and a
  // mandatory 'Z' or numeric UTC offset. Rejects bare dates, missing
  // timezone, and other near-misses that Date.parse() alone is too
  // permissive about.
  var ISO_DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/;

  function isValidIsoDateTime(v) {
    if (typeof v !== 'string' || !ISO_DATETIME_RE.test(v)) return false;
    var t = Date.parse(v);
    return !Number.isNaN(t);
  }

  function isValidFingerprintFormat(v) {
    return typeof v === 'string' && SHA256_HEX_RE.test(v);
  }

  // ---------------------------------------------------------------------
  // Completeness formula (Phase 4.1A spec §7)
  //
  // SINGLE SOURCE OF TRUTH: this is the only place the completeness
  // formula is implemented. scripts/generate-review-queue.js uses it
  // (via require) to pre-compute completeness for every snapshot embedded
  // in review_queue.json. curator.js uses it only for the rare on-demand
  // case where a curator EDITs a decision to point at an ArcheoMaps id
  // that wasn't one of the pre-embedded top-3 candidates (see
  // curator.js `lookupOrComputeSnapshot`) and has to compute a snapshot
  // for a freshly-fetched record in the browser. Both call sites get
  // identical results because there is only one implementation.
  //
  // Weights and status rules are declared here, in ONE place, specifically
  // so they can be changed later without touching the scoring logic. Every
  // dimension below is grounded in a field that actually exists in
  // archeomaps_data_unesco_enriched_corrected.json — nothing here scores a
  // field the dataset doesn't have.
  //
  // Fields the Phase 4.1A spec suggested but which DO NOT exist anywhere in
  // the current 2,103-record dataset (verified by full-field survey):
  //   - `reliability`            (no such field at all)
  //   - `phases` / historical phases
  //   - `politicalEntities` (plural, array)
  //   - `cultures` (plural, array) — only a singular `culture` scalar exists
  //   - `sources` (plural, array)  — only a singular `source` scalar exists
  //   - `function` (plural, array) — exists on 2/2103 records only
  // These are represented below as either folded into the nearest real
  // field (cultures/political-entities -> the singular `culture` field) or
  // marked `unavailable` with weight 0 (phases). This is documented again
  // in the curator's completeness help panel, not just here.
  // ---------------------------------------------------------------------

  var COMPLETENESS_CONFIG = {
    formulaVersion: 'phase4.1a-completeness-v1',
    dimensions: [
      { key: 'identityName', label: 'Identity / name', weight: 5 },
      { key: 'coordinates', label: 'Coordinates', weight: 5 },
      { key: 'canonicalType', label: 'Canonical type', weight: 20 },
      { key: 'chronology', label: 'Chronology (year)', weight: 15 },
      { key: 'sources', label: 'Sources', weight: 10 },
      { key: 'description', label: 'Description', weight: 20 },
      { key: 'tagsFunctions', label: 'Tags / functions', weight: 10 },
      { key: 'culture', label: 'Culture / political entity', weight: 10 },
      { key: 'images', label: 'Images', weight: 5 },
      { key: 'phases', label: 'Historical phases', weight: 0 }, // always 'unavailable'
    ],
    bands: [
      { min: 70, max: 100, color: 'green' },
      { min: 50, max: 69, color: 'yellow' },
      { min: 0, max: 49, color: 'red' },
    ],
    provisionalReason:
      'Only the canonical-type dimension can distinguish "researched, ' +
      'found insufficient" (workflow.type.state = research) from "pending ' +
      'human review" (workflow.type.state = review) from "populated". ' +
      'Chronology, sources, description, tags/functions, culture and images ' +
      'have no equivalent workflow tracking in the current schema, so an ' +
      'empty value there is reported as "not yet researched" even though ' +
      'some of those fields may in fact have been checked and be genuinely ' +
      'empty. Historical phases and a plural political-entities field do ' +
      'not exist anywhere in the current dataset and are excluded from ' +
      'scoring (shown as unavailable, weight 0).',
  };

  var BARE_URL_RE = /^https?:\/\/\S+$/i;

  function isNonEmptyString(v) { return typeof v === 'string' && v.trim().length > 0; }

  function computeCompleteness(record) {
    var dims = [];
    function push(key, label, weight, status) { dims.push({ key: key, label: label, weight: weight, status: status }); }

    push('identityName', 'Identity / name', 5, isNonEmptyString(record.n) ? 'populated' : 'not_yet_researched');
    push('coordinates', 'Coordinates', 5, (typeof record.lat === 'number' && typeof record.lon === 'number') ? 'populated' : 'not_yet_researched');

    var ctStatus;
    if (record.canonicalType) {
      ctStatus = 'populated';
    } else {
      var wfState = record.workflow && record.workflow.type && record.workflow.type.state;
      if (wfState === 'research') ctStatus = 'researched_empty';
      else ctStatus = 'not_yet_researched';
    }
    push('canonicalType', 'Canonical type', 20, ctStatus);

    push('chronology', 'Chronology (year)', 15, (typeof record.year === 'number') ? 'populated' : 'not_yet_researched');
    push('sources', 'Sources', 10, isNonEmptyString(record.source) ? 'populated' : 'not_yet_researched');

    var hasSubstantiveText = isNonEmptyString(record.text) && !BARE_URL_RE.test(record.text.trim());
    push('description', 'Description', 20, hasSubstantiveText ? 'populated' : 'not_yet_researched');

    var hasTagsOrFunctions = (Array.isArray(record.tags) && record.tags.length > 0) ||
      (Array.isArray(record.function) && record.function.length > 0);
    push('tagsFunctions', 'Tags / functions', 10, hasTagsOrFunctions ? 'populated' : 'not_yet_researched');

    push('culture', 'Culture / political entity', 10, isNonEmptyString(record.culture) ? 'populated' : 'not_yet_researched');
    push('images', 'Images', 5, isNonEmptyString(record.img) ? 'populated' : 'not_yet_researched');
    push('phases', 'Historical phases', 0, 'unavailable');

    var scored = dims.filter(function (d) { return d.status !== 'unavailable'; });
    var denom = scored.reduce(function (s, d) { return s + d.weight; }, 0);
    var numer = scored.reduce(function (s, d) { return s + (d.status === 'populated' ? d.weight : 0); }, 0);
    var percentage = denom > 0 ? Math.round((numer / denom) * 100) : null;

    var band = 'grey';
    if (percentage !== null) {
      var match = COMPLETENESS_CONFIG.bands.find(function (b) { return percentage >= b.min && percentage <= b.max; });
      band = match ? match.color : 'grey';
    }

    return {
      formulaVersion: COMPLETENESS_CONFIG.formulaVersion,
      percentage: percentage,
      band: band,
      provisional: true,
      provisionalReason: COMPLETENESS_CONFIG.provisionalReason,
      dimensions: dims,
    };
  }

  function buildArcheomapsSnapshot(record) {
    var wf = record.workflow && record.workflow.type;
    return {
      id: record.id,
      name: record.n,
      lat: record.lat,
      lon: record.lon,
      year: typeof record.year === 'number' ? record.year : null,
      era: record.era || null,
      eraLabel: record.eraLabel || null,
      culture: record.culture || null,
      canonicalType: record.canonicalType || null,
      legacyType: record.type || null,
      secondaryType: record.secondaryType || null,
      category: record.category || null,
      tags: Array.isArray(record.tags) ? record.tags.slice() : [],
      functions: Array.isArray(record.function) ? record.function.slice() : [],
      partOf: record.partOf || null,
      description: record.text || null,
      image: record.img || null,
      source: record.source || null,
      sourceType: record.sourceType || null,
      continent: record.continent || null,
      workflowState: wf ? wf.state : null,
      dataQualityProvisional: !!(record.dataQuality && record.dataQuality.migrationProvisional),
      dataQualityNote: (record.dataQuality && record.dataQuality.migrationProvisionalNote) || null,
      alreadyLinkedUnesco: record.unesco === true,
      existingUnescoIdNo: (typeof record.unescoIdNo === 'number') ? record.unescoIdNo : null,
      heritageUnesco: record.heritage && record.heritage.unesco ? record.heritage.unesco : null,
      completeness: computeCompleteness(record),
    };
  }

  // ---------------------------------------------------------------------
  // Small pure helpers
  // ---------------------------------------------------------------------

  function isPlainObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

  function confidenceBand(confidence) {
    if (typeof confidence !== 'number') return 'unknown';
    if (confidence >= 0.75) return 'high';
    if (confidence >= 0.5) return 'moderate';
    return 'low';
  }

  function isSafeHttpUrl(url) {
    if (typeof url !== 'string') return false;
    try {
      // Browsers: use URL; Node: URL is also global since Node 10+.
      var u = new URL(url);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (e) {
      return false;
    }
  }

  function storageNamespace(queueVersion, queueFingerprint) {
    return 'archeomaps-curator::' + queueVersion + '::' + String(queueFingerprint).slice(0, 16);
  }

  // ---------------------------------------------------------------------
  // Filtering
  // ---------------------------------------------------------------------

  /**
   * filters: {
   *   decision: 'all' | 'unresolved' | one of DECISIONS,
   *   confidenceBand: 'all' | 'high' | 'moderate' | 'low',
   *   distanceBand: 'all' | 'very-close' | 'close' | 'moderate' | 'far' | 'strong-conflict',
   *   serialOnly: boolean,
   *   completenessBand: 'all' | 'green' | 'yellow' | 'red' | 'grey',
   *   search: string
   * }
   */
  function itemMatchesFilters(item, decision, filters) {
    filters = filters || {};

    if (filters.decision && filters.decision !== 'all') {
      if (filters.decision === 'unresolved') {
        if (decision) return false;
      } else if (!decision || decision.decision !== filters.decision) {
        return false;
      }
    }

    if (filters.confidenceBand && filters.confidenceBand !== 'all') {
      if (confidenceBand(item.proposal && item.proposal.confidence) !== filters.confidenceBand) return false;
    }

    if (filters.distanceBand && filters.distanceBand !== 'all') {
      var top = item.evidence && item.evidence.candidates && item.evidence.candidates[0];
      if (!top || top.band !== filters.distanceBand) return false;
    }

    if (filters.serialOnly) {
      var flags = (item.unesco && item.unesco.secondaryFlags) || [];
      var isSerial = (item.unesco && item.unesco.componentsCount > 1) || flags.indexOf('SERIAL_PROPERTY') !== -1;
      if (!isSerial) return false;
    }

    if (filters.completenessBand && filters.completenessBand !== 'all') {
      var top2 = item.evidence && item.evidence.candidates && item.evidence.candidates[0];
      var band = top2 && top2.archeomapsSnapshot && top2.archeomapsSnapshot.completeness && top2.archeomapsSnapshot.completeness.band;
      if (band !== filters.completenessBand) return false;
    }

    if (filters.search && filters.search.trim()) {
      if (!matchesSearch(item, filters.search)) return false;
    }

    return true;
  }

  function matchesSearch(item, query) {
    var q = query.trim().toLowerCase();
    if (!q) return true;
    var candidates = (item.evidence && item.evidence.candidates) || [];
    var haystackParts = [
      item.unesco && item.unesco.officialName,
      item.unesco && item.unesco.unescoId,
      item.unesco && item.unesco.region,
    ].concat((item.unesco && item.unesco.states) || []);
    candidates.forEach(function (c) {
      haystackParts.push(c.archeomapsId);
      if (c.archeomapsSnapshot) haystackParts.push(c.archeomapsSnapshot.name);
    });
    var haystack = haystackParts.filter(Boolean).join(' \u0001 ').toLowerCase();
    return haystack.indexOf(q) !== -1;
  }

  function filterItems(items, decisionsByProposalId, filters) {
    decisionsByProposalId = decisionsByProposalId || {};
    return items.filter(function (item) {
      return itemMatchesFilters(item, decisionsByProposalId[item.proposalId], filters);
    });
  }

  // ---------------------------------------------------------------------
  // Sorting (deterministic; every comparator has a stable tie-breaker on
  // proposalId so re-sorting never reorders equal-key items arbitrarily)
  // ---------------------------------------------------------------------

  function topCandidate(item) {
    return item.evidence && item.evidence.candidates && item.evidence.candidates[0];
  }

  var SORTERS = {
    // 'queue-order' must be a no-op: review_queue.json's item array order IS
    // the canonical deterministic order (numeric unescoId ascending, fixed
    // by generate-review-queue.js). Re-sorting by proposalId string here
    // would silently scramble it — e.g. "...unesco::1018" sorts before
    // "...unesco::4" lexicographically, which is not the intended order.
    'queue-order': function (a, b) { return 0; },
    'confidence-desc': function (a, b) { return cmpNum(b.proposal && b.proposal.confidence, a.proposal && a.proposal.confidence) || cmpStr(a.proposalId, b.proposalId); },
    'confidence-asc': function (a, b) { return cmpNum(a.proposal && a.proposal.confidence, b.proposal && b.proposal.confidence) || cmpStr(a.proposalId, b.proposalId); },
    'distance-asc': function (a, b) { var ta = topCandidate(a), tb = topCandidate(b); return cmpNum(ta && ta.distanceMeters, tb && tb.distanceMeters) || cmpStr(a.proposalId, b.proposalId); },
    'distance-desc': function (a, b) { var ta = topCandidate(a), tb = topCandidate(b); return cmpNum(tb && tb.distanceMeters, ta && ta.distanceMeters) || cmpStr(a.proposalId, b.proposalId); },
    'completeness-asc': function (a, b) { return cmpNum(completenessOf(a), completenessOf(b)) || cmpStr(a.proposalId, b.proposalId); },
    'completeness-desc': function (a, b) { return cmpNum(completenessOf(b), completenessOf(a)) || cmpStr(a.proposalId, b.proposalId); },
    'unesco-name-asc': function (a, b) { return cmpStr((a.unesco && a.unesco.officialName) || '', (b.unesco && b.unesco.officialName) || '') || cmpStr(a.proposalId, b.proposalId); },
    'archeomaps-name-asc': function (a, b) { var ta = topCandidate(a), tb = topCandidate(b); return cmpStr((ta && ta.archeomapsSnapshot && ta.archeomapsSnapshot.name) || '', (tb && tb.archeomapsSnapshot && tb.archeomapsSnapshot.name) || '') || cmpStr(a.proposalId, b.proposalId); },
  };

  function completenessOf(item) {
    var t = topCandidate(item);
    var pct = t && t.archeomapsSnapshot && t.archeomapsSnapshot.completeness && t.archeomapsSnapshot.completeness.percentage;
    return typeof pct === 'number' ? pct : -1;
  }

  function cmpStr(a, b) { a = a || ''; b = b || ''; return a < b ? -1 : a > b ? 1 : 0; }
  function cmpNum(a, b) {
    var na = typeof a === 'number' ? a : -Infinity;
    var nb = typeof b === 'number' ? b : -Infinity;
    return na - nb;
  }

  function sortItems(items, sortKey) {
    var sorter = SORTERS[sortKey] || SORTERS['queue-order'];
    return items.slice().sort(sorter);
  }

  // ---------------------------------------------------------------------
  // Counts / progress
  // ---------------------------------------------------------------------

  function computeCounts(items, decisionsByProposalId) {
    decisionsByProposalId = decisionsByProposalId || {};
    var counts = { APPROVE: 0, EDIT: 0, NEEDS_RESEARCH: 0, REJECT: 0, DEFER: 0, total: items.length, unreviewed: 0 };
    items.forEach(function (item) {
      var d = decisionsByProposalId[item.proposalId];
      if (d && DECISIONS.indexOf(d.decision) !== -1) counts[d.decision]++;
      else counts.unreviewed++;
    });
    return counts;
  }

  // ---------------------------------------------------------------------
  // Decision validation (used both when saving a single decision in the UI
  // and when validating an imported/exported file)
  // ---------------------------------------------------------------------

  /**
   * validKnownArcheomapsIds: a Set or array of ArcheoMaps ids that exist in
   * the loaded dataset/queue snapshots, used to validate EDIT targets.
   *
   * v1.1: enforces the FULL ReviewDecision contract (all fields declared
   * required by review-decisions.schema.json), not just proposalId +
   * decision + EDIT-specific fields. In particular:
   *   - every required field must be PRESENT (missing = failure)
   *   - proposalFingerprint must be present AND correctly formatted AND
   *     match the queue item (missing, malformed, or mismatched — each is
   *     independently a failure; there is no "only check if present" path)
   *   - reviewedAt must be a real ISO 8601 date-time
   *   - queueVersion/proposalType/source/externalId/targetArcheomapsId/
   *     evidenceVersion must each match the corresponding queue item field
   *   - unknown top-level properties on the decision object are rejected
   */
  function validateDecision(decision, queueItemsById, validKnownArcheomapsIds) {
    var errors = [];
    var idSet = validKnownArcheomapsIds instanceof Set ? validKnownArcheomapsIds : new Set(validKnownArcheomapsIds || []);

    if (!decision || typeof decision !== 'object' || Array.isArray(decision)) {
      return { valid: false, errors: ['Decision is not an object.'] };
    }

    // Unknown properties (whitelist-based; runs independently of every
    // other check below so it never gets short-circuited).
    Object.keys(decision).forEach(function (k) {
      if (!REVIEW_DECISION_ALLOWED_KEYS.has(k)) errors.push('Unknown decision property "' + k + '".');
    });

    // Required-field PRESENCE (every field the schema marks required,
    // not just proposalId). A field that's missing is reported here and
    // is NOT also reported by the cross-check below (that only runs for
    // fields that ARE present, to avoid redundant noise for one root cause).
    REVIEW_DECISION_REQUIRED_STRING_FIELDS.forEach(function (f) {
      if (typeof decision[f] !== 'string' || decision[f].length === 0) {
        errors.push('Missing or invalid required field "' + f + '".');
      }
    });

    if (DECISIONS.indexOf(decision.decision) === -1) {
      errors.push('decision must be one of ' + DECISIONS.join(', ') + '.');
    }

    if (!isValidIsoDateTime(decision.reviewedAt)) {
      errors.push('reviewedAt is missing or not a valid ISO 8601 date-time string.');
    }

    // proposalFingerprint format: independent of, and in addition to, the
    // required-field presence check above. Three distinct failure modes,
    // each on its own: missing (caught above), malformed (caught here),
    // mismatched (caught in the cross-check block below) — never silently
    // conflated via a single `if (fp && mismatch)` guard.
    if (typeof decision.proposalFingerprint === 'string' && decision.proposalFingerprint.length > 0 && !isValidFingerprintFormat(decision.proposalFingerprint)) {
      errors.push('proposalFingerprint is malformed (must be a 64-character lowercase sha256 hex string).');
    }

    var queueItem = (typeof decision.proposalId === 'string' && decision.proposalId.length > 0) ? queueItemsById[decision.proposalId] : null;
    if (typeof decision.proposalId === 'string' && decision.proposalId.length > 0 && !queueItem) {
      errors.push('proposalId "' + decision.proposalId + '" is not a known queue item.');
    }

    if (queueItem) {
      REVIEW_DECISION_CROSS_CHECK_FIELDS.forEach(function (f) {
        if (typeof decision[f] === 'string' && decision[f].length > 0 && decision[f] !== queueItem[f]) {
          errors.push('"' + f + '" ("' + decision[f] + '") does not match this proposal\'s queue item ("' + queueItem[f] + '").');
        }
      });
      if (isValidFingerprintFormat(decision.proposalFingerprint) && decision.proposalFingerprint !== queueItem.proposalFingerprint) {
        errors.push('proposalFingerprint does not match the current queue item — the underlying proposal changed since this decision was made, or the fingerprint is stale/incorrect.');
      }
    }

    if (decision.decision === 'EDIT') {
      if (!decision.selectedArcheomapsId) {
        errors.push('EDIT requires selectedArcheomapsId.');
      } else if (!idSet.has(decision.selectedArcheomapsId)) {
        errors.push('selectedArcheomapsId "' + decision.selectedArcheomapsId + '" does not exist in the loaded dataset.');
      }
      if (!decision.curatorNote || !decision.curatorNote.trim()) {
        errors.push('EDIT requires a curatorNote explaining the change.');
      }
    }

    if (decision.rejectReason !== undefined && decision.rejectReason !== null && !REJECT_REASONS.some(function (r) { return r.value === decision.rejectReason; })) {
      errors.push('Unrecognized rejectReason "' + decision.rejectReason + '".');
    }
    if (decision.needsResearchReason !== undefined && decision.needsResearchReason !== null && !NEEDS_RESEARCH_REASONS.some(function (r) { return r.value === decision.needsResearchReason; })) {
      errors.push('Unrecognized needsResearchReason "' + decision.needsResearchReason + '".');
    }

    if (decision.blacklistExactProposal !== undefined && typeof decision.blacklistExactProposal !== 'boolean') {
      errors.push('blacklistExactProposal must be a boolean if present.');
    }

    // Guard against accidental patch/application-shaped fields sneaking
    // into a decision object (spec §11: "no unknown fields that imply
    // patch/application operations"). Retained as an EXPLICIT additional
    // safety layer even though the unknown-property whitelist above would
    // already catch these (defense in depth, not a substitute for it).
    var FORBIDDEN_KEYS = ['unescoIdNo', 'apply', 'patch', 'writeTo', 'commit', 'mutate'];
    Object.keys(decision).forEach(function (k) {
      if (FORBIDDEN_KEYS.indexOf(k) !== -1) errors.push('Decision contains disallowed patch-shaped field "' + k + '".');
    });

    return { valid: errors.length === 0, errors: errors };
  }

  function buildDecision(fields) {
    return Object.assign({
      queueVersion: null,
      proposalType: null,
      source: null,
      externalId: null,
      targetArcheomapsId: null,
      decision: null,
      selectedArcheomapsId: null,
      editedValues: null,
      curatorNote: '',
      reviewedAt: null,
      evidenceVersion: null,
      proposalFingerprint: null,
      blacklistExactProposal: false,
    }, fields);
  }

  // ---------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------

  function buildExport(queue, decisionsByProposalId, nowIso) {
    var items = queue.items || [];
    var decisions = [];
    var unreviewed = [];
    items.forEach(function (item) {
      var d = decisionsByProposalId[item.proposalId];
      if (d) decisions.push(d);
      else unreviewed.push(item.proposalId);
    });
    return {
      schemaVersion: DECISION_SCHEMA_VERSION,
      queueVersion: queue.queueVersion,
      queueFingerprint: queue.queueFingerprint,
      exportedAt: nowIso || new Date().toISOString(),
      decisionCounts: computeCounts(items, decisionsByProposalId),
      decisions: decisions,
      unreviewedProposalIds: unreviewed,
    };
  }

  // ---------------------------------------------------------------------
  // Import validation
  // ---------------------------------------------------------------------

  /**
   * Validates an imported review_decisions.json payload against the
   * currently-loaded queue. Returns { valid, errors, decisionsByProposalId }.
   * Never partially imports: if errors is non-empty, decisionsByProposalId is null.
   *
   * v1.1: validates the ENTIRE export contract (not just queueVersion +
   * decisions-is-an-array), matching review-decisions.schema.json exactly:
   * schemaVersion, queueFingerprint format+match, exportedAt, decisionCounts
   * shape, unreviewedProposalIds shape/dedup/membership, the decided+
   * unreviewed partition accounting for every queue item exactly once, and
   * declared counts vs. recomputed counts — in addition to full per-decision
   * validation via validateDecision (see above).
   */
  function validateImportPayload(payload, queue, validKnownArcheomapsIds) {
    var errors = [];
    if (!isPlainObject(payload)) return { valid: false, errors: ['Imported file is not a JSON object.'], decisionsByProposalId: null };

    Object.keys(payload).forEach(function (k) {
      if (!EXPORT_ALLOWED_KEYS.has(k)) errors.push('Unknown top-level export property "' + k + '".');
    });

    if (payload.schemaVersion !== DECISION_SCHEMA_VERSION) {
      errors.push('Unsupported schemaVersion "' + payload.schemaVersion + '" (expected "' + DECISION_SCHEMA_VERSION + '").');
    }
    if (payload.queueVersion !== queue.queueVersion) {
      errors.push('Imported queueVersion "' + payload.queueVersion + '" does not match loaded queue "' + queue.queueVersion + '".');
    }
    if (!isValidFingerprintFormat(payload.queueFingerprint)) {
      errors.push('queueFingerprint is missing or malformed (must be a 64-character lowercase sha256 hex string).');
    } else if (payload.queueFingerprint !== queue.queueFingerprint) {
      errors.push('Imported queueFingerprint does not match the loaded queue — this file was exported against a different queue snapshot.');
    }
    if (!isValidIsoDateTime(payload.exportedAt)) {
      errors.push('exportedAt is missing or not a valid ISO 8601 date-time string.');
    }

    validateDecisionCountsShape(payload.decisionCounts, errors);

    if (!Array.isArray(payload.decisions)) errors.push('Imported file has no decisions array.');
    if (!Array.isArray(payload.unreviewedProposalIds)) errors.push('Imported file has no unreviewedProposalIds array.');
    if (!Array.isArray(payload.decisions) || !Array.isArray(payload.unreviewedProposalIds)) {
      return { valid: false, errors: errors, decisionsByProposalId: null, recomputedCounts: null };
    }

    var queueItemsById = {};
    var allQueueProposalIds = new Set();
    (queue.items || []).forEach(function (it) { queueItemsById[it.proposalId] = it; allQueueProposalIds.add(it.proposalId); });

    var seenDecisionIds = {};
    var byProposalId = {};
    payload.decisions.forEach(function (d, idx) {
      if (!isPlainObject(d)) { errors.push('decisions[' + idx + '] is not an object.'); return; }
      if (seenDecisionIds[d.proposalId]) { errors.push('Duplicate decision for proposalId "' + d.proposalId + '".'); return; }
      var result = validateDecision(d, queueItemsById, validKnownArcheomapsIds);
      if (!result.valid) {
        errors.push('decisions[' + idx + '] (' + (d.proposalId || 'unknown') + '): ' + result.errors.join('; '));
        return;
      }
      seenDecisionIds[d.proposalId] = true;
      byProposalId[d.proposalId] = d;
    });

    var seenUnreviewed = {};
    payload.unreviewedProposalIds.forEach(function (id) {
      if (typeof id !== 'string') { errors.push('unreviewedProposalIds contains a non-string entry.'); return; }
      if (seenUnreviewed[id]) { errors.push('Duplicate unreviewed proposalId "' + id + '".'); return; }
      seenUnreviewed[id] = true;
      if (!allQueueProposalIds.has(id)) errors.push('unreviewedProposalIds contains "' + id + '", which is not in the loaded queue.');
      if (seenDecisionIds[id]) errors.push('proposalId "' + id + '" appears in BOTH decisions and unreviewedProposalIds.');
    });

    allQueueProposalIds.forEach(function (id) {
      if (!seenDecisionIds[id] && !seenUnreviewed[id]) {
        errors.push('proposalId "' + id + '" is missing from BOTH decisions and unreviewedProposalIds (every queue item must be accounted for exactly once).');
      }
    });

    var recomputedCounts = computeCounts(queue.items || [], byProposalId);
    if (isPlainObject(payload.decisionCounts)) {
      DECISION_COUNTS_REQUIRED_KEYS.forEach(function (k) {
        if (typeof payload.decisionCounts[k] === 'number' && payload.decisionCounts[k] !== recomputedCounts[k]) {
          errors.push('Declared decisionCounts.' + k + ' (' + payload.decisionCounts[k] + ') does not match the recomputed value (' + recomputedCounts[k] + ').');
        }
      });
    }

    if (errors.length > 0) return { valid: false, errors: errors, decisionsByProposalId: null, recomputedCounts: recomputedCounts };
    return { valid: true, errors: [], decisionsByProposalId: byProposalId, recomputedCounts: recomputedCounts };
  }

  function validateDecisionCountsShape(counts, errors) {
    if (!isPlainObject(counts)) { errors.push('decisionCounts is missing or not an object.'); return; }
    DECISION_COUNTS_REQUIRED_KEYS.forEach(function (k) {
      if (typeof counts[k] !== 'number' || !Number.isInteger(counts[k]) || counts[k] < 0) {
        errors.push('decisionCounts.' + k + ' must be a non-negative integer.');
      }
    });
    Object.keys(counts).forEach(function (k) {
      if (DECISION_COUNTS_REQUIRED_KEYS.indexOf(k) === -1) errors.push('Unknown decisionCounts property "' + k + '".');
    });
  }

  // ---------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------

  return {
    DECISIONS: DECISIONS,
    REJECT_REASONS: REJECT_REASONS,
    NEEDS_RESEARCH_REASONS: NEEDS_RESEARCH_REASONS,
    COMPLETENESS_BAND_COLOR: COMPLETENESS_BAND_COLOR,
    DECISION_SCHEMA_VERSION: DECISION_SCHEMA_VERSION,
    COMPLETENESS_CONFIG: COMPLETENESS_CONFIG,
    computeCompleteness: computeCompleteness,
    buildArcheomapsSnapshot: buildArcheomapsSnapshot,

    confidenceBand: confidenceBand,
    isSafeHttpUrl: isSafeHttpUrl,
    storageNamespace: storageNamespace,
    isValidIsoDateTime: isValidIsoDateTime,
    isValidFingerprintFormat: isValidFingerprintFormat,

    matchesSearch: matchesSearch,
    itemMatchesFilters: itemMatchesFilters,
    filterItems: filterItems,

    sortItems: sortItems,

    computeCounts: computeCounts,

    validateDecision: validateDecision,
    buildDecision: buildDecision,

    buildExport: buildExport,
    validateImportPayload: validateImportPayload,
  };
});
