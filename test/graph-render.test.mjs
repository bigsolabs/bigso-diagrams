import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderDiagram } from '../src/render/index.mjs';

const document = JSON.parse(await readFile(new URL('../examples/flowchart.json', import.meta.url), 'utf8'));

test('renders both decision outcomes and is deterministic', () => {
  const first = renderDiagram(document);
  assert.match(first, /Sí/);
  assert.match(first, /No/);
  assert.equal(renderDiagram(document), first);
});
