# Review Decisions Validation Report

Validated at: 2026-08-26T17:17:04.761Z

**Overall: FAILED ❌**

This validator produces a report only. It never generates a patch, attaches a UNESCO ID, modifies a record, adds a record, or auto-approves a decision.

Overall pass/fail is determined entirely by `CuratorCore.validateImportPayload()` — the same shared function the browser import path calls — plus a file-integrity check that this validator itself never mutated its inputs. The table below buckets the same result for readability; it does not add or remove failure conditions.

## File checks

| Check | Result | Detail |
|---|---|---|
| decisions-file-valid-json | PASS |  |
| queue-file-valid-json | PASS |  |
| dataset-file-valid-json | PASS |  |

## Contract checks

| Check | Result |
|---|---|
| schema-version-correct | PASS |
| queue-version-matches | PASS |
| queue-fingerprint-well-formed | PASS |
| queue-fingerprint-matches | PASS |
| exported-at-valid | PASS |
| no-unknown-top-level-properties | PASS |
| decision-counts-shape-valid | FAIL |
| decisions-is-array | PASS |
| unreviewed-is-array | PASS |
| unique-proposal-decisions | PASS |
| unreviewed-no-duplicates | PASS |
| unreviewed-ids-belong-to-queue | PASS |
| no-proposal-in-both-collections | FAIL |
| every-queue-item-accounted-for | FAIL |
| per-decision-validation-clean | FAIL |

## Full contract error list

- decisions[0] (IDENTITY_MATCH::unesco::4): Missing or invalid required field "queueVersion".; Missing or invalid required field "proposalType".; Missing or invalid required field "source".; Missing or invalid required field "targetArcheomapsId".; Missing or invalid required field "evidenceVersion".; Missing or invalid required field "proposalFingerprint".; reviewedAt is missing or not a valid ISO 8601 date-time string.
- proposalId "IDENTITY_MATCH::unesco::4" is missing from BOTH decisions and unreviewedProposalIds (every queue item must be accounted for exactly once).
- Declared decisionCounts.APPROVE (1) does not match the recomputed value (0).
- Declared decisionCounts.unreviewed (61) does not match the recomputed value (62).

## Decision-count accounting

```json
{
  "declared": {
    "APPROVE": 1,
    "EDIT": 0,
    "NEEDS_RESEARCH": 0,
    "REJECT": 0,
    "DEFER": 0,
    "total": 62,
    "unreviewed": 61
  },
  "recomputed": {
    "APPROVE": 0,
    "EDIT": 0,
    "NEEDS_RESEARCH": 0,
    "REJECT": 0,
    "DEFER": 0,
    "total": 62,
    "unreviewed": 62
  }
}
```

## Per-decision errors

- **IDENTITY_MATCH::unesco::4**: Missing or invalid required field "queueVersion".; Missing or invalid required field "proposalType".; Missing or invalid required field "source".; Missing or invalid required field "targetArcheomapsId".; Missing or invalid required field "evidenceVersion".; Missing or invalid required field "proposalFingerprint".; reviewedAt is missing or not a valid ISO 8601 date-time string.

## No-mutation confirmation

Source files (decisions export, authoritative dataset) were byte-identical before and after this run: **confirmed**.
