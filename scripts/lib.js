'use strict';
/**
 * lib.js — shared, zero-dependency helpers for ArcheoMaps Phase 4.1A pipeline
 * scripts (generate-review-queue.js, validate-review-decisions.js).
 *
 * Node.js built-ins only (crypto, fs). No third-party packages.
 *
 * This module is intentionally NOT loaded by the browser curator page.
 * The curator page ships pre-computed values inside review_queue.json so it
 * never needs to re-derive completeness scores or re-hash anything at
 * runtime — see curator/curator-core.js for the small browser-side helpers
 * (band-for-percentage, filtering, decision validation) that ARE shared
 * with the browser via a UMD-lite wrapper.
 */

const crypto = require('crypto');
const CuratorCore = require('../curator/curator-core.js');

// ---------------------------------------------------------------------------
// Deterministic JSON serialization
// ---------------------------------------------------------------------------

/**
 * JSON.stringify with recursively sorted object keys, so the same logical
 * object always produces the same byte string regardless of property
 * insertion order. Arrays keep their existing order (order is meaningful
 * for arrays like identityTopCandidates, reasons, etc.).
 */
function stableStringify(value) {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === 'object') {
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortKeysDeep(value[key]);
    }
    return sorted;
  }
  return value;
}

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

/**
 * Deep-clones an object while deleting any key in VOLATILE_KEYS at any
 * depth. Used to make sure timestamps (e.g. sourceProvenance.retrievedAt)
 * never influence a deterministic fingerprint, per Phase 4.1A spec §13:
 * "Timestamps must not affect proposal IDs, proposal fingerprints or queue
 * fingerprints."
 */
const VOLATILE_KEYS = new Set(['retrievedAt', 'generatedAt', 'exportedAt', 'reviewedAt']);

function stripVolatile(value) {
  if (Array.isArray(value)) {
    return value.map(stripVolatile);
  }
  if (value !== null && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value)) {
      if (VOLATILE_KEYS.has(key)) continue;
      out[key] = stripVolatile(value[key]);
    }
    return out;
  }
  return value;
}

/** Deterministic fingerprint of an object: sha256 of the volatile-stripped, key-sorted JSON. */
function fingerprintOf(value) {
  return sha256Hex(stableStringify(stripVolatile(value)));
}

// ---------------------------------------------------------------------------
// Completeness formula + ArcheoMaps record snapshot builder
//
// SINGLE SOURCE OF TRUTH: both live in curator/curator-core.js (not here),
// because that file is loaded by the browser curator page too. Re-exported
// from here purely for convenience so pipeline scripts only need to
// `require('./lib.js')`. See curator-core.js for the full formula
// documentation and the exact fields the dataset does/doesn't have.
// ---------------------------------------------------------------------------

const { COMPLETENESS_CONFIG, computeCompleteness, buildArcheomapsSnapshot } = CuratorCore;

module.exports = {
  stableStringify,
  sha256Hex,
  stripVolatile,
  fingerprintOf,
  COMPLETENESS_CONFIG,
  computeCompleteness,
  buildArcheomapsSnapshot,
};
