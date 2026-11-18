import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveAgentResponse } from '../src/agent-workflow.mjs';

const source = JSON.parse(await readFile(new URL('../examples/flowchart.json', import.meta.url), 'utf8'));

test('accepts a simulated agent creation only when its document is valid', () => {
  const result = resolveAgentResponse({ action: 'create', document: source });
  assert.equal(result.status, 'ready');
  assert.equal(result.operation, 'create');
  assert.deepEqual(result.document, source);
});

test('a simulated clarification request produces a question and no document', () => {
  const result = resolveAgentResponse({ action: 'question', question: '¿El paso debe fallar o reintentarse?' });
  assert.deepEqual(result, { status: 'question', question: '¿El paso debe fallar o reintentarse?', shouldWrite: false });
});

test('an unsupported diagram type is reported with supported alternatives', () => {
  const result = resolveAgentResponse({ action: 'unsupported', requestedType: 'mind-map' });
  assert.deepEqual(result, {
    status: 'unsupported',
    requestedType: 'mind-map',
    supportedTypes: ['flowchart', 'architecture', 'sequence', 'erd'],
    shouldWrite: false,
  });
});

test('an update applies only requested JSON Pointer changes and preserves unrelated content', () => {
  const existing = structuredClone(source);
  existing.description = 'Mantener descripción existente';
  const before = structuredClone(existing);
  const result = resolveAgentResponse({
    action: 'update',
    patches: [{ op: 'replace', path: '/payload/nodes/2/label', value: 'Enviar factura' }],
  }, existing);
  assert.equal(result.status, 'ready');
  assert.equal(result.operation, 'update');
  assert.equal(result.document.payload.nodes[2].label, 'Enviar factura');
  assert.equal(result.document.description, before.description);
  assert.deepEqual(result.document.payload.nodes.filter((_, i) => i !== 2), before.payload.nodes.filter((_, i) => i !== 2));
  assert.deepEqual(result.document.payload.edges, before.payload.edges);
  assert.deepEqual(existing, before);
});

test('rejects a patch whose target does not exist without mutating the source', () => {
  const existing = structuredClone(source);
  const before = structuredClone(existing);
  assert.throws(() => resolveAgentResponse({ action: 'update', patches: [{ op: 'replace', path: '/payload/nodes/99/label', value: 'bad' }] }, existing), /Patch target does not exist/);
  assert.deepEqual(existing, before);
});
