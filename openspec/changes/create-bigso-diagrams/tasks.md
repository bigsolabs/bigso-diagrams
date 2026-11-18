# Tasks

## 1. Establecer el proyecto independiente y el contrato

- [x] 1.1 Crear el esqueleto Node del repo local confirmado `/home/carlos/bigso-diagrams`, con `package.json`, pruebas y README inicial; verificar `npm test` y que Floorplan no tiene cambios de código.
- [x] 1.2 Registrar procedencia y licencias de los activos candidatos de Floorplan; verificar que no se copiaron bundles/fuentes de terceros y que el inventario explica qué patrones se reutilizan.
- [x] 1.3 Definir el formato versionado y los ejemplos JSON de flujo, arquitectura, secuencia y ERD; verificar que cada ejemplo documentado es válido según el contrato.

## 2. Validar y renderizar diagramas tipados

- [x] 2.1 Implementar la validación de tipo/versión, campos obligatorios, IDs únicos y referencias; verificar errores útiles y salida no exitosa con fixtures inválidos.
- [x] 2.2 Implementar la interfaz de renderizado y los layouts de flujo y arquitectura; verificar decisiones, ramas, componentes y dependencias con pruebas deterministas.
- [x] 2.3 Implementar renderizadores de secuencia y ERD que conserven orden de mensajes y cardinalidad; verificarlo con fixtures y pruebas por tipo.
- [x] 2.4 Generar SVG independiente y HTML interactivo autocontenido; verificar recursos sin red, apertura offline, exclusión de rutas locales ajenas y preservación del fuente ante errores.

## 3. Completar CLI y flujos de agente

- [x] 3.1 Crear comandos `validate`, `render` y `export` con resultados JSON y códigos de salida estables; verificar éxito, fallo y rutas de salida con pruebas CLI.
- [x] 3.2 Añadir skills/workflows iniciales para Claude Code y Codex; probar con respuestas simuladas creación, preguntas/supuestos, tipo no admitido y actualización que conserva contenido no relacionado.
- [x] 3.3 Documentar instalación, tipos, formato, edición, comandos, exportaciones offline y limitaciones; ejecutar los comandos documentados contra los ejemplos.

## 4. Verificar integridad y entrega local

- [x] 4.1 Añadir CI para fixtures, validador, renderizadores, exportaciones y flujo de agente; verificar que todas las comprobaciones pasan en el Node soportado.
- [x] 4.2 Añadir verificaciones de marca, avisos de licencia, privacidad y exportación; probar que no aparecen recursos externos, rutas locales ni metadatos copiados de Floorplan.
- [x] 4.3 Mantener el proyecto sin remoto ni publicación hasta confirmar slug y licencia; verificar que no se creó ningún remote ni artefacto publicado.

## Workflow follow-up

- Revisar y archivar el cambio OpenSpec después de la implementación; confirmar que queda archivado en el root de `/home/carlos/bigso-diagrams`.
