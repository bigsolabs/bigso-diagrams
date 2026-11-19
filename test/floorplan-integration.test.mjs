import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { exportMermaidHtml } from '../src/export-mermaid.mjs';
import { validateMermaidSource } from '../src/adapters/mermaid.mjs';

async function viewer(source, metadata = {}) {
  const { graph } = await validateMermaidSource(source);
  const html = await exportMermaidHtml(source, 'flowchart', metadata, graph);
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(window) {
    Object.defineProperty(window.SVGElement.prototype, 'viewBox', { get() {
      const [x, y, width, height] = (this.getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
      return { baseVal: { x, y, width, height } };
    } });
    window.SVGElement.prototype.getComputedTextLength = function () { return (this.textContent || '').length * 8; };
    window.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 100, height: 40 });
  } });
  for (let i = 0; i < 100 && dom.window.document.getElementById('status').dataset.state === 'loading'; i++) await new Promise(r => setTimeout(r, 50));
  return dom;
}

test('supported rectangular flowchart renders real Floorplan cards', async () => {
  const dom = await viewer('flowchart LR\n a[Alpha] --> b[Beta]', { elements: { a: { description: 'First component' } } });
  try {
    const card = dom.window.document.querySelector('[data-bigso-id="a"] .floorplan-card');
    assert.ok(card, dom.window.document.getElementById('status').textContent);
    assert.equal(card.querySelector('.floorplan-title').textContent, 'Alpha');
    assert.equal(card.querySelector('.floorplan-description').textContent, 'First component');
    assert.equal(dom.window.document.querySelectorAll('[data-bigso-edge]').length, 1);
  } finally { dom.window.close(); }
});

test('prototype-like node identifiers render as Floorplan cards', async () => {
  const dom = await viewer('flowchart LR\n __proto__[Proto] --> constructor[Constructor]\n constructor --> toString[Text]');
  try {
    const document = dom.window.document;
    for (const id of ['__proto__', 'constructor', 'toString']) {
      assert.ok(document.querySelector(`[data-bigso-id="${id}"] .floorplan-card`), document.getElementById('status').textContent);
    }
    assert.equal(document.querySelectorAll('[data-bigso-edge]').length, 2);
    assert.doesNotMatch(document.getElementById('status').textContent, /alternativa/);
  } finally { dom.window.close(); }
});

test('unsupported diamond shape retains Mermaid and explains fallback', async () => {
  const dom = await viewer('flowchart LR\n a{Decision} --> b[Beta]');
  try {
    const document = dom.window.document;
    assert.match(document.getElementById('status').textContent, /alternativa.*formas/);
    assert.equal(document.querySelectorAll('.floorplan-card').length, 0);
    assert.ok(document.querySelector('#diagram [data-bigso-id="a"] polygon'));
  } finally { dom.window.close(); }
});

test('native fallback preserves source node styles with semantic metadata', async () => {
  const dom = await viewer('flowchart LR\n A[Alpha] --> B\n style A fill:#ff0000,stroke:#0000ff', { elements: { A: { kind: 'service' } } });
  try {
    const document = dom.window.document;
    assert.match(document.getElementById('status').textContent, /alternativa/);
    const shape = document.querySelector('#diagram [data-bigso-id="A"] rect');
    assert.ok(shape);
    assert.equal(shape.style.fill, '#ff0000');
    assert.equal(shape.style.stroke, '#0000ff');
  } finally { dom.window.close(); }
});

test('unrepresented subgraph semantics retain native Mermaid', async () => {
  const dom = await viewer('flowchart LR\n subgraph group\n a[Alpha] --> b[Beta]\n end');
  try {
    const document = dom.window.document;
    assert.match(document.getElementById('status').textContent, /alternativa.*sintaxis/);
    assert.ok(document.querySelector('#diagram .cluster'));
    assert.equal(document.querySelectorAll('.floorplan-card').length, 0);
  } finally { dom.window.close(); }
});


test('export uses an undotted canvas and solid highlighted journeys for both renderers', async () => {
  const dom = await viewer('flowchart LR\n a[Alpha] --> b[Beta]');
  try {
    const css = [...dom.window.document.querySelectorAll('style')].map(s=>s.textContent).join('\n');
    assert.doesNotMatch(css, /radial-gradient/);
    assert.doesNotMatch(css, /stroke-dasharray:\s*(?:8 5|9 5)/);
    assert.match(css, /\.journey-edge\{[^}]*stroke-dasharray:none!important/);
  } finally { dom.window.close(); }
});
