import { renderGraph } from './graph.mjs';

export function renderArchitecture(document) {
  return renderGraph(document.title, document.payload.components, document.payload.dependencies, 'architecture');
}
