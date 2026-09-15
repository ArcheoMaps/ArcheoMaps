# Geometry Layer System v0.1 — Phase 5 delivery manifest

Baseline: the attached, curator-accepted `Geometry_Layer_System_v0.1_Phase4_Layer_Catalog.zip`.
This package is that baseline plus Phase 5's Site→Geometry relationship
runtime. No Phase 1–4 vocabulary, ID grammar, provenance, geometry, licence,
adapter, importer, or lifecycle semantics were changed; no contradiction
requiring a stop-and-report was found.

## New files (Phase 5)

| File | Purpose |
| --- | --- |
| `scripts/geometry-relationship-core.js` | Pure, DOM-free logic: Geometry feature-index building/verification, relationship eligibility classification, temporal validity, display-name resolution. Node-testable directly; loaded by `index.html` as `window.ArcheoGeometryRelationships`. |
| `scripts/geometry-selection-controller.js` | Pure selection-lifecycle orchestration (generation tokens, stale-load rejection, load/error rollback, temporal refresh) behind an injectable adapter — Node-testable with controllable promises, with no Leaflet/DOM dependency. Loaded as `window.ArcheoGeometrySelectionController`. |
| `docs/GEOMETRY_PHASE5_SITE_LINKING.md` | Phase 5 design/behaviour documentation (required deliverable, spec §12). |
| `tests/test-geometry-phase5-relationships.js` | Node unit tests for catalogue/feature-index resolution, relationship eligibility, temporal validity, display-name resolution. |
| `tests/test-geometry-phase5-selection-controller.js` | Node unit tests for state lifecycle, stale-request protection, async load failure/rollback, temporal refresh. |
| `tests/fixtures/geometry-phase5/{sites.json,catalog.json,second-line.geojson}` | Synthetic Site/catalogue fixtures (spec §10) — accepted/proposed/rejected/disputed/needs-research/malformed/unresolved/unlinked/multi-relationship cases. Never touches production data. |
| `tests/browser/run-phase5-browser-tests.js` | Real headless-Chromium (Playwright) interaction test runner. |
| `tests/browser/synthetic-archeomaps_data.json` | Synthetic Site records (raw production shape) used only by the browser runner. |
| `PHASE5_MANIFEST.md` | This file. |

## Changed files

| File | Change |
| --- | --- |
| `index.html` | Added the two new `<script>` tags. `registerLayer()` now defaults `manualEnabled`/`selectionEnabled` instead of `enabled`. Added `isLayerEffectivelyEnabled()`, `applyLayerEffectiveVisibility()`, `ensureLayerLoadedPromise()`. `registerCatalogLayer.load()` now builds/verifies the loaded feature index via `buildLoadedFeatureIndex` instead of an inline dataset-only check. `loadLayerCatalog()` now also builds `catalogFeatureIndex`. `updateValidityLayer()` now supports per-feature highlight styling (`GEOMETRY_HIGHLIGHT_STYLE`, `layer._highlightedFeatureIds`). `updateTemporalLayers`, `setLayerOpacity`, `updateReconstructionReadout`, `renderLegend`, `buildShareUrl` now read effective/manual visibility instead of the retired `enabled` flag. `setLayerEnabled` is now manual-only and rolls back `manualEnabled` on failure; new `setLayerSelectionState` is its selection-driven counterpart. `renderLayersPanel` checkbox reflects `manualEnabled` only and adds a "Temporarily shown" badge. The Reset handler and `drawerClose` handler now also clear selection-driven state. `selectSite()` now calls the selection controller. `applyFilters()`'s map-year-change branch now also calls `refreshTemporal()`. `openDrawer()` renders a new `#drawerLinkedGeometry` container via new functions `renderLinkedGeometryContent/Into`, `refreshLinkedGeometrySection`, `geometryRuntimeStateLabel`. New Phase 5 wiring block instantiates `geometrySelectionController` with DOM/Leaflet adapter functions (`reportGeometryDiagnostic`, `getLoadedGeometryFeature`, `highlightGeometryFeature`, `clearGeometryFeatureHighlight`). `window.ArcheoTestHooks` extended with Phase 5 introspection. |
| `scripts/layer-catalog-core.js` | Added `featureIds` validation to `validateEntry` (non-empty, valid `geometry-` slugs, unique within entry) and cross-entry uniqueness in `validateCatalog`. Added `isGeometryFeatureId()` and `buildFeatureIndex()`, exported alongside the existing API. |
| `layers/layer-catalog.json` | Added `"featureIds": ["geometry-hadrians-wall-openhistoricalmap-main-line"]` to the Hadrian's Wall entry. No other field changed. |
| `docs/GEOMETRY_PHASE4_LAYER_CATALOG.md` | Documented the new `featureIds` field and the post-SHA-256 feature-index cross-check, per spec instruction to update this doc "only where required." |
| `tests/test-geometry-phase3-pilot.js` | One regex assertion (`/layer\.enabled = false/`) updated to `/layer\.manualEnabled = false/`, reflecting Phase 5 §2's explicit, spec-mandated rename of the manual-toggle failure-rollback field. The behavior the test guards (revert on failure, show the shared error UI, refresh the panels) is unchanged and still asserted. |

## Unchanged (carried forward from the Phase 4 baseline for completeness/testability)

`scripts/geometry-importer.js`, `scripts/adapters/openhistoricalmap-hadrians-wall.js`,
`docs/GEOMETRY_SCHEMA.md`, `docs/GEOMETRY_PHASE3_HADRIANS_WALL_PILOT.md`,
`imports/openhistoricalmap/hadrians-wall/{dataset.json,mapped.geojson}`,
`layers/networks/hadrians-wall/{canonical.geojson,validation-report.json,validation-report.md,quarantine.json}`,
`tests/{test-geometry-importer.js,test-openhistoricalmap-hadrians-wall-adapter.js,test-geometry-phase4-catalog.js,test-layer-catalog-core.js}`,
`tests/fixtures/{geometry-valid,geometry-invalid}.*`.

## Test results

- Node (`node --test tests/*.js`, all Phase 2–5 non-browser tests): **58 passed, 0 failed, 0 skipped** — see `test-output/geometry-phase2-5-node-test-transcript.txt`.
- Browser (`node tests/browser/run-phase5-browser-tests.js`, real headless Chromium via Playwright): **12 passed, 0 failed** — see `test-output/geometry-phase5-browser-test-transcript.txt`. This sandbox's egress policy blocks the CDN hosts the live page loads Leaflet/markercluster/topojson from (confirmed with `curl`, 403); the runner routes around that by serving a scratch copy of `index.html` with only those references pointed at same-version packages vendored from the npm registry (an allowed host). **The shipped `index.html` is not modified by this** — see the runner's own header comment and `docs/GEOMETRY_PHASE5_SITE_LINKING.md` §12 for the full explanation. No part of this substitutes regex/static-source assertions for real interaction testing.

## Production-data note

No Hadrian's Wall (or any other) Site record was found in the material
available for this phase, and none was created, edited, or fabricated.
See `docs/GEOMETRY_PHASE5_SITE_LINKING.md` §10–11.
