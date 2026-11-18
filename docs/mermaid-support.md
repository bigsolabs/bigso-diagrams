# Formatos Mermaid admitidos inicialmente

Bigso conserva el archivo `.mmd` como fuente del diagrama. El visor renderiza Mermaid en el navegador; no introduce una sintaxis gráfica propietaria. La compatibilidad se fija mediante la versión exacta de la dependencia y fixtures ejecutables.

| Familia | Sintaxis | Uso inicial | Estado/alcance |
|---|---|---|---|
| Arquitectura | `architecture-beta` | Grupos, servicios y conexiones de una solución corporativa | Mermaid la marca beta; cubrimos solo el fixture versionado de este repo hasta ampliar las pruebas. |
| Flujo | `flowchart` | Pasos funcionales, decisiones y llamadas a través de microservicios | Incluye ramas etiquetadas y nodos con IDs estables para sidecars. |
| Secuencia | `sequenceDiagram` | Orden temporal de solicitudes/respuestas entre participantes | Incluye participantes, mensajes y rama `alt/else`. |

## Seguridad y referencias upstream

- El renderizador usa `securityLevel: 'strict'`; la configuración fija además las claves `secure`. Mermaid documenta que `strict` codifica etiquetas HTML del texto y desactiva la funcionalidad `click`.
- El adaptador rechaza frontmatter y directivas Mermaid, y también declaraciones `click`; la política CSP del HTML exportado prohíbe conexiones y recursos remotos.
- Mermaid documenta `architecture-beta` como beta y advierte que su sintaxis puede cambiar de forma incompatible.
- Referencias: [Mermaid Architecture Diagrams](https://mermaid.js.org/syntax/architecture.html), [Mermaid Usage y securityLevel](https://mermaid.js.org/config/usage.html), [Mermaid Security](https://mermaid.js.org/community/security.html).

## Límites iniciales

- Esta matriz no implica compatibilidad universal con toda la gramática, directivas o extensiones Mermaid.
- `architecture-beta` puede cambiar aguas arriba; actualizar la versión requiere revisar fixtures y el mapeo de IDs SVG.
- El visor reserva las interacciones del producto para su propia capa; no activa callbacks de Mermaid ni HTML arbitrario de los diagramas.
- ERD y los otros tipos JSON existentes siguen disponibles por el renderer actual; no se convierten automáticamente a Mermaid.
- Los archivos fuente y metadatos de recorridos se validan localmente y no se suben a un servicio de Bigso.
