import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { exportHtml, exportSvg } from '../src/export.mjs';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const types = ['flowchart', 'architecture', 'sequence', 'erd'];
const forbiddenBranding = /floorplan|hayden smith|haydenschmitty|elkjs|jetbrains mono|inter font/i;
const localPath = /(?:file:\/\/|\/home\/[^\s"'<]+|\/Users\/[^\s"'<]+|[A-Z]:\\Users\\[^\s"'<]+)/;

test('all exported types are self-contained and disclose no machine paths or unrelated branding', async () => {
  for (const type of types) {
    const document = JSON.parse(await read(`examples/${type}.json`));
    const html = exportHtml(document);
    const svg = exportSvg(document);
    assert.match(html, /Bigso Diagrams/);
    assert.doesNotMatch(html, forbiddenBranding);
    assert.doesNotMatch(svg, forbiddenBranding);
    assert.doesNotMatch(html, localPath);
    assert.doesNotMatch(svg, localPath);
    assert.doesNotMatch(html, /<(?:script|link|img|iframe)\b[^>]+\b(?:src|href)=/i);
    assert.doesNotMatch(html, /@import|url\(\s*['"]?https?:|\bfetch\s*\(|XMLHttpRequest|WebSocket/i);
    assert.doesNotMatch(svg, /<foreignObject\b|<image\b|\bhref=/i);
  }
});

test('open-source identity and upstream obligations are explicit without publishing an npm package', async () => {
  const pkg = JSON.parse(await read('package.json'));
  const readme = await read('README.md');
  const provenance = await read('docs/reuse-and-provenance.md');
  const license = await read('LICENSE');
  assert.equal(pkg.private, true);
  assert.equal(pkg.license, 'MIT');
  assert.match(readme, /MIT/);
  assert.match(readme, /github\.com\/bigsolabs\/bigso-diagrams/);
  assert.match(provenance, /Eclipse Public License 2\.0/);
  assert.match(provenance, /SIL Open Font License 1\.1/);
  assert.match(provenance, /adapta CSS de Floorplan bajo MIT/);
  const floorplanLicense = await read('third-party/floorplan/LICENSE');
  assert.match(floorplanLicense, /Copyright \(c\) 2026 Hayden Smith/);
  assert.match(floorplanLicense, /Permission is hereby granted/);
  assert.match(floorplanLicense, /THE SOFTWARE IS PROVIDED "AS IS"/);
  assert.match(provenance, /Mermaid `11\.17\.2`.*MIT/);
  assert.match(provenance, /jsdom `22\.1\.0`.*MIT/);
  assert.match(provenance, /KaTeX `0\.18\.10`/);
  assert.match(provenance, /esbuild `0\.28\.2`/);
  assert.match(license, /^MIT License\n/);
  assert.match(license, /Copyright \(c\) 2026 Bigsolabs/);
  assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);
  const topLevel = await readdir(new URL('../', import.meta.url));
  assert.equal(topLevel.includes('LICENSE'), true);
});

test('unrelated description metadata is not emitted into the artifact', async () => {
  const document = JSON.parse(await read('examples/flowchart.json'));
  document.description = 'Local context at /home/carlos/private/input.md; upstream Floorplan note';
  const html = exportHtml(document);
  assert.doesNotMatch(html, /\/home\/carlos|Floorplan|private\/input\.md/);
});
