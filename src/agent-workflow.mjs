import { validateDiagram } from './validate.mjs';

const SUPPORTED_TYPES = Object.freeze(['flowchart', 'architecture', 'sequence', 'erd']);
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function assertValid(document, subject) {
  const issues = validateDiagram(document);
  if (issues.length) {
    throw new Error(`${subject}: ${issues.map(({ path, message }) => `${path} ${message}`).join('; ')}`);
  }
}

function pointerParts(pointer) {
  if (typeof pointer !== 'string' || !pointer.startsWith('/') || pointer === '/') {
    throw new Error('Patch path must be a non-root JSON Pointer.');
  }
  return pointer.slice(1).split('/').map((part) => {
    if (/~(?![01])/.test(part)) throw new Error('Patch path contains an invalid JSON Pointer escape.');
    const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Patch path contains a forbidden property.');
    return key;
  });
}

function arrayIndex(key, length, allowEnd = false) {
  if (!/^(0|[1-9]\d*)$/.test(key)) throw new Error('Patch array index is invalid.');
  const index = Number(key);
  if (!Number.isSafeInteger(index) || index > length || (!allowEnd && index === length)) {
    throw new Error('Patch target does not exist.');
  }
  return index;
}

function applyPatch(document, patch) {
  if (!isObject(patch) || !['add', 'replace', 'remove'].includes(patch.op)) {
    throw new Error('Patch operation must be add, replace, or remove.');
  }
  if (patch.op !== 'remove' && !Object.hasOwn(patch, 'value')) throw new Error('Patch value is required.');
  const parts = pointerParts(patch.path);
  let parent = document;
  for (const key of parts.slice(0, -1)) {
    if (Array.isArray(parent)) parent = parent[arrayIndex(key, parent.length)];
    else if (isObject(parent) && Object.hasOwn(parent, key)) parent = parent[key];
    else throw new Error('Patch target does not exist.');
  }
  const key = parts.at(-1);
  if (Array.isArray(parent)) {
    if (key === '-' && patch.op === 'add') {
      parent.push(patch.value);
      return;
    }
    const index = arrayIndex(key, parent.length, patch.op === 'add');
    if (patch.op === 'add') parent.splice(index, 0, patch.value);
    else if (patch.op === 'replace') parent[index] = patch.value;
    else parent.splice(index, 1);
    return;
  }
  if (!isObject(parent)) throw new Error('Patch parent must be an object or array.');
  const exists = Object.hasOwn(parent, key);
  if (patch.op !== 'add' && !exists) throw new Error('Patch target does not exist.');
  if (patch.op === 'remove') delete parent[key];
  else parent[key] = patch.value;
}

export function resolveAgentResponse(response, existingDocument = undefined) {
  if (!isObject(response) || typeof response.action !== 'string') throw new Error('Agent response must include an action.');
  if (response.action === 'question') {
    if (typeof response.question !== 'string' || !response.question.trim()) throw new Error('Agent clarification question must not be empty.');
    return { status: 'question', question: response.question, shouldWrite: false };
  }
  if (response.action === 'unsupported') {
    if (typeof response.requestedType !== 'string' || !response.requestedType.trim()) throw new Error('Unsupported response must name the requested type.');
    return { status: 'unsupported', requestedType: response.requestedType, supportedTypes: [...SUPPORTED_TYPES], shouldWrite: false };
  }
  if (response.action === 'create') {
    assertValid(response.document, 'Invalid diagram');
    return { status: 'ready', operation: 'create', document: structuredClone(response.document) };
  }
  if (response.action === 'update') {
    if (existingDocument === undefined) throw new Error('An existing document is required for an update.');
    assertValid(existingDocument, 'Existing diagram is invalid');
    if (!Array.isArray(response.patches)) throw new Error('Update response must include a patches array.');
    const document = structuredClone(existingDocument);
    for (const patch of response.patches) applyPatch(document, patch);
    assertValid(document, 'Updated diagram is invalid');
    return { status: 'ready', operation: 'update', document };
  }
  throw new Error(`Unknown agent response action: ${response.action}`);
}
