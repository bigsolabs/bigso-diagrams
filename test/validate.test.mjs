import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateDiagram } from '../src/validate.mjs';

const examples = ['flowchart', 'architecture', 'sequence', 'erd'];

for (const type of examples) {
  test(`accepts the ${type} example`, async () => {
    const text = await readFile(new URL(`../examples/${type}.json`, import.meta.url), 'utf8');
    const document = JSON.parse(text);
    assert.deepEqual(validateDiagram(document), []);
  });
}
