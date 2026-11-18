import { renderGraph } from './graph.mjs';

export function renderFlowchart(document) {
  return renderGraph(document.title, document.payload.nodes, document.payload.edges, 'flowchart');
}
