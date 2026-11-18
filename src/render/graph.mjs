import { path, svgDocument, wrappedText } from './svg.mjs';

function graphLayout(nodes, edges, width, height) {
  const order = new Map(nodes.map((node, index) => [node.id, index]));
  const rank = new Map(nodes.map((node) => [node.id, 0]));
  const indegree = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    if (!outgoing.has(edge.from) || !indegree.has(edge.to)) continue;
    outgoing.get(edge.from).push(edge.to);
    indegree.set(edge.to, indegree.get(edge.to) + 1);
  }
  const ready = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  let visited = 0;
  while (ready.length) {
    const id = ready.shift(); visited++;
    for (const target of outgoing.get(id)) {
      rank.set(target, Math.max(rank.get(target), rank.get(id) + 1));
      indegree.set(target, indegree.get(target) - 1);
      if (indegree.get(target) === 0) ready.push(target);
    }
  }
  // Cycles remain at a stable rank rather than preventing a useful rendering.
  const byRank = new Map();
  for (const node of nodes) {
    const key = rank.get(node.id);
    if (!byRank.has(key)) byRank.set(key, []);
    byRank.get(key).push(node);
  }
  const maxRank = Math.max(0, ...byRank.keys());
  const xGap = width + 110, yGap = height + 80;
  const positions = new Map();
  for (const [column, group] of [...byRank.entries()].sort(([a], [b]) => a - b)) {
    group.sort((a, b) => order.get(a.id) - order.get(b.id));
    group.forEach((node, row) => positions.set(node.id, { x: 70 + column * xGap, y: 70 + row * yGap, width, height }));
  }
  return { positions, width: 140 + (maxRank + 1) * xGap, height: 140 + Math.max(1, ...[...byRank.values()].map((group) => group.length)) * yGap };
}

function edgeSvg(edge, positions, index) {
  const from = positions.get(edge.from), to = positions.get(edge.to);
  if (!from || !to) return '';
  const forward = to.x >= from.x;
  const sx = forward ? from.x + from.width : from.x;
  const tx = forward ? to.x : to.x + to.width;
  const sy = from.y + from.height / 2;
  const ty = to.y + to.height / 2;
  let d;
  if (forward) {
    const mx = sx + Math.max(24, (tx - sx) / 2);
    d = `M${sx} ${sy} H${mx} V${ty} H${tx}`;
  } else {
    const routeY = Math.max(from.y + from.height, to.y + to.height) + 32 + (index % 3) * 12;
    d = `M${sx} ${sy} V${routeY} H${tx} V${ty}`;
  }
  const label = edge.label ? wrappedText((sx + tx) / 2, (sy + ty) / 2 - 8, edge.label, { className: 'edge-label', maxChars: 20, fontSize: 12 }) : '';
  return `${path(d)}${label}`;
}

export function renderGraph(title, nodes, edges, kind) {
  const { positions, width, height } = graphLayout(nodes, edges, 180, 82);
  const links = edges.map((edge, index) => edgeSvg(edge, positions, index)).join('');
  const shapes = nodes.map((node) => {
    const pos = positions.get(node.id);
    const klass = `node kind-${node.kind}`;
    if (kind === 'flowchart' && (node.kind === 'start' || node.kind === 'end')) {
      return `<g class="${klass}"><ellipse cx="${pos.x + pos.width / 2}" cy="${pos.y + pos.height / 2}" rx="78" ry="34"/>${wrappedText(pos.x + pos.width / 2, pos.y + pos.height / 2 + 5, node.label)}</g>`;
    }
    if (kind === 'flowchart' && node.kind === 'decision') {
      const cx = pos.x + pos.width / 2, cy = pos.y + pos.height / 2;
      return `<g class="${klass}"><polygon points="${cx},${pos.y} ${pos.x + pos.width},${cy} ${cx},${pos.y + pos.height} ${pos.x},${cy}"/>${wrappedText(cx, cy + 5, node.label, { maxChars: 19, fontSize: 14 })}</g>`;
    }
    return `<g class="${klass}"><rect x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" rx="12"/>${wrappedText(pos.x + pos.width / 2, pos.y + pos.height / 2 + 5, node.label)}</g>`;
  }).join('');
  return svgDocument(title, width, height, `<g class="edges">${links}</g><g class="nodes">${shapes}</g>`);
}
