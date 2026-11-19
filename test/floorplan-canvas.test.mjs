import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { renderFloorplanCanvas } from '../src/adapters/floorplan-canvas.mjs';

test('renders spaced cards and routed edges from the explicit graph', async () => {
  const document = new JSDOM('<div id="canvas"></div>').window.document;
  const canvas = document.getElementById('canvas');
  await renderFloorplanCanvas(canvas, { direction: 'LR', nodes: [{id:'a',label:'Service',shape:'rect'},{id:'b',label:'Store',shape:'rect'}], edges: [{from:'a',to:'b',label:'writes',linkIndex:0}] }, {elements:{a:{kind:'service',description:'Handles requests'}}});
  const node = canvas.querySelector('[data-bigso-id="a"]');
  assert.ok(node);
  assert.match(node.textContent, /Service/);
  assert.match(node.textContent, /Handles requests/);
  assert.equal(node.querySelector('foreignObject').getAttribute('width'), '300');
  assert.equal(node.querySelector('foreignObject').getAttribute('height'), '128');
  assert.ok(canvas.querySelector('path[data-bigso-from="a"][data-bigso-to="b"][data-bigso-link-index="0"]'));
});

test('expands cards for long titles without truncating them', async () => {
  const doc = new JSDOM('<div></div>').window.document;
  const title = 'A very long service title that must remain completely visible';
  await renderFloorplanCanvas(doc.querySelector('div'), {nodes:[{id:'a',label:title}],edges:[]});
  assert.equal(doc.querySelector('.floorplan-title').textContent, title);
  assert.ok(Number(doc.querySelector('foreignObject').getAttribute('height')) > 128);
  assert.doesNotMatch(doc.querySelector('style').textContent, /text-overflow:ellipsis|white-space:nowrap/);
});

test('rejects oversized edge labels without replacing the viewer', async () => {
  const doc = new JSDOM('<div>existing</div>').window.document;
  await assert.rejects(renderFloorplanCanvas(doc.querySelector('div'), {nodes:[{id:'a'},{id:'b'}],edges:[{from:'a',to:'b',linkIndex:0,label:'x'.repeat(201)}]}), /edge label/i);
  assert.equal(doc.querySelector('div').textContent, 'existing');
});

test('rejects pathological title length before replacing the viewer', async () => {
  const doc = new JSDOM('<div>existing</div>').window.document;
  await assert.rejects(renderFloorplanCanvas(doc.querySelector('div'), {nodes:[{id:'a',label:'x'.repeat(241)}],edges:[]}), /title/i);
  assert.equal(doc.querySelector('div').textContent, 'existing');
});

test('uses distinct ELK label positions for parallel edges', async () => {
  const doc = new JSDOM('<div></div>').window.document;
  await renderFloorplanCanvas(doc.querySelector('div'), {direction:'LR',nodes:[{id:'a'},{id:'b'}],edges:[{from:'a',to:'b',label:'writes',linkIndex:0},{from:'a',to:'b',label:'reads',linkIndex:1}]});
  const labels = [...doc.querySelectorAll('.floorplan-edge-label')];
  assert.deepEqual(labels.map(e=>e.textContent), ['writes','reads']);
  assert.notEqual(labels[0].getAttribute('y'), labels[1].getAttribute('y'));
});

test('rejects unsupported shapes without replacing an existing viewer', async () => {
  const doc = new JSDOM('<div id="canvas"><p>existing</p></div>').window.document;
  const canvas = doc.getElementById('canvas');
  await assert.rejects(renderFloorplanCanvas(canvas, {nodes:[{id:'a',shape:'diamond'}],edges:[]}), /Unsupported node shape/);
  assert.equal(canvas.textContent,'existing');
});

test('does not interpret labels or descriptions as markup', async () => {
  const doc = new JSDOM('<div id="canvas"></div>').window.document, canvas=doc.getElementById('canvas');
  await renderFloorplanCanvas(canvas,{nodes:[{id:'a',label:'<img src=x onerror=alert(1)>'}],edges:[]},{elements:{a:{description:'<script>alert(2)</script>'}}});
  assert.equal(canvas.querySelectorAll('img,script').length,0);
  assert.match(canvas.textContent, /<script>alert\(2\)<\/script>/);
});

test('routes cycles and parallel edges to actual card boundaries', async () => {
  const doc = new JSDOM('<div id="canvas"></div>').window.document, canvas=doc.getElementById('canvas');
  await renderFloorplanCanvas(canvas,{direction:'LR',nodes:[{id:'a'},{id:'b'}],edges:[{from:'a',to:'b',linkIndex:0},{from:'a',to:'b',linkIndex:1},{from:'b',to:'a',linkIndex:0}]});
  const paths=[...canvas.querySelectorAll('path[data-bigso-edge]')];
  assert.equal(paths.length,3);
  const rectangles=Object.fromEntries([...canvas.querySelectorAll('[data-bigso-id]')].map(n=>[n.getAttribute('data-bigso-id'),n.getAttribute('transform').match(/translate\(([^,]+),([^\)]+)\)/).slice(1).map(Number)]));
  const onBoundary=([x,y],[left,top])=> x>=left-0.001 && x<=left+300.001 && y>=top-0.001 && y<=top+128.001 && (Math.abs(x-left)<0.001 || Math.abs(x-left-300)<0.001 || Math.abs(y-top)<0.001 || Math.abs(y-top-128)<0.001);
  for(const path of paths){ const d=path.getAttribute('d'); const first=d.match(/^M([\d.]+),([\d.]+)/).slice(1).map(Number), last=d.match(/L([\d.]+),([\d.]+)$/).slice(1).map(Number); assert.ok(onBoundary(first,rectangles[path.dataset.bigsoFrom])); assert.ok(onBoundary(last,rectangles[path.dataset.bigsoTo])); }
  assert.notEqual(paths[0].getAttribute('d'),paths[1].getAttribute('d'));
});

test('accepts Mermaid parser square shape', async () => {
 const doc = new JSDOM('<div></div>').window.document;
 await renderFloorplanCanvas(doc.querySelector('div'),{nodes:[{id:'a',shape:'square'}],edges:[]});
 assert.ok(doc.querySelector('[data-bigso-id="a"]'));
});

test('uses distinct fixed SVG glyphs and colors for semantic kinds', async () => {
  const kinds=['database','service','queue','client','gateway','external'];
  const document=new JSDOM('<div id="canvas"></div>').window.document;
  const elements=Object.fromEntries(kinds.map(kind=>[kind,{kind}]));
  await renderFloorplanCanvas(document.getElementById('canvas'),{nodes:kinds.map(id=>({id})),edges:[]},{elements});
  const icons=kinds.map(kind=>document.querySelector(`[data-bigso-id="${kind}"] .floorplan-icon`));
  for (const icon of icons) {
    assert.ok(icon.querySelector('svg path'));
    assert.equal(icon.textContent,'');
    assert.equal(icon.querySelector('svg').getAttribute('aria-hidden'),'true');
  }
  assert.equal(new Set(icons.map(icon=>icon.querySelector('path').getAttribute('d'))).size,kinds.length);
  assert.equal(new Set(icons.map(icon=>icon.querySelector('path').getAttribute('stroke'))).size,kinds.length);
});

test('unknown semantic kinds use a fixed safe fallback icon', async () => {
  const document=new JSDOM('<div id="canvas"></div>').window.document;
  await renderFloorplanCanvas(document.getElementById('canvas'),{nodes:[{id:'a'},{id:'b'}],edges:[]},{elements:{a:{kind:'__proto__'},b:{kind:'<img onerror=alert(1)>'}}});
  const icons=[...document.querySelectorAll('.floorplan-icon')];
  assert.ok(icons.every(icon=>icon.querySelector('svg path')));
  assert.equal(icons[0].querySelector('path').getAttribute('d'),icons[1].querySelector('path').getAttribute('d'));
  assert.equal(document.querySelectorAll('img,script').length,0);
});


test('cards use an unclipped SVG shadow and solid journey edges', async () => {
  const doc = new JSDOM('<div></div>').window.document;
  await renderFloorplanCanvas(doc.querySelector('div'), {nodes:[{id:'a'},{id:'b'}],edges:[{from:'a',to:'b',linkIndex:0}]});
  const node = doc.querySelector('[data-bigso-id="a"]');
  assert.ok(node.querySelector('rect.floorplan-card-surface[filter]'));
  const css = doc.querySelector('style').textContent;
  assert.match(css, /stroke-dasharray:none/);
  assert.doesNotMatch(css.match(/\.floorplan-card\{([^}]*)/)[1], /box-shadow/);
});


test('renders multilingual edge labels longer than eight characters with directed arrows', async () => {
  const doc = new JSDOM('<div></div>').window.document;
  const label = 'Enviar pedido — 日本語 🚀';
  await renderFloorplanCanvas(doc.querySelector('div'), {direction:'LR',nodes:[{id:'a'},{id:'b'}],edges:[{from:'a',to:'b',linkIndex:0,label}]});
  assert.equal(doc.querySelector('.floorplan-edge-label').textContent, label);
  assert.ok(doc.querySelector('.floorplan-edge[marker-end]'));
});


test('exports the real system map as seven cards with all edge labels', async () => {
  const { readFile } = await import('node:fs/promises');
  const { validateMermaidSource } = await import('../src/adapters/mermaid.mjs');
  const { exportMermaidHtml } = await import('../src/export-mermaid.mjs');
  const source = await readFile(new URL('../examples/system-map.mmd', import.meta.url), 'utf8');
  const { graph } = await validateMermaidSource(source);
  const output = await exportMermaidHtml(source, 'flowchart', {}, graph);
  const dom = new JSDOM(output, {runScripts:'dangerously', pretendToBeVisual:true, beforeParse(window) {
    Object.defineProperty(window.SVGElement.prototype, 'viewBox', {get() {
      const [x,y,width,height] = (this.getAttribute('viewBox') || '0 0 1 1').split(/\s+/).map(Number);
      return {baseVal:{x,y,width,height}};
    }});
    window.SVGElement.prototype.getComputedTextLength = function() { return (this.textContent || '').length * 8; };
    window.SVGElement.prototype.getBBox = () => ({x:0,y:0,width:100,height:40});
  }});
  try {
    const doc = dom.window.document;
    for (let i=0; i<100 && doc.getElementById('status').dataset.state === 'loading'; i++) await new Promise(r=>setTimeout(r,50));
    assert.equal(doc.querySelectorAll('.floorplan-card').length, 7, doc.getElementById('status').textContent);
    assert.deepEqual([...doc.querySelectorAll('.floorplan-edge-label')].map(e=>e.textContent), graph.edges.map(e=>e.label));
    assert.equal(doc.querySelectorAll('.floorplan-edge[marker-end]').length, 6);
  } finally { dom.window.close(); }
});


test('matches Floorplan light card and solid connector tokens', async () => {
  const doc = new JSDOM('<div></div>').window.document;
  await renderFloorplanCanvas(doc.querySelector('div'), {nodes:[{id:'a'},{id:'b'}],edges:[{from:'a',to:'b',linkIndex:0}]}, {elements:{a:{kind:'service'},b:{kind:'database'}}});
  const css = doc.querySelector('style').textContent;
  assert.match(css, /color:#161616/);
  assert.match(css, /color:#3f3f3f/);
  assert.match(css, /font-weight:600/);
  assert.match(css, /letter-spacing:-\.015em/);
  assert.match(css, /stroke:#50555c/);
  assert.match(css, /stroke-linecap:round/);
  assert.equal(doc.querySelector('[data-bigso-id="a"] .floorplan-icon path').getAttribute('stroke'), '#7a5ad8');
  assert.equal(doc.querySelector('[data-bigso-id="b"] .floorplan-icon path').getAttribute('stroke'), '#0f8a76');
  assert.equal(doc.querySelector('.floorplan-card-surface').getAttribute('stroke'), '#000');
  assert.equal(doc.querySelector('.floorplan-card-surface').getAttribute('stroke-opacity'), '0.1');
});
