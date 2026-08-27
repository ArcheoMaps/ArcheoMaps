# Review Decisions Validation Report

Validated at: 2026-08-26T17:17:04.642Z

**Overall: PASSED ✅**

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
| decision-counts-shape-valid | PASS |
| decisions-is-array | PASS |
| unreviewed-is-array | PASS |
| unique-proposal-decisions | PASS |
| unreviewed-no-duplicates | PASS |
| unreviewed-ids-belong-to-queue | PASS |
| no-proposal-in-both-collections | PASS |
| every-queue-item-accounted-for | PASS |
| per-decision-validation-clean | PASS |

## Decision-count accounting

```json
{
  "declared": {
    "APPROVE": 1,
    "EDIT": 1,
    "NEEDS_RESEARCH": 1,
    "REJECT": 1,
    "DEFER": 1,
    "total": 62,
    "unreviewed": 57
  },
  "recomputed": {
    "APPROVE": 1,
    "EDIT": 1,
    "NEEDS_RESEARCH": 1,
    "REJECT": 1,
    "DEFER": 1,
    "total": 62,
    "unreviewed": 57
  }
}
```

## No-mutation confirmation

Source files (decisions export, authoritative dataset) were byte-identical before and after this run: **confirmed**.
