# Geometry Layer System v0.1 — Phase 5: Site → Geometry Relationship Resolution

Status: Proposed implementation — pending curator review
Scope: map-runtime only. Scribe is not involved in Phase 5.

## 1. Purpose

Phase 5 makes a Site's `relationships[]` (TAXONOMY.md §63) able to drive the
map: when a Site with an eligible `targetKind: "geometry"` relationship is
selected, the map resolves the target through the Phase 4 layer catalogue,
lazy-loads it if needed, temporarily reveals it, highlights only the
targeted feature, and shows the relationship's status in the Site record.
Nothing here changes the approved Phase 1–4 contracts, the taxonomy, the
importer, or the Hadrian's Wall pilot data — Phase 5 only *reads* them.

## 2. Geometry-ID resolution through `featureIds`

Each deployable `layers/layer-catalog.json` entry now declares a
`featureIds` array: every canonical Geometry feature ID (a `geometry-`
hyphen-slug, per GEOMETRY_SCHEMA.md §3) that entry's file governs.

```json
{
  "id": "hadrians-wall",
  "...": "...",
  "featureIds": ["geometry-hadrians-wall-openhistoricalmap-main-line"]
}
```

`scripts/layer-catalog-core.js` validates this field (non-empty, valid
`geometry-` slugs, unique within an entry, unique across the whole
catalogue) and exposes `buildFeatureIndex(catalog)`, which builds the
**single** Geometry-ID → catalogue-entry lookup the whole runtime uses.
There is no second, independently maintained Geometry registry, and no
Geometry-ID → layer mapping is hard-coded in `index.html`.

After a layer's canonical GeoJSON is fetched and its SHA-256 verified,
`scripts/geometry-relationship-core.js`'s `buildLoadedFeatureIndex(entry,
collection)` performs one fail-closed cross-check: every declared
`featureId` must exist in the file, every canonical feature must be
declared, every feature must match the entry's `datasetId`, and no
canonical ID may repeat. Any mismatch throws — a layer never partially
loads, and `index.html`'s `registerCatalogLayer.load()` calls this
directly (replacing the old dataset-only inline check) rather than
duplicating any of these rules itself.

## 3. Manual vs. selection-driven layer state

The old single `layer.enabled` boolean is retired. Every registered layer
now carries:

- `manualEnabled` — set only by the Layers-panel checkbox, share-URL
  restoration (`lyr=`/`lyrOp=`), and Reset.
- `selectionEnabled` — set only by the Phase 5 selection controller.
- effective visibility = `manualEnabled OR selectionEnabled`, computed by
  the one shared predicate `effectiveEnabled()`
  (`geometry-relationship-core.js`) / `isLayerEffectivelyEnabled()`
  (`index.html`) — every consumer (map add/remove, the Layers panel, the
  Legend, the reconstruction readout, the share URL) reads through it
  rather than re-deriving it, so the two concerns cannot silently drift
  apart.

`setLayerEnabled(id, on)` is the manual path (unchanged call sites:
checkbox, `applyStateFromUrl`, Reset) and only ever touches
`manualEnabled`. `setLayerSelectionState(id, on)` is its selection-driven
counterpart and only ever touches `selectionEnabled`; it does no loading
or error handling of its own; that is `ensureLayerLoadedPromise(layer)`,
shared by both paths so a layer already loading/loaded for one concern is
never double-fetched for the other.

A manually-disabled layer that is still required by the current
selection stays effectively visible (`applyLayerEffectiveVisibility`
checks OR, not the flag that just changed) — but its checkbox reflects
`manualEnabled` only, and the Layers panel renders a "Temporarily shown"
badge in that case, so a person is never left wondering why an unchecked
layer is still on the map. Share URLs (`buildShareUrl`) and Reset act on
`manualEnabled` exclusively; selection-driven state is never written to a
shared link and is fully cleared by Reset.

## 4. Relationship eligibility

`collectSiteGeometryRelationships(site, featureIndex)`
(`geometry-relationship-core.js`) classifies every `relationships[]` entry:

| `review.state`   | Automatic reveal |
| ---------------- | ----------------- |
| `accepted`       | Yes |
| `proposed`       | Yes, visibly labelled proposed |
| `rejected`       | Never |
| `disputed`       | No |
| `needs-research` | No |
| missing/invalid  | No — reported as a diagnostic |

A non-`geometry` `targetKind` is silently out of scope (not an error). A
structurally broken entry, an invalid or unresolved `targetId`, or an
ineligible `review.state` never throws and never crashes Site rendering —
each produces a diagnostic instead (§9). `confidence` is never treated as
a substitute for `review.state`.

The exact §63 relationship schema is reused unchanged — no
`geometryRelationship`, `geometryLink`, second vocabulary, or underscored
aliases were introduced, and `geometryRefs[]` keeps its existing §54
display/boundary role untouched.

## 5. Selection lifecycle

`selectSite(s)` is the one function every selection path already funnels
through (marker click, Site List, Nearby Sites, Random, search, shared
URL) — it now also calls `geometrySelectionController.selectSite(s)`
(`scripts/geometry-selection-controller.js`), so no per-click-handler
duplication was needed.

The controller:

1. Increments a generation token and clears the previous selection's
   selection-driven layer state and highlights.
2. Resolves eligible relationships through the catalogue.
3. Reports every ineligible/malformed/unresolved relationship as a
   diagnostic (§9) without throwing.
4. Lazy-loads each required layer through `ensureLayerLoadedPromise`.
5. On success, sets `selectionEnabled`, and highlights the feature only if
   the current map year falls inside its valid interval (§6).
6. On failure, rolls back `selectionEnabled`, reports a diagnostic, and
   surfaces the existing Phase 3/4 visible load-error UI — the Site record
   stays open and unrelated selection-driven layers are untouched.
7. Ignores any load that resolves after a newer selection has started
   (§8) — a generation-token check, not a heuristic.

Closing the Site record and clicking Reset both call
`geometrySelectionController.clearSelection()`; Reset also clears manual
state via the existing `setLayerEnabled(id, false)` path. Re-selecting the
same Site is idempotent. A URL-restored Site selection
(`applyStateFromUrl`'s `sid=`) reconstructs the same selection-driven
state through the same `selectSite()` call — never persisted as manual
state itself.

## 6. Temporal behaviour

The timeline stays authoritative. `updateValidityLayer` filters a layer's
own features by the active map year exactly as before Phase 5; a
selection-driven highlight is layered on top of that (via
`layer._highlightedFeatureIds`, a live style hook — never a mutation of
the canonical GeoJSON or its properties) and can only ever apply to a
feature currently rendered.

`applyFilters()`'s single "map year changed" branch now also calls
`geometrySelectionController.refreshTemporal()`, which re-checks the
current selection's already-loaded features against the new year: moving
into a feature's `validFrom`–`validTo` interval reveals/highlights it
without re-selecting the Site; moving out removes the highlight and marks
it "Outside current map year" in the drawer. Open (`null`) bounds and
inclusive boundary years are handled by the same `isWithinValidity()` used
by the Node test suite.

## 7. Feature-specific highlighting

`layer._featureIndex` (built once per layer load, from the verified
canonical GeoJSON, keyed by each feature's own `properties.id` — never
array position) gives `getLoadedGeometryFeature(layerId, featureId)` a
deterministic Geometry-ID → GeoJSON-feature lookup.
`layer._highlightedFeatureIds` (a `Set`) tracks which loaded features are
currently selection-highlighted; `updateValidityLayer`'s per-feature style
function checks membership in that set and applies a bright gold/high-
weight temporary style (`GEOMETRY_HIGHLIGHT_STYLE`) on top of the layer's
normal style — restoring normal styling is just calling `layer.update()`
again (no re-fetch, no mutation of the loaded file).

## 8. Site-record display

`openDrawer()` renders a `#drawerLinkedGeometry` container via
`renderLinkedGeometryInto()`, populated by re-running
`collectSiteGeometryRelationships()` against the *same* catalogue index
the map uses (so the drawer can never disagree with what the map actually
reveals) and cross-referencing the live selection controller's current
runtime state for eligible relationships. Every relationship — including
rejected/disputed/needs-research/malformed/unresolved ones — is shown,
labelled with one of: `Displayed`, `Loading`, `Outside current map year`,
`Proposed relationship`, `Review required`, `Linked geometry unavailable`,
`Load failed`, `Rejected`, `Malformed relationship`.

Display-name resolution (`resolveGeometryDisplayName`) follows the exact
fallback chain from the spec: the Geometry feature's own `name` override,
then a runtime Entity registry's `preferredName` (not yet built in this
codebase, so this branch is inert but implemented and unit-tested for
when one exists), then the catalogue layer's `label`, then the raw
Geometry ID. The section reuses the drawer's existing
`.drawer-section-label`/`.detail-row`/`.detail-note` classes rather than
introducing new CSS, so it inherits the drawer's existing mobile layout
behaviour without any separate responsive work.

The selection controller's `onStateChange` callback repaints only this
container, and only when the drawer is currently showing the Site those
states belong to — a stale/earlier selection's late state change can
never repaint a drawer that has moved on (verified directly in
`test-geometry-phase5-selection-controller.js`'s stale-request tests, and
indirectly by the browser suite's sequential-selection scenarios).

## 9. Failure handling, stale requests, and diagnostics

Every non-eligible relationship outcome (`malformed`, `invalid-target-id`,
`unresolved`, `ineligible`) is reported through `reportGeometryDiagnostic`,
logged to `console.warn` and collected in
`window.ArcheoGeometryDiagnostics` (mirroring the existing
`window.ArcheoRuntimeDiagnostics` convention). Only genuine data/runtime
failures (`load-failed`, `feature-index-mismatch`) reuse the shared Phase
3/4 visible load-error overlay — an ineligible or malformed relationship
is expected and benign, and surfaces in the Site drawer instead, never as
a blocking error.

Stale-request protection is a single incrementing generation token per
selection: any load or timeline re-evaluation that completes after a
newer selection has started is a no-op. This is unit-tested directly
(`§8 stale-request protection` and the failed-then-reselected test in
`test-geometry-phase5-selection-controller.js`) with controllable,
manually-resolved promises rather than timing-based flakiness.

## 10. Why no live Hadrian's Wall Site relationship was added

The attached Phase 4 package does not include `archeomaps_data.json`
(the production Site dataset), and no Hadrian's Wall Site record was
found in the project's TAXONOMY/audit material inspected for this phase.
Per the brief's production-data constraint, Phase 5 does not fabricate a
relationship, does not attach the Geometry to an unrelated Site (the
Great Wall or otherwise), and does not create or edit any production
Site record. All Phase 5 behaviour is exercised through the synthetic
fixtures in `tests/fixtures/geometry-phase5/` (Node) and
`tests/browser/synthetic-archeomaps_data.json` (browser), never through
production data.

## 11. Activating a future curator-approved relationship

Once a curator adds a real `relationships[]` entry of the shape shown at
the top of the Phase 5 brief to a real Site record in
`archeomaps_data.json` — `targetKind: "geometry"`, a valid
`geometry-hadrians-wall-openhistoricalmap-main-line` (or any other
catalogued) `targetId`, and a `review.state` of `accepted` or
`proposed` — the runtime built in this phase activates it automatically.
No further map code is required: `collectSiteGeometryRelationships` reads
`site.relationships[]` directly from the loaded dataset, and every other
step (catalogue resolution, lazy load, reveal, highlight, temporal
gating, drawer display) is already wired to run for any Site the data
describes this way.

## 12. Tests

See the delivered test transcript for exact counts. In summary:

- `tests/test-geometry-phase5-relationships.js` — catalogue/feature-index
  resolution, relationship eligibility, temporal validity, display-name
  resolution (Node, pure-logic, no DOM).
- `tests/test-geometry-phase5-selection-controller.js` — state lifecycle
  (manual/selection/effective visibility, clearing, idempotency), stale-
  request protection, async load failure/rollback, temporal refresh
  (Node, controllable-promise harness, no DOM).
- `tests/browser/run-phase5-browser-tests.js` — real Chromium/Leaflet
  interaction tests (reveal/highlight, manual-vs-selection independence,
  Linked geometry rendering, temporal reveal/hide, mobile layout, no
  unhandled page errors). This sandbox's outbound-network policy returns
  403 for the CDN hosts (`cdnjs.cloudflare.com`, `unpkg.com`) the live
  `index.html` loads Leaflet/Leaflet.markercluster/topojson from
  (confirmed with `curl` before writing the runner); rather than
  substituting static-source assertions for real interaction testing,
  the runner serves an unmodified copy of `index.html` with only those
  CDN references pointed at same-version packages vendored locally from
  the npm registry (an allowed host) and drives it with a real, pre-
  installed headless Chromium. The **shipped** `index.html` in this
  package is untouched by this — only the runner's own scratch copy is
  patched, solely to route around this sandbox's network policy.
