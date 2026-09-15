# Geometry Layer System v0.1 — Phase 4 Layer Catalogue

Status: Proposed implementation — pending curator review

## Purpose

Phase 4 removes source-specific registrations from `index.html`. Deployable Geometry layers are declared in `layers/layer-catalog.json`, validated by `scripts/layer-catalog-core.js`, and registered through one generic map-runtime adapter. Adding another validity-based wall, road, route, landscape, or political boundary no longer requires editing the map's JavaScript.

The catalogue is a runtime/deployment manifest. It does not replace `GEOMETRY_DATASET_REGISTRY.md`, `GEOMETRY_SCHEMA.md`, or the import validation report.

## Catalogue entry

Each entry supplies:

- stable layer ID and user-facing label;
- existing map category and Leaflet pane;
- temporal mode and §59 lifecycle status;
- governing Dataset ID;
- safe repository-local canonical GeoJSON path;
- exact SHA-256 of the deployed canonical bytes;
- **`featureIds`** — every canonical Geometry feature ID (a `geometry-`
  hyphen-slug) this entry's file governs (added in Phase 5; see
  `GEOMETRY_PHASE5_SITE_LINKING.md` §2). Required, non-empty, unique
  within the entry and across the whole catalogue. This is what lets a
  Site's `relationships[]` `targetId` resolve to exactly one layer
  without downloading every registered layer, and it is the *only*
  Geometry-ID lookup registry — nothing hard-codes a Geometry-ID → layer
  mapping in `index.html`.
- optional overall date bounds;
- visible attribution;
- declarative Leaflet path style.

After a layer's canonical GeoJSON is fetched and its SHA-256 verified,
every declared `featureId` must exist in the file and every canonical
feature in the file must be declared in `featureIds` — a partial match,
a missing declaration, or a duplicate canonical ID fails the layer load
exactly like a dataset-ID mismatch always has (`buildLoadedFeatureIndex`
in `scripts/geometry-relationship-core.js`, called from
`registerCatalogLayer.load()`).

Only `active` and `proposed` Geometry resources are deployable through the catalogue. Other §59 states remain valid registry history but are rejected from the runtime catalogue.

Phase 4 intentionally supports `validity` catalogue entries only. `snapshot` packages need a separate manifest shape associating several dated files and hashes; that mechanism is deferred rather than guessed into this contract. Embedded demo layers remain in `index.html` because they are application demonstrations, not deployable datasets.

## Runtime sequence

1. Fetch and validate `layers/layer-catalog.json`.
2. Register each valid entry before URL/share state is restored.
3. Leave every real layer disabled and unloaded by default.
4. When enabled, fetch its canonical GeoJSON bytes.
5. Verify the bytes against the catalogue SHA-256 before parsing or rendering.
6. Require a FeatureCollection whose every feature references the catalogue entry's Dataset ID.
7. Pass its dated features into the existing `validity` renderer.

An invalid catalogue does not register a partial subset. A catalogue failure leaves the site map usable but raises the existing visible load-error overlay. A layer-file failure switches that layer back off and uses the same error surface.

## Adding the next layer

The import process remains unchanged: a source adapter creates mapped GeoJSON and a Dataset record, then the Phase 2 gate emits canonical GeoJSON and its SHA-256 report. Deployment adds that canonical file plus one catalogue entry containing the report's exact hash. Scribe is not involved.
