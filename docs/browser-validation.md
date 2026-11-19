# Validación del visor en navegador

## Chromium

Verificación manual del HTML autocontenido generado desde `examples/flowchart.mmd`, `examples/architecture.mmd` y `examples/sequence.mmd`:

- Los tres diagramas alcanzaron el estado `ready`; los recorridos de flujo y arquitectura cargaron sus pasos documentados.
- En flujo y arquitectura, el primer paso resaltó un nodo y una conexión. En secuencia, se mapearon las diez líneas de mensaje y el paso `cliente → gateway` resaltó su conexión correspondiente.
- En el flujo, Enter sobre el nodo `gateway` actualizó el panel de detalles y mostró sus anotaciones.
- Reproducir avanzó de `1 / 7` a `2 / 7`; pausar mantuvo el paso estable; reanudar avanzó a `3 / 7`.
- La lista de recursos HTTP(S) de los tres documentos quedó vacía; el visor funcionó desde `file://`.

En esta iteración también se verificó el workspace rediseñado en Chromium a 1440 × 900 px y 390 × 844 px:

- Búsqueda por `gateway` abrió el inspector con descripción y conexiones; seleccionar y avanzar un recorrido mostró el paso `2 / 7` y centró los nodos de la transición.
- En móvil, los nodos enfocados quedaron enteros debajo del banner y dentro del canvas (sin recorte); el ancho de página coincide con el viewport. También se probó a 390 × 500 px y 390 × 360 px.
- A 780 × 500 px, la página permite desplazamiento vertical en vez de cortar el workspace; tras cambiar a 720 × 500 px, el paso activo siguió visible bajo el banner, dentro del canvas.
- Cerrar un recorrido limpia los resaltados y restaura el encuadre general.
- El SVG se normaliza a las dimensiones de su `viewBox` antes de aplicar zoom; el foco usa las transformaciones internas de los grupos Mermaid y la altura real del banner.
- Las ventanas probadas no presentaron desbordamiento horizontal y cargaron offline, sin solicitudes HTTP(S).

La comprobación anterior usó Chromium a 780 × 380 px. El panel de detalles tiene resize nativo del navegador y límites de tamaño para no ocupar toda la pantalla.

## Matriz de soporte de esta entrega

Se verificaron recorridos con Chromium en ventanas de escritorio y móvil. Firefox y Safari no se declaran compatibles: no se probaron en este entorno y deben incorporarse a la matriz después de verificaciones reales.

## Limitación

La matriz no afirma compatibilidad con motores distintos de Chromium hasta que pasen pruebas reales.
