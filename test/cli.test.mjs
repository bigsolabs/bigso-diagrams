import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(root, 'src/cli.mjs');
const example = join(root, 'examples/flowchart.json');
const workspace = await mkdtemp(join(process.env.TMPDIR ?? tmpdir(), 'bigso-diagrams-cli-'));
after(() => rm(workspace, { recursive: true, force: true }));

function run(...args) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' });
  assert.equal(result.stderr, '', 'CLI should keep diagnostics in JSON on stdout');
  return { code: result.status, data: JSON.parse(result.stdout) };
}

test('validate reports a machine-readable success', () => {
  const result = run('validate', example);
  assert.equal(result.code, 0);
  assert.deepEqual(result.data, { ok: true, command: 'validate', type: 'flowchart', title: 'Checkout', issues: [] });
});

test('invalid diagram returns diagnostics and a stable failure code', async () => {
  const invalidPath = join(workspace, 'invalid.json');
  const invalid = JSON.parse(await readFile(example, 'utf8'));
  invalid.payload.edges[0].to = 'not-found';
  await writeFile(invalidPath, JSON.stringify(invalid));
  const result = run('validate', invalidPath);
  assert.equal(result.code, 1);
  assert.equal(result.data.ok, false);
  assert.equal(result.data.command, 'validate');
  assert.ok(result.data.issues.some(({ path }) => path === '$.payload.edges[0].to'));
});

test('render returns SVG as JSON or writes it to an explicit path', async () => {
  const result = run('render', example);
  assert.equal(result.code, 0);
  assert.equal(result.data.command, 'render');
  assert.match(result.data.svg, /^<svg\b/);
  const output = join(workspace, 'render.svg');
  const written = run('render', example, '--output', output);
  assert.equal(written.code, 0);
  assert.equal(written.data.output, output);
  assert.equal(await readFile(output, 'utf8'), result.data.svg);
});

test('export writes standalone HTML and reports its format and destination', async () => {
  const output = join(workspace, 'checkout.html');
  const result = run('export', example, '--format', 'html', '--output', output);
  assert.equal(result.code, 0);
  assert.equal(result.data.format, 'html');
  assert.equal(result.data.output, output);
  assert.match(await readFile(output, 'utf8'), /<svg\b/);
});

test('update applies agent patches into a separate validated document', async () => {
  const patchFile = join(workspace, 'changes.json');
  const output = join(workspace, 'updated.json');
  await writeFile(patchFile, JSON.stringify([{ op: 'replace', path: '/payload/nodes/2/label', value: 'Enviar factura' }]));
  const result = run('update', example, '--patch', patchFile, '--output', output);
  assert.equal(result.code, 0);
  assert.equal(result.data.command, 'update');
  const original = JSON.parse(await readFile(example, 'utf8'));
  const updated = JSON.parse(await readFile(output, 'utf8'));
  assert.equal(updated.payload.nodes[2].label, 'Enviar factura');
  assert.deepEqual(updated.payload.nodes.filter((_, i) => i !== 2), original.payload.nodes.filter((_, i) => i !== 2));
  assert.deepEqual(updated.payload.edges, original.payload.edges);
  assert.deepEqual(JSON.parse(await readFile(example, 'utf8')), original);
});

test('export refuses to overwrite the editable source', async () => {
  const before = await readFile(example, 'utf8');
  const result = run('export', example, '--format', 'svg', '--output', example);
  assert.equal(result.code, 2);
  assert.equal(result.data.ok, false);
  assert.equal(await readFile(example, 'utf8'), before);
});

test('unknown commands and malformed invocations return usage code 2', () => {
  for (const result of [run('unknown', example), run('export', example, '--format', 'pdf', '--output', 'x.pdf')]) {
    assert.equal(result.code, 2);
    assert.equal(result.data.ok, false);
    assert.equal(result.data.error.code, 'USAGE');
  }
});
