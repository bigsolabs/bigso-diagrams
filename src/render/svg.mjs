export function escapeXml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[char]);
}

export function wrappedText(x, y, value, { className = '', anchor = 'middle', fontSize = 15, maxChars = 24 } = {}) {
  const words = String(value ?? '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line && `${line} ${word}`.length > maxChars) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  const start = y - Math.max(0, lines.length - 1) * fontSize * 0.55;
  const klass = className ? ` class="${escapeXml(className)}"` : '';
  return `<text${klass} x="${x}" y="${start}" text-anchor="${anchor}" font-size="${fontSize}">${lines.map((part, index) => `<tspan x="${x}" dy="${index ? fontSize * 1.2 : 0}">${escapeXml(part)}</tspan>`).join('')}</text>`;
}

export function svgDocument(title, width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" class="diagram" role="img" aria-label="${escapeXml(title)}"><title>${escapeXml(title)}</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#526078"/></marker></defs><style>text{font-family:system-ui,sans-serif;fill:#172033}.canvas{fill:#fbfcfe}.edge{stroke:#526078}.node rect,.node ellipse,.node polygon{fill:#fff;stroke:#526078;stroke-width:2}.node.kind-start ellipse,.node.kind-end ellipse{fill:#e9f8f0;stroke:#23855b}.node.kind-decision polygon{fill:#fff5d9;stroke:#aa7510}.participant rect{fill:#edf2fa;stroke:#6d7d96;stroke-width:2}.lifeline{stroke:#a7b1c2;stroke-dasharray:5 5}.entity-box{fill:#fff;stroke:#526078;stroke-width:2}.entity-header{fill:#e8eef8;stroke:#526078;stroke-width:1}.attribute{font-size:13px}.edge-label,.relationship-label,.cardinality{fill:#39465b}</style><rect class="canvas" width="${width}" height="${height}"/>${body}</svg>`;
}

export function path(d, { className = 'edge', dashed = false } = {}) {
  return `<path class="${escapeXml(className)}" d="${escapeXml(d)}" fill="none" stroke="#526078" stroke-width="2" ${dashed ? 'stroke-dasharray="6 5"' : ''} marker-end="url(#arrow)"/>`;
}
