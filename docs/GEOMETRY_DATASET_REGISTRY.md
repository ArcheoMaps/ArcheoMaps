# ArcheoMaps Geometry Dataset Registry

Version: 0.1
Status: Curator-approved Phase 1 specification
Date: 2026-09-14

## 1. Purpose

This registry records dataset-level provenance for imported Geometry. It is separate from feature-level metadata in `GEOMETRY_SCHEMA.md` and entity identity in `ENTITY_REGISTRY.md`.

## 2. Canonical dataset shape

```json
{
  "id": "dataset-hadrians-wall-example",
  "name": "Hadrian's Wall alignment",
  "version": "2026-01",
  "sourceUrl": "https://example.org/hadrians-wall",
  "licence": "CC BY 4.0",
  "attribution": "Example dataset provider",
  "geometryTypes": ["LineString", "MultiLineString"],
  "geographicCoverage": "Northern England",
  "chronologicalCoverage": {"start": 122, "end": null},
  "accuracyResolution": {
    "description": "Survey-derived alignment simplified for web display",
    "nominalResolutionMetres": 10
  },
  "importedAt": "2026-09-14",
  "transformations": [
    "converted to RFC 7946",
    "coordinates normalised to WGS84",
    "simplified for overview rendering"
  ],
  "featureCount": 1,
  "status": "active"
}
```

## 3. Field rules

- `id`: stable hyphen-slug ID beginning `dataset-`.
- `name`: preferred human-readable dataset name.
- `version`: source version, release date, or reproducible version label.
- `sourceUrl`: canonical source location when one exists.
- `licence`: reuse terms, using British spelling.
- `attribution`: required credit text.
- `geometryTypes[]`: every GeoJSON geometry type actually present after normalization.
- `geographicCoverage`: concise declared or derived coverage description.
- `chronologicalCoverage`: inclusive dataset-wide interval; either bound MAY be `null`.
- `accuracyResolution.description`: human-readable qualification of source accuracy and processing.
- `accuracyResolution.nominalResolutionMetres`: non-negative numeric dataset-wide resolution where supported; MAY be `null` when the source provides no defensible number.
- `importedAt`: ISO 8601 calendar date.
- `transformations[]`: ordered, append-only normalization and processing record.
- `featureCount`: non-negative integer equal to the canonical imported feature count.
- `status`: §59 registry lifecycle value.

Dataset-wide resolution does not replace per-feature `uncertaintyMetres`; feature uncertainty can vary within one dataset.

## 4. Registry lifecycle

`status` MUST be `active`, `proposed`, `deprecated`, `rejected`, or `quarantined`. `pending` is invalid. A dataset MUST NOT become `active` until its licence, attribution, geometry types, feature count, and transformation history have been validated.

