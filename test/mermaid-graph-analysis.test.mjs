import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateMermaidSource } from '../src/adapters/mermaid.mjs';

const readFixture = (name) => readFile(new URL(`../examples/${name}.mmd`, import.meta.url), 'utf8');

test('extracts flowchart node IDs and labeled directed edges from Mermaid parser semantics', async () => {
  const result = await validateMermaidSource(await readFixture('flowchart'));
  assert.equal(result.ok, true);
  assert.ok(result.graph.nodes.includes('available'));
  assert.ok(result.graph.edges.some((edge) => edge.from === 'available' && edge.to === 'payment' && edge.label === 'Sí'));
  assert.ok(result.graph.edges.some((edge) => edge.from === 'available' && edge.to === 'reject' && edge.label === 'No'));
});

test('extracts architecture groups, services, and dependencies', async () => {
  const result = await validateMermaidSource(await readFixture('architecture'));
  assert.ok(result.graph.nodes.includes('platform'));
  assert.ok(result.graph.nodes.includes('orderdb'));
  assert.ok(result.graph.edges.some((edge) => edge.from === 'orders' && edge.to === 'payments'));
});

test('extracts sequence participants and ordered messages as directed transitions', async () => {
  const result = await validateMermaidSource(await readFixture('sequence'));
  assert.ok(result.graph.nodes.includes('cliente'));
  assert.ok(result.graph.edges.some((edge) => edge.from === 'cliente' && edge.to === 'gateway' && edge.label === 'Solicitar pedido'));
  assert.ok(result.graph.edges.some((edge) => edge.from === 'inventario' && edge.to === 'pedidos'));
});
