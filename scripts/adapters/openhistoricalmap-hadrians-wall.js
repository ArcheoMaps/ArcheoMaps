#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const RELATION_ID = 2692717;
const DATASET_ID = 'dataset-openhistoricalmap-hadrians-wall';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  if (!args.input || !args['output-dir']) throw new Error('Usage: --input OHM_LOOKUP.json --output-dir DIRECTORY');
  return args;
}

function adapt(payload, importedAt = new Date().toISOString().slice(0, 10)) {
  if (!Array.isArray(payload)) throw new Error('OHM lookup response must be an array.');
  const source = payload.find(item => item?.osm_type === 'relation' && item?.osm_id === RELATION_ID);
  if (!source) throw new Error(`OHM relation ${RELATION_ID} was not present.`);
  if (source.geojson?.type !== 'MultiLineString') throw new Error('Hadrian\'s Wall relation must supply MultiLineString geometry.');
  const start = Number(source.extratags?.start_date);
  const end = Number(source.extratags?.end_date);
  if (!Number.isFinite(start) || !Number.isFinite(end)) throw new Error('OHM start_date and end_date must both be numeric.');

  const feature = {
    type: 'Feature',
    geometry: source.geojson,
    properties: {
      id: 'geometry-hadrians-wall-openhistoricalmap-main-line',
      entityId: 'entity-hadrians-wall',
      name: source.namedetails?.['name:en'] || source.namedetails?.name || 'Hadrian\'s Wall',
      geometryRole: 'linear-feature',
      featureClass: 'defensive-wall',
      geometryType: 'MultiLineString',
      validFrom: start,
      validTo: end,
      temporalMode: 'validity',
      spatialConfidence: 'medium',
      uncertaintyMetres: null,
      datasetId: DATASET_ID,
      sourceFeatureId: `OHM relation ${RELATION_ID}`,
      sourceIds: [`source-openhistoricalmap-relation-${RELATION_ID}`],
      licence: 'CC0-1.0',
      status: 'proposed'
    }
  };
  const dataset = {
    id: DATASET_ID,
    name: 'Hadrian\'s Wall — OpenHistoricalMap pilot',
    version: `OHM relation ${RELATION_ID}; retrieved ${importedAt}`,
    sourceUrl: `https://www.openhistoricalmap.org/relation/${RELATION_ID}`,
    licence: 'CC0-1.0',
    attribution: 'OpenHistoricalMap contributors',
    geometryTypes: ['MultiLineString'],
    geographicCoverage: 'Hadrian\'s Wall, northern England',
    chronologicalCoverage: { start, end },
    accuracyResolution: { description: 'Community-mapped alignment; no uniform surveyed accuracy stated', nominalResolutionMetres: null },
    importedAt,
    transformations: ['OHM Nominatim relation geometry mapped to ArcheoMaps Geometry Schema v0.1; coordinates retained unchanged'],
    featureCount: 1,
    status: 'proposed'
  };
  return { collection: { type: 'FeatureCollection', features: [feature] }, dataset };
}

function run(args) {
  const payload = JSON.parse(fs.readFileSync(args.input, 'utf8'));
  const output = adapt(payload);
  fs.mkdirSync(args['output-dir'], { recursive: true });
  fs.writeFileSync(path.join(args['output-dir'], 'mapped.geojson'), `${JSON.stringify(output.collection, null, 2)}\n`);
  fs.writeFileSync(path.join(args['output-dir'], 'dataset.json'), `${JSON.stringify(output.dataset, null, 2)}\n`);
  return output;
}

if (require.main === module) {
  try { run(parseArgs(process.argv)); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = { adapt, RELATION_ID, DATASET_ID };
