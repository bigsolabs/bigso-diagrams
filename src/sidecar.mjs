const ID = /^[A-Za-z0-9_.-]+$/;
const KINDS = new Set(['service', 'database', 'client', 'gateway', 'queue', 'external', 'group']);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateSidecar(sidecar, graph = null) {
  const issues = [];
  const add = (path, code, message) => issues.push({ path, code, message });
  const text = (value, path, { optional = false } = {}) => {
    if (optional && value === undefined) return;
    if (typeof value !== 'string' || !value.trim()) add(path, 'INVALID_TEXT', 'Must be a non-empty string.');
  };
  const validateId = (value, path) => {
    if (typeof value !== 'string' || !ID.test(value)) add(path, 'INVALID_ID', 'Must contain only letters, digits, underscore, hyphen, or period.');
  };
  const keys = (value, allowed, path) => {
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) add(`${path}.${key}`, 'UNEXPECTED_FIELD', 'Unexpected field.');
    }
  };
  const graphNodes = graph ? new Set(graph.nodes ?? []) : null;
  const graphEdges = graph?.edges ?? [];

  if (!object(sidecar)) return [{ path: '$', code: 'INVALID_OBJECT', message: 'Sidecar must be a JSON object.' }];
  keys(sidecar, ['schema', 'elements', 'journeys'], '$');
  if (sidecar.schema !== 'bigso-diagrams/sidecar@1') {
    add('$.schema', 'INVALID_SCHEMA', 'Must equal "bigso-diagrams/sidecar@1".');
  }
  if (sidecar.elements === undefined && sidecar.journeys === undefined) {
    add('$', 'EMPTY_SIDECAR', 'Sidecar must include element metadata, journeys, or both.');
  }

  if (sidecar.elements !== undefined) {
    if (!object(sidecar.elements)) {
      add('$.elements', 'INVALID_OBJECT', 'Elements must be an object keyed by Mermaid IDs.');
    } else {
      if (Object.keys(sidecar.elements).length === 0) add('$.elements', 'TOO_FEW_ITEMS', 'Element metadata must contain at least one item when present.');
      for (const [id, metadata] of Object.entries(sidecar.elements)) {
        const at = `$.elements.${id}`;
        validateId(id, at);
        if (graphNodes && ID.test(id) && !graphNodes.has(id)) add(at, 'MISSING_NODE', `Element ID "${id}" is absent from the Mermaid source.`);
        if (!object(metadata)) {
          add(at, 'INVALID_OBJECT', 'Element metadata must be an object.');
          continue;
        }
        keys(metadata, ['description', 'annotations', 'kind'], at);
        if (metadata.kind !== undefined && !KINDS.has(metadata.kind)) {
          add(`${at}.kind`, 'INVALID_KIND', 'Must be one of: service, database, client, gateway, queue, external, group.');
        }
        text(metadata.description, `${at}.description`, { optional: true });
        if (metadata.annotations !== undefined) {
          if (!Array.isArray(metadata.annotations)) add(`${at}.annotations`, 'INVALID_ARRAY', 'Annotations must be an array of non-empty strings.');
          else metadata.annotations.forEach((annotation, index) => text(annotation, `${at}.annotations[${index}]`));
        }
        if (metadata.kind === undefined && metadata.description === undefined && (!Array.isArray(metadata.annotations) || metadata.annotations.length === 0)) {
          add(at, 'EMPTY_METADATA', 'Provide a kind, a description, or at least one annotation.');
        }
      }
    }
  }

  if (sidecar.journeys !== undefined) {
    if (!Array.isArray(sidecar.journeys)) {
      add('$.journeys', 'INVALID_ARRAY', 'Journeys must be an array.');
    } else if (sidecar.journeys.length === 0) {
      add('$.journeys', 'TOO_FEW_ITEMS', 'Journeys must contain at least one item.');
    } else {
      const journeyIds = new Set();
      sidecar.journeys.forEach((journey, journeyIndex) => {
        const at = `$.journeys[${journeyIndex}]`;
        if (!object(journey)) {
          add(at, 'INVALID_OBJECT', 'Journey must be an object.');
          return;
        }
        keys(journey, ['id', 'title', 'description', 'steps'], at);
        validateId(journey.id, `${at}.id`);
        if (typeof journey.id === 'string' && ID.test(journey.id)) {
          if (journeyIds.has(journey.id)) add(`${at}.id`, 'DUPLICATE_ID', `Duplicate journey ID "${journey.id}".`);
          journeyIds.add(journey.id);
        }
        text(journey.title, `${at}.title`);
        text(journey.description, `${at}.description`, { optional: true });
        if (!Array.isArray(journey.steps)) {
          add(`${at}.steps`, 'INVALID_ARRAY', 'Steps must be an array.');
          return;
        }
        if (journey.steps.length === 0) add(`${at}.steps`, 'TOO_FEW_ITEMS', 'A journey must contain at least one transition step.');
        const stepIds = new Set();
        journey.steps.forEach((step, stepIndex) => {
          const stepAt = `${at}.steps[${stepIndex}]`;
          if (!object(step)) {
            add(stepAt, 'INVALID_OBJECT', 'Step must be an object.');
            return;
          }
          keys(step, ['id', 'title', 'description', 'transition'], stepAt);
          validateId(step.id, `${stepAt}.id`);
          if (typeof step.id === 'string' && ID.test(step.id)) {
            if (stepIds.has(step.id)) add(`${stepAt}.id`, 'DUPLICATE_ID', `Duplicate step ID "${step.id}" in this journey.`);
            stepIds.add(step.id);
          }
          text(step.title, `${stepAt}.title`);
          text(step.description, `${stepAt}.description`, { optional: true });
          if (!object(step.transition)) {
            add(`${stepAt}.transition`, 'INVALID_TRANSITION', 'Step must identify a Mermaid transition with from and to IDs.');
            return;
          }
          keys(step.transition, ['from', 'to', 'linkIndex'], `${stepAt}.transition`);
          validateId(step.transition.from, `${stepAt}.transition.from`);
          validateId(step.transition.to, `${stepAt}.transition.to`);
          if (step.transition.linkIndex !== undefined && (!Number.isInteger(step.transition.linkIndex) || step.transition.linkIndex < 0)) {
            add(`${stepAt}.transition.linkIndex`, 'INVALID_LINK_INDEX', 'linkIndex must be a non-negative integer.');
          }
          if (graphNodes && ID.test(step.transition.from) && ID.test(step.transition.to)) {
            const { from, to, linkIndex } = step.transition;
            const fromExists = graphNodes.has(from);
            const toExists = graphNodes.has(to);
            if (!fromExists) add(`${stepAt}.transition.from`, 'MISSING_NODE', `Node ID "${from}" is absent from the Mermaid source.`);
            if (!toExists) add(`${stepAt}.transition.to`, 'MISSING_NODE', `Node ID "${to}" is absent from the Mermaid source.`);
            if (fromExists && toExists) {
              const matches = graphEdges.filter((edge) => edge.from === from && edge.to === to);
              if (matches.length === 0) add(`${stepAt}.transition`, 'MISSING_TRANSITION', `No Mermaid transition exists from "${from}" to "${to}".`);
              else if (linkIndex === undefined && matches.length > 1) add(`${stepAt}.transition`, 'AMBIGUOUS_TRANSITION', `There are ${matches.length} Mermaid transitions from "${from}" to "${to}"; specify linkIndex.`);
              else if (linkIndex !== undefined && linkIndex >= matches.length) add(`${stepAt}.transition.linkIndex`, 'LINK_INDEX_OUT_OF_RANGE', `linkIndex must be between 0 and ${matches.length - 1} for this transition.`);
            }
          }
        });
      });
    }
  }
  return issues;
}
