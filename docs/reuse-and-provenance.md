# Procedencia y reutilización

## Alcance revisado

Referencia inspeccionada: repositorio local `bigsolabs/bigso-floorpan`, HEAD `7a3d6a3` (18 de noviembre de 2026). Esta lista distingue patrones de diseño de código y activos distribuidos. No se copió código fuente ni bundle de terceros a Bigso Diagrams.

| Candidato | Procedencia/licencia observada | Uso en este MVP |
|---|---|---|
| Flujo JSON + scripts mecánicos + agente para semántica (`skills/floorplan/workflow.json`, `skills/floorplan/SKILL.md`) | Código del repositorio Floorplan; su `LICENSE` declara MIT y copyright de Hayden Smith | Se adopta el patrón arquitectónico; los archivos y textos se escriben de nuevo, no se copian literalmente. |
| Build y validación (`skills/floorplan/scripts/build.mjs`, `references/schema.md`) | Mismo repositorio MIT | Referencia conceptual para validación explícita y errores accionables; implementación propia. |
| Viewer y layout (`skills/floorplan/assets/viewer.html`, `assets/vendor/elk.bundled.js`) | Viewer del repositorio MIT; el bundle ELK incluye un aviso separado Eclipse Public License 2.0 en `assets/vendor/elkjs-LICENSE.md` | No se copian el viewer ni el bundle ELK al MVP. Se crea una salida SVG y layouts propios; cualquier integración futura de ELK requiere revisión de licencia y avisos. |
| Fuentes Inter y JetBrains Mono vendorizadas por Floorplan | Los avisos incluidos indican SIL Open Font License 1.1 | No se copian ni se incrustan fuentes; se usan fuentes disponibles en el sistema. |
| Plugin manifests y branding de Floorplan | Identifican a Hayden Smith y enlazan a `haydenschmitty/floorplan` | No se copian. Bigso Diagrams tendrá metadatos propios y no presentará a autores upstream como autores del nuevo producto. |

## Reglas del MVP

- Mantener este inventario actualizado si se incorpora cualquier código, font, bundle, imagen o documentación de terceros.
- El código propio de Bigso Diagrams se distribuye bajo MIT, elegido por el usuario; la licencia no cambia obligaciones de activos externos. El repositorio público es `https://github.com/bigsolabs/bigso-diagrams`.
- No redistribuir componentes de Floorplan o terceros sin conservar y revisar sus avisos y condiciones.
- Las referencias a Floorplan en documentación describen procedencia o inspiración, no implican afiliación ni autoría común.
