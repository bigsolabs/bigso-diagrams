import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { mapMermaidElements } from '../src/adapters/mermaid-svg-map.mjs';

const parseSvg = (content) => new JSDOM(content, { contentType: 'image/svg+xml' }).window.document.querySelector('svg');

test('maps Mermaid flowchart node IDs and endpoint edges to rendered SVG elements', () => {
  const svg = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><path class="flowchart-link" id="bigso-render-L_customer_gateway_0"/><g class="node" id="bigso-render-flowchart-customer-0"/><g class="node" id="bigso-render-flowchart-gateway-1"/></svg>');
  const mapped = mapMermaidElements(svg, 'flowchart', 'bigso-render');
  assert.equal(mapped.nodes.customer[0].id, 'bigso-render-flowchart-customer-0');
  assert.equal(mapped.nodes.gateway[0].id, 'bigso-render-flowchart-gateway-1');
  assert.equal(mapped.edges['customer->gateway'][0].id, 'bigso-render-L_customer_gateway_0');
  assert.deepEqual(mapped.ambiguous, []);
});

test('maps architecture services and groups without conflating their semantic IDs', () => {
  const svg = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><path class="edge" id="bigso-render-L_web_api_0"/><g class="architecture-service" id="bigso-render-service-web"/><rect class="node-bkg" id="bigso-render-group-platform"/><g class="architecture-service" id="bigso-render-service-api"/></svg>');
  const mapped = mapMermaidElements(svg, 'architecture', 'bigso-render');
  assert.equal(mapped.nodes.web[0].id, 'bigso-render-service-web');
  assert.equal(mapped.nodes.platform[0].id, 'bigso-render-group-platform');
  assert.equal(mapped.edges['web->api'][0].id, 'bigso-render-L_web_api_0');
});

test('maps sequence participants by their Mermaid name attribute', () => {
  const svg = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect class="actor actor-top" name="gateway"/><rect class="actor actor-bottom" name="gateway"/><g class="actor-man actor-top" name="client"/></svg>');
  const mapped = mapMermaidElements(svg, 'sequence', 'bigso-render');
  assert.equal(mapped.nodes.gateway.length, 2);
  assert.equal(mapped.nodes.client[0].getAttribute('class'), 'actor-man actor-top');
  assert.deepEqual(mapped.edges, {});
});

test('maps ordered sequence message lines to semantic graph transitions', () => {
  const svg = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect class="actor actor-top" name="client"/><rect class="actor actor-top" name="gateway"/><rect class="actor actor-top" name="orders"/><line class="messageLine0"/><line class="messageLine1"/></svg>');
  const graph = { edges: [{ from: 'client', to: 'gateway' }, { from: 'gateway', to: 'orders' }] };
  const mapped = mapMermaidElements(svg, 'sequence', 'bigso-render', graph);
  assert.equal(mapped.edges['client->gateway'][0].getAttribute('class'), 'messageLine0');
  assert.equal(mapped.edges['gateway->orders'][0].getAttribute('class'), 'messageLine1');
});

test('does not guess when Mermaid edge IDs are ambiguous for underscore IDs', () => {
  const svg = parseSvg('<svg xmlns="http://www.w3.org/2000/svg"><path class="flowchart-link" id="bigso-render-L_a_b_c_0"/><g class="node" id="bigso-render-flowchart-a-0"/><g class="node" id="bigso-render-flowchart-a_b-1"/><g class="node" id="bigso-render-flowchart-b_c-2"/><g class="node" id="bigso-render-flowchart-c-3"/></svg>');
  const mapped = mapMermaidElements(svg, 'flowchart', 'bigso-render');
  assert.deepEqual(mapped.edges, {});
  assert.deepEqual(mapped.ambiguous, ['bigso-render-L_a_b_c_0']);
});
