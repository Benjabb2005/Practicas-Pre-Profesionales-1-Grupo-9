# Desarrollo con IA y continuidad

## Ciclo de una tarea

1. Abrir el repo correcto. Leer AGENTS.md, contexto, arquitectura, decisiones y tareas; inspeccionar Git y reglas de carpeta.
2. Elegir una tarea pequeña, asignar responsable y registrar criterios observables. Resolver solo decisiones realmente bloqueantes; continuar trabajo independiente.
3. Seleccionar skill; verificar código y contrato antes de modificar. Para una funcionalidad de UI o varios flujos, crear especificación breve en frontend/specs según frontend/AGENTS.md; una corrección visual mínima puede usar la referencia del pedido.
4. Implementar dentro del alcance y justificar dependencias. La IA escribe código; humanos revisan y prueban.
5. Ejecutar verificación relevante y revisar diff contra criterios. Corregir fallos causados por el cambio; documentar los preexistentes.
6. Actualizar tareas, decisiones, arquitectura o pantallas según corresponda. Entregar explicación sencilla y pasos reproducibles; diferenciar real, mock y no probado.

## Skills del proyecto

Fuente única: .agents/skills/<nombre>/SKILL.md. Las rutas mencionadas dentro de skills se resuelven desde la raíz del repo.

| Nombre | Usar para |
| --- | --- |
| ppp1-funcionalidad | Una funcionalidad de extremo a extremo, contrato y aceptación |
| ppp1-backend | Endpoints, permisos, validaciones y SQL |
| ppp1-frontend | Pantallas, formularios e integración API |
| ppp1-datos | Cambios de esquema y limpieza/importación del Excel |
| ppp1-direcciones | Normalización, proveedor, mapa y confirmación humana |
| ppp1-verificar | Pruebas, diagnóstico, revisión y documentación de continuidad |

Las skills son procedimientos; las reglas permanentes siguen en AGENTS.md. No cargarlas todas para cada tarea. El índice permite lectura manual cuando no haya descubrimiento nativo. Las copias Claude son generadas; jamás editarlas.

## Trabajo simultáneo

Preferir una rama y un checkout/worktree diferente por integrante o agente. Crear ramas/worktrees solo dentro de la tarea autorizada; aquí no se hicieron operaciones Git de escritura.

Antes de empezar registrar propietario y rutas en la tarea. Un solo responsable integra contratos API, SQL, lockfiles y documentos compartidos. Si se comparte checkout, trabajar por turnos y no ejecutar simultáneamente modificaciones ni instalaciones. git status antes/después; no usar reset, clean ni stash sobre trabajo ajeno para “limpiar”.

Worktrees comparten historial Git, no cambios sin commit. Este pedido prohíbe commits: para entregar trabajo no confirmado, coordinar revisión del diff o patch explícito, sin asumir que otra rama ya lo contiene. Los nombres fijos de contenedores y puertos de Compose también colisionan entre checkouts; acordar una sola instancia o un override revisado antes de ejecutar dos stacks.

## Primera tarea recomendada (copiar al chat nuevo)

> Leé AGENTS.md y los documentos de inicio. Usá ppp1-funcionalidad para preparar T01: contrastá init.sql con requisitos, proponé matriz de permisos, transiciones y esquema mínimo. Distinguí datos del cliente, frecuentes y ABM independiente pendiente. No implementes negocio ni apliques SQL. Entregá opciones y criterios de aceptación para que el equipo decida.

## Revisión humana

Comprobar que pueden explicar entrada, validación, permiso, cambio persistido y manejo de error. Repetir al menos un caso válido y uno rechazado de la tarea. Dejar preguntas concretas y resultado de revisión en tareas; no atribuir commits ni decisiones a integrantes que no participaron.
