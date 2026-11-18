import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { exportHtml, exportSvg } from '../src/export.mjs';

const doc = JSON.parse(await readFile(new URL('../examples/flowchart.json', import.meta.url), 'utf8'));

test('exports interactive HTML without remote assets', () => {
  const html = exportHtml(doc);
  assert.match(html, /<svg\b/);
  assert.match(html, /aria-label="Acercar"/);
  assert.doesNotMatch(html, /<script\s+src=|<link\b|fetch\s*\(/i);
});

test('exports a standalone SVG without foreignObject', () => {
  const svg = exportSvg(doc);
  assert.match(svg, /^<svg\b/);
  assert.doesNotMatch(svg, /foreignObject|<script\b/i);
});

test('does not mutate the editable source when export validation fails', () => {
  const invalid = structuredClone(doc);
  invalid.payload.edges[0].to = 'missing';
  const before = structuredClone(invalid);
  assert.throws(() => exportHtml(invalid), /Invalid diagram/);
  assert.deepEqual(invalid, before);
});
