import { escapeXml, path, svgDocument, wrappedText } from './svg.mjs';

export function renderErd(document) {
  const { entities, relationships } = document.payload;
  const boxW = 260, headerH = 46, attrH = 30, colGap = 180, rowGap = 90;
  const positions = new Map();
  entities.forEach((entity, index) => {
    const col = index % 2, row = Math.floor(index / 2);
    positions.set(entity.id, { x: 70 + col * (boxW + colGap), y: 72 + row * (Math.max(190, headerH + entity.attributes.length * attrH) + rowGap), h: headerH + Math.max(1, entity.attributes.length) * attrH });
  });
  const maxRow = Math.max(0, ...entities.map((_, i) => Math.floor(i / 2)));
  const height = Math.max(300, 150 + (maxRow + 1) * (230 + rowGap));
  const width = Math.max(420, 140 + Math.min(2, entities.length) * (boxW + colGap));
  const relations = relationships.map((relation, index) => {
    const from = positions.get(relation.from), to = positions.get(relation.to);
    if (!from || !to) return '';
    const sameRow = Math.abs(from.y - to.y) < 10;
    const startX = from.x + boxW, endX = to.x;
    const startY = from.y + from.h / 2, endY = to.y + to.h / 2;
    const d = sameRow ? `M${startX} ${startY} H${endX}` : `M${startX} ${startY} H${startX + 36 + index * 8} V${endY} H${endX}`;
    const midX = (startX + endX) / 2;
    return `${path(d, { className: 'relationship' })}${wrappedText(midX, (startY + endY) / 2 - 10, relation.label || '', { className: 'relationship-label', maxChars: 20, fontSize: 12 })}${wrappedText(startX + 48, startY - 8, relation.fromCardinality, { className: 'cardinality', maxChars: 16, anchor: 'start', fontSize: 11 })}${wrappedText(endX - 8, endY - 8, relation.toCardinality, { className: 'cardinality', maxChars: 16, anchor: 'end', fontSize: 11 })}`;
  }).join('');
  const entitySvg = entities.map((entity) => {
    const pos = positions.get(entity.id);
    const attrs = entity.attributes.length ? entity.attributes : [{ name: '—', type: '' }];
    const rows = attrs.map((attribute, index) => {
      const y = pos.y + headerH + (index + 1) * attrH - 9;
      const key = attribute.primaryKey ? 'PK ' : '';
      const type = attribute.type ? `: ${attribute.type}` : '';
      return `<text class="attribute" x="${pos.x + 14}" y="${y}" text-anchor="start">${escapeXml(key + attribute.name + type)}</text>`;
    }).join('');
    return `<g class="entity"><rect class="entity-box" x="${pos.x}" y="${pos.y}" width="${boxW}" height="${pos.h}" rx="8"/><path class="entity-header" d="M${pos.x + 8} ${pos.y} H${pos.x + boxW - 8} Q${pos.x + boxW} ${pos.y} ${pos.x + boxW} ${pos.y + 8} V${pos.y + headerH} H${pos.x} V${pos.y + 8} Q${pos.x} ${pos.y} ${pos.x + 8} ${pos.y} Z"/>${wrappedText(pos.x + boxW / 2, pos.y + 30, entity.label, { className: 'entity-title' })}${rows}</g>`;
  }).join('');
  return svgDocument(document.title, width, height, `<g class="relationships">${relations}</g><g class="entities">${entitySvg}</g>`);
}
