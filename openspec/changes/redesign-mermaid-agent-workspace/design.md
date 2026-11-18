# Design

## Context

Ver `proposal.md` para motivación y alcance, y las especificaciones de `interactive-diagram-viewer` y `agent-assisted-design` para el contrato observable. Hoy la CLI trabaja con documentos JSON propios (`src/validate.mjs`) y cuatro renderers (`src/render/`); la exportación HTML solo añade zoom, ajuste y desplazamiento (`src/export.mjs`). El README ya describe skills para Claude Code y Codex, y el proyecto es local-first.

## Goals / Non-Goals

**Goals:**
- Hacer de Mermaid el primer formato fuente de los diagramas nuevos sin borrar el formato JSON existente.
- Separar la semántica gráfica fuente de los metadatos de presentación y recorrido.
- Proporcionar una vista clara, animada y usable por teclado, junto con una ruta de autoría compatible con agentes existentes.
- Mantener renderizado reproducible, archivos editables, exportación offline y ausencia de un servicio alojado de Bigso.
- Dejar un punto de extensión para formatos futuros sin construir una sintaxis propietaria ni implementar varios adaptadores de una vez.

**Non-Goals:**
- Crear un lenguaje de diagramas Bigso o una representación intermedia que pretenda normalizar toda semántica de Mermaid y otros formatos.
- Añadir una app web con chat propio, backend de modelos, cuentas o colaboración remota en esta fase.
- Migrar o eliminar automáticamente los JSON actuales, cambiar Floorplan o publicar el paquete npm.
- Prometer compatibilidad con toda sintaxis Mermaid o con todas las formas de diagrama desde la primera entrega.
- Permitir que el agente cambie silenciosamente la fuente mientras el usuario manipula la vista.

## Decisions

### 1. Mermaid es fuente del grafo en la primera entrega

Los archivos `.mmd` son la fuente editable de nodos, conexiones, grupos y secuencia que el tipo Mermaid represente. La CLI valida la sintaxis en Node con la API de parseo de Mermaid; el visor y la exportación HTML autocontenida renderizan en el navegador con un bundle Mermaid generado desde la dependencia instalada. Así se conserva el soporte Node 18 y no se exige instalar Puppeteer/Chromium para crear el artefacto. Se fija una versión compatible y se prueban las sintaxis admitidas con fixtures; la extensión a otro formato se decide por un caso de uso real.

**Alternativas:** seguir ampliando el formato/renderer propio (descartado como dirección principal por duplicar el alcance de Mermaid); convertir cualquier fuente a un modelo universal interno (descartado porque puede perder semánticas y crear otra sintaxis de Bigso); soportar varios formatos desde el día uno (descartado por coste y dificultad de probar fidelidad).

### 2. Metadatos auxiliares complementan, no duplican, el grafo

Un archivo JSON versionado opcional junto al `.mmd` contiene solo detalles para el visor y recorridos: descripción, anotaciones y pasos ordenados referenciados por IDs Mermaid. No vuelve a declarar nodos ni conexiones. Cada transición de un recorrido identifica origen y destino y, cuando existan conexiones paralelas, un selector suficiente para resolverla sin ambigüedad. Un validador comprueba formato, referencias y duplicados antes de reproducir el recorrido.

**Alternativas:** colocar toda la lógica en un archivo nuevo propietario (descartado); repetir toda la estructura del grafo en sidecar (descartado por riesgo de divergencia); depender solo del texto Mermaid para narración y controles del producto (descartado porque no expresa de forma portable los metadatos de Floorplan).

### 3. Adaptador de formato separado del visor

Una interfaz interna pequeña recibe fuente y configuración, devuelve diagnóstico de parseo en Node y configura el renderizado browser-side. El HTML exportado lleva el bundle Mermaid y la lógica del visor de forma autocontenida. La capa de visor consume el SVG resultante y los metadatos, sin asumir que el archivo de entrada siempre es Mermaid. La primera implementación tiene un único adaptador Mermaid; no se define ni se prueba un segundo adaptador todavía.

**Alternativas:** hacer que cada control del visor lea selectores específicos de Mermaid (descartado por acoplamiento); diseñar un grafo interno completo como contrato común (descartado por convertirse en otro modelo universal).

### 4. Interacciones como capa de visor

El visor agrega pan, zoom, ajuste al área, selección de nodos, panel de detalles y modo de reproducción paso a paso con resaltado/animación de nodos y conexiones. El layout y dimensiones iniciales los determina el formato/renderizador. Conforme al alcance confirmado, se incluye un prototipo acotado para evaluar redimensionamiento de nodos, pero la edición manual persistente de geometría queda fuera de los criterios de aceptación iniciales. El panel de detalles sí puede ser redimensionable. Se respeta `prefers-reduced-motion`, navegación por teclado y contraste de foco.

**Alternativas:** mutar el SVG/archivo `.mmd` al interactuar (descartado porque mezcla vista y fuente); añadir drag-and-drop o resize de nodos persistente antes de validar un layout que lo soporte (diferido por riesgo de solapamientos y pérdida de reproducibilidad).

### 5. Seguridad del renderizado y exportación

El renderizador se inicializa con `securityLevel: 'strict'` y límites controlados por Bigso; la lista `secure` impide que frontmatter o directivas de fuente relajen claves de seguridad y límites. El visor evita HTML arbitrario y callbacks Mermaid; conecta eventos propios a elementos renderizados reconocidos por el adaptador. El HTML exportado incorpora recursos locales necesarios y una política que bloquea red; la fuente se serializa como datos escapados, nunca como código ejecutable. Revisar licencia, avisos, versión y comportamiento offline del paquete antes de incorporarlo.

**Alternativas:** cargar Mermaid desde CDN o permitir configuración insegura para conservar toda capacidad de autoría (descartado por privacidad, portabilidad y riesgo de contenido activo).

### 6. Conversación a través de los agentes existentes

Las skills actuales coordinan la conversación, preguntas de aclaración, edición de `.mmd` y sidecar, validación y apertura/actualización del preview. El agente presenta un diff y diagnósticos; el usuario decide si acepta el resultado. No se ejecuta un backend de modelos ni se guarda conversación en un servicio de Bigso. Las instrucciones se mantienen neutrales respecto al proveedor, conservando adaptaciones específicas solo donde sean necesarias.

**Alternativas:** construir una UI de chat dentro del visor en esta fase (diferido; requeriría resolver proveedor, credenciales, ejecución, privacidad y backend); hacer que el renderizador llame directamente a un modelo (descartado por separar razonamiento de procesamiento determinista).

### 7. Compatibilidad transitoria con JSON

Las rutas actuales de `validate`, `render` y `export` para JSON y sus cuatro tipos siguen funcionando. La CLI identifica la entrada Mermaid sin alterar el comportamiento JSON existente y ofrece diagnósticos explícitos para sintaxis o funciones no soportadas. Los dos formatos conviven durante esta fase; no hay conversión automática ni retirada del renderer anterior.

**Alternativas:** reemplazar de inmediato el formato JSON (descartado por compatibilidad y por el release público existente); mantener dos productos completamente separados sin compartir el visor (diferido, pues duplicaría controles).

## Risks / Trade-offs

- **[La versión Mermaid y sus sintaxis pueden cambiar, y algunas familias pueden tener estado beta]** → Fijar versión, publicar una lista explícita de sintaxis probadas y mantener fixtures de compatibilidad.
- **[IDs o estructura SVG de Mermaid cambian entre versiones]** → Encapsular el mapeo en el adaptador, probar IDs/nodos/edges para cada fixture y no acoplar controles directamente a nombres internos no verificados.
- **[La semántica de sidecar diverge de la fuente]** → No duplicar el grafo; validar referencias y fallar con diagnóstico si desaparecen IDs.
- **[Un bundle browser-side añade tamaño al HTML y el render requiere un navegador al abrirlo]** → Medir el tamaño real, incluir solo un bundle minificado, y validar el artefacto en el Chromium disponible sin solicitudes de red.
- **[HTML hostil o configuración de fuente puede relajar seguridad]** → Forzar `strict` y claves `secure`, no habilitar callbacks/HTML arbitrario, escapar fuente dentro de script, y probar directivas/etiquetas adversariales.
- **[El layout automático no ofrece resize persistente de nodos]** → Limitar el primer alcance a panel y navegación; prototipar resize de nodos aparte antes de prometerlo.
- **[La interfaz se vuelve llamativa pero no legible en arquitecturas grandes]** → Diseñar y probar recorridos reales de microservicios, reducir ruido con foco/filtros y medir legibilidad antes de añadir efectos.
- **[Conservar JSON y agregar Mermaid duplica caminos de validación y soporte]** → Reutilizar CLI/exportación donde las semánticas coincidan, probar ambos formatos y reevaluar la compatibilidad con datos de uso antes de retirar nada.

## Migration Plan

1. Auditar dependencias Mermaid candidatas, licencia, seguridad, versiones, sintaxis de arquitectura y render offline; registrar la decisión y avisos.
2. Añadir fixtures reales de arquitectura corporativa y flujos entre microservicios; definir qué sintaxis Mermaid se garantiza y cómo se informa una no soportada.
3. Implementar el adaptador Mermaid y el esquema/validador de metadatos, manteniendo los comandos JSON actuales.
4. Construir el visor de forma incremental: primer render limpio; luego navegación, selección/detalles y recorrido animado; después exportación offline y accesibilidad.
5. Adaptar las skills de agentes para crear/actualizar archivos localmente, validar referencias, refrescar preview y presentar diff; revisar con Claude Code y Codex.
6. Ejecutar la suite existente y nuevas pruebas de seguridad, compatibilidad y offline. Mantener una ruta de rollback que deje Mermaid desactivado y restaure el flujo de exportación JSON sin migraciones destructivas.

## Open Questions

- La integración de chat dentro de la app queda fuera del MVP y se reconsidera tras validar el flujo con agentes externos.
- El soporte de formatos adicionales se decidirá después de probar Mermaid con los casos de arquitectura y flujos funcionales priorizados.
