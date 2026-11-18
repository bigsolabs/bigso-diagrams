import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'src/cli.mjs');
const source = join(root, 'examples/flowchart.mmd');
const exampleSidecar = join(root, 'examples/flowchart.meta.json');
const workspace = await mkdtemp(join(process.env.TMPDIR ?? tmpdir(), 'bigso-sidecar-cli-'));
after(() => rm(workspace, { recursive: true, force: true }));

function run(...args) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(result.stderr, '', 'CLI should keep diagnostics in JSON on stdout');
  return { code: result.status, data: JSON.parse(result.stdout) };
}

test('validate auto-discovers and validates the adjacent Mermaid sidecar against graph IDs', () => {
  const result = run('validate', source);
  assert.equal(result.code, 0);
  assert.equal(result.data.metadata, exampleSidecar);
  assert.deepEqual(result.data.issues, []);
});

test('validate accepts an explicit sidecar path and reports stale IDs', async () => {
  const sidecar = join(workspace, 'bad.meta.json');
  await writeFile(sidecar, JSON.stringify({
    schema: 'bigso-diagrams/sidecar@1',
    elements: { absent: { description: 'Stale reference' } },
    journeys: [{ id: 'bad-route', title: 'Ruta inválida', steps: [{ id: 'bad-step', title: 'Paso', transition: { from: 'customer', to: 'absent' } }] }],
  }));
  const result = run('validate', source, '--metadata', sidecar);
  assert.equal(result.code, 1);
  assert.ok(result.data.issues.some((issue) => issue.code === 'MISSING_NODE'));
});

test('export embeds validated journey metadata for the browser viewer', async () => {
  const output = join(workspace, 'flow-with-journeys.html');
  const result = run('export', source, '--format', 'html', '--output', output, '--metadata', exampleSidecar);
  assert.equal(result.code, 0);
  assert.equal(result.data.metadata, exampleSidecar);
  const html = await readFile(output, 'utf8');
  assert.equal(html.includes('Pedido con existencias disponibles'), true);
  assert.equal(html.includes('pedido-sin-stock'), true);
});

test('export refuses to overwrite the metadata sidecar', () => {
  const result = run('export', source, '--format', 'html', '--output', exampleSidecar, '--metadata', exampleSidecar);
  assert.equal(result.code, 2);
  assert.match(result.data.error.message, /editable source|metadata/i);
});
