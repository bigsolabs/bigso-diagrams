import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('project stays private, Node ESM, and pins the Mermaid renderer', () => {
  assert.equal(pkg.name, 'bigso-diagrams');
  assert.equal(pkg.private, true);
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.engines.node, '>=18');
  assert.deepEqual(pkg.dependencies, { esbuild: '0.28.2', jsdom: '22.1.0', mermaid: '11.17.2' });
  assert.deepEqual(pkg.overrides, { katex: '0.18.10' });
});
