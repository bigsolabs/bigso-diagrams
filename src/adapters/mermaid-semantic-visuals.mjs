// Fixed, original line glyphs. Metadata only selects a key; it never becomes SVG.
const KINDS = Object.freeze({
  service: { color: '#3156b8', fill: '#f3f6ff', path: 'M-3-3h6v6h-6z M-1-5v2 M1-5v2 M-1 3v2 M1 3v2' },
  database: { color: '#087e81', fill: '#effafa', path: 'M-4-3c0-2 8-2 8 0v6c0 2-8 2-8 0z M-4-3c0 2 8 2 8 0 M-4 0c0 2 8 2 8 0' },
  client: { color: '#7552ad', fill: '#f9f4ff', path: 'M-4-3h8v6h-8z M-2 5h4 M0 3v2' },
  gateway: { color: '#b25f17', fill: '#fff8ef', path: 'M-4-4h8v8h-8z M-3 0h6 M1-2l2 2-2 2' },
  queue: { color: '#a54a72', fill: '#fff3f8', path: 'M-4-3h6 M-4 0h6 M-4 3h6 M2-2l2 2-2 2' },
  external: { color: '#516779', fill: '#f3f7fa', path: 'M1-4h3v3 M4-4L-1 1 M3 1v3h-7v-7h3' },
  group: { color: '#5b668c', fill: '#f6f7fd', path: 'M-4-2v-2h3 M1-4h3v2 M4 1v3H1 M-1 4h-3V1' },
});
const NS = 'http://www.w3.org/2000/svg';

function labelBoxInNode(label, node) {
  const box = label.getBBox();
  const lm = label.getCTM?.();
  const nm = node.getCTM?.();
  if (!lm || !nm || !nm.inverse) return box;
  const m = nm.inverse().multiply(lm);
  const points = [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]
    .map(([x, y]) => ({ x: m.a*x + m.c*y + m.e, y: m.b*x + m.d*y + m.f }));
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs)-Math.min(...xs), height: Math.max(...ys)-Math.min(...ys) };
}

function addBadge(node, shape, kind, palette) {
  // Only rectangular shapes have predictable inset corners. Never expand Mermaid's geometry.
  if (shape.localName !== 'rect') return;
  try {
    const box = shape.getBBox();
    if (box.width < 36 || box.height < 28) return;
    const label = node.querySelector('.label');
    const text = label ? labelBoxInNode(label, node) : null;
    // Use Mermaid's own padded layout area: never grow the shape or move its anchors.
    // Move only the label, and only when both the label and tile still fit inside.
    if (box.width >= 80 && box.height >= 42 && text) {
      const tileSize = 28, left = box.x + 7, top = box.y + (box.height - tileSize) / 2;
      const shift = Math.max(0, left + tileSize + 7 - text.x);
      if (shift <= 18 && text.x + text.width + shift <= box.x + box.width - 7 &&
          text.y >= box.y && text.y + text.height <= box.y + box.height) {
        if (shift) label.setAttribute('transform', `${label.getAttribute('transform') || ''} translate(${shift} 0)`);
        const group = node.ownerDocument.createElementNS(NS, 'g');
        group.setAttribute('data-bigso-icon', kind);
        group.setAttribute('aria-hidden', 'true');
        group.setAttribute('pointer-events', 'none');
        group.setAttribute('transform', `translate(${left} ${top})`);
        const tile = node.ownerDocument.createElementNS(NS, 'rect');
        for (const [key, value] of Object.entries({width: tileSize, height: tileSize, rx: 8, fill: palette.fill, stroke: palette.color, 'stroke-opacity': '.22'})) tile.setAttribute(key, value);
        const glyph = node.ownerDocument.createElementNS(NS, 'path');
        for (const [key, value] of Object.entries({d: palette.path, transform: 'translate(14 14) scale(1.8)', fill: 'none', stroke: palette.color, 'stroke-width': '1', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})) glyph.setAttribute(key, value);
        tile.style.setProperty('fill', palette.fill, 'important');
        tile.style.setProperty('stroke', palette.color, 'important');
        glyph.style.setProperty('fill', 'none', 'important');
        glyph.style.setProperty('stroke', palette.color, 'important');
        group.append(tile, glyph);
        node.append(group);
        return;
      }
    }
    const radius = 7;
    const candidates = [[box.x + 10, box.y + 10], [box.x + box.width - 10, box.y + 10], [box.x + 10, box.y + box.height - 10], [box.x + box.width - 10, box.y + box.height - 10]];
    const position = candidates.find(([x, y]) => !text || x + radius + 2 < text.x || x - radius - 2 > text.x + text.width || y + radius + 2 < text.y || y - radius - 2 > text.y + text.height);
    if (!position) return;
    const group = node.ownerDocument.createElementNS(NS, 'g');
    group.setAttribute('data-bigso-icon', kind);
    group.setAttribute('aria-hidden', 'true');
    group.setAttribute('pointer-events', 'none');
    group.setAttribute('transform', `translate(${position[0]} ${position[1]})`);
    const circle = node.ownerDocument.createElementNS(NS, 'circle');
    circle.setAttribute('r', '7');
    circle.setAttribute('fill', '#ffffff');
    circle.setAttribute('stroke', palette.color);
    circle.setAttribute('stroke-width', '0.8');
    const glyph = node.ownerDocument.createElementNS(NS, 'path');
    glyph.setAttribute('d', palette.path);
    glyph.setAttribute('fill', 'none');
    glyph.setAttribute('stroke', palette.color);
    glyph.setAttribute('stroke-width', '1.1');
    glyph.setAttribute('stroke-linecap', 'round');
    glyph.setAttribute('stroke-linejoin', 'round');
    group.append(circle, glyph);
    node.append(group);
  } catch { /* Geometry unavailable: preserve the original node. */ }
}

export function decorateFlowchart(svg, mapping, metadata = {}) {
  for (const [id, elements] of Object.entries(mapping.nodes)) {
    const kind = metadata?.elements?.[id]?.kind;
    const palette = typeof kind === 'string' && Object.hasOwn(KINDS, kind) ? KINDS[kind] : null;
    for (const node of elements) {
      const shape = Array.from(node.children).find(child => ['rect', 'polygon', 'circle', 'ellipse', 'path'].includes(child.localName));
      if (!shape) continue;
      if (shape.localName === 'rect') {
        shape.setAttribute('rx', '10');
        shape.setAttribute('ry', '10');
      }
      if (!palette) continue;
      node.setAttribute('data-bigso-kind', kind);
      shape.style.setProperty('fill', '#ffffff', 'important');
      shape.style.setProperty('stroke', `var(--bigso-node-stroke, ${palette.color})`, 'important');
      shape.style.setProperty('stroke-width', 'var(--bigso-node-stroke-width, 1.8px)', 'important');
      addBadge(node, shape, kind, palette);
    }
  }
  for (const elements of Object.values(mapping.edges)) for (const edge of elements) {
    edge.style.setProperty('stroke', '#71819b');
    edge.style.setProperty('stroke-width', '2px');
    edge.style.setProperty('stroke-linecap', 'round');
    edge.style.setProperty('stroke-linejoin', 'round');
  }
}
