# Spec Delta

## Purpose

Permite que un agente convierta una conversación sobre una solución en archivos Mermaid y metadatos complementarios, manteniendo una vista revisable y coherente. La experiencia inicial usa clientes de agentes existentes, sin requerir un servicio de chat propio.

## ADDED Requirements

### Requirement: Crear artefactos de diseño desde una conversación
El sistema SHALL permitir que un agente cree diagramas Mermaid y, cuando se necesiten interacciones adicionales, metadatos auxiliares a partir de una conversación y del contexto autorizado por el usuario.

#### Scenario: Describir una solución nueva
- **WHEN** el usuario describe una solución que puede representarse con los formatos admitidos
- **THEN** el agente crea archivos fuente legibles y una vista actualizada del diagrama

#### Scenario: Falta una decisión funcional importante
- **WHEN** falta información que alteraría materialmente el flujo o sus responsabilidades
- **THEN** el agente pregunta o registra un supuesto explícito antes de presentar el diseño como definitivo

### Requirement: Actualizar diseños sin perder contenido ajeno
El sistema SHALL actualizar solo los elementos pertinentes a la solicitud y preservar el resto de los archivos y metadatos existentes.

#### Scenario: Cambio localizado
- **WHEN** el usuario solicita modificar un servicio o paso específico
- **THEN** el agente conserva los elementos no relacionados y actualiza los archivos fuente afectados

#### Scenario: El cambio invalida metadatos
- **WHEN** una edición elimina o cambia un identificador usado por un recorrido interactivo
- **THEN** el agente actualiza las referencias afectadas o informa el conflicto y no deja la vista como válida sin advertencia

### Requirement: Validar y revisar los cambios del agente
El sistema SHALL validar los archivos generados y presentar los cambios al usuario antes de que se consideren aceptados como diseño vigente.

#### Scenario: Cambios válidos
- **WHEN** el agente termina una creación o actualización y las fuentes pasan validación
- **THEN** el usuario puede revisar el diff y la vista previa actualizada

#### Scenario: Cambios no válidos
- **WHEN** la fuente Mermaid o sus metadatos no pasan validación
- **THEN** el agente informa los diagnósticos, conserva los archivos para corrección y no presenta el resultado como aceptado

### Requirement: Usar agentes existentes en la primera fase
La primera fase SHALL coordinar la conversación mediante clientes de agentes compatibles y SHALL NOT requerir un chat integrado ni un servicio remoto del producto.

#### Scenario: Flujo con un agente compatible
- **WHEN** el usuario trabaja desde un cliente de agente compatible con el flujo de Bigso
- **THEN** el agente puede crear, validar y actualizar los artefactos locales del diseño

#### Scenario: No hay agente compatible
- **WHEN** no hay un cliente de agente disponible
- **THEN** los archivos Mermaid siguen siendo utilizables por el visor sin depender de una conversación remota
