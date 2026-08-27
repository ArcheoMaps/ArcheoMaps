# ArcheoMaps Curator Workbench — Phase 4.1A

A static, GitHub-Pages-compatible review tool for the 62 UNESCO
`LIKELY_EXISTING_RECORD` identity-match proposals produced by Phase 4.0.

**This is a curator workbench, not an importer.** It reads the
authoritative dataset and the Phase 4.0 proposals, lets a human review
each proposed identity match, and records that human's decision. It
never writes to `archeomaps_data*.json`, never talks to GitHub, and
never embeds a credential.

```
pipeline proposal          (Phase 4.0 — already done)
        ↓
human review page          (this tool)
        ↓
exported decisions         (review_decisions.json)
        ↓
decision validation        (validate-review-decisions.js — report only)
        ↓
patch generation           (Phase 4.1B — NOT built by this phase)
        ↓
separate application       (a later, separate step — NOT built by this phase)
        ↓
post-application validation
```

## Directory layout

```
curator/
├── index.html              # page shell, static HTML
├── curator.css              # styling
├── curator.js               # DOM layer — rendering, events, localStorage
├── curator-core.js          # pure logic (filtering, sorting, validation,
│                             #   export/import, completeness formula) —
│                             #   shared between the browser and Node
├── review_queue.json         # generated queue (see below) — do not hand-edit
├── README.md                 # this file
└── schemas/
    ├── review-queue.schema.json
    └── review-decisions.schema.json

scripts/
├── lib.js                    # Node-only helpers (hashing, re-exports
│                              #   curator-core.js's completeness formula)
├── generate-review-queue.js  # deterministic queue generator
└── validate-review-decisions.js  # read-only decision validator

tests/
├── run-checks.js             # orchestrator for the browser check suite
├── manual-browser-check.js   # Playwright/Chromium interaction + screenshot suite
├── test-curator-core.js      # unit tests for pure logic (no browser needed)
├── test-generate-queue.js    # determinism + fail-fast tests for the generator
└── test-lazy-dataset-fetch.js # rare free-typed EDIT dataset-integrity check (browser)

test-output/                  # test run artifacts (see "Testing" below)
docs/                         # manual-visual-check-report.md + screenshots
```

## Running it locally

From the `curator/` directory:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000/index.html`. Opening `index.html`
directly as a `file://` URL will **not** work — browsers block the
`fetch()` call the page uses to load `review_queue.json` from local
files for security reasons.

## Hosting on GitHub Pages

Commit the `curator/` directory (including `review_queue.json`) to the
repository and point GitHub Pages at the branch/folder it lives in.
Everything is relative paths and vanilla HTML/CSS/JS — no build step, no
server-side code, no environment variables. If GitHub Pages serves the
repository root, the page will be at `.../curator/index.html`.

## Data flow — where each file comes from and where it's read

| File | Produced by | Read by |
|---|---|---|
| `archeomaps_data_unesco_enriched_corrected.json` | Phase 3.2 (already done) | `generate-review-queue.js` (Node, read-only). **Not** fetched by the browser under normal operation. |
| `unesco_likely_existing_records.json` | Phase 4.0 (already done) | `generate-review-queue.js` (Node, read-only) |
| `curator/review_queue.json` | `generate-review-queue.js` | the browser page (`curator.js` `fetch()`s this at load time) |
| `review_decisions.json` | the browser page (Export button) | `validate-review-decisions.js` (report only) |

**Why the browser doesn't load the full 3.6 MB authoritative dataset on
every page view:** `review_queue.json` is self-contained — it embeds a
trimmed "snapshot" (name, coordinates, chronology, type, tags, source,
completeness, etc. — not the full record, and never the verbose
`provenance` rule-audit trail) for every ArcheoMaps record referenced as
a top-3 identity candidate across all 62 proposals. That covers every
record the curator needs to see under normal use.

**The one exception — the rare free-typed EDIT path, and why it can't
silently point at the wrong file:** if a curator chooses **EDIT** and
types a *different* existing ArcheoMaps ID that wasn't one of the
pre-embedded top-3 candidates, the page validates that the ID exists
(using a lean `knownArcheomapsIds` list of id-strings-only, also embedded
in `review_queue.json`) and, only then, lazily fetches the full
authoritative dataset once to build a snapshot for that one record.

That fetch is configured in exactly one place, `DATA_CONFIG.archeomapsDatasetDir`
in `curator.js` — but only the *directory* is configured there. The
*filename* is read at runtime from `review_queue.json`'s own
`inputs.dataset.path` field (recorded by `generate-review-queue.js` when
the queue was built), so the filename this tool looks for can never
silently drift out of sync with whatever dataset the queue was actually
generated from. Before using the fetched file, the page computes its
sha256 (via the browser's built-in Web Crypto API — no dependency added)
and compares it against `review_queue.json`'s recorded
`inputs.dataset.sha256`. **If they don't match, the page refuses to use
the file and shows a clear error** rather than silently falling back to
a possibly-different dataset. Top-three candidate EDIT selection never
touches any of this — it works entirely from the pre-embedded snapshots
in `review_queue.json`.

If you deploy this tool on GitHub Pages, `DATA_CONFIG.archeomapsDatasetDir`
(default `'../'`) must point at wherever the authoritative checkpoint
actually lives relative to `curator/`. Get the filename right and the
integrity check above will confirm you also got the *content* right; get
the directory wrong and the free-typed EDIT path will show a fetch error
instead of silently using nothing or the wrong file — it will never
affect the top-3-candidate flow, which is the normal path for all 62
proposals in this queue.

## Regenerating `review_queue.json`

```bash
cd scripts
node generate-review-queue.js \
  --dataset=/path/to/archeomaps_data_unesco_enriched_corrected.json \
  --proposals=/path/to/unesco_likely_existing_records.json \
  --out=/path/to/curator/review_queue.json
```

All three flags are optional and fall back to files sitting next to the
script (`./archeomaps_data_unesco_enriched_corrected.json`,
`./unesco_likely_existing_records.json`) and `../curator/review_queue.json`
for output — **but this package deliberately does not ship copies of
your two authoritative input files inside `scripts/`** (see
"Why this package excludes your inputs" below), so the zero-argument
form will not work on a freshly extracted copy of this package unless
you place copies there yourself first. The explicit `--dataset`/
`--proposals` form above is the primary, recommended way to run this
script from this package as delivered.

The script:
- Opens both inputs **read-only** and re-verifies their sha256 hashes
  are unchanged after writing the queue (fails loudly if not).
- Fails loudly (non-zero exit, no output file written) if the proposals
  file doesn't contain exactly 62 items, if any candidate references an
  ArcheoMaps id that doesn't exist, if proposal IDs collide, or if the
  input JSON is malformed.
- Sorts proposals deterministically by numeric UNESCO id before
  processing, independent of the input array's order.
- Computes a `proposalFingerprint` (sha256) per item and a
  `queueFingerprint` (sha256) for the whole queue, both **excluding**
  timestamps (`retrievedAt`, `generatedAt`, etc.) so they only change
  when the substantive proposal content changes.
- Is deterministic: two independent runs against the same inputs produce
  byte-identical output except for the informational `generatedAt`
  field. Verified in `test-output/determinism-comparison.md`.

### Why this package excludes your inputs

`archeomaps_data_unesco_enriched_corrected.json` (3.6 MB) and
`unesco_likely_existing_records.json` (639 KB) are your own pipeline
outputs from earlier phases, not artifacts of this tool — re-shipping
copies of them here would risk this package silently going stale
relative to your actual authoritative checkpoint. Every script in this
package takes explicit paths to your real files instead (flags or, for
the test suite, environment variables — see "Testing" below).

## What `localStorage` contains

Curator progress (decisions only — never the dataset) is saved under a
key namespaced by both `queueVersion` and `queueFingerprint`:

```
archeomaps-curator::<queueVersion>::<first 16 chars of queueFingerprint>::decisions
archeomaps-curator::<same namespace>::lastSavedAt
```

Because the namespace includes the queue's fingerprint, progress from an
**older or different** `review_queue.json` is never silently loaded
against a newer queue — it just lives under a different key. If such
progress is detected in `localStorage`, the page shows a dismissible
warning banner naming the situation, without loading it. "Clear local
progress" (with a confirmation prompt) removes only the current queue's
namespaced keys. No analytics, no tracking, no other data is stored.

## Export / import

**Export decisions** (and the equivalent **Backup now** button) downloads
`review_decisions.json`: schema version, queue version, queue
fingerprint, an `exportedAt` timestamp, decision counts, the full list of
decisions, and the list of proposal IDs that are still unreviewed.

**Import decisions** validates the entire export contract before touching
anything: well-formed JSON, correct `schemaVersion`, matching
`queueVersion`, a well-formed and matching `queueFingerprint`, a valid
`exportedAt`, an exactly-shaped `decisionCounts` whose values match what's
recomputed from the file's own decisions, `unreviewedProposalIds` with no
duplicates and no overlap with `decisions`, every queue item accounted
for in exactly one of the two collections, and — for every individual
decision — every required field present (`proposalId`, `queueVersion`,
`proposalType`, `source`, `externalId`, `targetArcheomapsId`, `decision`,
`reviewedAt`, `evidenceVersion`, `proposalFingerprint`), each cross-checked
against the matching queue item, a legal `decision` value, a real ISO
date-time `reviewedAt`, a well-formed and matching `proposalFingerprint`
(missing, malformed, and mismatched are each independently a failure),
a real `EDIT` target with a note, no duplicate decisions for the same
proposal, and no unknown or patch/apply-shaped fields (e.g. a stray
`unescoIdNo`). **Any validation failure aborts the whole import — nothing
is partially applied.** If an import would overwrite an existing
locally-saved decision with a different value, the curator is shown a
conflict warning before it proceeds.

## Validating an exported file from the command line

```bash
cd scripts
node validate-review-decisions.js \
  --decisions=/path/to/review_decisions.json \
  --queue=/path/to/curator/review_queue.json \
  --dataset=/path/to/archeomaps_data_unesco_enriched_corrected.json \
  --outdir=/path/to/output/dir
```

Produces `review_decisions_validation.json` (machine-readable) and
`review_decisions_validation_report.md` (human-readable). This script
**only ever produces a report** — it never generates a patch, attaches a
UNESCO ID, modifies a record, adds a record, or auto-approves a
decision, and it re-verifies afterward that neither input file changed
on disk during the run.

## Why this page cannot and must not edit the GitHub dataset directly

By design, this tool has no GitHub write access, no embedded token, and
no backend service of any kind — it is pure client-side HTML/CSS/JS
plus two read-only Node scripts. That's deliberate, not a missing
feature: identity-match decisions here are curator *judgements*, not
verified facts. The governing architecture (top of this file) keeps a
decision-validation step and a separate, explicit patch-generation step
between "a human clicked Approve" and "the authoritative dataset
changed," so that a patch can be reviewed as a unit, applied
atomically, and rolled back if needed — the same discipline already
used for Phase 2/3 (proposals-before-application, SHA-verified inputs,
deterministic outputs).

## How this connects to what comes next (Phase 4.1B and beyond)

This phase stops at a validated `review_decisions.json`. It does **not**:
build a patch, attach any UNESCO ID, modify
`archeomaps_data_unesco_enriched_corrected.json`, touch the 297
candidate new-site records, process the 200 parent/serial properties, or
start Wikidata/Pleiades work. A future Phase 4.1B would read a validated
`review_decisions.json` and generate a patch proposal (in the same
proposal → review → apply pattern as Phases 2–3) covering only the
`APPROVE`/`EDIT` decisions — `REJECT`, `NEEDS_RESEARCH`, and `DEFER`
carry no data change by definition. The generic `ReviewDecision` contract
and the `proposalType` enum in `schemas/review-queue.schema.json` are
already shaped to carry non-identity proposal types (taxonomy additions,
chronology conflicts, source additions, new records, parent/component
relationships, image proposals) through the same page in a later phase,
even though only `IDENTITY_MATCH` is populated and operational today.

## Completeness formula

Defined once, in `curator/curator-core.js` (`COMPLETENESS_CONFIG` +
`computeCompleteness`), and used identically by the queue generator, the
validator, and the browser — there is exactly one implementation, so
Node and browser results can never drift apart.

| Dimension | Weight | Basis |
|---|---:|---|
| Identity / name | 5% | `n` present |
| Coordinates | 5% | `lat`/`lon` present |
| Canonical type | 20% | `canonicalType` present; if absent, distinguishes `workflow.type.state = research` ("researched, insufficient evidence") from anything else ("not yet researched") |
| Chronology (year) | 15% | `year` present |
| Sources | 10% | `source` present |
| Description | 20% | `text` present and not *only* a bare URL |
| Tags / functions | 10% | `tags` or `function` non-empty |
| Culture / political entity | 10% | `culture` present (no separate political-entity field exists in this dataset — see below) |
| Images | 5% | `img` present |
| Historical phases | 0% | **always `unavailable`** — this field does not exist anywhere in the current dataset |

The result is always marked `provisional: true`. Full-dataset field
survey (2,103 records) confirmed the following fields the Phase 4.1A
spec anticipated **do not exist** in
`archeomaps_data_unesco_enriched_corrected.json`: `reliability`, `phases`,
a plural `politicalEntities` array, a plural `cultures` array (only a
singular `culture` scalar exists), and a plural `sources` array (only a
singular `source` scalar exists). Rather than silently scoring these as
0, the formula excludes truly-nonexistent dimensions from the
denominator (currently just `phases`) and documents this in a tooltip in
the UI ("Completeness breakdown" → provisional-reason note) — see
`docs/manual-visual-check-report.md` for a screenshot.

## Testing

```bash
node tests/test-curator-core.js      # unit tests, pure logic, no browser

# Generator determinism/fail-fast tests need explicit paths to your inputs
# (this package ships no copies of them — see above). Either form works:
node tests/test-generate-queue.js \
  --dataset=/path/to/archeomaps_data_unesco_enriched_corrected.json \
  --proposals=/path/to/unesco_likely_existing_records.json
# or:
ARCHEOMAPS_DATASET_PATH=/path/to/archeomaps_data_unesco_enriched_corrected.json \
ARCHEOMAPS_PROPOSALS_PATH=/path/to/unesco_likely_existing_records.json \
  node tests/test-generate-queue.js

node tests/run-checks.js             # real-browser interaction checks (Playwright/Chromium)

# Verifies the rare free-typed EDIT lazy-dataset-fetch + sha256 integrity
# check (both the success path and the "tampered file at the configured
# path is rejected, never silently used" path). Also needs your dataset:
node tests/test-lazy-dataset-fetch.js --dataset=/path/to/archeomaps_data_unesco_enriched_corrected.json
```

Running `test-generate-queue.js` with neither flags, env vars, nor a
manually-placed copy in `scripts/` exits with a clear explanation of how
to supply the fixtures, rather than a bare file-not-found error.

See `test-output/` for the machine-readable results of each run and
`docs/manual-visual-check-report.md` for the screenshot-backed visual
check (desktop + mobile + accessibility spot-checks).

## v1.1 changes (this revision)

An independent review found one validation-contract hole and two
packaging/documentation issues in the initial delivery. Summary (see the
chat response accompanying this package for the full before/after):

1. **`validateDecision()` now enforces the complete ReviewDecision
   contract**, not just `proposalId` + `decision` + EDIT-specific fields.
   Every field `review-decisions.schema.json` marks required is now
   checked for presence, and six of those fields (`queueVersion`,
   `proposalType`, `source`, `externalId`, `targetArcheomapsId`,
   `evidenceVersion`) are cross-checked against the matching queue item.
   `proposalFingerprint` is now unconditionally required, format-checked
   (64-char lowercase sha256 hex), and match-checked as three independent
   failure modes — a missing fingerprint can no longer slip through.
   `reviewedAt` must be a real ISO 8601 date-time. Unknown properties on a
   decision object are now rejected by an explicit whitelist, in addition
   to (not instead of) the existing patch-shaped-field check.
2. **`validateImportPayload()` now validates the entire export contract**:
   `schemaVersion`, `queueFingerprint` format + match, `exportedAt`,
   `decisionCounts` shape (exact keys, non-negative integers) and value
   (declared vs. recomputed), `unreviewedProposalIds` shape/dedup/queue
   membership, no proposal in both `decisions` and
   `unreviewedProposalIds`, and every queue item accounted for exactly
   once across the two. This is the same function the browser calls on
   import, so browser and command-line behavior cannot diverge.
3. **`validate-review-decisions.js` now delegates to
   `CuratorCore.validateImportPayload()`** as the sole source of truth for
   pass/fail; its report table is presentational detail on top of that,
   not a separate set of checks that could drift from the browser.
4. **A confirmed, independently-reproduced UI bug is fixed**: the
   malformed-import error banner previously persisted indefinitely,
   surviving even an unrelated "Clear local progress" action. It's now
   cleared on "Clear local progress" and has its own dismiss button.
5. **`tests/test-generate-queue.js` no longer assumes local copies of your
   inputs exist inside `scripts/`** — see "Testing" above.
6. **The free-typed EDIT dataset path is now self-verifying**: only a
   directory is configured in `curator.js`; the filename is read from
   `review_queue.json`'s own recorded `inputs.dataset.path`, and the
   fetched file's sha256 is checked against `inputs.dataset.sha256`
   before use. A mismatch is a visible error, never a silent substitution.
   Verified end-to-end in a real browser by `tests/test-lazy-dataset-fetch.js`
   (both the correct-file and tampered-file cases).
7. **Hardened against a real DOM race** found while building the check in
   (6): typing a free-text EDIT id now triggers a re-render on blur so the
   preview/error is actually visible (previously the snapshot was fetched
   and cached silently with no visible feedback). That re-render is
   deferred one tick and guarded by a render-generation counter
   (`state.renderGeneration`) so a superseded async snapshot fetch can
   never mutate DOM a newer render has already rebuilt — this was
   reproducible as a genuine "node is no longer a child" error before the
   fix, not merely a testing artifact.

`curator/schemas/review-decisions.schema.json` itself was already correct
in the prior delivery — this revision is about the runtime code actually
enforcing what that schema already declared.

## Known limitations

- UNESCO inscription year and criteria codes are **not** available in
  the Phase 4.0 proposal data for these 62 candidates (that metadata is
  only populated after an identity is confirmed, per the Phase 3.x
  enrichment pipeline). The UI states this explicitly rather than
  fabricating or omitting the field silently.
- The completeness formula's "not yet researched" status cannot always
  be distinguished from "researched and found genuinely empty" — only
  the canonical-type dimension has that signal in the current schema
  (via `workflow.type.state`). This is disclosed in the UI, not hidden.
- No full screen-reader audit has been done (see
  `docs/manual-visual-check-report.md`).
