# Portal real del chofer como demostración

Fecha: 14/10/2026. Referencia: DriverApp.jsx, demostración local anterior y relevamiento autorizado en docs/pantallas.md. Mantener entrega/pago separados, ratificado por usuario.

## Alcance

Recuperar marca, nombre/avatar, resumen con barra de avance, tarjetas de envíos y presentación del método de pago. Agregar vistas Pendientes, Entregadas y Fallidas; modal de detalle con contacto/dirección/notas/historial y mapa modal. Solo datos reales de pedidos que siguen asignados al usuario. No ruteo optimizado ni siguiente parada comercial inventada. Sin PAGADO ficticio, remito, acreditación o importes.

## Contrato

GET /api/chofer/pedidos admite vista en_camino/entregado/fallido y página. Incluye resumen global de pedidos actualmente asignados, sin depender de página; total = pendientes + entregados + fallidos, avance = resultados registrados / total. No titular Avance del Día porque no existe jornada/ruta fechada aprobada. GET /api/chofer/pedidos/:id permite esos tres estados únicamente si el chofer actual coincide. Historial conserva datos de resultados/método; reintento reasignado deja de estar accesible al chofer anterior según permisos vigentes.

## Aceptación

- Registrar entrega/fallo actualiza contadores, barra y vistas; recarga conserva datos.
- Entregada muestra Entregado, no Pagado; detalle incluye método registrado.
- Lista por estado con paginación, filtro inválido rechazado servidor y cuenta ajena sin datos.
- Cargando/vacío/error/reintento de lectura visibles; resumen sin números ficticios.
- Detalle/mapa modales con cierre X/Escape/fondo, foco restituido y móvil sin scroll horizontal.
- Formulario exitoso muestra Efectivo/Transferencia con receptor obligatorio; notas opcionales; fallo mantiene motivo requerido.
