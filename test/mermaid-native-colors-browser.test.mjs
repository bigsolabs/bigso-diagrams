import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const chrome = [process.env.CHROME_BIN, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', join(homedir(), '.hermes/tools/chromium-1248/chrome-linux64/chrome')].find(path => path && existsSync(path));

test('CLI native fallback preserves source node and link colors in a browser', { skip: !chrome && 'Set CHROME_BIN to run browser regression' }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'bigso-colors-'));
  try {
    const source = join(dir, 'diagram.mmd');
    const output = join(dir, 'diagram.html');
    writeFileSync(source, 'flowchart LR\n A[Alpha] --> B\n style A fill:#ff0000,stroke:#0000ff\n linkStyle 0 stroke:#00ff00,stroke-width:5px\n');
    writeFileSync(join(dir, 'diagram.meta.json'), JSON.stringify({ schema: 'bigso-diagrams/sidecar@1', elements: { A: { kind: 'service' } } }));
    execFileSync(process.execPath, ['src/cli.mjs', 'export', source, '--format', 'html', '--output', output], { cwd: resolve('.') });
    const probe = `<script>(()=>{const el=document.getElementById('status');new MutationObserver(probe).observe(el,{attributes:true});probe();function probe(){if(el.dataset.state==='ready'){const node=document.querySelector('#diagram [data-bigso-id="A"] rect');const edge=document.querySelector('#diagram .flowchart-link');document.body.setAttribute('data-probe',JSON.stringify({status:el.textContent,node:node&&{fill:getComputedStyle(node).fill,stroke:getComputedStyle(node).stroke},edge:edge&&{stroke:getComputedStyle(edge).stroke,width:getComputedStyle(edge).strokeWidth},marker:(()=>{const id=edge?.getAttribute('marker-end')?.slice(5,-1);const path=document.getElementById(id)?.querySelector('path');return path&&{fill:getComputedStyle(path).fill,stroke:getComputedStyle(path).stroke}})()}));}}})();</script>`;
    const hash = createHash('sha256').update(probe.slice(8, -9)).digest('base64');
    const html = readFileSync(output, 'utf8').replace('script-src ', `script-src 'sha256-${hash}' `);
    const end = html.lastIndexOf('</body>');
    writeFileSync(output, html.slice(0, end) + probe + html.slice(end));
    const dom = execFileSync(chrome, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--virtual-time-budget=10000', '--dump-dom', `file://${output}`], { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const match = dom.match(/data-probe="([^"]+)"/);
    assert.ok(match, 'browser did not finish rendering');
    const data = JSON.parse(match[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
    assert.match(data.status, /alternativa/);
    assert.equal(data.node.fill, 'rgb(255, 0, 0)');
    assert.equal(data.node.stroke, 'rgb(0, 0, 255)');
    assert.equal(data.edge.stroke, 'rgb(0, 255, 0)');
    assert.equal(data.edge.width, '5px');
    assert.equal(data.marker.fill, 'rgb(0, 255, 0)');
    assert.equal(data.marker.stroke, 'rgb(0, 255, 0)');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
