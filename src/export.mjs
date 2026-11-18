import { escapeXml } from './render/svg.mjs';
import { renderDiagram } from './render/index.mjs';

export function exportSvg(document) {
  return renderDiagram(document);
}

export function exportHtml(document) {
  const svg = renderDiagram(document);
  const title = escapeXml(document.title);
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Bigso Diagrams</title>
<style>
:root{color-scheme:light dark;font-family:system-ui,sans-serif;background:#f2f5fa;color:#172033}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;grid-template-rows:auto 1fr}.toolbar{display:flex;align-items:center;gap:.5rem;padding:.65rem 1rem;background:#fff;border-bottom:1px solid #d7deea}.toolbar h1{font-size:1rem;margin:0 auto 0 0}.toolbar button{min-width:44px;min-height:44px;border:1px solid #b8c4d5;border-radius:8px;background:#fff;color:#172033;font:inherit;cursor:pointer}.toolbar button:focus-visible{outline:3px solid #3979d6;outline-offset:2px}.viewport{overflow:hidden;position:relative;touch-action:none;cursor:grab;background-color:#f8faff;background-image:radial-gradient(#c9d3e2 1px,transparent 1px);background-size:20px 20px}.viewport.dragging{cursor:grabbing}.viewport svg{display:block;max-width:none;transform-origin:0 0;user-select:none}.hint{position:absolute;right:1rem;bottom:.75rem;padding:.35rem .6rem;border-radius:6px;background:#fff;color:#46536a;font-size:.8rem;box-shadow:0 1px 5px #17203322}
@media(prefers-color-scheme:dark){:root{background:#111827;color:#eef2f8}.toolbar{background:#182235;border-color:#344158}.toolbar button,.hint{background:#222f45;color:#eef2f8;border-color:#53627a}.viewport{background-color:#151f30;background-image:radial-gradient(#3b4b64 1px,transparent 1px)}}
</style>
</head>
<body>
<header class="toolbar"><h1>${title}</h1><button type="button" data-action="in" aria-label="Acercar" title="Acercar">+</button><button type="button" data-action="out" aria-label="Alejar" title="Alejar">−</button><button type="button" data-action="fit" aria-label="Ajustar" title="Ajustar al área">Ajustar</button></header>
<main class="viewport" aria-label="Lienzo del diagrama">${svg}<span class="hint">Arrastra para mover · +/− para zoom</span></main>
<script>
(()=>{const v=document.querySelector('.viewport'),s=v.querySelector('svg');let z=1,x=0,y=0,drag=null;const update=()=>{s.style.transform='translate('+x+'px,'+y+'px) scale('+z+')'};const fit=()=>{const r=v.getBoundingClientRect(),w=Number(s.getAttribute('width')),h=Number(s.getAttribute('height'));z=Math.min((r.width-40)/w,(r.height-40)/h,1);x=(r.width-w*z)/2;y=(r.height-h*z)/2;update()};document.querySelector('[data-action="in"]').addEventListener('click',()=>{z=Math.min(z*1.2,4);update()});document.querySelector('[data-action="out"]').addEventListener('click',()=>{z=Math.max(z/1.2,.2);update()});document.querySelector('[data-action="fit"]').addEventListener('click',fit);v.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,ox:x,oy:y,id:e.pointerId};v.setPointerCapture(e.pointerId);v.classList.add('dragging')});v.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;x=drag.ox+e.clientX-drag.x;y=drag.oy+e.clientY-drag.y;update()});const stop=e=>{if(drag&&e.pointerId===drag.id){drag=null;v.classList.remove('dragging')}};v.addEventListener('pointerup',stop);v.addEventListener('pointercancel',stop);window.addEventListener('resize',fit);window.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='='){z=Math.min(z*1.2,4);update()}else if(e.key==='-'){z=Math.max(z/1.2,.2);update()}else if(e.key==='0')fit()});fit()})();
</script>
</body>
</html>
`;
}
