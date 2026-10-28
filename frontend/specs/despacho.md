# B02 — Preparación, despacho y cambios de chofer

Autorizado por Benjamín el 25/10/2026. Sobre B01 y la máquina de estados existente de Santiago, no se redefine el catálogo ni se implementan entrega/pago (B04/B05).

- Estados visibles: EN STOCK, EN PREPARACIÓN, EN ENVÍO, ENTREGADO, PAGADO.
- Administrador/operador puede preparar EN STOCK → EN PREPARACIÓN. Preparar no asigna ni despacha.
- Despachar exige EN PREPARACIÓN, dirección CONFIRMADA y chofer activo de rol CHOFER. Confirmación explícita en UI mostrando pedido/chofer; éxito deja EN ENVÍO y lo hace visible en consulta propia del chofer.
- Reasignar cambia al chofer elegido. Desasignar (Quitar chofer) deja chofer_id null. Permitidos solo EN STOCK/EN PREPARACIÓN; desasignar puede liberar un pedido cuya dirección dejó de estar confirmada. Cambios posteriores al despacho rechazados también desde API.
- PUT /api/asignaciones/:id/estado recibe {estado: 'EN PREPARACIÓN'|'EN ENVÍO'}; sesión y rol obligatorios. El servidor reutiliza validarTransicion de EstadoPedidoService y vuelve a leer/bloquear pedido/dirección/chofer dentro de la misma transacción que escribe estado e historial. Sin saltos, sin estados impuestos de entrega/pago, sin historial duplicado en reintento/concurrencia; fallo de historial revierte todo.
- Listado/guardado informa puede_preparar, puede_despachar y motivo_despacho. UI usa estos indicadores y servidor revalida al escribir. Mantener errores/reintento, carga y bloqueo de doble envío.
- No se cambian tablas ni datos del usuario para probar; usar base aislada mandatodo_test_asignaciones con fixtures propios.

Criterios: preparar/asignar/reasignar/quitar/despachar y recargar; 401/403, 400 cuerpo inválido, 404 inexistente, 409 estado/dirección/chofer no habilitado; concurrentes sin doble historial, rollback, consulta propia visible tras despacho y cierre por UI de confirmación. La restricción previa al despacho es el criterio conservador de este corte, no se implementa cambio de chofer en ruta ni cancelación.
