# Validación del visor en navegador

## Chromium

Verificación manual del HTML autocontenido generado desde `examples/flowchart.mmd`, `examples/architecture.mmd` y `examples/sequence.mmd`:

- Los tres diagramas alcanzaron el estado `ready`; los recorridos de flujo y arquitectura cargaron sus pasos documentados.
- En flujo y arquitectura, el primer paso resaltó un nodo y una conexión. En secuencia, se mapearon las diez líneas de mensaje y el paso `cliente → gateway` resaltó su conexión correspondiente.
- En el flujo, Enter sobre el nodo `gateway` actualizó el panel de detalles y mostró sus anotaciones.
- Reproducir avanzó de `1 / 7` a `2 / 7`; pausar mantuvo el paso estable; reanudar avanzó a `3 / 7`.
- La lista de recursos HTTP(S) de los tres documentos quedó vacía; el visor funcionó desde `file://`.

La comprobación usó Chromium en una ventana de 780 × 380 px. El panel de detalles tiene resize nativo del navegador y límites de tamaño para no ocupar toda la pantalla.

## Matriz de soporte de esta entrega

Para esta primera entrega se soporta el visor de escritorio en Chromium. Firefox y Safari no están declarados como compatibles: no se verificaron en este entorno y deberán incorporarse a la matriz después de pruebas reales.

## Limitación

La matriz no afirma compatibilidad con motores distintos de Chromium hasta que pasen pruebas reales.
