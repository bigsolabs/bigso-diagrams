import { validateDiagram } from '../validate.mjs';
import { renderArchitecture } from './architecture.mjs';
import { renderErd } from './erd.mjs';
import { renderFlowchart } from './flowchart.mjs';
import { renderSequence } from './sequence.mjs';

const renderers = Object.freeze({
  flowchart: renderFlowchart,
  architecture: renderArchitecture,
  sequence: renderSequence,
  erd: renderErd,
});

export function renderDiagram(document) {
  const issues = validateDiagram(document);
  if (issues.length) {
    const error = new Error(`Invalid diagram: ${issues.map((item) => `${item.path} ${item.message}`).join('; ')}`);
    error.issues = issues;
    throw error;
  }
  return renderers[document.type](document);
}
