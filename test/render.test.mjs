import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderDiagram } from '../src/render/index.mjs';

async function example(type) {
  return JSON.parse(await readFile(new URL(`../examples/${type}.json`, import.meta.url), 'utf8'));
}

test('renders flow decisions and labeled alternatives as SVG', async () => {
  const svg = renderDiagram(await example('flowchart'));
  assert.match(svg, /^<svg\b/);
  assert.match(svg, /kind-decision/);
  assert.match(svg, />Sí</);
});

test('renders architecture components and dependency labels', async () => {
  const svg = renderDiagram(await example('architecture'));
  assert.match(svg, /kind-database/);
  assert.match(svg, />HTTPS</);
});

test('renders sequence messages in their declared order', async () => {
  const svg = renderDiagram(await example('sequence'));
  assert.ok(svg.indexOf('Enviar pago') < svg.indexOf('Autorizar tarjeta'));
  assert.ok(svg.indexOf('Autorizar tarjeta') < svg.indexOf('Pago aprobado'));
});

test('renders ERD attributes and cardinalities', async () => {
  const svg = renderDiagram(await example('erd'));
  assert.match(svg, /Cliente/);
  assert.match(svg, /customer_id/);
  assert.match(svg, /many/);
});

test('escapes text supplied by the diagram document', async () => {
  const doc = await example('flowchart');
  doc.title = '<script>alert(1)</script>';
  const svg = renderDiagram(doc);
  assert.doesNotMatch(svg, /<script>/);
  assert.match(svg, /&lt;script&gt;/);
});
