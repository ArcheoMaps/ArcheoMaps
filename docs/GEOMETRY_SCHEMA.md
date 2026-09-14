# ArcheoMaps Geometry Schema

Version: 0.1
Status: Curator-approved Phase 1 specification
Date: 2026-09-14

## 1. Purpose

This schema governs independent geographic features used by ArcheoMaps, including walls, routes, reconstructed coastlines, natural extents, and dated political boundaries. These resources exist separately from Site records and are linked to Sites through `relationships[]` under `TAXONOMY.md` §63.

Large geometry MUST NOT be duplicated inside individual Site records. `geometryRefs[]` retains its existing §54 role for property boundaries and overlay-display behaviour; it is not a substitute for a scholarly Site-to-Geometry relationship.

## 2. Canonical feature shape

```json
{
  "id": "geometry-hadrians-wall-main-line",
  "entityId": "entity-hadrians-wall",
  "geometryRole": "linear-feature",
  "featureClass": "defensive-wall",
  "geometryType": "MultiLineString",
  "validFrom": 122,
  "validTo": null,
  "temporalMode": "validity",
  "reconstructionStatus": "surveyed",
  "spatialConfidence": "high",
  "uncertaintyMetres": 25,
  "datasetId": "dataset-hadrians-wall-example",
  "sourceFeatureId": "original-123",
  "sourceIds": ["source-example"],
  "licence": "CC BY 4.0",
  "status": "active"
}
```

The GeoJSON geometry itself is stored in the corresponding canonical GeoJSON Feature. The fields above form its ArcheoMaps metadata contract.

## 3. Field rules

- `id`: globally stable hyphen-slug identifier beginning `geometry-`.
- `geometryRole`: broad role drawn from the existing §54 vocabulary.
- `featureClass`: controlled refinement beneath `geometryRole`.
- `geometryType`: actual GeoJSON geometry type.
- `temporalMode`: `static`, `validity`, or `snapshot`.
- `datasetId`: ID of the governing dataset record.
- `sourceIds[]`: evidence/source references; MUST be non-empty except while `status` is `proposed` or `quarantined`.
- `licence`: reuse conditions using British spelling.
- `status`: registry lifecycle state.
- `entityId`: linked independently identifiable entity, where applicable.
- `validFrom`, `validTo`: inclusive validity interval; either MAY be `null` for an open interval.
- `reconstructionStatus`: concise source-supported reconstruction description.
- `spatialConfidence`: `high`, `medium`, or `low`.
- `uncertaintyMetres`: non-negative numeric estimate of feature-level spatial uncertainty.
- `sourceFeatureId`: original identifier in the source dataset.

`uncertaintyMetres` and `spatialConfidence` answer different questions. The former estimates the magnitude of spatial error; the latter records confidence in the source or reconstruction. Neither substitutes for the other.

## 4. Geometry roles and feature classes

The broad `geometryRole` vocabulary is reused unchanged from §54:

```text
property-boundary
buffer-zone
natural-feature
linear-feature
approximate-extent
```

Initial `featureClass` defaults:

```text
linear-feature
  defensive-wall
  road
  trade-route
  pilgrimage-route
  maritime-route
  historical-coastline

natural-feature
  ice-extent
  landscape-extent

approximate-extent
  political-boundary
```

This mapping is a default, not an absolute rule. Feature-level evidence MAY override it. For example, a precisely surveyed or treaty-documented `political-boundary` MAY use `property-boundary` rather than `approximate-extent` where the cited source supports that precision.

## 5. Temporal behaviour

- `static`: not filtered by the active historical date.
- `validity`: visible when the active date intersects `validFrom`–`validTo`.
- `snapshot`: one reconstruction in a dated sequence.

These values match the existing map runtime layer modes.

## 6. Registry lifecycle

`status` MUST use the exhaustive `TAXONOMY.md` §59 vocabulary: `active`, `proposed`, `deprecated`, `rejected`, or `quarantined`. Imported valid features awaiting review use `proposed`; validation or provenance failures use `quarantined`. `pending` is invalid.

Geometry features use the §59 lifecycle because they are independently registered resources. Scholarly Site-to-Geometry assertions use §63 `review.state` instead.

## 7. IDs and linking

All ArcheoMaps-owned IDs use hyphen slugs. Colon-namespaced IDs are invalid. Links MUST resolve to existing records or remain quarantined.

For v0.1, Site-to-Geometry relationships set `reciprocal: false` because Geometry resources do not yet define their own `relationships[]` array. This is a scoped implementation constraint, not a permanent architectural claim; enabling reciprocal links also requires an explicit extension of §63.2's fixed inverse-type table.

