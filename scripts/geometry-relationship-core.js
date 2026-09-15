/* ArcheoMaps Geometry Layer System v0.1 — Phase 5
 * Site -> Geometry relationship resolution and selection-reveal planning.
 *
 * Pure logic only (no DOM, no Leaflet) so it can be unit-tested directly
 * with node:test and reused unchanged by the browser runtime. index.html
 * wires the DECISIONS this module makes (which relationships are eligible,
 * which layer/feature they resolve to, whether a loaded feature is
 * temporally valid, what display name and runtime-state label to show) to
 * actual Leaflet layers, lazy loading, and the Site drawer.
 *
 * This module deliberately reuses `window.ArcheoLayerCatalog` /
 * `../scripts/layer-catalog-core` for the Geometry-ID feature index and ID
 * grammar rather than re-implementing either — GEOMETRY_PHASE5 §1 is
 * explicit that there must be exactly one Geometry lookup registry.
 */
(function(root, factory){
  const catalogCore = typeof module === 'object' && module.exports
    ? require('./layer-catalog-core')
    : root.ArcheoLayerCatalog;
  const api = factory(catalogCore);
  if(typeof module === 'object' && module.exports) module.exports = api;
  else root.ArcheoGeometryRelationships = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(ArcheoLayerCatalog){
  'use strict';

  // ---- §63.1 review-state vocabulary this resolver understands -----------
  const ELIGIBLE_REVIEW_STATES = new Set(['accepted', 'proposed']);
  const KNOWN_REVIEW_STATES = new Set(['accepted', 'proposed', 'rejected', 'disputed', 'needs-research']);

  const RUNTIME_STATE = {
    DISPLAYED: 'Displayed',
    LOADING: 'Loading',
    OUTSIDE_YEAR: 'Outside current map year',
    PROPOSED: 'Proposed relationship',
    REVIEW_REQUIRED: 'Review required',
    UNAVAILABLE: 'Linked geometry unavailable',
    LOAD_FAILED: 'Load failed',
    REJECTED: 'Rejected',
    MALFORMED: 'Malformed relationship',
  };

  function isNonEmptyString(v){ return typeof v === 'string' && v.length > 0; }

  // ---- §1: deterministic Geometry-ID -> catalogue-entry index ------------
  // Thin re-export so callers only ever import this module for Phase 5
  // concerns; the actual index is built once from the validated catalogue
  // by layer-catalog-core.js (the one and only Geometry lookup registry).
  function buildFeatureIndex(catalog){
    return ArcheoLayerCatalog.buildFeatureIndex(catalog);
  }

  // ---- §1: post-SHA-256 canonical-file <-> catalogue cross-check ---------
  // Called once per layer, the first time it is loaded (lazy), after the
  // fetched bytes have already passed their SHA-256 check. Throws (fail
  // closed) on any mismatch; never accepts a partial match.
  function buildLoadedFeatureIndex(entry, collection){
    if(!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)){
      throw new Error(`${entry.label} is not a GeoJSON FeatureCollection`);
    }
    const declared = new Set(entry.featureIds || []);
    const found = new Map();
    collection.features.forEach(feature=>{
      const props = feature && feature.properties;
      if(!props || props.datasetId !== entry.datasetId){
        throw new Error(`${entry.label} contains a feature from a different dataset`);
      }
      const id = props.id;
      if(!isNonEmptyString(id)) throw new Error(`${entry.label}: canonical feature is missing properties.id`);
      if(found.has(id)) throw new Error(`${entry.label}: duplicate canonical feature id ${id}`);
      found.set(id, feature);
    });
    declared.forEach(id=>{
      if(!found.has(id)) throw new Error(`${entry.label}: declared featureId ${id} is missing from the canonical GeoJSON`);
    });
    found.forEach((_feature, id)=>{
      if(!declared.has(id)) throw new Error(`${entry.label}: canonical feature ${id} is not declared in the catalogue's featureIds`);
    });
    return found;
  }

  // ---- §3/§9: classify one relationships[] entry --------------------------
  // Never throws. Returns a discriminated object; `status` is one of:
  //   'not-geometry' | 'malformed' | 'invalid-target-id' | 'unresolved'
  //   | 'ineligible' | 'eligible'
  function classifyGeometryRelationship(rel, featureIndex){
    if(!rel || typeof rel !== 'object' || Array.isArray(rel)){
      return { status: 'malformed', reason: 'relationship entry is not an object', relationship: rel };
    }
    if(rel.targetKind !== 'geometry'){
      // Not a Geometry relationship at all — silently out of scope for this
      // resolver (§3: "non-Geometry relationship is ignored").
      return { status: 'not-geometry', reason: null, relationship: rel };
    }
    if(!isNonEmptyString(rel.id)) return { status: 'malformed', reason: 'relationship.id is required', relationship: rel };
    if(!isNonEmptyString(rel.relationshipType)) return { status: 'malformed', reason: 'relationship.relationshipType is required', relationship: rel };
    if(!isNonEmptyString(rel.targetId)) return { status: 'malformed', reason: 'relationship.targetId is required', relationship: rel };
    const reviewState = rel.review && typeof rel.review === 'object' ? rel.review.state : undefined;
    if(!isNonEmptyString(reviewState)) return { status: 'malformed', reason: 'relationship.review.state is missing', relationship: rel };

    if(!ArcheoLayerCatalog.isGeometryFeatureId(rel.targetId)){
      return { status: 'invalid-target-id', reason: `targetId "${rel.targetId}" is not a valid geometry- ID`, relationship: rel };
    }
    const layerEntry = featureIndex.get(rel.targetId);
    if(!layerEntry){
      return { status: 'unresolved', reason: `targetId "${rel.targetId}" does not resolve through the layer catalogue`, relationship: rel };
    }
    if(!KNOWN_REVIEW_STATES.has(reviewState)){
      return { status: 'ineligible', reason: `review.state "${reviewState}" is not a recognized state`, relationship: rel, layerEntry, featureId: rel.targetId };
    }
    if(!ELIGIBLE_REVIEW_STATES.has(reviewState)){
      // rejected / disputed / needs-research: structurally fine and
      // resolved, but never auto-revealed (§3 review-state table).
      return { status: 'ineligible', reason: `review.state "${reviewState}" is not eligible for automatic reveal`, relationship: rel, layerEntry, featureId: rel.targetId };
    }
    return {
      status: 'eligible',
      reason: null,
      relationship: rel,
      layerEntry,
      layerId: layerEntry.id,
      featureId: rel.targetId,
      proposed: reviewState === 'proposed',
    };
  }

  // ---- §3/§4: classify every relationship on a Site -----------------------
  // Returns { eligible: [classification...], diagnostics: [...] }.
  // `diagnostics` never includes 'not-geometry' entries (out of scope, not
  // an error) but includes every other non-eligible outcome so nothing is
  // silently discarded (§9).
  function collectSiteGeometryRelationships(site, featureIndex){
    const relationships = Array.isArray(site && site.relationships) ? site.relationships : [];
    const classified = relationships.map(rel => classifyGeometryRelationship(rel, featureIndex));
    const inScope = classified.filter(c => c.status !== 'not-geometry');
    const eligible = inScope.filter(c => c.status === 'eligible');
    const diagnostics = inScope.filter(c => c.status !== 'eligible').map(c => ({
      code: c.status,
      reason: c.reason,
      relationshipId: c.relationship && typeof c.relationship === 'object' ? c.relationship.id : undefined,
      targetId: c.relationship && typeof c.relationship === 'object' ? c.relationship.targetId : undefined,
    }));
    return { eligible, diagnostics, all: inScope };
  }

  // ---- §6: temporal validity of a loaded canonical feature ----------------
  function featureValidityBounds(feature){
    const props = (feature && feature.properties) || {};
    const validFrom = Number.isFinite(props.validFrom) ? props.validFrom : -Infinity;
    const validTo = Number.isFinite(props.validTo) ? props.validTo : Infinity;
    return { validFrom, validTo };
  }
  function isWithinValidity(feature, year){
    const { validFrom, validTo } = featureValidityBounds(feature);
    return year >= validFrom && year <= validTo;
  }

  // ---- §7: display-name resolution, with safe fallback chain -------------
  // feature/entityRegistry may be null/undefined (e.g. before the layer has
  // loaded, or when no runtime Entity registry exists yet) — every branch
  // degrades safely rather than throwing.
  function resolveGeometryDisplayName({ feature, entityRegistry, layerEntry, featureId }){
    const props = (feature && feature.properties) || {};
    if(isNonEmptyString(props.name)) return props.name;
    if(entityRegistry && props.entityId){
      const entity = typeof entityRegistry.get === 'function' ? entityRegistry.get(props.entityId) : entityRegistry[props.entityId];
      if(entity && isNonEmptyString(entity.preferredName)) return entity.preferredName;
    }
    if(layerEntry && isNonEmptyString(layerEntry.label)) return layerEntry.label;
    return featureId || 'Unknown geometry';
  }

  // ---- §7: effective visibility, kept as one tiny pure predicate ---------
  // so both the map runtime and the Layers panel/tests share one
  // definition of "effective" rather than re-deriving it separately.
  function effectiveEnabled(layer){
    return Boolean(layer && (layer.manualEnabled || layer.selectionEnabled));
  }

  return {
    RUNTIME_STATE,
    ELIGIBLE_REVIEW_STATES,
    KNOWN_REVIEW_STATES,
    buildFeatureIndex,
    buildLoadedFeatureIndex,
    classifyGeometryRelationship,
    collectSiteGeometryRelationships,
    featureValidityBounds,
    isWithinValidity,
    resolveGeometryDisplayName,
    effectiveEnabled,
  };
});
