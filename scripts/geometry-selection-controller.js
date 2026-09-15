/* ArcheoMaps Geometry Layer System v0.1 — Phase 5
 * Selection-driven reveal/highlight orchestration, decoupled from Leaflet
 * and the DOM via an injected adapter so the generation-token / stale-load
 * / rollback logic can be unit-tested directly with node:test.
 *
 * index.html supplies the adapter (actual layer loading, actual Leaflet
 * highlighting, actual current-year lookup); this module owns nothing but
 * the *decisions* — which relationships are eligible, whether a completed
 * load is still current, and what to clean up when the selection changes.
 */
(function(root, factory){
  const relCore = typeof module === 'object' && module.exports
    ? require('./geometry-relationship-core')
    : root.ArcheoGeometryRelationships;
  const api = factory(relCore);
  if(typeof module === 'object' && module.exports) module.exports = api;
  else root.ArcheoGeometrySelectionController = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(relCore){
  'use strict';

  const { RUNTIME_STATE, collectSiteGeometryRelationships, isWithinValidity } = relCore;

  function noop(){}

  /* adapter fields (all required unless noted):
   *   getFeatureIndex()                        -> Map(featureId -> catalogEntry)
   *   ensureLayerLoaded(layerId)                -> Promise<void>, rejects on failure
   *   getLoadedFeature(layerId, featureId)      -> geojson Feature | null
   *   setLayerSelectionState(layerId, on)       -> void  (selectionEnabled = on)
   *   highlightFeature(layerId, featureId)      -> void
   *   clearHighlight(layerId, featureId)        -> void
   *   getCurrentYear()                          -> number
   *   onDiagnostic(diagnostic)                  -> void   (optional)
   *   onStateChange(site, relationshipStates[])  -> void   (optional; drives the Site-drawer UI)
   */
  function createSelectionController(adapter){
    const {
      getFeatureIndex, ensureLayerLoaded, getLoadedFeature,
      setLayerSelectionState, highlightFeature, clearHighlight, getCurrentYear,
      onDiagnostic = noop, onStateChange = noop,
    } = adapter;

    let generation = 0;
    let activeSite = null;
    // layerId -> Set(featureId) currently held selectionEnabled/highlighted by
    // THIS controller, so clearing never touches manually-enabled state and
    // never touches a layer another concern (e.g. a different selection) owns.
    let activeLayers = new Map();
    let relationshipStates = [];

    function layerFeatureSet(layerId){
      let set = activeLayers.get(layerId);
      if(!set){ set = new Set(); activeLayers.set(layerId, set); }
      return set;
    }

    function clearActive(){
      activeLayers.forEach((featureIds, layerId)=>{
        featureIds.forEach(featureId=> clearHighlight(layerId, featureId));
        setLayerSelectionState(layerId, false);
      });
      activeLayers = new Map();
    }

    function findState(relationshipId){
      return relationshipStates.find(s => s.relationshipId === relationshipId);
    }
    function setState(relationshipId, patch){
      const state = findState(relationshipId);
      if(state) Object.assign(state, patch);
      onStateChange(activeSite, relationshipStates.slice());
    }

    // §4/§8: clears everything belonging to the current/previous selection —
    // used both when a new Site is selected and when the selection is
    // cleared outright (deselect, Reset, closing the record).
    function clearSelection(){
      generation += 1;
      clearActive();
      activeSite = null;
      relationshipStates = [];
      onStateChange(null, []);
    }

    // §4: the one function every selection path (marker click, list click,
    // nearby-sites, random, search, shared URL, selectSite()) funnels
    // through — invoked once from selectSite() itself.
    function selectSite(site){
      generation += 1;
      const myGeneration = generation;
      clearActive();
      activeSite = site;

      const featureIndex = getFeatureIndex();
      const { eligible, diagnostics } = collectSiteGeometryRelationships(site, featureIndex);
      diagnostics.forEach(diagnostic => onDiagnostic(Object.assign({ siteId: site && site.id }, diagnostic)));

      relationshipStates = eligible.map(item => ({
        relationshipId: item.relationship.id,
        layerId: item.layerId,
        featureId: item.featureId,
        relationshipType: item.relationship.relationshipType,
        confidence: item.relationship.confidence,
        reviewState: item.relationship.review.state,
        proposed: item.proposed,
        runtimeState: RUNTIME_STATE.LOADING,
      }));
      onStateChange(activeSite, relationshipStates.slice());

      eligible.forEach(item => {
        const { layerId, featureId } = item;
        let loadPromise;
        try{ loadPromise = Promise.resolve(ensureLayerLoaded(layerId)); }
        catch(error){ loadPromise = Promise.reject(error); }

        loadPromise.then(()=>{
          // §8 stale-request protection: a completed load for an earlier
          // selection MUST NOT resurrect old highlight/selection state.
          if(myGeneration !== generation) return;
          const feature = getLoadedFeature(layerId, featureId);
          if(!feature){
            onDiagnostic({ code: 'feature-index-mismatch', siteId: site && site.id, relationshipId: item.relationship.id, layerId, featureId });
            setState(item.relationship.id, { runtimeState: RUNTIME_STATE.UNAVAILABLE });
            return;
          }
          setLayerSelectionState(layerId, true);
          layerFeatureSet(layerId); // ensure tracked even if temporally inactive right now
          const year = getCurrentYear();
          if(isWithinValidity(feature, year)){
            highlightFeature(layerId, featureId);
            layerFeatureSet(layerId).add(featureId);
            setState(item.relationship.id, { runtimeState: item.proposed ? RUNTIME_STATE.PROPOSED : RUNTIME_STATE.DISPLAYED });
          } else {
            setState(item.relationship.id, { runtimeState: RUNTIME_STATE.OUTSIDE_YEAR });
          }
        }).catch(error=>{
          // §8: a failed fetch must roll back selection state, preserve
          // manual state (never touched here) and the open Site record,
          // and never leave a phantom layer or an unhandled rejection.
          if(myGeneration !== generation) return;
          setLayerSelectionState(layerId, false);
          const set = activeLayers.get(layerId);
          if(set){ set.delete(featureId); if(set.size === 0) activeLayers.delete(layerId); }
          onDiagnostic({ code: 'load-failed', siteId: site && site.id, relationshipId: item.relationship.id, layerId, featureId, message: String((error && error.message) || error) });
          setState(item.relationship.id, { runtimeState: RUNTIME_STATE.LOAD_FAILED });
        });
      });

      return { generation: myGeneration, eligibleCount: eligible.length, diagnosticCount: diagnostics.length };
    }

    // §6: called on every timeline/year change. Re-evaluates the CURRENT
    // selection's already-loaded features against the new year without
    // requiring the Site to be re-selected, and without touching any
    // relationship whose layer hasn't finished loading yet (its own load
    // continuation will apply the correct year when it resolves).
    function refreshTemporal(){
      if(!activeSite) return;
      relationshipStates.forEach(state=>{
        if(state.runtimeState === RUNTIME_STATE.LOADING || state.runtimeState === RUNTIME_STATE.LOAD_FAILED || state.runtimeState === RUNTIME_STATE.UNAVAILABLE) return;
        const feature = getLoadedFeature(state.layerId, state.featureId);
        if(!feature) return;
        const year = getCurrentYear();
        const set = layerFeatureSet(state.layerId);
        if(isWithinValidity(feature, year)){
          if(!set.has(state.featureId)){
            highlightFeature(state.layerId, state.featureId);
            set.add(state.featureId);
          }
          state.runtimeState = state.proposed ? RUNTIME_STATE.PROPOSED : RUNTIME_STATE.DISPLAYED;
        } else if(set.has(state.featureId)){
          clearHighlight(state.layerId, state.featureId);
          set.delete(state.featureId);
          state.runtimeState = RUNTIME_STATE.OUTSIDE_YEAR;
        }
      });
      onStateChange(activeSite, relationshipStates.slice());
    }

    return {
      selectSite,
      clearSelection,
      refreshTemporal,
      getActiveSite: ()=> activeSite,
      getRelationshipStates: ()=> relationshipStates.slice(),
      getGeneration: ()=> generation,
    };
  }

  return { createSelectionController };
});
