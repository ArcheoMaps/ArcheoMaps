# Geometry Importer and Validation Gate

Version: 0.1
Status: Phase 2 implementation
Date: 2026-09-14

## Purpose

`scripts/geometry-importer.js` is the fail-closed ingestion gate between source-specific mapping and canonical ArcheoMaps Geometry packages. It accepts already-mapped GeoJSON plus one dataset-registry record, validates both, deterministically orders accepted features, and quarantines invalid features without silently dropping them.

It does not decide historical truth, infer missing metadata, repair malformed geometry, fetch remote data, or apply Site relationships. Source-specific adapters remain responsible for mapping a provider's fields into the Phase 1 contract.

## Usage

```bash
node scripts/geometry-importer.js \
  --input tests/fixtures/geometry-valid.geojson \
  --dataset tests/fixtures/geometry-valid.dataset.json \
  --output-dir test-output/geometry-valid
```

Exit codes:

- `0`: package passed; no quarantined features.
- `1`: package-level failure; canonical output not produced.
- `2`: package processed but one or more features were quarantined.

## Outputs

- `canonical.geojson`: accepted features only, deterministically sorted and serialized. Not produced after a package-level failure.
- `quarantine.json`: complete rejected features and their issue lists.
- `validation-report.json`: machine-readable counts, error codes, status, and canonical SHA-256.
- `validation-report.md`: human-readable audit report.

## Validation coverage

- RFC 7946 FeatureCollection/Feature structure;
- supported geometry types;
- finite WGS84 longitude/latitude ranges;
- non-empty coordinates;
- minimum LineString and polygon-ring shape;
- closed polygon rings;
- canonical hyphen-slug Geometry and Dataset IDs;
- duplicate feature IDs;
- canonical geometry roles, feature classes, temporal modes, confidence, and registry states;
- feature metadata geometry type matching the actual geometry;
- dataset reference matching;
- chronology bounds and order;
- numeric non-negative uncertainty;
- licence and source requirements;
- declared feature count and geometry types matching observed input.

The validator intentionally does not attempt computational-geometry repair or full self-intersection detection in v0.1. Those require a reviewed geospatial dependency and belong in a later hardening pass; suspicious source geometry remains subject to source-specific inspection before activation.

## Determinism and quarantine

Canonical features are sorted by stable Geometry ID and object keys are serialized in stable lexical order. Re-running the same mapped package therefore produces the same canonical bytes and SHA-256.

Feature-level validation failures preserve the entire original Feature in `quarantine.json`. Package-level contradictions—such as declared feature counts or geometry types not matching the supplied collection—fail the run and prevent canonical output.

The default `featureClass` → `geometryRole` mapping is advisory: an evidence-supported override produces a `ROLE_OVERRIDE` notice but does not quarantine the feature.

