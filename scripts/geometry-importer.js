#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GEOMETRY_TYPES = new Set(['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon']);
const ROLES = new Set(['property-boundary', 'buffer-zone', 'natural-feature', 'linear-feature', 'approximate-extent']);
const CLASSES = new Set(['defensive-wall', 'road', 'trade-route', 'pilgrimage-route', 'maritime-route', 'historical-coastline', 'ice-extent', 'landscape-extent', 'political-boundary']);
const MODES = new Set(['static', 'validity', 'snapshot']);
const CONFIDENCE = new Set(['high', 'medium', 'low']);
const STATUSES = new Set(['active', 'proposed', 'deprecated', 'rejected', 'quarantined']);
const DEFAULT_ROLES = new Map([
  ['defensive-wall', 'linear-feature'], ['road', 'linear-feature'], ['trade-route', 'linear-feature'],
  ['pilgrimage-route', 'linear-feature'], ['maritime-route', 'linear-feature'], ['historical-coastline', 'linear-feature'],
  ['ice-extent', 'natural-feature'], ['landscape-extent', 'natural-feature'], ['political-boundary', 'approximate-extent']
]);

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith('--') || !argv[i + 1]) throw new Error(`Expected --name value, received ${key}`);
    out[key.slice(2)] = argv[++i];
  }
  for (const required of ['input', 'dataset', 'output-dir']) {
    if (!out[required]) throw new Error(`Missing required argument --${required}`);
  }
  return out;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function issue(code, message, pointer = '') {
  return { code, message, pointer };
}

function isHyphenId(value, prefix) {
  return typeof value === 'string' && new RegExp(`^${prefix}-[a-z0-9]+(?:-[a-z0-9]+)*$`).test(value);
}

function checkFinite(value, pointer, issues) {
  if (typeof value !== 'number' || !Number.isFinite(value)) issues.push(issue('COORDINATE_NOT_FINITE', 'Coordinate must be a finite number.', pointer));
}

function validatePosition(position, pointer, issues) {
  if (!Array.isArray(position) || position.length < 2) {
    issues.push(issue('POSITION_INVALID', 'Position must contain longitude and latitude.', pointer));
    return;
  }
  checkFinite(position[0], `${pointer}/0`, issues);
  checkFinite(position[1], `${pointer}/1`, issues);
  if (Number.isFinite(position[0]) && (position[0] < -180 || position[0] > 180)) issues.push(issue('LONGITUDE_RANGE', 'Longitude must be between -180 and 180.', `${pointer}/0`));
  if (Number.isFinite(position[1]) && (position[1] < -90 || position[1] > 90)) issues.push(issue('LATITUDE_RANGE', 'Latitude must be between -90 and 90.', `${pointer}/1`));
}

function walkPositions(coordinates, depth, pointer, issues) {
  if (depth === 0) return validatePosition(coordinates, pointer, issues);
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    issues.push(issue('COORDINATES_EMPTY', 'Coordinate array must not be empty.', pointer));
    return;
  }
  coordinates.forEach((child, index) => walkPositions(child, depth - 1, `${pointer}/${index}`, issues));
}

function validateGeometry(geometry, pointer, issues) {
  if (!geometry || typeof geometry !== 'object') return issues.push(issue('GEOMETRY_MISSING', 'Feature geometry is required.', pointer));
  if (!GEOMETRY_TYPES.has(geometry.type)) return issues.push(issue('GEOMETRY_TYPE', `Unsupported geometry type: ${geometry.type}`, `${pointer}/type`));
  const depths = { Point: 0, MultiPoint: 1, LineString: 1, MultiLineString: 2, Polygon: 2, MultiPolygon: 3 };
  walkPositions(geometry.coordinates, depths[geometry.type], `${pointer}/coordinates`, issues);
  if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates) && geometry.coordinates.length < 2) issues.push(issue('LINE_TOO_SHORT', 'LineString requires at least two positions.', `${pointer}/coordinates`));
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) validatePolygonRings(geometry.coordinates, `${pointer}/coordinates`, issues);
  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) geometry.coordinates.forEach((polygon, i) => validatePolygonRings(polygon, `${pointer}/coordinates/${i}`, issues));
}

function validatePolygonRings(rings, pointer, issues) {
  rings.forEach((ring, i) => {
    if (!Array.isArray(ring) || ring.length < 4) return issues.push(issue('RING_TOO_SHORT', 'Polygon ring requires at least four positions.', `${pointer}/${i}`));
    if (JSON.stringify(ring[0]) !== JSON.stringify(ring[ring.length - 1])) issues.push(issue('RING_NOT_CLOSED', 'Polygon ring must end at its first position.', `${pointer}/${i}`));
  });
}

function validateDataset(dataset) {
  const issues = [];
  if (!isHyphenId(dataset.id, 'dataset')) issues.push(issue('DATASET_ID', 'Dataset id must be a dataset- hyphen slug.', '/id'));
  for (const field of ['name', 'version', 'licence', 'attribution']) if (typeof dataset[field] !== 'string' || !dataset[field].trim()) issues.push(issue('DATASET_FIELD', `${field} is required.`, `/${field}`));
  if (!Array.isArray(dataset.geometryTypes) || dataset.geometryTypes.length === 0) issues.push(issue('DATASET_GEOMETRY_TYPES', 'geometryTypes must be a non-empty array.', '/geometryTypes'));
  else dataset.geometryTypes.forEach((type, i) => { if (!GEOMETRY_TYPES.has(type)) issues.push(issue('DATASET_GEOMETRY_TYPE', `Unsupported geometry type: ${type}`, `/geometryTypes/${i}`)); });
  if (!Number.isInteger(dataset.featureCount) || dataset.featureCount < 0) issues.push(issue('DATASET_FEATURE_COUNT', 'featureCount must be a non-negative integer.', '/featureCount'));
  if (!STATUSES.has(dataset.status)) issues.push(issue('REGISTRY_STATUS', 'Dataset status is not canonical.', '/status'));
  if (!Array.isArray(dataset.transformations)) issues.push(issue('DATASET_TRANSFORMATIONS', 'transformations must be an array.', '/transformations'));
  return issues;
}

function validateMetadata(properties, geometryType, pointer) {
  const issues = [];
  if (!isHyphenId(properties.id, 'geometry')) issues.push(issue('GEOMETRY_ID', 'Geometry id must be a geometry- hyphen slug.', `${pointer}/id`));
  if (!ROLES.has(properties.geometryRole)) issues.push(issue('GEOMETRY_ROLE', 'geometryRole is not canonical.', `${pointer}/geometryRole`));
  if (!CLASSES.has(properties.featureClass)) issues.push(issue('FEATURE_CLASS', 'featureClass is not canonical.', `${pointer}/featureClass`));
  if (properties.geometryType !== geometryType) issues.push(issue('GEOMETRY_TYPE_MISMATCH', 'properties.geometryType must match geometry.type.', `${pointer}/geometryType`));
  if (!MODES.has(properties.temporalMode)) issues.push(issue('TEMPORAL_MODE', 'temporalMode is not canonical.', `${pointer}/temporalMode`));
  if (properties.spatialConfidence != null && !CONFIDENCE.has(properties.spatialConfidence)) issues.push(issue('SPATIAL_CONFIDENCE', 'spatialConfidence is not canonical.', `${pointer}/spatialConfidence`));
  if (properties.uncertaintyMetres != null && (typeof properties.uncertaintyMetres !== 'number' || properties.uncertaintyMetres < 0 || !Number.isFinite(properties.uncertaintyMetres))) issues.push(issue('UNCERTAINTY', 'uncertaintyMetres must be a non-negative finite number.', `${pointer}/uncertaintyMetres`));
  if (!isHyphenId(properties.datasetId, 'dataset')) issues.push(issue('DATASET_REFERENCE', 'datasetId must be a dataset- hyphen slug.', `${pointer}/datasetId`));
  if (!Array.isArray(properties.sourceIds)) issues.push(issue('SOURCE_IDS', 'sourceIds must be an array.', `${pointer}/sourceIds`));
  if (typeof properties.licence !== 'string' || !properties.licence.trim()) issues.push(issue('LICENCE', 'licence is required.', `${pointer}/licence`));
  if (!STATUSES.has(properties.status)) issues.push(issue('REGISTRY_STATUS', 'Feature status is not canonical.', `${pointer}/status`));
  if (Array.isArray(properties.sourceIds) && properties.sourceIds.length === 0 && !['proposed', 'quarantined'].includes(properties.status)) issues.push(issue('SOURCE_REQUIRED', 'Active/deprecated/rejected features require sourceIds.', `${pointer}/sourceIds`));
  if (properties.temporalMode === 'validity' && properties.validFrom == null && properties.validTo == null) issues.push(issue('VALIDITY_DATES', 'Validity features require at least one temporal bound.', pointer));
  if (properties.validFrom != null && !Number.isFinite(properties.validFrom)) issues.push(issue('VALID_FROM', 'validFrom must be numeric or null.', `${pointer}/validFrom`));
  if (properties.validTo != null && !Number.isFinite(properties.validTo)) issues.push(issue('VALID_TO', 'validTo must be numeric or null.', `${pointer}/validTo`));
  if (Number.isFinite(properties.validFrom) && Number.isFinite(properties.validTo) && properties.validFrom > properties.validTo) issues.push(issue('DATE_ORDER', 'validFrom must not exceed validTo.', pointer));
  const defaultRole = DEFAULT_ROLES.get(properties.featureClass);
  if (defaultRole && defaultRole !== properties.geometryRole) issues.push(issue('ROLE_OVERRIDE', `Default role for ${properties.featureClass} is ${defaultRole}; retained as an evidence-dependent override.`, `${pointer}/geometryRole`));
  return issues;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  return value;
}

function stableJson(value) {
  return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function processPackage(collection, dataset) {
  const fatal = validateDataset(dataset);
  if (!collection || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) fatal.push(issue('FEATURE_COLLECTION', 'Input must be a GeoJSON FeatureCollection.', ''));
  const accepted = [];
  const quarantined = [];
  const seen = new Set();
  const features = Array.isArray(collection?.features) ? collection.features : [];
  features.forEach((feature, index) => {
    const issues = [];
    if (!feature || feature.type !== 'Feature') issues.push(issue('FEATURE_TYPE', 'Entry must be a GeoJSON Feature.', `/features/${index}/type`));
    validateGeometry(feature?.geometry, `/features/${index}/geometry`, issues);
    issues.push(...validateMetadata(feature?.properties || {}, feature?.geometry?.type, `/features/${index}/properties`));
    if (feature?.properties?.datasetId !== dataset.id) issues.push(issue('DATASET_ID_MISMATCH', 'Feature datasetId must match the supplied dataset.', `/features/${index}/properties/datasetId`));
    const id = feature?.properties?.id;
    if (id && seen.has(id)) issues.push(issue('DUPLICATE_ID', `Duplicate geometry id: ${id}`, `/features/${index}/properties/id`));
    if (id) seen.add(id);
    const hardIssues = issues.filter(item => item.code !== 'ROLE_OVERRIDE');
    if (hardIssues.length) quarantined.push({ index, id: id || null, issues, feature });
    else accepted.push({ ...feature, properties: canonicalize(feature.properties) });
  });
  if (dataset.featureCount !== features.length) fatal.push(issue('FEATURE_COUNT_MISMATCH', `Dataset declares ${dataset.featureCount}; input contains ${features.length}.`, '/featureCount'));
  const observed = [...new Set(features.map(f => f?.geometry?.type).filter(Boolean))].sort();
  if (stableJson(observed) !== stableJson([...dataset.geometryTypes].sort())) fatal.push(issue('GEOMETRY_TYPES_MISMATCH', `Dataset geometryTypes ${JSON.stringify(dataset.geometryTypes)} do not match observed ${JSON.stringify(observed)}.`, '/geometryTypes'));
  accepted.sort((a, b) => a.properties.id.localeCompare(b.properties.id));
  quarantined.sort((a, b) => (a.id || '').localeCompare(b.id || '') || a.index - b.index);
  return { fatal, accepted, quarantined };
}

function markdownReport(report) {
  const lines = [
    '# Geometry Import Validation Report', '',
    `- Dataset: \`${report.datasetId}\``,
    `- Input features: ${report.counts.input}`,
    `- Accepted: ${report.counts.accepted}`,
    `- Quarantined: ${report.counts.quarantined}`,
    `- Package errors: ${report.counts.fatal}`,
    `- Status: **${report.status.toUpperCase()}**`,
    `- Canonical SHA-256: \`${report.outputSha256 || 'not produced'}\``, ''
  ];
  if (report.fatal.length) {
    lines.push('## Package errors', '');
    report.fatal.forEach(i => lines.push(`- \`${i.code}\` ${i.pointer || '/'} — ${i.message}`));
    lines.push('');
  }
  if (report.quarantined.length) {
    lines.push('## Quarantined features', '');
    report.quarantined.forEach(item => {
      lines.push(`### ${item.id || `feature-${item.index}`}`, '');
      item.issues.forEach(i => lines.push(`- \`${i.code}\` ${i.pointer} — ${i.message}`));
      lines.push('');
    });
  }
  return `${lines.join('\n')}\n`;
}

function run(args) {
  const collection = readJson(args.input);
  const dataset = readJson(args.dataset);
  const result = processPackage(collection, dataset);
  fs.mkdirSync(args['output-dir'], { recursive: true });
  const outputCollection = { type: 'FeatureCollection', features: result.accepted };
  const outputText = stableJson(outputCollection);
  const report = {
    schemaVersion: 'geometry-import/0.1', datasetId: dataset.id || null,
    status: result.fatal.length ? 'failed' : result.quarantined.length ? 'quarantined' : 'passed',
    counts: { input: Array.isArray(collection.features) ? collection.features.length : 0, accepted: result.accepted.length, quarantined: result.quarantined.length, fatal: result.fatal.length },
    outputSha256: result.fatal.length ? null : sha256(outputText),
    fatal: result.fatal,
    quarantined: result.quarantined.map(({ index, id, issues }) => ({ index, id, issues }))
  };
  if (!result.fatal.length) fs.writeFileSync(path.join(args['output-dir'], 'canonical.geojson'), outputText);
  fs.writeFileSync(path.join(args['output-dir'], 'quarantine.json'), stableJson({ features: result.quarantined }));
  fs.writeFileSync(path.join(args['output-dir'], 'validation-report.json'), stableJson(report));
  fs.writeFileSync(path.join(args['output-dir'], 'validation-report.md'), markdownReport(report));
  return report;
}

if (require.main === module) {
  try {
    const report = run(parseArgs(process.argv));
    process.stdout.write(`${JSON.stringify(report.counts)} status=${report.status}\n`);
    process.exitCode = report.status === 'passed' ? 0 : report.status === 'quarantined' ? 2 : 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { processPackage, stableJson, validateDataset, validateGeometry, validateMetadata };

