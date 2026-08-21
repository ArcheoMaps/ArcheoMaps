# ArcheoMaps — Migration Rules

Status: **STABLE — specification only.** No code has been written. `SITES`, `archeomaps_1.html`, and `TAXONOMY.md` have not been touched to produce this document.

This is **v2.5** of this document. v2 was produced by an independent audit of v1 (the first policy draft) against `TAXONOMY.md`, `MIGRATION_DRY_RUN.md`, `claude/ARCHEOMAPS_AUDIT.md`, `claude/ARCHEOMAPS_MIGRATION_PLAN.md`, and the live `archeomaps_1.html` data; that history is preserved below and in §20. v2.1 was a targeted, specification-only correction pass over v2 addressing two structural inconsistencies a follow-up audit found — nothing else was redesigned:

1. §7 (Rule Precedence & Fallback Standard) previously modeled a chain's terminal point as always a single rule, but the Mound and Wall chains both actually use two mutually exclusive terminal rules (a `*_NO_SIGNAL_01 → RESEARCH` / `*_FALLBACK_01 → REVIEW` pair). §7.3 now formally defines this as a third, explicit fallback form — a **branching terminal fallback** — used only where the branch conditions are mutually exclusive and, together, exhaust every record reaching that point. See §7.3 form 3 and §7.5.
2. §5.3 rule 1 previously contradicted itself about whether a successful `AUTO`/`CONDITIONAL` classification gets a `workflow.type` entry. It now unambiguously does not: `workflow.type` exists only for a record that actually enters a human workflow step (REVIEW, RESEARCH, or their resolutions). Provenance (§4) alone is the complete audit trail for a clean automatic classification. The now-unreachable `"unresolved"` state was dropped from the `workflow.type.state` enum as a direct consequence.

A mechanical consistency pass across every rule chain in §9–§12 (precedence, every fallback, every terminal branch, reachability) was then run against the corrected §7/§5 model; it is documented in full in §7.5 and found and fixed one further defect (`PYRAMID_CITY_AMBIGUOUS_01` was unreachable) — no classification outcome changed as a result. No taxonomy vocabulary, record-scope principle, REVIEW/RESEARCH semantics, provenance architecture, duplicate-handling model, or regression-case intent was touched beyond what these two fixes strictly required in wording.

**v2.2 was a purely additive record-group extension merging `Forest` (§13)**, using the same record-level Decision Matrix method already used for Pyramid/Cairn/Mound/Wall, including one mid-inspection correction (the **truncated-text evidence rule**: a classification resting on the *absence* of competing evidence cannot be established from a record whose `text` is visibly truncated before completion, even though a classification resting on *positive* explicit evidence still can be). See `FOREST_SACRED_01`, `FOREST_NATURAL_COMPLETE_01`, and `FOREST_INSUFFICIENT_EVIDENCE_01` (§13) for the worked rules this produced.

**v2.3 is a second purely additive record-group extension, produced under the same process (§19, Future Extension) — it merges `Observatory` (§14).** This is the group `MIGRATION_RULES.md` v2.1's own Future Extension notes flagged as carrying "the highest interpretive stakes of any remaining legacy value," because the legacy string `Observatory` is spelled identically to the canonical Type of the same name. The inspection confirmed that risk was real and successfully guarded against: of 8 legacy-`Observatory` records, only 2 actually satisfy canonical `Observatory` on positive, record-specific evidence; 3 records that are both legacy-typed *and named* "Observatory" turned out to be `Monument`, because their own text establishes a stone-circle/henge/megalithic physical form and `TAXONOMY.md` §4.3 already reserves `Observatory` for a site that is *itself* a purpose-built observation structure, not a monument that merely carries an astronomical reputation. This inspection also refined the general truncated-text evidence rule further: `OBSERVATORY_MONUMENT_FORM_01` (§14) makes explicit that a rule may correctly leave a Function unpopulated for lack of positive evidence without that silence being read as an assertion that the Function never existed — and the chain's terminal point was deliberately split into a genuine-information-gap RESEARCH rule (`OBSERVATORY_INSUFFICIENT_EVIDENCE_01`) followed by a true catch-all REVIEW rule (`OBSERVATORY_FALLBACK_01`), so that RESEARCH cannot silently become a universal fallback for every unmatched future record — see §14 for the full rationale.

Nothing in §1–§8 (principles and cross-cutting architecture) was reopened or redesigned by v2.2, v2.3, v2.4, or this v2.5 pass. The only other changes across all four additions are mechanical: the former §13–§16 (Safety Rules, Regression Cases, Future Extension, Deliberate Deviations) as of v2.2 became §14–§17, as of v2.3 became §15–§18, as of v2.4 became §16–§19, and as of this v2.5 pass become §17–§20 to make room for the new §16; every cross-reference, the version metadata, and the completed/pending group lists have been updated to match at each step — nothing about their content, logic, or intent was altered.

**v2.4 is a third purely additive record-group extension, produced under the same process (§19, Future Extension) — it merges `Ruins` (§15).** `"Ruins"` is not itself a canonical Type (`TAXONOMY.md` Migration Rule 14) and, at 346 records, is by far the largest legacy value processed by this document — larger than every other completed group combined. Its own inspection went through four passes rather than one, and is documented in full in §15's introduction: an initial full Decision Matrix, a structural-audit pass that found and corrected two systematic defects (a Settlement bucket assembled by keyword presence rather than record scope, echoing the exact `PYRAMID_CITY_01`/§8 failure mode this document has guarded against since v2; and `archaeology:ruins` applied mechanically from the legacy type rather than from independent positive evidence), an independent adversarial re-audit of the corrected Settlement bucket that found 13 further false positives the structural-audit pass had missed, and finally this formalization pass. The truncated-text evidence rule (§13, extended §14) governs a materially larger share of Ruins outcomes than any prior group, because this legacy value's `text` field is visibly truncated far more often than any other inspected so far — see §15's own `RUINS_INSUFFICIENT_EVIDENCE_01` for how this was resolved without letting RESEARCH become a universal fallback (`RUINS_FALLBACK_01`, a genuine general-purpose REVIEW terminal added for the same architectural-safety reason as `OBSERVATORY_FALLBACK_01`, §14).

**v2.4's own conclusion held that the taxonomy and migration architecture remained stable, with Ruins joining Pyramid, Cairn, Mound, Wall, Forest, and Observatory as a completed group**, and named record-level Decision Matrix work for `null`/missing Type as the next and final phase of the current migration programme. That record-level work is now done: an initial Decision Matrix covering all 537 live records whose legacy `type` is `null` was independently reviewed, correction pass v2 (51 of 537 rows changed, correcting four defects an independent review identified) was independently reviewed a second time, and a final narrow correction pass v3 (2 further rows changed) was approved as **PASS**. Final approved totals: **346 CONDITIONAL / 173 RESEARCH / 18 REVIEW / 0 AUTO** (537 total).

**v2.5 is a fourth purely additive record-group extension, produced under the same process (§19, Future Extension) — it formalizes the approved null/missing-Type Decision Matrix into explicit migration rules (§16).** `type === null` was found to be the qualifying population's only live representation (537 of 2,103 records; 0 records with a missing `type` property, an empty string, a whitespace-only string, or any other malformed/non-string equivalent), so §16's rule chain is formalized against that exact condition, not broadened to speculative future representations. The approved Decision Matrix's 27 active candidate buckets (plus one retired, zero-member bucket — `NULLTYPE_SETTLEMENT_NAMED_01`, folded into `NULLTYPE_OTHER_NAMED_01` before formalization) become this section's formal rule IDs, mechanically renamed only where needed to match this document's existing `<GROUP>_<CONDITION>_01` convention (none required renaming). No record-level outcome approved by the Decision Matrix was revisited or second-guessed during formalization — this is a rule-authoring pass over an already-closed classification decision, not a new classification pass. `TAXONOMY.md` v1.3 remains **MIGRATION-FROZEN**: the null/missing-Type inspection, like Forest's, Observatory's, and Ruins' before it, found no genuine taxonomy gap. **Conclusion of this pass: null/missing Type is now a completed group alongside Pyramid, Cairn, Mound, Wall, Forest, Observatory, and Ruins — all eight originally identified difficult legacy-Type groups are now formally covered by migration policy.** No live `SITES` data has been migrated or modified by this pass, or by any pass before it; this remains a specification-only document (§19's Future Extension mechanism remains open for any future legacy value, malformed representation, or taxonomy gap this programme has not yet encountered).

**A note on `claude_DECISION_MATRIX.md`:** this audit was asked to treat that file as evidence. It does not exist anywhere in this project — only `MIGRATION_RULES.md` (this document), `MIGRATION_DRY_RUN.md`, `TAXONOMY.md`, `claude/ARCHEOMAPS_AUDIT.md`, `claude/ARCHEOMAPS_MIGRATION_PLAN.md`, and `archeomaps_1.html` are present. The 110-record inspection (75 `Pyramid`, 2 `Cairn`, 15 `Mound`, 18 `Wall`) that a "Decision Matrix" would document was never captured as its own file — its findings survive only as the `found_in_current_dataset` counts and rationale embedded directly in v1 of this document, and as individual records verifiable directly against the live `SITES` array in `archeomaps_1.html`. Every specific factual claim in the audit brief that referenced "the Decision Matrix" was therefore checked instead against (a) those embedded v1 findings and (b) direct lookups against `archeomaps_1.html` where a specific record was named or described. Where that was possible, results are cited below with the actual record (e.g. *Prehistoric Mounds of Uruguay*, *Rujm el-Hiri*). Where it was not possible, that is stated. This is documented once here rather than repeated at every affected section. The Forest group added in v2.2 (§13), the Observatory group added in v2.3 (§14), the Ruins group added in v2.4 (§15), and the null/missing-Type group added in this v2.5 pass (§16) have no such gap: all of their records were directly and exhaustively inspected against the live `SITES` array, each with a standalone Decision Matrix produced and reviewed — for Ruins, reviewed and corrected across four passes, and for null/missing Type, reviewed and corrected across two independent narrow correction passes (v2, then v3) — before its rules were written.

This document turns the completed inspection (1,010 records: 75 `Pyramid`, 2 `Cairn`, 15 `Mound`, 18 `Wall`, 9 `Forest`, 8 `Observatory`, 346 `Ruins`, 537 `null`/missing Type — all inspected directly against the live `SITES` array, not sampled) into an explicit, auditable rule set that a future migration script can implement without making its own historical judgements.

> **The migration script must implement this policy. The migration script must never invent it.**

---

## 1. Migration Principles

### 1.1 Preserve, don't destroy
The legacy dataset is the source record. Migration is additive/transformative. No existing legacy value, field, or curated string is silently discarded, overwritten, or repurposed — not even when a rule below confidently produces a canonical value. Legacy fields (`type`, `category`, `secondaryType`, `culture`, `cultureSource`, `typeSource`, `era`, `eraLabel`) remain on the record after migration, unchanged, alongside the new canonical fields. **`type` specifically is never renamed, moved, or overwritten by this policy** — see §3, which exists precisely to resolve the apparent conflict between this rule and the need for a canonical Type value.

### 1.2 Legacy values are evidence, not truth
A legacy `type` string is a historical classification made by an earlier, less careful process. It is admissible evidence for a canonical Type, never a determination of it. `legacy type = Pyramid` does not imply `canonicalType = Monument` (or Tomb, or anything else) — the 75-record inspection exists precisely because that shortcut fails in practice.

### 1.3 Automate only deterministic decisions
A rule fires only when its condition is explicit and reproducible: two independent curators applying the same rule to the same record must reach the same result. If satisfying a rule requires judgement, plausibility, or "probably," it is not a migration rule — it is a REVIEW or RESEARCH item.

### 1.4 Uncertainty stays visible
A record that cannot be safely classified is not forced into a Type merely because the schema allows one. It is left in an explicit REVIEW or RESEARCH state, visible as such, until a human resolves it.

### 1.5 Research is a separate phase
Migration converts *existing* information into canonical form. It does not generate new information. Records whose existing `text`/description is too sparse to classify responsibly are routed to a later research/enrichment workflow — they are not "completed" by inference during migration.

### 1.6 Four categories, never mixed
Every problem a record can raise belongs to exactly one of these buckets, and they are not interchangeable:

| Category | Meaning | Migration response |
|---|---|---|
| **Taxonomy issue** | The canonical taxonomy genuinely lacks a representation | Escalate to taxonomy owners (§19); do not resolve inside migration |
| **Data quality issue** | Duplicate, malformed, inconsistent, or contradictory legacy data | Flag per §6; do not silently fix or delete |
| **Research required** | Taxonomy is sufficient, but the record's existing text is inadequate | RESEARCH state (§2) |
| **Normalization / migration** | The information already exists and needs translation only | AUTO or CONDITIONAL state (§2) |

### 1.7 Restraint on Culture, Political Entity, Function, and Historical Phase
This policy governs `type` and, secondarily, `tags`. It does not license aggressive population of the other four dimensions:
- **Culture** may be normalized from an existing explicit legacy `culture` value only. No new cultures are invented.
- **Political Entity** is never inferred from Culture (Golden Rules 3–4, `TAXONOMY.md` §3).
- **Function** is added only where the record explicitly documents actual use, never inferred from architectural appearance or Type. This includes Tags that describe a specific historical building type (e.g. `architecture:caravanserai`, §7 of `TAXONOMY.md`) — assigning the Tag never automatically populates Function; see §9 of this document for the worked example.
- **Historical Phase** is never derived from age, culture, or the fact that a site is ancient.

These four dimensions are almost entirely a research task, not a migration task, and are out of scope for the rules below except where a rule's output explicitly says otherwise.

### 1.8 Classify the record's scope, not its components (NEW in v2)
A record must be classified according to what the ArcheoMaps record itself fundamentally represents, not according to every object or feature mentioned inside its description. This is promoted to a general migration principle in v2 — see §8 for the full statement and its application across all four inspected groups. It was previously implicit in one rule (`PYRAMID_CITY_01`) and is now a named, general requirement that every CONDITIONAL rule's condition must satisfy before it can fire.

---

## 2. Decision States

Every classification decision produced by this policy carries exactly one of four states.

### AUTO
The classification is deterministic from the record with no interpretation required at all — the condition is not just explicit, it is unconditional for the given legacy value. **AUTO should be rare.** None of the four groups inspected (Pyramid, Cairn, Mound, Wall) produced an unconditional AUTO rule; every one of the 110 records required at least a conditional check against the record's own text. AUTO is reserved for cases with no branching — e.g., a legacy value that maps to exactly one canonical Type in all circumstances, with no known or plausible exception in the dataset.

### CONDITIONAL
The record classifies automatically **only if** an explicitly stated condition is satisfied by the record's own content (typically `text`), **and** that condition describes the record's fundamental scope, not merely a component mentioned within it (§8). CONDITIONAL means "a clearly defined condition has been met," never "this classification is probably correct." If the condition is not met, the record falls through to the next rule in precedence order, and ultimately to REVIEW or RESEARCH — never silently to a default Type.

### REVIEW
The information needed to classify the record **already exists** in the record, but choosing between remaining plausible Types requires human interpretation. Use REVIEW when: multiple canonical Types remain plausible from the existing text; the text is ambiguous; the record is an edge case; or the evidence conflicts.

> Example: text says "Roman fort and later monastery" — the Type is ambiguous, not missing. → REVIEW.

### RESEARCH
The existing record **does not contain enough information** to classify responsibly, but external historical research is likely to resolve it. Use RESEARCH when: `text` is empty or extremely sparse; the underlying nature of the site cannot be established from what's recorded; historical context is required; or the record contains a contested claim needing source verification. RESEARCH is not used merely because a record is inconvenient — it requires an actual information gap.

> Example: the record is named after a pyramid, has no useful description, and it's unclear whether it represents the pyramid, a complex, or a wider site. → RESEARCH.

**The REVIEW/RESEARCH line, restated:** REVIEW = "the answer is in here somewhere, a human needs to pick it." RESEARCH = "the answer isn't in here, someone needs to go find it." **The test is never "is the popular framing of this site contested?" — it is "does the record itself establish what the site fundamentally is?"** A contested popular claim repeated by the record without any identity-establishing detail is a RESEARCH gap, not a REVIEW judgement call, precisely because nothing in the record actually answers the underlying question yet. See §9's `PYRAMID_XIAN_CLUSTER_01` for the worked case that motivated stating this explicitly (§20 documents why this differs from v1).

---

## 3. Record Migration Data Model — resolving the legacy/canonical `type` collision

v1 of this policy stated that `type` (legacy) "remains on the record after migration, unchanged" while never specifying where a new canonical Type value would actually be written — leaving an implicit collision, since the canonical taxonomy also calls its primary classification field `type`. This section resolves it.

### 3.1 The two candidate models considered

The audit brief offered two conceptual directions:

```text
# Option A — nested legacy object
legacy: {
    type: "Pyramid"
}
type: "Religious Site"
```

```text
# Option B — parallel flat fields
legacyType: "Pyramid"
canonicalType: "Religious Site"
```

**This policy adopts a variant of Option B, and explicitly rejects Option A. This is a deliberate deviation from the audit brief's preferred direction, flagged per the brief's own instruction to flag rather than blindly apply.** Reason: Option A requires writing the new canonical value into the top-level `type` key. Two other project documents already establish, independently of this policy, that this is unsafe:

- `claude/ARCHEOMAPS_AUDIT.md` §2–3 verifies that `type` is read live by the running application (`categoryOf(type)`, the filter-panel type tree, and the drawer's category/type tag) — it is not a dormant field.
- `claude/ARCHEOMAPS_MIGRATION_PLAN.md` §5 states outright: "`type` — preserved verbatim in place... **Not renamed away from the record**, since the existing app still reads `type` directly and this plan makes no HTML/app changes."

Writing the canonical Type into `type` (even conceptually "moving" the legacy value into a nested `legacy.type`) would overwrite the exact key the live application depends on for today's (legacy) filtering and grouping behaviour, contradicting both of the above and Migration Principle 1.1. Since this task is explicitly specification-only and out of scope for touching `archeomaps_1.html`, this policy does not assume that constraint will be lifted; if a future, separate migration decides to retire `type` in favor of `canonicalType` for the live app (the same way `category`/`secondaryType`/`eraLabel` are already slated for eventual retirement per the Migration Plan §8), that is an explicit future decision, not something this document should pre-empt by quietly repurposing the field now.

### 3.2 Adopted model

```text
type:          "Pyramid"              # UNCHANGED. The original legacy value. Never
                                       # renamed, moved, blanked, or repurposed by
                                       # migration, for as long as the live app reads it.

canonicalType: "Religious Site"       # NEW field. The migration-produced canonical
                                       # Type. Null/absent until a rule fires or a
                                       # human resolves a REVIEW/RESEARCH item.

tags: ["architecture:pyramid"]        # NEW field, per TAXONOMY.md §7 Migration Rules.
```

This satisfies every requirement in the brief:
- **Where the original legacy Type is preserved:** the existing `type` field, untouched — it already holds it, verbatim, today.
- **Where the new canonical Type is stored:** the new `canonicalType` field.
- **That migration never destroys the original classification:** guaranteed structurally — `type` is never written to by this policy at all.
- **How a later canonical dataset should expose the final `type`:** once a future, separate migration retires the legacy field from the live app's read path (Migration Plan §8, phase 5), `canonicalType` can be renamed/promoted to `type` at that point, with the old value already safely preserved under `provenance.type.legacyValue` (§4). That is future work; nothing here performs it.
- **That provenance can trace the canonical value back to the legacy value:** `provenance.type.legacyValue` (§4) stores this explicitly and redundantly, independent of whatever the live `type` field does, specifically so provenance remains intact even if a distant future migration ever does touch `type`.

This is deliberately a flat top-level field (`canonicalType`), not a nested object, to match the flat-record convention every other planned new field already uses (`tags`, `culture`, `politicalEntity`, `function`, `historicalPhases` — `claude/ARCHEOMAPS_MIGRATION_PLAN.md` §7). Introducing a nested `legacy: {...}` object would be a novel structural pattern with no precedent anywhere in the current schema (`claude/ARCHEOMAPS_AUDIT.md` §2's full field inventory is entirely flat scalars and, going forward, flat arrays).

---

## 4. Provenance Model

Every migration-produced value must be traceable: whether it was legacy data, whether and how it was automatically derived, which rule produced it, and which fields it read. This is internal audit data — it is not exposed in the public-facing ArcheoMaps UI beyond, at most, a simple confidence badge (the existing `typeSource` display already does something similar and should be extended, not replaced).

**v2 change:** v1's provenance schema conflated two different concepts inside one `status` field — *how a value was derived* (legacy / auto / conditional / manual / research) and *where the record currently stands in the review process* (unresolved / in review / researched / approved). These are now split: this section covers provenance only; §5 covers workflow state. v1 also modeled provenance as one record per *field*, which cannot represent the fact that a multi-value field like `tags` accumulates values from different rules, different migration passes, and later manual/research additions over time. v2 makes Tag (and other array-field) provenance **value-level**: one provenance entry per array *entry*, not one shared entry for the whole array.

### 4.1 Schema — scalar dimensions (`canonicalType`)

```text
provenance.type: {
  value:         <canonical value currently recorded, or null if unresolved>,
  legacyValue:   <original `type` value, verbatim, always populated>,
  method:        "legacy" | "auto" | "conditional" | "manual" | "research-derived",
  ruleId:        <string | null>,     // which rule in this document produced it
  policyVersion: <string>,            // e.g. "migration-rules-v2.2"
  sourceFields:  [<string>, ...],     // e.g. ["text"] — what was actually read
  notes:         <string | null>
}
```

### 4.2 Schema — array dimensions (`tags`, `culture`, `politicalEntity`, `function`, `phases`)

```text
provenance.tags: [
  {
    value:         "architecture:pyramid",
    method:        "conditional",
    ruleId:        "PYRAMID_TEMPLE_01",
    policyVersion: "migration-rules-v2.2",
    sourceFields:  ["text"],
    notes:         <string | null>
  },
  {
    value:         "archaeology:ruins",
    method:        "legacy-normalization",   // e.g. the Rule-14 Ruins default
    ruleId:        null,
    policyVersion: "migration-rules-v2.2",
    sourceFields:  ["type"],
    notes:         "TAXONOMY.md Migration Rule 14 default"
  }
]
```

Each array entry is independently attributable. A tag added later by a curator during manual research gets its own entry with `method: "manual"` or `"research-derived"` and no `ruleId`, sitting alongside tags that were rule-derived — the array accumulates history rather than being overwritten. `culture`, `politicalEntity`, `function`, and `phases` follow the identical per-value shape once those dimensions are populated (out of scope for this pass, per §13 of the brief and Migration Principle 1.7, but the schema already supports them without redesign).

### 4.3 Worked examples

Conditional classification, condition met:

```text
provenance.type: {
  value: "Religious Site",
  legacyValue: "Pyramid",
  method: "conditional",
  ruleId: "PYRAMID_TEMPLE_01",
  policyVersion: "migration-rules-v2.2",
  sourceFields: ["text"],
  notes: "text explicitly identifies structure as a temple"
}
```

Unresolved research item:

```text
provenance.type: {
  value: null,
  legacyValue: "Pyramid",
  method: null,
  ruleId: "PYRAMID_PHARAONIC_EMPTY_TEXT_01",
  policyVersion: "migration-rules-v2.2",
  sourceFields: ["text"],
  notes: "named pharaonic pyramid, text field empty — insufficient source information"
}
```

### 4.4 Minimum audit guarantee
From these fields alone it must always be possible to answer: is this value legacy or derived; if derived, by which rule, which policy version, and from what evidence; and — for array values — which specific entry came from which source. Workflow status (has a human looked at it, is it still waiting on research) is answered by §5, not by this section; the two must never be collapsed back into one field, which is exactly the v1 defect this section fixes.

---

## 5. Workflow State

**New in v2**, split out of v1's single provenance `status` field per the audit brief's explicit request (point 12). Provenance (§4) answers *where a value came from*. Workflow state answers *what is currently happening to the record in the review process*, and is tracked independently so that a record's research history remains visible even after it's resolved. `workflow.type` is only ever created for a record that actually enters a human workflow step (REVIEW, RESEARCH, or their resolutions) — see §5.3 rule 1 for the precise, non-contradictory statement of when it exists versus when provenance alone is sufficient (corrected in v2.1).

### 5.1 Schema

```text
workflow.type: {
  state:       "review" | "research" | "reviewed" | "researched" | "approved",
  ruleId:      <string | null>,       // which rule placed it in this state
  enteredAt:   <ISO-8601 date>,
  resolvedBy:  <string | null>,
  resolvedAt:  <ISO-8601 date | null>,
  history:     [                       // append-only; never rewritten
    { state: "research", ruleId: "PYRAMID_XIAN_CLUSTER_01", enteredAt: "..." },
    { state: "researched", resolvedBy: "...", resolvedAt: "..." }
  ]
}
```

### 5.2 Why this must be separate from provenance

A record can move `RESEARCH → researched → manual decision → canonicalType` without ever losing the fact that it once required research — that fact is historically and editorially meaningful (it flags a record whose classification came from external research rather than the original curated text, which is a different confidence tier than a record classified straight from its own `text`). If workflow state were collapsed into `provenance.type.method` the way v1 did, resolving a RESEARCH item would either (a) overwrite the fact that research was needed, silently downgrading the audit trail, or (b) force an awkward `method` value that tries to mean both "how was this derived" and "did this require research" at once. Keeping them separate means:

- `provenance.type.method` can honestly say `"research-derived"` once resolved (how the value was ultimately produced).
- `workflow.type.history` can still show it passed through `research` → `researched` (what actually happened to the record).

### 5.3 Rules

1. `workflow.type` is created **only** when a record actually enters a human workflow step — i.e. a REVIEW or RESEARCH rule fires (state `"review"`/`"research"`), or that item is later resolved (`"reviewed"`/`"researched"`) or signed off (`"approved"`). A record classified cleanly by an AUTO or CONDITIONAL rule (§9–§16) gets **no `workflow.type` object at all** — its full audit trail is already captured by `provenance.type` (§4), which records the value, the rule, and the evidence with nothing further to track. The absence of `workflow.type` on a record is itself meaningful: it means the record never required a human step. This also removes the need for an `"unresolved"` state — a record not yet run through this policy has neither `provenance.type` nor `workflow.type` populated, which already says "not yet processed" without a dedicated enum value for it (v2.1 — v2 defined `"unresolved"` as one of the enum's values while simultaneously saying `workflow.type` could be entirely absent for AUTO/CONDITIONAL hits, which left `"unresolved"` with no record that could ever actually carry it; dropped here as unreachable).
2. A REVIEW or RESEARCH rule firing sets `workflow.type.state` to `"review"` or `"research"` respectively, with `ruleId` set to the rule that produced it.
3. Resolving a REVIEW item moves state to `"reviewed"`; resolving a RESEARCH item moves state to `"researched"`. Neither transition retroactively edits `provenance.type.ruleId` — the rule that originally routed the record to REVIEW/RESEARCH stays visible in `workflow.type.history` even after resolution.
4. A final human sign-off (independent of whether the path went through REVIEW or RESEARCH) may set state to `"approved"`. This is optional and out of scope for this migration pass to require, but the schema supports it now so it doesn't need a redesign later.
5. `history` is append-only. No transition ever deletes an earlier entry.

---

## 6. Duplicate & Deduplication Status

**v2 change (audit point 13):** v1's `dataQuality.duplicateStatus` conflated two different questions — *are these two records actually duplicates* and *has a canonical copy been chosen yet* — inside one enum. This section splits them.

### 6.1 Confirmed duplicates from this inspection
- **Dun Carloway Broch**
- **Etowah Indian Mounds**

These are exact duplicate records, confirmed during the same inspection pass, unrelated to the broader ~378-record possible-duplicate backlog already noted in `PROJECT_PROGRESS_LOG` (which remains a separate, pre-existing review queue). Note: the live data (`archeomaps_1.html`) contains a record named *Etowah Indian Mound* (singular, `site-0862`); the duplicate pair's exact `id`s were not independently re-verified against the live array as part of this v2 pass — carry v1's finding forward, but confirm both `id`s before actually flagging them in a future implementation.

### 6.2 Schema

```text
dataQuality: {
  duplicateStatus:      "none" | "flagged-unresolved" | "confirmed-duplicate",
  deduplicationStatus:  "n/a" | "unresolved" | "canonical-selected",
  duplicateOfId:        <id | null>,   // set only once deduplicationStatus = "canonical-selected"
  duplicateGroupId:     <string | null>,
  flaggedAt:             <ISO-8601 date>,
  flaggedBy:              <string>,     // e.g. "migration-policy-inspection-2026-08"
  notes:                  <string | null>
}
```

`duplicateStatus` answers "is this record part of a confirmed duplicate pair/cluster?" `deduplicationStatus` answers "has someone decided what to do about it?" independently. For *Dun Carloway Broch* and *Etowah Indian Mounds*: `duplicateStatus: "confirmed-duplicate"`, `deduplicationStatus: "unresolved"` on both copies — the identity match is settled; the dedup action is not.

### 6.3 Rules
1. Confirmed duplicates are **flagged**, not deleted, not merged, during migration. Both/all copies retain their own independent `canonicalType`/tag classification per §9–§16 — duplication does not exempt a record from classification.
2. `deduplicationStatus: "unresolved"` is the terminal state produced by this migration policy for every confirmed duplicate. Deciding the canonical record and what happens to the other copy is an explicit, separate deduplication process, out of scope here.
3. No migration rule may use `dataQuality.*` as an input condition for `canonicalType` classification (`TAXONOMY.md` §35 — duplicate markers do not belong in `tags` either; they belong in `dataQuality` only).
4. Future deduplication work should reuse `duplicateGroupId` to also resolve the pre-existing 378-record backlog, but that is a separate initiative, not part of this migration.

---

## 7. Rule Precedence & Fallback Standard

### 7.1 Specific before general
Rules are evaluated **from specific, high-information conditions toward general, low-information conditions**, with explicit fallback to REVIEW or RESEARCH at the end of the chain. A broad legacy-value mapping (`Pyramid → Monument`) must never be allowed to swallow a valid specific case (`Pyramid + explicit temple identification → Religious Site`). This is why no group below has a blanket rule — each has an ordered chain of specific CONDITIONAL rules, followed by a named REVIEW or RESEARCH fallback, and never a bare `legacy type → canonicalType` mapping.

### 7.2 Evaluation algorithm
For a given record and a given legacy `type` value:

1. Evaluate that legacy value's rules **in the order listed** in §9–§16 below.
2. The first rule whose input condition is satisfied fires. Stop. Record the result with full provenance (§4) and, if applicable, workflow state (§5).
3. If no rule's condition is satisfied, proceed to the next rule in the list — **including rules whose own heading is labeled "→ REVIEW" or "→ RESEARCH"**: that label describes what happens *if that specific rule's condition is met*, not what happens to every record that reaches it. A record that does not match a REVIEW/RESEARCH-labeled rule's condition keeps moving down the chain exactly like it would for a CONDITIONAL rule.
4. A chain's terminal point may be a single unconditional catch-all rule, **or** a small set of mutually exclusive terminal rules whose conditions, taken together, exhaust every record that reaches that point in the chain (§7.3 defines this second form precisely). Either way, no rule after the terminal point(s) exists to fall through to. If none of the conditions at a chain's terminal point are met (which should not happen, since a terminal point — single or branching — is written to cover every remaining case), that is a specification defect to be fixed, not a silent default.
5. Never skip ahead to a later, broader rule while an earlier, more specific rule's condition might still apply — evaluate in order, not by convenience.

### 7.3 Rule Fallback Standard (v2, audit point 16; branching form added in v2.1)

This restates §7.2 point 3 as an explicit drafting rule, because v1 violated it once (`PYRAMID_CITY_01` — see §7.4) by writing a fallback that terminated the chain instead of continuing it. Every rule in §9–§16 must use exactly one of these three fallback forms, and no other:

**1. Non-terminal rule** (there is at least one more rule after it in the chain for that legacy value):
```text
fallback: condition not met → proceed to <NEXT_RULE_ID>.
```
This is the standard fallback wording for a non-terminal rule that leads to exactly one next rule. It must never be replaced with language that routes an unmatched record directly to REVIEW or RESEARCH — that silently deletes every rule after it from the chain for every record that doesn't happen to match this one rule.

**2. Single terminal rule** (the last rule for that legacy value, a genuine unconditional catch-all with no further rule to fall through to):
```text
fallback: n/a — terminal state for records meeting the condition.
```
paired with a `confidence: REVIEW` or `confidence: RESEARCH` header, chosen by the §2 test: information present but ambiguous → REVIEW; information missing or insufficient → RESEARCH.

**3. Branching terminal fallback** (v2.1 — the chain's terminal point is not one rule but a small set of mutually exclusive terminal rules, together covering every record that reaches this point). This form exists because a single unconditional catch-all cannot represent "text is empty → RESEARCH, but text is present-and-inconclusive → REVIEW" as one rule — those are two different confidence outcomes, so they must be two different rules, evaluated as a pair rather than in a strict single-next-rule chain. Use this form when, and only when, the branch conditions are (a) mutually exclusive — no record can satisfy more than one — and (b) jointly exhaustive — every record reaching this point satisfies exactly one of them:
```text
fallback: condition not met → proceed to <TERMINAL_RULE_A> (if <condition A>) or
<TERMINAL_RULE_B> (if <condition B>) — <condition A> and <condition B> are mutually
exclusive and, together, exhaust every record reaching this point.
```
Both `<TERMINAL_RULE_A>` and `<TERMINAL_RULE_B>` are themselves single terminal rules in the sense of form 2 above (each uses `fallback: n/a — terminal state...`) — the branching happens one level up, in the rule that routes to them, not inside the terminal rules themselves. `MOUND_FORTIFICATION_01` (§11) and `WALL_MONUMENT_01` (§12) are the two rules in this document that use this form, routing to the `*_NO_SIGNAL_01` (RESEARCH) / `*_FALLBACK_01` (REVIEW) pairs.

A rule that is REVIEW/RESEARCH-labeled but sits *mid-chain* (not at the chain's terminal point) — e.g. `PYRAMID_FRINGE_01`, `PYRAMID_XIAN_CLUSTER_01` — uses form 2's terminal wording **only for the case where its own condition is met** (that is genuinely a stopping point for those records); it must not be read as terminating the chain for records that don't match it, and it is not an instance of form 3 (it has one condition, not a mutually-exclusive pair). §9 makes this explicit for both rules below, since this exact ambiguity is what let `PYRAMID_CITY_01` drift into the v1 defect.

### 7.4 v1 defect found and fixed: `PYRAMID_CITY_01`

v1's `PYRAMID_CITY_01` read:

```text
fallback: condition not met, or the "city" identity is ambiguous/inferred rather than
explicit → route to REVIEW, not to a weaker guess.
```

This is wrong as written: it collapses two different situations into one instruction. "Condition not met" (the record isn't about a city at all — e.g. it's a straightforwardly modern memorial, or a Xi'an-cluster record) should fall through to `PYRAMID_MODERN_MEMORIAL_01` and the rest of the chain, exactly like every other CONDITIONAL rule's fallback. Only the second situation — the record *is* about a settlement, but whether the pyramid-vs-city framing is explicit or merely inferred is itself ambiguous — is a genuine REVIEW case. As written, v1 silently discarded `PYRAMID_MODERN_MEMORIAL_01`, `PYRAMID_FRINGE_01`, `PYRAMID_XIAN_CLUSTER_01`, `PYRAMID_PHARAONIC_EMPTY_TEXT_01`, and `PYRAMID_NO_SIGNAL_01` for any Pyramid record that reached `PYRAMID_CITY_01` without an explicit-but-not-quite-settled city claim — none of those later rules could ever fire for such a record, since the chain terminated one step too early. Fixed in §9 below.

**Audit of the other three chains for the same defect (Cairn, Mound, Wall):** checked every fallback line in v1's §6–§8 individually. None of the others make this mistake — Cairn, Mound, and Wall's non-terminal rules all correctly say "condition not met → proceed to `<NEXT_RULE_ID>`," and their REVIEW/RESEARCH-labeled entries are all genuinely the last rule in their respective chains, so the mid-chain-termination defect does not apply to them. This is a one-rule fix, not a pattern requiring changes across every group — stated plainly here so this correction isn't mistaken for a larger rewrite than it is.

### 7.5 v2.1 Mechanical Consistency Pass

Performed after the two structural corrections above (§7.3's branching-terminal form and §5.3's workflow-entry rule). Every rule chain in §9–§12 was traced by rule ID — precedence order, every non-terminal fallback target, every terminal/terminal-branch condition, and reachability of every rule from the chain's entry point.

**Method:** for each of the four chains, list every rule in document order, then for each rule's `fallback:` line, confirm the named target rule (a) exists, (b) is the next rule actually reachable under §7.2's "evaluate in the order listed" default, and (c) that no rule is orphaned — i.e. every rule other than each chain's first rule is named as a target by at least one other rule's fallback.

**Findings:**

- **Cairn:** `CAIRN_NONFUNERARY_01 → CAIRN_FUNERARY_01 → CAIRN_EMPTY_TEXT_RESEARCH_01 → CAIRN_FALLBACK_01` (terminal). Linear, every rule reachable, no branching terminal needed (only one REVIEW/RESEARCH split, sequential not parallel). No defect.
- **Mound:** `MOUND_ARCHSITE_01 → MOUND_SETTLEMENT_01 → MOUND_TOMB_01 → MOUND_MONUMENT_01 → MOUND_FORTIFICATION_01 → {MOUND_NO_SIGNAL_01 | MOUND_FALLBACK_01}` (branching terminal, §7.3 form 3). Linear until the final branch, every rule reachable. No defect beyond the branching-terminal wording already corrected above.
- **Wall:** `WALL_FORTIFICATION_01 → WALL_MONUMENT_MEGALITHIC_01 → WALL_SETTLEMENT_01 → WALL_ARCHSITE_MISTAG_01 → WALL_INFRASTRUCTURE_01 → WALL_MONUMENT_01 → {WALL_NO_SIGNAL_01 | WALL_FALLBACK_01}` (branching terminal, §7.3 form 3). Linear until the final branch, every rule reachable. No defect beyond the branching-terminal wording already corrected above.
- **Pyramid:** `PYRAMID_TEMPLE_01 → PYRAMID_TOMB_01 → PYRAMID_COMPLEX_01 → PYRAMID_CITY_01 → PYRAMID_CITY_AMBIGUOUS_01 → PYRAMID_MODERN_MEMORIAL_01 → PYRAMID_FRINGE_01 → PYRAMID_XIAN_CLUSTER_01 → PYRAMID_PHARAONIC_EMPTY_TEXT_01 → PYRAMID_NO_SIGNAL_01 → PYRAMID_FALLBACK_01` (terminal). **One defect found and fixed:** `PYRAMID_CITY_01`'s fallback pointed directly to `PYRAMID_MODERN_MEMORIAL_01`, skipping `PYRAMID_CITY_AMBIGUOUS_01` entirely — the rule immediately following it in document order, and one that no other rule's fallback named as a target either. `PYRAMID_CITY_AMBIGUOUS_01` was therefore unreachable: written, correctly designed, and dead. Fixed by pointing `PYRAMID_CITY_01`'s fallback to `PYRAMID_CITY_AMBIGUOUS_01`, and rewording `PYRAMID_CITY_AMBIGUOUS_01`'s own fallback (previously non-standard prose) to the same mid-chain convention already used by `PYRAMID_FRINGE_01`/`PYRAMID_XIAN_CLUSTER_01` — "if this rule's own condition is not met, proceed to `PYRAMID_MODERN_MEMORIAL_01`." This changes no classification outcome: the rule's condition and output are untouched, only its position in the chain now actually executes as designed.

**Conclusion of the pass:** with the `PYRAMID_CITY_AMBIGUOUS_01` link restored, every rule in every chain is reachable from its chain's entry point, every non-terminal fallback names exactly one next rule (or, where a branching terminal is used, exactly two mutually exclusive and jointly exhaustive terminal rules per §7.3 form 3), and every chain terminates in a canonical classification, REVIEW, or RESEARCH with no silent default. No further structural problem was found.

---

## 8. Record-Scope Classification Principle (NEW in v2 — audit point 5)

**A record must be classified according to what the ArcheoMaps record itself represents, not according to any single object or feature mentioned inside its description.**

This was already the *de facto* logic behind v1's `PYRAMID_CITY_01` (an entire city containing a pyramid stays `Settlement`, not `Religious Site`, just because the pyramid is what the legacy `type` string named). v2 promotes it to a general principle that every CONDITIONAL rule in §9–§12 must satisfy, because the same failure mode threatens Cairn, Mound, and Wall just as much as Pyramid:

- A record representing an entire ancient city that happens to mention a pyramid-temple does not automatically become `type = Religious Site`. If the record's own text is fundamentally about the city, the correct canonical Type may remain `Settlement`, with the temple/pyramid represented through `architecture:pyramid`/`architecture:temple` tags.
- A record for an archaeological complex containing tombs does not automatically become `type = Tomb` merely because tombs are mentioned. If the record fundamentally represents the broader complex, `Archaeological Site` (or `Settlement`, if the complex is explicitly a settlement) is correct, with `funerary:*` tags as applicable.
- The same applies to Mound records that mention villages (§11, `MOUND_SETTLEMENT_01`) and Wall records that mention defensive structures within a larger walled city (§12, `WALL_SETTLEMENT_01`/`WALL_FORTIFICATION_01`).

**Every conditional rule's `input_condition` in §9–§16 must be read as requiring that the cited textual evidence describe the record's fundamental identity/scope — not merely that the relevant word or concept appears somewhere in the text.** Where a rule's condition text does not already make this explicit, v2 adds the qualifier directly into the rule (flagged inline where changed); Forest's rules (§13, added in v2.2), Observatory's rules (§14, added in v2.3), Ruins' rules (§15, added in v2.4), and null/missing Type's rules (§16, added in v2.5) were written to satisfy this from the outset.

---

## 9. Pyramid Rules

**Scope:** the 75 records with `legacy type = "Pyramid"`. **Finding:** no unconditional AUTO rule is valid for this group — `architecture:pyramid` describes a physical form, not a fundamental identity, and the 75 records resolve to at least four different underlying situations. Evaluate the following rules **in order** for every Pyramid record.

### PYRAMID_TEMPLE_01
```text
scope: legacy type = "Pyramid"
input_condition: text explicitly identifies the structure ITSELF — not a component
                 within a larger site the record actually represents — as a temple or
                 place of worship (e.g. explicit "temple," "temple complex," documented
                 religious use) — not merely a pyramid shape that could plausibly have
                 had religious use. (Record-scope principle, §8.)
output:
  canonicalType: "Religious Site"
  tags: ["architecture:pyramid"]   # only if the pyramid form itself is confirmed, not disputed
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.2/§7 — explicit textual identification as a temple determines
  fundamental identity; "architecture:pyramid" records form, not Type (§7).
fallback: condition not met → proceed to PYRAMID_TOMB_01.
found_in_current_dataset: 5 of 75 records (v1 finding; not independently re-verified
  record-by-record in this v2 pass — see §20)
```

### PYRAMID_TOMB_01
```text
scope: legacy type = "Pyramid"
input_condition: text explicitly documents the pyramid as a burial/funerary structure
                 (e.g. named occupant's tomb, burial chamber, sarcophagus, or interment
                 explicitly described) — not merely the word "tomb" used loosely or a
                 popular assumption that pyramids are generally funerary.
output:
  canonicalType: "Tomb"
  tags: ["architecture:pyramid"]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.4 — "pyramid (funerary)" is an explicit Tomb example, but only
  where the record itself documents the funerary use, per Migration Principle 1.2.
fallback: condition not met → proceed to PYRAMID_COMPLEX_01.
found_in_current_dataset: 0 of the 75 inspected records satisfied this condition —
  retained in the precedence chain for future/unreviewed Pyramid records, since its
  absence here is a finding about this batch, not evidence the rule is unneeded.
```

### PYRAMID_COMPLEX_01
```text
scope: legacy type = "Pyramid"
input_condition: text explicitly describes the record as a multi-component/multi-structure
                 complex — i.e. the record's own scope is the complex, not just the
                 pyramid within it (§8) — where no single structural Type adequately
                 captures the whole.
output:
  canonicalType: "Archaeological Site"
  tags: ["architecture:pyramid"]   # archaeology:archaeological-site NOT added reflexively — see §9 tag note
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.9 — Archaeological Site is the correct fallback for a
  multi-component site that no single structural Type can adequately describe.
fallback: condition not met → proceed to PYRAMID_CITY_01.
found_in_current_dataset: 3 of 75 records
```

### PYRAMID_CITY_01
```text
scope: legacy type = "Pyramid"
input_condition: text explicitly identifies the record's own scope as an entire city or
                 urban settlement (the pyramid is its most prominent structure, not its
                 whole identity — §8) — the settlement identity must be explicit in the
                 record's own text, not inferred solely from the record's name or a
                 single mention of "city" in passing.
output:
  canonicalType: "Settlement"
  tags: ["architecture:pyramid"]   # pyramid retained as a component characteristic, TAXONOMY.md §4.1
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.1/§34 — a settlement containing a monumental pyramid remains a
  Settlement with architecture:pyramid as a tag, per the "complex archaeological city"
  pattern (§34); the legacy "Pyramid" label reflects the old system privileging the most
  visually prominent structure over the record's actual scope. This rule is the origin of
  the general record-scope principle now stated independently in §8.
fallback: condition not met → proceed to PYRAMID_CITY_AMBIGUOUS_01. [FIXED IN v2 — v1
  incorrectly routed every non-matching record straight to REVIEW here, silently
  discarding every rule below it in the chain. See §7.4 for the full explanation. The
  one case that genuinely stays REVIEW is different and is now its own explicit rule,
  immediately below.]
found_in_current_dataset: 4 of 75 records
```

### PYRAMID_CITY_AMBIGUOUS_01 → REVIEW
```text
scope: legacy type = "Pyramid"
input_condition: text establishes that the record's scope is plausibly an entire
                 settlement (per PYRAMID_CITY_01's own evidentiary bar) but whether that
                 settlement identity is explicit or merely inferred is itself genuinely
                 unclear from the text — i.e. the record contains real evidence, but a
                 human judgement call is needed between Settlement and a more
                 pyramid-specific Type.
output: none assigned automatically.
confidence: REVIEW
rationale: This is the genuine REVIEW case v1's PYRAMID_CITY_01 fallback was reaching
  for, now isolated into its own rule so it no longer swallows the rest of the chain
  (§7.4). "Present but ambiguous" per §2.
fallback: if this rule's own condition is not met, proceed to PYRAMID_MODERN_MEMORIAL_01
  (§7.3) — this heading's "→ REVIEW" describes the outcome ONLY for records that match
  its condition, the same convention used by PYRAMID_FRINGE_01 and
  PYRAMID_XIAN_CLUSTER_01 below.
found_in_current_dataset: not separately broken out in the v1 inspection; the 4 records
  counted under PYRAMID_CITY_01 in v1 should be re-checked against this split — see §20.
  [v2.1 note: this rule was reachable only from PYRAMID_CITY_01's fallback, which
  pointed past it directly to PYRAMID_MODERN_MEMORIAL_01 in v2 — an unreachable-rule
  defect found and fixed during the v2.1 mechanical consistency pass, see §7.5.]
```

### PYRAMID_MODERN_MEMORIAL_01
```text
scope: legacy type = "Pyramid"
input_condition: text explicitly documents the structure as a modern (post-medieval)
                 commemorative monument/memorial with an explicit construction date or
                 clearly modern context, and explicitly rules out funerary or religious
                 primary use.
output:
  canonicalType: "Monument"
  tags: ["monument:memorial"]   # architecture:pyramid MAY be added — see note below
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.3 — a purpose-built commemorative monument is the canonical
  Monument example.
note_v2: v1's rationale here implied "architecture:pyramid" should generally be omitted
  from modern structures because the tag is "meant to capture" ancient pyramid
  architecture. TAXONOMY.md §7 does not support that restriction — architecture tags
  describe physical form, full stop, regardless of the structure's age (audit point 11,
  §9 tag note below). Corrected: a curator should add architecture:pyramid to a modern
  memorial exactly like any other record — if the record confirms a genuine pyramid
  form and the tag is useful for filtering — not withhold it merely because the
  structure is modern, and not add it merely because the legacy type said "Pyramid."
fallback: condition not met → proceed to PYRAMID_FRINGE_01.
found_in_current_dataset: 1 of 75 records (a 1804 memorial)
```

### PYRAMID_FRINGE_01 → REVIEW
```text
scope: legacy type = "Pyramid"
input_condition: the record's own text makes or repeats a self-declared fringe/contested
                 claim about the site's pyramid identity (e.g. natural-hill "pyramid"
                 claims, contested modern reinterpretations of a landform) rather than
                 documenting a constructed, historically-attested pyramid.
output: none assigned automatically.
confidence: REVIEW
rationale: TAXONOMY.md §4.12/§44 and Migration Rule 13 — fringe or speculative claims are
  explicitly excluded as a basis for automatic classification (the same standard applied
  to Observatory claims applies here). The record contains information, but that
  information is a contested assertion requiring a human policy decision on how to
  represent it (e.g. Other, Archaeological Site, or Landscape with no architecture:pyramid
  tag) — not a missing-information gap. This is distinct from PYRAMID_XIAN_CLUSTER_01
  below: here the contested question IS the site's fundamental identity, and the record
  says enough about that contest for a human to make the call. There, the record does
  not establish the underlying identity at all — see that rule's rationale.
fallback: if this rule's own condition is not met, proceed to PYRAMID_XIAN_CLUSTER_01 —
  this heading's "→ REVIEW" describes the outcome ONLY for records that match its
  condition (§7.3).
do_not: apply architecture:pyramid to these records until a curator confirms a genuine
  constructed structure exists.
found_in_current_dataset: 9 of 75 records (including Bosnian-pyramid-style and Mauritius
  "pyramid" claims)
```

### PYRAMID_XIAN_CLUSTER_01 → RESEARCH [RECLASSIFIED IN v2 — was REVIEW in v1]
```text
scope: legacy type = "Pyramid", record is part of the documented Xi'an cluster (a named,
       recognizable group of Chinese burial-mound/mausoleum sites popularly reported as
       "pyramids").
input_condition: the record belongs to this specific, contested-in-framing cluster and
                 was not already resolved by PYRAMID_TEMPLE_01 or PYRAMID_TOMB_01 above
                 (a small number of individual Xi'an-cluster records may independently
                 satisfy those earlier, more specific rules — precedence order, §7,
                 still applies to each record individually before this batch rule is
                 reached).
output: none assigned automatically.
confidence: RESEARCH
rationale: v1 classified this cluster as REVIEW, reasoning that the underlying Type was
  "most plausibly Tomb, per imperial-mausoleum convention." That reasoning imports
  external historical convention the record itself does not state — a violation of
  Migration Principle 1.2 ("legacy values are evidence, not truth") and 1.5 ("research
  is a separate phase"). Verified directly against archeomaps_1.html: the "Chinese
  Pyramid" records near Xi'an (e.g. site-0492 through site-0495) carry near-identical
  templated text describing the surrounding AREA as hosting "a large amount of
  pyramids," with tourist-brochure framing and no mausoleum, burial, ruler, or dynasty
  language in the inspected text. Applying the §2 test directly: this is not "the
  answer is in here, pick one" (REVIEW) — it is "the record doesn't say what this
  fundamentally is" (RESEARCH). The contested "pyramid" framing is what drew attention
  to these records, but per §8/§2, the operative question is whether the record
  establishes the site's fundamental identity, and here it does not. This is a
  deliberate, documented deviation from v1 — see §20.
fallback: if this rule's own condition is not met, proceed to
  PYRAMID_PHARAONIC_EMPTY_TEXT_01 (§7.3).
found_in_current_dataset: 19 of 75 records (v1 count, carried forward; individual
  records within the cluster with genuinely more specific text should still be
  fast-tracked to a REVIEW state instead if a future pass finds one that does establish
  more than the templated boilerplate — this rule describes the observed default, not
  an unconditional batch override of §7.2's per-record evaluation)
```

### PYRAMID_PHARAONIC_EMPTY_TEXT_01 → RESEARCH
```text
scope: legacy type = "Pyramid", record is a named pharaonic pyramid (Egyptian dynastic
       context named in `n`), `text` is empty.
input_condition: text field is empty or contains no classifying information.
output: none assigned automatically.
confidence: RESEARCH
rationale: A named pharaonic pyramid is highly likely to resolve to Tomb on external
  research, but the record itself currently supplies zero evidence — per §1.2/§1.5, the
  name alone is not a substitute for the record's own documented content, and guessing
  from the name would violate TAXONOMY.md Migration Rule 8 (do not invent information).
fallback: if this rule's own condition is not met, proceed to PYRAMID_NO_SIGNAL_01 (§7.3).
found_in_current_dataset: 22 of 75 records
```

### PYRAMID_NO_SIGNAL_01 → RESEARCH
```text
scope: legacy type = "Pyramid"
input_condition: none of the above conditions are met, and the record's text supplies no
                 usable classification signal at all (empty, near-empty, or entirely
                 non-classifying content).
output: none assigned automatically.
confidence: RESEARCH
rationale: No explicit evidence exists in the record for any of the more specific rules
  above, and the gap is one of missing information rather than ambiguous-but-present
  information.
fallback: if this rule's own condition is not met, proceed to PYRAMID_FALLBACK_01 (§7.3).
found_in_current_dataset: 12 of 75 records
```

### PYRAMID_FALLBACK_01 → REVIEW (terminal)
```text
scope: legacy type = "Pyramid"
input_condition: catch-all — a Pyramid record with some text present, but that text does
                 not satisfy any rule above and is not merely empty.
output: none assigned automatically.
confidence: REVIEW
rationale: Present-but-inconclusive text is a human-judgement case (§2), not a research
  gap. This rule exists for future/unreviewed Pyramid records; none of the currently
  inspected 75 fell through to it, since all 75 were accounted for by the rules above.
fallback: n/a — this is the actual terminal rule for the Pyramid chain.
```

**Tag note (applies across all Pyramid outcomes, corrected in v2 — audit points 10, 11):**
- Add `architecture:pyramid` only when the record confirms an actual constructed pyramid-form structure — regardless of the structure's age (do not withhold it from a confirmed modern pyramid-form memorial, and do not add it to a fringe/contested natural-landform claim).
- Do not add `architecture:pyramid` to `PYRAMID_FRINGE_01` records (the structure's very existence as a built pyramid is what's contested) or to unresolved RESEARCH/REVIEW records (tag once the record is resolved and the tag is confirmed appropriate, not before).
- **Do not reflexively add `archaeology:archaeological-site` to `PYRAMID_COMPLEX_01` outputs merely because `canonicalType = "Archaeological Site"`.** TAXONOMY.md §43 explicitly lists this exact pattern as over-tagging — the Type already communicates that information. v1's `PYRAMID_COMPLEX_01` added this tag reflexively; v2 removes it (see the rule above). Add it only if it contributes something the Type doesn't already say (rare — in practice this will almost never fire for a record whose Type is already `Archaeological Site`).

---

## 10. Cairn Rules

**Scope:** the 2 currently-inspected records with `legacy type = "Cairn"`, plus the general framework for any future Cairn records. **Finding:** a cairn may be funerary or non-funerary; the word alone does not decide it. No changes from v1 beyond the field rename (`type` → `canonicalType`) and the standardized fallback wording (§7.3) — this group's chain already satisfied the fallback standard and the record-scope principle (a cairn record is essentially always about the cairn itself, so §8 rarely has separate bite here).

### CAIRN_NONFUNERARY_01
```text
scope: legacy type = "Cairn"
input_condition: text explicitly identifies the cairn as non-funerary (e.g. explicit
                 "trail marker," "boundary marker," "commemorative landmark," or other
                 explicit non-burial purpose).
output:
  canonicalType: "Monument"
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.3 — an explicitly non-funerary standing stone/landmark structure
  is a canonical Monument example.
fallback: condition not met → proceed to CAIRN_FUNERARY_01.
found_in_current_dataset: 1 of 2 records
```

### CAIRN_FUNERARY_01
```text
scope: legacy type = "Cairn"
input_condition: text explicitly confirms the cairn as a burial feature (documented
                 interment, grave goods, or explicit "burial cairn" identification) —
                 not merely the ambiguous label "Grave" with no supporting description.
output:
  canonicalType: "Tomb"
  tags: ["funerary:burial"]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.4 — an explicitly confirmed burial feature is a Tomb, regardless
  of the "Cairn" legacy label's physical-form framing.
fallback: condition not met → proceed to CAIRN_EMPTY_TEXT_RESEARCH_01.
found_in_current_dataset: 0 of the 2 inspected records satisfied this condition — retained
  for future Cairn records, per the same reasoning as PYRAMID_TOMB_01.
```

### CAIRN_EMPTY_TEXT_RESEARCH_01 → RESEARCH
```text
scope: legacy type = "Cairn"
input_condition: `text` is empty or near-empty, and the site is documented as unexcavated
                 (funerary status cannot be established either way).
output: none assigned automatically.
confidence: RESEARCH
rationale: An unexcavated site with no descriptive text cannot be safely resolved between
  Tomb and Monument — this is a missing-information gap, not an interpretive one.
fallback: if this rule's own condition is not met, proceed to CAIRN_FALLBACK_01 (§7.3).
found_in_current_dataset: 1 of 2 records (an unexcavated "Grave" with empty text)
```

### CAIRN_FALLBACK_01 → REVIEW (terminal)
```text
scope: legacy type = "Cairn"
input_condition: catch-all — text is present but does not satisfy CAIRN_NONFUNERARY_01
                 or CAIRN_FUNERARY_01, and is not empty.
output: none assigned automatically.
confidence: REVIEW
rationale: Present-but-ambiguous cairn descriptions require human interpretation between
  Tomb and Monument.
fallback: n/a — this is the actual terminal rule for the Cairn chain.
```

No unconditional `Cairn → X` mapping is created, consistent with the inspection finding that both currently-known records resolve differently.

---

## 11. Mound Rules

**Scope:** the 15 currently-inspected records with `legacy type = "Mound"`, plus the general framework for future records. **Finding:** 6 of 15 are explicitly multi-mound/multi-period complexes; the remaining 9 do not share one common explicit condition and must be evaluated individually — no `Mound → Tomb` or `Mound → Monument` blanket rule is valid.

### MOUND_ARCHSITE_01
```text
scope: legacy type = "Mound"
input_condition: text explicitly identifies the record's own scope as a multi-mound or
                 multi-period complex/archaeological site (e.g. "complex containing six
                 burial mounds," explicit multi-period language) — explicit
                 identification, not an inferred count from context. (§8.)
output:
  canonicalType: "Archaeological Site"
  # NOTE (v2, audit point 10): archaeology:archaeological-site is NOT added reflexively
  # here — see the tag note at the end of this section.
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.9 and the explicit textual-evidence example in the source spec
  ("archaeological complex containing six burial mounds" supports Archaeological Site).
fallback: condition not met → proceed to MOUND_SETTLEMENT_01.
found_in_current_dataset: 6 of 15 records
```

### MOUND_SETTLEMENT_01 [NEW IN v2 — audit point 6]
```text
scope: legacy type = "Mound"
input_condition: text explicitly establishes that the record's own scope IS a
                 settlement/village/community — not merely that people lived near, used,
                 or built the mound(s) — and that the mound(s) are a component/feature of
                 that settlement rather than the record's fundamental identity (§8).
                 Verified example from the live dataset: *Prehistoric Mounds of Uruguay*
                 (site-1080, legacy type "Mound") — text: "mound-building people thrived
                 4000 years ago. They built planned village[s]..." This explicitly states
                 the record's scope is a planned settlement, with the mounds as a
                 building/construction feature of it, not the reverse.
output:
  canonicalType: "Settlement"
  tags: [<most specific supported settlement:* tag, e.g. "settlement:village"; omit if
         the text doesn't support a more specific value than the bare Type — TAXONOMY.md
         §4.1, and see §12's tag note on not hardcoding a specific settlement subtype>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.1's Settlement definition and the canonical worked example in
  §34 (a complex city is not split into multiple Types because it contains multiple
  architectural forms) apply symmetrically here: a settlement is not reclassified away
  from Settlement merely because its legacy `type` string named one architectural
  feature (mounds) instead of the whole. This restores a classification path v1 omitted
  even though the underlying evidence (this exact record) was already available in the
  110-record inspection that produced v1 — see §20.
do_not: infer Settlement merely because people lived near or used a mound, or because a
  mound is "associated with" a broader culture that also built settlements elsewhere —
  the record itself must state that its own scope is the settlement.
fallback: condition not met → proceed to MOUND_TOMB_01.
found_in_current_dataset: at least 1 of 15 (Prehistoric Mounds of Uruguay, verified
  directly against archeomaps_1.html in this v2 audit); the remaining 14 were not
  re-run against this new rule as part of this pass — flagged in §20/final report as
  requiring a follow-up check before implementation.
```

### MOUND_TOMB_01
```text
scope: legacy type = "Mound"
input_condition: text explicitly documents the mound as a burial/funerary feature
                 (interments, grave goods, or explicit "burial mound" identification),
                 AND the record's own scope is the mound/burial feature itself, not a
                 larger settlement or complex it happens to be part of (§8). "A large
                 mound dominates the landscape" does NOT satisfy this condition by
                 itself — that is descriptive, not an explicit funerary statement.
output:
  canonicalType: "Tomb"
  tags: ["funerary:mound"]   # or funerary:tumulus / funerary:kurgan if the specific term
                              # is used explicitly in the text
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.4, §11 — explicit funerary documentation supports Tomb; mere
  physical prominence does not (per the source spec's own worked example).
fallback: condition not met → proceed to MOUND_MONUMENT_01.
```

### MOUND_MONUMENT_01
```text
scope: legacy type = "Mound"
input_condition: text explicitly documents the mound as a non-funerary ceremonial,
                 platform, or effigy earthwork (explicit statement that it is not a burial
                 feature, or explicit "effigy mound" identification). Absence of funerary
                 language is NOT sufficient on its own — see the do_not note below
                 (audit point 7: this stricter standard is unchanged from v1 and is kept
                 deliberately).
output:
  canonicalType: "Monument"
  tags: ["monument:effigy-mound"]   # only if effigy form is explicit; otherwise omit
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.3 — an effigy mound is explicitly Monument, not Tomb, unless
  separately documented as a burial feature.
do_not: reason "not proven Tomb → therefore Monument." Absence of funerary evidence is
  not evidence of monumental identity — it is an absence of evidence, which routes to
  REVIEW or RESEARCH (per the fallback below and MOUND_FALLBACK_01/MOUND_NO_SIGNAL_01),
  never to a forced Monument default. This do_not note is stated explicitly in v2
  because an earlier, superseded line of reasoning (never adopted into v1's actual rule
  text, but worth foreclosing explicitly per the audit) proposed exactly this shortcut.
fallback: condition not met → proceed to MOUND_FORTIFICATION_01.
```

### MOUND_FORTIFICATION_01
```text
scope: legacy type = "Mound"
input_condition: text explicitly documents the mound as a defensive earthwork (e.g.
                 explicit "defensive mound," "earthwork fortification," or equivalent
                 military-use statement).
output:
  canonicalType: "Fortification"
  tags: ["military:earthwork"]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.5 — a defensive earthwork is Fortification with the
  military:earthwork tag; included for completeness even where not observed in the
  current 15, per §19 (general-purpose extension, not overfitting to the current batch).
fallback: condition not met → proceed to MOUND_NO_SIGNAL_01 (if text is empty/near-empty)
  or MOUND_FALLBACK_01 (if text is present but does not satisfy any rule above) — these
  two conditions are mutually exclusive and, together, exhaust every remaining Mound
  record (branching terminal fallback, §7.3 form 3).
```

### MOUND_NO_SIGNAL_01 → RESEARCH (terminal branch)
```text
scope: legacy type = "Mound"
input_condition: `text` is empty or near-empty — no usable signal for any rule above.
output: none assigned automatically.
confidence: RESEARCH
fallback: n/a — terminal state.
```

### MOUND_FALLBACK_01 → REVIEW (terminal branch)
```text
scope: legacy type = "Mound"
input_condition: catch-all — text is present (e.g. purely descriptive language such as "a
                 large mound dominates the landscape") but does not explicitly satisfy any
                 rule above.
output: none assigned automatically.
confidence: REVIEW
rationale: Descriptive-but-non-explicit mound text is the textbook REVIEW case named
  directly in the migration philosophy — present information, ambiguous conclusion.
fallback: n/a — terminal state.
```

The 9 records not covered by `MOUND_ARCHSITE_01` must be run individually through `MOUND_SETTLEMENT_01` → `MOUND_TOMB_01` → `MOUND_MONUMENT_01` → `MOUND_FORTIFICATION_01` → `MOUND_NO_SIGNAL_01`/`MOUND_FALLBACK_01`; no shortcut applies to them as a group.

**Tag note (v2, audit point 10):** do not reflexively add `archaeology:archaeological-site` to `MOUND_ARCHSITE_01` outputs merely because `canonicalType = "Archaeological Site"` — see the Pyramid section's identical note and TAXONOMY.md §43.

---

## 12. Wall Rules

**Scope:** the 18 currently-inspected records with `legacy type = "Wall"`, plus the general framework for future records. **Finding:** these 18 were not sub-categorized into fixed counts during inspection, because the underlying identities are heterogeneous even where the text looks superficially similar. Confirmed cases illustrate the range: *Dun Carloway Broch* (mistagged under Wall; explicit broch/fortification identity), *Moundville Archaeological Park* (mistagged under Wall; explicit multi-mound archaeological complex), and — verified directly against `archeomaps_1.html` in this v2 pass — *Rujm el-Hiri* (site-0354, legacy type "Wall"; text: "Made up of more than 42,000 basalt rocks arranged in concentric circles, it has a mound... at its center... The outermost wall is 520 feet... in diameter" — a non-defensive megalithic monument whose "wall" is one ring of a concentric stone arrangement, not a fortification). No blanket `Wall → X` mapping is valid.

### WALL_FORTIFICATION_01 [TIGHTENED IN v2 — audit point 8B]
```text
scope: legacy type = "Wall"
input_condition: text explicitly identifies the record's OWN SCOPE as a standalone
                 defensive/military structure or system (e.g. "defensive wall," "fortress
                 wall," an explicitly named broch, a frontier wall system, or other
                 explicit military-purpose statement) — not merely that a defensive wall
                 is mentioned as a feature of a larger settlement the record actually
                 represents (§8). A record whose own scope is an entire walled city
                 belongs under WALL_SETTLEMENT_01 below instead, even if its text uses
                 defensive/military language to describe the wall itself.
output:
  canonicalType: "Fortification"
  tags: [<most specific supported military:* tag — e.g. military:defensive-wall,
         military:city-wall, or military:broch — chosen from what the text actually
         supports, not defaulted; see §12 tag note>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.5 — explicit defensive/military identification, of the record's
  own fundamental scope, is the canonical Fortification case. Covers the Dun Carloway
  Broch mistag (a standalone broch, not a component of a larger settlement record).
fallback: condition not met → proceed to WALL_MONUMENT_MEGALITHIC_01.
```

### WALL_MONUMENT_MEGALITHIC_01 [NEW IN v2 — audit point 8A]
```text
scope: legacy type = "Wall"
input_condition: text explicitly represents the record as a stone circle, megalithic
                 arrangement, or comparable non-defensive monumental structure, where the
                 "wall" is merely one element of that structure (e.g. the outer ring of a
                 concentric stone arrangement) rather than a fortification or settlement
                 boundary. Verified example from the live dataset: Rujm el-Hiri
                 (site-0354) — see this section's header. This rule is deliberately
                 general and reusable — it is not conditioned on this or any other
                 specific site name (audit point 17).
output:
  canonicalType: "Monument"
  tags: [<most specific supported monument:* tag — e.g. monument:stone-circle,
         monument:megalithic, monument:standing-stone, or monument:alignment — chosen
         from what the text actually supports>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.3/§17 — stone circles and megalithic monuments are explicitly
  supported under Monument with the relevant monument:* tags; a "wall" that is
  structurally one ring of such an arrangement is not a fortification merely because the
  legacy type string used the word "Wall."
fallback: condition not met → proceed to WALL_SETTLEMENT_01.
found_in_current_dataset: at least 1 of 18 (Rujm el-Hiri, verified directly against
  archeomaps_1.html in this v2 audit); the remaining 17 were not re-run against this new
  rule as part of this pass — flagged in §20/final report as requiring a follow-up check.
```

### WALL_SETTLEMENT_01 [CORRECTED IN v2 — audit point 9]
```text
scope: legacy type = "Wall"
input_condition: text explicitly identifies the record's own scope as representing an
                 entire walled city or settlement (the wall is the surviving remnant of
                 the settlement as a whole, not a standalone defensive structure) (§8).
output:
  canonicalType: "Settlement"
  tags: [<most specific supported settlement:* tag that the text actually establishes —
         e.g. settlement:city, settlement:town, settlement:village — OMIT if the text
         does not support anything more specific than the bare Type; do NOT default to
         settlement:urban.>,
         <most specific supported military:* wall tag that the text actually
         establishes — e.g. military:city-wall, military:defensive-wall — OMIT if
         unsupported; do NOT default to military:city-wall.>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.1/§34 — a settlement whose most visible remaining feature is its
  wall remains a Settlement, per the complex-archaeological-city pattern. v1 hardcoded
  settlement:urban and military:city-wall as unconditional outputs of this rule; TAXONOMY
  §43 ("Do Not Over-tag") and §20/§16's tag vocabularies both make clear that the
  *specific* subtype tag must be earned from the record's own text like any other tag,
  not defaulted for convenience. A village-scale walled settlement tagged
  settlement:urban, or a town wall tagged military:city-wall on no textual basis, is
  exactly the kind of unsupported-but-plausible-looking tag TAXONOMY.md §43 warns
  against.
fallback: condition not met → proceed to WALL_ARCHSITE_MISTAG_01.
```

### WALL_ARCHSITE_MISTAG_01
```text
scope: legacy type = "Wall"
input_condition: text explicitly identifies the record's own scope as a multi-component
                 archaeological complex unrelated to a standalone wall structure (i.e.
                 "Wall" was a mistag for a different kind of site entirely) (§8).
output:
  canonicalType: "Archaeological Site"
  # NOTE (v2, audit point 10): archaeology:archaeological-site is NOT added reflexively
  # here — see the tag note at the end of this section.
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.9 — covers confirmed mistags such as Moundville Archaeological
  Park, where the legacy "Wall" label does not describe the site's actual content at all.
fallback: condition not met → proceed to WALL_INFRASTRUCTURE_01.
```

### WALL_INFRASTRUCTURE_01
```text
scope: legacy type = "Wall"
input_condition: text explicitly documents the wall as part of hydraulic or infrastructural
                 works (e.g. explicit terracing, water-management, or retaining-structure
                 identification unrelated to defense or settlement boundary).
output:
  canonicalType: "Infrastructure"
  tags: ["infrastructure:water-system"]   # or the specific applicable infrastructure tag
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.7 — included for completeness per §19 (general extensibility);
  a wall's function is not defensive by default.
fallback: condition not met → proceed to WALL_MONUMENT_01.
```

### WALL_MONUMENT_01
```text
scope: legacy type = "Wall"
input_condition: text explicitly identifies the wall as a standalone commemorative or
                 monumental structure — not defensive, not a settlement boundary, not
                 infrastructural, and not the concentric/megalithic case already covered
                 by WALL_MONUMENT_MEGALITHIC_01 above.
output:
  canonicalType: "Monument"
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.3 — explicit non-defensive, non-infrastructural, standalone
  monumental identity.
fallback: condition not met → proceed to WALL_NO_SIGNAL_01 (if text is empty/near-empty)
  or WALL_FALLBACK_01 (if text is present but does not satisfy any rule above) — these
  two conditions are mutually exclusive and, together, exhaust every remaining Wall
  record (branching terminal fallback, §7.3 form 3).
```

### WALL_NO_SIGNAL_01 → RESEARCH (terminal branch)
```text
scope: legacy type = "Wall"
input_condition: `text` is empty or near-empty — no usable signal for any rule above.
output: none assigned automatically.
confidence: RESEARCH
fallback: n/a — terminal state.
```

### WALL_FALLBACK_01 → REVIEW (terminal branch)
```text
scope: legacy type = "Wall"
input_condition: catch-all — text is present (e.g. "a wall survives at the site") but does
                 not explicitly satisfy any rule above.
output: none assigned automatically.
confidence: REVIEW
rationale: "A wall survives at the site" does not by itself prove Fortification — this is
  the textbook REVIEW case named directly in the migration philosophy.
fallback: n/a — terminal state.
```

All 18 currently-inspected Wall records must be evaluated individually against this chain; the finding explicitly rules out treating them as a single batch.

**Tag note (v2, audit points 9, 10):**
- Do not reflexively add `archaeology:archaeological-site` to `WALL_ARCHSITE_MISTAG_01` outputs (same reasoning as Pyramid/Mound — TAXONOMY.md §43).
- Do not default `settlement:urban` or `military:city-wall` on `WALL_SETTLEMENT_01` outputs. Use the most specific `settlement:*`/`military:*` tag the record's own text actually supports; omit either tag entirely if the text doesn't support a more specific value than the bare Type.

---

## 13. Forest Rules (NEW in v2.2)

**Scope:** the 9 records with `legacy type = "Forest"`. **Finding:** no unconditional AUTO rule is valid for this group — as with Pyramid/Cairn/Mound/Wall, every record required at least a conditional check against the record's own text (and, newly for this group, against whether that text is complete). Evaluate the following rules **in order** for every Forest record.

**Origin and the truncated-text evidence rule:** this group's inspection surfaced a distinct evidentiary issue not previously named in this document: several Forest records have `text` visibly cut off mid-sentence in the live source data. An early pass proposed classifying three of them `Other` on the strength of the surviving (but incomplete) text showing no cultural/historical content. That was corrected before these rules were finalized: a classification resting on the *absence* of competing evidence cannot be safely made from a record whose text does not reach its own end, because the absence is only confirmed for what survived, not for the whole original record. A classification resting on *positive* explicit evidence is unaffected by this and may still fire on a truncated record. This distinction is load-bearing in `FOREST_NATURAL_COMPLETE_01`'s and `FOREST_INSUFFICIENT_EVIDENCE_01`'s conditions below, and was restated and extended for `Observatory` (§14, added in v2.3) — see that section's own introduction for how the principle was refined further. It remains the general principle applied to `Ruins` (§15) and to `null`/missing `type` (§16, added in v2.5).

### FOREST_SACRED_01
```text
scope: legacy type = "Forest"
input_condition: text explicitly names a specific culture/people AND documents an
                 actual religious, spiritual, or mythological tradition attached to
                 the forest/grove/landscape itself — historical and/or currently
                 practiced — not merely a name, reputation, or feature mentioned in
                 passing. The record's own scope must be the forest/landscape itself,
                 not a single structure within it that the forest merely surrounds
                 (Record-scope principle, §8).
output:
  canonicalType: "Landscape"
  tags: ["landscape:sacred", "landscape:forest"]   # archaeology:ruins MAY be added
                                                     # if built remains are explicitly
                                                     # documented within the landscape
                                                     # — TAXONOMY.md §8, §43 restraint
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.13 — a natural landmark with documented cultural,
  mythological, or religious significance is Landscape even where constructed
  remains are also present within it ("even if it has no constructed archaeological
  remains" — presence of remains strengthens, not weakens, the case). This condition
  rests on POSITIVE evidence, so it is evaluated identically regardless of whether
  the record's text is complete or truncated (truncated-text evidence rule, above) —
  a truncated record can still satisfy this rule if the surviving portion already
  contains the required positive evidence.
fallback: condition not met → proceed to FOREST_NATURAL_COMPLETE_01.
found_in_current_dataset: 1 of 9 records (site-1671).
```

### FOREST_NATURAL_COMPLETE_01
```text
scope: legacy type = "Forest"
input_condition: text is NOT visibly truncated before completion (i.e. the record's
                 text reaches its own end — a complete final sentence/thought, not a
                 mid-sentence cutoff) AND describes the forest/grove/reserve
                 exclusively in physical, ecological, scientific, or recreational
                 terms, with no documented cultural, mythological, or religious
                 content anywhere in the (complete) record, AND the record's own
                 scope is the natural feature itself, not a built or archaeological
                 structure it happens to mention (§8).
output:
  canonicalType: "Other"
  tags: []   # landscape:forest MAY be added descriptively per curator judgement;
             # not required — Type = Other already signals the record falls outside
             # this taxonomy's historical/cultural scope (§43 restraint on
             # redundant tagging)
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.13-§4.14 — a natural feature with no documented cultural or
  historical content beyond its physical existence does not belong in this taxonomy
  as a historical/archaeological site; §44 prescribes Other (or leave unclassified)
  rather than guessing. THE COMPLETENESS REQUIREMENT IS LOAD-BEARING (truncated-text
  evidence rule, above): this rule's condition depends on the ABSENCE of cultural
  content across the whole record. That absence is only verifiable from a complete
  text. A visibly truncated record can never satisfy this rule, regardless of how
  unambiguous the surviving portion looks, and must fall through to
  FOREST_INSUFFICIENT_EVIDENCE_01 instead.
fallback: condition not met → proceed to FOREST_INSUFFICIENT_EVIDENCE_01.
found_in_current_dataset: 3 of 9 records (site-1713, site-1714, site-1827).
```

### FOREST_INSUFFICIENT_EVIDENCE_01 → RESEARCH
```text
scope: legacy type = "Forest"
input_condition: n/a — terminal rule. Reached by any record for which
                 FOREST_SACRED_01 did not fire (no positive sacred/cultural-landscape
                 evidence) AND FOREST_NATURAL_COMPLETE_01 did not fire. This
                 necessarily covers every record satisfying at least one of:
                   (a) text is empty or contains no substantive content;
                   (b) text is visibly truncated before completion, such that an
                       absence-dependent conclusion (e.g. "no cultural content")
                       cannot be confirmed for the whole record (truncated-text
                       evidence rule, above);
                   (c) text is complete but its only substantive content is an
                       unverified popular/touristic or paranormal reputation (e.g.
                       "most haunted," "Bermuda Triangle of...") with no historical
                       event, documented tradition, or other identity-establishing
                       detail — the PYRAMID_XIAN_CLUSTER_01 pattern (§2, §9).
output: none assigned automatically.
confidence: RESEARCH
rationale: §2 — each converging sub-case is a genuine information gap, not an
  interpretation problem needing a human to pick between plausible Types (which
  would be REVIEW instead): an empty record has nothing to classify from (Migration
  Principle 1.5); a truncated record cannot support a conclusion that depends on
  absence of competing content, because that absence is unverifiable past the point
  where the text stops; an unverified popular/legendary claim with no
  identity-establishing detail is the same RESEARCH gap already identified for
  PYRAMID_XIAN_CLUSTER_01 — "the test is never 'is the popular framing of this site
  contested?' — it is 'does the record itself establish what the site fundamentally
  is?'" (§2). All three sub-cases converge on RESEARCH, not REVIEW, and on the SAME
  confidence class, so one terminal rule is correct rather than a branching
  REVIEW/RESEARCH terminal (§7.3 form 3, the Mound/Wall pattern) — Forest produced
  zero REVIEW records, so there is nothing for a branch to split. This rule's
  condition is written generally (empty / truncated-without-positive-evidence /
  unestablished-legend) rather than keyed to today's five specific record ids, so it
  will correctly catch future Forest records of the same evidentiary shape.
fallback: n/a — terminal state for records meeting the condition.
found_in_current_dataset: 5 of 9 records (site-0049, site-0152, site-0709, site-1214,
  site-1227).
```

**Chain:** `FOREST_SACRED_01` → `FOREST_NATURAL_COMPLETE_01` → `FOREST_INSUFFICIENT_EVIDENCE_01` (terminal). Three rules, single terminal (§7.3 form 2) — no branching terminal needed, since this batch produced no REVIEW records to split against RESEARCH.

**Provenance/workflow compatibility (§4–§5, reused as-is, no redesign):**
- `FOREST_SACRED_01` and `FOREST_NATURAL_COMPLETE_01` hits populate `provenance.type` with `method: "conditional"`, `ruleId` set accordingly, `sourceFields: ["text"]` — no `workflow.type` object created (§5.3 rule 1: CONDITIONAL hits get no workflow object; the full trail lives in provenance).
- `FOREST_INSUFFICIENT_EVIDENCE_01` hits populate `provenance.type` with `value: null`, `method: null`, `ruleId: "FOREST_INSUFFICIENT_EVIDENCE_01"`, and create `workflow.type` with `state: "research"`, `ruleId: "FOREST_INSUFFICIENT_EVIDENCE_01"` — matching the `PYRAMID_PHARAONIC_EMPTY_TEXT_01` worked example in §4.3 exactly.
- No duplicate flagging required under §6 — the Sundarbans pair (site-1713/site-1714) is independently, legitimately inscribed by two different countries, not a confirmed duplicate; noted in each record's `notes` field rather than `dataQuality`.

**Forest chain consistency check (v2.2), mirroring the §7.5 method used for Pyramid/Cairn/Mound/Wall:**
- **Rule order:** `FOREST_SACRED_01` → `FOREST_NATURAL_COMPLETE_01` → `FOREST_INSUFFICIENT_EVIDENCE_01`.
- `FOREST_SACRED_01`'s fallback names `FOREST_NATURAL_COMPLETE_01` — exists, is the next rule in the list. `FOREST_NATURAL_COMPLETE_01`'s fallback names `FOREST_INSUFFICIENT_EVIDENCE_01` — exists, is the next rule in the list. `FOREST_INSUFFICIENT_EVIDENCE_01` is terminal, `fallback: n/a`, paired with `confidence: RESEARCH` — correct use of §7.3 form 2.
- **Reachability:** every rule other than the chain's first rule (`FOREST_SACRED_01`, the chain's entry point per §7.2 point 1) is named as a fallback target by exactly one other rule. No orphaned rule.
- **No silent default:** the terminal rule produces an explicit `RESEARCH` label with no `canonicalType` assigned.
- **Specific-before-general (§7.1):** `FOREST_SACRED_01` (highest-information, positive-evidence condition) precedes `FOREST_NATURAL_COMPLETE_01` (lower-information, absence-based condition), which precedes the terminal catch-all — the ordering that makes the truncated-text evidence rule work correctly, since a truncated record with strong positive sacred evidence is still caught before any truncation-sensitive rule runs.
- **Full-batch termination check:** all 9 live Forest records trace to a result — site-1671 → `FOREST_SACRED_01` (Landscape); site-1713, site-1714, site-1827 → `FOREST_NATURAL_COMPLETE_01` (Other); site-0049, site-0152, site-0709, site-1214, site-1227 → `FOREST_INSUFFICIENT_EVIDENCE_01` (RESEARCH). 9 of 9 terminate in a canonical classification or RESEARCH; 0 in REVIEW; 0 fall through the chain without a result.
- **No defect found.**

---

## 14. Observatory Rules (NEW in v2.3)

**Scope:** the 8 records with `legacy type = "Observatory"`. **Finding:** no unconditional AUTO rule is valid for this group — the same evidentiary discipline required everywhere else in this document applies with unusual force here, because the legacy string `"Observatory"` is spelled identically to the canonical Type of the same name, and the legacy `category` field on every one of the 8 records simply repeats `type` rather than offering independent signal. `legacy type = Observatory → canonicalType = Observatory` is explicitly **not** an AUTO or default mapping — every record was evaluated as if its legacy type and category said nothing at all (`TAXONOMY.md` §4.12, Migration Principle 1.2). Evaluate the following rules **in order** for every Observatory record.

**Why the chain has five rules, not three:** Forest's chain (§13) needed only three rules because that batch produced zero REVIEW records. Observatory's inspection surfaced a genuine REVIEW case (a record naming two distinct, unelaborated candidate identities for the same site — the same shape as this document's own worked REVIEW example in §2, "Roman fort and later monastery") and, separately, exposed a risk in a naive generalization of Forest's terminal rule: a terminal RESEARCH rule written broadly enough to catch "everything else" would silently swallow future records that have substantive-but-ambiguous evidence and genuinely belong in REVIEW, not RESEARCH. This chain therefore keeps RESEARCH scoped to genuine information gaps and adds a true general-purpose REVIEW catch-all as the actual terminal point, preserving `MIGRATION_RULES.md` §2's RESEARCH/REVIEW distinction ("the answer isn't in here" vs. "the answer is in here somewhere") for records this dataset doesn't yet contain, not just the 8 it does.

### OBSERVATORY_PURPOSEBUILT_01
```text
scope: legacy type = "Observatory"
input_condition: text explicitly documents BOTH (a) a specific purpose-built
                 structural or institutional form (a tower, building, or comparable
                 dedicated structure — not a generic monument/megalithic
                 arrangement) AND (b) a specific, direct statement of actual
                 systematic astronomical/calendrical observation activity — stated
                 as established fact, not alignment/orientation/symbolism alone and
                 not a hedge such as "may have been used for observation." Neither
                 condition may be satisfied by legacy type, legacy category, site
                 name, or a bare "observatory" label (TAXONOMY.md §4.12's explicit
                 false-positive list). The record's own scope must be this
                 structure itself, not a component within a larger site (§8).
output:
  canonicalType: "Observatory"
  tags: ["construction:stone"]   # or the equivalent construction:* value ONLY where
                                   # explicitly textually supported; omit otherwise.
                                   # architecture:observatory is available but
                                   # optional/not required per §43 (redundant with
                                   # the Type itself).
  functions: ["astronomical"]     # justified by the SAME explicit text that
                                   # satisfies the structural half of this
                                   # condition — never inferred from architecture,
                                   # alignment, or Type alone.
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.12 — Observatory is reserved for a site whose primary,
  well-documented identity IS a purpose-built astronomical/scientific observation
  structure. This rule requires the record to earn that status on its own explicit
  terms — a structural description AND a direct statement of use, not a name match.
  Because both halves of this condition are POSITIVE evidence, the rule fires
  identically on complete or truncated records, provided the required statements
  appear before any cutoff (truncated-text evidence rule, established in §13).
fallback: condition not met → proceed to OBSERVATORY_MONUMENT_FORM_01.
found_in_current_dataset: 2 of 8 records (site-0360 Cheomseongdae — "star-gazing
  tower," explicit "astronomical observatory"/"scientific institution" framing;
  site-1891 Chankillo Archaeoastronomical Complex — "a row of 13 stone towers...
  used to track the sun's rising and setting positions throughout the year").
```

### OBSERVATORY_MONUMENT_FORM_01
```text
scope: legacy type = "Observatory"
input_condition: text positively describes a megalithic/monumental physical form
                 (e.g. a stone circle, henge, standing-stone field, or comparable
                 arrangement) sufficient on its own for canonicalType = Monument
                 per TAXONOMY.md §4.3 — regardless of what the legacy type, legacy
                 category, or the site's popular/compound name separately imply
                 about an astronomical purpose. The record's own scope must be this
                 monument itself, not a component within a larger site (§8).
output:
  canonicalType: "Monument"
  tags: [<the specific monument:* value the text's physical description actually
         supports, e.g. monument:stone-circle for a circular stone arrangement,
         monument:henge for a ditched/palisaded circular enclosure,
         monument:megalithic as the safe general fallback where the text
         establishes a megalithic field but not a specific arrangement pattern>]
  # functions: intentionally NOT populated by this rule. See rationale.
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.3's own closing paragraphs keep a stone circle, henge, or
  alignment as Monument even where a credible or popularly-claimed astronomical
  function exists — Observatory applies only where the site is ITSELF a
  purpose-built observation structure, which OBSERVATORY_PURPOSEBUILT_01 already
  tests for and this rule is reached only after failing. The Type call rests on
  positive physical-form evidence and is therefore truncation-safe (truncated-text
  evidence rule, §13): a record can satisfy this rule even if cut off immediately
  after establishing the physical form.
  IMPORTANT — Function semantics (v2.3 refinement): this rule deliberately leaves
  `functions` unpopulated whenever the record's own text does not independently
  document actual astronomical use. That silence means only that THIS RULE'S
  evidence threshold for the astronomical Function was not met by what the record
  currently says — it is never to be read, encoded, or implemented as an assertion
  that astronomical use did not exist historically, nor as `functions: []`
  standing in for a negative claim. A later research pass may add
  `functions: ["astronomical"]` on its own independent evidence at any time,
  exactly as any other Function may be added post-migration (§4.2's array-provenance
  model already supports this without redesign — a later-added Function entry
  simply carries `method: "research-derived"` alongside this rule's
  `method: "conditional"` Type entry).
fallback: condition not met → proceed to OBSERVATORY_COMPETING_LABELS_01.
found_in_current_dataset: 3 of 8 records (site-0118 Amape/Amazon Stonehenge —
  "127 blocks of granite... standing upright in circles"; site-0353 Goseck Circle —
  "concentric ditches... and two palisade rings"; site-0848 Hill O Many Stanes —
  "about 200 upright stones"). None of the three records' own text documents the
  specific astronomical claim needed to also earn `functions: ["astronomical"]`,
  despite each site's real-world archaeoastronomical reputation — a clean
  illustration of Migration Principle 1.2 (legacy fame is not record evidence).
```

### OBSERVATORY_COMPETING_LABELS_01 → REVIEW
```text
scope: legacy type = "Observatory"
input_condition: the record explicitly names TWO OR MORE distinct candidate
                 identities/Types for the site (not merely one claim repeated, and
                 not a bare name/label with no second candidate offered), without
                 elaborating physical or functional detail sufficient to resolve
                 between them — the same shape as this document's own worked
                 REVIEW example in §2 ("Roman fort and later monastery").
output: none assigned automatically.
confidence: REVIEW
rationale: §2 — "the answer is in here somewhere, a human needs to pick it." Two
  named, textually-present candidate identities is real evidence, just not
  self-resolving evidence; this is categorically different from a record offering
  only one unsubstantiated claim (which fails this rule and falls through to
  OBSERVATORY_INSUFFICIENT_EVIDENCE_01 instead — see that rule's rationale for the
  precise distinction, worked through in full for this batch's own site-0361).
fallback: if this rule's own condition is not met, proceed to
  OBSERVATORY_INSUFFICIENT_EVIDENCE_01 (§7.3) — this heading's "→ REVIEW" describes
  the outcome ONLY for records that match its condition, the same convention used
  by PYRAMID_FRINGE_01/PYRAMID_XIAN_CLUSTER_01/PYRAMID_CITY_AMBIGUOUS_01 (§9).
found_in_current_dataset: 1 of 8 records (site-0361 Kokino — explicitly called both
  "an important archaeological site" and "a megalithic observatory," with neither
  label substantiated by physical or functional description; discovery metadata —
  archaeologist name, year, approximate distance from a town — is the only other
  content present).
```

### OBSERVATORY_INSUFFICIENT_EVIDENCE_01 → RESEARCH
```text
scope: legacy type = "Observatory"
input_condition: reached only where a genuine, specifically-identifiable
                 information gap exists — NOT a universal catch-all for any record
                 that fails the rules above. Fires only where at least one of the
                 following is true:
                   (a) text is empty or near-empty;
                   (b) text is complete but consists of a single unsubstantiated
                       assertion or anecdote, with no second named candidate
                       identity (distinguishing this from
                       OBSERVATORY_COMPETING_LABELS_01, which requires two or
                       more) and no physical/functional description
                       substantiating it;
                   (c) text is visibly truncated AND the surviving portion
                       contains no positive evidence at all establishing the
                       record's fundamental physical form or identity (distinct
                       from OBSERVATORY_MONUMENT_FORM_01's truncated-but-
                       positively-evidenced case, and from
                       OBSERVATORY_PURPOSEBUILT_01's truncated-but-positively-
                       evidenced case);
                   (d) any other specifically-identifiable missing-information
                       condition consistent with the RESEARCH test in
                       MIGRATION_RULES.md §2 ("the answer isn't in here").
output: none assigned automatically.
confidence: RESEARCH
rationale: §2 — each of (a)-(d) is a genuine information gap, not an
  interpretation problem: an empty record has nothing to classify from (Migration
  Principle 1.5); a single unsubstantiated claim with no competing identity and no
  physical/functional description offers nothing for a human to choose BETWEEN
  (contrast OBSERVATORY_COMPETING_LABELS_01's two-candidate case, which does); a
  truncated record with literally no positive evidence before the cutoff is
  indistinguishable from an empty one for classification purposes. This rule is
  deliberately narrower than a bare "nothing else matched" condition (v2.3
  refinement, prompted by review of this exact chain) — a future record with
  substantive but genuinely ambiguous evidence that does not happen to fit
  OBSERVATORY_COMPETING_LABELS_01's specific two-named-candidates shape must NOT
  be swept into RESEARCH by default; it falls through to OBSERVATORY_FALLBACK_01
  instead, preserving REVIEW as the correct outcome for "information present,
  interpretation required" regardless of which specific mid-chain rule it fails to
  match.
fallback: condition not met → proceed to OBSERVATORY_FALLBACK_01.
found_in_current_dataset: 2 of 8 records (site-0035 Chilbolton Observatory —
  complete text, but a single hedged, contested anecdote ["supposedly got an
  answer back"] with no structural description and no second candidate identity,
  matching sub-condition (b); site-0357 Yantra Mantra — empty text, matching
  sub-condition (a)).
```

### OBSERVATORY_FALLBACK_01 → REVIEW
```text
scope: legacy type = "Observatory"
input_condition: n/a — terminal rule. Reached by any record for which none of
                 OBSERVATORY_PURPOSEBUILT_01, OBSERVATORY_MONUMENT_FORM_01,
                 OBSERVATORY_COMPETING_LABELS_01, or
                 OBSERVATORY_INSUFFICIENT_EVIDENCE_01 fired — i.e. the record
                 contains substantive information (so it is not a genuine
                 information gap under the preceding rule) that nonetheless does
                 not deterministically establish a specific canonical Type under
                 any rule above.
output: none assigned automatically.
confidence: REVIEW
rationale: §2 — this is the general "information present, human interpretation
  required" case, kept distinct from RESEARCH's "information missing" case per
  the v2.3 refinement described in this section's introduction. Unlike
  OBSERVATORY_COMPETING_LABELS_01, this rule does not require the specific
  two-named-candidates shape — it exists precisely so that a future record with
  substantive but differently-ambiguous evidence lands in REVIEW rather than being
  forced into either a specific Type it doesn't clearly earn or a RESEARCH state
  that misrepresents "there's something here, it's just unresolved" as "there's
  nothing here."
fallback: n/a — terminal state for records meeting the condition.
found_in_current_dataset: 0 of 8 records. No record in the current live batch
  reaches this rule — every one of the 8 resolved at OBSERVATORY_PURPOSEBUILT_01,
  OBSERVATORY_MONUMENT_FORM_01, OBSERVATORY_COMPETING_LABELS_01, or
  OBSERVATORY_INSUFFICIENT_EVIDENCE_01. This rule exists for dataset growth and
  future legacy-value additions, not because today's batch needed it — see the
  consistency check below for the full trace confirming this.
```

**Chain:** `OBSERVATORY_PURPOSEBUILT_01` → `OBSERVATORY_MONUMENT_FORM_01` → `OBSERVATORY_COMPETING_LABELS_01` → `OBSERVATORY_INSUFFICIENT_EVIDENCE_01` → `OBSERVATORY_FALLBACK_01` (terminal). Five rules — two more than Forest's three — because this batch produced a genuine REVIEW case and, independently, because a single broad RESEARCH terminal was judged unsafe as a general pattern (see this section's introduction).

**Provenance/workflow compatibility (§4–§5, reused as-is, no redesign):**
- `OBSERVATORY_PURPOSEBUILT_01` and `OBSERVATORY_MONUMENT_FORM_01` hits populate `provenance.type` with `method: "conditional"`, `ruleId` set accordingly, `sourceFields: ["text"]`; `OBSERVATORY_PURPOSEBUILT_01` additionally populates a `provenance.functions` array entry for the `astronomical` value with the same `method`/`ruleId`. `OBSERVATORY_MONUMENT_FORM_01` populates no `functions` entry at all — not an entry with a null/negative value, simply no entry, matching the "silence ≠ absence" principle in that rule's own rationale. Neither of these two rules creates a `workflow.type` object (§5.3 rule 1).
- `OBSERVATORY_COMPETING_LABELS_01` and `OBSERVATORY_FALLBACK_01` hits populate `provenance.type` with `value: null`, `method: null`, `ruleId` set accordingly, and create `workflow.type` with `state: "review"`, `ruleId` set accordingly.
- `OBSERVATORY_INSUFFICIENT_EVIDENCE_01` hits populate `provenance.type` with `value: null`, `method: null`, `ruleId: "OBSERVATORY_INSUFFICIENT_EVIDENCE_01"`, and create `workflow.type` with `state: "research"`, `ruleId: "OBSERVATORY_INSUFFICIENT_EVIDENCE_01"` — matching the `PYRAMID_PHARAONIC_EMPTY_TEXT_01` worked example in §4.3.

**Observatory chain consistency check (v2.3), mirroring the §7.5 method used for Pyramid/Cairn/Mound/Wall and the Forest check in §13:**
- **Rule order:** `OBSERVATORY_PURPOSEBUILT_01` → `OBSERVATORY_MONUMENT_FORM_01` → `OBSERVATORY_COMPETING_LABELS_01` → `OBSERVATORY_INSUFFICIENT_EVIDENCE_01` → `OBSERVATORY_FALLBACK_01`.
- Every non-terminal rule's fallback names exactly the next rule in the list; `OBSERVATORY_FALLBACK_01` is terminal with `fallback: n/a`, paired with `confidence: REVIEW` — correct use of §7.3 form 2. No branching terminal (form 3) is needed, since RESEARCH and REVIEW are resolved by two separate, ordered mid-chain/terminal rules rather than a single mutually-exclusive pair.
- **Reachability:** every rule other than the chain's first rule (`OBSERVATORY_PURPOSEBUILT_01`, the entry point per §7.2 point 1) is named as a fallback target by exactly one other rule. No orphaned rule.
- **No silent default:** `OBSERVATORY_COMPETING_LABELS_01`, `OBSERVATORY_INSUFFICIENT_EVIDENCE_01`, and `OBSERVATORY_FALLBACK_01` each produce an explicit REVIEW or RESEARCH label with no `canonicalType` assigned; `OBSERVATORY_MONUMENT_FORM_01` assigns a Type but explicitly withholds Function rather than defaulting it to any value.
- **Specific-before-general (§7.1):** purpose-built positive evidence (highest information) → monument-form positive evidence → named-competing-labels (real but unresolved evidence) → specific information-gap patterns → general REVIEW catch-all (lowest information about *why* it didn't resolve, but not itself an information gap). This ordering is what keeps RESEARCH from becoming a universal fallback: a record must affirmatively match one of (a)-(d) in `OBSERVATORY_INSUFFICIENT_EVIDENCE_01` to receive RESEARCH; everything else that isn't resolved by an earlier rule lands in REVIEW instead.
- **Full-batch termination check, all 8 live records traced against the approved Decision Matrix outcome:**
  - site-0360 Cheomseongdae → `OBSERVATORY_PURPOSEBUILT_01` → `Observatory` + `astronomical`.
  - site-1891 Chankillo → `OBSERVATORY_PURPOSEBUILT_01` → `Observatory` + `astronomical`.
  - site-0118 Amape → `OBSERVATORY_MONUMENT_FORM_01` → `Monument`.
  - site-0353 Goseck Circle → `OBSERVATORY_MONUMENT_FORM_01` → `Monument`.
  - site-0848 Hill O Many Stanes → `OBSERVATORY_MONUMENT_FORM_01` → `Monument`.
  - site-0361 Kokino → `OBSERVATORY_COMPETING_LABELS_01` → REVIEW.
  - site-0035 Chilbolton → `OBSERVATORY_INSUFFICIENT_EVIDENCE_01` (sub-condition b) → RESEARCH.
  - site-0357 Yantra Mantra → `OBSERVATORY_INSUFFICIENT_EVIDENCE_01` (sub-condition a) → RESEARCH.
  - **Result: Observatory — 2; Monument — 3; REVIEW — 1; RESEARCH — 2; `OBSERVATORY_FALLBACK_01` — 0.** This is an exact match to the approved Decision Matrix (2/3/1/2, AUTO 0, CONDITIONAL 5). No classification outcome changed during formalization — the two-rule RESEARCH/REVIEW split changed *which rule* produces each unresolved record's state label and *why*, not the state or Type any record actually receives.
- **No defect found.**

---

## 15. Ruins Rules (NEW in v2.4)

**Scope:** the 346 records with `legacy type = "Ruins"`. **Finding:** `"Ruins"` is explicitly *not* a canonical Type (`TAXONOMY.md` Migration Rule 14) and is the largest and most heterogeneous legacy value processed by this document so far — larger than Pyramid, Cairn, Mound, Wall, Forest, and Observatory combined. No unconditional AUTO rule is valid: the 346 records resolve to nine different canonical Types plus REVIEW and RESEARCH outcomes.

**Origin and process (four passes, documented here so the final rule chain doesn't read as though it arrived fully-formed):**
1. An initial full inspection of all 346 records produced a first Decision Matrix.
2. A structural audit against this document's own v2.2/v2.3 principles found two systematic defects: (a) the initial Settlement bucket had been assembled by scanning for settlement-family keywords (`city`, `town`, `village`, `settlement`) anywhere in the text, rather than requiring the record's own scope to be established — exactly the `PYRAMID_CITY_01`/§8 record-scope failure mode this document has guarded against since v2, but re-introduced here at first pass; (b) `archaeology:ruins` had been attached mechanically to every successful classification merely because `legacy type === "Ruins"`, rather than requiring independent positive evidence of ruined/non-extant condition (Migration Principle 1.2). Both were corrected; 28 Settlement records moved to more specific Types, REVIEW, or RESEARCH, the truncated-text evidence rule (§13) was applied retroactively (41 further records moved from a Rule-14-style default to RESEARCH once it was recognized that "no specific signal found before the cutoff" is an absence-based conclusion, not a safe one on truncated text), and `archaeology:ruins` was withdrawn from several records describing presently-living, non-ruined places.
3. An independent adversarial re-audit specifically targeted the corrected Settlement bucket with a mechanical test (below) and found 13 further false positives the second pass had missed — including one record with no settlement-family word anywhere in its text at all, and one (`Kilcrea Friary`) whose *actual*, explicit, positive Type (Religious Site) had been missed entirely because a different, distant place's name happened to match the keyword scan first.
4. This section formalizes the result of all three correction passes. **`RUINS_SETTLEMENT_01` in particular should be read as a rule that failed twice on the exact failure mode it now exists to prevent, before being written narrowly enough to actually prevent it** — the mechanical test in that rule's `input_condition` is not decorative.

**The record-scope principle (§8) applies here with more force than in any prior group**, because `"Ruins"` records are disproportionately likely to *mention* a nearby, modern, or historically-associated settlement as geographic or administrative context without that place being the record's own subject. **The truncated-text evidence rule (§13, extended §14)** also applies with more force than in any prior group, because the live data's `text` field is visibly truncated (cut off mid-sentence, not reaching its own end) far more often in this legacy value than in any other inspected so far — positive evidence occurring before the cutoff still fires a rule; the absence of evidence before the cutoff never does.

Evaluate the following rules **in order** for every Ruins record.

### RUINS_TOMB_01
```text
scope: legacy type = "Ruins"
input_condition: text identifies the record's own scope — not a component mentioned in
                 passing, and not a comparably-evidenced competing identity elsewhere in
                 the same record (§8; see RUINS_AMBIGUOUS_01 for the competing-evidence
                 case) — as a tomb, mausoleum, necropolis, burial mound, burial chamber,
                 rock-cut tomb, or other explicit funerary structure.
output:
  canonicalType: "Tomb"
  tags: [<funerary:* value the text actually supports>, "archaeology:ruins" per the
         tag rule below]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.4 — an explicitly documented funerary structure is a Tomb
  regardless of the "Ruins" legacy label's non-specificity.
fallback: condition not met → proceed to RUINS_RELIGIOUS_01.
found_in_current_dataset: 1 of 346 (a record whose text leads with rock-cut tombs as
  its own subject, explicitly distinguishing a separately-named nearby city as a
  different site).
```

### RUINS_RELIGIOUS_01
```text
scope: legacy type = "Ruins"
input_condition: text identifies the record's own scope as a temple, church, cathedral,
                 mosque, synagogue, monastery, shrine, sanctuary, abbey, friary, or
                 comparable religious/sacred institution — including where that identity
                 is stated in the record's own name (e.g. an explicit "Friary"/"Abbey"/
                 "Cathedral" in `n`) and corroborated or left unrebutted by `text` —
                 without a comparably explicit competing identity elsewhere in the record.
output:
  canonicalType: "Religious Site"
  tags: [<architecture:* value the text/name actually supports — e.g. monastery,
         cathedral>, "archaeology:ruins" per the tag rule below]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.2 — an explicit religious institution identity, whether
  established by text or by an unambiguous name, is a Religious Site. A distant or
  differently-named place mentioned only as a distance/location bearing (e.g. "a short
  distance west of [City]") does not compete with this and does not block the rule.
fallback: condition not met → proceed to RUINS_PALACE_01.
found_in_current_dataset: 4 of 346, including one record where the correct Religious
  Site identity was stated plainly in the record's own name but had been missed
  entirely at first pass because an unrelated city name elsewhere in the text matched
  a keyword scan first — the exact failure this rule's ordering (checked before
  RUINS_SETTLEMENT_01) exists to prevent.
```

### RUINS_PALACE_01
```text
scope: legacy type = "Ruins"
input_condition: text identifies the record's own scope — not a component of a larger
                 settlement record (§8; see TAXONOMY.md §4.6's own settlement/palace
                 split) — as a monumental elite or royal residence.
output:
  canonicalType: "Palace"
  tags: ["architecture:palace", "archaeology:ruins" per the tag rule below]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.6. A nearby settlement named only as a distance/location
  bearing does not compete with an explicit elite-residence statement about the
  record's own structure.
fallback: condition not met → proceed to RUINS_MONUMENT_01.
found_in_current_dataset: 1 of 346.
```

### RUINS_MONUMENT_01
```text
scope: legacy type = "Ruins"
input_condition: text positively describes the record's own scope as a megalithic or
                 monumental stone structure (stone circle, alignment, standing-stone
                 field, or comparable arrangement) per TAXONOMY.md §4.3, and the record
                 is not itself a settlement, tomb, or fortification that happens to
                 include such a feature.
output:
  canonicalType: "Monument"
  tags: [<monument:* value the text actually supports>, "archaeology:ruins" per the
         tag rule below]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.3.
fallback: condition not met → proceed to RUINS_INFRASTRUCTURE_01.
found_in_current_dataset: 1 of 346.
```

### RUINS_INFRASTRUCTURE_01
```text
scope: legacy type = "Ruins"
input_condition: text identifies the record's own scope as a standalone transport,
                 hydraulic, or communication work (road, bridge, aqueduct, canal, dam,
                 harbour, port) per TAXONOMY.md §4.7 — not a settlement that happens to
                 have functioned as, or contained, such a work (§8; a city described as
                 "a trading port" remains Settlement per RUINS_SETTLEMENT_01, with
                 settlement:port/settlement:trade-centre as the appropriate tag,
                 unless the record's own scope is explicitly and solely the
                 infrastructure work itself).
output:
  canonicalType: "Infrastructure"
  tags: [<infrastructure:* value the text actually supports>, "archaeology:ruins" only
         where positively supported — see the tag rule below; a functioning
         infrastructure work is not automatically "ruined"]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.7.
fallback: condition not met → proceed to RUINS_CIVIC_ARCHSITE_01.
found_in_current_dataset: 2 of 346 (an explicitly-named ancient port; an explicitly-named
  road network). Neither record's text uses ruin/remains/abandoned language, so
  archaeology:ruins is withheld from one and retained on the other only where the text
  independently supports it — see each record's own entry in the Decision Matrix; this
  is not a blanket rule for the bucket.
```

### RUINS_CIVIC_ARCHSITE_01
```text
scope: legacy type = "Ruins"
input_condition: text identifies the record's own scope as isolated civic or public
                 architecture — a forum, theatre, amphitheatre, stadium, or bath
                 complex — explicitly matching TAXONOMY.md §4.9's second named fallback
                 case ("isolated civic or public architecture... not documented as part
                 of a larger settlement"), even where a containing city is named as
                 location context (§8: the containing city is not this record's scope).
output:
  canonicalType: "Archaeological Site"
  tags: [<architecture:* value the text actually supports — e.g. architecture:forum>,
         "archaeology:ruins" per the tag rule below]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.9, second bullet. This rule exists specifically to prevent
  the record-scope error of promoting the containing city (mentioned only as location)
  to Settlement merely because it is named — see RUINS_SETTLEMENT_01's mechanical test.
fallback: condition not met → proceed to RUINS_MULTICOMPONENT_ARCHSITE_01.
found_in_current_dataset: 1 of 346 (a forum/plaza explicitly described as surrounded by
  the ruins of government buildings "at the center of the city of Rome" — the city is
  the container, not this record's own scope).
```

### RUINS_MULTICOMPONENT_ARCHSITE_01
```text
scope: legacy type = "Ruins"
input_condition: text explicitly establishes the record's own scope as a multi-site,
                 multi-component, or multi-period grouping or complex — e.g. "a group of
                 archaeological sites," "the collective name for N related sites," "an
                 archaeological complex including [N] towns/villages," "a trail of...
                 sites," or a record explicitly combining two or more otherwise-distinct
                 named places under one heading — where no single structural Type
                 adequately captures the whole, per TAXONOMY.md §4.9. This condition
                 must be satisfied by the record's own framing of its scope, not by the
                 mere fact that its text mentions more than one place.
output:
  canonicalType: "Archaeological Site"
  tags: ["archaeology:ruins" only where positively supported by the text — see the tag
         rule below; several records in this bucket describe a still-functioning modern
         city, town, or surviving heritage trail, not ruined material]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.9 — "multi-period archaeological site where no single
  structural Type adequately describes the site" is this Type's own explicit example
  case, extended here to explicit multi-site groupings/collections of the same
  evidentiary shape.
fallback: condition not met → proceed to RUINS_LANDSCAPE_01.
found_in_current_dataset: 11 of 346.
```

### RUINS_LANDSCAPE_01
```text
scope: legacy type = "Ruins"
input_condition: text explicitly establishes the record's own scope as a landscape-,
                 valley-, or region-scale cultural or archaeological feature that
                 contains settlements, structures, or sites as components — or a park/
                 reserve whose own framing spans cultural and natural content together
                 — per TAXONOMY.md §4.13. The settlements/structures named within it are
                 components of the landscape, not the record's own singular identity
                 (§8) — this is the Ruins-specific instance of the same principle
                 `RUINS_MULTICOMPONENT_ARCHSITE_01` applies at complex scale and
                 `RUINS_CIVIC_ARCHSITE_01` applies at single-structure scale.
output:
  canonicalType: "Landscape"
  tags: ["landscape:archaeological" or "landscape:cultural" as the text supports,
         "archaeology:ruins" only where positively supported — see the tag rule below;
         a landscape explicitly documented as "still inhabited... today" does not
         receive this tag]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.13.
fallback: condition not met → proceed to RUINS_SETTLEMENT_01.
found_in_current_dataset: 5 of 346.
```

### RUINS_SETTLEMENT_01
```text
scope: legacy type = "Ruins"
input_condition: text contains an explicit, positive statement that THE RECORD ITSELF —
                 not a nearby place, not a modern place containing or named after the
                 record, not an administrative location, not a component inside a wider
                 site or landscape (see RUINS_MULTICOMPONENT_ARCHSITE_01/
                 RUINS_LANDSCAPE_01 above, both of which take precedence when their own
                 conditions are met), not an etymological gloss of the record's name,
                 not a place introduced only for comparison, and not a settlement merely
                 associated with or geographically separate from the mapped record — is
                 a city, town, village, settlement, polis, colony, urban centre,
                 capital, or equivalent.

                 MECHANICAL TEST (must be applied to every candidate record): remove
                 every reference to a nearby, modern, containing, administrative, or
                 comparison place from the record's text. If no positive clause
                 asserting that THIS record is a settlement survives that removal, this
                 rule does not fire.

                 Positive evidence satisfying this test survives truncation and fires
                 the rule even if the record's text is cut off later (truncated-text
                 evidence rule, §13/§14). A record whose only candidate evidence lies
                 in the truncated, unseen portion does not satisfy this rule and falls
                 through to RUINS_INSUFFICIENT_EVIDENCE_01, not this one.
output:
  canonicalType: "Settlement"
  tags: [<settlement:* value the text actually supports, if any — e.g. capital, colony,
         trade-centre, port>, "archaeology:ruins" only where the record's own text
         positively supports ruined/non-extant condition — see the tag rule below; a
         record describing a presently-existing, currently-populated place retains
         canonicalType = Settlement but does not receive this tag on that evidence
         alone]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.1; record-scope principle §8. This is the rule that produced
  the most correction across all three audit passes of this group (see this section's
  introduction) — every clause above the mechanical test names a specific, previously
  observed failure mode, not a hypothetical one.
do_not: fire this rule merely because a city/town/village word occurs anywhere in the
  text; fire it merely because a legacy `category`/`secondaryType` says so (neither
  field carries independent information for this legacy value — see §6); or treat a
  record's fame or real-world familiarity as a substitute for the record's own stated
  text (Migration Principle 1.2).
fallback: condition not met → proceed to RUINS_SETTLEMENT_NAMED_01.
found_in_current_dataset: 170 of 346.
```

### RUINS_SETTLEMENT_NAMED_01
```text
scope: legacy type = "Ruins"
input_condition: RUINS_SETTLEMENT_01 did not fire (no positive textual clause
                 establishes the record's own settlement scope — this includes, but is
                 not limited to, the case where `text` is empty/content-free), AND the
                 record's own `n` (name) field contains an explicit, common, unambiguous
                 settlement-identity word applied directly to the record itself (e.g.
                 "City of..."/"Ancient City of...") — not a place name whose settlement
                 meaning would require translating an unstated foreign-language
                 etymology (that evidence class belongs to RUINS_SETTLEMENT_01's
                 etymological-gloss exclusion, or, on empty text, to
                 RUINS_INSUFFICIENT_EVIDENCE_01 sub-condition (d)) — AND any existing
                 `text`, if not empty, does not contradict that name-based Settlement
                 identity (a record whose surviving text actively argues against, or
                 establishes a different scope for, the record does not qualify — see
                 RUINS_AMBIGUOUS_01 instead).
output:
  canonicalType: "Settlement"
  tags: ["archaeology:ruins" only where the record's own name or another existing
         field independently and positively supports ruined/non-extant condition — see
         the tag rule below; this is NOT automatic merely because this rule fired]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.1. The record's own name is existing record data, not
  invented information (Migration Principle 1.2) — this rule is a narrow, explicit
  extension of Rule 7's "prefer existing vocabulary" and Migration Principle 1.2's
  evidentiary standard to the name field specifically, used only where the name is
  common-language and unambiguous, and only after the record's own text has already
  been checked and found not to independently resolve the record (directly, or by
  contradicting the name).
correction_note (independent-audit correction, applied within v2.4 before this
  formalization was treated as stable): this rule's condition previously read simply "`text` is
  empty/content-free," which did not in fact match every record it was assigned —
  independent audit found that of its 4 originally-assigned records, one (complete
  text explicitly using "cities" and "the ruins of...") should instead have fired
  RUINS_SETTLEMENT_01 directly (moved there; do not distort this rule's condition to
  reclaim that record merely to preserve the old count — TAXONOMY.md/this document's
  own specific-before-general principle, §7.1, requires the opposite), and one
  (truncated, substantive, but not itself settlement-establishing) was not "empty."
  The condition above is corrected to the general principle actually required —
  "the earlier rule did not fire, and the name resolves it without contradiction" —
  rather than the narrower "text is empty" special case that happened to describe most,
  but not all, of the originally-observed records. `archaeology:ruins`'s justification
  is corrected in the same pass: TAXONOMY.md Migration Rule 14 authorizes the Tag only
  for the pure "no other classifying information exists" baseline (RUINS_ARCHSITE_
  DEFAULT_01); it does not extend to a record whose canonicalType this rule has just
  established from more-specific name evidence, so the Tag must be independently
  justified here, not assumed.
do_not: extend this rule to a place name that is merely locally/regionally famous, or
  to any name requiring specialised translation to reveal a settlement meaning; add
  `archaeology:ruins` merely because this rule fired (see the tag rule below).
fallback: condition not met → proceed to RUINS_FORTIFICATION_NAMED_01.
found_in_current_dataset: 3 of 346.
```

### RUINS_FORTIFICATION_NAMED_01
```text
scope: legacy type = "Ruins"
input_condition: `text` is empty/content-free, AND the record's own `n` (name) field
                 uses a genuinely unambiguous defensive/fortification word applied
                 directly to the record itself — "Castle," "Fort," "Fortress,"
                 "Citadel," or a direct foreign-language cognate used exclusively for
                 defensive structures (e.g. Dutch "Kasteel," which has no non-defensive
                 meaning, unlike "huis," a generic word for "house"). This condition is
                 explicitly NOT satisfied by a term that can equally denote a
                 non-defensive elite residence, manor, or country house — including but
                 not limited to "Château" (which commonly means "grand house/mansion"
                 as well as "castle" in ordinary usage) and Dutch "Huis te/ter/ten..."
                 ("House at/near...") — because such a name does not deterministically
                 distinguish Fortification from Palace, and no other field is available
                 to resolve it.
output:
  canonicalType: "Fortification"
  tags: ["archaeology:ruins" — supported independently by an explicit "(ruins)"/
         "(Ruins)" qualifier in the record's own name, where present, not by the legacy
         type field alone]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.5. Same name-as-evidence logic as
  RUINS_SETTLEMENT_NAMED_01, deliberately drawn narrower here because the candidate
  Type split (Fortification vs. Palace) is a genuine, common ambiguity in exactly the
  terminology this record population uses, not a hypothetical one.
do_not: broaden this rule to Château, Huis te/ter/ten, or any other term that can
  denote a non-defensive residence — the approved outcome for those, on empty text, is
  RESEARCH (RUINS_INSUFFICIENT_EVIDENCE_01 sub-condition (d)), not a guessed
  Fortification.
fallback: condition not met → proceed to RUINS_AMBIGUOUS_01.
found_in_current_dataset: 5 of 346 (direct "Castle"/"Kasteel" names only). 29 further
  empty-text, castle-adjacent-named records (Château / Huis te/ter/ten) were
  deliberately excluded from this rule and instead resolve via
  RUINS_INSUFFICIENT_EVIDENCE_01 sub-condition (d) — see that rule.
```

### RUINS_AMBIGUOUS_01 → REVIEW
```text
scope: legacy type = "Ruins"
input_condition: the record's own text or fields present two or more distinct,
                 comparably-substantiated candidate identities/Types for the same
                 record — including a genuine tension between an explicit descriptive
                 word and an unrebutted name-etymology/gloss pointing to a different
                 Type — without either one clearly dominating on record-scope grounds.
                 Matches this document's own worked REVIEW example (§2: "Roman fort and
                 later monastery"). Distinguished from every rule above by requiring
                 TWO candidates, neither of which the record itself resolves; and from
                 RUINS_INSUFFICIENT_EVIDENCE_01 by requiring that the record actually
                 contains substantive, competing information rather than an
                 information gap.
output: none assigned automatically.
confidence: REVIEW
rationale: §2 — "the answer is in here somewhere, a human needs to pick it." Positive
  evidence for two candidates is real evidence, just not self-resolving evidence.
fallback: if this rule's own condition is not met, proceed to RUINS_ARCHSITE_DEFAULT_01
  (§7.3) — this heading's "→ REVIEW" describes the outcome ONLY for records that match
  its condition, the same convention used throughout §9–§14.
found_in_current_dataset: 12 of 346.
```

### RUINS_ARCHSITE_DEFAULT_01
```text
scope: legacy type = "Ruins"
input_condition: `text` is confirmed empty, whitespace-only, or contains no
                 substantive descriptive content beyond bare link(s)/coordinates — i.e.
                 the field is COMPLETE as given, not a case of visible mid-sentence
                 truncation — AND none of RUINS_TOMB_01 through RUINS_AMBIGUOUS_01
                 fired (including the name-based rules, which take precedence over this
                 one whenever they apply).
output:
  canonicalType: "Archaeological Site"
  tags: ["archaeology:ruins"]
confidence: CONDITIONAL
rationale: TAXONOMY.md Migration Rule 14 — this is the one legacy value in the entire
  migration programme with its own taxonomy-authorized default: "A record whose current
  type is exactly 'Ruins' with no other classifying information defaults to
  Archaeological Site + archaeology:ruins... unless the source text clearly indicates a
  more specific nature." "No other classifying information exists" is safely verifiable
  only when the record is confirmed complete-and-empty (nothing is hidden past a
  cutoff) — this is what distinguishes this rule from a general-purpose default and is
  why it is the ONLY rule in this chain permitted to fire on the strength of an absence
  (§13's truncated-text evidence rule governs every other absence-dependent case in this
  chain, all of which route to RESEARCH instead). This rule is a narrow,
  taxonomy-authorized exception, not a template for any other legacy value.
do_not: apply this rule to a truncated record merely because no specific-Type signal
  was detected before the cutoff (§6 of the independent audit that produced this
  section) — that case is RUINS_INSUFFICIENT_EVIDENCE_01 sub-condition (a).
fallback: condition not met → proceed to RUINS_INSUFFICIENT_EVIDENCE_01.
found_in_current_dataset: 30 of 346.
```

### RUINS_INSUFFICIENT_EVIDENCE_01 → RESEARCH
```text
scope: legacy type = "Ruins"
input_condition: reached only where a genuine, specifically-identifiable information
                 gap exists — NOT a universal catch-all for any record that fails the
                 rules above (v2.3 refinement, Observatory §14). Fires only where at
                 least one of the following is true:
                   (a) text is visibly truncated before completion, and the surviving
                       portion contains no positive evidence sufficient to satisfy any
                       rule above (truncated-text evidence rule, §13/§14: an
                       absence-based conclusion — including RUINS_ARCHSITE_DEFAULT_01's
                       own "no other classifying information exists" — cannot be drawn
                       from a record that has not reached its own end, because the
                       missing continuation may contain exactly the evidence that is
                       absent from the visible portion);
                   (b) text is complete but its only substantive content is a single
                       unsubstantiated or actively contested claim about the record's
                       own fundamental nature (e.g. a genuine natural-vs-artificial
                       debate stated in the record's own text; a name asserting an
                       extraordinary, unverified claim with no supporting description),
                       with no second named candidate identity (distinguishing this
                       from RUINS_AMBIGUOUS_01, which requires two or more) and no
                       corroborating physical/functional description;
                   (c) the record's paired `text` field is a specifically-identified
                       data-quality defect that makes it unusable as evidence for this
                       record — most importantly, text that substantively describes a
                       different, separately-named site rather than the record it is
                       attached to;
                   (d) `text` is empty/content-free (as in RUINS_ARCHSITE_DEFAULT_01's
                       own scope) but the record's own name is itself genuinely
                       ambiguous between two or more canonical Types with no text
                       available to resolve it — this is the reason
                       RUINS_SETTLEMENT_NAMED_01 and RUINS_FORTIFICATION_NAMED_01 above
                       are deliberately narrow rather than accepting any
                       plausible-sounding settlement/fortification-adjacent name: an
                       empty-text record whose name does not clear their explicit,
                       unambiguous bar lands here, not on a guessed Type;
                   (e) any other specifically-identifiable missing-information
                       condition consistent with the RESEARCH test in §2 ("the answer
                       isn't in here").
output: none assigned automatically.
confidence: RESEARCH
rationale: §2 — each of (a)–(e) is a genuine information gap, not an interpretation
  problem. This rule is deliberately narrower than a bare "nothing else matched"
  condition (the same v2.3 refinement documented in §14's introduction) — a future
  record with substantive-but-differently-ambiguous evidence that does not fit any of
  (a)–(e) must not be swept into RESEARCH by default; it falls through to
  RUINS_FALLBACK_01 instead, preserving REVIEW as the correct outcome for "information
  present, interpretation required" regardless of which specific named sub-condition it
  fails to match.
fallback: condition not met → proceed to RUINS_FALLBACK_01.
found_in_current_dataset: 100 of 346 — by far the largest single bucket in this group,
  a direct consequence of how frequently this legacy value's `text` field is visibly
  truncated in the live data (sub-condition (a) accounts for the substantial majority
  of the 100).
```

### RUINS_FALLBACK_01 → REVIEW (terminal)
```text
scope: legacy type = "Ruins"
input_condition: catch-all — reached only by a record with substantive text that
                 satisfies none of RUINS_TOMB_01 through RUINS_AMBIGUOUS_01 above, and
                 that is not a genuine information gap under
                 RUINS_INSUFFICIENT_EVIDENCE_01's named sub-conditions.
output: none assigned automatically.
confidence: REVIEW
rationale: §2 — the general "information present, human interpretation required" case,
  kept distinct from RESEARCH's "information missing" case for the same reason
  `OBSERVATORY_FALLBACK_01` (§14) exists: so that a future record with substantive but
  differently-shaped ambiguous evidence lands in REVIEW rather than being forced into
  either a specific Type it doesn't clearly earn, or a RESEARCH state that misrepresents
  "there's something here, it's just unresolved" as "there's nothing here."
fallback: n/a — this is the actual terminal rule for the Ruins chain.
found_in_current_dataset: 0 of 346. No record in the current live batch reaches this
  rule — every one of the 346 resolved at an earlier rule. This rule exists for dataset
  growth and future Ruins-like records, not because today's batch needed it, exactly
  matching `OBSERVATORY_FALLBACK_01`'s own documented rationale (§14).
```

**Chain:** `RUINS_TOMB_01` → `RUINS_RELIGIOUS_01` → `RUINS_PALACE_01` → `RUINS_MONUMENT_01` → `RUINS_INFRASTRUCTURE_01` → `RUINS_CIVIC_ARCHSITE_01` → `RUINS_MULTICOMPONENT_ARCHSITE_01` → `RUINS_LANDSCAPE_01` → `RUINS_SETTLEMENT_01` → `RUINS_SETTLEMENT_NAMED_01` → `RUINS_FORTIFICATION_NAMED_01` → `RUINS_AMBIGUOUS_01` → `RUINS_ARCHSITE_DEFAULT_01` → `RUINS_INSUFFICIENT_EVIDENCE_01` → `RUINS_FALLBACK_01` (terminal). Fifteen rules — the longest chain in this document — because this legacy value is both the most heterogeneous (nine distinct canonical Types are reachable, more than any other group) and the one whose correction history (this section's introduction) specifically demonstrated the need for narrow, explicit conditions at every step rather than broad ones.

**Tag rule for `archaeology:ruins` (applies across all Ruins outcomes — independent-audit finding, §6 of the review that produced this section):**
- `archaeology:ruins` is never added merely because `legacy type === "Ruins"`. Legacy values are evidence, not truth (Migration Principle 1.2).
- It IS added automatically, as an explicit taxonomy-authorized exception, on every `RUINS_ARCHSITE_DEFAULT_01` hit — TAXONOMY.md Migration Rule 14 pairs `Archaeological Site` with `archaeology:ruins` by name for exactly that baseline case.
- **It is NOT added automatically on `RUINS_SETTLEMENT_NAMED_01` or `RUINS_FORTIFICATION_NAMED_01` hits merely because those rules fired.** Migration Rule 14's baseline applies only to the pure "no other classifying information exists" case (`RUINS_ARCHSITE_DEFAULT_01`); once a more-specific canonicalType has been established — including from name evidence — the Tag requires its own independent positive evidence, exactly like every other more-specific rule below. For `RUINS_FORTIFICATION_NAMED_01`, that evidence is, in the current dataset, present in all 5 records as an explicit "(ruins)"/"(Ruins)" qualifier in the name itself. For `RUINS_SETTLEMENT_NAMED_01`, it is present in 0 of the current 3 records — none of "City of David," "Ancient City of Tauric Chersonese and its Chora," or "Sandberg Celtic city" states or implies ruined condition by name or by any surviving text, so the Tag is withheld from all three even though canonicalType = Settlement stands (independent-audit correction; a prior version of this rule incorrectly extended Rule 14's logic to these name-based Types).
- For every other rule (`RUINS_TOMB_01` through `RUINS_LANDSCAPE_01`, and `RUINS_SETTLEMENT_01`), it is added only where the record's own text (or, on empty text reached via one of the two rules above, its name) positively supports ruined/non-extant condition — explicit "ruins of," "remains of," "abandoned," "destroyed," clear ancient/archaeological framing describing the subject as no longer standing/functioning in its original form, or equivalent. It is withheld where the text describes a presently-existing, currently-populated, or currently-functioning place (e.g. "is a city and a municipal council," a modern population figure, "still inhabited... today," "the last surviving complete example") — the canonical Type is unaffected by this; only the Tag is.
- Do not infer ruined condition from age, archaeological significance, legacy `category`, historical occupation, or the fact that a place is old, alone (independent-audit §6). A site can be ancient, historically important, and currently intact/inhabited at once.
- `RUINS_AMBIGUOUS_01` and `RUINS_FALLBACK_01` (REVIEW) and `RUINS_INSUFFICIENT_EVIDENCE_01` (RESEARCH) assign no Tags automatically, matching the "output: none assigned automatically" convention used identically by every REVIEW/RESEARCH rule in this document since Forest (§13).

**Provenance/workflow compatibility (§4–§5, reused as-is, no redesign):**
- Every `CONDITIONAL` hit above (`RUINS_TOMB_01` through `RUINS_ARCHSITE_DEFAULT_01`) populates `provenance.type` with `method: "conditional"`, `ruleId` set accordingly, `sourceFields: ["text"]` or `["n"]` for the two name-based rules — and creates no `workflow.type` object (§5.3 rule 1).
- `RUINS_AMBIGUOUS_01` and `RUINS_FALLBACK_01` populate `provenance.type` with `value: null`, `method: null`, `ruleId` set accordingly, and create `workflow.type` with `state: "review"`.
- `RUINS_INSUFFICIENT_EVIDENCE_01` populates `provenance.type` with `value: null`, `method: null`, `ruleId: "RUINS_INSUFFICIENT_EVIDENCE_01"`, and creates `workflow.type` with `state: "research"` — matching the `PYRAMID_PHARAONIC_EMPTY_TEXT_01`/`OBSERVATORY_INSUFFICIENT_EVIDENCE_01` worked pattern (§4.3, §14).
- Each `provenance.tags` entry for `archaeology:ruins` records `sourceFields` as `["text"]`, `["n"]`, or, for the `RUINS_ARCHSITE_DEFAULT_01`/named-rule Rule-14 baseline, `["type"]` with `notes: "TAXONOMY.md Migration Rule 14 baseline"` (matching the worked example already in §4.2).

**Ruins chain consistency check (v2.4), mirroring the §7.5 method used for Pyramid/Cairn/Mound/Wall and the Forest/Observatory checks in §13/§14:**
- **Rule order:** as listed in "Chain" above. Every non-terminal rule's fallback names exactly the next rule in the list; `RUINS_FALLBACK_01` is terminal with `fallback: n/a`, paired with `confidence: REVIEW` — correct use of §7.3 form 2. No branching terminal (form 3) is used, because RESEARCH and REVIEW are resolved by ordered, separately-scoped rules (`RUINS_AMBIGUOUS_01` mid-chain; `RUINS_INSUFFICIENT_EVIDENCE_01` then `RUINS_FALLBACK_01` at the terminal end) rather than a single mutually-exclusive pair — the same architecture Observatory uses (§14), chosen over Mound/Wall's branching-terminal form because Ruins, like Observatory, needed a genuine mid-chain REVIEW case in addition to a scoped RESEARCH terminal.
- **Reachability:** every rule other than the chain's first rule (`RUINS_TOMB_01`, entry point per §7.2 point 1) is named as a fallback target by exactly one other rule. No orphaned rule.
- **No silent default:** `RUINS_AMBIGUOUS_01`, `RUINS_INSUFFICIENT_EVIDENCE_01`, and `RUINS_FALLBACK_01` each produce an explicit REVIEW or RESEARCH label with no `canonicalType` assigned; every CONDITIONAL rule assigns a Type that exists in TAXONOMY.md v1.3's controlled vocabulary (§4) and Tags that exist in its namespaced Tag vocabulary (§6–§21).
- **Specific-before-general (§7.1) and record-scope (§8):** the most structurally specific positive identities (Tomb, Religious Site, Palace, Monument, Infrastructure) are checked before the two patterns that exist specifically to catch record-scope errors around settlements (`RUINS_CIVIC_ARCHSITE_01` for isolated civic architecture wrongly promoted to its containing settlement; `RUINS_MULTICOMPONENT_ARCHSITE_01` and `RUINS_LANDSCAPE_01` for settlements that are themselves components of a larger complex or landscape), which are in turn checked before `RUINS_SETTLEMENT_01` itself — ensuring a component settlement or an isolated civic structure can never be swallowed by the broader Settlement rule reached later in the chain. The two name-based rules are checked only after all textual evidence is exhausted, and only apply to confirmed-empty records. `RUINS_AMBIGUOUS_01` sits after every rule capable of a clean positive resolution and before the two terminal-area rules, so that a record with genuinely competing evidence is never forced into an early rule's single-candidate condition. `RUINS_ARCHSITE_DEFAULT_01`'s Rule-14 baseline is checked before `RUINS_INSUFFICIENT_EVIDENCE_01` because it is the more specific condition (confirmed-empty is a strict subset of "did not resolve above"), and its own `do_not` clause is enforced by `RUINS_INSUFFICIENT_EVIDENCE_01` sub-condition (a) sitting immediately after it in the chain, catching every truncated record the default rule is not permitted to touch.
- **Full-batch verification against the approved Decision Matrix, by rule:**

  | Rule | Approved count | Representative records |
  |---|---|---|
  | `RUINS_TOMB_01` | 1 | rock-cut tombs record, explicit self-scope |
  | `RUINS_RELIGIOUS_01` | 4 | a cathedral, a monastery, a friary (name-based), an "ancient monastery" record |
  | `RUINS_PALACE_01` | 1 | a hilltop "palacio home for an elite... family" |
  | `RUINS_MONUMENT_01` | 1 | a Stonehenge-comparable megalithic stone structure |
  | `RUINS_INFRASTRUCTURE_01` | 2 | an explicitly-named ancient port; an explicitly-named road network |
  | `RUINS_CIVIC_ARCHSITE_01` | 1 | a forum/plaza explicitly distinguished from its containing city |
  | `RUINS_MULTICOMPONENT_ARCHSITE_01` | 11 | "a group of archaeological sites," "the collective name for three related sites," "an archaeological complex including twenty towns and villages" |
  | `RUINS_LANDSCAPE_01` | 5 | valleys/parks explicitly framed as containing settlements/sites as components |
  | `RUINS_SETTLEMENT_01` | 170 | explicit "was a city"/"is an ancient city"/"was the capital of" clauses about the record's own subject |
  | `RUINS_SETTLEMENT_NAMED_01` | 3 | empty/non-resolving-text records whose own name states "City of..." |
  | `RUINS_FORTIFICATION_NAMED_01` | 5 | empty-text records named "Castle..."/"Kasteel..." |
  | `RUINS_AMBIGUOUS_01` | 12 | records with two comparably-evidenced candidate identities |
  | `RUINS_ARCHSITE_DEFAULT_01` | 30 | confirmed-empty or link-only text records |
  | `RUINS_INSUFFICIENT_EVIDENCE_01` | 100 | truncated records with no positive evidence before the cutoff; a data-quality text/record mismatch; a natural-vs-artificial contested record |
  | `RUINS_FALLBACK_01` | 0 | none in the current batch |

  **Total: 346. Matches the approved Decision Matrix exactly** — CONDITIONAL 234 (= 1+4+1+1+2+1+11+5+170+3+5+30), REVIEW 12 (`RUINS_AMBIGUOUS_01`) + 0 (`RUINS_FALLBACK_01`) = 12, RESEARCH 100 (`RUINS_INSUFFICIENT_EVIDENCE_01`). **No defect found; no count adjusted to force a match — 170 and 3 are what the corrected written conditions for `RUINS_SETTLEMENT_01`/`RUINS_SETTLEMENT_NAMED_01` actually produce (independent-audit correction; see those rules' own `correction_note`).**

---

## 16. Null / Missing Legacy Type (NEW in v2.5)

**Scope:** the 537 live records whose legacy `type` field is `null`. **Population:** mechanical inspection of the `type` field across all 2,103 live records found `type === null` to be the qualifying population's only representation — 537 records exactly, with 0 records having a missing `type` property, 0 with `type === ""`, 0 with a whitespace-only string, and 0 with any other malformed/non-string equivalent. This chain is formalized against `type === null` specifically, per Migration Principle 1.3: it is not broadened to a speculative future representation this population does not currently contain — a future malformed/missing representation is future Future-Extension work (§19), not something this chain silently absorbs. **Finding:** no unconditional AUTO rule is valid for this group — like every other group in this document, `type === null` supplies zero classification signal on its own (Migration Principle 1.2: legacy values are evidence, not truth — a `null` legacy value is simply the absence of a legacy value, never itself evidence for or against any canonical Type), and the 537 records resolve to eleven different outcomes: nine canonical Types, REVIEW, and RESEARCH.

**Origin and process (initial Decision Matrix plus two independently-reviewed narrow correction passes):**
1. An initial full inspection of all 537 records, directly against the live `SITES` array, produced a first Decision Matrix.
2. Independent review of that matrix identified four systematic defects, corrected in **correction pass v2** (51 of 537 rows changed): (a) the original multi-component "Archaeological Site" bucket had been assembled from "multiple components + no more-specific Type + no landscape framing" — sufficient-looking, but not what TAXONOMY.md §4.9 actually requires (a record must be *primarily* an archaeological site/complex, not merely multi-component) — re-audited against a stricter positive archaeological/ruin/remains framing standard; (b) 16 truncated records had been resolved to Archaeological Site on the strength of a truncated *generic* "archaeological site" self-identification, which is itself an absence-based conclusion (Archaeological Site is TAXONOMY.md §4.9's own "nothing more specific found" fallback) and does not survive truncation — moved to RESEARCH; (c) a single named dwelling (*Viking Longhouse*) had been misclassified as Settlement, which does not meet TAXONOMY.md §4.1's settlement-scope requirement — corrected to `Other`, retiring the bucket that had produced it; (d) 8 truncated records resting on an absence-based "no cultural/historical content appears" rationale were found, on re-audit, to already have positive surviving evidence for their `Other` outcome — Type and state were unchanged, but the rationale and bucket were corrected so the outcome no longer rested on an unsafe absence-based inference.
3. A second, independent round of review identified two further, individually-named records still requiring correction, applied in **correction pass v3** (2 of 537 rows changed, both re-typed within CONDITIONAL): *Land of Frankincense* (site-1586), where the v2-narrowed multi-component Archaeological Site bucket was found to still be one requirement short — it required positive archaeological/ruin framing to appear somewhere in the record, but not that this framing characterise the grouping's own *collective* identity rather than one contained component — corrected to `Other`; and *Flemish Béguinages* (site-2082), reclassified from `Other` to `Religious Site` once independent review established that a heterogeneous mix of component building forms does not override a record's own positively-established institutional religious identity.
4. This section formalizes the result of both correction passes as the final, independently-approved (**PASS**) Decision Matrix. **`NULLTYPE_MULTICOMPONENT_ARCHSITE_01` in particular should be read as a rule that was corrected twice on closely related failure modes before being written narrowly enough to prevent both** — first to require positive collective archaeological/ruin framing at all (v2), then to require that framing to characterise the grouping as a whole rather than one component (v3, the Land of Frankincense correction) — neither correction is decorative.

**The record-scope principle (§8) applies here with the same force it was given in Ruins (§15)**, because null/missing-Type records are disproportionately drawn from UNESCO-style serial listings that combine several named places, buildings, or sites under one record — exactly the shape that makes a single-component reading tempting and wrong. **The truncated-text evidence rule (§13, extended §14, extended again §15)** also governs a substantial share of this group's outcomes: positive evidence appearing before a visible truncation cutoff still fires a rule; the absence of evidence before the cutoff never does — including, as the correction history above shows, the absence of a *more specific* signal that would otherwise be needed to support the generic Archaeological Site fallback itself.

Evaluate the following rules **in order** for every record with `type === null`.

### NULLTYPE_ARCHSITE_EXPLICIT_01
```text
scope: type === null
input_condition: record's own COMPLETE, UNTRUNCATED text explicitly and positively
                 self-identifies as "an archaeological site" (or clearly equivalent
                 language) with positive archaeological/ruin/remains framing, AND no
                 more-specific canonical Type is established by that same text. Does
                 NOT apply to truncated text: because Archaeological Site is itself
                 TAXONOMY.md §4.9's "nothing more specific found" fallback, concluding
                 "no more specific Type visible before the cutoff" from truncated text
                 is an absence-based conclusion that does not survive truncation
                 (truncated-text evidence rule, §13-§15) — a truncated record with only
                 generic archaeological/prehistoric-site language falls through to
                 NULLTYPE_INSUFFICIENT_EVIDENCE_01 instead, never here.
output:
  canonicalType: "Archaeological Site"
  tags: [<archaeology:* value the text actually supports beyond the bare Type, e.g.
         archaeology:excavated, archaeology:human-remains — omit if unsupported;
         archaeology:archaeological-site is NOT added reflexively merely because
         canonicalType = "Archaeological Site" — TAXONOMY.md §8/§43>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.9 — a complete record whose own text positively and
  self-sufficiently establishes "nothing more specific than archaeological site" is a
  safe application of §4.9's fallback Type, because the record has reached its own end
  without ever supplying a more specific signal — the absence is confirmed for the
  whole record, not merely for what survived a cutoff.
fallback: condition not met → proceed to NULLTYPE_BATTLEFIELD_NAMED_01.
found_in_current_dataset: 6 of 537.
```

### NULLTYPE_BATTLEFIELD_NAMED_01
```text
scope: type === null
input_condition: `text` is empty/content-free, AND the record's own `n` (name) field
                 contains an explicit, unambiguous battlefield/military-engagement term
                 applied directly to the record itself (e.g. "Battle of...", "...
                 Battlefield") with no competing non-military meaning.
output:
  canonicalType: "Battlefield"
  tags: [<military:* value the name actually supports, e.g. military:battlefield —
         omit if unsupported>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.10. The record's own name is existing record data, not
  invented information (Migration Principle 1.2) — the same narrow, name-as-evidence
  logic already used for RUINS_SETTLEMENT_NAMED_01/RUINS_FORTIFICATION_NAMED_01 (§15),
  applied here only where the name is common-language and unambiguous.
do_not: extend this rule to a name that could equally describe a fort, siege, or other
  military structure without itself naming a battle/engagement.
fallback: condition not met → proceed to NULLTYPE_MONUMENT_NAMED_01.
found_in_current_dataset: 1 of 537.
```

### NULLTYPE_MONUMENT_NAMED_01
```text
scope: type === null
input_condition: `text` is empty/content-free, AND the record's own `n` (name) field
                 contains an explicit, unambiguous monument-form term applied directly
                 to the record itself (e.g. a named obelisk, stela, or standing-stone
                 monument) with no competing non-monumental meaning.
output:
  canonicalType: "Monument"
  tags: [<monument:* value the name actually supports — omit if unsupported>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.3; same name-as-evidence standard as
  NULLTYPE_BATTLEFIELD_NAMED_01 immediately above.
fallback: condition not met → proceed to NULLTYPE_INDUSTRIAL_NAMED_01.
found_in_current_dataset: 1 of 537.
```

### NULLTYPE_INDUSTRIAL_NAMED_01
```text
scope: type === null
input_condition: `text` is empty/content-free, AND the record's own `n` (name) field
                 contains an explicit, unambiguous industrial/production term applied
                 directly to the record itself (e.g. a named mine, quarry, or works)
                 with no competing non-industrial meaning.
output:
  canonicalType: "Industrial Site"
  tags: [<industry:* value the name actually supports — omit if unsupported>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.11; same name-as-evidence standard as the two rules above.
fallback: condition not met → proceed to NULLTYPE_OTHER_NAMED_01.
found_in_current_dataset: 1 of 537.
```

### NULLTYPE_OTHER_NAMED_01
```text
scope: type === null
input_condition: `text` is empty/content-free, AND the record's own `n` (name) field
                 contains an unambiguous term for a specific building/structure form
                 that does NOT meet the scope/scale requirement of Settlement or any
                 other canonical Type (e.g. a single named dwelling — a longhouse, a
                 named individual house) and does not fit any other canonical Type.
output:
  canonicalType: "Other"
  tags: [<architecture:* value the name actually supports — e.g. architecture:house>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.14. A single named dwelling is existing record data
  (Migration Principle 1.2) but does not clear TAXONOMY.md §4.1's settlement-scope
  bar — no canonical Type fits a standalone named dwelling without distortion, so
  Other is correct per §4.14/Migration Rule 13, not a forced Settlement reading.
correction_note: this bucket's sole current member (*Viking Longhouse*, site-0209) was
  originally assigned to a since-retired `NULLTYPE_SETTLEMENT_NAMED_01` bucket that
  would have generalized "the record's own name contains an unambiguous structural/
  functional term" directly to Settlement; independent review found this violated
  §4.1's scope requirement (a single dwelling is not a settlement) and corrected it
  here instead. `NULLTYPE_SETTLEMENT_NAMED_01` is retired — see the retired-bucket
  note at the end of this section — and must not be resurrected as an active rule.
fallback: condition not met → proceed to NULLTYPE_LANDSCAPE_MULTICOMPONENT_01.
found_in_current_dataset: 1 of 537 (*Viking Longhouse*, site-0209).
```

### NULLTYPE_LANDSCAPE_MULTICOMPONENT_01
```text
scope: type === null
input_condition: record's own text or title explicitly self-identifies (as "a cultural
                 landscape," an equivalent unified-landscape framing, or a documented
                 practiced/sacred tradition unifying multiple components) as ONE
                 unified landscape system, and documents multiple named built and/or
                 cultural components (settlements, temples, terraces, monuments, etc.)
                 within that one landscape — this explicit self-framing takes
                 precedence over the record's multi-component-ness alone; a record
                 whose components are themselves settlements is still Landscape here
                 if the record's own text frames them collectively as one landscape/
                 cultural system (§8; mirrors RUINS_LANDSCAPE_01, §15).
output:
  canonicalType: "Landscape"
  tags: [<landscape:* value the text actually supports, e.g. landscape:cultural,
         landscape:archaeological, landscape:island — omit if unsupported>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.13 — a landscape-scale cultural or archaeological feature
  containing settlements/structures/sites as components remains Landscape, not
  Settlement or Archaeological Site, when the record's own framing is the unified
  landscape (§8; the record-scope principle applied at landscape scale, the same way
  RUINS_LANDSCAPE_01 applies it for the Ruins group).
fallback: condition not met → proceed to NULLTYPE_MULTICOMPONENT_ARCHSITE_01.
found_in_current_dataset: 60 of 537.
```

### NULLTYPE_MULTICOMPONENT_ARCHSITE_01
```text
scope: type === null
input_condition: record explicitly combines two or more distinct components AND the
                 record's own text carries positive, explicit archaeological/ruin/
                 remains framing that characterises the GROUPING/COMPLEX'S COLLECTIVE
                 IDENTITY AS A WHOLE — not merely one contained component — where no
                 more-specific canonical Type captures that collective identity and no
                 explicit unifying Landscape framing (NULLTYPE_LANDSCAPE_MULTICOMPONENT_01
                 above) supersedes it. Multi-component-ness alone is NOT sufficient, and
                 archaeological/ruin/remains language describing only one component of
                 an otherwise-heterogeneous grouping is ALSO NOT sufficient — see the
                 negative regression case below.
output:
  canonicalType: "Archaeological Site"
  tags: [<archaeology:* value independently supported by the collective-identity
         evidence itself — omit if unsupported; archaeology:archaeological-site is NOT
         added reflexively, TAXONOMY.md §8/§43>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.9 — the record must be *primarily* an archaeological site or
  complex that cannot reasonably be represented by a more specific Type, which requires
  the archaeological/ruin/remains framing to describe the grouping's own collective
  identity, not a single component within it (§8). This is the null/missing-Type
  group's own instance of the `PYRAMID_CITY_01`/record-scope failure mode this
  document has guarded against since v2, and the specific defect independent review
  found and required two separate corrections to close (this section's introduction).
positive_example: *Tusi Sites* — "this property encompasses remains of several tribal
  domains" (stated of the property collectively). *Chief Roi Mata's Domain* — "the
  site reflects the convergence between oral tradition and archaeology" (stated of the
  site as a whole). Both satisfy the collective-identity requirement.
negative_regression_case: *Land of Frankincense* — "the ruined caravan oasis of Shisr"
  establishes ruin/archaeological character for only ONE of three named components
  (frankincense groves, the ruined oasis of Shisr, the port city of Khor Rori); the
  record's own collective self-framing is trade-route documentation ("a group of
  sites...documenting the ancient frankincense trade"), not an archaeological-complex
  identity for the grouping as a whole — this rule does NOT fire for it; it falls
  through to NULLTYPE_OTHER_NO_FITTING_TYPE_01 instead (independent-audit correction,
  correction pass v3 — see this section's introduction).
fallback: condition not met → proceed to NULLTYPE_MULTISETTLEMENT_SCOPE_01.
found_in_current_dataset: 2 of 537 (*Tusi Sites*, *Chief Roi Mata's Domain*).
```

### NULLTYPE_MULTISETTLEMENT_SCOPE_01 → REVIEW
```text
scope: type === null
input_condition: record explicitly and positively combines two or more distinct,
                 separately named, still-standing/actively-used settlements (towns,
                 cities, or a settlement plus a dispersed regional building collection)
                 with no single Settlement row able to represent the whole, and no
                 landscape self-framing (NULLTYPE_LANDSCAPE_MULTICOMPONENT_01 above) to
                 unify them, and no positive archaeological/ruin framing characterising
                 their collective identity (NULLTYPE_MULTICOMPONENT_ARCHSITE_01 above)
                 either.
output: none assigned automatically.
confidence: REVIEW
rationale: §2 — the facts are known (these are genuinely multiple, genuinely distinct,
  genuinely living settlements), but how to model that scope — one composite
  Settlement row, multiple separate records, or some other resolution — is a genuine
  cross-Type/scope-modeling judgement call for a human, not a missing-information gap
  and not a default to Archaeological Site (no ruin/archaeological framing is present;
  these are living settlements, not ruins).
fallback: if this rule's own condition is not met, proceed to NULLTYPE_TOMB_01 — this
  heading's "→ REVIEW" describes the outcome ONLY for records that match its
  condition, the same convention used throughout §9–§15 (e.g. PYRAMID_FRINGE_01,
  OBSERVATORY_COMPETING_LABELS_01, RUINS_AMBIGUOUS_01).
found_in_current_dataset: 7 of 537 (e.g. *Ancient Ksour of Ouadane, Chinguetti,
  Tichitt and Oualata*; *Moravian Church Settlements*; *La Chaux-de-Fonds / Le Locle*;
  *Mantua and Sabbioneta*; *Historic Centres of Stralsund and Wismar*; *Bursa and
  Cumalıkızık*; *City of Vicenza and the Palladian Villas of the Veneto*).
```

### NULLTYPE_TOMB_01
```text
scope: type === null
input_condition: record's own text explicitly documents its own scope — not a
                 component mentioned in passing, and not a comparably-evidenced
                 competing identity elsewhere in the same record (see
                 NULLTYPE_AMBIGUOUS_01 below for the competing-evidence case) — as a
                 tomb, mausoleum, necropolis, burial mound, burial chamber, rock-cut
                 tomb, or other explicit funerary structure.
output:
  canonicalType: "Tomb"
  tags: [<funerary:* value the text actually supports — omit if unsupported>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.4 — an explicitly documented funerary structure is a Tomb
  regardless of the fact that no legacy `type` string was present to suggest it.
fallback: condition not met → proceed to NULLTYPE_RELIGIOUS_01.
found_in_current_dataset: 3 of 537.
```

### NULLTYPE_RELIGIOUS_01
```text
scope: type === null
input_condition: record's own text positively establishes that the site or
                 ensemble/institution is fundamentally characterised by religious or
                 sacred use (TAXONOMY.md §4.2: temple, church, cathedral, mosque,
                 synagogue, monastery, shrine, sanctuary, oracle, sacred complex,
                 etc.) — including a religious institution/ensemble composed of
                 multiple building types (houses, churches, ancillary structures)
                 where the fundamental identity of the whole is still positively
                 religious. A heterogeneous mix of component building forms does NOT
                 prevent this rule from firing when the record-level institutional
                 identity is positively religious (§8; this is the opposite failure
                 mode from NULLTYPE_MULTICOMPONENT_ARCHSITE_01's component-only
                 evidence problem — here, heterogeneity of FORM does not undercut a
                 positively-established institutional identity, whereas there,
                 archaeological evidence confined to one component cannot establish a
                 collective identity that isn't otherwise claimed).
output:
  canonicalType: "Religious Site"
  tags: [<architecture:* value the text actually supports if ONE dominant structural
         form is established, e.g. architecture:shrine — otherwise "religion:religious"
         where the record names a mix of component building forms rather than one
         dominant structure; do NOT default to architecture:church or any other
         single-structure tag merely because one component happens to have that form>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.2. Generalized during formalization (independent-audit
  correction, correction pass v3) beyond a single discrete structure to also cover a
  positively-established religious institution/complex whose components are
  heterogeneous — per §4.2's own "monastery"/"sacred complex" examples, component
  diversity does not override an ensemble's positively religious fundamental identity.
positive_examples: *Asante Traditional Buildings* (site-1650) — a single dominant
  structural form, tagged architecture:shrine. *Flemish Béguinages* (site-2082) —
  "The Béguines were women who dedicated their lives to God...they founded the
  béguinages, enclosed communities designed to meet their spiritual and material
  needs" — a heterogeneous mix of houses, churches, and ancillary buildings with a
  positively religious institutional identity, tagged religion:religious (not
  architecture:church, since no single architectural form is the record's own
  positively-established whole-ensemble physical form).
fallback: condition not met → proceed to NULLTYPE_PALACE_01.
found_in_current_dataset: 2 of 537 (*Asante Traditional Buildings*, *Flemish
  Béguinages*).
```

### NULLTYPE_PALACE_01
```text
scope: type === null
input_condition: record's own text identifies its own scope — not a component of a
                 larger settlement record (§8; TAXONOMY.md §4.6's own settlement/
                 palace split) — as a monumental elite or royal residence.
output:
  canonicalType: "Palace"
  tags: ["architecture:palace"]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.6.
fallback: condition not met → proceed to NULLTYPE_MONUMENT_01.
found_in_current_dataset: 1 of 537.
```

### NULLTYPE_MONUMENT_01
```text
scope: type === null
input_condition: record's own text positively describes its own scope as a
                 megalithic/monumental stone structure, standing monument, stela,
                 obelisk, or comparable non-settlement, non-funerary structure per
                 TAXONOMY.md §4.3, and the record is not itself a settlement, tomb, or
                 fortification that happens to include such a feature.
output:
  canonicalType: "Monument"
  tags: [<monument:* value the text actually supports — omit if unsupported>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.3.
fallback: condition not met → proceed to NULLTYPE_INFRASTRUCTURE_01.
found_in_current_dataset: 8 of 537.
```

### NULLTYPE_INFRASTRUCTURE_01
```text
scope: type === null
input_condition: record's own text identifies its own scope as a standalone
                 transport, hydraulic, or communication work (road, bridge, aqueduct,
                 canal, dam, harbour, port, caravanserai, etc.) per TAXONOMY.md §4.7 —
                 not a settlement that happens to have functioned as, or contained,
                 such a work (§8).
output:
  canonicalType: "Infrastructure"
  tags: [<infrastructure:* or architecture:caravanserai value the text actually
         supports — omit if unsupported>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.7.
fallback: condition not met → proceed to NULLTYPE_INDUSTRIAL_01.
found_in_current_dataset: 8 of 537.
```

### NULLTYPE_INDUSTRIAL_01
```text
scope: type === null
input_condition: record's own text identifies its own scope as a location
                 fundamentally characterised by historical production or industrial
                 activity (mine, quarry, smelting complex, workshop, factory, kiln
                 complex) per TAXONOMY.md §4.11.
output:
  canonicalType: "Industrial Site"
  tags: [<industry:* value the text actually supports — omit if unsupported>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.11.
fallback: condition not met → proceed to NULLTYPE_CIVIC_ARCHSITE_01.
found_in_current_dataset: 5 of 537.
```

### NULLTYPE_CIVIC_ARCHSITE_01
```text
scope: type === null
input_condition: record's own text identifies its own scope as isolated civic or
                 public architecture — a forum, theatre, amphitheatre, stadium, or
                 bath complex — explicitly matching TAXONOMY.md §4.9's second named
                 fallback case, even where a containing city is named as location
                 context (§8: the containing city is not this record's scope).
output:
  canonicalType: "Archaeological Site"
  tags: [<architecture:* value the text actually supports, e.g. architecture:forum —
         archaeology:archaeological-site is NOT added reflexively, TAXONOMY.md §8/§43>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.9, second bullet — mirrors RUINS_CIVIC_ARCHSITE_01 (§15).
fallback: condition not met → proceed to NULLTYPE_SETTLEMENT_01.
found_in_current_dataset: 1 of 537.
```

### NULLTYPE_SETTLEMENT_01
```text
scope: type === null
input_condition: record's own text contains an explicit, positive statement that THE
                 RECORD ITSELF — not a nearby place, not a modern place containing or
                 named after the record, not an administrative location, not a
                 component inside a wider site or landscape (see
                 NULLTYPE_MULTICOMPONENT_ARCHSITE_01/NULLTYPE_LANDSCAPE_MULTICOMPONENT_01/
                 NULLTYPE_MULTISETTLEMENT_SCOPE_01 above, all of which take precedence
                 when their own conditions are met), not an etymological gloss of the
                 record's name, not a place introduced only for comparison, and not a
                 settlement merely associated with or geographically separate from the
                 mapped record — is a city, town, village, settlement, polis, colony,
                 urban centre, capital, or equivalent, INCLUDING a case where the
                 record's title also names an additional specific building or two but
                 the surviving text substantively elaborates only the one settlement
                 (e.g. *Historic Centre of Oporto, Luiz I Bridge and Monastery of
                 Serra do Pilar*; *Collegiate Church, Castle and Old Town of
                 Quedlinburg* — both corrected into this rule during formalization
                 once closer reading showed the surviving text is substantively about
                 the one settlement, not a genuine multi-component grouping).

                 MECHANICAL TEST (must be applied to every candidate record, reused
                 directly from RUINS_SETTLEMENT_01, §15): remove every reference to a
                 nearby, modern, containing, administrative, or comparison place from
                 the record's text. If no positive clause asserting that THIS record
                 is a settlement survives that removal, this rule does not fire.

                 Positive evidence satisfying this test survives truncation and fires
                 the rule even if the record's text is cut off later (truncated-text
                 evidence rule, §13-§15). A record whose only candidate evidence lies
                 in the truncated, unseen portion does not satisfy this rule and falls
                 through to NULLTYPE_INSUFFICIENT_EVIDENCE_01, not this one.
output:
  canonicalType: "Settlement"
  tags: [<settlement:* value the text actually supports, if any, e.g.
         settlement:city, settlement:port, settlement:town — omit if unsupported; do
         NOT default to settlement:urban, TAXONOMY.md §20/§43>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.1; record-scope principle §8. This rule adopts
  RUINS_SETTLEMENT_01's mechanical test directly (§15) because both groups share the
  identical failure mode: a nearby, containing, administrative, or comparison
  settlement name being mistaken for the record's own scope. This is also the rule
  that produced the most reclassification during formalization: two records
  originally routed to the multi-component-archsite bucket (Oporto, Quedlinburg) were
  moved here once closer reading showed their surviving text is substantively about
  the one settlement, not a genuine multi-part grouping — illustrating why the
  record-scope test must be applied to what the text actually elaborates, not merely
  what the title names.
do_not: fire this rule merely because a city/town/village word occurs anywhere in the
  text; fire it merely because `category`, `typeSource`, or `sourceType` says so (none
  of these fields carry independent classification signal for null-type records —
  `category` is null on all 537, and `typeSource`/`sourceType` describe how the
  record was catalogued, not what it is); or treat a record's fame or real-world
  familiarity as a substitute for the record's own stated text (Migration Principle
  1.2).
fallback: condition not met → proceed to NULLTYPE_LANDSCAPE_SACRED_01.
found_in_current_dataset: 100 of 537.
```

### NULLTYPE_LANDSCAPE_SACRED_01
```text
scope: type === null
input_condition: record's own text explicitly names a specific culture/people AND
                 documents an actual religious, spiritual, or mythological tradition
                 attached to the natural landmark/landscape itself — historical and/or
                 currently practiced — not merely a name, reputation, or feature
                 mentioned in passing. The record's own scope must be the natural
                 landmark/landscape itself (§8). Mirrors FOREST_SACRED_01 (§13).
output:
  canonicalType: "Landscape"
  tags: ["landscape:sacred", <a secondary landscape:* value the text supports, e.g.
         landscape:mountain — omit if unsupported>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.13 — a natural landmark with documented cultural,
  mythological, or religious significance is Landscape even without constructed
  remains. This condition rests on POSITIVE evidence, so it fires identically on
  complete or truncated text provided the required positive evidence appears before
  any cutoff (truncated-text evidence rule).
fallback: condition not met → proceed to NULLTYPE_LANDSCAPE_CULTURAL_01.
found_in_current_dataset: 22 of 537.
```

### NULLTYPE_LANDSCAPE_CULTURAL_01
```text
scope: type === null
input_condition: record's own text documents specific, positive cultural, artistic, or
                 historical significance attached to the natural landmark/landscape
                 itself (e.g. a recurring subject of named major artworks or
                 literature, a documented historical episode) — not merely a physical
                 description — satisfying TAXONOMY.md §4.13's documented-significance
                 test without necessarily rising to the religious/mythological bar of
                 NULLTYPE_LANDSCAPE_SACRED_01 above.
output:
  canonicalType: "Landscape"
  tags: ["landscape:cultural", <a secondary landscape:* value the text supports, e.g.
         landscape:mountain — omit if unsupported>]
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.13. Like NULLTYPE_LANDSCAPE_SACRED_01, this rests on
  positive evidence and is truncation-safe on that basis.
fallback: condition not met → proceed to NULLTYPE_NO_HISTORICAL_SIGNIFICANCE_01.
found_in_current_dataset: 20 of 537.
```

### NULLTYPE_NO_HISTORICAL_SIGNIFICANCE_01
```text
scope: type === null
input_condition: record's own text is NOT visibly truncated before completion (i.e.
                 the record's text reaches its own end) AND documents purely
                 natural/ecological/biological/geological significance with no
                 cultural, mythological, religious, or archaeological content anywhere
                 in the (complete) record, per TAXONOMY.md §4.13/§4.14/Migration Rule
                 15. Mirrors FOREST_NATURAL_COMPLETE_01 (§13).
output:
  canonicalType: "Other"
  tags: []
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.13-§4.14, Migration Rule 15. THE COMPLETENESS REQUIREMENT IS
  LOAD-BEARING (truncated-text evidence rule): this rule's condition depends on the
  ABSENCE of cultural/historical content across the whole record, which is only
  verifiable from a complete text. A visibly truncated record can never satisfy this
  rule and must fall through to NULLTYPE_OTHER_MODERN_POSITIVE_01 or
  NULLTYPE_INSUFFICIENT_EVIDENCE_01 instead. A descriptive landscape:* tag MAY be
  added per curator judgement; not required — Type = Other already signals the record
  falls outside this taxonomy's historical/cultural scope (§43 restraint).
fallback: condition not met → proceed to NULLTYPE_OTHER_MODERN_POSITIVE_01.
found_in_current_dataset: 70 of 537.
```

### NULLTYPE_OTHER_MODERN_POSITIVE_01
```text
scope: type === null
input_condition: record's TRUNCATED surviving text nonetheless positively and
                 completely establishes a specific, definitively non-historical
                 fundamental identity (a modern instrumentally-recorded acoustic
                 phenomenon, a modern named building/facility, a modern dated
                 accident, or an explicitly scientifically-confirmed-nonexistent
                 mapped feature) BEFORE the cutoff — the classifying fact does not
                 depend on the missing continuation.
output:
  canonicalType: "Other"
  tags: []
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.14. Distinguished from NULLTYPE_NO_HISTORICAL_SIGNIFICANCE_01
  (reserved for complete text, where an absence-of-cultural-content conclusion is safe
  because there is no missing continuation to worry about) precisely because this
  rule's classifying fact is POSITIVE and established before any cutoff — the
  truncated-text evidence rule permits a positive-evidence rule to fire on truncated
  text; it only forbids an absence-based rule from doing so. Corrected during
  formalization (correction pass v2, defect 4): 8 records previously resting on an
  absence-based "no cultural/historical content appears" rationale were found, on
  re-audit, to already have this rule's kind of positive surviving evidence — the
  Type and state (Other / CONDITIONAL) were already correct on the merits, but the
  rationale and bucket were corrected so the outcome no longer rests on an unsafe
  absence-based inference.
fallback: condition not met → proceed to NULLTYPE_OTHER_NO_FITTING_TYPE_01.
found_in_current_dataset: 8 of 537 (e.g. NOAA unidentified-sound records *Julia*,
  *Upsweep*, *Whistle*; *Eye of Horus eco-house*; *Bohemian Grove*; *Buddha Magic
  Garden*; *Door to Hell*; *Sandy Island*).
```

### NULLTYPE_OTHER_NO_FITTING_TYPE_01
```text
scope: type === null
input_condition: record documents genuine historical/cultural significance, but the
                 record's own scope does not fit any of the 14 canonical Types without
                 distortion — covering (a) heterogeneous groupings of distinct
                 standing (non-ruined) buildings/sites of different function combined
                 under one serial record with no landscape framing and no collective
                 (not merely component-level) archaeological/ruin framing, and (b) a
                 thematic collection with no canonical Type for the collective concept
                 itself. Reached only after NULLTYPE_MULTICOMPONENT_ARCHSITE_01,
                 NULLTYPE_LANDSCAPE_MULTICOMPONENT_01, NULLTYPE_MULTISETTLEMENT_SCOPE_01,
                 and every single-Type identification rule above have been ruled out.
output:
  canonicalType: "Other"
  tags: []
confidence: CONDITIONAL
rationale: TAXONOMY.md §4.14/Migration Rule 13 — genuine significance with no
  non-distorting canonical Type is the textbook Other case, not a reason to force a
  broader Type. Includes the corrected outcome for *Land of Frankincense* (site-1586,
  correction pass v3): its ruin/archaeological language describes only the Shisr
  component, not the grouping's own collective identity, so
  NULLTYPE_MULTICOMPONENT_ARCHSITE_01 does not fire and this rule does instead — see
  that rule's own negative regression case above.
examples: Belfries of Belgium and France; Luther Memorials in Eisleben and
  Wittenberg; Bauhaus and its Sites in Weimar, Dessau and Bernau; Maritime Greenwich;
  Palau de la Música Catalana and Hospital de Sant Pau; Arab-Norman Palermo and the
  Cathedral Churches of Cefalú and Monreale; Historic Centre of Avignon: Papal
  Palace, Episcopal Ensemble and Avignon Bridge; Levoča, Spišský Hrad and the
  Associated Cultural Monuments; Australian Convict Sites (a thematic "penal sites"
  collection); Jewish Quarter and St Procopius' Basilica in Třebíč; Land of
  Frankincense.
fallback: condition not met → proceed to NULLTYPE_CONTESTED_ORIGIN_01.
found_in_current_dataset: 26 of 537.
```

### NULLTYPE_CONTESTED_ORIGIN_01 → REVIEW
```text
scope: type === null
input_condition: record's own text states an explicit two-sided debate over the
                 site's fundamental natural-vs-constructed (or existed-vs-never-
                 existed) origin, with physical/documentary description on more than
                 one side of the debate (e.g. geologists vs. archaeologists over
                 natural rock formation vs. constructed feature; a scholarly dispute
                 over whether a structure ever physically existed).
output: none assigned automatically.
confidence: REVIEW
rationale: §2 — the record contains real, substantive, competing evidence; a human
  must weigh it, this is not a missing-information gap. Distinguished from
  NULLTYPE_INSUFFICIENT_EVIDENCE_01 below by the presence of an explicit two-sided
  debate rather than a single unsubstantiated claim.
fallback: if this rule's own condition is not met, proceed to NULLTYPE_AMBIGUOUS_01 —
  this heading's "→ REVIEW" describes the outcome ONLY for records that match its
  condition (§7.3), the same convention used throughout §9–§15.
found_in_current_dataset: 5 of 537 (e.g. *Marcahuasi*, *Bimini Road*, *Newport
  Tower*, *Hanging Gardens of Babylon*, *Empuluzi*).
```

### NULLTYPE_AMBIGUOUS_01 → REVIEW
```text
scope: type === null
input_condition: record's own text or fields present two or more distinct,
                 comparably-substantiated candidate identities/Types for the same
                 record without indicating which is primary — matching this
                 document's own worked REVIEW example (§2: "Roman fort and later
                 monastery").
output: none assigned automatically.
confidence: REVIEW
rationale: §2 — positive evidence for two candidates is real evidence, just not
  self-resolving evidence.
fallback: if this rule's own condition is not met, proceed to
  NULLTYPE_LANDSCAPE_VS_OTHER_BOUNDARY_01 (§7.3).
found_in_current_dataset: 2 of 537 (e.g. *Herxheim* — ritual centre vs. mass grave;
  *Struve Geodetic Arc* — Infrastructure vs. Monument vs. Other, all defensible).
```

### NULLTYPE_LANDSCAPE_VS_OTHER_BOUNDARY_01 → REVIEW
```text
scope: type === null
input_condition: record documents substantive, specific, globally significant history
                 attached to a natural landmark, but whether that history clears
                 TAXONOMY.md §4.13's "cultural, mythological, or religious" bar for
                 Landscape (as opposed to defaulting to Other per §4.14) is a genuine
                 taxonomy-boundary policy question, not a record-evidence gap.
output: none assigned automatically.
confidence: REVIEW
rationale: §2 — this is a cross-Type/taxonomy-boundary judgement call for a human
  policy decision, not missing information (the historical significance itself is not
  in doubt).
fallback: if this rule's own condition is not met, proceed to
  NULLTYPE_OBSERVATORY_BOUNDARY_01 (§7.3).
found_in_current_dataset: 1 of 537 (*Galápagos Islands* — Darwin/evolution history is
  substantive and undisputed, but whether scientific-historical significance clears
  §4.13's cultural/mythological/religious bar is the open question).
```

### NULLTYPE_OBSERVATORY_BOUNDARY_01 → REVIEW
```text
scope: type === null
input_condition: record's own name unambiguously identifies a structure of a kind
                 whose relationship to TAXONOMY.md §4.12's narrow Observatory
                 definition is itself a genuine taxonomy-boundary question (e.g. a
                 named planetarium — a sky-simulation structure, not necessarily an
                 "observation" structure in §4.12's sense).
output: none assigned automatically.
confidence: REVIEW
rationale: §2/TAXONOMY.md §4.12 — the record's own identity is not in doubt; whether
  that identity falls inside or outside Observatory's deliberately narrow definition
  is a taxonomy-boundary policy question for a human, not a missing-information gap,
  and not something this migration document may resolve unilaterally by stretching or
  narrowing §4.12 (TAXONOMY.md remains MIGRATION-FROZEN).
fallback: if this rule's own condition is not met, proceed to
  NULLTYPE_INSUFFICIENT_EVIDENCE_01 (§7.3).
found_in_current_dataset: 1 of 537 (*Eisinga Planetarium in Franeker*).
```

### NULLTYPE_INSUFFICIENT_EVIDENCE_01 → RESEARCH
```text
scope: type === null
input_condition: reached only where a genuine, specifically-identifiable information
                 gap exists — NOT a universal catch-all for any record that fails the
                 rules above (v2.3 refinement, Observatory §14, reused unchanged for
                 Ruins §15 and here). Fires only where at least one of the following is
                 true:
                   (a) `text` is empty or contains no substantive classifying content;
                   (b) `text` is visibly truncated before completion, and the
                       surviving portion contains no positive evidence sufficient to
                       satisfy any rule above (truncated-text evidence rule) —
                       including, per NULLTYPE_ARCHSITE_EXPLICIT_01's own scope note,
                       a truncated GENERIC archaeological/prehistoric-site
                       self-identification with no more-specific signal before the
                       cutoff;
                   (c) `text` is complete but its only substantive content is a
                       single unsubstantiated claim, an unverified popular/touristic
                       or paranormal reputation, or an unresolved naming-folklore
                       anecdote — with no second named candidate identity
                       (distinguishing this from NULLTYPE_AMBIGUOUS_01, which requires
                       two or more) and no corroborating physical/functional
                       description — the PYRAMID_XIAN_CLUSTER_01/FOREST pattern (§2,
                       §9, §13): "the test is never 'is the popular framing of this
                       site contested?' — it is 'does the record itself establish what
                       the site fundamentally is?'";
                   (d) `text` is empty/content-free and the record's own name does not
                       clear any named-rule's unambiguous bar (NULLTYPE_BATTLEFIELD_
                       NAMED_01 / NULLTYPE_MONUMENT_NAMED_01 / NULLTYPE_INDUSTRIAL_
                       NAMED_01 / NULLTYPE_OTHER_NAMED_01 above) — an ordinary proper
                       noun, a geographic/place name, or a term genuinely ambiguous
                       between a natural feature and a constructed one (e.g.
                       "monolith," a folk-attributed "Druid's Altar");
                   (e) any other specifically-identifiable missing-information
                       condition consistent with the RESEARCH test in §2 ("the answer
                       isn't in here").
output: none assigned automatically.
confidence: RESEARCH
rationale: §2 — each of (a)-(e) is a genuine information gap, not an interpretation
  problem. This rule is deliberately narrower than a bare "nothing else matched"
  condition (the v2.3 refinement, reused for Ruins §15 and here) — a future record
  with substantive-but-differently-ambiguous evidence that does not fit (a)-(e) must
  not be swept into RESEARCH by default; it falls through to NULLTYPE_FALLBACK_01
  instead, preserving REVIEW as the correct outcome for "information present,
  interpretation required" regardless of which specific named sub-condition it fails
  to match. This is by far the largest single bucket in this group — a direct
  consequence of how often this population's `text` field is either empty or visibly
  truncated with no identity-establishing detail (sub-conditions (a) and (b) together
  account for the substantial majority of the 173).
fallback: condition not met → proceed to NULLTYPE_FALLBACK_01.
found_in_current_dataset: 173 of 537.
```

### NULLTYPE_FALLBACK_01 → REVIEW (terminal)
```text
scope: type === null
input_condition: catch-all — reached only by a record with substantive text that
                 satisfies none of NULLTYPE_ARCHSITE_EXPLICIT_01 through
                 NULLTYPE_INSUFFICIENT_EVIDENCE_01 above, and that is not a genuine
                 information gap under NULLTYPE_INSUFFICIENT_EVIDENCE_01's named
                 sub-conditions.
output: none assigned automatically.
confidence: REVIEW
rationale: §2 — the general "information present, human interpretation required" case,
  kept distinct from RESEARCH's "information missing" case for the same
  architectural-safety reason OBSERVATORY_FALLBACK_01 (§14) and RUINS_FALLBACK_01
  (§15) exist: so that a future record with substantive but differently-ambiguous
  evidence lands in REVIEW rather than being forced into either a specific Type it
  doesn't clearly earn or a RESEARCH state that misrepresents "there's something
  here, it's just unresolved" as "there's nothing here."
fallback: n/a — this is the actual terminal rule for the null/missing-Type chain.
found_in_current_dataset: 2 of 537 (*The Money Pit* — substantive excavated evidence
  present, but the record does not establish what kind of site this fundamentally is;
  *Hy Brasil* — a genuine, well-documented mythological tradition is present, but the
  record maps a place explicitly framed as non-physical/legendary rather than a
  classifiable historical site).
```

**Retired candidate bucket (do not resurrect as an active rule):** `NULLTYPE_SETTLEMENT_NAMED_01` — an early candidate rule that would have generalized "the record's own name contains an unambiguous structural/functional term" directly to `Settlement` on empty text. Independent review found its sole member, *Viking Longhouse* (site-0209), does not meet TAXONOMY.md §4.1's settlement-scope requirement (a single named dwelling is not a settlement), and corrected it to `Other` + `architecture:house` under `NULLTYPE_OTHER_NAMED_01` above instead. `NULLTYPE_SETTLEMENT_NAMED_01` therefore has 0 members in the approved Decision Matrix and does not appear in the rule chain below — it is documented here, in this section's inspection history, purely so a future implementation does not reintroduce it by mistaking its absence for an oversight.

**Chain:** `NULLTYPE_ARCHSITE_EXPLICIT_01` → `NULLTYPE_BATTLEFIELD_NAMED_01` → `NULLTYPE_MONUMENT_NAMED_01` → `NULLTYPE_INDUSTRIAL_NAMED_01` → `NULLTYPE_OTHER_NAMED_01` → `NULLTYPE_LANDSCAPE_MULTICOMPONENT_01` → `NULLTYPE_MULTICOMPONENT_ARCHSITE_01` → `NULLTYPE_MULTISETTLEMENT_SCOPE_01` → `NULLTYPE_TOMB_01` → `NULLTYPE_RELIGIOUS_01` → `NULLTYPE_PALACE_01` → `NULLTYPE_MONUMENT_01` → `NULLTYPE_INFRASTRUCTURE_01` → `NULLTYPE_INDUSTRIAL_01` → `NULLTYPE_CIVIC_ARCHSITE_01` → `NULLTYPE_SETTLEMENT_01` → `NULLTYPE_LANDSCAPE_SACRED_01` → `NULLTYPE_LANDSCAPE_CULTURAL_01` → `NULLTYPE_NO_HISTORICAL_SIGNIFICANCE_01` → `NULLTYPE_OTHER_MODERN_POSITIVE_01` → `NULLTYPE_OTHER_NO_FITTING_TYPE_01` → `NULLTYPE_CONTESTED_ORIGIN_01` → `NULLTYPE_AMBIGUOUS_01` → `NULLTYPE_LANDSCAPE_VS_OTHER_BOUNDARY_01` → `NULLTYPE_OBSERVATORY_BOUNDARY_01` → `NULLTYPE_INSUFFICIENT_EVIDENCE_01` → `NULLTYPE_FALLBACK_01` (terminal). Twenty-seven active rules — the longest chain in this document — because this legacy value produced eleven distinct outcomes (nine canonical Types plus REVIEW and RESEARCH), more than any prior group, without a single taxonomy-authorized default to lean on (unlike Ruins' Migration Rule 14 baseline).

**Tag note (applies across all null/missing-Type outcomes):**
- No legacy `type` string exists for this group, so there is no Ruins-style "legacy value implies a Tag" pattern to guard against in the first place — every Tag above is earned strictly from the record's own text or (on empty text) its name, per Migration Principle 1.2, exactly like every other rule in this document.
- Do not reflexively add `archaeology:archaeological-site` to any `Archaeological Site` output (`NULLTYPE_ARCHSITE_EXPLICIT_01`, `NULLTYPE_MULTICOMPONENT_ARCHSITE_01`, `NULLTYPE_CIVIC_ARCHSITE_01`) merely because `canonicalType = "Archaeological Site"` — TAXONOMY.md §8/§43, the same restraint already applied to every prior group's Archaeological Site outputs.
- Do not default a specific `settlement:*` subtype (e.g. `settlement:urban`) on `NULLTYPE_SETTLEMENT_01` outputs, or a specific `architecture:*`/`monument:*` subtype on any other rule's output, merely because it is a plausible-looking value — TAXONOMY.md §20/§43. Use the most specific value the record's own text actually supports; omit the subtype tag entirely otherwise.
- `NULLTYPE_MULTISETTLEMENT_SCOPE_01`, `NULLTYPE_CONTESTED_ORIGIN_01`, `NULLTYPE_AMBIGUOUS_01`, `NULLTYPE_LANDSCAPE_VS_OTHER_BOUNDARY_01`, `NULLTYPE_OBSERVATORY_BOUNDARY_01`, `NULLTYPE_INSUFFICIENT_EVIDENCE_01`, and `NULLTYPE_FALLBACK_01` (REVIEW/RESEARCH) assign no Tags automatically, matching the "output: none assigned automatically" convention used identically by every REVIEW/RESEARCH rule in this document since Forest (§13).

**Provenance/workflow compatibility (§4–§5, reused as-is, no redesign):**
- Every CONDITIONAL hit above (`NULLTYPE_ARCHSITE_EXPLICIT_01` through `NULLTYPE_OTHER_NO_FITTING_TYPE_01`) populates `provenance.type` with `method: "conditional"`, `ruleId` set accordingly, `sourceFields: ["text"]` or `["n"]` for the four name-based rules — and creates no `workflow.type` object (§5.3 rule 1).
- `NULLTYPE_MULTISETTLEMENT_SCOPE_01`, `NULLTYPE_CONTESTED_ORIGIN_01`, `NULLTYPE_AMBIGUOUS_01`, `NULLTYPE_LANDSCAPE_VS_OTHER_BOUNDARY_01`, `NULLTYPE_OBSERVATORY_BOUNDARY_01`, and `NULLTYPE_FALLBACK_01` populate `provenance.type` with `value: null`, `method: null`, `ruleId` set accordingly, and create `workflow.type` with `state: "review"`.
- `NULLTYPE_INSUFFICIENT_EVIDENCE_01` populates `provenance.type` with `value: null`, `method: null`, `ruleId: "NULLTYPE_INSUFFICIENT_EVIDENCE_01"`, and creates `workflow.type` with `state: "research"` — matching the `PYRAMID_PHARAONIC_EMPTY_TEXT_01`/`OBSERVATORY_INSUFFICIENT_EVIDENCE_01`/`RUINS_INSUFFICIENT_EVIDENCE_01` worked pattern (§4.3, §14, §15).
- All provenance and workflow entries produced by this section use `policyVersion: "migration-rules-v2.5"`.

**Null/missing-Type chain consistency check (v2.5), mirroring the §7.5 method used for Pyramid/Cairn/Mound/Wall and the Forest/Observatory/Ruins checks in §13/§14/§15:**
- **Rule order:** as listed in "Chain" above. Every non-terminal rule's fallback names exactly the next rule in the list; `NULLTYPE_FALLBACK_01` is terminal with `fallback: n/a`, paired with `confidence: REVIEW` — correct use of §7.3 form 2. No branching terminal (form 3) is used: REVIEW and RESEARCH are resolved by several ordered, separately-scoped rules (`NULLTYPE_MULTISETTLEMENT_SCOPE_01` mid-chain; `NULLTYPE_CONTESTED_ORIGIN_01`/`NULLTYPE_AMBIGUOUS_01`/`NULLTYPE_LANDSCAPE_VS_OTHER_BOUNDARY_01`/`NULLTYPE_OBSERVATORY_BOUNDARY_01` mid-chain; `NULLTYPE_INSUFFICIENT_EVIDENCE_01` then `NULLTYPE_FALLBACK_01` at the terminal end) rather than a single mutually-exclusive pair — the same architecture Observatory and Ruins use (§14, §15), extended here to five mid-chain REVIEW rules rather than one or two, because this group's REVIEW outcomes span five evidentially distinct shapes (multi-settlement scope, contested origin, dual identity, landscape-boundary, and observatory-boundary) rather than one.
- **Reachability:** every rule other than the chain's first rule (`NULLTYPE_ARCHSITE_EXPLICIT_01`, entry point per §7.2 point 1) is named as a fallback target by exactly one other rule. No orphaned rule. `NULLTYPE_SETTLEMENT_NAMED_01` is deliberately NOT part of this chain — it is retired (0 members; see the retired-bucket note above) and is not named as any rule's fallback target, so it cannot fire even accidentally.
- **No silent default:** `NULLTYPE_MULTISETTLEMENT_SCOPE_01`, `NULLTYPE_CONTESTED_ORIGIN_01`, `NULLTYPE_AMBIGUOUS_01`, `NULLTYPE_LANDSCAPE_VS_OTHER_BOUNDARY_01`, `NULLTYPE_OBSERVATORY_BOUNDARY_01`, `NULLTYPE_INSUFFICIENT_EVIDENCE_01`, and `NULLTYPE_FALLBACK_01` each produce an explicit REVIEW or RESEARCH label with no `canonicalType` assigned; every CONDITIONAL rule assigns a Type that exists in TAXONOMY.md v1.3's controlled vocabulary (§4) and Tags that exist in its namespaced Tag vocabulary (§6–§21) — no new Type, Tag, Function, or namespace was proposed anywhere in this section.
- **Specific-before-general (§7.1) and record-scope (§8):** the chain checks, in order: (1) a complete-text explicit self-identification of a Type that is itself an evidentiary fallback (`NULLTYPE_ARCHSITE_EXPLICIT_01`, positioned first because its own condition already requires ruling out a more-specific Type from the same complete text); (2) narrow name-only rules restricted to empty text (the four `*_NAMED_01` rules); (3) explicit unified-landscape framing; (4) multi-component groupings with collective archaeological/ruin identity; (5) multi-settlement scope (REVIEW); (6) single-record positive identification of every remaining structural/institutional Type, most-specific first (Tomb, Religious Site, Palace, Monument, Infrastructure, Industrial Site, isolated civic architecture, then Settlement last, since Settlement is this group's largest and most scope-error-prone Type); (7)-(8) natural-landmark significance, positive before absence-dependent (`NULLTYPE_LANDSCAPE_SACRED_01`/`NULLTYPE_LANDSCAPE_CULTURAL_01` before `NULLTYPE_NO_HISTORICAL_SIGNIFICANCE_01`, mirroring `FOREST_SACRED_01` before `FOREST_NATURAL_COMPLETE_01`, §13); (9) truncated-but-positive modern identity, still positive-evidence-first; (10) genuine significance with no fitting Type; (11) explicit REVIEW-shaped contested/ambiguous/boundary cases; (12) scoped RESEARCH; (13) general REVIEW terminal. This ordering is what keeps a multi-component or multi-settlement record from being swallowed by a single-Type rule reached later in the chain, and keeps RESEARCH from becoming a universal fallback for every unmatched record.
- **Truncation safety:** every rule that depends on the ABSENCE of competing evidence (`NULLTYPE_ARCHSITE_EXPLICIT_01`'s "no more-specific Type" clause, `NULLTYPE_NO_HISTORICAL_SIGNIFICANCE_01`) explicitly requires complete text; every rule reached on truncated text (`NULLTYPE_LANDSCAPE_SACRED_01`, `NULLTYPE_LANDSCAPE_CULTURAL_01`, `NULLTYPE_OTHER_MODERN_POSITIVE_01`, and the record-scope-positive half of `NULLTYPE_SETTLEMENT_01`/`NULLTYPE_MULTICOMPONENT_ARCHSITE_01`) rests only on POSITIVE evidence established before the cutoff. No rule in this chain relies on the absence of evidence in a truncated record.
- **No rule relies on component identity instead of record identity:** `NULLTYPE_MULTICOMPONENT_ARCHSITE_01`'s collective-identity requirement and `NULLTYPE_RELIGIOUS_01`'s ensemble-identity generalization are both explicit, independent guards against exactly this failure mode, in opposite directions (one requires archaeological evidence to span the whole grouping; the other confirms that component heterogeneity does not itself defeat an otherwise positively-established whole-record identity).
- **REVIEW/RESEARCH semantics:** all 18 REVIEW rows reconfirmed to involve either an explicit two-sided textual debate/dual identity, a genuine cross-Type/scope-modeling judgement call, or a genuine taxonomy-boundary policy question — never a data gap; all 173 RESEARCH rows reconfirmed to involve genuinely missing/insufficient information, never mere difficulty (§2's test applied literally, per the approved Decision Matrix's own mechanical reconciliation).
- **Full-batch verification against the approved Decision Matrix, by rule:**

  | Rule | Approved count | Decision State | Canonical Type |
  |---|---|---|---|
  | `NULLTYPE_ARCHSITE_EXPLICIT_01` | 6 | CONDITIONAL | Archaeological Site |
  | `NULLTYPE_BATTLEFIELD_NAMED_01` | 1 | CONDITIONAL | Battlefield |
  | `NULLTYPE_MONUMENT_NAMED_01` | 1 | CONDITIONAL | Monument |
  | `NULLTYPE_INDUSTRIAL_NAMED_01` | 1 | CONDITIONAL | Industrial Site |
  | `NULLTYPE_OTHER_NAMED_01` | 1 | CONDITIONAL | Other |
  | `NULLTYPE_LANDSCAPE_MULTICOMPONENT_01` | 60 | CONDITIONAL | Landscape |
  | `NULLTYPE_MULTICOMPONENT_ARCHSITE_01` | 2 | CONDITIONAL | Archaeological Site |
  | `NULLTYPE_MULTISETTLEMENT_SCOPE_01` | 7 | REVIEW | — |
  | `NULLTYPE_TOMB_01` | 3 | CONDITIONAL | Tomb |
  | `NULLTYPE_RELIGIOUS_01` | 2 | CONDITIONAL | Religious Site |
  | `NULLTYPE_PALACE_01` | 1 | CONDITIONAL | Palace |
  | `NULLTYPE_MONUMENT_01` | 8 | CONDITIONAL | Monument |
  | `NULLTYPE_INFRASTRUCTURE_01` | 8 | CONDITIONAL | Infrastructure |
  | `NULLTYPE_INDUSTRIAL_01` | 5 | CONDITIONAL | Industrial Site |
  | `NULLTYPE_CIVIC_ARCHSITE_01` | 1 | CONDITIONAL | Archaeological Site |
  | `NULLTYPE_SETTLEMENT_01` | 100 | CONDITIONAL | Settlement |
  | `NULLTYPE_LANDSCAPE_SACRED_01` | 22 | CONDITIONAL | Landscape |
  | `NULLTYPE_LANDSCAPE_CULTURAL_01` | 20 | CONDITIONAL | Landscape |
  | `NULLTYPE_NO_HISTORICAL_SIGNIFICANCE_01` | 70 | CONDITIONAL | Other |
  | `NULLTYPE_OTHER_MODERN_POSITIVE_01` | 8 | CONDITIONAL | Other |
  | `NULLTYPE_OTHER_NO_FITTING_TYPE_01` | 26 | CONDITIONAL | Other |
  | `NULLTYPE_CONTESTED_ORIGIN_01` | 5 | REVIEW | — |
  | `NULLTYPE_AMBIGUOUS_01` | 2 | REVIEW | — |
  | `NULLTYPE_LANDSCAPE_VS_OTHER_BOUNDARY_01` | 1 | REVIEW | — |
  | `NULLTYPE_OBSERVATORY_BOUNDARY_01` | 1 | REVIEW | — |
  | `NULLTYPE_INSUFFICIENT_EVIDENCE_01` | 173 | RESEARCH | — |
  | `NULLTYPE_FALLBACK_01` | 2 | REVIEW | — |
  | `NULLTYPE_SETTLEMENT_NAMED_01` (retired) | 0 | — | — |

  **Total: 537.** State totals: CONDITIONAL 346 (= 6+1+1+1+1+60+2+3+2+1+8+8+5+1+100+22+20+70+8+26), REVIEW 18 (= 7+5+2+1+1+2), RESEARCH 173. **346 + 18 + 173 = 537.** Canonical-Type totals within CONDITIONAL: Other 105 (= 1+70+8+26), Landscape 102 (= 60+22+20), Settlement 100, Archaeological Site 9 (= 6+2+1), Monument 9 (= 1+8), Infrastructure 8, Industrial Site 6 (= 1+5), Tomb 3, Religious Site 2, Battlefield 1, Palace 1 — **sum 346**, exactly matching the approved Decision Matrix's own totals and the totals specified for this formalization pass. **No defect found; no count adjusted to force a match.**

---

## 17. Safety Rules

The migration system defined by this policy must never:

- invent historical information;
- infer Political Entity directly from Culture;
- infer Historical Phase from age alone;
- infer Function from architectural appearance alone — **including from a specific historical-building Tag like `architecture:caravanserai`** (§14, audit point 14): the Tag describes form, never Function, on its own;
- treat `Ruins` as a Type (it is not one — see `TAXONOMY.md` Migration Rule 14);
- treat `Observatory` and `astronomical` as synonyms (Type vs. Function — `TAXONOMY.md` §4.12/§21/§33c–e);
- classify a Ruins record as Settlement merely because a city/town/village word occurs anywhere in its text — the record's own scope must positively be that settlement, not a nearby, modern, containing, administrative, comparison, or etymologically-glossed place (§15, `RUINS_SETTLEMENT_01`'s mechanical test; independent-audit finding, corrected across three separate passes before this section was formalized);
- add `archaeology:ruins` to a record merely because `legacy type === "Ruins"` — the Tag requires independent positive evidence of ruined/non-extant condition, except the one explicit TAXONOMY.md Migration Rule 14 baseline (§15's tag rule);
- treat an ambiguous historic-residence name (e.g. "Château," Dutch "Huis te/ter/ten") as sufficient by itself to assign `Fortification` — only genuinely unambiguous defensive terminology does (§15, `RUINS_FORTIFICATION_NAMED_01`);
- treat `type === null` itself as evidence for, or against, any canonical Type — null is a missing legacy classification, not a classification (§16, restating Migration Principle 1.2 for the one legacy value that carries no descriptive string at all);
- classify a null/missing-Type record combining multiple named components (a multi-part UNESCO-style listing, a grouping of distinct sites or settlements) as `Archaeological Site` on the strength of archaeological/ruin framing that describes only one of those components rather than the grouping's own collective identity (§16, `NULLTYPE_MULTICOMPONENT_ARCHSITE_01`'s collective-identity requirement — the Land of Frankincense correction);
- turn every `Pyramid` into Monument, Tomb, or any other single Type;
- turn every `Mound` into Tomb or Monument;
- turn every `Wall` into Fortification;
- reason "not proven Tomb → therefore Monument," or any structurally equivalent "absence of X → therefore Y" shortcut (audit point 7 — kept explicit in v2, §11 `MOUND_MONUMENT_01`);
- classify a record by a component or feature mentioned in its text rather than by what the record's own scope fundamentally represents (§8, new in v2);
- add a Tag reflexively merely because it echoes the Type name (`archaeology:archaeological-site` on an `Archaeological Site` record, `architecture:observatory` on an `Observatory` record) when it adds no information beyond the Type itself (TAXONOMY.md §43; audit point 10, new in v2);
- hardcode a specific Tag value (e.g. `settlement:urban`, `military:city-wall`) as the hardcoded output of a rule instead of selecting the most specific value the record's own text actually supports (audit point 9, new in v2);
- use vague probabilistic reasoning ("probably," "likely," "commonly associated with") as a basis for AUTO or CONDITIONAL classification;
- silently delete records, legacy values, or duplicates;
- overwrite the original source dataset, any legacy field, or the `type` field specifically (§3, new in v2 — `type` is now explicitly named because §3 introduces the field most at risk of an accidental overwrite);
- create a new canonical Type merely because a legacy value is difficult to map — Tags, REVIEW, and RESEARCH exist precisely so that a hard record never forces a taxonomy change (`TAXONOMY.md` Golden Rule 7 / §47);
- conflate *how a value was derived* (provenance, §4) with *where a record stands in the review process* (workflow state, §5), or conflate *duplicate identity* with *deduplication action* (§6) — both are now structurally separate fields, not overloaded enum values (audit points 12–13, new in v2).

Every rule in §9–§16 (including Forest, §13, added in v2.2, Observatory, §14, added in v2.3, Ruins, §15, added in v2.4, and null/missing Type, §16, added in v2.5) was designed to be checkable against this list: each CONDITIONAL rule requires an *explicit* statement in the record about the record's own scope, not a probabilistic inference; every group ends in REVIEW/RESEARCH rather than a forced default; no rule proposes a new Type; no rule is keyed to a specific record name (audit point 17 — verified across all rules in this document; the only scope condition that references a named cluster, `PYRAMID_XIAN_CLUSTER_01`, is a documented recognizable group, not a single-record `IF name == X` rule, and record names that appear in rationale text — Dun Carloway Broch, Rujm el-Hiri, Moundville Archaeological Park, Prehistoric Mounds of Uruguay — are cited only as verified examples/evidence, never as rule conditions). Forest's own terminal rule, `FOREST_INSUFFICIENT_EVIDENCE_01`, Observatory's own terminal rules, `OBSERVATORY_INSUFFICIENT_EVIDENCE_01`/`OBSERVATORY_FALLBACK_01`, Ruins' own terminal rules, `RUINS_ARCHSITE_DEFAULT_01`/`RUINS_INSUFFICIENT_EVIDENCE_01`/`RUINS_FALLBACK_01`, and null/missing Type's own terminal rules, `NULLTYPE_INSUFFICIENT_EVIDENCE_01`/`NULLTYPE_FALLBACK_01`, were likewise deliberately written as general evidentiary conditions rather than a list of the specific record ids that currently satisfy them — `RUINS_SETTLEMENT_01` in particular is written as a mechanical test precisely because a keyword-only version of that rule is exactly what this section prohibits, and exactly what the pre-formalization Decision Matrix had to be corrected for three separate times (§15's introduction).

---

## 18. Regression Cases (NEW in v2 — audit point 18)

These are policy-level expected outcomes, not executable tests, documenting what a future implementation must reproduce. Each references a record actually verified against `archeomaps_1.html` or the v1 inspection findings during this audit, where available; unverified categories are marked as such rather than invented.

| Case | Example record | Legacy type | Expected `canonicalType` | Rule | Verified against |
|---|---|---|---|---|---|
| Pyramid → Religious Site | (v1 finding, 5 of 75; no specific record independently re-verified in this pass) | Pyramid | Religious Site | `PYRAMID_TEMPLE_01` | v1 inspection only — see §20 |
| Pyramid → Settlement | (v1 finding, 4 of 75) | Pyramid | Settlement | `PYRAMID_CITY_01` | v1 inspection only |
| Pyramid → Archaeological Site | (v1 finding, 3 of 75) | Pyramid | Archaeological Site | `PYRAMID_COMPLEX_01` | v1 inspection only |
| Pyramid → Monument | 1804 memorial (v1 finding, 1 of 75) | Pyramid | Monument | `PYRAMID_MODERN_MEMORIAL_01` | v1 inspection only |
| Pyramid → RESEARCH | Named pharaonic pyramid, empty text (v1 finding, 22 of 75) | Pyramid | — (RESEARCH) | `PYRAMID_PHARAONIC_EMPTY_TEXT_01` | v1 inspection only |
| Pyramid → RESEARCH (reclassified in v2) | *Chinese Pyramid*, Xi'an cluster (e.g. site-0492–0495) | Pyramid | — (RESEARCH) | `PYRAMID_XIAN_CLUSTER_01` | **Directly verified**, `archeomaps_1.html` |
| Contested/fringe Pyramid → REVIEW | Bosnian-pyramid-style / Mauritius "pyramid" claims (v1 finding, 9 of 75) | Pyramid | — (REVIEW) | `PYRAMID_FRINGE_01` | v1 inspection only |
| Cairn → Monument | Non-funerary cairn (v1 finding, 1 of 2) | Cairn | Monument | `CAIRN_NONFUNERARY_01` | v1 inspection only |
| Cairn → RESEARCH | Unexcavated "Grave," empty text (v1 finding, 1 of 2) | Cairn | — (RESEARCH) | `CAIRN_EMPTY_TEXT_RESEARCH_01` | v1 inspection only |
| Mound → Archaeological Site | (v1 finding, 6 of 15) | Mound | Archaeological Site | `MOUND_ARCHSITE_01` | v1 inspection only |
| Mound → Settlement (new in v2) | *Prehistoric Mounds of Uruguay* (site-1080) — "mound-building people... built planned village[s]" | Mound | Settlement | `MOUND_SETTLEMENT_01` | **Directly verified**, `archeomaps_1.html` |
| Mound → Tomb | (no record independently re-verified in this pass) | Mound | Tomb | `MOUND_TOMB_01` | not verified this pass |
| Mound → Monument (explicitly justified) | (no record independently re-verified in this pass) | Mound | Monument | `MOUND_MONUMENT_01` | not verified this pass |
| Ambiguous Mound → REVIEW/RESEARCH | "A large mound dominates the landscape" (worked example in the rule text itself) | Mound | — (REVIEW) | `MOUND_FALLBACK_01` | rule text, not a live record |
| Wall → Settlement | (no record independently re-verified in this pass) | Wall | Settlement | `WALL_SETTLEMENT_01` | not verified this pass |
| Wall → Fortification | *Dun Carloway Broch* (mistagged Wall; explicit broch identity) | Wall | Fortification | `WALL_FORTIFICATION_01` | v1 inspection finding |
| Wall → Monument (new in v2) | *Rujm el-Hiri* (site-0354) — 42,000-basalt-rock concentric megalithic arrangement | Wall | Monument | `WALL_MONUMENT_MEGALITHIC_01` | **Directly verified**, `archeomaps_1.html` |
| Wall → Archaeological Site | *Moundville Archaeological Park* (mistagged Wall; multi-mound complex) | Wall | Archaeological Site | `WALL_ARCHSITE_MISTAG_01` | v1 inspection finding |
| Ambiguous Wall → REVIEW/RESEARCH | "A wall survives at the site" (worked example in the rule text itself) | Wall | — (REVIEW) | `WALL_FALLBACK_01` | rule text, not a live record |
| Forest → Landscape (NEW in v2.2) | *Sacred Mijikenda Kaya Forests* (site-1671) — sacred forest groves, Mijikenda tradition, "revered today as dwelling places of ancestral spirits" | Forest | Landscape | `FOREST_SACRED_01` | **Directly verified**, `archeomaps_1.html` |
| Forest → Other (NEW in v2.2) | *The Sundarbans* (site-1713), *Sundarbans National Park* (site-1714), *Forest Research Institute Malaysia Forest Park* (site-1827) — complete text, exclusively ecological/scientific | Forest | Other | `FOREST_NATURAL_COMPLETE_01` | **Directly verified**, `archeomaps_1.html` |
| Forest → RESEARCH, truncated text (NEW in v2.2) | *Crooked Forest* (site-0049), *Lore Lindu* (site-0709), *Sinharaja Forest* (site-1214) — text visibly cut off before completion | Forest | — (RESEARCH) | `FOREST_INSUFFICIENT_EVIDENCE_01` | **Directly verified**, `archeomaps_1.html` |
| Forest → RESEARCH, empty/unestablished (NEW in v2.2) | *Aokigahara* (site-0152, empty text); *Hoia Forest* (site-1227, unestablished "most haunted" reputation) | Forest | — (RESEARCH) | `FOREST_INSUFFICIENT_EVIDENCE_01` | **Directly verified**, `archeomaps_1.html` |
| Observatory → Observatory (NEW in v2.3) | *Cheomseongdae* (site-0360) — "star-gazing tower," explicit "astronomical observatory"/"scientific institution" framing; *Chankillo Archaeoastronomical Complex* (site-1891) — "13 stone towers... used to track the sun's rising and setting positions" | Observatory | Observatory | `OBSERVATORY_PURPOSEBUILT_01` | **Directly verified**, `archeomaps_1.html` |
| Observatory → Monument, legacy-name false positive (NEW in v2.3) | *Amape/Amazon Stonehenge* (site-0118), *Goseck Circle* (site-0353), *Hill O Many Stanes* (site-0848) — legacy-typed AND popularly named "observatory," but own text establishes a stone-circle/henge/megalithic physical form only | Observatory | Monument | `OBSERVATORY_MONUMENT_FORM_01` | **Directly verified**, `archeomaps_1.html` |
| Observatory → REVIEW, competing labels (NEW in v2.3) | *Kokino* (site-0361) — explicitly called both "an important archaeological site" and "a megalithic observatory," neither substantiated | Observatory | — (REVIEW) | `OBSERVATORY_COMPETING_LABELS_01` | **Directly verified**, `archeomaps_1.html` |
| Observatory → RESEARCH, insufficient evidence (NEW in v2.3) | *Chilbolton Observatory* (site-0035) — single hedged, contested anecdote, no structural description; *Yantra Mantra* (site-0357) — empty text | Observatory | — (RESEARCH) | `OBSERVATORY_INSUFFICIENT_EVIDENCE_01` | **Directly verified**, `archeomaps_1.html` |
| Ruins → Settlement, explicit ancient city (NEW in v2.4) | records whose own text states, of themselves, "was an ancient city," "is one of the most prominent cities of," "was a city-state," etc. (170 of 346) | Ruins | Settlement | `RUINS_SETTLEMENT_01` | **Directly verified**, `archeomaps_1.html` |
| Ruins → NOT Settlement, nearby modern city (NEW in v2.4) | a record whose only settlement-family word names a different, distant city given as a distance bearing ("ten kilometres south of the city of..."), with no positive settlement claim about the record's own subject | Ruins | — (RESEARCH) | `RUINS_SETTLEMENT_01` does not fire → `RUINS_INSUFFICIENT_EVIDENCE_01` | **Directly verified**, `archeomaps_1.html` |
| Ruins → NOT Settlement, containing modern town (NEW in v2.4) | a record explicitly describing itself as "an archeological zone... located in the town of [X]" — the town is administrative/geographic container, not the record's own scope | Ruins | — (RESEARCH) | `RUINS_SETTLEMENT_01` does not fire → `RUINS_INSUFFICIENT_EVIDENCE_01` | **Directly verified**, `archeomaps_1.html` |
| Ruins → NOT Settlement, etymological gloss (NEW in v2.4) | a record whose only settlement-family words ("village, town, city...") occur inside a parenthetical translation of the record's own name, with the descriptive text itself saying only "is an archaeological site" | Ruins | — (RESEARCH) | `RUINS_SETTLEMENT_01` does not fire → `RUINS_INSUFFICIENT_EVIDENCE_01` | **Directly verified**, `archeomaps_1.html` (two independent records) |
| Ruins → Landscape, not Settlement, settlements inside a valley (NEW in v2.4) | a record explicitly describing its own scope as "an archaeologically significant valley consisting of 130 ancient settlements" | Ruins | Landscape | `RUINS_LANDSCAPE_01` | **Directly verified**, `archeomaps_1.html` |
| Ruins → Archaeological Site, multi-site grouping (NEW in v2.4) | a record explicitly naming itself "the collective name for three related archaeological sites," or "a group of archaeological sites" | Ruins | Archaeological Site | `RUINS_MULTICOMPONENT_ARCHSITE_01` | **Directly verified**, `archeomaps_1.html` (multiple independent records) |
| Ruins → Archaeological Site, isolated civic architecture not containing Settlement (NEW in v2.4) | a forum/plaza explicitly described as "at the center of the city of [X]," where the city is the container and the forum is the record's own scope | Ruins | Archaeological Site | `RUINS_CIVIC_ARCHSITE_01` | **Directly verified**, `archeomaps_1.html` |
| Ruins → Infrastructure, explicit road network (NEW in v2.4) | a record explicitly and solely describing "a vast network of roads... stretching some 30,000 km" | Ruins | Infrastructure | `RUINS_INFRASTRUCTURE_01` | **Directly verified**, `archeomaps_1.html` |
| Ruins → Religious Site, explicit institution (NEW in v2.4) | a record whose own name states "Friary"/"Abbey," or whose text leads with "The ancient monastery," even where a distant, differently-named city is also mentioned | Ruins | Religious Site | `RUINS_RELIGIOUS_01` | **Directly verified**, `archeomaps_1.html` (two independent records) |
| Ruins → REVIEW, combined competing scopes (NEW in v2.4) | a record whose title/text names two distinct, comparably-evidenced candidates — e.g. an explicit "abandoned village" combined with a separately-named fort in the same record's title; or a "settlement" clause competing with a monastic name-gloss | Ruins | — (REVIEW) | `RUINS_AMBIGUOUS_01` | **Directly verified**, `archeomaps_1.html` (three independent records) |
| Ruins → RESEARCH, truncated generic archaeological site (NEW in v2.4) | a record whose visible text says only "is a pre-Columbian archaeological site" and is cut off before any Type-resolving statement | Ruins | — (RESEARCH) | `RUINS_INSUFFICIENT_EVIDENCE_01` sub-condition (a) | **Directly verified**, `archeomaps_1.html` |
| Ruins → Archaeological Site, confirmed-empty Rule-14 baseline (NEW in v2.4) | a record with an empty `text` field and no other classifying information | Ruins | Archaeological Site | `RUINS_ARCHSITE_DEFAULT_01` | **Directly verified**, `archeomaps_1.html` (30 records) |
| Ruins → RESEARCH, ambiguous empty castle/residence name (NEW in v2.4) | an empty-text record named "Château de [X] (ruins)" or "Huis te [X] (ruins)" — a term that can denote either a castle or a non-defensive elite residence | Ruins | — (RESEARCH) | `RUINS_INSUFFICIENT_EVIDENCE_01` sub-condition (d) | **Directly verified**, `archeomaps_1.html` (29 records) |
| Ruins → Fortification, unambiguous defensive name (NEW in v2.4) | an empty-text record named "Kasteel [X] (ruins)" or "Castle [X] (Ruins)" | Ruins | Fortification | `RUINS_FORTIFICATION_NAMED_01` | **Directly verified**, `archeomaps_1.html` (5 records) |
| Ruins tag: legacy `Ruins` alone does NOT add `archaeology:ruins` (NEW in v2.4) | a record classified Settlement whose text describes it in the present tense as "a city and a municipal council," with no ruined-condition language | Ruins | Settlement (tag withheld) | `RUINS_SETTLEMENT_01` | **Directly verified**, `archeomaps_1.html` (two independent records) |
| Ruins tag: currently-inhabited settlement retains Type, loses tag (NEW in v2.4) | a record explicitly describing its subject as "still inhabited and continuously adapted today" | Ruins | Landscape (tag withheld) | `RUINS_LANDSCAPE_01` | **Directly verified**, `archeomaps_1.html` |
| Ruins tag: name-established more-specific Type does NOT inherit the Rule-14 baseline tag (independent-audit correction) | an empty-text record whose name establishes Settlement ("City of...") with nothing in the name or any other field stating ruined condition | Ruins | Settlement (tag withheld) | `RUINS_SETTLEMENT_NAMED_01` | **Directly verified**, `archeomaps_1.html` (two independent records; a third empty-text-but-name-based record's Tag was correctly kept, but only because an explicit "(ruins)" qualifier is present in that population's names under `RUINS_FORTIFICATION_NAMED_01`, not by extension of Rule 14) |
| Null/missing Type → Settlement, straightforward (NEW in v2.5) | *Mecca* — "Islam's holy city. The Islamic prophet Muhammad was born and lived in Mecca..." | `null` | Settlement | `NULLTYPE_SETTLEMENT_01` | **Directly verified**, `archeomaps_1.html` |
| Null/missing Type → Landscape, unified cultural landscape (NEW in v2.5) | *Easter Island* — Polynesian settlement and moai monuments documented as components of one island-wide cultural landscape | `null` | Landscape | `NULLTYPE_LANDSCAPE_MULTICOMPONENT_01` | **Directly verified**, `archeomaps_1.html` |
| Null/missing Type → Archaeological Site, complete explicit self-identification (NEW in v2.5) | a record whose complete (untruncated) text positively self-identifies as an archaeological site with positive archaeological/ruin/remains framing and no more-specific Type established | `null` | Archaeological Site | `NULLTYPE_ARCHSITE_EXPLICIT_01` | **Directly verified**, `archeomaps_1.html` (6 records) |
| Null/missing Type → RESEARCH, truncated generic archaeological-site self-identification (NEW in v2.5) | *Puerto Hormiga* — "The Puerto Hormiga archaeological site is located in..." cut off mid-word before any more-specific statement | `null` | — (RESEARCH) | `NULLTYPE_ARCHSITE_EXPLICIT_01` does not fire (truncated) → `NULLTYPE_INSUFFICIENT_EVIDENCE_01` | **Directly verified**, `archeomaps_1.html` |
| Null/missing Type → Archaeological Site, collective archaeological identity established (NEW in v2.5) | *Tusi Sites* — "this property encompasses remains of several tribal domains" (stated of the property collectively); *Chief Roi Mata's Domain* — "the site reflects the convergence between oral tradition and archaeology" (stated of the site as a whole) | `null` | Archaeological Site | `NULLTYPE_MULTICOMPONENT_ARCHSITE_01` | **Directly verified**, `archeomaps_1.html` (two records) |
| Null/missing Type → Other, component-only ruin language insufficient for collective identity (NEW in v2.5) | *Land of Frankincense* — "the ruined caravan oasis of Shisr" establishes ruin/archaeological character for only one of three named components (frankincense groves, the ruined oasis of Shisr, the port city of Khor Rori); the record's own collective self-framing is trade-route documentation, not an archaeological-complex identity for the grouping as a whole | `null` | Other | `NULLTYPE_MULTICOMPONENT_ARCHSITE_01` does not fire (component-only framing) → `NULLTYPE_OTHER_NO_FITTING_TYPE_01` | **Directly verified**, `archeomaps_1.html` |
| Null/missing Type → Other, named standalone structure not meeting Settlement's scope (NEW in v2.5) | *Viking Longhouse* (site-0209) — a single named dwelling, empty text; does not meet Settlement's scale/scope requirement and fits no other canonical Type | `null` | Other + `architecture:house` | `NULLTYPE_OTHER_NAMED_01` | **Directly verified**, `archeomaps_1.html` |
| Null/missing Type → Religious Site, heterogeneous religious ensemble (NEW in v2.5) | *Flemish Béguinages* (site-2082) — "the Béguines...founded the béguinages, enclosed communities designed to meet their spiritual and material needs"; the record names houses, churches, and ancillary buildings collectively, but the ensemble's own institutional identity is positively religious | `null` | Religious Site + `religion:religious` | `NULLTYPE_RELIGIOUS_01` | **Directly verified**, `archeomaps_1.html` |
| Null/missing Type → REVIEW, multi-settlement scope (NEW in v2.5) | *Ancient Ksour of Ouadane, Chinguetti, Tichitt and Oualata* — explicitly combines four distinct, separately named, still-standing fortified towns with no single Settlement row able to represent all four and no landscape framing | `null` | — (REVIEW) | `NULLTYPE_MULTISETTLEMENT_SCOPE_01` | **Directly verified**, `archeomaps_1.html` |
| Null/missing Type → REVIEW, contested origin (NEW in v2.5) | *Bimini Road* — explicit two-camp debate (geologists vs. archaeologists) over natural vs. constructed origin, with physical description on both sides | `null` | — (REVIEW) | `NULLTYPE_CONTESTED_ORIGIN_01` | **Directly verified**, `archeomaps_1.html` |
| Null/missing Type → RESEARCH, genuinely insufficient/sparse record (NEW in v2.5) | *Mount Ślęża* — text field is empty; nothing to classify from | `null` | — (RESEARCH) | `NULLTYPE_INSUFFICIENT_EVIDENCE_01` | **Directly verified**, `archeomaps_1.html` |
| Null/missing Type → Other, truncated but positively modern (NEW in v2.5) | a record whose surviving, truncated text nonetheless positively and completely establishes a specific, definitively non-historical identity (e.g. a modern instrumentally-recorded acoustic phenomenon) before the cutoff, not depending on the missing continuation | `null` | Other | `NULLTYPE_OTHER_MODERN_POSITIVE_01` | **Directly verified**, `archeomaps_1.html` (8 records) |

**Honesty note:** several rows above are marked "v1 inspection only" or "not verified this pass" rather than backed by a specific `id`. This is deliberate — the underlying 110-record inspection that produced these counts was not re-run record-by-record as part of this audit (doing so was out of scope for a specification-only review; see §20), and no `claude_DECISION_MATRIX.md` exists to cite specific `id`s from. Populating this table with fabricated specific records for those rows would violate this same document's own prohibition on inventing information (§17). A future implementation pass should replace every "not verified this pass" row with an actual `id` before treating this table as a real regression suite.

---

## 19. Future Extension

Pyramid, Cairn, Mound, Wall, Forest, Observatory, Ruins, and — as of v2.5 — null/missing Type are now eight completed groups: **every legacy-Type group originally identified as difficult by this migration programme is now formally covered by migration policy.** This does not mean the migration programme itself is finished, or that every conceivable future legacy or externally-imported value has been permanently solved — it means the currently-known backlog of hard legacy values has been worked through. This policy must continue to extend cleanly to any future newly-encountered legacy value, any future malformed or unseen `type` representation, and any genuinely new taxonomy gap, without destabilizing the taxonomy. The process is the same each time, and Forest (§13), Observatory (§14), Ruins (§15), and now null/missing Type (§16) are four worked examples of it, alongside the original Pyramid/Cairn/Mound/Wall pass:

1. **Inspect every record of the legacy value directly against the live `SITES` array.** No sampling — the 75/2/15/18-record inspections that produced §9–§12 were exhaustive, and that standard carries forward; the 9-record Forest inspection (§13), the 8-record Observatory inspection (§14), the 346-record Ruins inspection (§15), and the 537-record null/missing-Type inspection (§16) were all held to the same standard. Forest's inspection was refined mid-pass by the truncated-text evidence rule; Observatory's inspection then reused that same rule, refined it further (a rule may leave a Function unpopulated for lack of positive evidence without that silence asserting the Function's historical absence — §14), and separately corrected a chain-design risk (a naive terminal RESEARCH rule swallowing future REVIEW-shaped records) before its rules were finalized. Ruins' inspection — by far the largest group processed so far by record count — needed three separate correction passes after its first: a record-scope keyword-matching defect in its Settlement bucket, a mechanically-over-applied `archaeology:ruins` Tag, and, on independent adversarial re-audit of the very same corrected bucket, 13 further record-scope errors the second pass had itself missed (§15's introduction). Null/missing Type's inspection needed two independently-reviewed narrow correction passes of its own (§16's introduction: correction pass v2 corrected four systematic defects across 51 of 537 rows; correction pass v3 corrected two further individually-identified records before the matrix was approved as PASS) — a second confirmation, after Ruins, that "no sampling" is necessary but not sufficient: evidence sufficiency for a *specific* proposed bucket condition, and the chain's own safety for records the current batch doesn't happen to contain, must be checked as rigorously as coverage is, and a single correction pass should not be assumed to have caught everything a keyword-shaped or scope-shaped defect can produce.
2. **Group by explicit textual pattern establishing the record's own scope, not by assumption or by a component mentioned in passing (§8).** Only create a bucket when records share an *explicit* statement in their own text about their own fundamental identity — the same bar `PYRAMID_TEMPLE_01`, `MOUND_ARCHSITE_01`, `FOREST_SACRED_01`, `OBSERVATORY_PURPOSEBUILT_01`, `RUINS_TOMB_01`/`RUINS_RELIGIOUS_01`/etc., and `NULLTYPE_TOMB_01`/`NULLTYPE_RELIGIOUS_01`/etc. use. Where a bucket is defined by a keyword or word-family (as `RUINS_SETTLEMENT_01` unavoidably is, since "city/town/village/settlement" is the evidentiary vocabulary itself), the rule's condition must additionally require that the keyword's own grammatical subject be the record, not a nearby, containing, comparison, or etymologically-related place — see `RUINS_SETTLEMENT_01`'s mechanical test (§15) for the worked template, and `NULLTYPE_SETTLEMENT_01`'s adoption of that same test (§16) for its direct reuse.
3. **Order candidate rules from specific to general** (§7), each with the required fields (Rule ID, Input condition, Output, Confidence class, Rationale, Fallback, Scope), using the standardized fallback wording in §7.3.
4. **Every chain terminates in a named REVIEW or RESEARCH fallback**, chosen by the §2 test (present-but-ambiguous → REVIEW; missing/insufficient → RESEARCH). No chain may terminate in a silent default Type, and no non-terminal rule's fallback may route directly to REVIEW/RESEARCH instead of the next rule (§7.4). Forest produced zero REVIEW records, so its chain correctly uses a single terminal rule (§7.3 form 2). Observatory, Ruins, and null/missing Type all produced REVIEW and RESEARCH outcomes but are *not* branching-terminal cases in the Mound/Wall sense (§7.3 form 3, a single pair of mutually exclusive terminal conditions) — instead each chain keeps one or more specific mid-chain REVIEW rules (`OBSERVATORY_COMPETING_LABELS_01`; `RUINS_AMBIGUOUS_01`; null/missing Type's `NULLTYPE_MULTISETTLEMENT_SCOPE_01`, `NULLTYPE_CONTESTED_ORIGIN_01`, `NULLTYPE_AMBIGUOUS_01`, `NULLTYPE_LANDSCAPE_VS_OTHER_BOUNDARY_01`, and `NULLTYPE_OBSERVATORY_BOUNDARY_01`), a specific RESEARCH rule scoped to named information-gap sub-conditions (`OBSERVATORY_INSUFFICIENT_EVIDENCE_01`; `RUINS_INSUFFICIENT_EVIDENCE_01`; `NULLTYPE_INSUFFICIENT_EVIDENCE_01`), and a general REVIEW rule as the true terminal (`OBSERVATORY_FALLBACK_01`; `RUINS_FALLBACK_01`; `NULLTYPE_FALLBACK_01`) — four different shapes of "didn't resolve" now exist across this document's chains (Forest's single terminal; Mound/Wall's branching terminal; Observatory's/Ruins'/null's scoped-RESEARCH-then-general-REVIEW-terminal, the last of these also using several named mid-chain REVIEW rules rather than only one), and none is presumed to be *the* template for whatever comes next. Choose the shape the evidence actually produces. Ruins additionally shows that a rule reached only by confirmed-empty records (`RUINS_ARCHSITE_DEFAULT_01`) can sit ahead of the RESEARCH/REVIEW terminal pair when a taxonomy-level document (here, `TAXONOMY.md` Migration Rule 14) explicitly authorizes a narrow conditional default for that exact legacy value — this is not a general license to add other defaults, only a reproduction of a pre-existing, explicitly-scoped taxonomy rule. Null/missing Type had no such taxonomy-authorized default to reproduce (§16's own introduction) and none was invented for it.
5. **If a genuine taxonomy gap is found** — no existing Type/Tag/Function combination represents the concept without meaningful loss (the bar set by `TAXONOMY.md` Golden Rule 7) — do not resolve it inside migration. Flag it and escalate to the taxonomy owners, the same way the caravanserai gap was flagged and then resolved as an explicit taxonomy update rather than patched ad hoc inside a migration rule (§14 of `TAXONOMY.md` v1.3, §9 of this document's discussion in the final report). Forest's, Observatory's, Ruins', and null/missing Type's inspections all found none — Observatory was the group where a gap seemed most plausible going in (legacy value = canonical Type name); Ruins was the group where a gap seemed most plausible given sheer heterogeneity (nine reachable canonical Types); null/missing Type was inspected against the same bar with no baseline to lean on at all (unlike Ruins' Migration Rule 14) and still resolved entirely within existing vocabulary, using REVIEW and `Other` — not new Types or Tags — to hold every case existing vocabulary could not represent with a specific Type.
6. **Do not let a new group's rules leak into another group's precedence chain.** Null/missing Type has its own independently-ordered rule set under this same architecture (§16); it is not a sub-case of Pyramid/Cairn/Mound/Wall/Forest/Observatory/Ruins, and none of those seven groups' chains were reopened to accommodate it.

With all eight currently-identified difficult legacy-Type groups now formally covered, this Future Extension mechanism remains open for: **future newly-encountered legacy values** not present in the currently-inspected 1,010-record population (e.g. a legacy `type` string this document has not yet seen, should one appear in a future data import); **future malformed or unseen `type` representations** (e.g. a missing `type` property, an empty string, or a whitespace-only value — the null/missing-Type inspection (§16) confirmed all four of these representations are currently absent from the live population, but a future import could introduce one, and it would need its own inspection against this same standard rather than being silently folded into `NULLTYPE_*`'s `type === null` condition); **genuinely new taxonomy gaps**, escalated per point 5 above, not patched ad hoc; and **future data-quality/research work** on the RESEARCH- and REVIEW-routed records this document's eight completed groups have already identified (tracked per-record via `workflow.type`, §5), which remains a separate initiative from this document's own scope.

This document is complete as a **policy specification**. No JavaScript or Python has been written, `SITES` has not been modified, no migration has been executed, and `TAXONOMY.md` has been touched only for the caravanserai gap and its own version/changelog (see the companion `TAXONOMY.md` v1.3 changes) — neither the v2.2 Forest addition, the v2.3 Observatory addition, the v2.4 Ruins addition, nor this v2.5 null/missing-Type addition changed this.

---

## 20. Deliberate Deviations From v1 and From the Audit Brief

Documented here in one place, per the task's own instruction to make deviations explicit rather than silently rewriting history.

1. **`claude_DECISION_MATRIX.md` does not exist in this project.** The audit brief treats it as an available source document. It is not present alongside `TAXONOMY.md`, `MIGRATION_RULES.md` (v1), `MIGRATION_DRY_RUN.md`, `claude/ARCHEOMAPS_AUDIT.md`, `claude/ARCHEOMAPS_MIGRATION_PLAN.md`, or `archeomaps_1.html` — those are the only six project documents. Everywhere this audit needed to "check against the Decision Matrix," it instead checked against (a) the `found_in_current_dataset` counts and rationale already embedded in v1 of this document, which are the only surviving record of that 110-record inspection's conclusions, and (b) direct lookups against the live `archeomaps_1.html` data where a specific record was identifiable. This is not a gap this document can close — it is a missing-file discrepancy the requester should be aware of before treating any "the Decision Matrix said X" claim as verified.
2. **Xi'an cluster reclassified from REVIEW to RESEARCH** (`PYRAMID_XIAN_CLUSTER_01`, §9). This reverses v1's own classification, not a hypothetical "Decision Matrix" classification that couldn't be checked (see #1). The reversal is based on directly reading the actual record text in `archeomaps_1.html` and applying the REVIEW/RESEARCH test in §2 literally: the inspected text does not establish the underlying identity of the cluster's sites, it only repeats a popular framing — that is a RESEARCH gap, not a REVIEW judgement call. Full reasoning in §9.
3. **Type collision resolved with a flat `canonicalType` field, not the audit brief's preferred nested `legacy: { type: ... }` structure** (§3). Deviation justified by two other existing project documents (`claude/ARCHEOMAPS_AUDIT.md`, `claude/ARCHEOMAPS_MIGRATION_PLAN.md`) that already establish `type` is live-read by the application and must not be renamed or repurposed — a constraint the nested-object option would have violated.
4. **`MOUND_SETTLEMENT_01` and `WALL_MONUMENT_MEGALITHIC_01` are each currently backed by exactly one directly-verified record** (`Prehistoric Mounds of Uruguay`, `Rujm el-Hiri`), not a re-run of the full 15/18-record batches. Both rules are written generally and are not overfit to those two records (audit point 17), but the remaining 14 Mound and 17 Wall records have not been individually re-checked against the new rules as part of this pass — flagged as follow-up work in the final report, not silently presented as complete.
5. **`PYRAMID_CITY_01`'s v1 fallback is split into two rules** (`PYRAMID_CITY_01` continuing the chain, plus a new `PYRAMID_CITY_AMBIGUOUS_01` REVIEW rule) rather than simply rewriting the fallback line in place. This was necessary to preserve the one genuinely correct piece of v1's intent (a real ambiguous-city case should still reach REVIEW) while fixing the control-flow bug (§7.4) that also silently discarded every subsequent rule.

None of these deviations change `SITES`, `archeomaps_1.html`, or execute any migration. All are specification-level corrections, made explicit here rather than folded silently into the rule text.
