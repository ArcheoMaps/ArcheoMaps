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
  assert.equal(result.accepted.length, 1);
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
  const second = JSON.parse(JSON.stringify(source.features[0]));
  second.properties.id = 'geometry-hadrians-wall-fixture-alpha';
  second.properties.sourceFeatureId = 'fixture-segment-2';
  const dataset = fixture('geometry-valid.dataset.json');
  dataset.featureCount = 2;
  const a = processPackage({ type: 'FeatureCollection', features: [source.features[0], second] }, dataset);
  const b = processPackage({ type: 'FeatureCollection', features: [second, source.features[0]] }, dataset);
  assert.equal(stableJson(a.accepted), stableJson(b.accepted));
});

test('geometryRole default may be overridden without quarantine', () => {
  const source = fixture('geometry-valid.geojson');
  source.features[0].properties.featureClass = 'political-boundary';
  source.features[0].properties.geometryRole = 'property-boundary';
  const result = processPackage(source, fixture('geometry-valid.dataset.json'));
  assert.equal(result.quarantined.length, 0);
  assert.ok(result.accepted.length === 1);
});

