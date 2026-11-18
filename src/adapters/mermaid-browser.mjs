import mermaid from 'mermaid';
import { mapMermaidElements } from './mermaid-svg-map.mjs';

let initialized = false;

function initializeMermaid() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    secure: ['securityLevel', 'startOnLoad', 'secure', 'maxTextSize', 'suppressErrorRendering'],
    htmlLabels: false,
    flowchart: { htmlLabels: false, curve: 'linear' },
    theme: 'neutral',
  });
  initialized = true;
}

async function render(container, source, supportedType, renderId, graph = null) {
  initializeMermaid();
  const result = await mermaid.render(renderId, source);
  const parsed = new DOMParser().parseFromString(result.svg, 'image/svg+xml');
  const svg = parsed.documentElement;
  if (svg.localName !== 'svg' || parsed.querySelector('parsererror')) throw new Error('Mermaid returned invalid SVG.');
  const imported = document.importNode(svg, true);
  container.replaceChildren(imported);
  const mapping = mapMermaidElements(imported, supportedType, renderId, graph);
  for (const [semanticId, elements] of Object.entries(mapping.nodes)) {
    for (const element of elements) {
      element.setAttribute('data-bigso-id', semanticId);
      element.setAttribute('tabindex', '0');
      element.setAttribute('role', 'button');
      element.setAttribute('aria-label', semanticId);
    }
  }
  for (const [edgeKey, elements] of Object.entries(mapping.edges)) {
    const separator = edgeKey.indexOf('->');
    const from = edgeKey.slice(0, separator);
    const to = edgeKey.slice(separator + 2);
    for (const [index, element] of elements.entries()) {
      element.setAttribute('data-bigso-edge', 'true');
      element.setAttribute('data-bigso-from', from);
      element.setAttribute('data-bigso-to', to);
      element.setAttribute('data-bigso-link-index', String(index));
    }
  }
  return { svg: imported, mapping };
}

if (typeof globalThis !== 'undefined') {
  globalThis.BigsoMermaid = Object.freeze({ render });
}
