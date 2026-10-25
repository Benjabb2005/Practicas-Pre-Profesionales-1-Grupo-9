# B01 — Pantalla y API de asignación manual

Autorizada por Benjamín el 25/10/2026 sobre MVP-1 f87f6e1. Se revisa y completa el borrador previo. La asignación guarda chofer_id sin adelantar el estado: no es despacho y no saltea EN PREPARACIÓN. La regla final de despacho/reasignación queda en B02/Q01; no se modifica la máquina de estados.

## Flujo y aceptación
- Administrador y operador acceden desde «Asignar choferes» a /asignaciones.
- El listado muestra cliente, dirección, estado y chofer actual; resumen y filtro de pedidos habilitados. Dirección CONFIRMADA y estado EN STOCK/EN PREPARACIÓN habilitan la selección.
- El servidor informa puede_asignar, motivo_bloqueo y puede_quitar en listado y respuesta de guardado. La pantalla usa estos datos; el PUT vuelve a validar bajo bloqueo de filas, incluso si alguien elude la interfaz.
- Solo se eligen choferes activos. Guardar requiere cambiar a un chofer válido; queda deshabilitado sin cambios, sin choferes o durante la solicitud. El mensaje de éxito aparece después de persistir; la asignación se conserva al recargar.
- Pedidos bloqueados explican el motivo y enlazan a revisar su dirección. Carga, vacío, error/reintento y ausencia de choferes son visibles. Controles adaptados a móvil.
- Asignación e historial se guardan en una transacción, con rollback ante fallo. Repetir la misma asignación no duplica historial. Sin nuevas tablas ni migraciones.

## Contrato API
GET /api/asignaciones → { pedidos }, cada pedido incluye puede_asignar (booleano), motivo_bloqueo (texto|null), puede_quitar (booleano).
GET /api/asignaciones/choferes → { choferes: [{id,nombre}] } (solo CHOFER activo).
PUT /api/asignaciones/:id, JSON { chofer_id: entero positivo|null } → { pedido } con los mismos indicadores. Campos extra, IDs/cuerpos inválidos: 400; sin token: 401; chofer: 403; no encontrado: 404; dirección sin confirmar o después de despacho: 409.

## Límites del borrador conservado
El borrador ya permitía quitar/reasignar antes del despacho y consultar pedidos propios en /chofer. Se conserva ese comportamiento, pero no se acredita B02/B03 completas: faltan despacho, revisión integral móvil y acuerdo de reglas. No se implementan entrega, pago, acreditación, rutas optimizadas ni nuevas decisiones de negocio en B01.

## Detalle dentro de la pantalla
Ver dirección abre un dialog modal nativo, como DetailModal de branch-benjamin-1: fondo oscurecido, cierre con botón/Escape/fondo y retorno del foco. Reutiliza la revisión actual con dirección, mapa e historial; no navega a otra ruta. Al cerrar vuelve a consultar asignaciones para reflejar cambios de confirmación. La ruta independiente de revisión sigue disponible desde el resto de la aplicación.
