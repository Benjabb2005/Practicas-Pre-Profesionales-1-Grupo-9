# Creación de cuentas por administrador

13/10/2026. Usuario solicita cuentas individuales de empleados, creadas por un administrador dentro de la aplicación. Administrador ve Usuarios: lista de cuentas y formulario nombre/email/rol/contraseña/confirmación. Roles habilitados hoy admin/operador; chofer queda para el módulo de entregas. Sin registro público ni credenciales comunes.

API GET/POST /api/usuarios: solo administrador autenticado. Operador recibe 403 incluso por llamada directa; sin sesión, 401. Nombre/email/rol/contraseña validados en servidor; hash scrypt; duplicados 409, sin sobrescribir cuentas. Nunca devolver contraseña/hash/token. Mantener validación de Origin en mutaciones.

Estados: cargando, lista vacía, creando, éxito y error. Limpiar contraseña tras éxito, no guardarla en almacenamiento del navegador. Formulario conserva otros campos tras error, evita doble envío y permite reintentar. Responsive desde 320 px, etiquetas y foco accesibles. Éxito agrega cuenta solo después de respuesta del servidor.

Primer administrador: instalador ejecuta npm --prefix backend run setup-admin en consola, responde preguntas y escribe contraseña sin eco. Se reutiliza servicio de creación; no exponer una ruta anónima para crear administradores ni modificar cuentas preexistentes. Uso de consola es solo instalación/recuperación local autorizada; empleados nuevos se crean desde Usuarios.

Fuera de este corte: edición, baja/reactivación, reset de contraseña, invitaciones por email, rol chofer operativo. Pruebas: creación/login de cuenta nueva, rechazo operador/anónimo, email duplicado, entradas y rol inválidos, error DB sin secretos, no acceso público para alta.
