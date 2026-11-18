import { path, svgDocument, wrappedText } from './svg.mjs';

export function renderSequence(document) {
  const { participants, messages } = document.payload;
  const step = 210, left = 110, headerY = 38, headerH = 52, firstY = 145, row = 72;
  const centers = new Map(participants.map((p, i) => [p.id, left + i * step]));
  const width = Math.max(420, left * 2 + (participants.length - 1) * step);
  const height = firstY + messages.length * row + 60;
  const participantsSvg = participants.map((participant, i) => {
    const x = centers.get(participant.id);
    return `<g class="participant"><rect x="${x - 76}" y="${headerY}" width="152" height="${headerH}" rx="8"/>${wrappedText(x, headerY + 31, participant.label, { maxChars: 18 })}<line class="lifeline" x1="${x}" y1="${headerY + headerH}" x2="${x}" y2="${height - 28}" stroke="#a7b1c2" stroke-dasharray="5 5"/></g>`;
  }).join('');
  const messagesSvg = messages.map((message, index) => {
    const x1 = centers.get(message.from), x2 = centers.get(message.to), y = firstY + index * row;
    if (x1 === x2) {
      const d = `M${x1} ${y} h58 v24 h-50`;
      return `${path(d, { className: `message ${message.kind || 'call'}`, dashed: message.kind === 'async' || message.kind === 'return' })}${wrappedText(x1 + 54, y - 9, message.label, { maxChars: 22, anchor: 'start', fontSize: 13 })}`;
    }
    const direction = x2 > x1 ? 1 : -1;
    const start = x1 + direction * 4, end = x2 - direction * 4;
    return `${path(`M${start} ${y} H${end}`, { className: `message ${message.kind || 'call'}`, dashed: message.kind === 'async' || message.kind === 'return' })}${wrappedText((x1 + x2) / 2, y - 10, message.label, { maxChars: 24, fontSize: 13 })}`;
  }).join('');
  return svgDocument(document.title, width, height, `<g class="participants">${participantsSvg}</g><g class="messages">${messagesSvg}</g>`);
}
