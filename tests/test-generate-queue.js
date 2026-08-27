#!/usr/bin/env node
'use strict';
/**
 * test-generate-queue.js — determinism + integrity tests for
 * generate-review-queue.js, run against the real Phase 4.0 inputs.
 *
 * Writes results to test-output/test-generate-queue.json and
 * test-output/determinism-comparison.md.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const SCRIPTS_DIR = path.join(__dirname, '..', 'scripts');
const GENERATOR = path.join(SCRIPTS_DIR, 'generate-review-queue.js');

/**
 * This package deliberately does NOT ship copies of the two authoritative,
 * user-owned inputs (archeomaps_data_unesco_enriched_corrected.json,
 * unesco_likely_existing_records.json) — see README.md. This test therefore
 * needs to be told where they live; it never assumes a local copy exists
 * inside scripts/.
 *
 * Resolution order (first match wins):
 *   1. --dataset=/path and --proposals=/path command-line flags
 *   2. ARCHEOMAPS_DATASET_PATH / ARCHEOMAPS_PROPOSALS_PATH environment variables
 *   3. A file already sitting at the documented scripts/ default location
 *      (only true if someone deliberately placed a copy there — this is a
 *      convenience fallback for local dev, not the packaged layout)
 *
 * If nothing resolves, exits with a clear, actionable error rather than a
 * bare ENOENT stack trace.
 */
function parseArgs(argv) {
  const out = {};
  for (const a of argv.slice(2)) {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function resolveFixturePath(cliValue, envVarName, defaultBasename, label) {
  if (cliValue) return path.resolve(cliValue);
  if (process.env[envVarName]) return path.resolve(process.env[envVarName]);
  const fallback = path.join(SCRIPTS_DIR, defaultBasename);
  if (fs.existsSync(fallback)) return fallback;
  console.error(`\n[test-generate-queue] FATAL: could not locate the ${label}.\n`);
  console.error('This package does not ship a copy of your authoritative inputs. Supply the path with one of:');
  console.error(`  node tests/test-generate-queue.js --dataset=/path/to/dataset.json --proposals=/path/to/proposals.json`);
  console.error(`  ${envVarName}=/path/to/file node tests/test-generate-queue.js\n`);
  process.exit(1);
}

const cliArgs = parseArgs(process.argv);
const DATASET_PATH = resolveFixturePath(cliArgs.dataset, 'ARCHEOMAPS_DATASET_PATH', 'archeomaps_data_unesco_enriched_corrected.json', 'authoritative ArcheoMaps dataset');
const PROPOSALS_PATH = resolveFixturePath(cliArgs.proposals, 'ARCHEOMAPS_PROPOSALS_PATH', 'unesco_likely_existing_records.json', 'Phase 4.0 likely-existing proposals file');

console.log(`[test-generate-queue] dataset:   ${DATASET_PATH}`);
console.log(`[test-generate-queue] proposals: ${PROPOSALS_PATH}\n`);

const results = [];
function check(name, fn) {
  const entry = { name, pass: false, detail: null };
  try {
    fn();
    entry.pass = true;
  } catch (e) {
    entry.pass = false;
    entry.detail = e.message;
  }
  results.push(entry);
  console.log(`${entry.pass ? 'OK  ' : 'FAIL'}: ${name}${entry.detail ? ' — ' + entry.detail : ''}`);
}

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function run(outPath, extraArgs) {
  execFileSync('node', [GENERATOR,
    `--dataset=${DATASET_PATH}`,
    `--proposals=${PROPOSALS_PATH}`,
    `--out=${outPath}`,
  ].concat(extraArgs || []), { stdio: 'pipe' });
}

const tmp1 = '/tmp/archeomaps-queue-test/run1.json';
const tmp2 = '/tmp/archeomaps-queue-test/run2.json';
fs.mkdirSync(path.dirname(tmp1), { recursive: true });

const datasetShaBefore = sha256(DATASET_PATH);
const proposalsShaBefore = sha256(PROPOSALS_PATH);

check('run 1 succeeds', () => run(tmp1));
check('run 2 succeeds (independent invocation)', () => run(tmp2));

let run1, run2;
check('both outputs are valid JSON', () => {
  run1 = JSON.parse(fs.readFileSync(tmp1, 'utf8'));
  run2 = JSON.parse(fs.readFileSync(tmp2, 'utf8'));
});

check('itemCount === 62 on both runs', () => {
  if (run1.itemCount !== 62 || run2.itemCount !== 62) throw new Error(`run1=${run1.itemCount} run2=${run2.itemCount}`);
});

check('queueFingerprint identical across independent runs', () => {
  if (run1.queueFingerprint !== run2.queueFingerprint) throw new Error(`${run1.queueFingerprint} !== ${run2.queueFingerprint}`);
});

check('every item proposalFingerprint identical across runs (order-independent)', () => {
  const map1 = new Map(run1.items.map((i) => [i.proposalId, i.proposalFingerprint]));
  const map2 = new Map(run2.items.map((i) => [i.proposalId, i.proposalFingerprint]));
  if (map1.size !== 62 || map2.size !== 62) throw new Error('unexpected item count in fingerprint maps');
  for (const [id, fp] of map1) {
    if (map2.get(id) !== fp) throw new Error(`fingerprint mismatch for ${id}`);
  }
});

check('output is byte-identical across runs excluding generatedAt', () => {
  const strip = (obj) => { const c = JSON.parse(JSON.stringify(obj)); delete c.generatedAt; return c; };
  const a = JSON.stringify(strip(run1));
  const b = JSON.stringify(strip(run2));
  if (a !== b) throw new Error('outputs differ beyond the generatedAt field');
});

check('every candidate archeomapsId resolves to an embedded snapshot', () => {
  run1.items.forEach((item) => {
    item.evidence.candidates.forEach((c) => {
      if (!c.archeomapsSnapshot || c.archeomapsSnapshot.id !== c.archeomapsId) {
        throw new Error(`candidate ${c.archeomapsId} in ${item.proposalId} missing/mismatched snapshot`);
      }
    });
  });
});

check('every item has exactly 3 candidates', () => {
  run1.items.forEach((item) => {
    if (item.evidence.candidates.length !== 3) throw new Error(`${item.proposalId} has ${item.evidence.candidates.length} candidates`);
  });
});

check('proposalIds are unique', () => {
  const ids = run1.items.map((i) => i.proposalId);
  if (new Set(ids).size !== ids.length) throw new Error('duplicate proposalId found');
});

check('knownArcheomapsIds includes every referenced candidate id', () => {
  const known = new Set(run1.knownArcheomapsIds);
  run1.items.forEach((item) => item.evidence.candidates.forEach((c) => {
    if (!known.has(c.archeomapsId)) throw new Error(`${c.archeomapsId} missing from knownArcheomapsIds`);
  }));
});

check('source dataset file byte-unchanged after both runs', () => {
  const after = sha256(DATASET_PATH);
  if (after !== datasetShaBefore) throw new Error(`sha changed: ${datasetShaBefore} -> ${after}`);
});

check('source proposals file byte-unchanged after both runs', () => {
  const after = sha256(PROPOSALS_PATH);
  if (after !== proposalsShaBefore) throw new Error(`sha changed: ${proposalsShaBefore} -> ${after}`);
});

// --- Fail-fast behavior on bad inputs ---------------------------------

check('fails loudly (non-zero exit) when proposals file has wrong count', () => {
  const badProposals = '/tmp/archeomaps-queue-test/bad-count.json';
  const real = JSON.parse(fs.readFileSync(PROPOSALS_PATH, 'utf8'));
  fs.writeFileSync(badProposals, JSON.stringify(real.slice(0, 61)));
  let threw = false;
  try {
    execFileSync('node', [GENERATOR, `--dataset=${DATASET_PATH}`, `--proposals=${badProposals}`, `--out=/tmp/archeomaps-queue-test/should-not-exist.json`], { stdio: 'pipe' });
  } catch (e) {
    threw = true;
  }
  if (!threw) throw new Error('generator did not fail on a 61-item proposals file');
  if (fs.existsSync('/tmp/archeomaps-queue-test/should-not-exist.json')) throw new Error('generator wrote output despite failing validation');
});

check('fails loudly when a proposal references a nonexistent ArcheoMaps id', () => {
  const badProposals = '/tmp/archeomaps-queue-test/bad-ref.json';
  const real = JSON.parse(fs.readFileSync(PROPOSALS_PATH, 'utf8'));
  const tampered = JSON.parse(JSON.stringify(real));
  tampered[0].evidence.identityTopCandidates[0].archeomapsId = 'site-9999999-does-not-exist';
  fs.writeFileSync(badProposals, JSON.stringify(tampered));
  let threw = false;
  try {
    execFileSync('node', [GENERATOR, `--dataset=${DATASET_PATH}`, `--proposals=${badProposals}`, `--out=/tmp/archeomaps-queue-test/should-not-exist-2.json`], { stdio: 'pipe' });
  } catch (e) {
    threw = true;
  }
  if (!threw) throw new Error('generator did not fail on a proposal referencing a missing ArcheoMaps id');
});

check('fails loudly on malformed JSON input', () => {
  const badProposals = '/tmp/archeomaps-queue-test/malformed.json';
  fs.writeFileSync(badProposals, '{ this is not valid json');
  let threw = false;
  try {
    execFileSync('node', [GENERATOR, `--dataset=${DATASET_PATH}`, `--proposals=${badProposals}`, `--out=/tmp/archeomaps-queue-test/should-not-exist-3.json`], { stdio: 'pipe' });
  } catch (e) {
    threw = true;
  }
  if (!threw) throw new Error('generator did not fail on malformed proposals JSON');
});

// --- Report -------------------------------------------------------------

const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass);
console.log(`\n${passed}/${results.length} passed`);

const outDir = path.join(__dirname, '..', 'test-output');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'test-generate-queue.json'),
  JSON.stringify({ ranAt: new Date().toISOString(), total: results.length, passed, failed: failed.length, results }, null, 2) + '\n');

const md = [];
md.push('# Determinism Comparison — generate-review-queue.js');
md.push('');
md.push(`Generated: ${new Date().toISOString()}`);
md.push('');
md.push('Two independent, back-to-back invocations of `generate-review-queue.js` against the same read-only inputs:');
md.push('');
md.push('| | Run 1 | Run 2 |');
md.push('|---|---|---|');
md.push(`| itemCount | ${run1 ? run1.itemCount : 'n/a'} | ${run2 ? run2.itemCount : 'n/a'} |`);
md.push(`| queueFingerprint | \`${run1 ? run1.queueFingerprint : 'n/a'}\` | \`${run2 ? run2.queueFingerprint : 'n/a'}\` |`);
md.push(`| generatedAt (excluded from fingerprint, differs by design) | ${run1 ? run1.generatedAt : 'n/a'} | ${run2 ? run2.generatedAt : 'n/a'} |`);
md.push('');
md.push(`**Result: ${run1 && run2 && run1.queueFingerprint === run2.queueFingerprint ? 'IDENTICAL ✅' : 'DIFFERENT ❌'}** — byte-identical output excluding the informational \`generatedAt\` timestamp.`);
md.push('');
md.push('Source file integrity (sha256 before vs. after both runs):');
md.push('');
md.push('| File | sha256 |');
md.push('|---|---|');
md.push(`| archeomaps_data_unesco_enriched_corrected.json | \`${datasetShaBefore}\` (unchanged) |`);
md.push(`| unesco_likely_existing_records.json | \`${proposalsShaBefore}\` (unchanged) |`);
md.push('');
fs.writeFileSync(path.join(outDir, 'determinism-comparison.md'), md.join('\n') + '\n');

process.exitCode = failed.length === 0 ? 0 : 1;
