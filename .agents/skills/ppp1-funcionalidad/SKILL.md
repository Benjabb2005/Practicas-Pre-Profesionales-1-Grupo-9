---
name: ppp1-funcionalidad
description: Desarrollar una funcionalidad PPP1 de extremo a extremo con contrato, criterios de aceptación y continuidad entre agentes.
---

# Funcionalidad de extremo a extremo

## Contexto
Leer `docs/contexto.md`, `docs/arquitectura.md`, `docs/decisiones.md`, `docs/tareas.md` y las reglas de las carpetas afectadas. Para interfaz usar `docs/pantallas.md`.

## Procedimiento
1. Identificar tarea, actor, entrada, cambio persistido y resultado visible. Separar alcance solicitado, decisiones pendientes y maqueta existente. No agregar ABM independiente de Clientes por deducirlo de la tabla clientes.
2. Definir criterios de aceptación verificables (éxito, rechazo y fallo). Si falta una decisión crítica, presentar alternativas y completar partes independientes; no implementar una opción irreversible sin acuerdo.
3. Acordar el contrato de datos/API y la persistencia mínima antes de dividir trabajo. Hoy no hay API de negocio y el SQL no concuerda con las entrevistas: no tratarlo como contrato aprobado.
4. Para UI de varios estados o flujos, crear especificación según `frontend/AGENTS.md`. Implementar un corte pequeño con servidor, persistencia e interfaz cuando estén dentro del pedido, usando los procedimientos de backend/frontend/datos/direcciones solo según necesidad.
5. Mantener mocks identificados y separados de adaptadores reales. No afirmar integración por simular un resultado en memoria.
6. Revisar con el equipo qué hace cada función, sus entradas/salidas y decisiones; actualizar los documentos afectados.

## Verificar
Ejecutar npm run check desde raíz y las pruebas de aceptación del corte. Incluir solicitud directa a API que intente omitir UI, recarga tras guardar y rechazo de rol no autorizado cuando existan esas capacidades. MySQL/proveedor real se prueban en entorno de desarrollo controlado; registrar si no estuvieron disponibles.

## Entregar
Resumen del flujo y archivos, contrato acordado, evidencia por criterio, decisiones pendientes, limitaciones y próxima tarea en `docs/tareas.md`. Si el pedido era solo especificación, entregar esa especificación sin implementar negocio.
