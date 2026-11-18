# Formato del documento v1

Cada diagrama es un archivo JSON editable. La envoltura común requiere `schema`, `type`, `title` y `payload`; `description` es opcional y debe ser no vacía si se incluye. `schema` debe ser exactamente `bigso-diagrams/diagram@1`. El payload es específico del tipo. `schemas/diagram.schema.json` describe la estructura; el validador de ejecución añade comprobaciones semánticas de unicidad y referencias.

Los documentos rechazan campos adicionales en la envoltura y en los payloads. Los IDs deben ser únicos dentro de su colección y solo pueden usar letras ASCII, dígitos, `_`, `-` y `.`. Cada referencia debe apuntar a un elemento existente del mismo diagrama. Las herramientas no interpretan silenciosamente versiones distintas.

## Tipos

- `flowchart`: `payload.nodes` tiene `id`, `label` y `kind` (`start`, `end`, `process`, `decision`); `payload.edges` tiene `from`, `to` y `label` opcional. Etiqueta las salidas de una decisión, por ejemplo `Sí` y `No`.
- `architecture`: `payload.components` tiene `id`, `label` y `kind` (`user`, `application`, `service`, `database`, `external`); `payload.dependencies` expresa las conexiones con `from`, `to` y etiqueta opcional.
- `sequence`: `payload.participants` requiere al menos dos elementos con `id` y `label`; `payload.messages` requiere al menos un mensaje con `from`, `to` y `label`. El orden del array de mensajes es el orden temporal. `kind` puede ser `call`, `async` o `return`.
- `erd`: `payload.entities` contiene entidades con `id`, `label` y `attributes`; cada atributo requiere `name` y `type`, con `primaryKey: true` opcional. `payload.relationships` conecta entidades; `fromCardinality` y `toCardinality` aceptan `one`, `many`, `zero-or-one` y `zero-or-many`. `label` de la relación es opcional.

## Ejemplo mínimo de flujo

```json
{
  "schema": "bigso-diagrams/diagram@1",
  "type": "flowchart",
  "title": "Aprobación",
  "payload": {
    "nodes": [
      { "id": "start", "label": "Iniciar", "kind": "start" },
      { "id": "decision", "label": "¿Aprobado?", "kind": "decision" },
      { "id": "done", "label": "Terminar", "kind": "end" }
    ],
    "edges": [
      { "from": "start", "to": "decision" },
      { "from": "decision", "to": "done", "label": "Sí" }
    ]
  }
}
```

## Ejemplos ejecutables

- `examples/flowchart.json`
- `examples/architecture.json`
- `examples/sequence.json`
- `examples/erd.json`

Validar los ejemplos desde la raíz del proyecto:

```sh
npm run diagrams -- validate examples/flowchart.json
npm run diagrams -- validate examples/architecture.json
npm run diagrams -- validate examples/sequence.json
npm run diagrams -- validate examples/erd.json
```

Para comandos de renderizado, exportación, actualización y códigos de salida, consulta `docs/usage.md`.
