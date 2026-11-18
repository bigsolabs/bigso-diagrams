import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'src/cli.mjs');
const fixture = join(root, 'examples/flowchart.mmd');
const fixtureMetadata = join(root, 'examples/flowchart.meta.json');
const sequenceFixture = join(root, 'examples/sequence.mmd');
const workspace = await mkdtemp(join(process.env.TMPDIR ?? tmpdir(), 'bigso-mermaid-cli-'));
after(() => rm(workspace, { recursive: true, force: true }));

function run(...args) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(result.stderr, '', 'CLI should keep diagnostics in JSON on stdout');
  return { code: result.status, data: JSON.parse(result.stdout) };
}

test('validate accepts Mermaid and reports the supported diagram family', () => {
  const result = run('validate', fixture);
  assert.equal(result.code, 0);
  assert.deepEqual(result.data, { ok: true, command: 'validate', type: 'mermaid', diagramType: 'flowchart', metadata: fixtureMetadata, issues: [] });
});

test('validate returns Mermaid syntax diagnostics with a stable invalid exit code', async () => {
  const invalid = join(workspace, 'invalid.mmd');
  await writeFile(invalid, 'flowchart LR\n  a-->\n');
  const result = run('validate', invalid);
  assert.equal(result.code, 1);
  assert.equal(result.data.ok, false);
  assert.equal(result.data.issues[0].code, 'MERMAID_PARSE');
  assert.equal(result.data.issues[0].line, 3);
});

test('export creates a self-contained Mermaid HTML viewer with a no-network policy', async () => {
  const output = join(workspace, 'flow.html');
  const result = run('export', fixture, '--format', 'html', '--output', output);
  assert.equal(result.code, 0);
  assert.equal(result.data.type, 'mermaid');
  assert.equal(result.data.diagramType, 'flowchart');
  const html = await readFile(output, 'utf8');
  assert.equal(html.includes("default-src 'none'"), true);
  assert.equal(html.includes("connect-src 'none'"), true);
  assert.equal(html.includes('<script src='), false);
  assert.equal(html.includes('<link rel='), false);
  assert.equal(html.includes('flowchart LR'), true);
});

test('export embeds sequence transitions so journeys can map message lines', async () => {
  const metadataPath = join(workspace, 'sequence.meta.json');
  const output = join(workspace, 'sequence.html');
  const metadata = {
    schema: 'bigso-diagrams/sidecar@1',
    journeys: [{
      id: 'pedido',
      title: 'Solicitar pedido',
      steps: [{ id: 'solicitar', title: 'El cliente solicita el pedido', transition: { from: 'cliente', to: 'gateway' } }],
    }],
  };
  await writeFile(metadataPath, JSON.stringify(metadata));
  const result = run('export', sequenceFixture, '--format', 'html', '--output', output, '--metadata', metadataPath);
  assert.equal(result.code, 0);
  const html = await readFile(output, 'utf8');
  assert.equal(html.includes('graph={"nodes"'), true);
  assert.equal(html.includes('"from":"cliente","to":"gateway","id":"1","label":"Solicitar pedido","linkIndex":0'), true);
});

test('Mermaid SVG export fails with guidance to use the browser-side HTML viewer', () => {
  const result = run('export', fixture, '--format', 'svg', '--output', join(workspace, 'flow.svg'));
  assert.equal(result.code, 2);
  assert.match(result.data.error.message, /Mermaid.*HTML/i);
});

test('Mermaid export refuses to overwrite its editable source', async () => {
  const before = await readFile(fixture, 'utf8');
  const result = run('export', fixture, '--format', 'html', '--output', fixture);
  assert.equal(result.code, 2);
  assert.equal(await readFile(fixture, 'utf8'), before);
});
