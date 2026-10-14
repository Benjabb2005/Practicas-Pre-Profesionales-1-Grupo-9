# Búsqueda de pedidos
Administrador y operador necesitan encontrar envíos por código PED, nombre completo, DNI o teléfono. Campo compacto en filtros del tablero, botón Buscar y Enter; Limpiar restablece búsqueda sin quitar estado/fechas. Consulta parcial literal (%, _ y ! no son comodines), sin distinguir mayúsculas según collation actual. Texto máximo150 caracteres. GET /api/pedidos agrega q opcional, combina filtros con AND y cuenta todas las coincidencias antes de paginar. Buscar cambia a página1. Cargando, error con reintento y vacío visibles. En móvil filas se adaptan sin overflow. Sin cambios de esquema, permisos, cobros ni resumen operativo. No busca solo página actual.

Ajuste: número sin prefijo busca ID exacto del pedido además de DNI/teléfono; 7 encuentra PED-7. Error de lectura de choferes independiente del listado, visible con reintento; no dejar Cargando indefinidamente.

Corrección: números se comparan exactamente contra ID/DNI/teléfono, nunca por fragmentos numéricos; texto conserva búsqueda parcial.
