# ArcheoMaps Taxonomy

Version: 1.5.1 — WORKING SPECIFICATION (post-audit correction pass; independent-inspection corrections applied)
Status: Pre-v2 review draft; **NOT frozen, NOT v2, NOT migration-canonical, NOT implementation-ready**
Last updated: 2026-09-02

---

## Changelog

### v1.5.1 independent-inspection correction pass

This is a **narrowly scoped corrective revision** of the v1.5.1 package following an independent inspection of the first v1.5.1 pass. It remains v1.5.1 — not v1.5.2, not v2, not frozen. See `V1.5.1_CHANGE_LEDGER.md`'s "Independent inspection correction pass" section for the complete finding-by-finding record. Five corrections were made:

1. **Relationship review/workflow metadata** (§63.1) and **mechanical reciprocal behavior** (§63.2) added — the first pass's relationship schema had confidence/sourcing/chronology but no review-status mechanism, and left `reciprocal: true` unexplained. Both gaps are closed.
2. **General evidence-insufficiency workflow separated from Type-classification workflow.** The first pass added `evidence-insufficient` directly to `workflow.type.state`, incorrectly conflating Type-classification uncertainty with enrichment gaps in any *other* dimension. `workflow.type`'s state is now scoped strictly to Type; a new, separate `workflow.enrichment[]` mechanism (`MIGRATION_RULES_v2.6.md` §5.4) handles chronology/culture/functions/etc. independently, per-dimension, with an explicit rule against mechanically flagging every record lacking the legacy `source` field.
3. **Chronology made canonical; Phase `start`/`end` made an explicitly derived, non-editable projection**, replacing the first pass's "coexist, sourced-wins-on-conflict" rule, which permitted drift and didn't handle multiple conflicting sourced interpretations. A worked fixture with two conflicting sourced dates for one Phase, and the deterministic projection rule that resolves them, is included (§55).
4. **`function` vs. `functions` resolved.** The first pass left this open; it is resolved here — `functions` is canonical, with a full compatibility policy for adapters, flattening, and the (unmodified-in-this-pass) live application (§60).
5. **`hominin-remains` wording corrected** (§48) to remove language that could be read as implying Neanderthals or other members of genus *Homo* are categorically non-human; redefined operationally as a paleoanthropological/deep-prehistory evidentiary context rather than a human/non-human distinction.

The other five open decisions from the first v1.5.1 pass (`archaeology:cave-art`; `infrastructure:irrigation` vs. `industry:irrigation`; `architecture:nuraghe`/`broch` vs. `military:nuraghe`/`broch`; `monument:assembly-site`; `secondaryType`) remain open — this pass did not touch them, and does not claim to have resolved them.

### v1.5 → v1.5.1 (Adversarial Audit Corrections, first pass)

This version implements the *agreed* subset of findings from the `TAXONOMY_v1.5_AUDIT.md` adversarial pre-freeze audit and its post-review addendum (§23 of that report), not every recommendation the audit originally proposed — several were revised or rejected on review, and those revisions are what's implemented here. See `V1.5.1_CHANGE_LEDGER.md` for the complete, finding-by-finding record of what changed, what didn't, and why. **v1.5.1 remains provisional, exactly like v1.5** — it resolves specific documented defects, not a general redesign, and several items are deliberately left as open, unresolved decisions rather than silently decided (see the Change Ledger's "Open Decisions" section). No data, `index.html`, Curator, or Scribe are touched by this version; it is a specification-only correction.

Headline changes: `canonicalType` used consistently in place of bare `type` in all Site-level worked examples (T15-P0-001); new §63 Relationships section with initial vocabulary (T15-P0-003); explicit `Other`-vs-review-workflow rule (T15-P0-004); `culture:roman` example corrected (T15-P0-005); Phase↔Chronology coexistence rule stated explicitly (T15-P1-006, later superseded by the independent-inspection pass above); route/geometry wording reconciled with §54's already-shipped LineString support (T15-P1-007); harbour/port/megalithic namespace disambiguation added (T15-P1-004); `funerary:mausoleum`, `architecture:minaret`, `infrastructure:stepwell`, and a new Evidence Form value for hominin fossil evidence added (T15-P1-002/003, T15-P2-001/002); insufficient-evidence workflow guidance added (T15-P1-008, later split into two mechanisms by the independent-inspection pass above); `funerary:tomb` registration explicitly rejected in favor of per-record migration (T15-P1-003, reversed from the original audit recommendation). Several rogue-tag namespace collisions (`archaeology:cave-art`, `infrastructure:irrigation`/`industry:irrigation`, `military:nuraghe`/`architecture:nuraghe`) are deliberately **not** resolved by blanket substitution and are listed as open decisions requiring case-by-case curatorial adjudication.

### v1.3 → v1.5 (External Standards Comparison and Dimensional Enrichment)

This version follows a comparative review against FISH/Historic England vocabularies, Getty AAT/TGN, Pleiades, ARIADNEplus/AO-Cat, CIDOC CRM and CRMarchaeo, Arches, PeriodO, tDAR, and Open Context. Version 1.4 was an internal schema-design step; v1.5 is the first integrated taxonomy document resulting from that work. **v1.5 is deliberately not frozen as v2.** It is a working specification to be tested against the live catalogue, difficult fixtures, Curator, Scribe, and future source adapters.

**Core model expanded:** the original six dimensions remain valid, but they are now joined by six additional first-class questions: Components, Chronology, Evidence/Manifestation, Condition, Investigations, and Relationships. Names and Locations are also promoted from simple scalar fields into potentially sourced, dated assertions. This prevents `tags` and `phases` from absorbing information that answers fundamentally different questions.

**New dimensions and supporting domains:**

- Evidence / Manifestation (§48)
- Condition Assessments (§49)
- Components (§50)
- Investigations (§51)
- Materials and Techniques (§52)
- Names and Appellations (§53)
- Locations, Geometry, Precision and Coordinate Sensitivity (§54)
- Period Definitions (§55)
- Actors and Organisations (§56)
- Threats, Access and Protection (§57)
- External Vocabulary Alignment (§58)
- Registry Governance and Unknown-Term Quarantine (§59)
- Compatibility and Migration Policy (§60)

**Historical Phase correction:** discovery, excavation and other modern research actions no longer belong in the Historical Phase vocabulary. They become Investigation Events (§51). Existing values are retained as deprecated compatibility inputs until migrated; nothing is silently deleted.

**Tag-domain correction:** several existing `archaeology:*`, `construction:*`, and chronological `prehistoric:*` tags overlap the new Condition, Evidence, Material, Technique, Investigation, or Period dimensions. They remain readable during transition, but v1.5 identifies their preferred destination (§60). New records should use the more precise dimension once Scribe supports it.

**No Type expansion:** comparison against professional systems did not justify adding new primary Types. The existing 14-Type vocabulary remains unchanged. Narrow monument/building forms continue to belong in Tags or Components rather than inflating Type.

**Field-name direction:** canonical multi-value fields are plural: `tags`, `cultures`, `politicalEntities`, `functions`, `chronology`, `phases`, `evidence`, `conditionAssessments`, `components`, `investigations`, and `relationships`. Legacy singular keys remain adapter inputs only.

**No live-data or UI migration is performed by this document.** Machine-readable registries, JSON Schema, v1→v1.5 dry-run rules, public projections, and Scribe implementation remain subsequent work.

### v1.0 → v1.1 (Gap Analysis)

Closed every gap found when auditing the taxonomy against the live 2,103-record dataset. No new Types were introduced in this round; every fix was a new Tag value, one new Function value, or clarifying guidance text (Rule 47).

**New Tags:** `architecture:pyramid`, `architecture:ziggurat`, `architecture:stupa`, `architecture:pagoda` (§7); `archaeology:submerged` (§8); `funerary:dolmen`, `funerary:mound`, `funerary:tumulus`, `funerary:kurgan` (§11); `military:nuraghe`, `military:broch`, `military:massacre`, `military:fortified-position` (§16); `monument:geoglyph`, `monument:stone-circle`, `monument:alignment`, `monument:henge`, `monument:medicine-wheel`, `monument:effigy-mound` (§17).

**New Function:** `astronomical` (§21).

**Corrections:** §4.6 Palace: `monument:monumental` → `construction:monumental` (v1.0 typo). `funerary:kurgan` and `military:massacre`/`military:fortified-position` resolve v1.0 inconsistencies where these were cited as examples without existing in their namespace vocabularies.

**Clarified guidance (no new vocabulary):** §4.3 Monument — added open-air rock art as an example. §4.9 Archaeological Site — added "ruins of unclear type" and "isolated civic architecture" as explicit fallback examples. §4.12 (now §4.13) Landscape / §4.14 Other — added guidance distinguishing natural landmarks with documented cultural significance from those with none.

### v1.1 → v1.2 (Observatory Decision)

Final review resolved a specific, deliberately reconsidered question: whether "observatory" should be treated purely as the `astronomical` Function (as v1.1 concluded) or whether some observatory sites also need their own Type.

**Decision: `Observatory` added as a 14th Type** (§4.12), reserved for sites whose primary, well-documented historical identity is a purpose-built astronomical/scientific observation structure (e.g. purpose-built Maya observatories; early-modern European observatories). This is the one exception made to the "prefer a Tag" default in this entire taxonomy project, justified because none of the 13 existing Types can hold this specific, well-attested category of purpose-built site without distorting what it fundamentally is (see §4.12 for the full rationale). `astronomical` remains a Function, unchanged, and now explicitly documented as distinct from and independent of the new Type.

**New Tag:** `architecture:observatory` (§7) — for observatory architecture as a component of a site whose overall Type is something else (e.g. an observatory building within a larger Settlement or Religious Site complex), following the same pattern as `architecture:palace`/`architecture:temple`.

**No new Function was added** — `astronomical` already existed and continues to describe use, independent of Type.

**Corrected text (direct consequence of this decision, not an independent redesign):** the Rule 5 corollary (§3) and the `astronomical` entry (§21) previously stated that observatory-ness could only ever be a Function. Both were rewritten to state the corrected Type/Function distinction, since the original wording would otherwise now contradict this decision.

**New examples:** §33d (purpose-built Observatory, Type + astronomical Function coexisting) and §33e (a temple with an astronomical function that remains Type = Religious Site, not Observatory) were added to make the distinction concrete. §33c's commentary was revised to contrast it with §33d.

**No Historical Phase changes.** No changes to `SITES`, `archeomaps_1.html`, the UI, filters, or timeline — this is a specification-only document.

### v1.2 → v1.3 (Caravanserai Gap Closed)

Closes the one confirmed structural gap found by the full 2,103-record dry run (`MIGRATION_DRY_RUN.md` §8.7, §10.E): no existing Tag captured "caravanserai" as a specific historical building/institution type. `Settlement` + `settlement:trade-centre` was considered and rejected as the fix — it loses the specific built-form identity (a caravanserai is a specific waystation/inn structure, distinct from a settlement as such), matching the dry run's own reasoning for why this was a genuine gap rather than a data-quality problem.

**New Tag:** `architecture:caravanserai` (§7) — for a caravanserai as a specific architectural/institutional form, following the same pattern as `architecture:palace`, `architecture:temple`, and the other named-building-type architecture tags. No new Type was created; per Rule 47, a Tag was preferred and was sufficient here, the same as for every other gap this taxonomy has closed except `Observatory`.

**No new Function was added, and none is implied automatically.** `architecture:caravanserai` describes physical/institutional form only. Any of `commercial`, `transport`, `residential`, or other Functions already in the §21 vocabulary may be assigned to a caravanserai record, but only where the record's own text documents that specific use — exactly the same evidentiary bar as any other Function assignment (§21, §44). The Tag itself never auto-populates Functions.

**Clarified guidance (no new vocabulary beyond the one Tag):** §4.7 Infrastructure and §4.1 Settlement both now note that a caravanserai record's Type follows the same record-scope logic as everything else in this taxonomy — see §4.7.

**Taxonomy status:** with this gap closed, `TAXONOMY.md` is treated as migration-canonical as of v1.3, per the dry run's own closing recommendation, unless a further audit uncovers another genuine structural gap distinct from the data-quality issues the dry run already resolved.

---

## 1. Purpose

This document defines the controlled vocabulary and classification rules for ArcheoMaps.

The taxonomy is designed to support:

- thousands of historical locations
- multiple cultural associations
- multiple political entities
- multiple functions
- multiple historical phases
- chronological filtering
- future historical-political overlays
- future route/geometry layers
- UNESCO and other external datasets
- human review of ambiguous classifications

The taxonomy must remain understandable and useful to a historian, while also being deterministic enough for automated classification.

---

## 2. Core Principle

ArcheoMaps separates twelve different questions. The first six describe the identity and historical associations of the place; the next six prevent evidence, preservation, modern research, chronology, components, and relationships from being flattened into Tags or prose.

| Dimension | Question |
|---|---|
| `type` | What fundamentally IS this place? |
| `tags` | What notable characteristics does it have? |
| `cultures` | Which cultural traditions/societies are associated with it? |
| `politicalEntities` | Which political entity/entities controlled it? |
| `functions` | What was the place used for? |
| `phases` | What significant things happened to the place through time? |
| `components` | What meaningful structures or parts compose it? |
| `chronology` | When is it dated, attested, active, or interpreted to belong? |
| `evidence` | How is it physically manifested or identified? |
| `conditionAssessments` | What survives, and in what state at a given assessment date? |
| `investigations` | How, when, and by whom was it studied? |
| `relationships` | How is it connected to other places and resources? |

These dimensions **MUST NOT** be collapsed into one another. Names, Locations, Materials/Techniques, Actors/Organisations, Period Definitions, Heritage Designations, Threats/Access, Sources, Provenance, Workflow, Media, and Presentation are supporting domains governed separately below.

---

## 3. Golden Rules

### Rule 1 — Type describes the site's fundamental nature

`type` answers:

> "If I had to describe what this place fundamentally is in one word, what would I call it?"

Each site has exactly ONE primary `type`.

### Rule 2 — Tags describe characteristics and subtypes

Tags answer:

> "What is notable or specifically characteristic about this site?"

A site may have many tags. Tags are namespaced.

Example:

```
canonicalType: "Fortification"

tags:
  - "military:castellum"
  - "military:frontier"
  - "architecture:fort"
  - "construction:stone"
```

Do NOT create a new Type merely because a site has a specialised form.

Example:

```
Roman castellum
    canonicalType = Fortification
    tag  = military:castellum
```

NOT:

```
canonicalType = Roman Castellum
```

### Rule 3 — Culture is not political control

A site's culture and political controller may be different.

Example:

```
culture:
  - Egyptian

politicalEntity:
  - Roman Empire
```

This is historically valid. Do not infer political control from culture alone.

### Rule 4 — Political Entity is not Culture

Examples:

```
Culture:
  - Greek

Political Entity:
  - Roman Empire
```

or:

```
Culture:
  - Egyptian
  - Hellenistic

Political Entity:
  - Ptolemaic Kingdom
  - Roman Empire
```

Political entities represent political authority/control, not cultural identity.

### Rule 5 — Function is not Type

A fort can have several functions.

Example:

```
type:
  Fortification

functions:
  - military
  - administrative
  - communication
```

Do not create:

```
canonicalType = Military Site
```

when "military" can be expressed as a function.

**Corollary (v1.2):** this cuts both ways. A site's documented USE (e.g. astronomical/calendrical observation) is always a Function, never a Type by itself — a stone circle, temple, or monument does not become a different Type just because it was also used astronomically. But if a site's fundamental, historically-documented identity IS a purpose-built structure for that use — a purpose-built observatory being the specific case examined during this taxonomy's design — that well-attested category of site can still warrant its own Type (see `Observatory`, §4.12), separate from and in addition to the `astronomical` Function. "What kind of thing is this" and "what was it used for" remain distinct questions even when the answers correlate. This is treated as a narrow, deliberately-considered exception, not a precedent for adding a Type every time a Function recurs often enough. The same principle governs a Tag that names a specific historical building/institution type, such as `architecture:caravanserai` (§7, added v1.3) — the Tag records what the structure IS, never what it was used for; documented Functions (`commercial`, `transport`, `residential`, etc.) are assigned separately and only on their own textual evidence.

### Rule 6 — Historical phases describe change through time

A phase represents a meaningful historical episode affecting the site.

Examples:

```
construction
occupation
expansion
modification
conversion
destruction
abandonment
restoration
```

A phase is not simply another name for a culture or period.

### Rule 7 — Prefer existing vocabulary over new vocabulary

Before creating a new Type, Tag, Function, Culture or Political Entity:

1. Search the existing controlled vocabulary.
2. Check synonyms and related terms.
3. Use an existing value if it adequately describes the site.
4. Only create a new value if the existing vocabulary cannot represent the distinction without loss of meaning.

---

## 4. Type Vocabulary

Every site has exactly ONE primary Type.

The controlled vocabulary is:

```
Settlement
Religious Site
Monument
Tomb
Fortification
Palace
Infrastructure
Cave
Archaeological Site
Battlefield
Industrial Site
Observatory
Landscape
Other
```

`Observatory` (§4.12) is the only Type added since v1.0, and was added only after determining the existing 12 could not represent it without distortion — see §4.12 for the full rationale. Every other gap found during taxonomy review, including the v1.3 caravanserai gap, was resolved with a Tag or Function instead (§7–§21), per Rule 47.

### 4.1 Settlement

Use for places fundamentally characterised as settlements.

Examples: city, town, village, urban settlement, ancient settlement, archaeological settlement.

Possible tags:

```
settlement:city
settlement:town
settlement:village
settlement:capital
settlement:colony
settlement:urban
settlement:rural
settlement:frontier
settlement:port
settlement:trade-centre
```

Do NOT use Settlement merely because people once occupied a site. A cave occupied by prehistoric humans remains `canonicalType = Cave`, not `canonicalType = Settlement`, unless the archaeological site is fundamentally a settlement complex.

A record whose scope is fundamentally a settlement is `canonicalType = Settlement` even when a component of it (a temple, a wall, a caravanserai) is what the legacy data happened to name — see §34 and Rule 47's general Tag-over-Type preference. The reverse also holds: a record whose scope is a single waystation/inn building (a caravanserai) that happens to sit along a route through, or near, a settlement is not automatically `canonicalType = Settlement` merely because of that proximity — see §4.7.

### 4.2 Religious Site

Use for sites fundamentally characterised by religious or sacred use.

Includes: temple, church, cathedral, mosque, synagogue, monastery, shrine, sanctuary, oracle, sacred complex, rock-cut religious site, ziggurat, stupa, pagoda.

Examples:

```
canonicalType = Religious Site
tags:
  - architecture:temple

canonicalType = Religious Site
tags:
  - architecture:church

canonicalType = Religious Site
tags:
  - architecture:ziggurat
```

Do NOT create separate Types for individual religions or religious architectural forms. See §33e for a Religious Site that also has an astronomical function without being classified as an Observatory.

### 4.3 Monument

Use for sites fundamentally characterised as monuments rather than settlements, buildings, tombs or fortifications.

Examples: standing monument, commemorative monument, stela, obelisk, monumental statue, triumphal monument, stone circle, alignment, henge, geoglyph, effigy mound, open-air rock art / petroglyph panel.

Possible tags:

```
monument:stela
monument:obelisk
monument:statue
monument:column
monument:triumphal-arch
monument:memorial
monument:inscription
monument:megalithic
monument:standing-stone
monument:stone-circle
monument:alignment
monument:henge
monument:medicine-wheel
monument:geoglyph
monument:effigy-mound
```

Open-air rock art and petroglyph panels not located inside a cave belong here — `canonicalType = Monument`, tags `prehistoric:rock-art` + `monument:inscription` as applicable — rather than under Cave. A large-scale ground marking (a geoglyph) is likewise `canonicalType = Monument` with `monument:geoglyph`; use `canonicalType = Landscape` instead only when the geoglyph is part of a broader documented cultural landscape rather than a single discrete figure.

An effigy mound is `canonicalType = Monument` with `monument:effigy-mound`, not `canonicalType = Tomb` — effigy mounds are symbolic/ceremonial earthworks and are not necessarily funerary. Use `funerary:mound` (§11) instead only when the mound is documented as a burial feature. The absence of documented funerary evidence is not, by itself, evidence of monumental identity either — if a mound's text supports neither a funerary nor a non-funerary ceremonial/platform/effigy reading, the correct migration outcome is REVIEW or RESEARCH, not an assumed Monument (see `MIGRATION_RULES.md` §11).

A megalithic monument or stone circle described using the word "wall" in older or informal source material — because it is structurally one ring of a concentric stone arrangement rather than a fortification — remains `canonicalType = Monument` with the applicable `monument:*` tag (`monument:stone-circle`, `monument:megalithic`, `monument:standing-stone`, or `monument:alignment` as the text supports), not `canonicalType = Fortification`. The word "wall" describes a structural feature, not a defensive function, unless the record's own text establishes the latter.

A megalithic monument or stone circle with a documented or credibly argued astronomical/calendrical function remains `canonicalType = Monument` — add `astronomical` added to `functions[]` (§21), not `canonicalType = Observatory`. It only becomes `Observatory` if it is itself a purpose-built observation structure rather than a monument that happens to also have been used for observation. See §33c and §33d for a worked contrast.

### 4.4 Tomb

Use when the primary nature of the site is funerary/burial architecture.

Examples: pyramid (funerary), mausoleum, royal tomb, burial chamber, dolmen, kurgan, tumulus, necropolis when represented primarily as a funerary complex.

Possible tags:

```
funerary:burial
funerary:necropolis
funerary:royal-tomb
funerary:shaft-tomb
funerary:chamber-tomb
funerary:rock-cut-tomb
funerary:mass-grave
funerary:cremation
funerary:dolmen
funerary:mound
funerary:tumulus
funerary:kurgan
```

A tomb located inside a cave does NOT automatically become `canonicalType = Cave` if the primary historical identity is the funerary structure.

### 4.5 Fortification

Use for defensive/military architecture or complexes.

Examples: fortress, fort, castle, citadel, hillfort, city wall, defensive complex, castellum, nuraghe, broch.

Possible tags:

```
military:fort
military:fortress
military:castle
military:citadel
military:castellum
military:hillfort
military:frontier
military:garrison
military:watchtower
military:city-wall
military:defensive-wall
military:siegeworks
military:earthwork
military:nuraghe
military:broch
architecture:tower
architecture:gate
```

"Castellum" is a Tag, not a Type. So are "nuraghe" and "broch" — regional tower/fortification forms follow the same pattern.

A record whose own scope is an entire walled city or settlement — where the wall is the surviving remnant of the settlement as a whole, not a standalone defensive structure — is `canonicalType = Settlement` (§4.1), not `canonicalType = Fortification`, even though its text uses defensive/military language to describe the wall itself. Reserve `Fortification` for records whose own scope is the standalone defensive structure or system.

### 4.6 Palace

Use when a monumental elite/royal residence or palace complex is fundamentally what defines the site.

Possible tags:

```
architecture:palace
architecture:villa
settlement:administrative-centre
construction:monumental
```

A palace that is merely one component of a larger archaeological city may instead have `canonicalType = Settlement` with `tags: [architecture:palace]`.

### 4.7 Infrastructure

Use for transport, hydraulic, communication or other infrastructural works.

Examples: road, bridge, aqueduct, canal, dam, harbour, port, tunnel, major water system, caravanserai (a waystation/inn structure built to serve travellers and trade along a route).

Possible tags:

```
infrastructure:road
infrastructure:bridge
infrastructure:aqueduct
infrastructure:canal
infrastructure:dam
infrastructure:harbour
infrastructure:port
infrastructure:tunnel
infrastructure:water-system
infrastructure:drainage
```

A caravanserai record's Type follows the same record-scope logic as every other Type decision in this taxonomy (see `MIGRATION_RULES.md` §8 for the general migration statement of this principle): where the record's own scope is the standalone waystation building, `canonicalType = Infrastructure` with tag `architecture:caravanserai` (§7) is the usual fit, since a caravanserai is fundamentally a piece of trade-route infrastructure. Where the record's own scope is a larger settlement that happens to contain a caravanserai, `canonicalType = Settlement` with the same tag applies instead (§4.1). Where the record is unresolved ruins with no further identifying information, `canonicalType = Archaeological Site` (§4.9) applies until more is known. In no case does the `architecture:caravanserai` tag itself imply a Function (§21) — accommodation, trade, or transport Functions require their own independent textual evidence.

Future linear-route support may represent major routes as geometry rather than point locations.

### 4.8 Cave

Use for natural or artificial caves where the cave itself is the fundamental identity of the historical site. This category intentionally covers a wide range of archaeological and historical cave contexts.

Possible tags:

```
cave:natural
cave:artificial
cave:rock-shelter
cave:habitation
cave:ritual
cave:burial
cave:art
cave:underground-complex
cave:mining
archaeology:human-remains
prehistoric:rock-art
prehistoric:cave-art
```

Examples:

```
prehistoric cave containing rock art
    canonicalType = Cave
    tags:
      - cave:natural
      - cave:art
      - prehistoric:rock-art

artificial Roman underground complex
    canonicalType = Cave
    tags:
      - cave:artificial
      - cave:underground-complex
    cultures:
      - roman
```

**Correction (v1.5.1, T15-P0-005):** `culture:*` is never a tag namespace — `culture` does not appear in §6's approved namespace list, and Culture is an independent first-class dimension (`cultures[]`, §22–23), never a Tag. A prior version of this example incorrectly listed `culture:roman` as a tag; it has been moved to `cultures: ["roman"]` above, matching every other example in this document.

Do not create separate Types such as Art Cave, Burial Cave, Roman Cave, Ritual Cave. These are Tags. Rock art NOT inside a cave is `canonicalType = Monument` — see §4.3.

### 4.9 Archaeological Site

Use when the location is primarily an archaeological site or complex that cannot reasonably be represented by a more specific Type.

Examples: archaeological excavation site, archaeological complex, ruins of unclear primary function, multi-period archaeological site where no single structural Type adequately describes the site.

This is the correct fallback Type for two common cases:
- A site currently documented only as "ruins," with no further information available about what it fundamentally was (settlement, temple, fortress, etc.). Pair with tag `archaeology:ruins` (§8). Use a more specific Type instead as soon as the site's fundamental nature is established.
- Isolated civic or public architecture — a theatre, amphitheatre, stadium, or bath complex — not documented as part of a larger settlement. Pair with the relevant `architecture:*` tag (§7) and, where the use is known, functions such as `recreational` or `entertainment` (§21).

A site provisionally placed here as a suspected observatory graduates to `canonicalType = Observatory` (§4.12) once its identity as a purpose-built observation structure is actually confirmed by the source material — do not assign `Observatory` speculatively and do not leave a confirmed observatory sitting under this fallback Type indefinitely.

Do not use Archaeological Site merely because a location is old. Do not add `archaeology:archaeological-site` (§8) reflexively to every record typed `Archaeological Site` — the Type already communicates that information; only add the Tag when it contributes something the Type alone does not (§43).

### 4.10 Battlefield

Use for locations whose historical significance is primarily a battle or military engagement.

Possible tags:

```
military:battlefield
military:siege
military:massacre
military:fortified-position
archaeology:mass-grave
```

A fort that happens to have been involved in a battle remains `canonicalType = Fortification` unless the battlefield itself is the primary historical subject.

### 4.11 Industrial Site

Use for locations fundamentally characterised by historical production or industrial activity.

Examples: mine, quarry, smelting complex, workshop, factory, kiln complex.

Possible tags:

```
industry:mine
industry:quarry
industry:smelter
industry:workshop
industry:factory
industry:kiln
industry:forge
industry:warehouse
```

### 4.12 Observatory

Use only for sites whose primary, well-documented historical identity is a purpose-built structure for astronomical or calendrical observation.

**Why this is a Type and not a Tag (the one exception to Rule 47 in this taxonomy):** every other borderline case resolved during taxonomy review was handled as a Tag or Function because the site's fundamental nature was still captured by an existing Type (a pyramid is still a Tomb or Religious Site; a dolmen is still a Tomb; a caravanserai is still Infrastructure or Settlement). A purpose-built observatory is different — it does not reduce to any of the other 13 Types without distortion:

- Not `Religious Site` — its documented primary purpose is scientific/observational, even where ceremonial elements coexist.
- Not `Monument` — §4.3 explicitly defines Monument as "rather than ... buildings," and a purpose-built observatory is a building.
- Not `Infrastructure` — that covers transport/hydraulic/communication works, not scientific institutions.
- Not `Archaeological Site` — that is a fallback for *unresolved* classification; using it for a *confirmed* observatory would erase, rather than preserve, the site's known identity, contrary to Rule 1.

Examples: purpose-built Maya astronomical observation towers; purpose-built European observatories from the early modern period onward; other structures whose primary documented historical purpose — not merely a possible secondary use — was dedicated astronomical or calendrical observation.

Possible tags:

```
architecture:observatory
construction:stone
construction:monumental
religion:ritual
```

(`religion:ritual` only where the source documents a genuine ceremonial dimension alongside the observational one, e.g. some Maya observatories — do not add it by default.)

**What does NOT belong here:**
- A stone circle, alignment, henge, temple, or other monument with a documented or credibly argued astronomical function stays under its existing Type (`Monument`, `Religious Site`, etc.) with `astronomical` added to `functions[]` (§21). It becomes `Observatory` only if it is itself, fundamentally, a purpose-built observation structure — not merely a monument that was also used for observation. See §33c vs. §33d.
- Do not classify every site with any astronomical association as an Observatory. This Type is for a specific, narrow, well-evidenced category of purpose-built site, not a general label for "things related to astronomy."
- Do not assign `canonicalType = Observatory` (or `astronomical` in `functions[]`, §21) on the basis of popular or fringe astronomical speculation about a site. Follow the same evidence standard as every other classification decision in this taxonomy (§7 Rule 7, §38 Migration Rule 13, §44) — if the source doesn't support it, leave the classification as-is or mark it for review; do not guess.

### 4.13 Landscape

Use when the historical significance lies primarily in a cultural or archaeological landscape rather than a discrete structure.

Possible tags:

```
landscape:cultural
landscape:sacred
landscape:archaeological
landscape:agricultural
landscape:pastoral
landscape:maritime
```

A natural landmark (a mountain, cave, spring, or rock formation) with **documented** cultural, mythological, or religious significance belongs here — e.g. `landscape:sacred` — even if it has no constructed archaeological remains. A natural landmark with **no** documented cultural or historical content beyond its physical existence does not belong in this taxonomy as a historical/archaeological site at all. Per the v1.5.1 correction in §4.14: if the record confidently has no documented significance at all, use `canonicalType = Other`; if it's genuinely unclear whether undocumented significance exists, leave `canonicalType: null` with a workflow review flag instead — the two are not interchangeable (§4.14, §44).

### 4.14 Other

Use only when the record's own evidence supports a **confident, positive conclusion that no existing Type fits** — not as a substitute for genuine uncertainty. "Other" is preferable to inventing an inappropriate Type.

**`Other` vs. genuine uncertainty (v1.5.1, T15-P0-004):** these are two different situations and must not be conflated.
- **Confidently "none of the 13 specific Types fit"** → `canonicalType: "Other"`. This is a terminal, positive classification. It does not, by itself, enter a workflow review queue — the classification decision has already been made and is not pending.
- **Genuinely uncertain / insufficient evidence to classify at all** → leave `canonicalType: null` **and** attach a `workflow` entry (§39, `MIGRATION_RULES.md` §5) flagging the record for human review. This is the *only* path that is actually reviewed in the current implementation — confirmed against live data, where `workflow` presence and `canonicalType: null` correspond exactly, with zero exceptions in either direction.

Using `Other` for a record that is actually uncertain (rather than confidently "no Type fits") silently removes it from the review pipeline with no record that this happened. If in doubt, use `null` + `workflow`, not `Other`.

This includes natural landmarks whose only recorded content is a physical description with no cultural, historical, or archaeological significance attached — see §4.13.

---

## 5. Namespaced Tag System

Tags MUST use the following format:

```
namespace:value
```

Examples:

```
military:castellum
architecture:temple
prehistoric:rock-art
construction:rock-cut
```

Do NOT use unnamespaced tags such as `castellum`, `temple`, `rock-art`. This prevents collisions and makes future filtering possible.

---

## 6. Tag Namespaces

Initial approved namespaces (unchanged throughout this whole review — every v1.1/v1.2/v1.3 tag addition fit within these; no new namespace was ever needed):

```
architecture
archaeology
cave
construction
funerary
infrastructure
industry
landscape
maritime
military
monument
prehistoric
religion
settlement
```

Additional namespaces may be added when a real recurring requirement appears. Do not create a new namespace for a single unusual site.

---

## 7. Architecture Tags

Vocabulary:

```
architecture:temple
architecture:church
architecture:cathedral
architecture:mosque
architecture:synagogue
architecture:monastery
architecture:shrine
architecture:sanctuary
architecture:palace
architecture:villa
architecture:house
architecture:theatre
architecture:amphitheatre
architecture:stadium
architecture:forum
architecture:basilica
architecture:bath
architecture:citadel
architecture:fort
architecture:tower
architecture:gate
architecture:wall
architecture:bridge
architecture:aqueduct
architecture:cistern
architecture:lighthouse
architecture:harbour
architecture:pyramid
architecture:ziggurat
architecture:stupa
architecture:pagoda
architecture:observatory
architecture:caravanserai
architecture:minaret
```

Architectural terms describe physical form. They do not automatically determine Type.

Example: `architecture:temple` does not automatically mean `canonicalType = Religious Site` if the temple is merely one component of a larger settlement. Likewise, `architecture:pyramid` does not by itself determine Type — pair it with `Tomb` (funerary pyramid), `Religious Site` (temple pyramid), or `Monument` depending on the site's documented primary function. This applies regardless of the structure's age: a confirmed modern (e.g. 19th-century or later) structure with a genuine pyramid form is tagged `architecture:pyramid` on exactly the same basis as an ancient one — the tag records physical form, not antiquity, and is not withheld from a modern structure or added automatically to an ancient one just because of the legacy `type` string.

`architecture:caravanserai` (added v1.3) is for a caravanserai as a specific historical waystation/inn building type — see §4.7 for how this pairs with Type. Like every other architecture tag, it describes form only; it never by itself implies a Function (§21) such as `commercial` or `transport`.

`architecture:observatory` is most useful when an observatory building is a component of a site whose overall Type is something else (e.g. part of a larger Settlement or Religious Site complex), the same way `architecture:palace` is used within a Settlement-typed site (§34). On a record already typed `Observatory`, this tag is optional and adds little on its own — per §43, don't add it reflexively just to mirror the Type name. The same restraint applies to any architecture tag that merely echoes an already-assigned Type name.

**`harbour`/`port` disambiguation (v1.5.1, T15-P1-004):** `harbour` and `port` are each registered in more than one namespace (`architecture:harbour`/`infrastructure:harbour`/`maritime:harbour`; `infrastructure:port`/`maritime:port`/`settlement:port`, §12/§15/§20), because a harbour or port genuinely is architecture, infrastructure, and a maritime feature simultaneously — this is not an error to resolve down to one namespace. Use them together rather than choosing one: `architecture:harbour` describes a harbour structure as a physical form/component; `infrastructure:harbour` describes the site's fundamental infrastructural identity (appropriate as the primary characterisation when the record's own scope *is* the harbour); `maritime:harbour` describes a maritime/naval context or association; `settlement:port` describes a settlement whose defining characteristic is being a port town. A record may legitimately carry more than one of these at once.

---

## 8. Archaeology Tags

Vocabulary:

```
archaeology:archaeological-site
archaeology:excavated
archaeology:partially-preserved
archaeology:well-preserved
archaeology:ruins
archaeology:reconstructed
archaeology:reused
archaeology:buried
archaeology:subterranean
archaeology:submerged
archaeology:destroyed
archaeology:lost-site
archaeology:human-remains
archaeology:mass-grave
```

These describe archaeological condition or evidence. `archaeology:submerged` covers underwater/drowned sites (e.g. a submerged Neolithic village), parallel to the existing `buried`/`subterranean` values — it describes preservation condition, not a maritime function, so it lives here rather than in the `maritime` namespace.

**`archaeology:hominid-fossils` NOT added here (v1.5.1, T15-P2-001 correction):** 6 live records use this unregistered value. Its correct destination is the **Evidence** dimension (§48), not a new Archaeology Tag — see §48 for the new `hominin-remains` Evidence Form value, which is where paleoanthropological fossil evidence involving hominins belongs (revised wording, independent-inspection pass — see §48 for the full definition and how it relates to `human-remains`).

`archaeology:archaeological-site` in particular should not be added reflexively to every record typed `Archaeological Site` — see §43's own worked example, which names this exact tag as the kind of redundant addition to avoid. Add it only when it contributes something the Type does not already communicate.

---

## 9. Cave Tags

Initial vocabulary:

```
cave:natural
cave:artificial
cave:rock-shelter
cave:habitation
cave:ritual
cave:burial
cave:art
cave:underground-complex
cave:mining
```

---

## 10. Construction Tags

Initial vocabulary:

```
construction:stone
construction:brick
construction:mudbrick
construction:concrete
construction:timber
construction:earthwork
construction:rock-cut
construction:megalithic
construction:underground
construction:subterranean
construction:vaulted
construction:domed
construction:colonnaded
construction:monumental
```

Use only when the construction characteristic is historically meaningful or useful for distinguishing the site.

**`megalithic` disambiguation (v1.5.1, T15-P1-004):** `megalithic` is registered in three namespaces because it answers three different questions, and a record may carry more than one: `construction:megalithic` describes the building **technique** (large, often unworked or roughly worked stone blocks) and may apply to any Type; `monument:megalithic` (§17) is the generic monument **form** for a megalithic structure whose more specific arrangement (circle, alignment, henge — see §17) isn't established or doesn't apply; `prehistoric:megalithic` (§18) marks the **chronological/technological horizon** ("Megalithic") a site is associated with, independent of whether the site's own Type or form is itself megalithic. These are not synonyms and none substitutes for the others.

---

## 11. Funerary Tags

Vocabulary:

```
funerary:burial
funerary:cemetery
funerary:necropolis
funerary:royal-tomb
funerary:shaft-tomb
funerary:chamber-tomb
funerary:rock-cut-tomb
funerary:mass-grave
funerary:cremation
funerary:dolmen
funerary:mound
funerary:tumulus
funerary:kurgan
funerary:mausoleum
```

`funerary:dolmen`, `:mound`, `:tumulus`, and `:kurgan` preserve historically specific burial-architecture terms that `funerary:chamber-tomb` would otherwise flatten, matching the precedent already set by `funerary:rock-cut-tomb`. `funerary:mausoleum` (added v1.5.1, T15-P2-001) is a common, globally-attested monumental tomb form with no adequate existing match.

**`funerary:tomb` explicitly NOT registered (v1.5.1, T15-P1-003 — reverses the original audit recommendation):** 24 live records use the unregistered value `funerary:tomb`. It is **not** added here. `canonicalType: Tomb` already communicates "this is a tomb"; a generic `funerary:tomb` tag would add nothing beyond the Type itself and would violate this taxonomy's own §43 restraint against tags that merely restate the Type. The 24 affected records should instead, on migration: receive a specific supported funerary form from the vocabulary above where the source text evidences one, or retain bare `canonicalType: Tomb` with no funerary subtype tag when no specific form is documented — per §20's own principle that the bare Type alone is always a complete, valid classification. `funerary:tomb` itself is a value to be retired from the migration queue, not promoted into the canonical registry.

---

## 12. Infrastructure Tags

Initial vocabulary:

```
infrastructure:road
infrastructure:route
infrastructure:bridge
infrastructure:aqueduct
infrastructure:canal
infrastructure:dam
infrastructure:reservoir
infrastructure:cistern
infrastructure:harbour
infrastructure:port
infrastructure:tunnel
infrastructure:water-system
infrastructure:drainage
infrastructure:stepwell
```

`infrastructure:stepwell` (added v1.5.1, T15-P2-002) is a well-documented, globally significant water-architecture form (e.g. UNESCO-listed stepwells of South Asia) that had no registered equivalent, unlike this namespace's comparatively rich coverage of Mediterranean/European infrastructure forms.

A route's geometry is already representable today via `locations[].geometry.type = "LineString"` and the `route-segment` Location Type (§54, v1.5.1 correction, T15-P1-007) — this is not merely a future capability. What remains a possible future extension is a dedicated named-route *entity* distinct from a raw LineString on a single record (e.g. one first-class "Silk Road" resource composed of many segments/records) — see §45. Do not treat a major historical route as a normal point merely because the current application does.

See §7 for `harbour`/`port` cross-namespace disambiguation (v1.5.1, T15-P1-004) — `infrastructure:harbour`/`infrastructure:port` are appropriate when the record's own scope is fundamentally the infrastructural work itself.

---

## 13. Industry Tags

Initial vocabulary:

```
industry:mine
industry:quarry
industry:smelter
industry:workshop
industry:factory
industry:kiln
industry:forge
industry:warehouse
industry:mint
industry:agriculture
industry:irrigation
```

**Open decision (v1.5.1) — `infrastructure:irrigation` vs. `industry:irrigation`:** live data contains 1 record tagged `infrastructure:irrigation`, an unregistered value, while `industry:irrigation` is already registered here. This is deliberately **not** resolved by folding one into the other. `infrastructure:irrigation` may legitimately describe the physical water-delivery system as infrastructure, while `industry:irrigation` describes the productive/agricultural activity — these can be different questions about the same site, and `industry:irrigation`'s own placement may itself be worth reconsidering. Left as an explicit open decision; see `V1.5.1_CHANGE_LEDGER.md`.

---

## 14. Landscape Tags

Initial vocabulary:

```
landscape:cultural
landscape:sacred
landscape:archaeological
landscape:agricultural
landscape:pastoral
landscape:mountain
landscape:desert
landscape:river
landscape:island
landscape:coastal
landscape:maritime
landscape:oasis
landscape:valley
landscape:plain
landscape:forest
```

Landscape tags should only be used when the environmental setting is historically or interpretively relevant. See §4.13 for guidance on natural landmarks specifically.

---

## 15. Maritime Tags

Initial vocabulary:

```
maritime:port
maritime:harbour
maritime:shipyard
maritime:lighthouse
maritime:naval
maritime:trade
maritime:shipwreck
maritime:coastal
```

See §7 for `harbour`/`port` cross-namespace disambiguation (v1.5.1, T15-P1-004) — `maritime:harbour`/`maritime:port` describe a maritime/naval context or association and may coexist with the `architecture:*`/`infrastructure:*`/`settlement:*` equivalents.

---

## 16. Military Tags

Vocabulary:

```
military:fort
military:fortress
military:castle
military:citadel
military:castellum
military:hillfort
military:frontier
military:garrison
military:watchtower
military:city-wall
military:defensive-wall
military:siegeworks
military:earthwork
military:battlefield
military:siege
military:naval
military:military-camp
military:frontier-system
military:nuraghe
military:broch
military:massacre
military:fortified-position
```

`military:massacre` and `military:fortified-position` resolve a v1.0 inconsistency: §4.10 (Battlefield) already listed them as example tags, but they were missing from this vocabulary list.

**Open decision (v1.5.1) — `military:nuraghe`/`military:broch` vs. an `architecture:*` form tag:** live data contains 1 record tagged `architecture:nuraghe`, an unregistered value, against the registered `military:nuraghe`. This is deliberately **not** resolved by substitution here. `architecture:nuraghe`/`architecture:broch` (physical form only) is plausibly the more internally consistent placement, matching how this taxonomy treats every other named-building-type tag elsewhere (`architecture:caravanserai`, `architecture:pyramid` — form only, with any defensive/military use assigned separately via `functions[]` only where independently evidenced) — nuraghi and brochs have disputed function in the archaeological literature (defensive vs. residential vs. status monument), and the v1.1 decision to place them under `military:*` may have assumed a functional reading the source evidence doesn't always support. Restructuring this would mean moving or aliasing an existing, already-used registered value, which is more invasive than the other corrections in this pass and is left as an explicit open decision requiring curatorial sign-off, not resolved unilaterally here; see `V1.5.1_CHANGE_LEDGER.md`.

---

## 17. Monument Tags

Vocabulary:

```
monument:stela
monument:obelisk
monument:statue
monument:column
monument:triumphal-arch
monument:memorial
monument:inscription
monument:megalithic
monument:standing-stone
monument:stone-circle
monument:alignment
monument:henge
monument:medicine-wheel
monument:geoglyph
monument:effigy-mound
```

`monument:standing-stone` already covers a single menhir; the remaining additions distinguish the other specific arrangement forms (a circle, an alignment, a henge, a medicine wheel) that `monument:megalithic` alone was too generic to separate. See §10 for the full `megalithic` cross-namespace disambiguation (v1.5.1, T15-P1-004).

**Adjudication of remaining unregistered `monument:*` values (v1.5.1, T15-P2-001):**
- `monument:trilithon` — not registered separately. A trilithon is adequately captured by `monument:megalithic` combined with `monument:stone-circle` or `monument:alignment` as the arrangement supports; use those rather than a new value.
- `monument:runestone`, `monument:cross`, `monument:relief` — legitimate narrow forms, deferred as safe future extensions pending a stronger recurring use case (§3 Rule 7); not added in v1.5.1.
- `monument:standalone` — not registered; its scope is unclear (it names no distinct concept the existing vocabulary doesn't already cover) and the single record using it should be reviewed for what specific existing value actually applies.
- `monument:assembly-site` (e.g. a Scandinavian þing/assembly ground) — scope needs clarification before a registration decision; left as an open decision.
- `monument:ceremonial` — **not** relocated to `religion:ceremonial` as originally proposed. This use is a documented **Function**, not a Tag: `ceremonial` is already a registered value in the Function vocabulary (§21). A monument used ceremonially should carry `functions: ["ceremonial"]`, not a new or relocated Tag.

---

## 18. Prehistoric Tags

Initial vocabulary:

```
prehistoric:palaeolithic
prehistoric:mesolithic
prehistoric:neolithic
prehistoric:chalcolithic
prehistoric:bronze-age
prehistoric:iron-age
prehistoric:megalithic
prehistoric:rock-art
prehistoric:cave-art
prehistoric:burial
prehistoric:human-remains
```

Chronological terms such as Neolithic or Bronze Age are Tags here. They are NOT Cultures. `prehistoric:rock-art` applies to both cave and open-air rock art; `prehistoric:cave-art` is specifically for the cave context. See §10 for the full `megalithic` cross-namespace disambiguation (v1.5.1, T15-P1-004): `prehistoric:megalithic` marks the chronological horizon and is independent of whether `monument:megalithic`/`construction:megalithic` also apply.

**Open decision (v1.5.1) — `archaeology:cave-art` vs. `cave:art`/`prehistoric:cave-art`:** live data contains 9 records tagged `archaeology:cave-art`, an unregistered value. Per T15-P1-002's corrected finding, this is **not** resolved by a blanket substitution here — `cave:art` (§9) and `prehistoric:cave-art` (this section) ask different questions (cave typology vs. chronological/technique classification) and the correct destination likely depends on each record's own context. This is left as an explicit open decision requiring per-record curatorial review; see `V1.5.1_CHANGE_LEDGER.md`.

---

## 19. Religion Tags

Initial vocabulary:

```
religion:religious
religion:ritual
religion:ceremonial
religion:pilgrimage
religion:sacred-landscape
religion:oracle
religion:cult-site
religion:sacred-spring
religion:sacred-cave
religion:temple-complex
religion:processional
```

A religion itself should generally NOT be encoded as a Tag. Use `cultures` for cultural/religious traditions where appropriate.

---

## 20. Settlement Tags

Initial vocabulary:

```
settlement:city
settlement:town
settlement:village
settlement:capital
settlement:colony
settlement:urban
settlement:rural
settlement:palatial
settlement:administrative-centre
settlement:port
settlement:trade-centre
settlement:frontier
settlement:garrison
```

Do not default to `settlement:urban` (or any other single value in this list) as a generic placeholder for "walled settlement" or "settlement of unspecified size." Use the most specific value the record's own text actually supports, and omit a subtype tag entirely rather than guess one — the bare `canonicalType = Settlement` is always a complete, valid classification on its own (§43).

See §7 for `harbour`/`port` cross-namespace disambiguation (v1.5.1, T15-P1-004) — `settlement:port` describes a settlement whose defining characteristic is being a port town, distinct from `infrastructure:port`/`maritime:port`.

---

## 21. Function Vocabulary

Functions are controlled values and are NOT namespaced.

Vocabulary:

```
religious
ritual
ceremonial
funerary
residential
military
administrative
political
governmental
commercial
industrial
agricultural
transport
communication
water-supply
resource-extraction
educational
recreational
entertainment
memorial
astronomical
```

A site may have multiple functions.

Example:

```
functions:
  - military
  - administrative
  - residential
```

Do not use Functions to describe physical form.

Incorrect: `functions = ["temple"]`

Correct:

```
canonicalType = Religious Site
tag = architecture:temple
functions = ["religious"]
```

**`astronomical`** is for sites documented as having been used, wholly or partly, for astronomical or calendrical observation. This applies regardless of Type — a `Monument` (stone circle), a `Religious Site` (temple), and an `Observatory` (§4.12) can all legitimately carry `astronomical` in their `functions[]` array at the same time as belonging to entirely different Types. "Observatory" and "astronomical" are NOT synonyms: `astronomical` describes a use that can attach to almost any Type, while `Observatory` is reserved for the narrow case where a purpose-built observation structure is the site's fundamental identity. A site can be both (§33d). A site can have the function without being an observatory (§33c, §33e). A site can theoretically be classified `Observatory` without `astronomical` being separately listed in `functions[]` only in the unusual case where the structure's observational use isn't otherwise documented as a function — in practice these two will almost always travel together, but they remain separate fields and neither should be inferred automatically from the other.

Do not assign `astronomical` merely because a site has a popular, fringe, or speculative astronomical interpretation attached to it. This follows the same evidence standard as every other Function/Type/Tag assignment in this taxonomy (Rule 7; §38 Migration Rule 13; §44) — require the same level of documented, credible evidence you would require before assigning any other function, not a lower bar just because astronomical claims are common in popular sources.

The same restraint applies to a caravanserai's `architecture:caravanserai` tag (§7, v1.3): the tag describes the building's form, and does not by itself justify assigning `commercial`, `transport`, or `residential` — those require their own documented evidence, exactly like `astronomical` does for stone circles.

---

## 22. Culture Vocabulary

Cultures are an open-ended controlled vocabulary.

They MUST NOT be restricted to a short hardcoded list.

Examples:

```
Ancient Egyptian
Achaemenid
Hellenistic
Roman
Byzantine
Phoenician
Punic
Celtic
Etruscan
Minoan
Mycenaean
Anglo-Saxon
Viking
Islamic
Ottoman
Medieval European
```

Culture values should be represented internally by stable IDs/slugs where possible.

Example:

```
roman
ancient-egyptian
achaemenid
hellenistic
```

The human-readable label may change without changing the ID.

---

## 23. Culture Rules

A culture may be associated with a site if there is reasonable evidence for one or more of:

- construction
- architectural tradition
- artistic tradition
- religious tradition
- language/inscription
- settlement
- occupation
- cultural reuse
- material culture

Do not assign a culture solely because a political entity controlled the site.

Example: `Political Entity: Roman Empire` does NOT automatically imply `Culture: Roman`. The association must be historically meaningful.

---

## 24. Political Entity Vocabulary

Political entities are also an open-ended controlled vocabulary.

Examples:

```
Roman Republic
Roman Empire
Byzantine Empire
Achaemenid Empire
Seleucid Empire
Ptolemaic Kingdom
Ottoman Empire
British Empire
Kingdom of Egypt
Kingdom of Macedonia
Persian Empire
```

Political entities should use stable IDs/slugs internally.

Example:

```
roman-republic
roman-empire
byzantine-empire
achaemenid-empire
```

---

## 25. Political Entity Rules

A Political Entity represents political authority, sovereignty, administration or effective control.

Do not use `Roman` as a Political Entity when `Roman Empire` is intended.

Do not use a culture as a political entity. Do not infer political control from architectural style.

A site may have multiple political entities across its history.

---

## 26. Historical Phases

Historical phases are optional. Most current sites may initially have `phases: []`.

A phase represents a significant historical episode.

Schema:

```
{
  id: "stable-phase-id",
  label: "Roman reconstruction",
  type: "reconstruction",
  chronologyIds: ["chronology-site-0001-02"],
  start: -30,
  end: 100,

  cultures: [
    "roman"
  ],

  politicalEntities: [
    "roman-empire"
  ],

  functions: [
    "religious"
  ]
}
```

**Note (v1.5.1):** the `type` field inside a phase object above is the **Historical Phase Type** (its controlled vocabulary is §27, e.g. `construction`, `modification`, `reconstruction`) — a completely different field from the Site-level `canonicalType` (§4's 14-value Type vocabulary). They share the key name `type` only because they sit at different nesting levels (inside a `phases[]` entry vs. at the record root); they are never the same field and must never be confused or flattened together by an implementation.

**Chronology is canonical; `start`/`end` are derived (revised in the independent-inspection correction pass, T15-P1-006):** `chronologyIds` references one or more full `chronology[]` entries (§55) that carry the actual sourced, qualified dating for this phase — this is the authoritative representation. `start`/`end` above are a **derived, non-editable display/export projection** computed from the referenced `chronology[]` entries, retained only for backward compatibility and lightweight consumers that don't need qualifiers, precision, or provenance. See §55's Phase↔Chronology rule for exactly how that projection is computed, what happens when multiple sourced interpretations conflict, and what a flattening operation must report. A Phase's `start`/`end` must never be hand-edited independently of `chronologyIds` — doing so is exactly the drift this revision closes off. A Phase with no `chronologyIds` yet (e.g. not-yet-enriched legacy data) may still carry manually-set `start`/`end` as a bare compatibility anchor, exactly like the Site-level legacy `year` field (§29) — but once `chronologyIds` exists, it is authoritative and `start`/`end` become its derived projection.

---

## 27. Historical Phase Types

Initial vocabulary:

```
construction
occupation
expansion
modification
renovation
conversion
destruction
abandonment
reoccupation
restoration
reconstruction
```

Potential future values:

```
foundation
refoundation
relocation
reuse
```

Do not add future values until a real use case requires them.

`discovery` and `excavation`, present in v1.3, are deprecated as Historical Phase Types in v1.5. They describe modern Investigation Events (§51), not changes that occurred during the historical life of the site. Existing records remain readable and must be migrated with provenance rather than silently rewritten.

---

## 28. Phase Rules

A phase should represent a meaningful historical change. Do NOT create phases for every minor event.

Good: "Roman reconstruction"
Bad: "Someone repaired a door" — unless that event is historically significant to the site's identity.

Good: "Converted from temple to church"
Bad: "Someone repaired a door" — unless that event is historically significant to the site's identity.

None of the gaps closed across this taxonomy's review (Pyramid, Geoglyph, Observatory, Dolmen, Stone Circle family, Nuraghe/Broch, Ziggurat/Stupa/Pagoda, submerged sites, effigy mounds, Caravanserai) represent a Historical Phase, including Observatory. Each describes a site's static physical form or use, not a chronological episode — so each was resolved as a Type, Tag, or Function instead, per Rule 6.

Historical Phases must also be distinguished from modern investigations. “Roman reconstruction” is a Phase; “excavated in 1934” is an Investigation. A modern restoration may be represented as a Phase only when it materially changed the heritage resource itself; the associated survey, excavation, documentation, or conservation project remains a linked Investigation Event.

---

## 29. Time Model

The current `year` field remains the legacy/public chronological anchor during transition. Canonical enrichment uses `chronology[]` (§55 and §60) so multiple ranges, uncertain bounds, competing interpretations, and phase-specific dates can coexist.

Example: `year: -518` means approximately 518 BCE.

Historical phases reference or contain structured chronology. They do not replace independent site-level chronological assertions.

Do not remove or repurpose the existing `year` field during migration. Do not automatically derive `year` from `phases`.

---

## 30. Multi-period Sites

Multi-period sites are expected and should NOT receive one artificial "dominant" culture.

Example:

```
cultures:
  - ancient-egyptian
  - hellenistic
  - roman

politicalEntities:
  - ptolemaic-kingdom
  - roman-empire
```

Historical differences belong in `phases`.

---

## 31. Example: Egyptian → Hellenistic → Roman Site

```
{
  canonicalType: "Religious Site",

  tags:
    - "architecture:temple"
    - "construction:stone"
    - "religion:ritual"

  cultures:
    - "ancient-egyptian"
    - "hellenistic"
    - "roman"

  politicalEntities:
    - "ptolemaic-kingdom"
    - "roman-empire"

  functions:
    - "religious"
    - "ceremonial"

  phases:
    - {
        label: "Egyptian construction",
        type: "construction",
        start: -500,
        end: -450,
        cultures: ["ancient-egyptian"]
      }

    - {
        label: "Hellenistic modification",
        type: "modification",
        start: -250,
        end: -200,
        cultures: ["hellenistic"],
        politicalEntities: ["ptolemaic-kingdom"]
      }

    - {
        label: "Roman reconstruction",
        type: "reconstruction",
        start: -30,
        end: 50,
        cultures: ["roman"],
        politicalEntities: ["roman-empire"]
      }
}
```

---

## 32. Example: Roman Castellum

```
{
  canonicalType: "Fortification",

  tags:
    - "military:castellum"
    - "military:frontier"
    - "military:garrison"
    - "architecture:fort"
    - "construction:stone"

  cultures:
    - "roman"

  politicalEntities:
    - "roman-empire"

  functions:
    - "military"
    - "administrative"
}
```

Do NOT create `canonicalType = Castellum`.
Do NOT create `culture = Roman Empire`.

---

## 33. Example: Prehistoric Cave

```
{
  canonicalType: "Cave",

  tags:
    - "cave:natural"
    - "cave:art"
    - "prehistoric:rock-art"
    - "archaeology:human-remains"
    - "construction:rock-cut"   // only if artificial modification exists

  cultures:
    - "prehistoric-culture-name"

  functions:
    - "ritual"
}
```

Only assign `construction:rock-cut` if the cave has actually been modified or created by humans.

---

## 33a. Example: Open-Air Geoglyph

```
{
  canonicalType: "Monument",

  tags:
    - "monument:geoglyph"
    - "landscape:archaeological"

  cultures:
    - "nazca"

  functions:
    - "ritual"
}
```

---

## 33b. Example: Megalithic Tomb — Dolmen

```
{
  canonicalType: "Tomb",

  tags:
    - "funerary:dolmen"
    - "prehistoric:megalithic"
    - "construction:stone"

  cultures:
    - "neolithic-local-culture"

  functions:
    - "funerary"
}
```

---

## 33c. Example: Stone Alignment With a Possible Astronomical Function (not an Observatory)

```
{
  canonicalType: "Monument",

  tags:
    - "monument:alignment"
    - "prehistoric:megalithic"

  functions:
    - "ritual"
    - "astronomical"
}
```

This stone alignment has a documented astronomical function, but it is not classified as `Observatory`: it is not a purpose-built observation structure, but a monument whose functions happen to include astronomical observation alongside others (here, ritual). The Type (`Monument`) describes what the site physically is; the Function (`astronomical`) describes one of the things it was used for. Contrast with §33d, where the site's entire built purpose was astronomical observation.

---

## 33d. Example: Purpose-Built Observatory

```
{
  canonicalType: "Observatory",

  tags:
    - "architecture:observatory"
    - "construction:stone"

  cultures:
    - "maya"

  functions:
    - "astronomical"
    - "ritual"
}
```

Here the site's fundamental, documented identity is a purpose-built astronomical observation structure, so `canonicalType = Observatory`. It also carries `astronomical` in `functions[]` (expected, though not automatically inferred — the function is still assigned on its own evidentiary basis, per §21) and, where the source supports it, an additional function like `ritual` for a documented ceremonial dimension. Type and Function coexist here without being redundant: one says what the building is, the other says what it was used for.

---

## 33e. Example: Temple With an Astronomical Function (not an Observatory)

```
{
  canonicalType: "Religious Site",

  tags:
    - "architecture:temple"
    - "construction:stone"

  functions:
    - "religious"
    - "astronomical"
}
```

This temple is documented as having incorporated astronomical/calendrical alignments as one of several functions, but its fundamental identity remains a place of worship, not a dedicated observation structure — so `type` stays `Religious Site`, not `Observatory`.

---

## 33f. Example: Caravanserai (v1.3)

```
{
  canonicalType: "Infrastructure",

  tags:
    - "architecture:caravanserai"
    - "construction:stone"

  functions:
    - "commercial"   // only if the record's own text documents trade/commercial use
}
```

The Type is `Infrastructure` because the record's own scope is the standalone waystation building. `architecture:caravanserai` records its specific form. `commercial` (or `transport`/`residential`, as applicable) is included here only because it is independently documented — it is never inferred automatically from the Tag or the Type (§21).

---

## 34. Example: Complex Archaeological City

A large archaeological city may contain temples, tombs, palaces, fortifications and infrastructure.

The site should NOT necessarily be split into multiple Types simply because it contains multiple architectural forms.

Example:

```
type:
  Settlement

tags:
  - "settlement:city"
  - "architecture:palace"
  - "architecture:temple"
  - "military:city-wall"
  - "infrastructure:road"
```

This preserves the distinction between the site as a whole and its components.

If an individual temple, fortification, or observatory is independently represented as a separate ArcheoMaps location, that location may have its own Type.

---

## 35. What NOT to Encode as Tags

Do not use Tags for:

- arbitrary country names
- political entities
- cultures
- dates
- UNESCO status
- source names
- confidence levels
- duplicate markers
- editorial notes

Examples of bad tags:

```
country:egypt
unesco
roman-empire
500-bc
wikipedia
probably-roman
```

These belong elsewhere.

---

## 36. UNESCO

UNESCO status is external provenance/status. It should remain separate from the taxonomy.

Example:

```
unesco: true
unescoIdNo: 123
```

Do NOT create `tags: - "unesco:site"` unless a future feature specifically requires a searchable UNESCO tag.

---

## 37. Existing / Legacy Taxonomy

The following legacy fields remain during migration:

```
era
eraLabel
category
secondaryType
culture
cultureSource
typeSource
```

They must NOT be silently deleted or repurposed during the first migration. The same applies to `type` itself, which is not listed above only because it was already covered by the general "existing field" framing — see `MIGRATION_RULES.md` §1.1/§3 for the explicit statement that `type` is never renamed or overwritten, and for where the new canonical Type value (`canonicalType`) is written instead.

The old `era` system is a compatibility layer. The new taxonomy becomes the future source of truth. Legacy fields may be removed only in a later explicit migration.

**Open decision (v1.5.1) — `secondaryType`:** present on exactly 1 of 2,103 live records (`site-0735`, "Batu Caves," `secondaryType: "Temple"`), with no definition or vocabulary given anywhere in v1.3, v1.5, or v1.5.1 beyond this preserve-don't-delete listing. This audit pass cannot determine the field's original purpose from the files available to it, and so does not invent one. **Left explicitly unresolved** — flagged for the project owner to determine (from project history outside this document's scope) whether it should be given a real definition and vocabulary or retired via the same explicit process already used for `category`/`eraLabel`. See `V1.5.1_CHANGE_LEDGER.md`.

---

## 38. Migration Rules

During taxonomy migration:

1. Preserve all existing historical text.
2. Preserve all coordinates.
3. Preserve all existing dates.
4. Preserve all source/provenance information.
5. Preserve existing UNESCO information.
6. Never overwrite an existing classification merely because the new taxonomy has a plausible alternative.
7. Preserve ambiguous classifications for manual review.
8. Do not invent information.
9. Do not infer political control solely from culture.
10. Do not infer culture solely from political control.
11. Do not create new Types merely to accommodate a specialised subtype.
12. Prefer Tags for specialised characteristics.
13. If a site's classification is genuinely uncertain, use a **null value plus a workflow review flag** — never fabricate certainty. `Other` is reserved for the different, confident case where the evidence positively supports "none of the 13 specific Types fit"; it is a terminal classification, not a review-pending state. See §4.14 (v1.5.1 correction, T15-P0-004) for the full distinction and why the two must not be treated as interchangeable.
14. A record whose current `type` is exactly "Ruins" with no other classifying information defaults to `Archaeological Site` + `archaeology:ruins`, not a guessed specific Type — unless the source `text` clearly indicates a more specific nature.
15. A record whose current `type` is a purely natural feature (mountain, crater, cave formation, etc.) with no documented cultural/historical content is left as `Other` or unclassified, not forced into `Landscape`.
16. `canonicalType = Observatory` and `astronomical` in `functions[]` require the same standard of documented evidence as any other classification (§44) — a popular or speculative astronomical claim about a site is not sufficient on its own for either.
17. Classify a record according to what the record itself fundamentally represents, not according to any single component or feature mentioned within its text (see `MIGRATION_RULES.md` §8 for the full general statement of this principle, added when auditing the Pyramid/Cairn/Mound/Wall migration rules against this taxonomy).

---

## 39. Confidence and Provenance

Every newly automated classification should be capable of being traced back to its source.

The system should eventually support provenance per classification dimension, for example:

```
typeSource
tagsSource
cultureSource
politicalEntitySource
functionSource
phaseSource
```

This does NOT require all provenance fields to be implemented in the first UI migration. However, the data model should not prevent them from being added. `MIGRATION_RULES.md` §4–§5 defines a fuller, value-level version of this concept (separate provenance and workflow-state objects, with per-entry tracking for array fields like `tags`) that is compatible with, and supersedes, the simple per-dimension sketch above for migration purposes.

---

## 40. Stable IDs

All controlled vocabulary values should eventually have stable IDs.

Example:

```
roman-empire
roman
fortification
military:castellum
```

The human-readable label should be separate from the stable ID.

Example registry:

```
{
  id: "roman-empire",
  label: "Roman Empire"
}
```

This prevents filtering and data integrity problems when display names change.

---

## 41. Synonyms and Normalization

The following should resolve to the same canonical value where appropriate:

```
fort
fortress
fortified site
```

may all resolve to `canonicalType = Fortification`, while retaining specific terminology as Tags:

```
military:fort
military:fortress
military:castellum
```

Do not create separate canonical Types merely because English has multiple overlapping words.

---

## 42. Historical Terminology

Historically specific terminology SHOULD be preserved as Tags when it provides useful information.

Examples:

```
military:castellum
military:hillfort
architecture:basilica
funerary:kurgan
funerary:dolmen
military:nuraghe
military:broch
architecture:observatory
architecture:caravanserai
prehistoric:megalithic
```

The taxonomy should not erase historical terminology simply to make the database simpler.

The Type provides the broad searchable classification. The Tag preserves the historical specificity.

---

## 43. Do Not Over-tag

A site does not need every technically applicable tag.

Only add a tag when:

1. it is historically meaningful
2. it is supported by the source
3. it improves filtering, discovery or interpretation

Avoid:

```
canonicalType = Fortification

tags:
  - military:fort
  - military:fortification
  - military:defensive-wall
  - archaeology:archaeological-site
  - archaeology:site
  - construction:stone
  - construction:built
  - construction:structure
```

when several of these add no useful distinction. This applies equally to `architecture:observatory` on a record already typed `Observatory` — see §7 — and to `archaeology:archaeological-site` on a record already typed `Archaeological Site` — see §8. Neither Tag should be added purely to restate the Type; add it only when it contributes information the Type alone does not already carry. The same restraint applies to defaulting a specific subtype tag (e.g. `settlement:urban`, `military:city-wall`) onto every record of a broader Type merely because it is a plausible-looking value — see §20.

---

## 44. Ambiguous Classification

If a source does not provide enough evidence to classify a site at all: leave `canonicalType: null` and attach a workflow review flag. Do NOT guess, and do not use `Other` for this case — `Other` (§4.14) is reserved for the confident, positive conclusion that none of the 13 specific Types fit; it does not enter review. See §4.14 for the full v1.5.1 correction (T15-P0-004).

Particularly avoid guessing:

- political entities
- cultures
- dates
- functions (including `astronomical`)
- specific architectural types
- whether a site is an `Observatory` rather than a Monument/Religious Site with an astronomical function

---

## 45. Future Extensions

The taxonomy is intentionally designed to support future systems without requiring another fundamental redesign.

### Historical political boundaries

Political entities may eventually have:

```
start
end
geometry
parentEntity
successorEntity
```

This belongs in a separate Political Entity registry, not inside every site record.

### Historical routes

Individual route segments are already representable as `LineString` geometry today (§54, §12, v1.5.1 correction T15-P1-007). What remains a future extension specifically is a dedicated named-route *entity* — e.g. one first-class "Silk Road" or "Via Appia" resource that aggregates and relates many segment records — as a separate geometry/entity system, rather than each segment existing only as an independent, unrelated LineString record.

### Detailed historical phases

`phases` may eventually become rich temporal records containing:

```
start
end
event type
culture
political entity
function
description
source
```

---

## 46. Taxonomy Philosophy

ArcheoMaps is not intended to become an encyclopaedia of every historical concept.

Its taxonomy should answer useful questions such as:

- "Show me Roman fortifications."
- "Show me prehistoric caves with rock art."
- "Show me religious sites associated with Egyptian culture."
- "Show me sites that were under Roman political control."
- "Show me places that had military and administrative functions."
- "Show me sites that changed function over time."
- "Show me megalithic monuments."
- "Show me purpose-built observatories" — distinct from "show me sites with a possible astronomical function," which is a broader, separate question spanning multiple Types.
- "Show me caravanserais" — a specific waystation building type, regardless of whether the individual record's Type ended up as Infrastructure, Settlement, or Archaeological Site.

The taxonomy is successful when these questions can be answered without requiring dozens of redundant categories.

---

## 47. Most Important Rule

When deciding between creating a new Type and adding a Tag, prefer the Tag unless the distinction represents a genuinely different fundamental kind of site.

Example:

```
Roman castellum
    Type: Fortification
    Tag: military:castellum

Rock-cut tomb
    Type: Tomb
    Tag: funerary:rock-cut-tomb

Sacred cave
    Type: Cave
    Tag: cave:ritual

Megalithic temple
    Type: Religious Site
    Tag: construction:megalithic

Dolmen
    Type: Tomb
    Tag: funerary:dolmen

Geoglyph
    Type: Monument
    Tag: monument:geoglyph

Stone circle used for solstice observation
    Type: Monument
    Tag: monument:stone-circle
    Function: astronomical

Caravanserai
    Type: Infrastructure (or Settlement, if the record's scope is the wider settlement)
    Tag: architecture:caravanserai

Purpose-built astronomical observatory (Maya, or early modern European)
    Type: Observatory   -- a genuine exception: see §4.12 for why
                            the existing Types cannot represent this
                            without distortion. NOT a Tag on
                            Religious Site, Monument, or Archaeological Site.
```

This principle should be followed consistently throughout the dataset. `Observatory` is the only case across this taxonomy's entire design and review process where that principle was overridden — every other proposal, including the v1.3 caravanserai gap, was resolved as a Tag or Function instead.

---

## 48. Evidence and Manifestation

Evidence answers:

> “How is this place physically manifested, observed, or identified?”

This is distinct from Type (what the place is), Condition (what survives), Investigation (what researchers did), and Provenance (why ArcheoMaps believes a particular assertion).

A site may have multiple evidence observations, each dated and sourced:

```json
{
  "evidence": [
    {
      "id": "evidence-site-0001-01",
      "form": "earthwork",
      "identifiedBy": "lidar",
      "observedAt": "2025-04-17",
      "locationId": "location-site-0001-01",
      "confidence": "high",
      "sourceIds": ["source-001"]
    }
  ]
}
```

Initial Evidence Form vocabulary:

```
standing-remains
structural-remains
ruins
earthwork
buried-remains
surface-scatter
surface-deposit
cropmark
soilmark
parchmark
geophysical-anomaly
remote-sensing-anomaly
submerged-remains
rock-art
artefactual-evidence
human-remains
hominin-remains
documentary-evidence
cartographic-evidence
place-name-evidence
oral-tradition
conjectural
no-visible-remains
```

`hominin-remains` (added v1.5.1, T15-P2-001 correction; wording revised in the independent-inspection correction pass) is defined operationally as **paleoanthropological fossil evidence involving hominins, particularly remains catalogued in deep-prehistory or human-evolution research contexts** — for example, finds attributed to *Homo erectus*, *Homo neanderthalensis*, or other hominin taxa studied as part of the human lineage's evolutionary record. This is not a claim that such remains are somehow not human — Neanderthals and other members of genus *Homo* are very much part of human evolutionary history — it is a *disciplinary/contextual* distinction: `hominin-remains` marks evidence being evaluated in a paleoanthropological, deep-time framework, where `human-remains` (§8, §18) remains the correct value for the ordinary archaeological, osteological, funerary, or forensic classification of human skeletal remains where that more specialized paleoanthropological distinction isn't required. A record may need either depending on how its evidence is actually being characterized, not on any judgment about which remains "count" as human. This redirects the 6 live records previously using the unregistered Tag `archaeology:hominid-fossils` to this Evidence Form value instead of a Tag.

Initial Identification Method vocabulary:

```
field-observation
excavation
fieldwalking
aerial-photography
satellite-imagery
lidar
geophysical-survey
remote-sensing
historical-map
documentary-source
place-name
oral-history
reported-location
unknown
```

Rules:

1. Evidence observations must carry a source or an explicit unsourced/legacy workflow warning.
2. `conjectural` never substitutes for a Type or exact coordinate.
3. Satellite imagery used by a curator to adjust a coordinate is an inspection aid; it becomes recorded evidence only when the visible feature legitimately supports the archaeological assertion and the imagery/source is cited.
4. Evidence may change as new surveys occur. Do not overwrite an older sourced observation merely because a newer one exists.
5. Evidence Form and Identification Method are separate: `earthwork` may be identified by field observation, lidar, aerial photography, or several methods.

---

## 49. Condition Assessments

Condition answers:

> “What survives, and in what state at the time of assessment?”

Condition is time-dependent and therefore stored as repeatable assessments, not permanent Tags.

```json
{
  "conditionAssessments": [
    {
      "id": "condition-site-0001-01",
      "condition": "partially-preserved",
      "assessedAt": "2025-01-01",
      "scope": "whole-site",
      "description": "",
      "sourceIds": ["source-001"]
    }
  ]
}
```

Initial vocabulary:

```
intact
well-preserved
partially-preserved
fragmentary
ruinous
buried
submerged
reconstructed
restored
relocated
damaged
destroyed
lost
unknown
```

Rules:

- A reconstructed site may also preserve original fabric; assessments may apply to a component rather than the whole site.
- `destroyed` means the heritage resource is known but no longer survives materially. It does not delete the Place record.
- `lost` means the resource's present physical location or survival is unknown; it is not a synonym for destroyed.
- Condition must not determine Type automatically.
- Current Condition may be derived for display only from the most recent applicable assessment; the complete assessment history remains canonical.

---

## 50. Components

Components answer:

> “What meaningful structures or parts compose this resource?”

Use Components when a part is important enough to describe independently but does not yet require its own mapped Site record.

```json
{
  "components": [
    {
      "id": "component-site-0001-temple-a",
      "preferredName": "Temple A",
      "componentType": "architecture:temple",
      "description": "",
      "chronology": [],
      "locationIds": [],
      "functions": ["religious"],
      "sourceIds": ["source-001"],
      "representedBySiteId": null
    }
  ]
}
```

Rules:

1. A Tag states that the represented resource has a characteristic; a Component identifies a particular part.
2. A separately mapped component uses `representedBySiteId` and a reciprocal Site relationship. Do not duplicate its complete record inside the parent.
3. Components may have their own chronology, condition, evidence, functions and location.
4. Do not create Components for every wall, room, stone or posthole. They must be useful to ArcheoMaps discovery, interpretation, navigation, or future marker enrichment.
5. Record scope still governs Type: a city containing a temple remains a Settlement when the record represents the city.

---

## 51. Investigations

Investigations answer:

> “How, when, and by whom was the place studied, documented, sampled, excavated, or conserved?”

Investigations are modern or scholarly Activities, not Historical Phases of the ancient site.

```json
{
  "investigations": [
    {
      "id": "investigation-site-0001-1995",
      "investigationType": "excavation",
      "label": "1995 excavation campaign",
      "start": 1995,
      "end": 1995,
      "actorIds": ["actor-001"],
      "locationIds": [],
      "methods": [],
      "resultSourceIds": ["source-001"]
    }
  ]
}
```

Initial Investigation Type vocabulary:

```
discovery
desk-based-assessment
field-survey
fieldwalking
excavation
trial-trenching
test-pit
watching-brief
building-survey
aerial-survey
lidar-survey
geophysical-survey
remote-sensing
underwater-survey
sampling
dating-analysis
laboratory-analysis
condition-assessment
conservation
restoration-project
documentation
publication
```

Rules:

- Detailed trenches, contexts, stratigraphic units, samples, finds, and laboratory results remain linked specialist resources; they do not belong in the basic Site schema.
- Investigation results may support new Evidence, Chronology, Condition, Type, Tag, Culture, Political Entity, Function, or Phase assertions. The investigation does not automatically populate them.
- `discovery` and `excavation` imported from legacy `phases` are routed here with provenance.
- Historical digging that materially altered the site may be represented both as an Investigation and, where justified, as a site Modification/Destruction Phase. The two records answer different questions.

---

## 52. Materials and Techniques

Materials and Techniques answer two separate questions:

- Material: “What is it made from?”
- Technique: “How was it constructed or worked?”

```json
{
  "fabric": {
    "materials": ["limestone", "timber"],
    "techniques": ["dry-stone-masonry", "rock-cut"]
  }
}
```

These are open controlled registries. Every entry must have a stable ID, label, definition, aliases, status, and optional external mappings.

Initial broad Material seed vocabulary:

```
stone
limestone
sandstone
granite
marble
basalt
flint
obsidian
brick
mudbrick
adobe
earth
clay
timber
wood
concrete
mortar
plaster
metal
glass
organic-material
mixed
unknown
```

Initial Technique seed vocabulary:

```
dry-stone-masonry
ashlar-masonry
rubble-masonry
cyclopean-masonry
megalithic-construction
rock-cut
earthwork-construction
rammed-earth
timber-framing
post-and-lintel
corbelling
vaulting
domed-construction
colonnaded-construction
```

Rules:

- These are seed lists, not a claim of global completeness.
- Geological precision should follow the cited source; Scribe must not promote generic `stone` into a guessed lithology.
- Physical form such as temple, bridge, dome, wall, or column remains an architectural Tag/Component, not a Material.
- Material/Technique entries may apply to a whole site, phase, component, or evidence observation.

---

## 53. Names and Appellations

A Place is not identical to its current display name. Names can vary by language, script, period, source, political context, and scholarly interpretation.

```json
{
  "names": [
    {
      "id": "name-site-0001-01",
      "name": "Göbekli Tepe",
      "kind": "preferred",
      "language": "tr",
      "script": "Latn",
      "chronology": [],
      "confidence": "high",
      "sourceIds": ["source-001"]
    }
  ]
}
```

Initial Name Kind vocabulary:

```
preferred
alternate
ancient
historical
modern
local
official
traditional
translated
transliterated
scholarly
excavation-code
former
disputed
unknown
```

Rules:

- One name is selected as the current preferred display name, but all names keep independent IDs.
- Language uses BCP 47/ISO-compatible identifiers where known; script uses ISO 15924 codes where known.
- A dated attestation concerns that Name, not automatically the entire lifetime of the Site.
- Names may be disputed or share identical text while referring to different places.
- Relationships always use stable IDs, never name strings.

---

## 54. Locations, Geometry, Precision, and Coordinate Sensitivity

A Place may have multiple proposed, historical, representative, or component Locations. It may be unlocated. A point is not required merely because the public map currently renders markers.

```json
{
  "locations": [
    {
      "id": "location-site-0001-01",
      "geometry": {
        "type": "Point",
        "coordinates": [38.9226, 37.2231]
      },
      "locationType": "site-centroid",
      "precision": "site",
      "uncertaintyMetres": 50,
      "chronology": [],
      "confidence": "high",
      "preferredForMap": true,
      "sourceIds": ["source-001"]
    }
  ]
}
```

Supported geometry families: `Point`, `LineString`, `Polygon`, and their Multi-geometry equivalents. Geometry follows GeoJSON longitude/latitude order internally. Scribe must display clearly labelled Latitude and Longitude fields.

Initial Location Type vocabulary:

```
exact-feature
site-point
site-centroid
entrance
component
representative
source-supplied
hypothesised
findspot
extent
route-segment
unknown
```

Initial Precision vocabulary:

```
exact-feature
site
complex
locality
regional
representative
approximate
unknown
```

Rules:

1. Every Location carries source, certainty, precision, and when possible numeric uncertainty.
2. A source-supplied representative point is never silently relabelled exact.
3. Conflicting proposed Locations coexist until reviewed; one may be preferred for public display.
4. A coordinate correction creates a revision containing old/new value, reason, curator, date, and evidence.
5. Routes, borders, coastlines, ice sheets, rivers, and other time-varying regional geometries remain separate Layer resources even though they use the same geometry standards.
6. Sensitive or vulnerable locations may retain exact canonical geometry while publishing an obfuscated or withheld projection.

Coordinate visibility:

```json
{
  "coordinateVisibility": {
    "access": "public",
    "publicPrecision": "site",
    "reason": null
  }
}
```

Initial access values: `public`, `generalised`, `restricted`, `withheld`.

---

## 55. Chronology and Period Definitions

Chronology answers:

> “When is this place, component, phase, name, location, function, condition, or relationship dated or attested?”

Canonical enrichment uses repeatable assertions:

```json
{
  "chronology": [
    {
      "id": "chronology-site-0001-01",
      "label": "Main occupation",
      "start": { "year": -9600, "qualifier": "circa", "precision": "century" },
      "end": { "year": -8200, "qualifier": "circa", "precision": "century" },
      "basis": "published-range",
      "periodDefinitionIds": [],
      "confidence": "medium",
      "preferred": true,
      "sourceIds": ["source-001"]
    }
  ]
}
```

**Chronology is canonical; Phase `start`/`end` are a derived projection (revised in the independent-inspection correction pass, T15-P1-006):** the first v1.5.1 pass allowed a Historical Phase's own `start`/`end` (§26 — bare integers) to be independently editable alongside linked `chronology[]` entries, with the sourced entry merely "winning on conflict." On review this was insufficient — it permitted silent drift between the two representations and gave no answer for what happens when *multiple* sourced chronology entries conflict with each other, only for the simpler two-value case. The corrected policy:

1. `chronology[]` is the sole canonical representation of dates, for both Sites and Phases. A Phase's `chronologyIds` array (§26) links it to one or more `chronology[]` entries; that link is the authoritative statement of when the phase occurred.
2. Multiple conflicting sourced interpretations may coexist as separate `chronology[]` entries, exactly as already stated above for Site-level chronology — this is unchanged and now applies identically to Phase-linked chronology.
3. Which linked entry supplies the Phase's public-facing `start`/`end` projection is determined, in order, by: (a) `preferred: true`, if exactly one linked entry has it; (b) failing that, the entry with the highest `confidence` value among linked entries that have passed review (are not themselves sitting in an unresolved `needs-research`/`disputed` relationship-or-workflow state); (c) failing that — i.e. a genuine tie on both preferred-flag and confidence — the projection cannot be computed deterministically from the data alone and the Phase's `start`/`end` must be left as the prior manually-set compatibility values (or absent, if none exist) rather than guessing which tied entry to prefer; this case should also raise a `workflow.enrichment` entry (`dimension: "chronology"`, reason `conflicting-sources`, `MIGRATION_RULES_v2.6.md` §5.4) so it surfaces for curatorial resolution rather than sitting silently unresolved.
4. **The mere presence of a `sourceIds` citation does not by itself make an entry authoritative** — an entry with a citation but low `confidence` or unresolved review status does not automatically outrank a `preferred: true` entry or a higher-confidence entry. Step 3's ordering is the complete rule; there is no separate "has a source" tiebreaker outside it.
5. Once `chronologyIds` exists on a Phase, its `start`/`end` fields are **derived, not independently editable** — they are computed from step 3 above, deterministically, from the current state of the linked `chronology[]` entries. A Phase with no `chronologyIds` yet may still carry manually-set `start`/`end` as a bare compatibility anchor (§26), but the moment `chronologyIds` is populated, that anchor becomes the derived output of steps 1–3, not an independent value someone can hand-edit.
6. **No linked `chronology[]` entry may silently overwrite another.** Adding a new, better-sourced interpretation creates a new `chronology[]` entry (or updates its own `preferred`/`confidence`/review fields); it never deletes or mutates a competing entry to make room for itself.
7. **Flattening to a display/export projection must report what was lost or reduced**, per the general flattening/loss-reporting guarantee (§60 migration invariant 5) — specifically: which alternative sourced interpretations exist but weren't selected, what qualifier/precision was reduced or dropped to produce a bare integer, and (if step 3(c) applied) that no deterministic selection was possible and why.

See the worked fixture immediately below for a concrete case with two conflicting sourced interpretations.

#### Fixture: two conflicting sourced chronological interpretations for one Phase

A Phase ("Main reconstruction") for a hypothetical site has two independently sourced dating proposals that disagree:

```json
{
  "chronology": [
    {
      "id": "chronology-site-0099-01",
      "label": "Reconstruction (excavation report A)",
      "start": { "year": 250, "qualifier": "circa", "precision": "decade" },
      "end":   { "year": 270, "qualifier": "circa", "precision": "decade" },
      "basis": "stratigraphy",
      "confidence": "high",
      "preferred": true,
      "sourceIds": ["source-excavation-report-a"]
    },
    {
      "id": "chronology-site-0099-02",
      "label": "Reconstruction (inscription-based dating, source B)",
      "start": { "year": 310, "qualifier": "exact", "precision": "year" },
      "end":   { "year": 310, "qualifier": "exact", "precision": "year" },
      "basis": "inscription",
      "confidence": "medium",
      "preferred": false,
      "sourceIds": ["source-inscription-b"]
    }
  ],
  "phases": [
    {
      "id": "phase-site-0099-01",
      "label": "Main reconstruction",
      "type": "reconstruction",
      "chronologyIds": ["chronology-site-0099-01", "chronology-site-0099-02"],
      "start": 250,
      "end": 270
    }
  ]
}
```

**Deterministic projection:** step 3(a) applies — exactly one linked entry (`chronology-site-0099-01`) has `preferred: true` — so the Phase's `start`/`end` (250, 270) are derived from it, despite `chronology-site-0099-02`'s more precise `exact`/`year` qualifier; precision alone does not override the `preferred` flag. **A flattened export of this Phase must report:** that an alternative interpretation exists (`chronology-site-0099-02`, inscription-based, dated 310, medium confidence) which was not selected, and that the displayed `250`–`270` reflects `circa`/`decade` precision rather than an exact date. If `chronology-site-0099-01`'s `preferred` flag were removed (a tie on preference, and both entries at different confidence — `high` vs. `medium`), step 3(b) would instead select it for its higher confidence, with the same loss-reporting obligation for the unselected `source-inscription-b` entry. Only if both `preferred` and `confidence` were tied would step 3(c) apply and the projection be left unresolved pending curatorial review.

---

Initial qualifiers:

```
exact
circa
before
after
not-before
not-after
estimated
inferred
unknown
```

Initial precision values:

```
day
year
decade
century
millennium
period
unknown
```

Initial basis values:

```
historical-date
inscription
published-range
radiocarbon
dendrochronology
archaeomagnetic
thermoluminescence
stratigraphy
artefact-typology
architectural-style
documentary-attestation
legacy-era-band
text-extraction
manual-estimate
unknown
```

ArcheoMaps v1.x retains its established integer convention: negative values represent BCE directly (`-518` = approximately 518 BCE), positive values represent CE, and there is no public year zero. This convention is preserved through v1.5 to avoid silent shifts in 2,103 records. A future v2 may adopt astronomical numbering only through an explicit, tested migration.

Period Definitions are sourced and geographically scoped concepts, not universal date labels:

```json
{
  "id": "period-western-europe-iron-age-source-a",
  "label": "Iron Age",
  "spatialScopeIds": ["region-western-europe"],
  "start": { "year": -800, "qualifier": "circa" },
  "end": { "year": 100, "qualifier": "circa" },
  "sourceIds": ["source-period-a"],
  "externalMappings": []
}
```

Rules:

- Neolithic, Iron Age, Late Antiquity, Medieval, and similar terms do not imply one global date range.
- Preserve quoted source wording alongside normalized structured bounds.
- Conflicting chronological assertions may coexist; one may be preferred but the others are not deleted.
- Never manufacture an exact midpoint from a broad era solely to satisfy the public timeline.
- The compatibility `year` remains an explicitly derived display/filter anchor and records its derivation.
- Unknown dates must be filterable as Unknown; they must not silently pass every date query.

---

## 56. Actors and Organisations

Actors are people, groups, communities, dynasties, research teams, institutions, heritage authorities, and other agents connected to Sites, Sources, Phases, Investigations, or assertions.

```json
{
  "actors": [
    {
      "id": "actor-001",
      "preferredName": "",
      "actorType": "organisation",
      "alternateNames": [],
      "sourceIds": []
    }
  ]
}
```

Initial relationship roles include:

```
builder
commissioner
architect
ruler
associated-person
occupying-group
excavator
surveyor
researcher
research-organisation
heritage-authority
data-provider
source-author
photographer
```

Rules:

- Culture and Political Entity remain classification/association registries, not substitutes for individual or organisational Actors.
- Actor relationships are sourced and, where relevant, dated.
- Do not infer a named builder, ruler, excavator, or organisation from general historical context.

---

## 57. Heritage Designations, Threats, Access, and Protection

These are external or current administrative states and must remain separate from archaeological taxonomy.

Heritage designation:

```json
{
  "heritage": [
    {
      "programme": "unesco-world-heritage",
      "externalId": "86",
      "relationship": "direct-property",
      "designatedAt": 1986,
      "sourceIds": ["source-unesco-86"]
    }
  ]
}
```

Threat assessment:

```json
{
  "threatAssessments": [
    {
      "threat": "coastal-erosion",
      "severity": "high",
      "assessedAt": "2026-01-01",
      "sourceIds": ["source-001"]
    }
  ]
}
```

Threat seed vocabulary:

```
erosion
coastal-erosion
flooding
sea-level-rise
drought
wildfire
extreme-weather
vegetation
agriculture
development
quarrying
mining
pollution
tourism-pressure
vandalism
looting
conflict
neglect
structural-instability
unknown
```

Access/visitor information may record public accessibility, opening information, accessibility notes, restrictions, and source/review date. Because these values change frequently, they require timestamps and must not be copied indefinitely without review.

Legal protection and Heritage designation are not synonyms. A site may have several local, national, and international designations.

---

## 58. External Vocabulary Alignment

ArcheoMaps remains its own application profile. It does not copy the full scope of any one external ontology or thesaurus. Canonical registry entries may carry mappings:

```json
{
  "externalMappings": [
    {
      "scheme": "getty-aat",
      "uri": "http://vocab.getty.edu/aat/...",
      "relation": "closeMatch"
    }
  ]
}
```

Initial mapping targets:

- Getty Art & Architecture Thesaurus (forms, materials, techniques, cultures)
- Getty Thesaurus of Geographic Names (places and historical geography)
- FISH/Historic England vocabularies (monument types, evidence, components, materials, investigations, periods, threats)
- PeriodO (published regional period definitions)
- Pleiades (ancient place, name, location, and connection identifiers)
- Wikidata (cross-reference and reconciliation only, not the sole controlled vocabulary)
- CIDOC CRM / CRMarchaeo concepts (semantic interoperability)

Mapping relations follow SKOS-style semantics where applicable: `exactMatch`, `closeMatch`, `broadMatch`, `narrowMatch`, `relatedMatch`.

Rules:

1. External mappings are claims requiring review; matching labels alone is insufficient.
2. An ArcheoMaps concept retains its stable ID even when an external URI changes or is deprecated.
3. Multiple external mappings may coexist.
4. A source adapter may use mappings to propose values but may not silently force a close/broad match into an exact canonical value.
5. CIDOC CRM is an interoperability model, not Scribe's literal user-interface schema.

---

## 59. Registry Governance and Unknown-Term Quarantine

Every controlled-vocabulary registry entry must support:

```json
{
  "id": "monument:stone-circle",
  "label": "Stone circle",
  "definition": "",
  "scopeNote": "",
  "status": "active",
  "aliases": [],
  "broader": [],
  "narrower": [],
  "incompatibleWith": [],
  "externalMappings": [],
  "createdAt": "",
  "modifiedAt": "",
  "sourceIds": []
}
```

Status vocabulary:

```
active
proposed
deprecated
rejected
quarantined
```

Unknown imported terms follow this workflow:

1. Preserve the raw value and source.
2. Attempt alias/exact-ID reconciliation.
3. If no safe match exists, create a quarantined proposal.
4. A curator may map it to an existing concept, approve a new concept, split a compound value across dimensions, reject it, or defer it.
5. Only active registry IDs may enter canonical fields.
6. Rejected/deprecated source wording remains discoverable through provenance and aliases.

No application may construct the complete editor vocabulary solely from values present in the current dataset. Public faceted filters may hide zero-result values, but Scribe must load the authoritative registries.

---

## 60. v1.5 Compatibility and Migration Policy

Version 1.5 is additive and transitional. Existing records and legacy fields remain readable until an explicit migration is approved.

Preferred field names/cardinalities:

| Concept | v1.5.1 preferred field | Cardinality |
|---|---|---:|
| Type | `canonicalType` | 0..1 |
| Tags | `tags` | 0..n |
| Cultures | `cultures` | 0..n |
| Political Entities | `politicalEntities` | 0..n |
| Functions | `functions` — **RESOLVED v1.5.1 (independent-inspection pass, T15-P0-002)**, see below | 0..n |
| Chronology | `chronology` | 0..n |
| Historical Phases | `phases` | 0..n |
| Evidence | `evidence` | 0..n |
| Conditions | `conditionAssessments` | 0..n |
| Components | `components` | 0..n |
| Investigations | `investigations` | 0..n |
| Relationships | `relationships` — vocabulary now defined, §63 (v1.5.1, T15-P0-003) | 0..n |
| Names | `names` | 1..n for canonical v2 candidates |
| Locations | `locations` | 0..n |

**`function` vs. `functions` — RESOLVED (v1.5.1, independent-inspection correction pass, T15-P0-002):** the canonical field is `functions` (plural). This was left open in the first v1.5.1 pass; it is resolved here rather than left open further, per explicit instruction. The compatibility policy:

1. Scribe and all new enrichment write `functions` only. Every canonical schema and worked example in this document uses `functions`, never singular `function`, except where explicitly discussing the legacy field itself (as in this paragraph and the legacy-mapping row below).
2. Import adapters accept both the legacy singular `function` and the canonical plural `functions` as input. Where a record has both, they are merged by exact normalized value (case- and whitespace-normalized string match) with per-value provenance recording which key each value came from — neither key silently overwrites the other; the merge is a union, not a replacement.
3. The current public ArcheoMaps application (`index.html`) may continue reading the legacy singular `function` key until its own, separate compatibility update — **not modified in this pass**. That future update should read both `function` and `functions` during its own transition window.
4. Flattening a canonical record to the existing public/runtime projection format (§60's flattening/loss-reporting guarantee, migration invariant 5) may emit a `function` key as a compatibility projection of `functions`, with that conversion itself recorded in the change report — this is a projection for the legacy consumer, not a second canonical field.
5. `MIGRATION_RULES.md` §4.2 is corrected to match (see `MIGRATION_RULES_v2.6.md` §4.2, independent-inspection pass).

This closes the T15-P0-002 open decision for `functions`. It does not resolve the *other* five open decisions below, which remain open.

Legacy-runtime mappings:

| Current value | v1.5.1 preferred destination | Transitional treatment |
|---|---|---|
| `culture` | `cultures[]` | Preserve raw value; normalize through registry/alias review |
| `function[]` | `functions[]` — **resolved, not pending** (see above) | Import adapters accept both; merge by normalized value, per-value provenance, no silent overwrite |
| `year` | derived compatibility anchor plus `chronology[]` candidate | Never infer unsupported start/end |
| `n` | preferred Name assertion | Copy verbatim |
| `lat`/`lon` | preferred Location assertion | Add unknown/source-supplied precision until reviewed |
| `partOf` name string | `relationships[]` using IDs, `relationshipType: "part-of"` (§63) | Resolve; ambiguous names enter review |
| `source` | `sources[]` | Convert to structured Source without deleting URL |
| `img` | `media[]` | Add rights/source status where known |
| `unesco*` | `heritage[]` | Preserve direct/parent/component relationship |

Tag relocation guidance:

| Existing Tag family/value | Preferred v1.5.1 dimension | Compatibility rule |
|---|---|---|
| `archaeology:excavated` | Investigations | Keep readable; new assertions use Investigation Event |
| `archaeology:well-preserved`, `partially-preserved`, `destroyed`, `lost-site`, `reconstructed` | Condition Assessments | Do not delete until migrated |
| `archaeology:buried`, `submerged`, `subterranean` | Evidence and/or Condition | Context determines split; no blind one-to-one rewrite |
| `construction:stone`, `brick`, `mudbrick`, `concrete`, `timber` | Materials | Preserve Tag compatibility during transition |
| `construction:rock-cut`, `earthwork`, `vaulted`, `domed`, `colonnaded` | Techniques and/or architectural form | Curator reviews compound meaning |
| `prehistoric:palaeolithic` through `iron-age` | Period Definitions / Chronology | Keep Tags until geographic/source-specific periods exist |
| `architecture:*` | Tags or Components | Tag for characteristic; Component for identified part |
| `archaeology:hominid-fossils` | Evidence (`hominin-remains`, §48) | v1.5.1: adjudicated — not a Tag (T15-P2-001) |
| `monument:ceremonial` | Functions (`ceremonial`, §21) | v1.5.1: adjudicated — not a Tag relocation (T15-P1-002) |
| `funerary:tomb` | *(none — retire)* | v1.5.1: adjudicated — migrate to a specific subtype or bare `canonicalType: Tomb` (T15-P1-003) |
| `architecture:rock-cut-temple` | `architecture:temple` + `construction:rock-cut` | v1.5.1: adjudicated — split compound value (T15-P1-005) |
| `archaeology:cave-art` | `cave:art` and/or `prehistoric:cave-art` | **v1.5.1: OPEN — context-dependent, no blanket rule (T15-P1-002)** |
| `infrastructure:irrigation` | possibly distinct from `industry:irrigation`, not a merge target | **v1.5.1: OPEN (T15-P1-002)** |
| `architecture:nuraghe` | possibly `architecture:nuraghe`/`architecture:broch` should exist alongside `military:nuraghe`/`military:broch` | **v1.5.1: OPEN — requires curatorial sign-off, not resolved here** |

Of the 18 live tag values originally found outside the v1.3/v1.5 registry: 5 are resolved in v1.5.1 (`funerary:mausoleum`, `architecture:minaret`, `infrastructure:stepwell` registered; `monument:trilithon` folded into existing values; `monument:standalone` marked for removal), 2 are redirected out of the Tag system entirely (`archaeology:hominid-fossils` → Evidence, `monument:ceremonial` → Functions), 1 is explicitly rejected rather than registered (`funerary:tomb` — migrate, don't register), 1 is split (`architecture:rock-cut-temple`), 4 remain deliberately open pending curatorial adjudication (`archaeology:cave-art`, `infrastructure:irrigation`, `architecture:nuraghe`, `monument:assembly-site`), and 4 are deferred as safe future extensions with no action in this pass (`monument:runestone`, `:cross`, `:relief`, `monument:earthwork`).

Migration invariants:

1. Preserve all 2,103 stable IDs, names, coordinates, descriptions, legacy fields, sources, provenance, workflow, order, and unknown values.
2. A no-edit import/export round trip must produce no semantic change.
3. Every transformation emits a machine-readable change report.
4. No source adapter or scraper writes directly to canonical records; it creates staged assertions.
5. Flattening v1.5 data for the current public ArcheoMaps format must report every omitted or reduced value.
6. Scribe, ArcheoMaps, and Curator must ultimately consume the same registry package.
7. v1.5 becomes v2 only after field names, vocabularies, chronology convention, regression fixtures, dry-run results, Scribe behavior, and public projections are approved.

---

## 61. v1.5.1 Review Gates

Version 1.5.1 remains provisional, exactly like v1.5, until:

- [ ] All current fields have preserve/map/retire decisions. *(`secondaryType` still open — §37.)*
- [~] The 18 out-of-taxonomy Tags are adjudicated. *(v1.5.1: 14 of 18 resolved one way or another; 4 remain explicitly open — see §60's adjudication table.)*
- [x] The `relationships` dimension has a defined initial vocabulary. *(v1.5.1, §63 — was previously entirely missing, T15-P0-003.)*
- [ ] Evidence, Condition, Investigation, Material, Technique, Period, and relationship seed vocabularies are tested against real records.
- [ ] At least five difficult multi-period sites are modelled end to end.
- [ ] A lost/unlocated site, uncertain coordinate, polygonal complex, component hierarchy, modern excavation, destroyed site, disputed date, and sensitive location are included as fixtures.
- [ ] UNESCO direct-property, parent-property, and named-component cases are represented.
- [ ] The full 2,103-record migration dry run has zero silent loss.
- [ ] Machine-readable schemas and registries validate independently.
- [ ] Scribe can edit the new dimensions without corrupting legacy records.
- [ ] ArcheoMaps can consume a public projection and report flattening.
- [ ] Curator decisions and patches can be represented without overloaded fields.
- [ ] External mappings are reviewed rather than label-matched automatically.
- [ ] The remaining open decisions in this document (`archaeology:cave-art`, §60; `infrastructure:irrigation`/`industry:irrigation`, §60; `architecture:nuraghe`/`military:nuraghe` and `architecture:broch`/`military:broch`, §60; `monument:assembly-site`, §17; `secondaryType`, §37) are resolved. *(`function`/`functions` naming was resolved in the independent-inspection correction pass — see §60.)*

Only after these gates pass should the result be considered for freezing as Taxonomy v2.

---

## 62. Comparative Reference Basis

Version 1.5 was informed by the following established systems. These are alignment references, not authorities that automatically override ArcheoMaps' scope or curatorial decisions.

- FISH Terminologies / Historic England: https://heritage-standards.org.uk/fish-vocabularies/
- Historic England Heritage Data Standards and Terminology: https://historicengland.org.uk/advice/technical-advice/information-management/data-standards-terminology/
- Heritage Data vocabularies: https://www.heritagedata.org/blog/vocabularies-provided/
- Getty Vocabularies (AAT and TGN): https://www.getty.edu/research/tools/vocabularies/index.html
- Pleiades Conceptual Overview: https://pleiades.stoa.org/help/conceptual-overview
- Pleiades Vocabularies: https://pleiades.stoa.org/vocabularies
- ARIADNEplus and AO-Cat: https://ariadne-infrastructure.eu/resources/ariadneplus-deliverables/
- CIDOC Conceptual Reference Model: https://cidoc-crm.org/Version/version-7.1.3
- CRMarchaeo: https://cidoc-crm.org/crmarchaeo/ModelVersion/crmarchaeo-version-2.0
- Arches Resource Models and data model: https://www.archesproject.org/resource-model-library/ and https://arches.readthedocs.io/en/stable/developing/reference/data-model/
- PeriodO Technical Overview: https://perio.do/technical-overview/
- tDAR Data Dictionary: https://tdar-arch.atlassian.net/wiki/spaces/TDAR/pages/557072/Data+Dictionary
- Open Context: https://opencontext.org/

The comparison supports an application-profile approach: ArcheoMaps maintains a comprehensible working model and controlled registries, while stable external mappings provide interoperability with broader professional systems.

---

## 63. Relationships (NEW in v1.5.1 — T15-P0-003; review/reciprocal metadata added in the independent-inspection correction pass)

`relationships` was named as one of the twelve core dimensions in §2 and promoted as first-class and new in the v1.5 changelog, but v1.5 never defined its vocabulary — this section closes that gap. It is referenced by Components (§50 rule 2, "a reciprocal Site relationship"), by Names (§53 rule 5, "relationships always use stable IDs, never name strings"), by Heritage (§57's `relationship: "direct-property"` field, which is the *heritage-designation* relationship and is distinct from this dimension), and by the `partOf` legacy-mapping row in §60.

Relationships answer:

> "How is this place connected to other ArcheoMaps records or external resources?"

```json
{
  "relationships": [
    {
      "id": "relationship-site-0001-01",
      "pairId": "relpair-0001-0042-01",
      "relationshipType": "part-of",
      "targetId": "site-0042",
      "targetKind": "site",
      "reciprocal": true,
      "chronology": [],
      "confidence": "high",
      "sourceIds": ["source-001"],
      "review": {
        "state": "proposed",
        "method": "source-import",
        "reviewedBy": null,
        "reviewedAt": null,
        "notes": ""
      },
      "notes": ""
    }
  ]
}
```

Initial Relationship Type vocabulary:

```
part-of
has-part
component-of
has-component
successor-of
predecessor-of
same-as
possibly-same-as
associated-with
replaced-by
replaces
relocated-from
relocated-to
```

**`near` is deliberately excluded.** Geographic proximity is directly computable from `locations[]` geometry at query time; storing it as a separate stored assertion would create a stale, arbitrary relationship that drifts from the underlying coordinates and adds no information a spatial query couldn't derive on demand. Where genuine proximity has independent historical or documentary significance beyond mere nearness (e.g. two sites are linked by a specific attested event or tradition, not just distance), that is `associated-with`, evidenced like any other assertion — not a geometry-derived `near`.

### 63.1 Review/workflow status (NEW, independent-inspection correction pass)

A bare `confidence` value is not enough on its own: it describes how reliable the evidence *for* an assertion is, but says nothing about whether a human has actually looked at it — a proposed scraper import and a curator-confirmed relationship can both legitimately carry `confidence: "high"` while being in completely different states of trust. `review` (above) is a separate field for exactly this reason, and must never be conflated with `confidence` by collapsing them into one value.

Controlled `review.state` vocabulary:

- `proposed` — asserted by an import/scraper rule, or a curator's unreviewed first pass; not yet confirmed by anyone with authority to accept it. This is the default state for anything not created through explicit manual curatorial entry.
- `accepted` — a curator has reviewed the assertion and confirms it.
- `rejected` — a curator has reviewed the assertion and determined it's wrong. **Rejected entries are not deleted** — they remain in `relationships[]` with `review.state: "rejected"` and their `notes` explaining why, so the same incorrect assertion isn't silently re-proposed by a later import without at least surfacing this history (mirrors the "history is append-only, nothing is deleted" principle already used throughout `MIGRATION_RULES.md` §5).
- `disputed` — either a curator has explicitly flagged genuine disagreement between sources about this relationship, or the validator has automatically set this state because a reciprocal pair failed to match (§63.2) — the two triggers are distinguishable via `review.method`.
- `needs-research` — plausible, but not yet adequately evidenced to move to `accepted` or `rejected`; parallels the `needs-research` state already used in `workflow.enrichment` (`MIGRATION_RULES_v2.6.md` §5.4) for the same concept applied to relationships specifically.

`review.method` records how the assertion entered its current state (e.g. `"source-import"`, `"manual-curation"`, `"validator-mismatch"`, `"curator-dispute"`) — the same provenance-style discipline used throughout §48–§57. `reviewedBy`/`reviewedAt` are populated only once a human decision has actually been made (moving to `accepted`/`rejected`/curator-initiated `disputed`); they remain `null` while `proposed` or `needs-research`.

Do not treat `proposed` relationships as equivalent to `accepted` ones in any public-facing projection or query — a flattening/export operation (§60 migration invariant 5) must be able to report how many relationships in a projection are still `proposed`/`disputed`/`needs-research` versus `accepted`.

### 63.2 Reciprocal behavior (NEW, independent-inspection correction pass — `reciprocal: true` is no longer an unexplained promise)

**Storage model: reciprocal relationships are physically stored on both records independently, never generated at query time.** Every other dimension in this taxonomy (Evidence, Condition, Investigations, and so on) is a set of independently sourced assertions living on the record they describe, each with its own confidence and provenance — Relationships follow the identical pattern rather than a special exception. This matters concretely: the two sides of a relationship can legitimately have different confidence, different sourcing, and different review status (a curator working on record A may be confident A is part of B; a different curator working on B may not yet have reviewed or may actively dispute it) — collapsing that into one query-time-derived assertion would silently erase a real, meaningful disagreement or asymmetric review state. A static, no-build-step, client-side application (§1) can still compute *derived, read-only views* of the relationship graph at query time for display purposes (e.g. "everything that claims to be part of site X") — that's a query convenience, not a substitute for each side's own stored, independently-attributable assertion.

**Synchronization — the `pairId` mechanism:** when a reciprocal relationship is created, both halves share the same `pairId` (a stable identifier for the pair, distinct from each half's own `id`). A fixed, non-extensible inverse-type table defines what the other half's `relationshipType` must be:

```
part-of          <-> has-part
component-of     <-> has-component
successor-of     <-> predecessor-of
replaces         <-> replaced-by
relocated-from   <-> relocated-to
same-as          <-> same-as            (self-inverse)
possibly-same-as <-> possibly-same-as   (self-inverse)
associated-with  <-> associated-with    (self-inverse)
```

Given a relationship entry on record A with `relationshipType` X, `targetId` B, and `reciprocal: true`, the expected reciprocal entry is one on record B with the inverse type from the table above, `targetId` A, and the same `pairId`.

**Validator behavior:**

- If the expected reciprocal entry exists on B with the correct inverse type, correct `targetId`, and matching `pairId` — the pair is valid. No action needed.
- If record B exists but has no matching entry at all — this is a **one-sided relationship**, not automatically an error (record B's curator may simply not have reached it yet). The validator flags it (e.g. surfaced as a `workflow.enrichment` entry on B with `dimension: "relationships"`, reason `missing-required-evidence`, `MIGRATION_RULES_v2.6.md` §5.4) rather than silently treating A's assertion as sufficient for both sides.
- If record B has an entry with the same `pairId` but the **wrong type or wrong target** (a genuine contradiction, not just an absence) — this is a hard validation failure, not a soft nudge. Both halves' `review.state` are automatically set to `disputed` (`review.method: "validator-mismatch"`) until a curator resolves the mismatch; an import or migration process must not leave a detected mismatch silently in place.
- `reciprocal: false` is valid and means no reciprocal entry is expected or required — used for relationship types that are intentionally asymmetric in a given case, or where the target record's own curator has deliberately chosen not to mirror it yet.

**External targets:** where the target is not an ArcheoMaps record at all (`targetKind` values other than `"site"` — e.g. `"external"` for a Wikidata/GeoNames/other authority entity), there is no ArcheoMaps-side record to hold a reciprocal assertion. `reciprocal` must be `false` for any `targetKind: "external"` entry, `targetId` is replaced by a `targetUri` (or similar external reference) instead of an internal stable ID, and no pair-matching validation applies — the assertion stands alone, sourced and reviewed like any other, but structurally incapable of having a reciprocal half.

### 63.3 Relationship Type rules

1. Every relationship entry carries its own `id`, `confidence`, `sourceIds`, `review` (§63.1), and (where dated) `chronology` — matching the pattern used throughout §48–§57. A relationship is never a bare type/target pair.
2. `part-of`/`has-part` and `component-of`/`has-component` are reciprocal pairs and should be set on both records where both are ArcheoMaps records (`reciprocal: true`, §63.2). Where only one side is modeled as a Component (§50) rather than a separate Site record, use §50's `representedBySiteId` instead — Components and Relationships are complementary, not duplicated: a Component becomes eligible for a reciprocal `component-of`/`has-component` Relationship pair only once it is promoted to its own Site record.
3. `same-as` asserts the two records are the same real-world place (e.g. resolved duplicate identification); `possibly-same-as` asserts a candidate, unresolved identification (§54 rule 3's "conflicting proposed Locations" is the Location-level analogue of this same situation at the Relationship level, for disputed identifications specifically — see stress-test fixture 14).
4. `successor-of`/`predecessor-of` and `replaced-by`/`replaces` are distinct: succession describes a historical continuity relationship between two *distinct* places (e.g. a settlement's successor site nearby); replacement describes one *structure/record* superseding another at essentially the same location (see §49's `relocated` Condition value and `relocated-from`/`relocated-to` below for the specific relocation case).
5. `relocated-from`/`relocated-to` link a relocated structure's current record to a record or location representing its original site, complementing the `relocated` Condition value (§49) which flags the fact of relocation without capturing the specific prior location.
6. UNESCO parent-property/component-property structures (§57, stress-test fixture 13) use `part-of`/`has-part` between the component's own Site record and its parent, in addition to (not instead of) the `heritage[].relationship` field, which separately tracks the *designation* relationship rather than the ArcheoMaps record relationship.
7. Political, economic, or route-specific relationship subtypes (e.g. a specific trade-route linkage) may be added later once a real recurring use case demands them (§3 Rule 7) — this initial vocabulary is deliberately not exhaustive.

---

## 64. Insufficient Evidence Workflow (NEW in v1.5.1 — T15-P1-008; revised in the independent-inspection correction pass)

The evidentiary standard applied consistently throughout this document — "do not guess," require documented evidence, cite sources (§3 Rule 7, §38 Rules 8/13, §44, §48 Rule 1) — assumes there's enough material to evaluate a given classification question against. At the scale this taxonomy is actually applied to, that assumption does not always hold, and it does not hold uniformly across dimensions: a record can have perfectly adequate evidence for its Type while lacking usable evidence for, say, its chronology or political entity specifically.

This is a distinct situation from ordinary classification ambiguity (§44): §44 assumes evidence exists but doesn't clearly settle the question; this section covers the case where a *specific dimension* doesn't have enough material to evaluate at all.

**Two separate mechanisms, not one (revised, independent-inspection pass):** the original v1.5.1 pass introduced a single `evidence-insufficient` workflow state and, on review, that state was too narrow — it conflated "Type itself can't be determined" with "some other enrichment dimension lacks evidence," which are different problems needing different remediation. This is now two mechanisms:

1. **`workflow.type` state `evidence-insufficient`** — scoped strictly to whether `canonicalType` itself can be evaluated. Use only when there isn't enough material to determine what the record fundamentally is at all.
2. **`workflow.enrichment[]`** — a separate, dimension-aware array covering every other dimension (chronology, cultures, politicalEntities, functions, locations, conditionAssessments, relationships, evidence, components, investigations, tags, names, phases) independently. A record can carry multiple simultaneous `workflow.enrichment` entries, one per affected dimension, each with its own state and reason.

Both are fully specified in `MIGRATION_RULES_v2.6.md` §5 (§5.1/§5.3 for `workflow.type`; §5.4 for `workflow.enrichment`); this taxonomy document specifies only that the two must exist and must remain distinguishable from each other and from ordinary `review`/`research`.

**Evidence sufficiency is not the same question as "does the legacy `source` field exist."** 1,762 of 2,103 live records currently lack that legacy scalar field, and mechanically flagging all of them as evidence-insufficient would be wrong — many have entirely adequate evidence embedded in `text` itself, or in structured `sourceIds`/`provenance` that supersede the legacy field. `MIGRATION_RULES_v2.6.md` §5.4.4 specifies exactly how sufficiency must be evaluated per assertion instead.

This is a workflow-and-migration-rules concern more than a taxonomy-vocabulary one; no new Type, Tag, Function, or other classification vocabulary is implied by a record sitting in either state.
