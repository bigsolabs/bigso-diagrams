# Procedencia y reutilización

## Alcance revisado

Referencia original inspeccionada: `bigsolabs/bigso-floorpan`, HEAD `7a3d6a3` (18 de noviembre de 2026). Posteriormente se revisó [Floorplan upstream](https://github.com/haydenschmitty/floorplan/tree/94f81b463b7617e06d873ac71323ce71644c8399), commit `94f81b463b7617e06d873ac71323ce71644c8399`. El visor adapta CSS de Floorplan bajo MIT y elementos de su canvas; su aviso completo está en `third-party/floorplan/LICENSE` y en los HTML exportados. Se incluye elkjs; no se incorporan fuentes, marca ni imágenes de Floorplan.

| Candidato | Procedencia/licencia observada | Uso en este MVP |
|---|---|---|
| Flujo JSON + scripts mecánicos + agente para semántica (`skills/floorplan/workflow.json`, `skills/floorplan/SKILL.md`) | Código del repositorio Floorplan; su `LICENSE` declara MIT y copyright de Hayden Smith | Se adopta el patrón arquitectónico; los archivos y textos se escriben de nuevo, no se copian literalmente. |
| Build y validación (`skills/floorplan/scripts/build.mjs`, `references/schema.md`) | Mismo repositorio MIT | Referencia conceptual para validación explícita y errores accionables; implementación propia. |
| Viewer y layout (`skills/floorplan/assets/viewer.html`, `assets/vendor/elk.bundled.js`) | Viewer MIT; elkjs tiene avisos propios EPL-2.0 y Apache-2.0 | Se adaptan estilos y el canvas de Floorplan (`src/adapters/floorplan-canvas.mjs`); elkjs se incorpora en `src/adapters/floorplan-canvas-elk.mjs`. Mermaid valida y renderiza diagramas no compatibles con ese canvas. |
| Fuentes Inter y JetBrains Mono vendorizadas por Floorplan | Los avisos incluidos indican SIL Open Font License 1.1 | No se copian ni se incrustan fuentes; se usan fuentes disponibles en el sistema. |
| Plugin manifests y branding de Floorplan | Identifican a Hayden Smith y enlazan a `haydenschmitty/floorplan` | No se copian. Bigso Diagrams tendrá metadatos propios y no presentará a autores upstream como autores del nuevo producto. |
| Mermaid `11.17.2` y KaTeX `0.18.10` (override fijado) | Los metadatos npm declaran MIT para ambos paquetes | Mermaid valida la fuente y se incluye en un bundle browser-side; se conserva el texto de licencia en el bundle. KaTeX se fija a la versión corregida para evitar la dependencia vulnerable anterior. |
| jsdom `22.1.0` | MIT; compatible con Node `>=16` según metadatos npm | Proporciona un DOM aislado para ejecutar la API de parseo de Mermaid en el CLI Node sin habilitar ejecución de scripts ni solicitudes de red. |
| esbuild `0.28.2` | Los metadatos npm declaran MIT | Dependencia local para generar el bundle Mermaid al exportar; el artefacto no descarga Chromium ni usa recursos remotos. |

## ELK: código y avisos

Se distribuye `elkjs` **0.9.3**, con Eclipse Public License 2.0 (EPL-2.0) y código de Google bajo Apache-2.0; los textos completos y detalles están en `third-party/elkjs/`. El bundle coincide con `lib/elk.bundled.js` del [paquete npm 0.9.3](https://registry.npmjs.org/elkjs/-/elkjs-0.9.3.tgz), salvo `export default globalThis.ELK;` añadido al final. El `gitHead` del paquete identifica [elkjs a8304cf79fde75bc2ab1a89d28320f53f8637436](https://github.com/kieler/elkjs/tree/a8304cf79fde75bc2ab1a89d28320f53f8637436). Su compilación utiliza también [Eclipse ELK](https://github.com/eclipse-elk/elk); **no se ha verificado la revisión exacta de ELK**. No se encontró un archivo NOTICE separado en el paquete npm ni en el árbol de elkjs de ese commit.

Los HTML exportados incluyen los textos EPL-2.0, Apache-2.0 y MIT, avisos y referencias de código fuente sin solicitudes de red. Antes de distribuir, hay que garantizar que los destinatarios puedan obtener el código fuente correspondiente y sus modificaciones: la URL del proyecto no demuestra que esta versión sin commit esté publicada y la revisión exacta de ELK sigue sin identificarse. No se afirma aquí cumplimiento completo de licencia.

## Reglas del MVP

- Mantener este inventario actualizado si se incorpora cualquier código, font, bundle, imagen o documentación de terceros.
- El código propio de Bigso Diagrams se distribuye bajo MIT, elegido por el usuario; la licencia no cambia obligaciones de activos externos. El repositorio público es `https://github.com/bigsolabs/bigso-diagrams`.
- No redistribuir componentes de Floorplan o terceros sin conservar y revisar sus avisos y condiciones.
- Las referencias a Floorplan en documentación describen procedencia o inspiración, no implican afiliación ni autoría común.
