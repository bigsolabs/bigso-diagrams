# Spec Delta

## Purpose

Permite explorar diagramas Mermaid en un visor propio con controles de navegación y reproducción de flujos funcionales. Mantiene los archivos Mermaid como fuente legible y portable del grafo.

## ADDED Requirements

### Requirement: Abrir y representar diagramas Mermaid
El sistema SHALL cargar archivos Mermaid admitidos y representarlos en el visor sin alterar su contenido fuente.

#### Scenario: Renderizado de fuente válida
- **WHEN** el usuario abre un archivo Mermaid de una sintaxis admitida
- **THEN** el visor presenta el diagrama y conserva el archivo fuente sin modificaciones

#### Scenario: Fuente con error o sintaxis no admitida
- **WHEN** el sistema no puede interpretar un archivo Mermaid
- **THEN** informa el error y su ubicación cuando esté disponible, conserva la fuente y no presenta el render fallido como válido

### Requirement: Navegar e inspeccionar el diagrama
El sistema SHALL permitir navegar por el lienzo y consultar información asociada a sus elementos mediante controles accesibles.

#### Scenario: Explorar un diagrama amplio
- **WHEN** el usuario usa zoom, desplazamiento o ajuste al área visible
- **THEN** el visor cambia la vista sin modificar la fuente del diagrama

#### Scenario: Inspeccionar un elemento
- **WHEN** el usuario selecciona un elemento que tiene metadatos auxiliares
- **THEN** el visor muestra sus detalles y mantiene visible la ubicación del elemento en el diagrama

#### Scenario: Reducir animación
- **WHEN** el sistema o navegador indica preferencia por movimiento reducido
- **THEN** el visor reduce o desactiva animaciones no esenciales y mantiene disponibles los controles del flujo

### Requirement: Asociar metadatos de interacción
El sistema SHALL admitir metadatos auxiliares referenciados por identificadores de elementos Mermaid y validar las referencias antes de usarlos.

#### Scenario: Metadatos coherentes
- **WHEN** los metadatos refieren elementos existentes en el diagrama
- **THEN** el visor asocia descripciones y pasos de flujo a los elementos referenciados

#### Scenario: Referencia obsoleta
- **WHEN** un metadato refiere un identificador inexistente o duplicado
- **THEN** el sistema informa qué referencia no puede resolverse y no la vincula silenciosamente a otro elemento

### Requirement: Reproducir recorridos funcionales
El sistema SHALL permitir reproducir un recorrido definido en los metadatos auxiliares, destacando sus pasos y conexiones en orden.

#### Scenario: Reproducir un recorrido válido
- **WHEN** el usuario inicia o avanza un recorrido válido
- **THEN** el visor resalta el paso activo y su progreso, y permite pausar, reanudar o avanzar sin alterar los archivos fuente

#### Scenario: Recorrido incompleto
- **WHEN** un recorrido contiene referencias sin resolver
- **THEN** el visor identifica los pasos problemáticos y evita presentarlo como una reproducción completa

### Requirement: Exportar una vista portátil
El sistema SHALL exportar una vista interactiva que incluya los recursos necesarios y funcione sin conexión de red.

#### Scenario: Abrir exportación offline
- **WHEN** el usuario abre el HTML exportado sin conexión de red
- **THEN** el diagrama y sus interacciones admitidas siguen disponibles sin solicitudes a servicios remotos
