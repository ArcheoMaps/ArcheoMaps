#!/usr/bin/env node
'use strict';
/**
 * validate-review-decisions.js — ArcheoMaps Phase 4.1A (v1.1)
 *
 * Read-only validator for an exported review_decisions.json. Produces a
 * report only:
 *   - review_decisions_validation.json  (machine-readable)
 *   - review_decisions_validation_report.md (human-readable)
 *
 * This script NEVER:
 *   - generates a patch
 *   - attaches UNESCO IDs
 *   - modifies any record
 *   - adds a record
 *   - auto-approves a decision
 *
 * v1.1 change: overall pass/fail is now determined ENTIRELY by
 * CuratorCore.validateImportPayload() — the exact same function
 * curator.js calls on import in the browser. Everything else in this
 * script (the "Checks" table, the no-mutation check) is reporting detail
 * layered on top of that single source of truth; it cannot diverge from
 * what the browser accepts or rejects, by construction.
 *
 * Usage:
 *   node validate-review-decisions.js \
 *     --decisions=/path/to/review_decisions.json \
 *     --queue=/path/to/curator/review_queue.json \
 *     --dataset=/path/to/archeomaps_data_unesco_enriched_corrected.json \
 *     --outdir=/path/to/output/dir
 */

const fs = require('fs');
const path = require('path');
const CuratorCore = require('../curator/curator-core.js');

function parseArgs(argv) {
  const out = {};
  for (const a of argv.slice(2)) {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function readJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    return { error: `${label} not found at ${filePath}` };
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return { value: JSON.parse(raw), raw };
  } catch (e) {
    return { error: `${label} is not valid JSON: ${e.message}` };
  }
}

// Buckets the flat error list from validateImportPayload into named,
// human-scannable checks for the report table. Purely presentational —
// does not change what passes or fails (that's `contractResult.valid`).
const ERROR_PATTERNS = [
  { name: 'schema-version-correct', re: /Unsupported schemaVersion/ },
  { name: 'queue-version-matches', re: /queueVersion .* does not match loaded queue/ },
  { name: 'queue-fingerprint-well-formed', re: /queueFingerprint is missing or malformed/ },
  { name: 'queue-fingerprint-matches', re: /queueFingerprint does not match the loaded queue/ },
  { name: 'exported-at-valid', re: /exportedAt is missing or not a valid/ },
  { name: 'no-unknown-top-level-properties', re: /Unknown top-level export property/ },
  { name: 'decision-counts-shape-valid', re: /decisionCounts/ },
  { name: 'decisions-is-array', re: /no decisions array/ },
  { name: 'unreviewed-is-array', re: /no unreviewedProposalIds array/ },
  { name: 'unique-proposal-decisions', re: /Duplicate decision/ },
  { name: 'unreviewed-no-duplicates', re: /Duplicate unreviewed proposalId/ },
  { name: 'unreviewed-ids-belong-to-queue', re: /not in the loaded queue/ },
  { name: 'no-proposal-in-both-collections', re: /BOTH decisions and unreviewedProposalIds/ },
  { name: 'every-queue-item-accounted-for', re: /missing from BOTH decisions and unreviewedProposalIds/ },
  { name: 'per-decision-validation-clean', re: /^decisions\[\d+\]/ },
];

function bucketChecks(errors) {
  return ERROR_PATTERNS.map((p) => ({
    name: p.name,
    pass: !errors.some((e) => p.re.test(e)),
  }));
}

function main() {
  const args = parseArgs(process.argv);
  const scriptDir = __dirname;
  const decisionsPath = path.resolve(args.decisions || path.join(scriptDir, 'review_decisions.json'));
  const queuePath = path.resolve(args.queue || path.join(scriptDir, '..', 'curator', 'review_queue.json'));
  const datasetPath = path.resolve(args.dataset || path.join(scriptDir, 'archeomaps_data_unesco_enriched_corrected.json'));
  const outDir = path.resolve(args.outdir || scriptDir);

  const report = {
    validatedAt: new Date().toISOString(),
    inputs: { decisionsPath, queuePath, datasetPath },
    fileChecks: [],
    namedChecks: [],
    contractErrors: [],
    perDecisionErrors: [],
    accounting: {},
    noMutationConfirmed: null,
    overallValid: false,
  };

  const fileChecks = [];
  const addFileCheck = (name, pass, detail) => fileChecks.push({ name, pass, detail: detail || null });

  const decisionsBefore = fs.existsSync(decisionsPath) ? fs.readFileSync(decisionsPath, 'utf8') : null;
  const datasetBefore = fs.existsSync(datasetPath) ? fs.readFileSync(datasetPath, 'utf8') : null;

  const decisionsRes = readJson(decisionsPath, 'review_decisions.json');
  const queueRes = readJson(queuePath, 'review_queue.json');
  const datasetRes = readJson(datasetPath, 'authoritative ArcheoMaps dataset');

  addFileCheck('decisions-file-valid-json', !decisionsRes.error, decisionsRes.error);
  addFileCheck('queue-file-valid-json', !queueRes.error, queueRes.error);
  addFileCheck('dataset-file-valid-json', !datasetRes.error, datasetRes.error);

  report.fileChecks = fileChecks;

  if (decisionsRes.error || queueRes.error || datasetRes.error) {
    report.overallValid = false;
    finish();
    return;
  }

  const payload = decisionsRes.value;
  const queue = queueRes.value;
  const dataset = datasetRes.value;

  const queueItemsById = {};
  (queue.items || []).forEach((it) => { queueItemsById[it.proposalId] = it; });
  const knownArcheomapsIds = new Set((dataset || []).map((r) => r.id));

  const contractResult = CuratorCore.validateImportPayload(payload, queue, knownArcheomapsIds);

  const perDecisionErrors = [];
  (Array.isArray(payload.decisions) ? payload.decisions : []).forEach((d, idx) => {
    const result = CuratorCore.validateDecision(d, queueItemsById, knownArcheomapsIds);
    if (!result.valid) perDecisionErrors.push({ index: idx, proposalId: d && d.proposalId, errors: result.errors });
  });

  const decisionsAfter = fs.readFileSync(decisionsPath, 'utf8');
  const datasetAfter = fs.readFileSync(datasetPath, 'utf8');
  const noMutation = decisionsAfter === decisionsBefore && datasetAfter === datasetBefore;

  report.namedChecks = bucketChecks(contractResult.errors);
  report.contractErrors = contractResult.errors;
  report.perDecisionErrors = perDecisionErrors;
  report.accounting = { declared: payload.decisionCounts, recomputed: contractResult.recomputedCounts };
  report.noMutationConfirmed = noMutation;
  report.overallValid = contractResult.valid && noMutation && fileChecks.every((c) => c.pass);

  finish();

  function finish() {
    fs.mkdirSync(outDir, { recursive: true });
    const jsonOut = path.join(outDir, 'review_decisions_validation.json');
    const mdOut = path.join(outDir, 'review_decisions_validation_report.md');
    fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2) + '\n', 'utf8');
    fs.writeFileSync(mdOut, renderMarkdown(report), 'utf8');
    process.stdout.write(`Validation ${report.overallValid ? 'PASSED' : 'FAILED'}. Wrote ${jsonOut} and ${mdOut}\n`);
    process.exitCode = report.overallValid ? 0 : 1;
  }
}

function renderMarkdown(report) {
  const lines = [];
  lines.push('# Review Decisions Validation Report');
  lines.push('');
  lines.push(`Validated at: ${report.validatedAt}`);
  lines.push('');
  lines.push(`**Overall: ${report.overallValid ? 'PASSED ✅' : 'FAILED ❌'}**`);
  lines.push('');
  lines.push('This validator produces a report only. It never generates a patch, attaches a UNESCO ID, modifies a record, adds a record, or auto-approves a decision.');
  lines.push('');
  lines.push('Overall pass/fail is determined entirely by `CuratorCore.validateImportPayload()` — the same shared function the browser import path calls — plus a file-integrity check that this validator itself never mutated its inputs. The table below buckets the same result for readability; it does not add or remove failure conditions.');
  lines.push('');
  lines.push('## File checks');
  lines.push('');
  lines.push('| Check | Result | Detail |');
  lines.push('|---|---|---|');
  (report.fileChecks || []).forEach((c) => {
    lines.push(`| ${c.name} | ${c.pass ? 'PASS' : 'FAIL'} | ${c.detail ? String(c.detail).replace(/\|/g, '\\|') : ''} |`);
  });
  lines.push('');
  if (report.namedChecks && report.namedChecks.length) {
    lines.push('## Contract checks');
    lines.push('');
    lines.push('| Check | Result |');
    lines.push('|---|---|');
    report.namedChecks.forEach((c) => lines.push(`| ${c.name} | ${c.pass ? 'PASS' : 'FAIL'} |`));
    lines.push('');
  }
  if (report.contractErrors && report.contractErrors.length) {
    lines.push('## Full contract error list');
    lines.push('');
    report.contractErrors.forEach((e) => lines.push(`- ${e}`));
    lines.push('');
  }
  lines.push('## Decision-count accounting');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(report.accounting, null, 2));
  lines.push('```');
  lines.push('');
  if (report.perDecisionErrors && report.perDecisionErrors.length) {
    lines.push('## Per-decision errors');
    lines.push('');
    report.perDecisionErrors.forEach((e) => {
      lines.push(`- **${e.proposalId || '(unknown proposalId)'}**: ${e.errors.join('; ')}`);
    });
    lines.push('');
  }
  lines.push('## No-mutation confirmation');
  lines.push('');
  lines.push(`Source files (decisions export, authoritative dataset) were byte-identical before and after this run: **${report.noMutationConfirmed ? 'confirmed' : 'NOT CONFIRMED — investigate'}**.`);
  lines.push('');
  return lines.join('\n');
}

main();
