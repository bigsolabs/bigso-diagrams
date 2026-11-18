# Sidecar de metadatos Mermaid v1

Un sidecar `.meta.json` complementa la fuente `.mmd`; nunca vuelve a declarar nodos, conexiones, participantes ni mensajes. El marcador de versión es `bigso-diagrams/sidecar@1`. La estructura normativa está en `schemas/diagram-sidecar.schema.json` y la validación ejecutable en `src/sidecar.mjs`.

## Estructura

- `elements`: objeto opcional cuyas claves son IDs semánticos existentes en Mermaid. Cada valor contiene `description`, `annotations` o ambos.
- `journeys`: lista opcional de recorridos. Cada recorrido tiene ID, título, descripción opcional y pasos ordenados.
- Cada paso tiene un ID propio, título, descripción opcional y `transition` con `from`/`to` que apuntan a los IDs Mermaid. `linkIndex` opcional (base cero) desambigua conexiones paralelas entre el mismo par de nodos.
- No se permiten claves desconocidas; así el agente no puede volver a codificar accidentalmente el grafo en el sidecar.

## Ejemplo

`examples/flowchart.meta.json` describe detalles y dos recorridos — pedido disponible y pedido rechazado — sobre los nodos/relaciones de `examples/flowchart.mmd`. La fuente del grafo sigue siendo Mermaid.

```sh
npm run diagrams -- validate examples/flowchart.mmd --metadata examples/flowchart.meta.json
npm run diagrams -- export examples/flowchart.mmd --format html --output output/flowchart.html --metadata examples/flowchart.meta.json
```

Si se omite `--metadata`, el CLI puede descubrir el sidecar con el nombre hermano `<nombre>.meta.json`; se puede pasar una ruta explícita para otra ubicación. Las referencias a IDs y transiciones se validan contra el Mermaid correspondiente antes de presentar o exportar el recorrido. Las claves y el esquema tienen versión para permitir una migración compatible posterior.
