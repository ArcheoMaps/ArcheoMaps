# Production Migration Validation Report

**Migration date:** 2026-08-20 · **Source:** `archeomaps_1.html` (untouched) · **Output:** `archeomaps_migrated.html`

## Result: PASS — all checks green, zero errors

## What was migrated

2,103 source records, dispatched deterministically against **9 frozen sources** (no runtime historical/semantic/regex classification):

| Source | Records | Disposition |
|---|---|---|
| `LEGACY_TYPE_MAPPING_VALUE_DEFAULT` (Part B, scan-dependent population default) | 556 | CONDITIONAL, flagged `provisional` |
| `NULL_TYPE_DECISION_MATRIX` | 537 | mixed REVIEW/RESEARCH/CONDITIONAL |
| `LEGACY_TYPE_MAPPING_EXCEPTION_TABLE` (Part B, individually adjudicated) | 494 | mixed |
| `RUINS_DECISION_MATRIX` | 346 | mixed |
| `PREVIOUS_DIFFICULT_GROUPS_DECISION_MATRIX` (Pyramid/Cairn/Mound/Wall) | 110 | mixed |
| `LEGACY_TYPE_MAPPING_CLASS_A` (uniform legacy-value mapping) | 39 | CONDITIONAL |
| `MIGRATION_RULES_FOREST` | 9 | mixed |
| `MIGRATION_RULES_OBSERVATORY` | 8 | mixed |
| `LEGACY_TYPE_MAPPING_CLASS_D` (REVIEW_VALUE) | 4 | REVIEW |

**Final state totals:** 1,346 CONDITIONAL (resolved) · 332 REVIEW · 425 RESEARCH · 556 of the CONDITIONAL records additionally flagged `provisional` (scan-dependent, not individually confirmed). Every REVIEW/RESEARCH/provisional record is listed in `POST_MIGRATION_ENRICHMENT_BACKLOG.md` — confirmed by direct set-comparison against the manifest (0 missing).

## Checks performed (all passed)

- **Counts:** source = 2,103, migrated = 2,103.
- **ID integrity:** source ID set == migrated ID set; zero duplicates in either; zero records lost; zero unauthorized records added.
- **Legacy preservation:** all 16 original fields (`n, lat, lon, era, eraLabel, culture, type, year, text, img, category, typeSource, eraSource, cultureSource, id, continent`) byte-identical between source and migrated records — `type` is never renamed, blanked, or repurposed (MIGRATION_RULES.md §3.2).
- **Vocabulary:** every non-null `canonicalType` is one of TAXONOMY.md v1.3's 14 Types; every tag is `namespace:value` with the namespace in TAXONOMY.md's 14 approved namespaces. Zero violations.
- **Provenance (§4):** every record has `provenance.type {value, legacyValue, method, ruleId, policyVersion, sourceFields, notes}`. `method` is `"conditional"` for per-record rule-chain hits, `"auto"` for uniform/default legacy-value mappings, and `null` for unresolved REVIEW/RESEARCH records (matching MIGRATION_RULES.md §4.3's own "unresolved research item" example: `value: null, method: null`). `provenance.tags` is value-level, one entry per tag.
- **Workflow (§5):** `workflow.type` object created **only** for the 757 REVIEW/RESEARCH records (332 + 425); the 1,346 CONDITIONAL records carry no `workflow.type` object at all, per §5.3 rule 1. State/`canonicalType` consistency verified for all 2,103 records (null value ⇔ has workflow object in review/research state; non-null value ⇔ no workflow object).
- **Observatory functions (§14):** the 2 records resolved by `OBSERVATORY_PURPOSEBUILT_01` (Cheomseongdae, Chankillo) additionally carry a `provenance.functions` entry for `astronomical`, per that rule's explicit documented behavior — no other record does.
- **Duplicates (§6):** Dun Carloway Broch (site-0508/site-0811) and Etowah Indian Mounds (site-0745/site-0862) both flagged `duplicateStatus: "confirmed-duplicate"`, `deduplicationStatus: "unresolved"` — both copies independently classified, neither merged or deleted.
- **Truncation safety:** no RESEARCH/REVIEW record was assigned a resolved `canonicalType`; truncated-text evidence was only ever used where the frozen source documents had already ruled it admissible.
- **Determinism/idempotency:** migration script re-run twice produced byte-identical output (`sha256` match) both times.
- **Original file integrity:** `archeomaps_1.html` was only ever read, never written; its `SITES` block hash was recorded before migration and confirmed unchanged after (`sha256: 4c23cd5b...`).
- **No runtime classification:** the migration script performs a pure per-ID dictionary lookup into the pre-built, pre-validated manifest — no regex/keyword/semantic evaluation of record `text` occurs during this step (all such evaluation happened earlier, producing the frozen manifest).

## Named regression cases (all correct)

| Record | ID | canonicalType | Tags |
|---|---|---|---|
| Land of Frankincense | site-1586 | Other | — |
| Tusi Sites | site-1967 | Archaeological Site | — |
| Chief Roi Mata's Domain | site-2006 | Archaeological Site | — |
| Flemish Béguinages | site-2082 | Religious Site | `religion:religious` |
| Viking Longhouse | site-0209 | Other | `architecture:house` |

## Task 3 reconciliation note (no MIGRATION_RULES.md edit made)

`PREVIOUS_DIFFICULT_GROUPS_DECISION_MATRIX.md`'s existing "Divergences from `MIGRATION_RULES.md`'s embedded `found_in_current_dataset` counts" section already states plainly that the ID-keyed audit supersedes the stale v1-era aggregate counts for the 110 Pyramid/Cairn/Mound/Wall records, and explicitly confirms it does not modify `MIGRATION_RULES.md` itself. That note fully satisfies Task 3(1)'s requirement; no additional edit to `MIGRATION_RULES.md` was made, consistent with treating it as a frozen authority. The Western Wall / missing-Religious-Site chain gap (site-1641) was left unresolved (REVIEW) and is in the backlog with a POLICY REVIEW recommendation — it did not block migration of the other 2,102 records.

## Deliverables

1. `POST_MIGRATION_ENRICHMENT_BACKLOG.md` — 1,314 unique backlog entries.
2. `MIGRATION_MANIFEST.json` — the frozen, validated 2,103-record migration manifest (deterministic input to the migration step).
3. `archeomaps_migrated.html` — the migrated dataset. `archeomaps_1.html` remains untouched.
4. This report.

**The 2,103-record migration is complete and validated. Perfection and historical enrichment are deferred to the backlog, as instructed.**
