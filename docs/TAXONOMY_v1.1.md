# ArcheoMaps Taxonomy

Version: 1.3 — CANONICAL
Status: Design specification (approved)
Last updated: 2026-08-19

---

## Changelog

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

ArcheoMaps separates six different questions:

| Dimension | Question |
|---|---|
| `type` | What fundamentally IS this place? |
| `tags` | What notable characteristics does it have? |
| `cultures` | Which cultural traditions/societies are associated with it? |
| `politicalEntities` | Which political entity/entities controlled it? |
| `functions` | What was the place used for? |
| `phases` | What significant things happened to the place through time? |

These dimensions **MUST NOT** be collapsed into one another.

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
type: "Fortification"

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
    type = Fortification
    tag  = military:castellum
```

NOT:

```
type = Roman Castellum
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
type = Military Site
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

Do NOT use Settlement merely because people once occupied a site. A cave occupied by prehistoric humans remains `type = Cave`, not `type = Settlement`, unless the archaeological site is fundamentally a settlement complex.

A record whose scope is fundamentally a settlement is `type = Settlement` even when a component of it (a temple, a wall, a caravanserai) is what the legacy data happened to name — see §34 and Rule 47's general Tag-over-Type preference. The reverse also holds: a record whose scope is a single waystation/inn building (a caravanserai) that happens to sit along a route through, or near, a settlement is not automatically `type = Settlement` merely because of that proximity — see §4.7.

### 4.2 Religious Site

Use for sites fundamentally characterised by religious or sacred use.

Includes: temple, church, cathedral, mosque, synagogue, monastery, shrine, sanctuary, oracle, sacred complex, rock-cut religious site, ziggurat, stupa, pagoda.

Examples:

```
type = Religious Site
tags:
  - architecture:temple

type = Religious Site
tags:
  - architecture:church

type = Religious Site
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

Open-air rock art and petroglyph panels not located inside a cave belong here — `type = Monument`, tags `prehistoric:rock-art` + `monument:inscription` as applicable — rather than under Cave. A large-scale ground marking (a geoglyph) is likewise `type = Monument` with `monument:geoglyph`; use `type = Landscape` instead only when the geoglyph is part of a broader documented cultural landscape rather than a single discrete figure.

An effigy mound is `type = Monument` with `monument:effigy-mound`, not `type = Tomb` — effigy mounds are symbolic/ceremonial earthworks and are not necessarily funerary. Use `funerary:mound` (§11) instead only when the mound is documented as a burial feature. The absence of documented funerary evidence is not, by itself, evidence of monumental identity either — if a mound's text supports neither a funerary nor a non-funerary ceremonial/platform/effigy reading, the correct migration outcome is REVIEW or RESEARCH, not an assumed Monument (see `MIGRATION_RULES.md` §11).

A megalithic monument or stone circle described using the word "wall" in older or informal source material — because it is structurally one ring of a concentric stone arrangement rather than a fortification — remains `type = Monument` with the applicable `monument:*` tag (`monument:stone-circle`, `monument:megalithic`, `monument:standing-stone`, or `monument:alignment` as the text supports), not `type = Fortification`. The word "wall" describes a structural feature, not a defensive function, unless the record's own text establishes the latter.

A megalithic monument or stone circle with a documented or credibly argued astronomical/calendrical function remains `type = Monument` — add `function = astronomical` (§21), not `type = Observatory`. It only becomes `Observatory` if it is itself a purpose-built observation structure rather than a monument that happens to also have been used for observation. See §33c and §33d for a worked contrast.

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

A tomb located inside a cave does NOT automatically become `type = Cave` if the primary historical identity is the funerary structure.

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

A record whose own scope is an entire walled city or settlement — where the wall is the surviving remnant of the settlement as a whole, not a standalone defensive structure — is `type = Settlement` (§4.1), not `type = Fortification`, even though its text uses defensive/military language to describe the wall itself. Reserve `Fortification` for records whose own scope is the standalone defensive structure or system.

### 4.6 Palace

Use when a monumental elite/royal residence or palace complex is fundamentally what defines the site.

Possible tags:

```
architecture:palace
architecture:villa
settlement:administrative-centre
construction:monumental
```

A palace that is merely one component of a larger archaeological city may instead have `type = Settlement` with `tags: [architecture:palace]`.

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

A caravanserai record's Type follows the same record-scope logic as every other Type decision in this taxonomy (see `MIGRATION_RULES.md` §8 for the general migration statement of this principle): where the record's own scope is the standalone waystation building, `type = Infrastructure` with tag `architecture:caravanserai` (§7) is the usual fit, since a caravanserai is fundamentally a piece of trade-route infrastructure. Where the record's own scope is a larger settlement that happens to contain a caravanserai, `type = Settlement` with the same tag applies instead (§4.1). Where the record is unresolved ruins with no further identifying information, `type = Archaeological Site` (§4.9) applies until more is known. In no case does the `architecture:caravanserai` tag itself imply a Function (§21) — accommodation, trade, or transport Functions require their own independent textual evidence.

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
    type = Cave
    tags:
      - cave:natural
      - cave:art
      - prehistoric:rock-art

artificial Roman underground complex
    type = Cave
    tags:
      - cave:artificial
      - cave:underground-complex
      - culture:roman
```

Do not create separate Types such as Art Cave, Burial Cave, Roman Cave, Ritual Cave. These are Tags. Rock art NOT inside a cave is `type = Monument` — see §4.3.

### 4.9 Archaeological Site

Use when the location is primarily an archaeological site or complex that cannot reasonably be represented by a more specific Type.

Examples: archaeological excavation site, archaeological complex, ruins of unclear primary function, multi-period archaeological site where no single structural Type adequately describes the site.

This is the correct fallback Type for two common cases:
- A site currently documented only as "ruins," with no further information available about what it fundamentally was (settlement, temple, fortress, etc.). Pair with tag `archaeology:ruins` (§8). Use a more specific Type instead as soon as the site's fundamental nature is established.
- Isolated civic or public architecture — a theatre, amphitheatre, stadium, or bath complex — not documented as part of a larger settlement. Pair with the relevant `architecture:*` tag (§7) and, where the use is known, functions such as `recreational` or `entertainment` (§21).

A site provisionally placed here as a suspected observatory graduates to `type = Observatory` (§4.12) once its identity as a purpose-built observation structure is actually confirmed by the source material — do not assign `Observatory` speculatively and do not leave a confirmed observatory sitting under this fallback Type indefinitely.

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

A fort that happens to have been involved in a battle remains `type = Fortification` unless the battlefield itself is the primary historical subject.

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
- A stone circle, alignment, henge, temple, or other monument with a documented or credibly argued astronomical function stays under its existing Type (`Monument`, `Religious Site`, etc.) with `function = astronomical` added (§21). It becomes `Observatory` only if it is itself, fundamentally, a purpose-built observation structure — not merely a monument that was also used for observation. See §33c vs. §33d.
- Do not classify every site with any astronomical association as an Observatory. This Type is for a specific, narrow, well-evidenced category of purpose-built site, not a general label for "things related to astronomy."
- Do not assign `type = Observatory` (or `function = astronomical`, §21) on the basis of popular or fringe astronomical speculation about a site. Follow the same evidence standard as every other classification decision in this taxonomy (§7 Rule 7, §38 Migration Rule 13, §44) — if the source doesn't support it, leave the classification as-is or mark it for review; do not guess.

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

A natural landmark (a mountain, cave, spring, or rock formation) with **documented** cultural, mythological, or religious significance belongs here — e.g. `landscape:sacred` — even if it has no constructed archaeological remains. A natural landmark with **no** documented cultural or historical content beyond its physical existence does not belong in this taxonomy as a historical/archaeological site at all; use `type = Other` or leave the field unclassified for review (§4.14, §44), rather than forcing it into Landscape for the sake of giving it some Type.

### 4.14 Other

Use only when no existing Type can adequately represent the site.

"Other" is preferable to inventing an inappropriate Type. Every use of Other should be considered a candidate for later manual taxonomy review.

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
```

Architectural terms describe physical form. They do not automatically determine Type.

Example: `architecture:temple` does not automatically mean `type = Religious Site` if the temple is merely one component of a larger settlement. Likewise, `architecture:pyramid` does not by itself determine Type — pair it with `Tomb` (funerary pyramid), `Religious Site` (temple pyramid), or `Monument` depending on the site's documented primary function. This applies regardless of the structure's age: a confirmed modern (e.g. 19th-century or later) structure with a genuine pyramid form is tagged `architecture:pyramid` on exactly the same basis as an ancient one — the tag records physical form, not antiquity, and is not withheld from a modern structure or added automatically to an ancient one just because of the legacy `type` string.

`architecture:caravanserai` (added v1.3) is for a caravanserai as a specific historical waystation/inn building type — see §4.7 for how this pairs with Type. Like every other architecture tag, it describes form only; it never by itself implies a Function (§21) such as `commercial` or `transport`.

`architecture:observatory` is most useful when an observatory building is a component of a site whose overall Type is something else (e.g. part of a larger Settlement or Religious Site complex), the same way `architecture:palace` is used within a Settlement-typed site (§34). On a record already typed `Observatory`, this tag is optional and adds little on its own — per §43, don't add it reflexively just to mirror the Type name. The same restraint applies to any architecture tag that merely echoes an already-assigned Type name.

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
```

`funerary:dolmen`, `:mound`, `:tumulus`, and `:kurgan` preserve historically specific burial-architecture terms that `funerary:chamber-tomb` would otherwise flatten, matching the precedent already set by `funerary:rock-cut-tomb`.

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
```

"route" may eventually become a separate geometry/entity system. Do not treat a major historical route as a normal point merely because the current application does.

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

`monument:standing-stone` already covers a single menhir; the remaining additions distinguish the other specific arrangement forms (a circle, an alignment, a henge, a medicine wheel) that `monument:megalithic` alone was too generic to separate.

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

Chronological terms such as Neolithic or Bronze Age are Tags here. They are NOT Cultures. `prehistoric:rock-art` applies to both cave and open-air rock art; `prehistoric:cave-art` is specifically for the cave context.

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

Do not default to `settlement:urban` (or any other single value in this list) as a generic placeholder for "walled settlement" or "settlement of unspecified size." Use the most specific value the record's own text actually supports, and omit a subtype tag entirely rather than guess one — the bare `type = Settlement` is always a complete, valid classification on its own (§43).

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

Incorrect: `function = temple`

Correct:

```
type = Religious Site
tag = architecture:temple
function = religious
```

**`astronomical`** is for sites documented as having been used, wholly or partly, for astronomical or calendrical observation. This applies regardless of Type — a `Monument` (stone circle), a `Religious Site` (temple), and an `Observatory` (§4.12) can all legitimately carry `function: astronomical` at the same time as belonging to entirely different Types. "Observatory" and "astronomical" are NOT synonyms: `astronomical` describes a use that can attach to almost any Type, while `Observatory` is reserved for the narrow case where a purpose-built observation structure is the site's fundamental identity. A site can be both (§33d). A site can have the function without being an observatory (§33c, §33e). A site can theoretically be classified `Observatory` without `astronomical` being separately listed as a function only in the unusual case where the structure's observational use isn't otherwise documented as a function — in practice these two will almost always travel together, but they remain separate fields and neither should be inferred automatically from the other.

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
discovery
excavation
```

Potential future values:

```
foundation
refoundation
relocation
reuse
```

Do not add future values until a real use case requires them.

---

## 28. Phase Rules

A phase should represent a meaningful historical change. Do NOT create phases for every minor event.

Good: "Roman reconstruction"
Bad: "Someone repaired a door" — unless that event is historically significant to the site's identity.

Good: "Converted from temple to church"
Bad: "Someone repaired a door" — unless that event is historically significant to the site's identity.

None of the gaps closed across this taxonomy's review (Pyramid, Geoglyph, Observatory, Dolmen, Stone Circle family, Nuraghe/Broch, Ziggurat/Stupa/Pagoda, submerged sites, effigy mounds, Caravanserai) represent a Historical Phase, including Observatory. Each describes a site's static physical form or use, not a chronological episode — so each was resolved as a Type, Tag, or Function instead, per Rule 6. The Historical Phase system itself is unchanged from v1.0.

---

## 29. Time Model

The current `year` field remains the primary chronological anchor.

Example: `year: -518` means approximately 518 BCE.

Historical phases may later provide more precise chronology.

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
  type: "Religious Site",

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
  type: "Fortification",

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

Do NOT create `type = Castellum`.
Do NOT create `culture = Roman Empire`.

---

## 33. Example: Prehistoric Cave

```
{
  type: "Cave",

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
  type: "Monument",

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
  type: "Tomb",

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
  type: "Monument",

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
  type: "Observatory",

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

Here the site's fundamental, documented identity is a purpose-built astronomical observation structure, so `type = Observatory`. It also carries `function: astronomical` (expected, though not automatically inferred — the function is still assigned on its own evidentiary basis, per §21) and, where the source supports it, an additional function like `ritual` for a documented ceremonial dimension. Type and Function coexist here without being redundant: one says what the building is, the other says what it was used for.

---

## 33e. Example: Temple With an Astronomical Function (not an Observatory)

```
{
  type: "Religious Site",

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
  type: "Infrastructure",

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
13. If a site's classification is genuinely uncertain, use `Other`, an empty value, or a review flag rather than fabricating certainty.
14. A record whose current `type` is exactly "Ruins" with no other classifying information defaults to `Archaeological Site` + `archaeology:ruins`, not a guessed specific Type — unless the source `text` clearly indicates a more specific nature.
15. A record whose current `type` is a purely natural feature (mountain, crater, cave formation, etc.) with no documented cultural/historical content is left as `Other` or unclassified, not forced into `Landscape`.
16. `type = Observatory` and `function = astronomical` require the same standard of documented evidence as any other classification (§44) — a popular or speculative astronomical claim about a site is not sufficient on its own for either.
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

may all resolve to `type = Fortification`, while retaining specific terminology as Tags:

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
type = Fortification

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

If a source does not provide enough evidence: `type = Other`, or leave the field blank for manual review. Do NOT guess.

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

Routes such as Silk Road, Via Appia, Qhapaq Ñan may eventually become line geometries rather than point locations. This should be a separate geometry/entity system.

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
