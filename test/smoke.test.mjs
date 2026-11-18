import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('project is a private, dependency-free Node ESM package', () => {
  assert.equal(pkg.name, 'bigso-diagrams');
  assert.equal(pkg.private, true);
  assert.equal(pkg.type, 'module');
  assert.equal(pkg.engines.node, '>=18');
  assert.deepEqual(pkg.dependencies, undefined);
});
