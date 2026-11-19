function addNode(nodes, id, element) {
  (nodes[id] ??= []).push(element);
}

function matchesId(id, expression) {
  const match = expression.exec(id);
  return match?.[1];
}

function collectNodes(svg, diagramType, renderId) {
  const nodes = Object.create(null);
  const prefix = `${renderId}-`;
  if (diagramType === 'flowchart') {
    const expression = new RegExp(`^${escapeRegex(prefix)}flowchart-(.+)-\\d+$`);
    for (const element of svg.querySelectorAll('g.node[id]')) {
      const semanticId = matchesId(element.id, expression);
      if (semanticId) addNode(nodes, semanticId, element);
    }
  } else if (diagramType === 'architecture') {
    for (const element of svg.querySelectorAll('[id]')) {
      const serviceId = matchesId(element.id, new RegExp(`^${escapeRegex(prefix)}service-(.+)$`));
      const groupId = matchesId(element.id, new RegExp(`^${escapeRegex(prefix)}group-(.+)$`));
      if (serviceId && element.classList.contains('architecture-service')) addNode(nodes, serviceId, element);
      else if (groupId && element.classList.contains('node-bkg')) addNode(nodes, groupId, element);
    }
  } else if (diagramType === 'sequence') {
    for (const element of svg.querySelectorAll('[name]')) {
      const classes = (element.getAttribute('class') ?? '').split(/\s+/);
      if (classes.includes('actor') || classes.includes('actor-man')) {
        addNode(nodes, element.getAttribute('name'), element);
      }
    }
  }
  return nodes;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function mapMermaidElements(svg, diagramType, renderId, graph = null) {
  if (!svg || typeof svg.querySelectorAll !== 'function') throw new TypeError('Expected a rendered SVG element.');
  if (!['flowchart', 'architecture', 'sequence'].includes(diagramType)) throw new TypeError(`Unsupported Mermaid diagram type: ${diagramType}`);
  if (typeof renderId !== 'string' || !renderId) throw new TypeError('A non-empty Mermaid render ID is required.');

  const nodes = collectNodes(svg, diagramType, renderId);
  const edges = Object.create(null);
  const ambiguous = [];
  if (diagramType === 'sequence') {
    const messageLines = svg.querySelectorAll('line.messageLine0, line.messageLine1');
    const graphEdges = graph?.edges ?? [];
    if (messageLines.length !== graphEdges.length) {
      if (graphEdges.length || messageLines.length) ambiguous.push(`sequence-message-count:${graphEdges.length}:${messageLines.length}`);
    } else {
      graphEdges.forEach((edge, index) => {
        if (!nodes[edge.from] || !nodes[edge.to]) {
          ambiguous.push(`sequence-message-reference:${edge.from}->${edge.to}`);
          return;
        }
        (edges[`${edge.from}->${edge.to}`] ??= []).push(messageLines[index]);
      });
    }
  } else {
    const paths = svg.querySelectorAll('path.flowchart-link[id], path.edge[id]');
    for (const path of paths) {
      const matches = [];
      for (const from of Object.keys(nodes)) {
        for (const to of Object.keys(nodes)) {
          const edgePrefix = `${renderId}-L_${from}_${to}_`;
          if (path.id.startsWith(edgePrefix) && /^\d+$/.test(path.id.slice(edgePrefix.length))) matches.push([from, to]);
        }
      }
      if (matches.length !== 1) {
        if (matches.length > 1) ambiguous.push(path.id);
        continue;
      }
      const [from, to] = matches[0];
      (edges[`${from}->${to}`] ??= []).push(path);
    }
  }
  return { nodes: Object.fromEntries(Object.entries(nodes)), edges: Object.fromEntries(Object.entries(edges)), ambiguous };
}
