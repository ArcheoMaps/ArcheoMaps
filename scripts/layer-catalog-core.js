(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  else root.ArcheoLayerCatalog = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';

  const CATEGORIES = new Set(['paleogeography', 'political', 'networks']);
  const PANES = new Set(['paneCoastline', 'paneIce', 'panePolitical', 'paneNetworks']);
  const MODES = new Set(['validity']);
  const STATUSES = new Set(['active', 'proposed', 'deprecated', 'rejected', 'quarantined']);
  const DEPLOYABLE_STATUSES = new Set(['active', 'proposed']);

  function isHyphenSlug(value){ return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value); }
  // Geometry feature IDs are globally stable ArcheoMaps IDs (GEOMETRY_SCHEMA.md
  // §3): a hyphen slug that MUST begin with the `geometry-` namespace prefix.
  function isGeometryFeatureId(value){ return typeof value === 'string' && /^geometry-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value); }
  function isSafeLocalJsonPath(value){
    return typeof value === 'string' && value.endsWith('.geojson') && !value.startsWith('/') && !value.includes('..') && !/^[a-z][a-z0-9+.-]*:/i.test(value);
  }
  function fail(message){ throw new Error(`Invalid layer catalogue: ${message}`); }

  function validateEntry(entry, index){
    const at = `entries[${index}]`;
    if(!entry || typeof entry !== 'object' || Array.isArray(entry)) fail(`${at} must be an object`);
    if(!isHyphenSlug(entry.id)) fail(`${at}.id must be a hyphen slug`);
    if(typeof entry.label !== 'string' || !entry.label.trim()) fail(`${at}.label is required`);
    if(!CATEGORIES.has(entry.category)) fail(`${at}.category is not supported`);
    if(!PANES.has(entry.pane)) fail(`${at}.pane is not supported`);
    if(!MODES.has(entry.mode)) fail(`${at}.mode is not supported in v0.1`);
    if(!STATUSES.has(entry.status)) fail(`${at}.status is not canonical`);
    if(!DEPLOYABLE_STATUSES.has(entry.status)) fail(`${at}.status is not deployable`);
    if(!isSafeLocalJsonPath(entry.dataPath)) fail(`${at}.dataPath must be a safe local .geojson path`);
    if(typeof entry.datasetId !== 'string' || !/^dataset-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.datasetId)) fail(`${at}.datasetId is invalid`);
    if(typeof entry.outputSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.outputSha256)) fail(`${at}.outputSha256 is invalid`);
    if(typeof entry.attribution !== 'string' || !entry.attribution.trim()) fail(`${at}.attribution is required`);
    if(entry.minYear != null && !Number.isFinite(entry.minYear)) fail(`${at}.minYear must be numeric or null`);
    if(entry.maxYear != null && !Number.isFinite(entry.maxYear)) fail(`${at}.maxYear must be numeric or null`);
    if(Number.isFinite(entry.minYear) && Number.isFinite(entry.maxYear) && entry.minYear > entry.maxYear) fail(`${at} has reversed date bounds`);
    if(!entry.style || typeof entry.style !== 'object' || Array.isArray(entry.style)) fail(`${at}.style must be an object`);

    // Phase 5 (§1 of GEOMETRY_PHASE5_SITE_LINKING.md): every deployable
    // catalogue entry declares which canonical Geometry feature IDs it
    // governs, so a Site relationship's targetId can resolve to exactly
    // one layer without downloading every registered layer and without a
    // second, independently maintained lookup registry.
    if(!Array.isArray(entry.featureIds) || entry.featureIds.length === 0) fail(`${at}.featureIds must be a non-empty array`);
    const seenInEntry = new Set();
    entry.featureIds.forEach((featureId, fIndex)=>{
      if(!isGeometryFeatureId(featureId)) fail(`${at}.featureIds[${fIndex}] must be a valid geometry- hyphen-slug ID`);
      if(seenInEntry.has(featureId)) fail(`${at}.featureIds[${fIndex}] duplicates featureId ${featureId} within the same entry`);
      seenInEntry.add(featureId);
    });
    return entry;
  }

  function validateCatalog(catalog){
    if(!catalog || catalog.schemaVersion !== 'geometry-layer-catalog/0.1') fail('schemaVersion must be geometry-layer-catalog/0.1');
    if(!Array.isArray(catalog.entries)) fail('entries must be an array');
    const ids = new Set();
    const featureIdOwners = new Map(); // featureId -> owning entry id, for the cross-entry uniqueness check below
    catalog.entries.forEach((entry, index)=>{
      validateEntry(entry, index);
      if(ids.has(entry.id)) fail(`duplicate layer id ${entry.id}`);
      ids.add(entry.id);
      (entry.featureIds || []).forEach(featureId=>{
        const owner = featureIdOwners.get(featureId);
        if(owner && owner !== entry.id) fail(`featureId ${featureId} is declared in more than one catalogue entry (${owner}, ${entry.id})`);
        featureIdOwners.set(featureId, entry.id);
      });
    });
    return catalog;
  }

  // Deterministic Geometry-ID -> catalogue-entry resolution, built once from
  // a validated catalogue. This is the ONLY Geometry lookup registry —
  // index.html must resolve every Site relationship targetId through this,
  // never through a hard-coded map or a second parallel registry.
  function buildFeatureIndex(catalog){
    const index = new Map();
    (catalog.entries || []).forEach(entry=>{
      (entry.featureIds || []).forEach(featureId=> index.set(featureId, entry));
    });
    return index;
  }

  return { validateCatalog, isSafeLocalJsonPath, isGeometryFeatureId, buildFeatureIndex };
});
