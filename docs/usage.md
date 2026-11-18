# Uso de Bigso Diagrams

Bigso Diagrams genera diagramas desde documentos JSON tipados. El JSON es la fuente editable; los artefactos SVG y HTML se regeneran desde ese documento. El procesamiento es local y no requiere un servicio alojado.

## Requisitos e instalación

- Node.js 18 o posterior.
- Sin dependencias de runtime ni paso de compilación.
- Clona el repositorio público `https://github.com/bigsolabs/bigso-diagrams` o abre una copia local. El proyecto está licenciado bajo MIT; el paquete npm no está publicado (`private: true`).

Comprueba el proyecto:

```sh
npm test
```

## Tipos admitidos

- `flowchart`: procesos, decisiones y ramas etiquetadas.
- `architecture`: usuarios, aplicaciones, servicios, bases de datos, sistemas externos y dependencias.
- `sequence`: participantes y mensajes ordenados temporalmente.
- `erd`: entidades, atributos, claves primarias, relaciones y cardinalidades.

El contrato completo y los ejemplos están en `docs/format.md`, `schemas/diagram.schema.json` y `examples/`. Los layouts son sencillos y deterministas; no sustituyen una herramienta de diagramación general ni optimizan automáticamente grafos grandes.

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

`render` siempre produce SVG; con `--output` lo escribe en un archivo y emite metadatos JSON. `export` requiere `--format html|svg` y `--output`. El SVG es autónomo; el HTML incorpora SVG, CSS y JavaScript, con controles de acercar/alejar, ajuste, arrastre y teclado. No usa scripts, estilos, fuentes ni imágenes remotas, por lo que el artefacto está diseñado para abrirse sin conexión.

El CLI no permite sobrescribir el propio documento JSON de entrada al escribir una salida. Mantén fuentes y exportaciones en archivos separados.

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

## Skills de agentes

- Claude Code: `.claude/skills/bigso-diagrams/SKILL.md`
- Codex: `.agents/skills/bigso-diagrams/SKILL.md`

Ambas guían al agente para pedir aclaraciones ante ambigüedades materiales, reconocer tipos no admitidos, crear documentos válidos y actualizar con cambios mínimos. Los scripts validan y renderizan de forma determinista; no se necesita un modelo para ejecutarlos.

## Limitaciones y estado

Este es un prototipo en desarrollo, no un paquete npm publicado. El código propio del proyecto se distribuye bajo MIT; el MVP solo admite los cuatro tipos anteriores, usa layouts propios básicos, no contiene editor visual ni colaboración, y no integra un modelo o servicio remoto. El inventario de procedencia está en `docs/reuse-and-provenance.md`.
