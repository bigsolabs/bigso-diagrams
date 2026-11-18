# Proposal

## Why

El prototipo actual usa un formato JSON propio y un renderer básico; las pruebas mostraron diagramas planos y con solapamientos, sin la interacción rica que el producto necesita. El rediseño posiciona Bigso como un espacio de diseño de soluciones asistido por agentes, con Mermaid como primer formato interoperable y un visor propio como diferenciador, en vez de competir creando otro lenguaje genérico de diagramas.

## What Changes

- Introducir importación y visualización de archivos Mermaid (`.mmd`) como primer formato de autoría y renderizado.
- Añadir un visor local, autocontenido e interactivo para explorar componentes y reproducir flujos funcionales paso a paso, con foco, resaltado y animación de rutas.
- Añadir metadatos auxiliares para detalles y recorridos interactivos que Mermaid no expresa; referenciar identificadores del diagrama y validar que sigan existiendo.
- Adaptar los flujos de agentes existentes para que, desde Claude Code, Codex u otro agente compatible, creen y actualicen los archivos fuente, refresquen la vista y presenten cambios revisables.
- Diseñar una frontera de adaptadores para poder evaluar otros formatos existentes posteriormente; no crear un lenguaje Bigso ni añadir un segundo formato en esta fase.
- Dejar la conversación integrada dentro de la app para una fase futura; la primera experiencia conversacional ocurre en los clientes de agentes ya soportados.
- Mantener durante la transición el formato JSON y los comandos existentes; su retirada o conversión automática no forma parte de este cambio.

## Capabilities

### New Capabilities

- `interactive-diagram-viewer`: Importar Mermaid y explorar diagramas mediante un visor interactivo, accesible y portable.
- `agent-assisted-design`: Crear y mantener archivos de diseño y recorridos interactivos desde conversaciones con agentes, con validación y revisión de cambios.

### Modified Capabilities

Ninguna. El inventario principal de OpenSpec no contiene capacidades publicadas; las capacidades iniciales están en el cambio ya completado `create-bigso-diagrams`.

## Impact

- Afecta el renderer y la exportación HTML actuales, la CLI, las skills de agente, la documentación, ejemplos y pruebas.
- Añade Mermaid como dependencia de renderizado; su licencia, versión compatible, seguridad y funcionamiento sin red deberán verificarse antes de incorporarla.
- Mantiene el procesamiento local-first, las exportaciones sin conexión, MIT para el código propio y la compatibilidad del CLI JSON durante la transición.
- No requiere ni introduce backend alojado, chat propio, publicación npm ni cambios en Floorplan.
