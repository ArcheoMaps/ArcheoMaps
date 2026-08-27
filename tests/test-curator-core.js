#!/usr/bin/env node
'use strict';
/**
 * test-curator-core.js — deterministic unit tests for curator-core.js.
 *
 * Zero-dependency (no jest/mocha), consistent with the rest of this
 * pipeline. Run with: node tests/test-curator-core.js
 * Writes a machine-readable summary to test-output/test-curator-core.json
 * and exits non-zero on any failure.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const CuratorCore = require('../curator/curator-core.js');

const results = [];
let current = null;

function test(name, fn) {
  current = { name, pass: false, error: null };
  try {
    fn();
    current.pass = true;
  } catch (e) {
    current.pass = false;
    current.error = e.message;
  }
  results.push(current);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSnapshot(overrides) {
  return Object.assign({
    id: 'site-0001', name: 'Test Site', lat: 10, lon: 20, year: 100,
    canonicalType: 'Temple', tags: ['religion:temple'], culture: 'Roman',
    description: 'A perfectly ordinary and substantive description of a site.',
    image: 'img.jpg', source: 'http://example.com', workflowState: null,
    completeness: { formulaVersion: 'v1', percentage: 80, band: 'green', provisional: true, dimensions: [] },
  }, overrides || {});
}

function makeCandidate(archeomapsId, overrides) {
  return Object.assign({
    rank: 1, archeomapsId, score: 50, nameScore: 0.5, distanceMeters: 1000,
    band: 'moderate', isContainment: false, matchedComponent: null, reasons: [],
    archeomapsSnapshot: makeSnapshot({ id: archeomapsId }),
  }, overrides || {});
}

function makeItem(overrides) {
  var base = {
    proposalId: 'IDENTITY_MATCH::unesco::100',
    proposalType: 'IDENTITY_MATCH', source: 'unesco', externalId: '100',
    queueVersion: 'test-v1', evidenceVersion: 'phase4.0',
    targetArcheomapsId: 'site-0001',
    proposalFingerprint: 'a'.repeat(64),
    unesco: { unescoId: '100', officialName: 'Test Property', category: 'Cultural', states: ['Testland'], region: 'Test Region', transboundary: false, componentsCount: 1, secondaryFlags: [] },
    proposal: { primaryProposedClass: 'LIKELY_EXISTING_RECORD', automatedRuleId: 'R1', confidence: 0.75, reasons: [], requiresHumanReview: true, reviewReason: null },
    evidence: { candidates: [makeCandidate('site-0001'), makeCandidate('site-0002'), makeCandidate('site-0003')] },
  };
  return Object.assign(JSON.parse(JSON.stringify(base)), overrides || {});
}

function makeQueue(items) {
  return {
    queueVersion: 'test-v1', queueFingerprint: 'f'.repeat(64), itemCount: items.length,
    knownArcheomapsIds: ['site-0001', 'site-0002', 'site-0003', 'site-0099'],
    items: items,
  };
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

test('itemMatchesFilters: decision=all matches everything', () => {
  const item = makeItem();
  assert.strictEqual(CuratorCore.itemMatchesFilters(item, null, { decision: 'all' }), true);
});

test('itemMatchesFilters: decision=unresolved excludes decided items', () => {
  const item = makeItem();
  const decision = { decision: 'APPROVE' };
  assert.strictEqual(CuratorCore.itemMatchesFilters(item, decision, { decision: 'unresolved' }), false);
  assert.strictEqual(CuratorCore.itemMatchesFilters(item, null, { decision: 'unresolved' }), true);
});

test('itemMatchesFilters: decision=REJECT only matches items decided REJECT', () => {
  const item = makeItem();
  assert.strictEqual(CuratorCore.itemMatchesFilters(item, { decision: 'REJECT' }, { decision: 'REJECT' }), true);
  assert.strictEqual(CuratorCore.itemMatchesFilters(item, { decision: 'APPROVE' }, { decision: 'REJECT' }), false);
});

test('itemMatchesFilters: confidenceBand high/moderate/low thresholds', () => {
  const high = makeItem({ proposal: Object.assign(makeItem().proposal, { confidence: 0.9 }) });
  const mod = makeItem({ proposal: Object.assign(makeItem().proposal, { confidence: 0.5 }) });
  const low = makeItem({ proposal: Object.assign(makeItem().proposal, { confidence: 0.2 }) });
  assert.strictEqual(CuratorCore.confidenceBand(0.9), 'high');
  assert.strictEqual(CuratorCore.confidenceBand(0.5), 'moderate');
  assert.strictEqual(CuratorCore.confidenceBand(0.2), 'low');
  assert.strictEqual(CuratorCore.itemMatchesFilters(high, null, { confidenceBand: 'high' }), true);
  assert.strictEqual(CuratorCore.itemMatchesFilters(mod, null, { confidenceBand: 'high' }), false);
  assert.strictEqual(CuratorCore.itemMatchesFilters(low, null, { confidenceBand: 'low' }), true);
});

test('itemMatchesFilters: serialOnly matches componentsCount>1 OR SERIAL_PROPERTY flag', () => {
  const serialByCount = makeItem({ unesco: Object.assign(makeItem().unesco, { componentsCount: 3 }) });
  const serialByFlag = makeItem({ unesco: Object.assign(makeItem().unesco, { secondaryFlags: ['SERIAL_PROPERTY'] }) });
  const notSerial = makeItem();
  assert.strictEqual(CuratorCore.itemMatchesFilters(serialByCount, null, { serialOnly: true }), true);
  assert.strictEqual(CuratorCore.itemMatchesFilters(serialByFlag, null, { serialOnly: true }), true);
  assert.strictEqual(CuratorCore.itemMatchesFilters(notSerial, null, { serialOnly: true }), false);
});

test('itemMatchesFilters: completenessBand reads from rank-1 candidate snapshot', () => {
  const item = makeItem();
  item.evidence.candidates[0].archeomapsSnapshot.completeness.band = 'red';
  assert.strictEqual(CuratorCore.itemMatchesFilters(item, null, { completenessBand: 'red' }), true);
  assert.strictEqual(CuratorCore.itemMatchesFilters(item, null, { completenessBand: 'green' }), false);
});

test('matchesSearch: matches UNESCO name, any candidate name, id, region, state', () => {
  const item = makeItem();
  item.evidence.candidates[1].archeomapsSnapshot.name = 'Findable Candidate Two';
  assert.strictEqual(CuratorCore.matchesSearch(item, 'Test Property'), true);
  assert.strictEqual(CuratorCore.matchesSearch(item, 'findable candidate two'), true, 'must search non-top candidates too');
  assert.strictEqual(CuratorCore.matchesSearch(item, 'site-0003'), true);
  assert.strictEqual(CuratorCore.matchesSearch(item, 'Testland'), true);
  assert.strictEqual(CuratorCore.matchesSearch(item, 'nothing-matches-this'), false);
  assert.strictEqual(CuratorCore.matchesSearch(item, ''), true, 'empty query matches everything');
});

test('filterItems: search + decision filter compose correctly', () => {
  const a = makeItem({ proposalId: 'a' });
  const b = makeItem({ proposalId: 'b', unesco: Object.assign(makeItem().unesco, { officialName: 'Other Name' }) });
  const decisions = { a: { decision: 'APPROVE' } };
  const out = CuratorCore.filterItems([a, b], decisions, { search: 'Test Property', decision: 'all' });
  assert.strictEqual(out.length, 1);
  assert.strictEqual(out[0].proposalId, 'a');
});

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

test('sortItems: queue-order is a stable no-op (preserves array order)', () => {
  const items = [makeItem({ proposalId: 'IDENTITY_MATCH::unesco::1018' }), makeItem({ proposalId: 'IDENTITY_MATCH::unesco::4' })];
  const sorted = CuratorCore.sortItems(items, 'queue-order');
  assert.deepStrictEqual(sorted.map((i) => i.proposalId), ['IDENTITY_MATCH::unesco::1018', 'IDENTITY_MATCH::unesco::4'],
    'queue-order must NOT re-sort by proposalId string (that would put "1018" before "4")');
});

test('sortItems: confidence-desc orders high to low with stable tie-break', () => {
  const a = makeItem({ proposalId: 'a', proposal: Object.assign(makeItem().proposal, { confidence: 0.5 }) });
  const b = makeItem({ proposalId: 'b', proposal: Object.assign(makeItem().proposal, { confidence: 0.75 }) });
  const c = makeItem({ proposalId: 'c', proposal: Object.assign(makeItem().proposal, { confidence: 0.75 }) });
  const sorted = CuratorCore.sortItems([a, b, c], 'confidence-desc');
  assert.deepStrictEqual(sorted.map((i) => i.proposalId), ['b', 'c', 'a'], 'ties broken deterministically by proposalId');
});

test('sortItems: distance-asc orders nearest first', () => {
  const near = makeItem({ proposalId: 'near' });
  near.evidence.candidates[0].distanceMeters = 10;
  const far = makeItem({ proposalId: 'far' });
  far.evidence.candidates[0].distanceMeters = 99999;
  const sorted = CuratorCore.sortItems([far, near], 'distance-asc');
  assert.deepStrictEqual(sorted.map((i) => i.proposalId), ['near', 'far']);
});

test('sortItems: completeness-desc reads rank-1 candidate percentage', () => {
  const lowC = makeItem({ proposalId: 'low' });
  lowC.evidence.candidates[0].archeomapsSnapshot.completeness.percentage = 10;
  const highC = makeItem({ proposalId: 'high' });
  highC.evidence.candidates[0].archeomapsSnapshot.completeness.percentage = 90;
  const sorted = CuratorCore.sortItems([lowC, highC], 'completeness-desc');
  assert.deepStrictEqual(sorted.map((i) => i.proposalId), ['high', 'low']);
});

test('sortItems: unknown sort key falls back to queue-order (no throw)', () => {
  const items = [makeItem({ proposalId: 'x' }), makeItem({ proposalId: 'y' })];
  const sorted = CuratorCore.sortItems(items, 'not-a-real-key');
  assert.deepStrictEqual(sorted.map((i) => i.proposalId), ['x', 'y']);
});

// ---------------------------------------------------------------------------
// Counts
// ---------------------------------------------------------------------------

test('computeCounts: tallies decisions and unreviewed correctly', () => {
  const items = [makeItem({ proposalId: 'a' }), makeItem({ proposalId: 'b' }), makeItem({ proposalId: 'c' })];
  const decisions = { a: { decision: 'APPROVE' }, b: { decision: 'REJECT' } };
  const counts = CuratorCore.computeCounts(items, decisions);
  assert.deepStrictEqual(counts, { APPROVE: 1, EDIT: 0, NEEDS_RESEARCH: 0, REJECT: 1, DEFER: 0, total: 3, unreviewed: 1 });
});

// ---------------------------------------------------------------------------
// Decision validation helpers
// ---------------------------------------------------------------------------

const VALID_ISO = '2026-08-26T12:00:00.000Z';

/** A fully-valid decision for `item`, matching what curator.js's saveDecision() actually produces. */
function makeValidDecision(item, decisionValue, extra) {
  return CuratorCore.buildDecision(Object.assign({
    proposalId: item.proposalId,
    queueVersion: item.queueVersion,
    proposalType: item.proposalType,
    source: item.source,
    externalId: item.externalId,
    targetArcheomapsId: item.targetArcheomapsId,
    decision: decisionValue,
    reviewedAt: VALID_ISO,
    evidenceVersion: item.evidenceVersion,
    proposalFingerprint: item.proposalFingerprint,
  }, extra || {}));
}

// The EXACT malformed case independent review found: an APPROVE decision
// containing only proposalId, decision, and externalId.
function makeReportedMalformedApprove(item) {
  return { proposalId: item.proposalId, decision: 'APPROVE', externalId: item.externalId };
}

// ---------------------------------------------------------------------------
// Decision validation
// ---------------------------------------------------------------------------

test('validateDecision: valid APPROVE (all required fields present) passes', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'APPROVE');
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, ['site-0001']);
  assert.strictEqual(result.valid, true, JSON.stringify(result.errors));
});

test('validateDecision: THE REPORTED BUG — APPROVE with only proposalId/decision/externalId now FAILS', () => {
  const item = makeItem();
  const decision = makeReportedMalformedApprove(item);
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false, 'this malformed decision must be rejected');
  ['queueVersion', 'proposalType', 'source', 'targetArcheomapsId', 'evidenceVersion', 'proposalFingerprint'].forEach((f) => {
    assert.ok(result.errors.some((e) => e.includes(`"${f}"`)), `missing-field error expected for ${f}, got: ${JSON.stringify(result.errors)}`);
  });
  assert.ok(result.errors.some((e) => /reviewedAt/.test(e)), 'missing reviewedAt must also be flagged');
});

test('validateDecision: illegal decision value fails', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'MAYBE');
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /decision must be one of/.test(e)));
});

// --- one test per individually-missing required field (spec §3) ---------

['queueVersion', 'proposalType', 'source', 'externalId', 'targetArcheomapsId', 'evidenceVersion', 'proposalFingerprint'].forEach((field) => {
  test(`validateDecision: missing "${field}" alone fails`, () => {
    const item = makeItem();
    const decision = makeValidDecision(item, 'APPROVE');
    delete decision[field];
    const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
    assert.strictEqual(result.valid, false, `missing ${field} should fail validation`);
    assert.ok(result.errors.some((e) => e.includes(`"${field}"`)), `expected an error mentioning ${field}, got: ${JSON.stringify(result.errors)}`);
  });
});

test('validateDecision: missing reviewedAt fails', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'APPROVE');
  delete decision.reviewedAt;
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /reviewedAt/.test(e)));
});

// --- malformed / wrong-value cases ---------------------------------------

test('validateDecision: malformed reviewedAt (not ISO 8601) fails', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'APPROVE', { reviewedAt: '08/26/2026' });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /reviewedAt/.test(e)));
});

test('validateDecision: reviewedAt missing timezone fails (not a complete ISO date-time)', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'APPROVE', { reviewedAt: '2026-08-26T12:00:00' });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false);
});

test('validateDecision: malformed proposalFingerprint (wrong length / non-hex) fails', () => {
  const item = makeItem();
  const tooShort = makeValidDecision(item, 'APPROVE', { proposalFingerprint: 'abc123' });
  const nonHex = makeValidDecision(item, 'APPROVE', { proposalFingerprint: 'z'.repeat(64) });
  const upperCase = makeValidDecision(item, 'APPROVE', { proposalFingerprint: 'A'.repeat(64) });
  [tooShort, nonHex, upperCase].forEach((d) => {
    const result = CuratorCore.validateDecision(d, { [item.proposalId]: item }, []);
    assert.strictEqual(result.valid, false, JSON.stringify(d.proposalFingerprint));
    assert.ok(result.errors.some((e) => /malformed/.test(e)));
  });
});

test('validateDecision: stale (well-formed but wrong) proposalFingerprint is flagged, not silently accepted', () => {
  const item = makeItem();
  const staleButValidFormat = 'b'.repeat(64); // well-formed hex, but not this item's real fingerprint ('a'.repeat(64))
  const decision = makeValidDecision(item, 'APPROVE', { proposalFingerprint: staleButValidFormat });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /proposal changed/.test(e)));
});

test('validateDecision: wrong externalId (does not match queue item) fails', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'APPROVE', { externalId: 'not-the-real-external-id' });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('"externalId"') && /does not match/.test(e)));
});

test('validateDecision: wrong targetArcheomapsId (does not match queue item) fails', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'APPROVE', { targetArcheomapsId: 'site-9999' });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('"targetArcheomapsId"') && /does not match/.test(e)));
});

test('validateDecision: wrong evidenceVersion (does not match queue item) fails', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'APPROVE', { evidenceVersion: 'phase99.9' });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('"evidenceVersion"') && /does not match/.test(e)));
});

test('validateDecision: wrong queueVersion / proposalType / source each individually fail', () => {
  const item = makeItem();
  ['queueVersion', 'proposalType', 'source'].forEach((f) => {
    const decision = makeValidDecision(item, 'APPROVE', { [f]: 'WRONG_VALUE' });
    const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
    assert.strictEqual(result.valid, false, f);
    assert.ok(result.errors.some((e) => e.includes(`"${f}"`) && /does not match/.test(e)), f);
  });
});

test('validateDecision: unknown decision property fails', () => {
  const item = makeItem();
  const decision = Object.assign(makeValidDecision(item, 'APPROVE'), { notARealField: 'oops' });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /Unknown decision property "notARealField"/.test(e)));
});

test('validateDecision: EDIT without selectedArcheomapsId fails', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'EDIT', { curatorNote: 'ok' });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, ['site-0002']);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /requires selectedArcheomapsId/.test(e)));
});

test('validateDecision: EDIT without curatorNote fails', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'EDIT', { selectedArcheomapsId: 'site-0002' });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, ['site-0002']);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /requires a curatorNote/.test(e)));
});

test('validateDecision: EDIT with unknown ArcheoMaps id fails (no new ids can be created)', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'EDIT', { selectedArcheomapsId: 'site-9999', curatorNote: 'note' });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, ['site-0001', 'site-0002']);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /does not exist in the loaded dataset/.test(e)));
});

test('validateDecision: EDIT with known id + note passes', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'EDIT', { selectedArcheomapsId: 'site-0002', curatorNote: 'Better match on manual review.' });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, ['site-0001', 'site-0002']);
  assert.strictEqual(result.valid, true, JSON.stringify(result.errors));
});

test('validateDecision: unrecognized rejectReason/needsResearchReason are flagged', () => {
  const item = makeItem();
  const d1 = makeValidDecision(item, 'REJECT', { rejectReason: 'not-a-real-reason' });
  const d2 = makeValidDecision(item, 'NEEDS_RESEARCH', { needsResearchReason: 'also-fake' });
  assert.strictEqual(CuratorCore.validateDecision(d1, { [item.proposalId]: item }, []).valid, false);
  assert.strictEqual(CuratorCore.validateDecision(d2, { [item.proposalId]: item }, []).valid, false);
});

test('validateDecision: rejects patch-shaped fields (unescoIdNo, apply, patch, ...)', () => {
  const item = makeItem();
  const decision = Object.assign(makeValidDecision(item, 'APPROVE'), { unescoIdNo: 999 });
  const result = CuratorCore.validateDecision(decision, { [item.proposalId]: item }, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /disallowed patch-shaped field/.test(e)));
  assert.ok(result.errors.some((e) => /Unknown decision property "unescoIdNo"/.test(e)), 'both the whitelist check and the explicit forbidden-key check should fire (defense in depth)');
});

test('validateDecision: unknown proposalId is flagged (not a known queue item)', () => {
  const item = makeItem();
  const decision = makeValidDecision(item, 'DEFER');
  decision.proposalId = 'not-in-queue';
  const result = CuratorCore.validateDecision(decision, {}, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /not a known queue item/.test(e)));
});

// ---------------------------------------------------------------------------
// Export / import
// ---------------------------------------------------------------------------

test('buildExport: counts + unreviewed list are correct and consistent', () => {
  const items = [makeItem({ proposalId: 'a' }), makeItem({ proposalId: 'b' }), makeItem({ proposalId: 'c' })];
  const queue = makeQueue(items);
  const decisions = { a: makeValidDecision(items[0], 'APPROVE') };
  const exp = CuratorCore.buildExport(queue, decisions, VALID_ISO);
  assert.strictEqual(exp.decisionCounts.total, 3);
  assert.strictEqual(exp.decisionCounts.APPROVE, 1);
  assert.strictEqual(exp.decisionCounts.unreviewed, 2);
  assert.deepStrictEqual(exp.unreviewedProposalIds.sort(), ['b', 'c']);
  assert.strictEqual(exp.queueFingerprint, queue.queueFingerprint);
  assert.strictEqual(exp.schemaVersion, CuratorCore.DECISION_SCHEMA_VERSION);
});

test('buildExport -> validateImportPayload round trip passes cleanly (self-consistency)', () => {
  const items = [makeItem({ proposalId: 'a' }), makeItem({ proposalId: 'b' }), makeItem({ proposalId: 'c' })];
  const queue = makeQueue(items);
  const decisions = {
    a: makeValidDecision(items[0], 'APPROVE'),
    b: makeValidDecision(items[1], 'REJECT', { rejectReason: 'name-coincidence', curatorNote: 'note' }),
  };
  const exp = CuratorCore.buildExport(queue, decisions, VALID_ISO);
  const result = CuratorCore.validateImportPayload(exp, queue, []);
  assert.strictEqual(result.valid, true, JSON.stringify(result.errors));
  assert.deepStrictEqual(Object.keys(result.decisionsByProposalId).sort(), ['a', 'b']);
});

function makeValidExport(queue, decisionsByProposalId) {
  return CuratorCore.buildExport(queue, decisionsByProposalId, VALID_ISO);
}

test('validateImportPayload: incorrect schemaVersion fails', () => {
  const items = [makeItem({ proposalId: 'a' })];
  const queue = makeQueue(items);
  const payload = Object.assign(makeValidExport(queue, {}), { schemaVersion: 'some-other-v9' });
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /Unsupported schemaVersion/.test(e)));
});

test('validateImportPayload: rejects malformed queueFingerprint (wrong format)', () => {
  const items = [makeItem({ proposalId: 'a' })];
  const queue = makeQueue(items);
  const payload = Object.assign(makeValidExport(queue, {}), { queueFingerprint: 'not-64-hex-chars' });
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /malformed/.test(e)));
});

test('validateImportPayload: rejects mismatched (but well-formed) queueFingerprint', () => {
  const items = [makeItem({ proposalId: 'a' })];
  const queue = makeQueue(items);
  const payload = Object.assign(makeValidExport(queue, {}), { queueFingerprint: '9'.repeat(64) });
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /does not match the loaded queue/.test(e)));
});

test('validateImportPayload: rejects malformed exportedAt', () => {
  const items = [makeItem({ proposalId: 'a' })];
  const queue = makeQueue(items);
  const payload = Object.assign(makeValidExport(queue, {}), { exportedAt: 'yesterday' });
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /exportedAt/.test(e)));
});

test('validateImportPayload: rejects unknown top-level export property', () => {
  const items = [makeItem({ proposalId: 'a' })];
  const queue = makeQueue(items);
  const payload = Object.assign(makeValidExport(queue, {}), { patch: { some: 'thing' } });
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /Unknown top-level export property "patch"/.test(e)));
});

test('validateImportPayload: rejects incorrect decisionCounts (declared vs recomputed mismatch)', () => {
  const items = [makeItem({ proposalId: 'a' }), makeItem({ proposalId: 'b' })];
  const queue = makeQueue(items);
  const payload = makeValidExport(queue, { a: makeValidDecision(items[0], 'APPROVE') });
  payload.decisionCounts.APPROVE = 99; // tamper
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /decisionCounts.APPROVE/.test(e)));
});

test('validateImportPayload: rejects decisionCounts with an unknown/missing key', () => {
  const items = [makeItem({ proposalId: 'a' })];
  const queue = makeQueue(items);
  const payload = makeValidExport(queue, {});
  delete payload.decisionCounts.DEFER;
  payload.decisionCounts.EXTRA_FIELD = 5;
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /decisionCounts\.DEFER/.test(e)));
  assert.ok(result.errors.some((e) => /Unknown decisionCounts property "EXTRA_FIELD"/.test(e)));
});

test('validateImportPayload: rejects duplicate proposalId within decisions', () => {
  const item = makeItem({ proposalId: 'a' });
  const queue = makeQueue([item]);
  const d = makeValidDecision(item, 'APPROVE');
  const payload = Object.assign(makeValidExport(queue, {}), { decisions: [d, d], unreviewedProposalIds: [] });
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /Duplicate decision/.test(e)));
});

test('validateImportPayload: rejects a decision referencing an unknown proposalId', () => {
  const item = makeItem({ proposalId: 'a' });
  const queue = makeQueue([item]);
  const d = makeValidDecision(item, 'APPROVE');
  d.proposalId = 'not-real';
  const payload = Object.assign(makeValidExport(queue, {}), { decisions: [d], unreviewedProposalIds: ['a'] });
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
});

test('validateImportPayload: rejects a proposal present in BOTH decisions and unreviewedProposalIds', () => {
  const items = [makeItem({ proposalId: 'a' }), makeItem({ proposalId: 'b' })];
  const queue = makeQueue(items);
  const payload = makeValidExport(queue, { a: makeValidDecision(items[0], 'APPROVE') });
  payload.unreviewedProposalIds = ['a', 'b']; // 'a' shouldn't be here, it's decided
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /BOTH decisions and unreviewedProposalIds/.test(e)));
});

test('validateImportPayload: rejects a queue item missing from BOTH decisions and unreviewedProposalIds', () => {
  const items = [makeItem({ proposalId: 'a' }), makeItem({ proposalId: 'b' })];
  const queue = makeQueue(items);
  const payload = makeValidExport(queue, {});
  payload.unreviewedProposalIds = ['a']; // 'b' accounted for nowhere
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /missing from BOTH/.test(e)));
});

test('validateImportPayload: rejects duplicate unreviewed proposal ID', () => {
  const items = [makeItem({ proposalId: 'a' })];
  const queue = makeQueue(items);
  const payload = makeValidExport(queue, {});
  payload.unreviewedProposalIds = ['a', 'a'];
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /Duplicate unreviewed proposalId/.test(e)));
});

test('validateImportPayload: rejects an unreviewed ID that does not belong to the queue', () => {
  const items = [makeItem({ proposalId: 'a' })];
  const queue = makeQueue(items);
  const payload = makeValidExport(queue, {});
  payload.unreviewedProposalIds = ['a', 'not-in-the-queue'];
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => /not in the loaded queue/.test(e)));
});

test('validateImportPayload: valid payload imports cleanly, never partially', () => {
  const item1 = makeItem({ proposalId: 'a' });
  const item2 = makeItem({ proposalId: 'b' });
  const queue = makeQueue([item1, item2]);
  const payload = makeValidExport(queue, { a: makeValidDecision(item1, 'APPROVE') });
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, true, JSON.stringify(result.errors));
  assert.deepStrictEqual(Object.keys(result.decisionsByProposalId), ['a']);
});

test('validateImportPayload: one invalid decision in the batch invalidates the whole import (no partial import)', () => {
  const item1 = makeItem({ proposalId: 'a' });
  const item2 = makeItem({ proposalId: 'b' });
  const queue = makeQueue([item1, item2]);
  const good = makeValidDecision(item1, 'APPROVE');
  const bad = makeValidDecision(item2, 'APPROVE');
  bad.decision = 'NOT_REAL';
  const payload = Object.assign(makeValidExport(queue, {}), { decisions: [good, bad], unreviewedProposalIds: [] });
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.decisionsByProposalId, null, 'must not return a partial decisions map');
});

test('validateImportPayload: THE REPORTED BUG reproduced end-to-end — malformed APPROVE inside a real import is rejected', () => {
  const item1 = makeItem({ proposalId: 'a' });
  const item2 = makeItem({ proposalId: 'b' });
  const queue = makeQueue([item1, item2]);
  const malformed = makeReportedMalformedApprove(item1);
  const payload = Object.assign(makeValidExport(queue, {}), { decisions: [malformed], unreviewedProposalIds: ['b'] });
  const result = CuratorCore.validateImportPayload(payload, queue, []);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.decisionsByProposalId, null);
});

// ---------------------------------------------------------------------------
// isValidIsoDateTime / isValidFingerprintFormat
// ---------------------------------------------------------------------------

test('isValidIsoDateTime: accepts real ISO date-times, rejects near-misses', () => {
  assert.strictEqual(CuratorCore.isValidIsoDateTime('2026-08-26T12:00:00.000Z'), true);
  assert.strictEqual(CuratorCore.isValidIsoDateTime('2026-08-26T12:00:00+02:00'), true);
  assert.strictEqual(CuratorCore.isValidIsoDateTime('2026-08-26'), false, 'bare date, no time');
  assert.strictEqual(CuratorCore.isValidIsoDateTime('2026-08-26T12:00:00'), false, 'no timezone');
  assert.strictEqual(CuratorCore.isValidIsoDateTime('not a date'), false);
  assert.strictEqual(CuratorCore.isValidIsoDateTime(null), false);
  assert.strictEqual(CuratorCore.isValidIsoDateTime(undefined), false);
});

test('isValidFingerprintFormat: exactly 64 lowercase hex chars', () => {
  assert.strictEqual(CuratorCore.isValidFingerprintFormat('a'.repeat(64)), true);
  assert.strictEqual(CuratorCore.isValidFingerprintFormat('A'.repeat(64)), false, 'uppercase rejected');
  assert.strictEqual(CuratorCore.isValidFingerprintFormat('a'.repeat(63)), false, 'too short');
  assert.strictEqual(CuratorCore.isValidFingerprintFormat('a'.repeat(65)), false, 'too long');
  assert.strictEqual(CuratorCore.isValidFingerprintFormat('z'.repeat(64)), false, 'non-hex char');
  assert.strictEqual(CuratorCore.isValidFingerprintFormat(null), false);
});



// ---------------------------------------------------------------------------
// Completeness formula
// ---------------------------------------------------------------------------

test('computeCompleteness: fully populated record scores 100', () => {
  const record = {
    n: 'X', lat: 1, lon: 2, canonicalType: 'Temple', year: 100, source: 'http://x.com',
    text: 'A substantive multi-word description of this site and its history.',
    tags: ['a:b'], culture: 'Roman', img: 'x.jpg',
  };
  const c = CuratorCore.computeCompleteness(record);
  assert.strictEqual(c.percentage, 100);
  assert.strictEqual(c.band, 'green');
});

test('computeCompleteness: empty record scores 0 and bands red', () => {
  const c = CuratorCore.computeCompleteness({ n: null, lat: null, lon: null });
  assert.strictEqual(c.percentage, 0);
  assert.strictEqual(c.band, 'red');
});

test('computeCompleteness: bare-URL text does NOT count as a substantive description', () => {
  const withUrlOnly = CuratorCore.computeCompleteness({ text: 'http://en.wikipedia.org/wiki/Something' });
  const dim = withUrlOnly.dimensions.find((d) => d.key === 'description');
  assert.strictEqual(dim.status, 'not_yet_researched');
});

test('computeCompleteness: null canonicalType + workflow.state=research is "researched_empty", not "not_yet_researched"', () => {
  const c = CuratorCore.computeCompleteness({ canonicalType: null, workflow: { type: { state: 'research' } } });
  const dim = c.dimensions.find((d) => d.key === 'canonicalType');
  assert.strictEqual(dim.status, 'researched_empty');
});

test('computeCompleteness: null canonicalType + workflow.state=review is "not_yet_researched"', () => {
  const c = CuratorCore.computeCompleteness({ canonicalType: null, workflow: { type: { state: 'review' } } });
  const dim = c.dimensions.find((d) => d.key === 'canonicalType');
  assert.strictEqual(dim.status, 'not_yet_researched');
});

test('computeCompleteness: phases dimension is always "unavailable" with weight 0 (field does not exist in dataset)', () => {
  const c = CuratorCore.computeCompleteness({ n: 'X', lat: 1, lon: 2, canonicalType: 'Temple', year: 1, source: 's', text: 'a real description here', tags: ['a'], culture: 'c', img: 'i' });
  const dim = c.dimensions.find((d) => d.key === 'phases');
  assert.strictEqual(dim.status, 'unavailable');
  assert.strictEqual(dim.weight, 0);
  assert.strictEqual(c.percentage, 100, 'unavailable dimension must not lower the achievable percentage');
});

test('computeCompleteness: result is always marked provisional with a documented reason', () => {
  const c = CuratorCore.computeCompleteness({});
  assert.strictEqual(c.provisional, true);
  assert.ok(c.provisionalReason.length > 20);
});

test('computeCompleteness: weights sum to 100 across scoreable dimensions', () => {
  const total = CuratorCore.COMPLETENESS_CONFIG.dimensions.reduce((s, d) => s + d.weight, 0);
  assert.strictEqual(total, 100);
});

// ---------------------------------------------------------------------------
// Snapshot builder
// ---------------------------------------------------------------------------

test('buildArcheomapsSnapshot: maps fields correctly and never invents data', () => {
  const record = {
    id: 'site-0042', n: 'Some Site', lat: 1.5, lon: 2.5, year: -100, era: 'yellow', eraLabel: 'Classical',
    culture: 'Greek', canonicalType: null, type: 'Ruins', category: 'Ruins', tags: [], text: 'desc',
    img: null, source: null, sourceType: null, continent: 'Europe',
    workflow: { type: { state: 'research' } }, dataQuality: { migrationProvisional: true, migrationProvisionalNote: 'note' },
    unesco: false, unescoIdNo: null,
  };
  const snap = CuratorCore.buildArcheomapsSnapshot(record);
  assert.strictEqual(snap.id, 'site-0042');
  assert.strictEqual(snap.canonicalType, null);
  assert.strictEqual(snap.workflowState, 'research');
  assert.strictEqual(snap.dataQualityProvisional, true);
  assert.strictEqual(snap.alreadyLinkedUnesco, false);
  assert.strictEqual(snap.heritageUnesco, null);
  assert.ok(!('provenance' in snap), 'provenance audit trail must be excluded from the lean snapshot');
});

test('buildArcheomapsSnapshot: surfaces existing heritage.unesco linkage (double-link guard)', () => {
  const record = { id: 'site-0017', n: 'Baalbek', lat: 34, lon: 36, unesco: true, unescoIdNo: 294, heritage: { unesco: { officialName: 'Baalbek' } } };
  const snap = CuratorCore.buildArcheomapsSnapshot(record);
  assert.strictEqual(snap.alreadyLinkedUnesco, true);
  assert.strictEqual(snap.existingUnescoIdNo, 294);
  assert.deepStrictEqual(snap.heritageUnesco, { officialName: 'Baalbek' });
});

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

test('isSafeHttpUrl: accepts http/https, rejects everything else', () => {
  assert.strictEqual(CuratorCore.isSafeHttpUrl('https://example.com'), true);
  assert.strictEqual(CuratorCore.isSafeHttpUrl('http://example.com'), true);
  assert.strictEqual(CuratorCore.isSafeHttpUrl('javascript:alert(1)'), false);
  assert.strictEqual(CuratorCore.isSafeHttpUrl('ftp://example.com'), false);
  assert.strictEqual(CuratorCore.isSafeHttpUrl('not a url'), false);
  assert.strictEqual(CuratorCore.isSafeHttpUrl(null), false);
});

test('storageNamespace: namespaced by both queueVersion and queueFingerprint', () => {
  const a = CuratorCore.storageNamespace('v1', 'fingerprintAAAA');
  const b = CuratorCore.storageNamespace('v2', 'fingerprintAAAA');
  const c = CuratorCore.storageNamespace('v1', 'fingerprintBBBB');
  assert.notStrictEqual(a, b);
  assert.notStrictEqual(a, c);
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass);

console.log(`\n${passed}/${results.length} passed`);
failed.forEach((f) => console.log(`  FAIL: ${f.name}\n        ${f.error}`));

const outDir = path.join(__dirname, '..', 'test-output');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'test-curator-core.json'),
  JSON.stringify({ ranAt: new Date().toISOString(), total: results.length, passed, failed: failed.length, results }, null, 2) + '\n'
);

process.exitCode = failed.length === 0 ? 0 : 1;
