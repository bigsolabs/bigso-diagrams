const SCHEMA = 'bigso-diagrams/diagram@1';
const TYPES = new Set(['flowchart', 'architecture', 'sequence', 'erd']);
const CARDINALITIES = new Set(['one', 'many', 'zero-or-one', 'zero-or-many']);
const ID = /^[A-Za-z0-9_.-]+$/;

const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

export function validateDiagram(document) {
  const issues = [];
  const add = (path, message) => issues.push({ path, message });
  const keys = (value, allowed, path) => {
    if (!object(value)) return;
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) add(`${path}.${key}`, 'Unexpected field.');
    }
  };
  const text = (value, path, { optional = false } = {}) => {
    if (optional && value === undefined) return false;
    if (typeof value !== 'string' || !value.trim()) {
      add(path, 'Must be a non-empty string.');
      return false;
    }
    return true;
  };
  const list = (value, path, min = 0) => {
    if (!Array.isArray(value)) {
      add(path, 'Must be an array.');
      return [];
    }
    if (value.length < min) add(path, `Must contain at least ${min} item(s).`);
    return value;
  };
  const id = (value, path) => {
    if (!text(value, path)) return false;
    if (!ID.test(value)) {
      add(path, 'May contain only letters, digits, underscore, hyphen, and period.');
      return false;
    }
    return true;
  };
  const record = (value, path, allowed) => {
    if (!object(value)) {
      add(path, 'Must be an object.');
      return false;
    }
    keys(value, allowed, path);
    return true;
  };

  if (!record(document, '$', ['schema', 'type', 'title', 'description', 'payload'])) return issues;
  if (document.schema !== SCHEMA) add('$.schema', `Must equal "${SCHEMA}".`);
  if (!TYPES.has(document.type)) {
    add('$.type', `Unsupported diagram type; expected ${[...TYPES].join(', ')}.`);
    return issues;
  }
  text(document.title, '$.title');
  text(document.description, '$.description', { optional: true });
  if (!object(document.payload)) {
    add('$.payload', 'Must be an object.');
    return issues;
  }
  const payload = document.payload;

  const validateNamedItems = (items, path, allowed, kindField, kinds, min = 1) => {
    const values = list(items, path, min);
    const ids = new Set();
    values.forEach((item, index) => {
      const at = `${path}[${index}]`;
      if (!record(item, at, allowed)) return;
      if (id(item.id, `${at}.id`)) {
        if (ids.has(item.id)) add(`${at}.id`, `Duplicate identifier "${item.id}".`);
        ids.add(item.id);
      }
      text(item.label, `${at}.label`);
      if (kindField) {
        if (!kinds.includes(item[kindField])) add(`${at}.${kindField}`, `Must be one of: ${kinds.join(', ')}.`);
      }
    });
    return { values, ids };
  };
  const validateEdges = (items, path, ids) => {
    list(items, path).forEach((edge, index) => {
      const at = `${path}[${index}]`;
      if (!record(edge, at, ['from', 'to', 'label'])) return;
      for (const field of ['from', 'to']) {
        if (id(edge[field], `${at}.${field}`) && !ids.has(edge[field])) add(`${at}.${field}`, `Unknown identifier "${edge[field]}".`);
      }
      text(edge.label, `${at}.label`, { optional: true });
    });
  };

  if (document.type === 'flowchart') {
    keys(payload, ['nodes', 'edges'], '$.payload');
    const { ids } = validateNamedItems(payload.nodes, '$.payload.nodes', ['id', 'label', 'kind'], 'kind', ['start', 'end', 'process', 'decision']);
    validateEdges(payload.edges, '$.payload.edges', ids);
  } else if (document.type === 'architecture') {
    keys(payload, ['components', 'dependencies'], '$.payload');
    const { ids } = validateNamedItems(payload.components, '$.payload.components', ['id', 'label', 'kind'], 'kind', ['user', 'application', 'service', 'database', 'external']);
    validateEdges(payload.dependencies, '$.payload.dependencies', ids);
  } else if (document.type === 'sequence') {
    keys(payload, ['participants', 'messages'], '$.payload');
    const { ids } = validateNamedItems(payload.participants, '$.payload.participants', ['id', 'label'], null, [], 2);
    list(payload.messages, '$.payload.messages', 1).forEach((message, index) => {
      const at = `$.payload.messages[${index}]`;
      if (!record(message, at, ['from', 'to', 'label', 'kind'])) return;
      for (const field of ['from', 'to']) {
        if (id(message[field], `${at}.${field}`) && !ids.has(message[field])) add(`${at}.${field}`, `Unknown participant "${message[field]}".`);
      }
      text(message.label, `${at}.label`);
      if (message.kind !== undefined && !['call', 'async', 'return'].includes(message.kind)) add(`${at}.kind`, 'Must be one of: call, async, return.');
    });
  } else if (document.type === 'erd') {
    keys(payload, ['entities', 'relationships'], '$.payload');
    const entities = list(payload.entities, '$.payload.entities', 1);
    const ids = new Set();
    entities.forEach((entity, index) => {
      const at = `$.payload.entities[${index}]`;
      if (!record(entity, at, ['id', 'label', 'attributes'])) return;
      if (id(entity.id, `${at}.id`)) {
        if (ids.has(entity.id)) add(`${at}.id`, `Duplicate identifier "${entity.id}".`);
        ids.add(entity.id);
      }
      text(entity.label, `${at}.label`);
      list(entity.attributes, `${at}.attributes`).forEach((attribute, attributeIndex) => {
        const attrAt = `${at}.attributes[${attributeIndex}]`;
        if (!record(attribute, attrAt, ['name', 'type', 'primaryKey'])) return;
        text(attribute.name, `${attrAt}.name`);
        text(attribute.type, `${attrAt}.type`);
        if (attribute.primaryKey !== undefined && typeof attribute.primaryKey !== 'boolean') add(`${attrAt}.primaryKey`, 'Must be a boolean.');
      });
    });
    list(payload.relationships, '$.payload.relationships').forEach((relationship, index) => {
      const at = `$.payload.relationships[${index}]`;
      if (!record(relationship, at, ['from', 'to', 'label', 'fromCardinality', 'toCardinality'])) return;
      for (const field of ['from', 'to']) {
        if (id(relationship[field], `${at}.${field}`) && !ids.has(relationship[field])) add(`${at}.${field}`, `Unknown entity "${relationship[field]}".`);
      }
      text(relationship.label, `${at}.label`, { optional: true });
      for (const field of ['fromCardinality', 'toCardinality']) {
        if (!CARDINALITIES.has(relationship[field])) add(`${at}.${field}`, `Must be one of: ${[...CARDINALITIES].join(', ')}.`);
      }
    });
  }

  return issues;
}
