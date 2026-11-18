# Tasks

## 1. Validar la base Mermaid

- [x] 1.1 Evaluar paquete y versión candidata de Mermaid: licencia/avisos, seguridad, sintaxis necesarias y render offline; registrar decisión en `docs/reuse-and-provenance.md` y verificar una renderización local sin red.
- [x] 1.2 Crear fixtures representativos de arquitectura corporativa, flujo funcional y secuencia entre microservicios; documentar la matriz de sintaxis admitida y verificar que cada fixture se renderiza con la versión elegida.

## 2. Añadir entrada Mermaid sin romper JSON

- [x] 2.1 Implementar el adaptador Mermaid con diagnóstico de parseo y mapeo de IDs semánticos a elementos SVG; añadir pruebas para las sintaxis admitidas y verificar `npm test`.
- [x] 2.2 Extender la CLI para validar `.mmd` y generar su preview/exportación HTML autocontenida, sin cambiar comandos JSON; documentar que el HTML ejecuta el renderizado al abrirse en navegador y añadir pruebas CLI para ambos formatos.
- [x] 2.3 Documentar comandos, sintaxis compatibles, errores y ejemplos Mermaid; verificar que los comandos publicados ejecutan correctamente sobre los fixtures.

## 3. Definir recorridos y metadatos

- [x] 3.1 Definir un sidecar JSON versionado para detalles, anotaciones y recorridos sin duplicar nodos/conexiones; añadir esquema y documentación, y verificar los ejemplos con un validador.
- [x] 3.2 Validar IDs y transiciones de recorridos, incluidos IDs duplicados, referencias ausentes y conexiones ambiguas; cubrir casos válidos e inválidos con pruebas automatizadas.

## 4. Construir el visor interactivo

- [x] 4.1 Crear una interfaz de visor con jerarquía visual para diagramas densos, pan, zoom, ajuste al área y selección de elementos; verificarla con fixtures amplios de arquitectura y flujo.
- [x] 4.2 Añadir panel de detalles redimensionable, navegación por teclado y estados de foco accesibles; probar selección con ratón/teclado y documentar los controles.
- [x] 4.3 Implementar reproducción de recorridos con avance, pausa, reanudación, resaltado de nodos/conexiones y soporte de movimiento reducido; verificar orden y estados en pruebas automatizadas.
- [x] 4.4 Hacer un prototipo aislado de resize manual de nodos y registrar si puede conservar layout, conexiones y fuente Mermaid; entregar una recomendación documentada, sin bloquear la primera entrega si requiere alterar la fuente.
- [x] 4.5 Exportar el visor con recursos locales y validar fuentes hostiles/directivas inseguras; comprobar con pruebas que el HTML no carga recursos remotos y que funciona offline.

## 5. Integrar los flujos con agentes

- [x] 5.1 Actualizar las skills de Claude Code y Codex para crear `.mmd` y sidecar, preguntar ante ambigüedades importantes y validar antes de presentar el diseño; verificar ambas skills con `test/skills.test.mjs`.
- [x] 5.2 Añadir un flujo seguro para actualizar archivos existentes, preservar cambios ajenos y mostrar diff, diagnósticos y vista previa; verificar con pruebas de actualización localizada y referencias obsoletas.
- [x] 5.3 Documentar el flujo local con agentes y agregar ejemplos completos de arquitectura y recorrido funcional; ejecutar los comandos documentados y validar todos los ejemplos.

## 6. Verificar compatibilidad e integración

- [x] 6.1 Ejecutar la suite completa y los comandos JSON existentes, y corregir regresiones; verificar `npm test` y la validación/render/export de los cuatro ejemplos JSON.
- [ ] 6.2 Probar el recorrido integral: conversación del agente, archivos fuente/sidecar, preview, reproducción y export offline; registrar resultados con las fixtures representativas.
- [x] 6.3 Verificar el flujo en los navegadores soportados, incluyendo seguridad, accesibilidad básica y ausencia de solicitudes de red durante la exportación offline; documentar limitaciones restantes.
