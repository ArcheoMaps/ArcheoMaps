# Geometry Layer System v0.1 — Phase 3 Pilot

Status: Proposed pilot — pending curator review  
Pilot: Hadrian's Wall from OpenHistoricalMap relation `2692717`

## Purpose

This phase proves the complete source-to-map path with one real linear feature. It does not make OpenHistoricalMap authoritative, activate the feature in the registry, or involve Scribe. The imported feature and dataset remain `proposed` until curator review.

## Reproducible import

Retrieve the pinned relation through the OpenHistoricalMap Nominatim lookup API:

```bash
curl --get 'https://nominatim.openhistoricalmap.org/lookup' \
  --data 'osm_ids=R2692717' \
  --data 'format=jsonv2' \
  --data 'polygon_geojson=1' \
  --data 'extratags=1' \
  --data 'namedetails=1' \
  --output ohm-hadrians-wall.json
```

Map the provider response, then pass that mapped package through the Phase 2 gate:

```bash
node scripts/adapters/openhistoricalmap-hadrians-wall.js \
  --input ohm-hadrians-wall.json \
  --output-dir imports/openhistoricalmap/hadrians-wall

node scripts/geometry-importer.js \
  --input imports/openhistoricalmap/hadrians-wall/mapped.geojson \
  --dataset imports/openhistoricalmap/hadrians-wall/dataset.json \
  --output-dir layers/networks/hadrians-wall
```

The adapter is deliberately pinned to relation `2692717`, requires a `MultiLineString`, and requires numeric `start_date` and `end_date`. A changed or incomplete provider response fails closed. It does not guess missing dates, geometry type, identity, licence, or precision.

## Map behaviour

`index.html` registers the canonical output as a lazy `validity` layer. Nothing is downloaded until the user enables **Hadrian's Wall** in Layers. The feature is visible when the timeline's map year falls from 122 through 400 CE. It is off by default and labelled as a proposed pilot import.

## Provenance and limitations

- Source geometry: OpenHistoricalMap relation `2692717`.
- Source identity retained as `sourceFeatureId: "OHM relation 2692717"`.
- Source coordinates are retained unchanged.
- OpenHistoricalMap's project data is published under CC0; project attribution is retained voluntarily.
- The source provides no uniform surveyed accuracy for this combined line. `uncertaintyMetres` and nominal resolution therefore remain `null`, while `spatialConfidence` is conservatively `medium`.
- The 122–400 range represents the source record's stated historical dates, not proof that every mapped segment existed unchanged throughout that entire interval.

The more detailed WallGIS dataset remains a candidate for a later curator-reviewed replacement or corroborating source; it is not silently combined with this pilot.
