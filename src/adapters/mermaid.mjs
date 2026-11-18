import { JSDOM } from 'jsdom';

const dom = new JSDOM('', { url: 'https://bigso.invalid/' });
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const MERMAID_READY = import('mermaid').then(({ default: mermaid }) => {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    secure: ['securityLevel', 'startOnLoad', 'secure', 'maxTextSize', 'suppressErrorRendering'],
    flowchart: { htmlLabels: false },
  });
  return mermaid;
});

const SUPPORTED_TYPES = new Map([
  ['architecture', 'architecture'],
  ['flowchart-v2', 'flowchart'],
  ['sequence', 'sequence'],
]);

function issue(code, message, line) {
  return { code, message, ...(Number.isInteger(line) ? { line } : {}) };
}

function sourceLine(source, index) {
  return source.slice(0, index).split('\n').length;
}

function normalizeEdges(rawEdges) {
  const counts = new Map();
  return rawEdges.map(({ from, to, id, label }) => {
    const pair = `${from}\u0000${to}`;
    const linkIndex = counts.get(pair) ?? 0;
    counts.set(pair, linkIndex + 1);
    return { from, to, id: id ?? `${from}->${to}#${linkIndex}`, label: label ?? '', linkIndex };
  });
}

function extractGraph(diagram, supportedType) {
  const db = diagram.db;
  if (supportedType === 'flowchart') {
    const vertices = db.getVertices();
    return {
      nodes: [...vertices.keys()],
      edges: normalizeEdges(db.getEdges().map((edge) => ({ from: edge.start, to: edge.end, id: edge.id, label: edge.text }))),
    };
  }
  if (supportedType === 'architecture') {
    const nodes = [...db.getNodes().map((node) => node.id), ...db.getGroups().map((group) => group.id)];
    return {
      nodes: [...new Set(nodes)],
      edges: normalizeEdges(db.getEdges().map((edge) => ({ from: edge.lhsId, to: edge.rhsId, label: edge.title }))),
    };
  }
  const actors = db.getActors();
  const messages = db.getMessages().filter((message) => typeof message.from === 'string' && typeof message.to === 'string');
  return {
    nodes: [...actors.keys()],
    edges: normalizeEdges(messages.map((message) => ({ from: message.from, to: message.to, id: message.id, label: message.message }))),
  };
}

export async function validateMermaidSource(source) {
  if (typeof source !== 'string' || !source.trim()) {
    return { ok: false, supportedType: null, issues: [issue('INVALID_SOURCE', 'Mermaid source must be a non-empty string.')] };
  }

  const frontMatter = /^\s*---\s*$/m.exec(source);
  if (frontMatter) {
    return { ok: false, supportedType: null, issues: [issue('UNSUPPORTED_CONFIG', 'Mermaid frontmatter configuration is not supported; Bigso controls renderer security and layout.', sourceLine(source, frontMatter.index))] };
  }
  const directive = /%%\s*\{/m.exec(source);
  if (directive) {
    return { ok: false, supportedType: null, issues: [issue('UNSUPPORTED_CONFIG', 'Mermaid directives are not supported; Bigso controls renderer security and layout.', sourceLine(source, directive.index))] };
  }
  const callback = /(?:^|;)\s*click\s+\S+/im.exec(source);
  if (callback) {
    return { ok: false, supportedType: null, issues: [issue('UNSUPPORTED_CALLBACK', 'Mermaid click callbacks and links are not supported by the local viewer.', sourceLine(source, callback.index))] };
  }

  try {
    const mermaid = await MERMAID_READY;
    const diagram = await mermaid.mermaidAPI.getDiagramFromText(source);
    const diagramType = diagram.type;
    const supportedType = SUPPORTED_TYPES.get(diagramType);
    if (!supportedType) {
      return {
        ok: false,
        diagramType,
        supportedType: null,
        issues: [issue('UNSUPPORTED_DIAGRAM', `Mermaid diagram type "${diagramType}" is outside the documented support matrix.`)],
      };
    }
    return { ok: true, diagramType, supportedType, graph: extractGraph(diagram, supportedType), issues: [] };
  } catch (error) {
    const location = error?.hash?.loc;
    const line = Number.isInteger(location?.first_line) ? location.first_line + 1 : undefined;
    return {
      ok: false,
      supportedType: null,
      issues: [issue('MERMAID_PARSE', String(error?.message ?? error).slice(0, 1200), line)],
    };
  }
}
