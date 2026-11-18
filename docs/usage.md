# Uso de Bigso Diagrams

Bigso Diagrams genera diagramas desde documentos JSON tipados o archivos fuente Mermaid. El JSON existente sigue siendo la fuente editable para sus cuatro tipos; Mermaid (`.mmd`) es el primer formato interoperable del rediseño. La exportación se procesa localmente y no requiere un servicio alojado.

## Requisitos e instalación

- Node.js 18 o posterior.
- Instala las dependencias locales con `npm install` (incluye el validador Mermaid y el generador del bundle HTML).
- Clona el repositorio público `https://github.com/bigsolabs/bigso-diagrams` o abre una copia local. El proyecto está licenciado bajo MIT; el paquete npm no está publicado (`private: true`).

Comprueba el proyecto:

```sh
npm test
```

## Tipos JSON existentes

- `flowchart`: procesos, decisiones y ramas etiquetadas.
- `architecture`: usuarios, aplicaciones, servicios, bases de datos, sistemas externos y dependencias.
- `sequence`: participantes y mensajes ordenados temporalmente.
- `erd`: entidades, atributos, claves primarias, relaciones y cardinalidades.

El contrato completo y los ejemplos están en `docs/format.md`, `schemas/diagram.schema.json` y `examples/`. Los layouts son sencillos y deterministas; no sustituyen una herramienta de diagramación general ni optimizan automáticamente grafos grandes.

## Fuente Mermaid (`.mmd`)

El primer adaptador acepta solo las familias versionadas en [`docs/mermaid-support.md`](mermaid-support.md): `flowchart`, `architecture-beta` y `sequenceDiagram`. Esa lista es una matriz de sintaxis probada, no una promesa sobre toda la gramática Mermaid. La arquitectura beta está marcada como tal en la documentación.

```sh
npm run diagrams -- validate examples/architecture.mmd
npm run diagrams -- validate examples/flowchart.mmd
npm run diagrams -- validate examples/sequence.mmd
npm run diagrams -- export examples/architecture.mmd --format html --output output/architecture.html
npm run diagrams -- export examples/flowchart.mmd --format html --output output/flow.html
npm run diagrams -- export examples/sequence.mmd --format html --output output/sequence.html
```

La validación ocurre en Node y devuelve diagnósticos JSON; los errores de sintaxis incluyen línea cuando Mermaid la proporciona. El HTML contiene el bundle local de Mermaid y la fuente escapada, pero no un SVG prerenderizado: ejecuta el renderizado al abrirse en un navegador. No usa CDN ni servicios remotos y su política de contenido bloquea solicitudes de red. Para `.mmd`, `export` admite solo `--format html`; `render` SVG y `update` JSON Patch siguen siendo operaciones del formato JSON. Bigso rechaza configuración/directivas Mermaid y declaraciones `click`; el render usa `securityLevel: 'strict'`.

Si existe un `<nombre>.meta.json` junto al `.mmd`, `validate` y `export` lo descubren automáticamente. También puedes indicar otra ruta con `--metadata`. Bigso valida las referencias a nodos y transiciones antes de exportar; el visor muestra detalles al seleccionar nodos y permite reproducir, pausar y recorrer los journeys resaltando nodos y conexiones. La matriz de sintaxis Mermaid y los límites del visor están en [`docs/mermaid-support.md`](mermaid-support.md) y [`docs/browser-validation.md`](browser-validation.md).

Diagnósticos Mermaid de `validate`:

- `INVALID_SOURCE`: la entrada está vacía o no es texto.
- `MERMAID_PARSE`: Mermaid no reconoce la sintaxis; revisa el mensaje y la línea si se incluye.
- `UNSUPPORTED_DIAGRAM`: el tipo no está en la matriz admitida.
- `UNSUPPORTED_CONFIG`: se encontró frontmatter o una directiva Mermaid; Bigso controla esa configuración.
- `UNSUPPORTED_CALLBACK`: se encontró una declaración `click`, no admitida en el visor local.


## Crear y validar un documento

Copia el ejemplo más cercano o escribe un JSON siguiendo el esquema. Conserva el marcador de esquema `bigso-diagrams/diagram@1`, un `type` admitido y los campos específicos de ese tipo.

```sh
npm run diagrams -- validate examples/flowchart.json
```

El CLI imprime un objeto JSON. En éxito incluye `ok: true`, el tipo y el título; en error incluye diagnósticos con la ruta del campo. La validación comprueba versión, campos, IDs, referencias, tipos y cardinalidades antes de renderizar.

## Renderizar y exportar

Crea primero el directorio de salida. Las rutas se resuelven desde el directorio actual y el directorio padre debe existir.

```sh
mkdir -p output
npm run diagrams -- render examples/flowchart.json --output output/flowchart.svg
npm run diagrams -- export examples/flowchart.json --format svg --output output/flowchart-copy.svg
npm run diagrams -- export examples/flowchart.json --format html --output output/flowchart.html
```

Para JSON, `render` siempre produce SVG; con `--output` lo escribe en un archivo y emite metadatos JSON. `export` requiere `--format html|svg` y `--output`. El SVG es autónomo; el HTML incorpora SVG, CSS y JavaScript, con controles de acercar/alejar, ajuste, arrastre y teclado. No usa scripts, estilos, fuentes ni imágenes remotas, por lo que el artefacto está diseñado para abrirse sin conexión. Para Mermaid, consulta la sección anterior: el renderizado se ejecuta al abrir el HTML y solo se exporta ese formato.

El CLI no permite sobrescribir el archivo editable de entrada al escribir una salida. Mantén fuentes y exportaciones en archivos separados.

## Actualizar un diagrama existente sin descartar contenido

Escribe un array JSON Patch con solo los cambios solicitados. Se admiten `add`, `replace` y `remove`; `replace` y `remove` requieren un destino existente. JSON Pointer usa índices de array estables y `-` para agregar al final.

Ejemplo `changes.json`:

```json
[
  { "op": "replace", "path": "/payload/nodes/2/label", "value": "Enviar factura" }
]
```

Aplica los cambios a un archivo nuevo, no al fuente:

```sh
npm run diagrams -- update examples/flowchart.json --patch changes.json --output output/flowchart.updated.json
npm run diagrams -- validate output/flowchart.updated.json
npm run diagrams -- render output/flowchart.updated.json --output output/flowchart.updated.svg
```

El actualizador aplica solo las rutas explícitas, valida el resultado y deja intacto el documento fuente. Revisa el JSON actualizado y renderízalo antes de reemplazar manualmente una versión anterior.

## Códigos de salida

- `0`: operación correcta.
- `1`: documento inválido o actualización que no se puede aplicar/validar.
- `2`: comando u opciones de uso incorrectos.
- `3`: error al leer o escribir archivos.

Los diagnósticos se devuelven como JSON en stdout; usa el código de salida para automatizar el resultado.

## Flujo local con Claude Code o Codex

El agente mantiene la conversación; Bigso solo valida y exporta localmente. Las skills equivalentes viven en `.claude/skills/bigso-diagrams/SKILL.md` y `.agents/skills/bigso-diagrams/SKILL.md`.

- Para ver patrones completos de arquitectura y flujos con microservicios, revisa `examples/architecture.mmd` con `examples/architecture.meta.json`, y `examples/flowchart.mmd` con `examples/flowchart.meta.json`.
- Al pedir un diagrama nuevo, solicita que el agente aclare decisiones que cambien materialmente el significado, use IDs Mermaid estables, mantenga los detalles/recorridos en el sidecar y presente diagnósticos, diff y preview.
- Al modificar uno existente, indica qué cambiar y qué conservar. El agente debe editar solo las líneas y referencias necesarias, no reemplazar archivos enteros; renombrar o quitar IDs requiere actualizar referencias o preguntar si la correspondencia no está clara.

Prompt de ejemplo:

```text
Crea una arquitectura Mermaid para el sistema de pedidos, con cliente web,
gateway, servicio de pedidos, inventario y pagos. Pregunta antes de asumir
si hay decisiones que cambien el significado. Guarda el grafo en
examples/orders.mmd y detalles/recorridos en examples/orders.meta.json.
Valida ambos, exporta el HTML offline a output/orders.html y muéstrame el diff,
los diagnósticos y la ruta de preview. No sobrescribas archivos existentes.
```

Para modificar un archivo existente:

```text
En examples/flowchart.mmd y su sidecar, agrega una rama de reintento de pago.
Conserva IDs, ramas y anotaciones ajenos al cambio; si un ID debe renombrarse,
actualiza sus referencias o pregúntame si el mapeo no es inequívoco. Valida,
exporta a una ruta nueva y presenta diff, diagnósticos y preview.
```

Los comandos manuales equivalentes están en [`docs/sidecar-format.md`](sidecar-format.md). La validación y exportación usan el CLI local y no envían datos a un servicio remoto.

## Skills de agentes

- Claude Code: `.claude/skills/bigso-diagrams/SKILL.md`
- Codex: `.agents/skills/bigso-diagrams/SKILL.md`

Ambas guían al agente para preguntar ante ambigüedades materiales, crear/actualizar `.mmd` y `.meta.json`, preservar cambios ajenos, validar referencias y mostrar diff/diagnósticos/preview. `test/skills.test.mjs` verifica que ambas skills describan el mismo flujo soportado. En el entorno de desarrollo de esta entrega no estaban instalados los binarios `claude` ni `codex`, así que no se ejecutó una conversación real de esos clientes; se validaron por separado las skills, el CLI, el sidecar y el visor.

## Limitaciones y estado

Este es un prototipo en desarrollo, no un paquete npm publicado. El código propio del proyecto se distribuye bajo MIT; el MVP solo admite los cuatro tipos anteriores, usa layouts propios básicos, no contiene editor visual ni colaboración, y no integra un modelo o servicio remoto. El inventario de procedencia está en `docs/reuse-and-provenance.md`.
