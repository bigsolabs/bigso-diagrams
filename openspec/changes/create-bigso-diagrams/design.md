# Design

## Context

Ver `proposal.md` para la motivación y `specs/diagram-authoring/spec.md` para los comportamientos requeridos. Floorplan separa la salida JSON del agente de scripts deterministas (`skills/floorplan/workflow.json`, `skills/floorplan/scripts/build.mjs`) y genera un viewer autocontenido (`skills/floorplan/assets/viewer.html`). Ese viewer usa ELK para layout de grafos y SVG con tarjetas HTML; el modelo de datos, los controles y la marca son específicos de mapas de codebase.

El repo se inició sin licencia elegida. En una decisión posterior el usuario seleccionó MIT para el código propio y autorizó el repositorio público `https://github.com/bigsolabs/bigso-diagrams`. El bundle de ELK vendorizado en Floorplan tiene un aviso de licencia propio (`skills/floorplan/assets/vendor/elkjs-LICENSE.md`), por lo que no se copia al MVP sin revisión. El enfoque inicial es código propio de Node/SVG, sin dependencias de runtime ni recursos remotos.

## Goals / Non-Goals

**Goals:**
- Tratar el documento de diagrama como fuente editable y regenerar HTML/SVG desde él.
- Compartir validación, metadatos, estilos básicos y exportación, preservando la semántica de cada tipo.
- Mantener el procesamiento determinista y local, comprobable sin agente ni servicio alojado.
- Lanzar cuatro tipos y dejar una extensión clara para incorporar otros.

**Non-Goals:**
- Extraer o refactorizar el viewer de Floorplan como paquete común en este alcance.
- Copiar ELK, fuentes u otros activos vendorizados de Floorplan antes de revisar sus licencias.
- Portar los analizadores de código, Health, directorio de mapas ni actualización incremental de Floorplan.
- Modelar todos los tipos como un grafo o prometer cobertura universal en el MVP.
- Crear backend alojado, colaboración remota o publicación de un repositorio remoto.

## Decisions

### 1. Producto y límite de repositorio

Implementar en `/home/carlos/bigso-diagrams`, un repo independiente con su identidad, OpenSpec y ciclo de versiones. La carpeta de Floorplan se usa solo como referencia; no se modifican sus archivos de producto. El usuario autorizó el remoto público `bigsolabs/bigso-diagrams`; el paquete npm permanece privado/no publicado.

**Alternativas:** añadir diagramas generales a Floorplan (rechazado porque mezcla propósitos); copiar todo Floorplan como fork (rechazado porque arrastra modelo, branding y herramientas irrelevantes).

### 2. Documento JSON versionado y tipado

Definir una envoltura común con marcador de esquema/versión, tipo, título, metadatos e identificadores estables; usar payloads distintos por tipo. Flujo/proceso modela pasos y ramas; arquitectura, componentes y dependencias; secuencia, participantes y mensajes ordenados; ERD, entidades, atributos, relaciones y cardinalidad. El validador comprueba campos, tipos, IDs y referencias antes del renderizado.

**Alternativas:** un esquema único de nodos y aristas (rechazado porque pierde temporalidad y cardinalidad); cuatro formatos totalmente aislados (rechazado porque duplica metadatos y herramientas comunes).

### 3. CLI determinista y renderizadores modulares

Organizar el código Node en validación, una interfaz de renderer y módulos por tipo. Las funciones comunes producen SVG válido con primitivas vectoriales escapadas; cada renderer decide su layout para preservar la semántica. El primer layout será deliberadamente sencillo y reproducible, no un algoritmo de optimización general. Los comandos `validate`, `render` y `export` aceptan rutas explícitas y ofrecen salida estructurada para automatización.

**Alternativas:** que el agente escriba directamente HTML/SVG final (rechazado porque dificulta validar y actualizar); forzar un único motor de layout para todas las familias (rechazado porque secuencia y ERD necesitan reglas propias).

### 4. Exportaciones autocontenidas y seguras

Generar SVG independiente. El HTML interactivo incorpora el SVG, datos validados, estilos y código necesario dentro del artefacto; no carga fuentes, scripts ni recursos por red. Los textos se escapan antes de insertarse en SVG/HTML. Las exportaciones excluyen rutas locales ajenas y se verifican sin conexión. Los scripts no hacen llamadas de red ni suben documentos a servicios del proyecto.

**Alternativas:** usar assets remotos o renderizado alojado (rechazado por privacidad y portabilidad); insertar tarjetas HTML `foreignObject` dentro del SVG (rechazado porque reduce compatibilidad con visores SVG autónomos).

### 5. Skills separadas de la generación mecánica

Proveer skills/workflows para Claude Code y Codex, que seleccionan tipo, leen el contexto autorizado, registran supuestos y crean/actualizan el documento. Los scripts validan y renderizan sin necesitar un modelo. Mantener los contratos y comandos independientes de un proveedor para permitir más agentes luego.

**Alternativas:** conectar un modelo directamente a cada renderer (rechazado porque mezcla razonamiento y ejecución, y dificulta probar el flujo con respuestas simuladas).

### 6. Reutilización y licencia

Reutilizar el patrón de pipeline, contratos JSON, validación explícita, exportación local y pruebas observadas en Floorplan, pero escribir el código de renderer y la UI propios para el MVP. El código propio se publica bajo MIT; esa licencia no cubre activos ajenos. Mantener un inventario de procedencia de cada activo que se considere reutilizar. No copiar la implementación vendorizada de ELK ni fuentes hasta revisar y aceptar sus avisos/condiciones; reevaluar ELK como opción futura para grafos tras revisar su licencia y avisos.

**Alternativas:** copiar el viewer y los bundles en bloque (rechazado por el acoplamiento y las obligaciones de terceros); traer una dependencia sin revisión (rechazado antes de decidir licencia y publicar).

## Risks / Trade-offs

- **[Layout inicial menos optimizado]** → Priorizar legibilidad y comportamiento reproducible; agregar casos de layout a fixtures y medir antes de integrar un motor general.
- **[Nuevos tipos duplican lógica]** → Mantener una envoltura y primitivas compartidas pequeñas; exigir que cada tipo declare su semántica y pase pruebas comunes.
- **[Texto hostil rompe SVG/HTML]** → Escapar todos los valores interpolados y probar etiquetas con caracteres especiales y markup.
- **[Licencia de activos reutilizados no compatible]** → No copiar activos de terceros hasta inventariar origen, licencia y avisos; la selección MIT del código propio no autoriza redistribuirlos.
- **[Agente sobrescribe contenido al editar]** → Leer el documento existente, preservar campos fuera del cambio, validar y escribir mediante reemplazo seguro; cubrirlo con pruebas de actualización.

## Migration Plan

No se migran datos de Floorplan. Crear aquí el proyecto independiente; definir contrato y fixtures; implementar validador, renderizadores y exportadores; integrar CLI y skills; verificar seguridad, documentación y CI. La restricción inicial de no publicar se levantó después de que el usuario autorizó el remoto público y eligió MIT. No se modifica ni publica código de Floorplan. Para revertir, se puede retirar el remoto o dejar el proyecto sin publicación; los mapas y herramientas de Floorplan no cambian.

## Open Questions

- Resuelto por el usuario: repositorio público `bigsolabs/bigso-diagrams` y licencia MIT para el código propio. El paquete npm sigue privado/no publicado.
- Revisar si una versión posterior debe incorporar ELK para diagramas de grafo tras evaluar sus términos de licencia y el coste de mantenimiento.
