# Prototipo acotado: resize manual de nodos

## Alcance

Se probó si un nodo Mermaid puede agrandarse en el SVG ya renderizado sin cambiar la fuente. El ensayo se hizo con el fixture `examples/flowchart.mmd` dentro del HTML offline exportado, aplicando temporalmente `transform: scale(1.5)` al grupo SVG de `gateway`.

## Resultado observado

En Chromium, el ancho visual del grupo pasó de aproximadamente 28,7 px a 43,0 px. El conector Mermaid `cart → gateway` permaneció con el mismo rectángulo visual: aproximadamente 8,2 px de ancho antes y después. El nodo cambió de tamaño, pero Mermaid no volvió a calcular el trazado de la conexión. El cambio también desplazó el grupo en el lienzo; no creó una nueva geometría coherente para el grafo.

El ensayo altera solo el SVG en memoria. No actualiza el texto Mermaid y desaparece al volver a exportar o renderizar. Por tanto, `transform: scale(...)` sirve como prueba visual, no como una función de edición persistente.

## Recomendación

Mantener el resize manual persistente de nodos fuera de la primera entrega. Para hacerlo correctamente habría que recalcular layout y anclajes de conexiones, definir cómo se conserva ese layout al re-renderizar y sincronizarlo con una fuente Mermaid que no expresa directamente tamaños arbitrarios de nodos. Guardar solo transforms en un sidecar dejaría conexiones desalineadas y haría ambiguo qué representación es canónica.

El panel de detalles sí usa el resize nativo del navegador; no cambia el grafo ni la fuente.
