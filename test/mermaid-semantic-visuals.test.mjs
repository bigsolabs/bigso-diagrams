import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { decorateFlowchart } from '../src/adapters/mermaid-semantic-visuals.mjs';

test('decorates known semantic nodes without altering geometry or interpreting metadata as markup', () => {
  const dom = new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g class="node"><rect x="0" y="0" width="100" height="50"/><g class="label"/></g><path class="flowchart-link" d="M0 0L10 10"/></svg>', { contentType: 'image/svg+xml' });
  const svg = dom.window.document.documentElement;
  const node = svg.querySelector('.node');
  node.querySelector('rect').getBBox = () => ({ x: 0, y: 0, width: 100, height: 50 });
  node.querySelector('.label').getBBox = () => ({ x: 30, y: 18, width: 40, height: 14 });
  const edge = svg.querySelector('path');
  decorateFlowchart(svg, { nodes: { api: [node] }, edges: { 'api->db': [edge] } }, { elements: { api: { kind: 'service', icon: '<script>alert(1)</script>' } } });
  assert.equal(node.getAttribute('data-bigso-kind'), 'service');
  assert.ok(node.querySelector('[data-bigso-icon="service"]'));
  assert.equal(node.querySelector('rect').getAttribute('width'), '100');
  assert.equal(edge.getAttribute('d'), 'M0 0L10 10');
  assert.equal(svg.querySelector('script'), null);
});


test('all supported kinds get distinct safe fixed icons and unknown kinds fall back', () => {
  const dom = new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"/>', { contentType: 'image/svg+xml' });
  const svg = dom.window.document.documentElement;
  const kinds = ['service', 'database', 'client', 'gateway', 'queue', 'external', 'group', '<script/>', 'constructor'];
  const nodes = {}, elements = {};
  for (const [i, kind] of kinds.entries()) {
    const node = dom.window.document.createElementNS(svg.namespaceURI, 'g');
    const rect = dom.window.document.createElementNS(svg.namespaceURI, 'rect');
    rect.getBBox = () => ({ x: 0, y: 0, width: 80, height: 40 });
    node.append(rect); svg.append(node); nodes[i] = [node]; elements[i] = { kind };
  }
  decorateFlowchart(svg, { nodes, edges: {} }, { elements });
  assert.equal(svg.querySelectorAll('[data-bigso-icon]').length, 7);
  assert.equal(new Set([...svg.querySelectorAll('[data-bigso-icon] path')].map(p => p.getAttribute('d'))).size, 7);
  assert.equal(nodes[7][0].hasAttribute('data-bigso-kind'), false);
  assert.equal(nodes[8][0].hasAttribute('data-bigso-kind'), false);
  assert.equal(svg.querySelector('script'), null);
});

test('uses the available inset for a readable semantic icon without changing the node outline', () => {
  const dom = new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g><rect x="0" y="0" width="160" height="72"/><g class="label"/></g></svg>', { contentType: 'image/svg+xml' });
  const svg = dom.window.document.documentElement, node = svg.querySelector('g'), shape = node.querySelector('rect');
  shape.getBBox = () => ({x:0,y:0,width:160,height:72});
  node.querySelector('.label').getBBox = () => ({x:50,y:26,width:60,height:20});
  decorateFlowchart(svg, {nodes:{db:[node]},edges:{}}, {elements:{db:{kind:'database'}}});
  const icon = node.querySelector('[data-bigso-icon]');
  assert.ok(icon);
  assert.ok(Number(icon.querySelector('rect').getAttribute('width')) >= 24);
  assert.equal(shape.getAttribute('width'), '160');
  assert.equal(node.getAttribute('transform'), null);
});

test('semantic borders remain responsive to journey highlight state', () => {
  const dom = new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g><rect/></g></svg>', {contentType:'image/svg+xml'});
  const svg=dom.window.document.documentElement, node=svg.querySelector('g'), shape=node.querySelector('rect');
  shape.getBBox=()=>({x:0,y:0,width:160,height:72});
  decorateFlowchart(svg,{nodes:{api:[node]},edges:{}},{elements:{api:{kind:'service'}}});
  assert.match(shape.style.getPropertyValue('stroke'), /var\(--bigso-node-stroke/);
  assert.match(shape.style.getPropertyValue('stroke-width'), /var\(--bigso-node-stroke-width/);
});

test('semantic glyph colors override Mermaid node theme selectors', () => {
  const dom = new JSDOM('<svg xmlns="http://www.w3.org/2000/svg"><g><rect/><g class="label"/></g></svg>', {contentType:'image/svg+xml'});
  const svg=dom.window.document.documentElement, node=svg.querySelector('g');
  node.querySelector('rect').getBBox=()=>({x:0,y:0,width:160,height:72});
  node.querySelector('.label').getBBox=()=>({x:50,y:26,width:60,height:20});
  decorateFlowchart(svg,{nodes:{db:[node]},edges:{}},{elements:{db:{kind:'database'}}});
  const icon=node.querySelector('[data-bigso-icon]');
  assert.equal(icon.querySelector('rect').style.getPropertyPriority('fill'),'important');
  assert.equal(icon.querySelector('path').style.getPropertyPriority('stroke'),'important');
});
