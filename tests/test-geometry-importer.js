'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { processPackage, stableJson } = require('../scripts/geometry-importer');

const fixture = name => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8'));

test('valid fixture passes without quarantine', () => {
  const result = processPackage(fixture('geometry-valid.geojson'), fixture('geometry-valid.dataset.json'));
  assert.deepEqual(result.fatal, []);
  assert.equal(result.accepted.length, 3);
  assert.equal(result.quarantined.length, 0);
});

test('invalid fixture is quarantined with expected safety codes', () => {
  const result = processPackage(fixture('geometry-invalid.geojson'), fixture('geometry-invalid.dataset.json'));
  assert.deepEqual(result.fatal, []);
  assert.equal(result.accepted.length, 0);
  assert.equal(result.quarantined.length, 2);
  const codes = new Set(result.quarantined.flatMap(item => item.issues.map(i => i.code)));
  for (const code of ['LONGITUDE_RANGE', 'LATITUDE_RANGE', 'GEOMETRY_ID', 'FEATURE_CLASS', 'GEOMETRY_TYPE_MISMATCH', 'DATE_ORDER', 'REGISTRY_STATUS', 'LINE_TOO_SHORT', 'DATASET_ID_MISMATCH', 'SOURCE_REQUIRED']) assert.ok(codes.has(code), `missing ${code}`);
});

test('canonical output is deterministic regardless of input feature order', () => {
  const source = fixture('geometry-valid.geojson');
  const dataset = fixture('geometry-valid.dataset.json');
  const a = processPackage(source, dataset);
  const b = processPackage({ type: 'FeatureCollection', features: [...source.features].reverse() }, dataset);
  assert.equal(stableJson(a.accepted), stableJson(b.accepted));
});

test('geometryRole default may be overridden without quarantine', () => {
  const source = fixture('geometry-valid.geojson');
  source.features[0].properties.featureClass = 'political-boundary';
  source.features[0].properties.geometryRole = 'property-boundary';
  const result = processPackage(source, fixture('geometry-valid.dataset.json'));
  assert.equal(result.quarantined.length, 0);
  assert.equal(result.accepted.length, 3);
  assert.equal(result.notices.length, 1);
  assert.equal(result.notices[0].id, source.features[0].properties.id);
  assert.ok(result.notices[0].issues.some(item => item.code === 'ROLE_OVERRIDE'));
});

test('missing dataset geometryTypes returns a fatal issue instead of throwing', () => {
  const dataset = fixture('geometry-valid.dataset.json');
  delete dataset.geometryTypes;
  const result = processPackage(fixture('geometry-valid.geojson'), dataset);
  assert.ok(result.fatal.some(item => item.code === 'DATASET_GEOMETRY_TYPES'));
});

test('both features sharing an id are quarantined', () => {
  const source = fixture('geometry-valid.geojson');
  const first = JSON.parse(JSON.stringify(source.features[0]));
  const second = JSON.parse(JSON.stringify(first));
  second.geometry.coordinates[0][0] = -3;
  second.properties.sourceIds = ['source-other-fixture'];
  const dataset = fixture('geometry-valid.dataset.json');
  dataset.geometryTypes = ['LineString'];
  dataset.featureCount = 2;
  const result = processPackage({ type: 'FeatureCollection', features: [first, second] }, dataset);
  assert.deepEqual(result.fatal, []);
  assert.equal(result.accepted.length, 0);
  assert.equal(result.quarantined.length, 2);
  assert.ok(result.quarantined.every(item => item.issues.some(issue => issue.code === 'DUPLICATE_ID')));
});

test('dataset validation covers malformed fields and geometry type entries', () => {
  const dataset = fixture('geometry-valid.dataset.json');
  dataset.name = '';
  dataset.geometryTypes = ['LineString', 'GeometryCollection'];
  dataset.featureCount = 'three';
  dataset.transformations = null;
  const result = processPackage(fixture('geometry-valid.geojson'), dataset);
  const codes = new Set(result.fatal.map(item => item.code));
  for (const code of ['DATASET_FIELD', 'DATASET_GEOMETRY_TYPE', 'DATASET_FEATURE_COUNT', 'DATASET_TRANSFORMATIONS']) assert.ok(codes.has(code), `missing ${code}`);
});

test('coordinate validation covers invalid positions, empty arrays, and non-finite values', () => {
  const source = fixture('geometry-valid.geojson');
  const variants = [
    { ...source.features[0], geometry: { type: 'Point', coordinates: [1] }, properties: { ...source.features[0].properties, id: 'geometry-invalid-position', geometryType: 'Point' } },
    { ...source.features[0], geometry: { type: 'LineString', coordinates: [] }, properties: { ...source.features[0].properties, id: 'geometry-empty-coordinates' } },
    { ...source.features[0], geometry: { type: 'Point', coordinates: [null, 1] }, properties: { ...source.features[0].properties, id: 'geometry-non-finite-coordinate', geometryType: 'Point' } }
  ];
  const dataset = fixture('geometry-valid.dataset.json');
  dataset.geometryTypes = ['Point', 'LineString'];
  dataset.featureCount = variants.length;
  const result = processPackage({ type: 'FeatureCollection', features: variants }, dataset);
  const codes = new Set(result.quarantined.flatMap(item => item.issues.map(issue => issue.code)));
  for (const code of ['POSITION_INVALID', 'COORDINATES_EMPTY', 'COORDINATE_NOT_FINITE']) assert.ok(codes.has(code), `missing ${code}`);
});

test('polygon validation covers short and unclosed rings', () => {
  const source = fixture('geometry-valid.geojson').features[1];
  const short = JSON.parse(JSON.stringify(source));
  short.properties.id = 'geometry-short-ring';
  short.geometry.coordinates = [[[0, 0], [1, 0], [0, 0]]];
  const open = JSON.parse(JSON.stringify(source));
  open.properties.id = 'geometry-open-ring';
  open.geometry.coordinates = [[[0, 0], [1, 0], [1, 1], [0, 1]]];
  const dataset = fixture('geometry-valid.dataset.json');
  dataset.geometryTypes = ['Polygon'];
  dataset.featureCount = 2;
  const result = processPackage({ type: 'FeatureCollection', features: [short, open] }, dataset);
  const codes = new Set(result.quarantined.flatMap(item => item.issues.map(issue => issue.code)));
  assert.ok(codes.has('RING_TOO_SHORT'));
  assert.ok(codes.has('RING_NOT_CLOSED'));
});
