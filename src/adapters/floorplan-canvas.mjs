/* Floorplan card and ELK layout adaptation, MIT licensed; see third-party/floorplan/LICENSE.
 * ELK bundled distribution: EPL-2.0; Google component Apache-2.0; see third-party/elkjs/.
 * This renderer accepts an explicitly validated, lossless simple-flowchart model only.
 * It is not a Mermaid parser or an eligibility test for Mermaid source.
 */
import ELK from './floorplan-canvas-elk.mjs';

const NS = 'http://www.w3.org/2000/svg';
const HTML = 'http://www.w3.org/1999/xhtml';
let serial = 0;
// Original fixed glyphs shared in spirit with mermaid-semantic-visuals. Metadata
// selects an allowlisted key; it never supplies SVG markup, paths, or colors.
const ICONS = Object.freeze({
  service: {color:'#7a5ad8', fill:'rgba(122, 90, 216, 0.13)', path:'M-3-3h6v6h-6z M-1-5v2 M1-5v2 M-1 3v2 M1 3v2'},
  database: {color:'#0f8a76', fill:'rgba(15, 138, 118, 0.13)', path:'M-4-3c0-2 8-2 8 0v6c0 2-8 2-8 0z M-4-3c0 2 8 2 8 0 M-4 0c0 2 8 2 8 0'},
  client: {color:'#1f7ac4', fill:'rgba(31, 122, 196, 0.13)', path:'M-4-3h8v6h-8z M-2 5h4 M0 3v2'},
  gateway: {color:'#c06a1d', fill:'rgba(192, 106, 29, 0.13)', path:'M-4-4h8v8h-8z M-3 0h6 M1-2l2 2-2 2'},
  queue: {color:'#a8710c', fill:'rgba(168, 113, 12, 0.13)', path:'M-4-3h6 M-4 0h6 M-4 3h6 M2-2l2 2-2 2'},
  external: {color:'#a24dbb', fill:'rgba(162, 77, 187, 0.13)', path:'M1-4h3v3 M4-4L-1 1 M3 1v3h-7v-7h3'},
  group: {color:'#3b6fd1', fill:'rgba(59, 111, 209, 0.13)', path:'M-4-2v-2h3 M1-4h3v2 M4 1v3H1 M-1 4h-3V1'},
});
const FALLBACK_ICON = Object.freeze({color:'#666666', fill:'rgba(102, 102, 102, 0.13)', path:'M-4-4h8v8h-8z M-2 0h4 M0-2v4'});
function svg(doc, name, attrs = {}) {
  const el = doc.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  return el;
}
function html(doc, name, className, text) {
  const el = doc.createElementNS(HTML, name);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function roundedPath(points) {
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i-1], b = points[i], c = points[i+1];
    const d1 = Math.hypot(b.x-a.x,b.y-a.y), d2 = Math.hypot(c.x-b.x,c.y-b.y);
    const r = Math.min(14,d1/2,d2/2);
    if (!r) { d += `L${b.x},${b.y}`; continue; }
    d += `L${b.x+(a.x-b.x)*r/d1},${b.y+(a.y-b.y)*r/d1}Q${b.x},${b.y} ${b.x+(c.x-b.x)*r/d2},${b.y+(c.y-b.y)*r/d2}`;
  }
  const p = points.at(-1); return d+`L${p.x},${p.y}`;
}

export async function renderFloorplanCanvas(container, graph, metadata = {}) {
  if (!container?.ownerDocument || !graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) throw new TypeError('Expected a container and explicit graph nodes and edges');
  const directions = {LR:'RIGHT', RL:'LEFT', TB:'DOWN', TD:'DOWN', BT:'UP'};
  const direction = graph.direction || 'TB';
  if (!directions[direction]) throw new Error(`Unsupported direction: ${direction}`);
  const ids = new Set();
  const heights = new Map();
  for (const node of graph.nodes) {
    if (!node || typeof node.id !== 'string' || !node.id || ids.has(node.id)) throw new Error('Invalid or duplicate node id');
    if (node.shape && !['rect', 'square'].includes(node.shape)) throw new Error(`Unsupported node shape: ${node.shape}`);
    const title = String(node.label || node.id);
    if (title.length > 240) throw new Error('Node title too long for floorplan');
    // Conservative allowance for wide glyphs and explicit line breaks.
    const lines = title.split(/\r\n|\r|\n/).reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 10)), 0);
    heights.set(node.id, Math.max(128, 100 + lines * 22));
    ids.add(node.id);
  }
  const seen = new Set();
  graph.edges.forEach(edge => {
    if (!edge || !ids.has(edge.from) || !ids.has(edge.to) || !Number.isInteger(edge.linkIndex) || edge.linkIndex < 0) throw new Error('Invalid edge or linkIndex');
    if (edge.label && (Array.from(String(edge.label)).length > 200 || /[\r\n\t]/.test(String(edge.label)))) throw new Error('Unsupported edge label size or characters for floorplan');
    const key = JSON.stringify([edge.from,edge.to,edge.linkIndex]);
    if (seen.has(key)) throw new Error('Duplicate edge identity');
    seen.add(key);
  });
  // Canvas measures the actual browser font; jsdom lacks canvas, so retain a
  // generous per-code-point bound in both environments (including wide glyphs).
  const win = container.ownerDocument.defaultView;
  const context = win?.CanvasRenderingContext2D ? container.ownerDocument.createElement('canvas').getContext('2d') : null;
  if (context) context.font = '12px system-ui, sans-serif';
  const labelWidth = label => Math.max(Array.from(label).length * 24, context ? context.measureText(label).width * 1.25 : 0) + 12;
  const layout = await new ELK().layout({
    id:'root', children:graph.nodes.map(n=>({id:n.id,width:300,height:heights.get(n.id)})),
    edges:graph.edges.map((e,i)=>({id:`edge${i}`,sources:[e.from],targets:[e.to],...(e.label ? {labels:[{text:String(e.label),width:labelWidth(String(e.label)),height:24}]} : {})})),
    layoutOptions:{'elk.algorithm':'layered','elk.direction':directions[direction],'elk.edgeRouting':'ORTHOGONAL','elk.layered.spacing.nodeNodeBetweenLayers':'130','elk.spacing.nodeNode':'32','elk.layered.spacing.edgeEdgeBetweenLayers':'8','elk.spacing.edgeEdge':'8','elk.layered.spacing.edgeNodeBetweenLayers':'24','elk.layered.nodePlacement.strategy':'NETWORK_SIMPLEX','elk.layered.considerModelOrder.strategy':'NODES_AND_EDGES','elk.layered.thoroughness':'12','elk.separateConnectedComponents':'true','elk.spacing.componentComponent':'80','elk.padding':'[top=40,left=40,bottom=40,right=40]'}
  });
  const doc = container.ownerDocument, marker = `floorplan-arrow-${++serial}`;
  const root = svg(doc,'svg',{xmlns:NS,viewBox:`0 0 ${Math.max(layout.width,1)} ${Math.max(layout.height,1)}`,width:Math.max(layout.width,1),height:Math.max(layout.height,1),role:'img','aria-label':'Diagram'});
  const style = svg(doc,'style');
  style.textContent = `.floorplan-card{box-sizing:border-box;width:100%;height:100%;border-radius:20px;background:transparent;padding:16px 18px;display:flex;flex-direction:column;gap:7px;font:13px/19px Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#161616;overflow:hidden}.floorplan-head{display:flex;align-items:center;gap:10px;min-width:0}.floorplan-icon{display:grid;place-items:center;flex:none;width:32px;height:32px;border-radius:10px;background:#e7f3eb;color:#28734a;font-weight:700}.floorplan-title{font-size:15px;line-height:1.3;font-weight:600;letter-spacing:-.015em;min-width:0;overflow-wrap:anywhere;white-space:pre-wrap}.floorplan-description{color:#3f3f3f;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.floorplan-node{cursor:pointer}.floorplan-node:focus-visible .floorplan-card,.floorplan-node.journey-current .floorplan-card{box-shadow:inset 0 0 0 2px #161616}.floorplan-edge{fill:none;stroke:#50555c;stroke-opacity:.5;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.floorplan-edge.journey-edge{stroke:#161616;stroke-opacity:.7;stroke-width:3.5;stroke-dasharray:none}.floorplan-edge-label{font:12px system-ui,sans-serif;fill:#3f3f3f;paint-order:stroke;stroke:#f3f3f1;stroke-width:5px;stroke-linejoin:round}`;
  root.append(style);
  const defs = svg(doc,'defs'), arrow = svg(doc,'marker',{id:marker,markerWidth:8,markerHeight:8,refX:7,refY:4,orient:'auto',markerUnits:'userSpaceOnUse'});
  const shadowId = `floorplan-shadow-${serial}`, shadow = svg(doc,'filter',{id:shadowId,x:'-20%',y:'-35%',width:'140%',height:'180%'});
  shadow.append(svg(doc,'feDropShadow',{dx:0,dy:5,stdDeviation:6,'flood-color':'#000','flood-opacity':0.12})); defs.append(shadow);
  arrow.append(svg(doc,'path',{d:'M0,0 L8,4 L0,8 Z',fill:'#50555c','fill-opacity':0.5})); defs.append(arrow); root.append(defs);
  const edgeLayer = svg(doc,'g',{class:'floorplan-edges'}), nodeLayer = svg(doc,'g',{class:'floorplan-nodes'});
  for (const route of layout.edges || []) {
    const edge = graph.edges[Number(route.id.slice(4))];
    if (!route.sections?.length) throw new Error('ELK returned an edge without a route');
    route.sections.forEach((s,index) => {
      const points=[s.startPoint,...(s.bendPoints||[]),s.endPoint];
      const path=svg(doc,'path',{class:'floorplan-edge',d:roundedPath(points),'data-bigso-edge':'true','data-bigso-from':edge.from,'data-bigso-to':edge.to,'data-bigso-link-index':edge.linkIndex,...(index===route.sections.length-1?{'marker-end':`url(#${marker})`}:{})});
      edgeLayer.append(path);
      if (edge.label && index===0) {
        const placed = route.labels?.[0];
        if (!placed || !Number.isFinite(placed.x) || !Number.isFinite(placed.y)) throw new Error('ELK did not place edge label');
        const label=svg(doc,'text',{class:'floorplan-edge-label',x:placed.x+placed.width/2,y:placed.y+placed.height/2,'text-anchor':'middle','dominant-baseline':'central'}); label.textContent=String(edge.label); edgeLayer.append(label);
      }
    });
  }
  const byId = new Map(graph.nodes.map(n=>[n.id,n]));
  for (const item of layout.children || []) {
    const node=byId.get(item.id), entry=metadata.elements?.[node.id] || {};
    const group=svg(doc,'g',{class:'node floorplan-node',transform:`translate(${item.x},${item.y})`,'data-bigso-id':node.id,'data-bigso-kind':entry.kind || '',tabindex:'0',role:'button','aria-label':String(node.label || node.id)});
    const surface=svg(doc,'rect',{class:'floorplan-card-surface',x:0,y:0,width:item.width,height:item.height,rx:20,fill:'#fff',stroke:'#000','stroke-opacity':0.1,'stroke-width':1,filter:`url(#${shadowId})`});
    const fo=svg(doc,'foreignObject',{x:0,y:0,width:item.width,height:item.height});
    const card=html(doc,'div','floorplan-card'), head=html(doc,'div','floorplan-head');
    const icon=html(doc,'span','floorplan-icon');
    const kind=entry.kind;
    const palette=typeof kind === 'string' && Object.hasOwn(ICONS,kind) ? ICONS[kind] : FALLBACK_ICON;
    icon.style.backgroundColor=palette.fill;
    const glyph=svg(doc,'svg',{viewBox:'-7 -7 14 14',width:22,height:22,'aria-hidden':'true',focusable:'false'});
    const glyphPath=svg(doc,'path',{d:palette.path,fill:'none',stroke:palette.color,'stroke-width':'1.15','stroke-linecap':'round','stroke-linejoin':'round'});
    glyphPath.style.setProperty('fill','none','important');
    glyphPath.style.setProperty('stroke',palette.color,'important');
    glyph.append(glyphPath); icon.append(glyph);
    const title=html(doc,'div','floorplan-title',String(node.label || node.id));
    const desc=html(doc,'div','floorplan-description',String(entry.description || 'No description yet'));
    head.append(icon,title); card.append(head,desc); fo.append(card); group.append(surface,fo); nodeLayer.append(group);
  }
  root.append(edgeLayer,nodeLayer); container.replaceChildren(root); return root;
}
