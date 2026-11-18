# Spec Delta

## Purpose

Esta capacidad permite crear y mantener diagramas tipados desde briefs, especificaciones y contexto de proyectos, y revisarlos y compartirlos como artefactos portátiles. Conserva las semánticas propias de cada tipo en lugar de forzarlos a un modelo universal.

## ADDED Requirements

### Requirement: Crear diagramas desde contexto suministrado
El sistema SHALL crear un documento de diagrama desde una solicitud en lenguaje natural y el contexto o especificación suministrados, y SHALL admitir inicialmente diagramas de flujo/proceso, arquitectura de sistemas, secuencia y entidad-relación.

#### Scenario: Crear un diagrama admitido
- **WHEN** el usuario solicita un diagrama de secuencia y aporta participantes e interacciones
- **THEN** el sistema produce un documento que representa los participantes y las interacciones en orden

#### Scenario: Resolver ambigüedad importante
- **WHEN** falta información que cambia materialmente el significado del diagrama
- **THEN** el sistema formula una pregunta concreta o registra un supuesto explícito antes de presentarlo como completo

#### Scenario: Tipo no admitido
- **WHEN** el usuario solicita un tipo de diagrama que la versión instalada no admite
- **THEN** el sistema identifica la limitación y ofrece alternativas admitidas sin sustituir silenciosamente el tipo pedido

### Requirement: Preservar semánticas propias del tipo
El sistema SHALL representar y renderizar los conceptos necesarios de cada tipo admitido sin exigir que el usuario reinterprete sus semánticas como enlaces de un grafo genérico.

#### Scenario: Orden de secuencia
- **WHEN** un diagrama de secuencia contiene mensajes ordenados explícitamente
- **THEN** el resultado conserva la identidad de participantes y el orden de mensajes

#### Scenario: Cardinalidad ERD
- **WHEN** un ERD contiene entidades y relaciones con cardinalidades
- **THEN** el resultado identifica entidades, relaciones y cardinalidades especificadas

#### Scenario: Decisiones del proceso
- **WHEN** un diagrama de flujo contiene una decisión con resultados alternativos
- **THEN** el resultado distingue la decisión y sus alternativas de salida

### Requirement: Validar documentos editables
El sistema SHALL ofrecer un formato de documento editable y versionado y validar el tipo, los campos obligatorios, los identificadores y las referencias antes de renderizar.

#### Scenario: Documento válido
- **WHEN** un documento cumple el tipo y versión declarados
- **THEN** la validación termina correctamente y el documento puede renderizarse

#### Scenario: Referencia inválida
- **WHEN** una relación apunta a un elemento inexistente o un identificador está duplicado
- **THEN** la validación falla con un diagnóstico que señala el campo o referencia afectada y no presenta un render incorrecto como exitoso

#### Scenario: Versión no compatible
- **WHEN** un documento declara una versión que las herramientas instaladas no admiten
- **THEN** la validación informa la versión incompatible y no la interpreta como otra versión

### Requirement: Renderizar y exportar diagramas portátiles
El sistema SHALL renderizar los documentos admitidos como diagramas interactivos y SHALL ofrecer exportaciones HTML y SVG que sigan siendo visibles sin conexión de red después de exportarse.

#### Scenario: Exportación HTML sin conexión
- **WHEN** el usuario exporta un diagrama válido como HTML
- **THEN** el artefacto contiene los datos y recursos necesarios para visualizarlo sin solicitudes de red

#### Scenario: Exportación SVG
- **WHEN** el usuario exporta un diagrama válido como SVG
- **THEN** el resultado es un SVG independiente que representa el diagrama y sus etiquetas visibles

#### Scenario: Fallo de renderizado
- **WHEN** el layout o renderizado no puede completarse
- **THEN** el sistema informa el fallo y conserva el documento fuente editable

### Requirement: Ofrecer un flujo repetible con agente y scripts
El sistema SHALL ofrecer una skill/flujo de agente para coordinar la creación y actualización de diagramas y scripts deterministas para validar, renderizar y exportar; los scripts SHALL devolver resultados procesables por máquina con diagnósticos útiles.

#### Scenario: Flujo exitoso
- **WHEN** un agente sigue el flujo documentado con una solicitud válida
- **THEN** produce un documento editable validado, el artefacto renderizado y reporta sus ubicaciones

#### Scenario: Error de validación en modo máquina
- **WHEN** un script recibe un documento inválido en modo procesable por máquina
- **THEN** devuelve un resultado estructurado de fallo con diagnósticos y un código de salida no exitoso

#### Scenario: Actualizar un diagrama existente
- **WHEN** el usuario solicita un cambio en un diagrama existente
- **THEN** el flujo actualiza el documento, lo valida y regenera el artefacto sin descartar silenciosamente contenido ajeno al cambio

### Requirement: Mantener el procesamiento local y transparente
Los scripts del proyecto y los artefactos exportados SHALL NOT enviar documentos fuente ni contenido del diagrama a un servicio remoto operado por el proyecto, y las exportaciones SHALL NOT revelar rutas locales ajenas al diagrama ni configuración específica de la máquina.

#### Scenario: Construir y exportar localmente
- **WHEN** el usuario valida, renderiza o exporta un diagrama con las herramientas del proyecto
- **THEN** las herramientas realizan la operación localmente y no envían el documento o contexto fuente a un servicio de red del proyecto

#### Scenario: Compartir una exportación
- **WHEN** el usuario comparte un artefacto exportado
- **THEN** este contiene solo el diagrama y los recursos necesarios para renderizarlo, no archivos fuente ajenos ni rutas específicas de la máquina
