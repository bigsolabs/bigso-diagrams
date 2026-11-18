import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSidecar } from '../src/sidecar.mjs';

const valid = {
  schema: 'bigso-diagrams/sidecar@1',
  elements: {
    gateway: { description: 'Enruta la solicitud al servicio responsable.', annotations: ['Punto de entrada público'] },
  },
  journeys: [{
    id: 'checkout',
    title: 'Crear un pedido',
    description: 'Recorre la ruta principal del pedido.',
    steps: [{
      id: 'send-to-gateway',
      title: 'La solicitud llega al gateway',
      description: 'El cliente entrega el carrito para procesarlo.',
      transition: { from: 'customer', to: 'cart' },
    }],
  }],
};

test('accepts a versioned sidecar that stores only element metadata and journey references', () => {
  assert.deepEqual(validateSidecar(valid), []);
});

test('rejects unknown schema versions and unexpected graph fields', () => {
  const result = validateSidecar({ ...valid, schema: 'bigso-diagrams/sidecar@2', nodes: [{ id: 'customer' }] });
  assert.ok(result.some((issue) => issue.path === '$.schema' && issue.code === 'INVALID_SCHEMA'));
  assert.ok(result.some((issue) => issue.path === '$.nodes' && issue.code === 'UNEXPECTED_FIELD'));
});

test('requires details and steps to use structured non-empty values', () => {
  const result = validateSidecar({
    schema: 'bigso-diagrams/sidecar@1',
    elements: { gateway: {} },
    journeys: [{ id: 'checkout', title: 'Checkout', steps: [] }],
  });
  assert.ok(result.some((issue) => issue.path === '$.elements.gateway' && issue.code === 'EMPTY_METADATA'));
  assert.ok(result.some((issue) => issue.path === '$.journeys[0].steps' && issue.code === 'TOO_FEW_ITEMS'));
});

test('rejects an empty elements map even when journeys are present', () => {
  const result = validateSidecar({ ...valid, elements: {} });
  assert.ok(result.some((issue) => issue.path === '$.elements' && issue.code === 'TOO_FEW_ITEMS'));
});

test('requires every journey step to describe a source and destination transition', () => {
  const sidecar = structuredClone(valid);
  delete sidecar.journeys[0].steps[0].transition.to;
  const result = validateSidecar(sidecar);
  assert.ok(result.some((issue) => issue.path === '$.journeys[0].steps[0].transition.to' && issue.code === 'INVALID_ID'));
});

test('validates the committed architecture and flow sidecar examples', async () => {
  for (const name of ['flowchart', 'architecture']) {
    const source = await readFile(new URL(`../examples/${name}.meta.json`, import.meta.url), 'utf8');
    assert.deepEqual(validateSidecar(JSON.parse(source)), [], name);
  }
});
