import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateMermaidSource } from '../src/adapters/mermaid.mjs';

const fixture = async (name) => readFile(new URL(`../examples/${name}.mmd`, import.meta.url), 'utf8');

test('validates the three documented Mermaid syntax families', async () => {
  for (const [name, expected] of [['architecture', 'architecture'], ['flowchart', 'flowchart'], ['sequence', 'sequence']]) {
    const result = await validateMermaidSource(await fixture(name));
    assert.equal(result.ok, true, name);
    assert.equal(result.supportedType, expected, name);
    assert.deepEqual(result.issues, [], name);
  }
});

test('reports Mermaid syntax errors with a one-based line when available', async () => {
  const result = await validateMermaidSource('flowchart LR\n  a-->\n');
  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'MERMAID_PARSE');
  assert.equal(result.issues[0].line, 3);
  assert.match(result.issues[0].message, /Parse error/);
});

test('rejects Mermaid diagram families outside the published support matrix', async () => {
  const result = await validateMermaidSource('gantt\n  title Roadmap\n  dateFormat YYYY-MM-DD\n  section Delivery\n  Build: done, 2026-01-01, 2d\n');
  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'UNSUPPORTED_DIAGRAM');
});

test('rejects non-string and empty source with actionable diagnostics', async () => {
  for (const source of [null, '', '   ']) {
    const result = await validateMermaidSource(source);
    assert.equal(result.ok, false);
    assert.equal(result.issues[0].code, 'INVALID_SOURCE');
  }
});

test('rejects source-controlled renderer configuration and click callbacks', async () => {
  const newline = String.fromCharCode(10);
  const sources = [
    ['---', 'config:', '  securityLevel: loose', '---', 'flowchart LR', ' a-->b'].join(newline),
    ['%%{init: {"securityLevel":"loose"}}%%', 'flowchart LR', ' a-->b'].join(newline),
    ['flowchart LR', ' a-->b', ' click a callback "runCode"'].join(newline),
    'flowchart LR; a-->b; click a callback "runCode"',
  ];
  for (const source of sources) {
    const result = await validateMermaidSource(source);
    assert.equal(result.ok, false);
    assert.ok(['UNSUPPORTED_CONFIG', 'UNSUPPORTED_CALLBACK'].includes(result.issues[0].code));
  }
});
