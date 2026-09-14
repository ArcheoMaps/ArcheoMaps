# ArcheoMaps Entity Registry

Version: 0.1
Status: Curator-approved Phase 1 specification
Date: 2026-09-14

## 1. Purpose

This registry defines independently identifiable historical or geographic entities—including linear works, named routes, and eventually political entities—separately from their Geometry and from any Site that references them.

One Entity MAY reference multiple Geometry resources over time without changing identity. Multiple Sites MAY reference the same Entity without duplicating it.

## 2. Canonical entity shape

```json
{
  "id": "entity-hadrians-wall",
  "entityClass": "linear-work",
  "preferredName": "Hadrian's Wall",
  "alternateNames": [],
  "start": 122,
  "end": null,
  "geometryIds": ["geometry-hadrians-wall-main-line"],
  "sourceIds": ["source-example"],
  "status": "active"
}
```

## 3. Field rules

- `id`: globally stable hyphen-slug identifier.
- `entityClass`: controlled class maintained by this registry; v0.1 initially requires only `linear-work` for the pilot.
- `preferredName`: canonical display name.
- `alternateNames[]`: sourced alternate names; an empty array is valid.
- `start`, `end`: entity-level inclusive chronological bounds; either MAY be `null`.
- `geometryIds[]`: references to features governed by `GEOMETRY_SCHEMA.md`.
- `sourceIds[]`: evidence/source references.
- `status`: §59 registry lifecycle value.

Unlike an individual Geometry feature, an Entity is primarily an identity, naming, and date-range record, so its `sourceIds[]` MAY be empty regardless of `status`; this asymmetry is deliberate because a specific spatial claim requires stricter explicit provenance than an Entity identity.

The Entity's broad dates do not replace the feature validity interval. Different geometries MAY represent different periods or reconstructions of the same Entity.

## 4. Political-entity assertions

New sourced and dated Site associations use `politicalEntityAssertions[]`:

```json
{
  "entityId": "political-entity-roman-empire",
  "controlType": "territorial-control",
  "start": 122,
  "end": 395,
  "phaseId": "phase-site-0042-01",
  "assignmentMethod": "documented",
  "confidence": "high",
  "sourceIds": ["source-example"]
}
```

`phaseId` always points to a specific Phase instance inside that Site's own `phases[]` array, never a bare Historical Phase Type.

`assignmentMethod` is limited in v0.1 to `documented` and `temporal-spatial-intersection`:

- `documented`: directly supported by cited historical or archaeological evidence.
- `temporal-spatial-intersection`: proposed by intersecting Site coordinates and chronology with dated political Geometry. It creates a reviewable proposal and does not itself establish canonical control.

The initial `controlType` vocabulary is `territorial-control`, `administration`, `sovereignty`, `vassalage`, `claimed-by`, and `contested`. The bare field name `relationship` is not used because it collides with Heritage terminology and §63's `relationshipType` model.

## 5. Compatibility

The existing flat Site-level `politicalEntities[]` array remains a legacy/public compatibility projection. `politicalEntityAssertions[]` is canonical for new sourced and dated Site associations. Existing Site-level strings MUST NOT be automatically converted because they lack the chronology, control type, assignment method, and evidence needed for a defensible assertion. They remain preserved as-is until individually enriched or reviewed.

Phase-level `politicalEntities[]` is likewise legacy/compatibility; see `TAXONOMY.md` §26 for the complete normative rule.

## 6. Registry lifecycle

Entity `status` MUST be `active`, `proposed`, `deprecated`, `rejected`, or `quarantined`. `pending` is invalid.

