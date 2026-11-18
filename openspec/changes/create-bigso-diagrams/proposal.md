# Proposal

## Why

Floorplan ya demuestra un flujo eficaz para crear diagramas con agentes: el agente produce JSON estructurado, scripts deterministas lo validan y generan una vista interactiva autocontenida. Sin embargo, su esquema y experiencia se centran deliberadamente en comprender codebases; generalizarlo mezclaría conceptos distintos y diluiría su propósito. Se propone crear un proyecto hermano, provisionalmente **Bigso Diagrams**, que reutilice ese enfoque y mantenga los modelos y renderizadores adecuados para cada tipo de diagrama.

## What Changes

- Crear un proyecto independiente para elaborar diagramas con agentes, con formato versionado, scripts de validación/renderizado deterministas, una skill con flujo tipado y exportación interactiva sin conexión.
- Incluir inicialmente diagramas de flujo/proceso, arquitectura de sistemas, secuencia y entidad-relación (ERD), con una interfaz extensible para sumar tipos después.
- Reutilizar selectivamente patrones de Floorplan: flujo JSON, scripts Node, layout ELK cuando encaje y artefactos HTML/SVG autocontenidos. No forzar conceptos temporales o cardinalidades dentro de un grafo genérico.
- Mantener el producto y repositorio separados. No cambiar el esquema ni el comportamiento de Floorplan en este alcance. Considerar una integración opcional con Floorplan solo después de probar el modelo independiente.
- Preservar avisos y términos de licencia del código reutilizado; antes de publicar, sustituir metadatos e identidad copiados por información correcta de Bigsolabs.

## Capabilities

### New Capabilities
- `diagram-authoring`: Crear, validar, renderizar, actualizar y exportar diagramas tipados desde briefs, especificaciones o contexto de proyecto, mediante skills de agente y scripts deterministas.

### Modified Capabilities
- Ninguna. El producto nuevo es independiente y no cambia requisitos existentes de Floorplan.

## Impact

- **Proyecto destino:** repositorio local independiente en `/home/carlos/bigso-diagrams`; no se crea remoto ni publicación sin confirmación.
- **Referencias de reutilización:** `skills/floorplan/SKILL.md`, `skills/floorplan/workflow.json`, `skills/floorplan/references/schema.md`, `skills/floorplan/scripts/build.mjs` y `skills/floorplan/assets/viewer.html` (incluido su ELK vendorizado). La reutilización es selectiva y requiere atribución/licencia correctas.
- **Contratos nuevos:** documento tipado, diagnósticos de validación, interfaz de layout/renderizador, datos específicos por tipo y exportaciones.
- **Tipos iniciales:** flujo/proceso, arquitectura, secuencia y ERD.
- **Fuera de alcance:** admitir todos los tipos desde la primera versión, ampliar el modelo de Floorplan, requerir un servicio alojado o publicar bajo la marca Floorplan.
