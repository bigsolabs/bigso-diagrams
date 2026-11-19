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
    id: 'checkout', title: 'Checkout', description: 'Compra segura desde el carrito hasta el pago.', steps: [
      { id: 'one', title: 'Solicitud al carrito', description: 'El cliente revisa su carrito antes de iniciar el pago.', transition: { from: 'customer', to: 'cart' } },
      { id: 'two', title: 'Envío al gateway', description: 'El carrito envía la solicitud al gateway para validación.', transition: { from: 'cart', to: 'gateway' } },
      { id: 'three', title: 'Consulta de inventario', description: 'El gateway consulta las existencias antes de autorizar el pago.', transition: { from: 'gateway', to: 'stock' } },
    ],
  }],
};

const graph = {
  nodes: ['customer', 'cart', 'gateway', 'stock'],
  edges: [
    { from: 'customer', to: 'cart', label: 'carrito', linkIndex: 0 },
    { from: 'cart', to: 'gateway', label: 'checkout', linkIndex: 0 },
    { from: 'gateway', to: 'stock', label: 'existencias', linkIndex: 0 },
  ],
};

async function createViewer({ resizeObserver = false } = {}) {
  const html = await exportMermaidHtml(source, 'flowchart', metadata, graph);
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
      if (resizeObserver) {
        window.ResizeObserver = class {
          constructor(callback) { window.__resizeCallback = callback; }
          observe() {}
        };
      }
      window.BigsoMermaid = {
        render: async (stage) => {
          const svg = window.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('viewBox', '0 0 600 300');
          Object.defineProperty(svg, 'viewBox', { value: { baseVal: { x: 0, y: 0, width: 600, height: 300 } } });
          stage.ownerDocument.getElementById('viewport').getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 });
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

test('normalizes SVG dimensions to viewBox units before applying canvas zoom', async () => {
  const { window, close } = await createViewer();
  try {
    const svg = window.document.querySelector('#diagram svg');
    assert.equal(svg.getAttribute('width'), '600');
    assert.equal(svg.getAttribute('height'), '300');
  } finally {
    close();
  }
});

test('overview presents journeys and selecting one opens a narrated transition inspector', async () => {
  const { window, close } = await createViewer();
  try {
    const document = window.document;
    assert.equal(document.getElementById('overview-panel').hidden, false);
    assert.equal(document.getElementById('journey-banner').hidden, true);
    assert.equal(document.querySelectorAll('#journey-list [data-journey-index]').length, 1);

    const journeySelect = document.getElementById('journey-select');
    journeySelect.value = '0';
    journeySelect.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.equal(document.getElementById('overview-panel').hidden, true);
    assert.equal(document.getElementById('journey-banner').hidden, false);
    assert.equal(document.getElementById('journey-panel').hidden, false);
    assert.equal(document.getElementById('journey-description').textContent, 'El cliente revisa su carrito antes de iniciar el pago.');
    assert.equal(document.getElementById('journey-route').textContent, 'customer → cart');
    assert.equal(document.querySelectorAll('#journey-step-list button').length, 3);
  } finally {
    close();
  }
});

test('search selects a map element and the inspector can collapse and return to overview', async () => {
  const { window, close } = await createViewer();
  try {
    const document = window.document;
    const search = document.getElementById('map-search');
    search.value = 'gateway';
    search.dispatchEvent(new window.Event('input', { bubbles: true }));
    search.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    assert.equal(document.getElementById('element-panel').hidden, false);
    assert.equal(document.getElementById('detail-title').textContent, 'gateway');
    assert.match(document.getElementById('detail-connections').textContent, /cart/);

    const toggle = document.getElementById('inspector-toggle');
    toggle.click();
    assert.equal(document.getElementById('inspector').classList.contains('collapsed'), true);
    assert.equal(toggle.getAttribute('aria-expanded'), 'false');

    document.getElementById('inspector-reset').click();
    assert.equal(document.getElementById('overview-panel').hidden, false);
  } finally {
    close();
  }
});

test('viewer supports accessible selection and ordered journey playback with pause and resume', async () => {
  const { window, timers, close } = await createViewer();
  try {
    const document = window.document;
    const title = document.getElementById('journey-title');
    const progress = document.getElementById('journey-progress');
    assert.equal(document.getElementById('status').dataset.state, 'ready', document.getElementById('status').textContent);
    assert.equal(document.querySelectorAll('#journey-select option[value="0"]').length, 1);
    const journeySelect = document.getElementById('journey-select');
    journeySelect.value = '0';
    journeySelect.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.equal(document.getElementById('journey-title').textContent, 'Solicitud al carrito');
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

test('selecting a journey step focuses its route nodes on the canvas', async () => {
  const { window, close } = await createViewer();
  try {
    const document = window.document;
    for (const [id, x] of [['customer', 0], ['cart', 150]]) {
      const node = [...document.querySelectorAll('[data-bigso-id]')].find((item) => item.getAttribute('data-bigso-id') === id);
      node.getBBox = () => ({ x, y: 40, width: 100, height: 40 });
    }
    const select = document.getElementById('journey-select');
    select.value = '0';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.ok(document.querySelector('#diagram svg').style.transform.includes('scale(1.35)'));
    assert.equal(document.querySelector('[data-bigso-id="customer"]').classList.contains('journey-current'), true);
    assert.equal(document.querySelector('[data-bigso-id="stock"]').classList.contains('journey-muted'), true);
  } finally {
    close();
  }
});

test('centers a journey using each SVG node group transform', async () => {
  const { window, close } = await createViewer();
  try {
    const document = window.document;
    for (const [id, x] of [['customer', 100], ['cart', 300]]) {
      const node = [...document.querySelectorAll('[data-bigso-id]')].find((item) => item.getAttribute('data-bigso-id') === id);
      node.getBBox = () => ({ x: -50, y: -20, width: 100, height: 40 });
      node.getCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: 200 });
    }
    const select = document.getElementById('journey-select');
    select.value = '0';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.equal(document.querySelector('#diagram svg').style.transform.replace(/\s/g, ''), 'translate(130px,30px)scale(1.35)');
  } finally {
    close();
  }
});

test('leaving a journey restores the overview canvas framing', async () => {
  const { window, close } = await createViewer();
  try {
    const document = window.document;
    for (const [id, x] of [['customer', 0], ['cart', 150]]) {
      const node = [...document.querySelectorAll('[data-bigso-id]')].find((item) => item.getAttribute('data-bigso-id') === id);
      node.getBBox = () => ({ x, y: 40, width: 100, height: 40 });
    }
    const select = document.getElementById('journey-select');
    select.value = '0';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.match(document.querySelector('#diagram svg').style.transform, /scale\(1\.35\)/);

    select.value = '';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));

    assert.equal(document.getElementById('overview-panel').hidden, false);
    assert.equal(document.getElementById('journey-banner').hidden, true);
    assert.equal(document.querySelectorAll('#diagram .journey-current, #diagram .journey-edge, #diagram .journey-muted, #diagram .journey-route').length, 0);
    assert.equal(document.querySelector('#diagram svg').style.transform.replace(/\s/g, ''), 'translate(100px,150px)scale(1)');
  } finally {
    close();
  }
});

test('journey focus adapts to a short canvas and the visible banner bounds', async () => {
  const { window, close } = await createViewer();
  try {
    const document = window.document;
    const viewport = document.getElementById('viewport');
    viewport.getBoundingClientRect = () => ({ left: 0, top: 20, right: 390, bottom: 280, width: 390, height: 260 });
    const banner = document.getElementById('journey-banner');
    banner.getBoundingClientRect = () => ({ left: 10, top: 30, right: 380, bottom: 180, width: 370, height: 150 });
    for (const [id, x] of [['customer', 100], ['cart', 300]]) {
      const node = [...document.querySelectorAll('[data-bigso-id]')].find((item) => item.getAttribute('data-bigso-id') === id);
      node.getBBox = () => ({ x: -50, y: -20, width: 100, height: 40 });
      node.getCTM = () => ({ a: 1, b: 0, c: 0, d: 1, e: x, f: 200 });
    }
    const select = document.getElementById('journey-select');
    select.value = '0';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));

    const normalized = document.querySelector('#diagram svg').style.transform.replace(/\s/g, '');
    const [, actualY, actualScale] = /translate\([^,]+px,([-\d.]+)px\)scale\(([-\d.]+)\)/.exec(normalized) || [];
    const availableTop = 180 - 20 + 12;
    const availableBottom = 260 - 16;
    const expectedScale = Math.min(1.35, (390 - 32) / 300, (availableBottom - availableTop) / 40);
    const expectedY = (availableTop + availableBottom) / 2 - 200 * expectedScale;

    assert.equal(banner.hidden, false);
    assert.ok(Math.abs(Number(actualScale) - expectedScale) < 0.001);
    assert.ok(Math.abs(Number(actualY) - expectedY) < 0.01);
  } finally {
    close();
  }
});

test('a resize observer does not reset the focused route to the full-map fit', async () => {
  const { window, close } = await createViewer({ resizeObserver: true });
  try {
    const document = window.document;
    for (const [id, x] of [['customer', 0], ['cart', 150]]) {
      const node = [...document.querySelectorAll('[data-bigso-id]')].find((item) => item.getAttribute('data-bigso-id') === id);
      node.getBBox = () => ({ x, y: 40, width: 100, height: 40 });
    }
    const select = document.getElementById('journey-select');
    select.value = '0';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
    assert.ok(document.querySelector('#diagram svg').style.transform.includes('scale(1.35)'));

    window.__resizeCallback();

    assert.ok(document.querySelector('#diagram svg').style.transform.includes('scale(1.35)'));
  } finally {
    close();
  }
});

test('short tablet layouts keep the page scrollable and constrain the journey banner', async () => {
  const html = await exportMermaidHtml(source, 'flowchart', metadata, graph);
  assert.match(html, /@media\(max-height:600px\) and \(min-width:701px\)/);
  assert.match(html, /body\{height:auto;min-height:100vh;overflow:auto\}/);
  assert.match(html, /map-stage\{min-height:480px\}/);
  assert.match(html, /journey-banner\{max-height:calc\(100% - 96px\);overflow:auto\}/);
});

test('offline viewer embeds no remote assets and honors reduced-motion preferences', async () => {
  const html = await exportMermaidHtml(source, 'flowchart', metadata);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /<script\s+src=/i);
  assert.match(html, /prefers-reduced-motion:reduce/);
  assert.match(html, /animation-duration:\.01ms/);
});
