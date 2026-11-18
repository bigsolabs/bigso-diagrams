import { createHash } from 'node:crypto';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const browserEntry = fileURLToPath(new URL('./adapters/mermaid-browser.mjs', import.meta.url));
let browserBundle;

async function getBrowserBundle() {
  browserBundle ??= build({
    entryPoints: [browserEntry],
    bundle: true,
    minify: true,
    legalComments: 'inline',
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    write: false,
  }).then((result) => result.outputFiles[0].text.replaceAll('</script', '<\\/script'));
  return browserBundle;
}

function safeJson(value) {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function scriptHash(script) {
  return `'sha256-${createHash('sha256').update(script).digest('base64')}'`;
}

const CSS = `:root{color-scheme:light dark;font:15px/1.5 system-ui,sans-serif;background:#f4f7fb;color:#162033}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;grid-template-rows:auto auto 1fr}.toolbar{display:flex;align-items:center;gap:.55rem;padding:.65rem 1rem;background:#fff;border-bottom:1px solid #dbe2ec}.toolbar h1{font-size:1rem;font-weight:650;margin:0 auto 0 0}.toolbar button{min-width:44px;min-height:44px;border:1px solid #b9c5d4;border-radius:9px;background:#fff;color:#162033;font:inherit;cursor:pointer}.toolbar button:hover{background:#eef3fa}.toolbar button:focus-visible{outline:3px solid #2868c7;outline-offset:2px}.status{padding:.35rem 1rem;font-size:.85rem;color:#48566b;background:#f4f7fb}.status[data-state=error]{color:#a31926;background:#fff0f0}.viewport{position:relative;overflow:hidden;min-height:0;touch-action:none;cursor:grab;background-color:#f8faff;background-image:radial-gradient(#cbd5e1 1px,transparent 1px);background-size:20px 20px}.viewport.dragging{cursor:grabbing}#diagram{position:absolute;inset:0}.viewport svg{display:block;max-width:none;transform-origin:0 0;user-select:none}.viewport [data-bigso-id]{cursor:pointer}.viewport [data-bigso-id]:focus-visible{outline:3px solid #2868c7;outline-offset:3px}.hint{position:absolute;right:1rem;bottom:.75rem;padding:.35rem .6rem;border-radius:7px;background:#fff;color:#46536a;font-size:.8rem;box-shadow:0 1px 5px #17203322;pointer-events:none}.details{position:fixed;z-index:2;right:1rem;top:5.5rem;width:300px;height:340px;min-width:220px;min-height:180px;max-width:60vw;max-height:calc(100vh - 6.5rem);resize:both;overflow:auto;padding:.85rem;border:1px solid #cbd5e1;border-radius:12px;background:#fff;box-shadow:0 8px 28px #17203322}.details h2{margin:0 0 .35rem;font-size:1rem}.details p{margin:.3rem 0 .75rem}.details select,.details button{min-height:38px;font:inherit}.journey-controls{display:flex;flex-wrap:wrap;gap:.4rem;margin:.5rem 0}.journey-controls button{padding:.3rem .6rem;border:1px solid #b9c5d4;border-radius:7px;background:#fff;color:#162033}.journey-list{padding-left:1.3rem}.journey-current{filter:drop-shadow(0 0 6px #e18b00);animation:bigso-pulse .9s ease-in-out infinite alternate}.journey-edge{stroke:#e18b00!important;stroke-width:4px!important;stroke-dasharray:8 5!important;animation:bigso-flow .8s linear infinite}@keyframes bigso-pulse{to{opacity:.55}}@keyframes bigso-flow{to{stroke-dashoffset:-13}}@media(prefers-color-scheme:dark){.details{background:#182235;color:#eef2f8;border-color:#53627a}.journey-controls button{background:#222f45;color:#eef2f8;border-color:#53627a}}@media(prefers-color-scheme:dark){:root{background:#111827;color:#eef2f8}.toolbar{background:#182235;border-color:#344158}.toolbar button,.hint{background:#222f45;color:#eef2f8;border-color:#53627a}.status{background:#182235;color:#c7d3e3}.status[data-state=error]{color:#ffc4c4;background:#3b1e29}.viewport{background-color:#151f30;background-image:radial-gradient(#3b4b64 1px,transparent 1px)}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}`;

function viewerScript(source, supportedType, metadata, graph) {
  return `(()=>{const source=${safeJson(source)},metadata=${safeJson(metadata)},graph=${safeJson(graph)},type=${safeJson(supportedType)},id='bigso-diagram';const stage=document.getElementById('diagram'),status=document.getElementById('status'),viewport=document.getElementById('viewport'),detailTitle=document.getElementById('detail-title'),detailDescription=document.getElementById('detail-description'),detailAnnotations=document.getElementById('detail-annotations'),journeySelect=document.getElementById('journey-select'),journeyTitle=document.getElementById('journey-title'),journeyDescription=document.getElementById('journey-description'),journeyProgress=document.getElementById('journey-progress');let scale=1,x=0,y=0,drag=null,journey=null,stepIndex=0,playTimer=null;const svg=()=>stage.querySelector('svg');const update=()=>{const el=svg();if(el)el.style.transform='translate('+x+'px,'+y+'px) scale('+scale+')'};const fit=()=>{const el=svg();if(!el)return;const box=el.viewBox.baseVal,r=viewport.getBoundingClientRect();if(!box.width||!box.height)return;scale=Math.min((r.width-48)/box.width,(r.height-48)/box.height,1);x=(r.width-box.width*scale)/2-box.x*scale;y=(r.height-box.height*scale)/2-box.y*scale;update()};const zoom=factor=>{scale=Math.max(.15,Math.min(5,scale*factor));update()};const clearJourney=()=>{stage.querySelectorAll('.journey-current,.journey-edge').forEach(el=>el.classList.remove('journey-current','journey-edge'))};const showElement=element=>{if(!element)return;const id=element.getAttribute('data-bigso-id');if(!id)return;detailTitle.textContent=id;const entry=metadata.elements?.[id]||{};detailDescription.textContent=entry.description||'No hay descripción adicional.';detailAnnotations.replaceChildren(...(entry.annotations||[]).map(text=>{const li=document.createElement('li');li.textContent=text;return li}))};const showStep=index=>{if(!journey?.steps?.length)return;stepIndex=(index+journey.steps.length)%journey.steps.length;const step=journey.steps[stepIndex],transition=step.transition;clearJourney();journeyTitle.textContent=step.title;journeyDescription.textContent=step.description||'';journeyProgress.textContent=(stepIndex+1)+' / '+journey.steps.length;stage.querySelectorAll('[data-bigso-id]').forEach(el=>{if(el.getAttribute('data-bigso-id')===transition.from||el.getAttribute('data-bigso-id')===transition.to)el.classList.add('journey-current')});stage.querySelectorAll('[data-bigso-from][data-bigso-to]').forEach(el=>{if(el.getAttribute('data-bigso-from')===transition.from&&el.getAttribute('data-bigso-to')===transition.to&&(transition.linkIndex===undefined||el.getAttribute('data-bigso-link-index')===String(transition.linkIndex)))el.classList.add('journey-edge')})};const stopPlayback=()=>{if(playTimer){clearInterval(playTimer);playTimer=null}document.getElementById('journey-play').textContent='Reproducir'};const setupWorkspace=()=>{stage.addEventListener('click',e=>showElement(e.target.closest('[data-bigso-id]')));stage.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-bigso-id]')){e.preventDefault();showElement(e.target.closest('[data-bigso-id]'))}});const journeys=metadata.journeys||[];journeys.forEach((item,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=item.title;journeySelect.append(option)});const chooseJourney=()=>{stopPlayback();journey=journeys[Number(journeySelect.value)]||null;if(!journey)return;journeyTitle.textContent=journey.title;journeyDescription.textContent=journey.description||'';showStep(0)};journeySelect.addEventListener('change',chooseJourney);document.getElementById('journey-prev').addEventListener('click',()=>showStep(stepIndex-1));document.getElementById('journey-next').addEventListener('click',()=>showStep(stepIndex+1));document.getElementById('journey-play').addEventListener('click',()=>{if(playTimer){stopPlayback();return}if(!journey)return;document.getElementById('journey-play').textContent='Pausar';playTimer=setInterval(()=>{if(stepIndex>=journey.steps.length-1){stopPlayback();return}showStep(stepIndex+1)},1200)});if(journeys.length){journey=journeys[0];chooseJourney()}else{journeySelect.disabled=true;document.getElementById('journey-play').disabled=true;document.getElementById('journey-prev').disabled=true;document.getElementById('journey-next').disabled=true}};document.querySelector('[data-action="in"]').addEventListener('click',()=>zoom(1.2));document.querySelector('[data-action="out"]').addEventListener('click',()=>zoom(1/1.2));document.querySelector('[data-action="fit"]').addEventListener('click',fit);viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,ox:x,oy:y,id:e.pointerId};viewport.setPointerCapture(e.pointerId);viewport.classList.add('dragging')});viewport.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;x=drag.ox+e.clientX-drag.x;y=drag.oy+e.clientY-drag.y;update()});const stop=e=>{if(drag&&e.pointerId===drag.id){drag=null;viewport.classList.remove('dragging')}};viewport.addEventListener('pointerup',stop);viewport.addEventListener('pointercancel',stop);window.addEventListener('resize',fit);window.addEventListener('keydown',e=>{if(e.key==='+'||e.key==='=')zoom(1.2);else if(e.key==='-')zoom(1/1.2);else if(e.key==='0')fit()});window.BigsoMermaid.render(stage,source,type,id,graph).then(()=>{status.textContent='Diagrama listo';status.dataset.state='ready';fit();setupWorkspace()}).catch(error=>{status.textContent='No se pudo renderizar Mermaid: '+String(error.message||error);status.dataset.state='error';stage.replaceChildren()})})();`;

}

export async function exportMermaidHtml(source, supportedType, metadata = {}, graph = { edges: [] }) {
  const bundle = await getBrowserBundle();
  const bundleScript = `(()=>{${bundle}})();`;
  const controlsScript = viewerScript(source, supportedType, metadata, graph);
  const csp = [
    "default-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "object-src 'none'",
    "connect-src 'none'",
    "img-src data:",
    "font-src data:",
    `script-src ${scriptHash(bundleScript)} ${scriptHash(controlsScript)}`,
    "style-src 'unsafe-inline'",
  ].join('; ');
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<title>Bigso Diagrams</title>
<style>${CSS}</style>
</head>
<body>
<header class="toolbar"><h1>Bigso Diagrams</h1><button type="button" data-action="out" aria-label="Alejar" title="Alejar">−</button><button type="button" data-action="in" aria-label="Acercar" title="Acercar">+</button><button type="button" data-action="fit" aria-label="Ajustar" title="Ajustar al área">Ajustar</button></header>
<div class="status" id="status" role="status" aria-live="polite" data-state="loading">Renderizando diagrama…</div>
<main class="viewport" id="viewport" aria-label="Lienzo del diagrama"><div id="diagram"></div><span class="hint">Arrastra para mover · +/− para zoom · 0 para ajustar</span></main>
<aside class="details" aria-label="Detalles del elemento y recorridos"><section aria-labelledby="detail-title"><h2 id="detail-title">Selecciona un elemento</h2><p id="detail-description">Sus detalles aparecerán aquí.</p><ul id="detail-annotations"></ul></section><hr><section aria-label="Recorridos funcionales"><label for="journey-select">Recorrido</label><select id="journey-select"></select><h2 id="journey-title">Sin recorrido seleccionado</h2><p id="journey-description"></p><p id="journey-progress" aria-live="polite"></p><div class="journey-controls"><button id="journey-prev" type="button">Anterior</button><button id="journey-play" type="button">Reproducir</button><button id="journey-next" type="button">Siguiente</button></div></section></aside>
<script>${bundleScript}</script>
<script>${controlsScript}</script>
</body>
</html>
`;
}
