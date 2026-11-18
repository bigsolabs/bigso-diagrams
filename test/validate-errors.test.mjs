import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateDiagram } from '../src/validate.mjs';

async function example(type) {
  return JSON.parse(await readFile(new URL(`../examples/${type}.json`, import.meta.url), 'utf8'));
}

const hasPath = (issues, path) => assert.ok(issues.some((issue) => issue.path === path), `expected diagnostic at ${path}: ${JSON.stringify(issues)}`);

test('rejects an unknown document version', async () => {
  const doc = await example('flowchart');
  doc.schema = 'bigso-diagrams/diagram@2';
  hasPath(validateDiagram(doc), '$.schema');
});

test('rejects a flowchart edge to a missing node', async () => {
  const doc = await example('flowchart');
  doc.payload.edges[0].to = 'missing';
  hasPath(validateDiagram(doc), '$.payload.edges[0].to');
});

test('rejects duplicate identifiers', async () => {
  const doc = await example('architecture');
  doc.payload.components[1].id = doc.payload.components[0].id;
  hasPath(validateDiagram(doc), '$.payload.components[1].id');
});

test('rejects invalid ERD cardinality', async () => {
  const doc = await example('erd');
  doc.payload.relationships[0].toCardinality = 'some';
  hasPath(validateDiagram(doc), '$.payload.relationships[0].toCardinality');
});

test('reports malformed root values without throwing', () => {
  hasPath(validateDiagram(null), '$');
});
