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

test('exposes a card model for plain flowcharts without changing graph identity', async () => {
  const result = await validateMermaidSource('flowchart LR\n A[Start] -->|go| B{Choice}\n B --> A\n A --> B');
  assert.equal(result.ok, true);
  assert.deepEqual(result.graph.nodes, ['A', 'B']);
  assert.deepEqual(result.graph.model, {
    supported: true, direction: 'LR',
    nodes: [{ id: 'A', label: 'Start', shape: 'square' }, { id: 'B', label: 'Choice', shape: 'diamond' }],
    edges: result.graph.edges.map(({from, to, id, label, linkIndex}) => ({from, to, id, label, linkIndex})),
  });
});

test('card model accepts the flowchart example and normalizes direction and shapes', async () => {
  const example = await validateMermaidSource(await fixture('flowchart'));
  assert.equal(example.graph.model.supported, true);
  assert.equal(example.graph.model.nodes.find((node) => node.id === 'available').shape, 'diamond');
  assert.equal(example.graph.model.edges.find((edge) => edge.label === 'Sí').from, 'available');
  const result = await validateMermaidSource('graph TD\n A(Round) --> B[Square]');
  assert.equal(result.graph.model.supported, true);
  assert.equal(result.graph.model.direction, 'TB');
  assert.equal(result.graph.model.nodes[0].shape, 'round');
});

test('card model rejects unrepresented flowchart semantics without rejecting valid Mermaid', async () => {
  for (const source of [
    'flowchart LR\n subgraph X\n A --> B\n end',
    'flowchart LR\n A -.-> B',
    'flowchart LR\n A ==> B',
    'flowchart LR\n A --- B',
    'flowchart LR\n A --> B\n style A fill:red',
    'flowchart LR\n A:::foo --> B\n classDef foo fill:red',
    'flowchart LR\n A --> B\n linkStyle 0 stroke:red',
    'flowchart LR\n A[(Database)] --> B',
    'flowchart LR\n A["<b>HTML</b>"] --> B',
    'flowchart LR\n A --> B; B --> C',
    'flowchart LR\n A ----> B',
    'flowchart LR\n A & B --> C',
  ]) {
    const result = await validateMermaidSource(source);
    assert.equal(result.ok, true, source);
    assert.equal(result.graph.model.supported, false, source);
  }
});
