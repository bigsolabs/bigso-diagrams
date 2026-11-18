import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { exportMermaidHtml } from '../src/export-mermaid.mjs';

const source = await readFile(new URL('../examples/flowchart.mmd', import.meta.url), 'utf8');
const metadata = {
  schema: 'bigso-diagrams/sidecar@1',
  elements: { gateway: { description: 'Enruta las solicitudes.', annotations: ['Entrada pública'] } },
  journeys: [{
    id: 'checkout', title: 'Checkout', steps: [
      { id: 'one', title: 'Solicitud al carrito', transition: { from: 'customer', to: 'cart' } },
      { id: 'two', title: 'Envío al gateway', transition: { from: 'cart', to: 'gateway' } },
      { id: 'three', title: 'Consulta de inventario', transition: { from: 'gateway', to: 'stock' } },
    ],
  }],
};

async function createViewer() {
  const html = await exportMermaidHtml(source, 'flowchart', metadata);
  const withoutRendererBundle = html.replace(new RegExp('<script>[\\s\\S]*?</script>'), '<script></script>');
  let timerId = 0;
  const timers = new Map();
  const dom = new JSDOM(withoutRendererBundle, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.setInterval = (callback, delay) => {
        timerId += 1;
        timers.set(timerId, { callback, delay });
        return timerId;
      };
      window.clearInterval = (id) => timers.delete(id);
      window.BigsoMermaid = {
        render: async (stage) => {
          const svg = window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 600 300');
          Object.defineProperty(svg, 'viewBox', { value: { baseVal: { x: 0, y: 0, width: 600, height: 300 } } });
          stage.ownerDocument.getElementById('viewport').getBoundingClientRect = () => ({ width: 800, height: 600 });
          for (const id of ['customer', 'cart', 'gateway', 'stock']) {
            const node = window.document.createElementNS('http://www.w3.org/2000/svg', 'g');
            node.setAttribute('data-bigso-id', id);
            node.setAttribute('tabindex', '0');
            svg.append(node);
          }
          for (const [from, to] of [['customer', 'cart'], ['cart', 'gateway'], ['gateway', 'stock']]) {
            const edge = window.document.createElementNS('http://www.w3.org/2000/svg', 'path');
            edge.setAttribute('data-bigso-from', from);
            edge.setAttribute('data-bigso-to', to);
            edge.setAttribute('data-bigso-link-index', '0');
            svg.append(edge);
          }
          stage.replaceChildren(svg);
          return { svg, mapping: {} };
        },
      };
    },
  });
  const { window } = dom;
  await new Promise((resolve) => setImmediate(resolve));
  return { window, timers, close: () => window.close() };
}

test('viewer supports accessible selection and ordered journey playback with pause and resume', async () => {
  const { window, timers, close } = await createViewer();
  try {
    const document = window.document;
    const title = document.getElementById('journey-title');
    const progress = document.getElementById('journey-progress');
    assert.equal(document.getElementById('status').dataset.state, 'ready', document.getElementById('status').textContent);
    assert.equal(document.querySelectorAll('#journey-select option').length, 1);
    assert.equal(title.textContent, 'Solicitud al carrito');
    assert.equal(document.querySelectorAll('#diagram .journey-edge').length, 1);

    document.getElementById('journey-next').click();
    assert.equal(title.textContent, 'Envío al gateway');
    assert.equal(progress.textContent, '2 / 3');
    assert.equal(document.querySelectorAll('#diagram .journey-edge').length, 1);
    document.getElementById('journey-prev').click();
    assert.equal(title.textContent, 'Solicitud al carrito');

    const gateway = [...document.querySelectorAll('[data-bigso-id]')].find((node) => node.getAttribute('data-bigso-id') === 'gateway');
    gateway.focus();
    gateway.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    assert.equal(document.getElementById('detail-title').textContent, 'gateway');
    assert.equal(document.getElementById('detail-description').textContent, 'Enruta las solicitudes.');
    assert.equal(document.querySelector('#detail-annotations li').textContent, 'Entrada pública');

    document.getElementById('journey-play').click();
    const firstTimer = [...timers.values()][0];
    assert.equal(firstTimer.delay, 1200);
    firstTimer.callback();
    assert.equal(progress.textContent, '2 / 3');
    document.getElementById('journey-play').click();
    assert.equal(timers.size, 0);
    assert.equal(progress.textContent, '2 / 3');

    document.getElementById('journey-play').click();
    [...timers.values()][0].callback();
    assert.equal(progress.textContent, '3 / 3');
    assert.equal(document.getElementById('journey-play').textContent, 'Pausar');
  } finally {
    close();
  }
});

test('offline viewer embeds no remote assets and honors reduced-motion preferences', async () => {
  const html = await exportMermaidHtml(source, 'flowchart', metadata);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /<script\s+src=/i);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /animation-duration:\.01ms/);
});
