#!/usr/bin/env node
'use strict';
/**
 * generate-review-queue.js — ArcheoMaps Phase 4.1A
 *
 * Deterministically builds curator/review_queue.json from two read-only
 * inputs. This script:
 *   - NEVER opens either input file for writing
 *   - NEVER approves, rejects, or otherwise judges a proposal
 *   - NEVER attaches a UNESCO ID to an ArcheoMaps record
 *   - Produces IDENTITY_MATCH queue items only
 *
 * Usage:
 *   node generate-review-queue.js \
 *     --dataset=/path/to/archeomaps_data_unesco_enriched_corrected.json \
 *     --proposals=/path/to/unesco_likely_existing_records.json \
 *     --out=/path/to/curator/review_queue.json
 *
 * All three flags are optional and fall back to:
 *   --dataset -> ./archeomaps_data_unesco_enriched_corrected.json (next to this script)
 *   --proposals -> ./unesco_likely_existing_records.json (next to this script)
 *   --out       -> ../curator/review_queue.json
 *
 * IMPORTANT: this package deliberately does NOT ship copies of the two
 * authoritative, user-owned input files inside scripts/ (see README.md —
 * "why this package excludes your inputs"). That means the zero-argument
 * form above will NOT work out of the box on a freshly extracted package;
 * it only works if you have deliberately placed copies of both files at
 * those exact default locations yourself. The explicit --dataset/
 * --proposals form is the primary, recommended way to run this script.
 *
 * Exit codes: 0 success. Non-zero on any integrity failure (missing
 * referenced record, wrong proposal count, ID collision, etc.) — this
 * script fails loudly rather than emitting a partial or guessed queue.
 */

const fs = require('fs');
const path = require('path');
const {
  fingerprintOf,
  buildArcheomapsSnapshot,
  COMPLETENESS_CONFIG,
  sha256Hex,
} = require('./lib.js');

const QUEUE_VERSION = 'phase4.1a-unesco-identity-v1';
const EVIDENCE_VERSION = 'phase4.0';
const EXPECTED_PROPOSAL_COUNT = 62;

function parseArgs(argv) {
  const out = {};
  for (const a of argv.slice(2)) {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function fail(message) {
  process.stderr.write(`[generate-review-queue] FATAL: ${message}\n`);
  process.exit(1);
}

function readJsonReadOnly(filePath, label) {
  if (!fs.existsSync(filePath)) {
    fail(`${label} not found at ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8'); // read-only open
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    fail(`${label} is not valid JSON: ${e.message}`);
  }
  return { parsed, raw, sha256: sha256Hex(raw) };
}

function main() {
  const args = parseArgs(process.argv);
  const scriptDir = __dirname;
  const datasetPath = path.resolve(args.dataset || path.join(scriptDir, 'archeomaps_data_unesco_enriched_corrected.json'));
  const proposalsPath = path.resolve(args.proposals || path.join(scriptDir, 'unesco_likely_existing_records.json'));
  const outPath = path.resolve(args.out || path.join(scriptDir, '..', 'curator', 'review_queue.json'));

  const datasetFile = readJsonReadOnly(datasetPath, 'ArcheoMaps checkpoint dataset');
  const proposalsFile = readJsonReadOnly(proposalsPath, 'Phase 4.0 likely-existing proposals');

  const dataset = datasetFile.parsed;
  const proposals = proposalsFile.parsed;

  if (!Array.isArray(dataset)) fail('Authoritative dataset is not a JSON array.');
  if (!Array.isArray(proposals)) fail('Proposals file is not a JSON array.');

  if (proposals.length !== EXPECTED_PROPOSAL_COUNT) {
    fail(`Expected exactly ${EXPECTED_PROPOSAL_COUNT} proposals, found ${proposals.length}. Refusing to generate a partial/oversized queue.`);
  }

  // Index the authoritative dataset by id, and fail on duplicate ids (would
  // make record resolution ambiguous and is itself a data-integrity issue
  // worth surfacing rather than silently picking one).
  const byId = new Map();
  for (const record of dataset) {
    if (!record || typeof record.id !== 'string') {
      fail('Encountered an authoritative dataset record with no string `id`.');
    }
    if (byId.has(record.id)) {
      fail(`Duplicate ArcheoMaps id "${record.id}" in authoritative dataset — refusing to proceed.`);
    }
    byId.set(record.id, record);
  }

  // Deterministic order: sort proposals by numeric unescoId ascending. This
  // makes queue item order independent of whatever order the proposals file
  // happened to list them in.
  const sortedProposals = proposals.slice().sort((a, b) => {
    const na = Number(a.unescoId);
    const nb = Number(b.unescoId);
    if (Number.isNaN(na) || Number.isNaN(nb)) fail('Encountered a non-numeric unescoId while sorting proposals.');
    return na - nb;
  });

  const seenProposalIds = new Set();
  const seenUnescoIds = new Set();
  const items = [];

  for (const proposal of sortedProposals) {
    if (typeof proposal.unescoId !== 'string' && typeof proposal.unescoId !== 'number') {
      fail('Proposal is missing unescoId.');
    }
    const unescoId = String(proposal.unescoId);
    if (seenUnescoIds.has(unescoId)) {
      fail(`Duplicate unescoId "${unescoId}" across proposals — refusing to proceed.`);
    }
    seenUnescoIds.add(unescoId);

    if (proposal.primaryProposedClass !== 'LIKELY_EXISTING_RECORD') {
      fail(`Proposal unescoId=${unescoId} has unexpected primaryProposedClass "${proposal.primaryProposedClass}" — Phase 4.1A only handles LIKELY_EXISTING_RECORD.`);
    }

    const candidatesRaw = proposal.evidence && proposal.evidence.identityTopCandidates;
    if (!Array.isArray(candidatesRaw) || candidatesRaw.length === 0) {
      fail(`Proposal unescoId=${unescoId} has no identityTopCandidates.`);
    }

    const candidates = candidatesRaw.map((c, idx) => {
      const target = byId.get(c.archeomapsId);
      if (!target) {
        fail(`Proposal unescoId=${unescoId} candidate #${idx + 1} references missing ArcheoMaps id "${c.archeomapsId}".`);
      }
      return {
        rank: idx + 1,
        archeomapsId: c.archeomapsId,
        score: typeof c.score === 'number' ? c.score : null,
        nameScore: typeof c.nameScore === 'number' ? c.nameScore : null,
        distanceMeters: typeof c.distanceMeters === 'number' ? c.distanceMeters : null,
        band: c.band || null,
        isContainment: !!c.isContainment,
        matchedComponent: c.matchedComponent || null,
        reasons: Array.isArray(c.reasons) ? c.reasons.slice() : [],
        archeomapsSnapshot: buildArcheomapsSnapshot(target),
      };
    });

    const targetArcheomapsId = candidates[0].archeomapsId;

    const proposalId = `IDENTITY_MATCH::unesco::${unescoId}`;
    if (seenProposalIds.has(proposalId)) {
      fail(`Proposal id collision detected: "${proposalId}".`);
    }
    seenProposalIds.add(proposalId);

    const itemCore = {
      proposalId,
      proposalType: 'IDENTITY_MATCH',
      source: 'unesco',
      externalId: unescoId,
      queueVersion: QUEUE_VERSION,
      evidenceVersion: EVIDENCE_VERSION,
      targetArcheomapsId,

      unesco: {
        unescoId,
        officialName: proposal.officialName || null,
        category: proposal.category || null,
        states: Array.isArray(proposal.states) ? proposal.states.slice() : [],
        region: proposal.region || null,
        coordinates: proposal.coordinates || null,
        transboundary: !!proposal.transboundary,
        componentsCount: typeof proposal.componentsCount === 'number' ? proposal.componentsCount : null,
        secondaryFlags: Array.isArray(proposal.secondaryFlags) ? proposal.secondaryFlags.slice() : [],
        // Not present in the Phase 4.0 proposal payload for this queue —
        // surfaced explicitly as unavailable rather than silently omitted,
        // per the "do not present missing evidence" rule combined with
        // "clearly label what inscription metadata is/isn't known".
        dateInscribed: null,
        dateInscribedAvailable: false,
        criteria: null,
        criteriaAvailable: false,
        sourceUrl: (proposal.sourceProvenance && proposal.sourceProvenance.url) || null,
      },

      proposal: {
        primaryProposedClass: proposal.primaryProposedClass,
        automatedRuleId: proposal.automatedRuleId || null,
        confidence: typeof proposal.confidence === 'number' ? proposal.confidence : null,
        reasons: Array.isArray(proposal.reasons) ? proposal.reasons.slice() : [],
        requiresHumanReview: !!proposal.requiresHumanReview,
        reviewReason: proposal.reviewReason || null,
        sourceProvenance: proposal.sourceProvenance || null, // may include retrievedAt (display-only; excluded from fingerprint)
      },

      evidence: {
        candidates,
        ambiguousConcepts: (proposal.evidence && proposal.evidence.ambiguousConcepts) || [],
        qualifyingClaims: (proposal.evidence && proposal.evidence.qualifyingClaims) || [],
        rejectedClaims: (proposal.evidence && proposal.evidence.rejectedClaims) || [],
        ignoredBoilerplateOccurrences: (proposal.evidence && proposal.evidence.ignoredBoilerplateOccurrences) || [],
        modernConstructionHits: (proposal.evidence && proposal.evidence.modernConstructionHits) || [],
        naturalIndicatorHits: (proposal.evidence && proposal.evidence.naturalIndicatorHits) || [],
        nameStructureAnchors: (proposal.evidence && proposal.evidence.nameStructureAnchors) || [],
        independentEvidenceCount: (proposal.evidence && proposal.evidence.independentEvidenceCount) ?? null,
        rawOccurrences: (proposal.evidence && proposal.evidence.rawOccurrences) ?? null,
        totalDescriptionTextLength: (proposal.evidence && proposal.evidence.totalDescriptionTextLength) ?? null,
        uniquePhrases: (proposal.evidence && proposal.evidence.uniquePhrases) || [],
      },
    };

    const proposalFingerprint = fingerprintOf(itemCore);
    items.push(Object.assign({}, itemCore, { proposalFingerprint }));
  }

  if (items.length !== EXPECTED_PROPOSAL_COUNT) {
    fail(`Internal error: produced ${items.length} items, expected ${EXPECTED_PROPOSAL_COUNT}.`);
  }

  // Queue-level fingerprint: hash of the sorted (proposalId, fingerprint)
  // pairs, independent of item array order.
  const pairs = items
    .map((it) => ({ id: it.proposalId, fp: it.proposalFingerprint }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const queueFingerprint = sha256Hex(JSON.stringify(pairs));

  // Lean id-only list (not full records) so the browser can validate a
  // free-typed "other existing ArcheoMaps ID" during an EDIT decision
  // without needing to fetch the full 3.6MB authoritative dataset. This is
  // an id list, not a duplication of the 2,103-record dataset.
  const knownArcheomapsIds = dataset.map((r) => r.id).sort();

  const queue = {
    queueVersion: QUEUE_VERSION,
    evidenceVersion: EVIDENCE_VERSION,
    completenessFormulaVersion: COMPLETENESS_CONFIG.formulaVersion,
    generatedAt: new Date().toISOString(), // informational only; excluded from all fingerprints
    itemCount: items.length,
    queueFingerprint,
    knownArcheomapsIds,
    inputs: {
      dataset: {
        path: path.basename(datasetPath),
        recordCount: dataset.length,
        sha256: datasetFile.sha256,
      },
      proposals: {
        path: path.basename(proposalsPath),
        recordCount: proposals.length,
        sha256: proposalsFile.sha256,
      },
    },
    items,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(queue, null, 2) + '\n', 'utf8');

  // Confirm source files were not touched (read-only discipline check).
  const postDatasetSha = sha256Hex(fs.readFileSync(datasetPath, 'utf8'));
  const postProposalsSha = sha256Hex(fs.readFileSync(proposalsPath, 'utf8'));
  if (postDatasetSha !== datasetFile.sha256) fail('Authoritative dataset changed on disk during generation — this must never happen.');
  if (postProposalsSha !== proposalsFile.sha256) fail('Proposals file changed on disk during generation — this must never happen.');

  process.stdout.write(`OK: wrote ${items.length} items to ${outPath}\n`);
  process.stdout.write(`queueFingerprint=${queueFingerprint}\n`);
  process.stdout.write(`dataset sha256=${datasetFile.sha256}\n`);
  process.stdout.write(`proposals sha256=${proposalsFile.sha256}\n`);
}

main();
