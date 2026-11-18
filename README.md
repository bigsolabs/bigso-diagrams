# Bigso Diagrams

Bigso Diagrams es un proyecto local-first para crear diagramas con ayuda de agentes y exportar vistas portátiles. El JSON existente sigue siendo editable y compatible; Mermaid (`.mmd`) es el primer formato fuente del rediseño. El visor HTML integra Mermaid localmente y no requiere un servicio remoto.

**Estado:** prototipo en desarrollo, publicado como código abierto bajo MIT en [github.com/bigsolabs/bigso-diagrams](https://github.com/bigsolabs/bigso-diagrams). El nombre de producto puede evolucionar. No se ha publicado un paquete npm (`private: true`).

## Tipos JSON existentes

- Flujo y proceso (`flowchart`)
- Arquitectura de sistemas (`architecture`)
- Secuencia (`sequence`)
- Entidad-relación (`erd`)

## Requisitos y prueba

Node.js 18 o posterior. Desde la raíz:

```sh
npm test
npm run diagrams -- validate examples/flowchart.json
```

## Uso rápido

```sh
mkdir -p output
npm run diagrams -- render examples/flowchart.json --output output/flowchart.svg
npm run diagrams -- export examples/flowchart.json --format html --output output/flowchart.html
```

El HTML JSON incluye sus recursos y controles de zoom/arrastre. Para Mermaid, la fuente se valida en CLI y el HTML exportado contiene el bundle local: el SVG se renderiza al abrir el archivo en un navegador, sin conexión de red.

```sh
npm run diagrams -- validate examples/flowchart.mmd
npm run diagrams -- export examples/flowchart.mmd --format html --output output/flowchart-mermaid.html
```

La primera matriz admitida y sus límites están en [docs/mermaid-support.md](docs/mermaid-support.md). El CLI no permite sobrescribir el archivo fuente.

Para editar JSON sin perder contenido no relacionado, genera un archivo JSON Patch y aplica la actualización a un archivo nuevo:

```sh
npm run diagrams -- update examples/flowchart.json --patch changes.json --output output/flowchart.updated.json
```

## Documentación

- [Guía de uso, CLI y exportación](docs/usage.md)
- [Formato JSON v1 y ejemplos](docs/format.md)
- [Sintaxis Mermaid admitida](docs/mermaid-support.md)
- [Formato del sidecar Mermaid](docs/sidecar-format.md)
- [Validación del visor y soporte de navegador](docs/browser-validation.md)
- [Prototipo de resize de nodos](docs/node-resize-poc.md)
- [Procedencia y licencias](docs/reuse-and-provenance.md)
- Skills: Claude Code en `.claude/skills/bigso-diagrams/`; Codex en `.agents/skills/bigso-diagrams/`.

El código fuente de este proyecto se distribuye bajo MIT. No se han copiado bundles ni fuentes de terceros de Floorplan; revisa `docs/reuse-and-provenance.md` antes de incorporar otros activos.
