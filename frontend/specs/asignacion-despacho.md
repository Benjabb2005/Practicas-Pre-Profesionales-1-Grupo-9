# Asignación manual y despacho

14/10/2026. Usuario aprueba admin/operador para asignar/reasignar y despachar; ubicación confirmada → En preparación → En envío. Reasignación solo antes de salir. Chofer activo y confirmación vigente obligatorios al salir.

Usuarios admin permite crear cuentas chofer sin registro público. Tablero añade chofer y acciones en detalle: asignar/quitar antes de salida, preparar y despachar. Acciones persistidas con responsable e historial; reintento no duplica auditoría. Campos completos y confirmación vigente se comprueban en servidor, incluso por API directa. Un chofer no puede acceder a APIs de operación/usuarios/clientes ni a pedidos ajenos manipulando ID.

El chofer inicia sesión real, recupera sesión al recargar y consulta solo sus pedidos en envío (lista paginada, sin orden optimizado). Vista móvil conserva lenguaje visual existente, nombre real, dirección/notas/contacto necesarios y mapa confirmado de lectura. Vacío/carga/error/recarga/logout visibles. Demo anterior permanece separada. Sin entrega/pago reales en este corte.

Migración 004 agrega rol chofer, estado en_preparacion y chofer_id nullable con FK a usuarios. Sin reescribir estados, cuentas ni pedidos históricos. Migración preparada y probada en copia; aplicación local requiere respaldo/verificación previa. No activar operación si falta esquema, preservar carga/consulta existente mientras se prepara.

## Mapa en pestaña nueva · 14/10/2026

Solicitud posterior: Ver ubicación abre una pestaña del navegador tanto en chofer como en detalle operador/admin. URL contiene solo ID; mapa consulta pedido vigente con sesión y API de cada rol. Chofer ajeno recibe rechazo sin datos. Pestaña original conserva pantalla; nueva vista presenta código/dirección, mapa grande de lectura y Volver al sistema. Sin confirmación permite aviso de revisión, sin coordenadas inventadas. Carga/edición mantienen mapa interactivo en formulario. Loading/error/ID inválido visibles; layout móvil adapta encabezado y altura. Criterios: enlace target blank con noopener/noreferrer en ambos roles, destino accesible propio, ajeno bloqueado y mapa vigente sin edición.

Aclaración del usuario: «pestaña» significa ventana modal sobre la misma pantalla con fondo oscurecido. Reemplaza el apartado anterior: sin URL especial ni pestaña de navegador. Ver ubicación abre dialog nativo con mapa, consulta vigente por rol, carga/error y cierre X/Escape/fondo; mantiene pantalla/posición y devuelve foco al disparador. Móvil con márgenes y altura adaptable. Carga/edición sin cambios.

## Operación desde cada fila · 14/10/2026

Usuario solicita chofer, estado y Ver ubicación en la misma fila del tablero. Columnas Código/Cliente/Dirección/Chofer/Estado/Acciones; select guarda asignación automáticamente, estado muestra transición permitida preparación/despacho sin estados arbitrarios. Respuesta API confirma éxito y actualiza filtros/lista; rechazo deja valores previos y error en fila. Despachado mantiene chofer de lectura. Ver ubicación abre modal reutilizado, detalle conserva datos/revisión, sin duplicar controles operativos. Lista de choferes se carga compartida; cada fila recupera asignación vigente. Móvil convierte filas en tarjetas etiquetadas sin scroll horizontal. Criterios: asignar/despachar sin detalle, bloquear sin chofer o revisión vigente, guardar visible tras recarga, modal desde fila, select accesible por código.
