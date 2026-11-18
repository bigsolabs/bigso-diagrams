import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSidecar } from '../src/sidecar.mjs';

const graph = {
  nodes: ['customer', 'cart', 'gateway'],
  edges: [
    { from: 'customer', to: 'cart', id: 'link-0' },
    { from: 'customer', to: 'cart', id: 'link-1' },
    { from: 'cart', to: 'gateway', id: 'link-2' },
  ],
};
const sidecar = {
  schema: 'bigso-diagrams/sidecar@1',
  elements: { gateway: { description: 'Punto de entrada.' } },
  journeys: [{
    id: 'checkout',
    title: 'Checkout',
    steps: [{ id: 'customer-cart', title: 'El cliente abre el carrito', transition: { from: 'customer', to: 'cart', linkIndex: 0 } }],
  }],
};

const codes = (issues) => issues.map((issue) => issue.code);

test('accepts sidecar references that exist in the Mermaid graph', () => {
  assert.deepEqual(validateSidecar(sidecar, graph), []);
});

test('reports metadata and transition references missing from the Mermaid graph', () => {
  const candidate = structuredClone(sidecar);
  candidate.elements.unknown = { description: 'No existe en Mermaid.' };
  candidate.journeys[0].steps[0].transition.to = 'missing';
  const issues = validateSidecar(candidate, graph);
  assert.ok(issues.some((issue) => issue.path === '$.elements.unknown' && issue.code === 'MISSING_NODE'));
  assert.ok(issues.some((issue) => issue.path.endsWith('.transition.to') && issue.code === 'MISSING_NODE'));
});

test('rejects transitions between existing nodes when the Mermaid edge does not exist', () => {
  const candidate = structuredClone(sidecar);
  candidate.journeys[0].steps[0].transition = { from: 'customer', to: 'gateway' };
  const issues = validateSidecar(candidate, graph);
  assert.ok(issues.some((issue) => issue.path.endsWith('.transition') && issue.code === 'MISSING_TRANSITION'));
});

test('requires linkIndex to disambiguate parallel Mermaid transitions', () => {
  const candidate = structuredClone(sidecar);
  delete candidate.journeys[0].steps[0].transition.linkIndex;
  const issues = validateSidecar(candidate, graph);
  assert.ok(issues.some((issue) => issue.path.endsWith('.transition') && issue.code === 'AMBIGUOUS_TRANSITION'));
  candidate.journeys[0].steps[0].transition.linkIndex = 1;
  assert.deepEqual(validateSidecar(candidate, graph), []);
});

test('rejects linkIndex values outside the existing parallel-edge range', () => {
  const candidate = structuredClone(sidecar);
  candidate.journeys[0].steps[0].transition.linkIndex = 2;
  assert.ok(codes(validateSidecar(candidate, graph)).includes('LINK_INDEX_OUT_OF_RANGE'));
});

test('rejects duplicate journey IDs and duplicate step IDs within one journey', () => {
  const candidate = structuredClone(sidecar);
  candidate.journeys.push(structuredClone(candidate.journeys[0]));
  candidate.journeys[0].steps.push(structuredClone(candidate.journeys[0].steps[0]));
  const issues = validateSidecar(candidate, graph);
  assert.ok(issues.some((issue) => issue.code === 'DUPLICATE_ID' && issue.path === '$.journeys[1].id'));
  assert.ok(issues.some((issue) => issue.code === 'DUPLICATE_ID' && issue.path === '$.journeys[0].steps[1].id'));
});
