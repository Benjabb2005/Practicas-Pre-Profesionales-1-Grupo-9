# Acceso real, primer corte de Hito 1

Fecha: 13/10/2026. Alcance autorizado: login con cuentas individuales y sesión de servidor, conservando las pantallas existentes. Clientes independiente queda para MVP 2 por indicación del usuario.

## Usuario y flujo

Administrador y operador ingresan con una cuenta creada por comando local. POST /api/sesion establece cookie HttpOnly; GET /api/sesion recupera identidad al recargar; DELETE /api/sesion revoca la sesión. La interfaz usa nombre y rol reales. La sesión dura 8 horas y no usa localStorage.

El tablero/carga aún son maqueta hasta su integración posterior: mostrar aviso visible. El prototipo del chofer se conserva en un acceso explícito de demostración, fuera del login real, sin persistencia ni permisos acreditados. No publicar cuentas/contraseñas demo como acceso seguro.

## Estados y aceptación

- Inicio: comprobación de sesión; no mostrar fugazmente contenido autenticado.
- Sin sesión: formulario actual, campos etiquetados y password con autocomplete adecuado.
- Envío: botón deshabilitado y texto Ingresando; no repetir solicitudes.
- Credenciales inválidas: mensaje genérico, no revelar si existe cuenta.
- Base/API/configuración no disponible: error visible y posibilidad de reintentar; no mostrar ingreso exitoso.
- Sesión válida: nombre y rol recibidos del servidor; recarga recupera sesión.
- Cierre: confirmar revocación antes de volver al login; fallo muestra mensaje y permite reintentar.
- Chofer demo: aviso inequívoco y volver al acceso; nunca manda credenciales al backend.
- Diseño: conservar marca y colores, teclado/foco visible; controles legibles a 320 px y escritorio.

Fuera de este corte: CRUD de clientes, pedidos persistidos, mapas, entrega/pago reales, recuperación de contraseña y registro público de usuarios.
