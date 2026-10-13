# Acceso real y entorno: primer corte

Fecha: 13/10/2026. Rama: branch-benjamin-1. Implementado: sesión admin/operador, comprobación de MySQL, migración de sesiones y respaldo/restauración. Pedidos, mapa, importación del Excel y chofer operativo pendientes. Clientes independiente corresponde a MVP 2.

Actualización del segundo corte del mismo día: implementada carga/consulta de pedidos y frecuentes dentro del envío. 002_carga_pedidos.sql agrega apellido/DNI, Piso/Depto y clave/hash idempotentes, sin reemplazar registros; aplicada con autorización y segundo respaldo. Mapa/importación/chofer real siguen pendientes. Las descripciones del primer corte siguientes se conservan como contexto del acceso.

### API de pedidos implementada

- GET/POST /api/pedidos y GET /api/pedidos/:id: admin/operador autenticados. Filtros estado/fecha y paginación; fechas operativas de Buenos Aires (UTC-3), marcas DB en UTC.
- GET /api/clientes/frecuentes?q=: búsqueda explícita por DNI/email/teléfono, sin CRUD independiente ni sobrescritura. Históricos incompletos no se seleccionan como datos válidos para pedido nuevo.
- Actualización de búsqueda: acepta texto no vacío desde un carácter hasta 150; coincidencias parciales de DNI/email/teléfono, exactas primero, hasta 20. Separadores del teléfono no impiden coincidencia; porcentajes/guiones bajos se tratan como texto literal. UI filtra mientras se escribe (250 ms), cancela resultados viejos, no envía consultas vacías ni guarda al pulsar Enter en buscador. Selección del cliente sigue explícita.
- POST requiere cliente/direccion completos y cabecera Idempotency-Key UUID v4. Repetir mismo cuerpo/clave devuelve previo; diferente cuerpo, 409. Datos de cliente discrepantes o coincidencias sin resolver, 409; datos incompletos, 422. No admite estado/confirmación enviados por UI.
- Creación cliente/dirección/pedido/historial atómica; estado pendiente_validacion, no asignación ni despacho. Se conserva texto de dirección original. Original recibido también obligatorio; Piso/Depto y notas opcionales, otros campos de formulario obligatorios según D08.
- D11 posterior: coincidencia de DNI/email/teléfono rechaza alta con 409 CLIENT_ALREADY_EXISTS y errores de campo; reconocerDuplicado ya no se admite. Teléfono sin separadores y email sin mayúsculas/espacios externos. Seleccionar frecuente permite otro pedido sin duplicar/modificar persona. Altas nuevas se serializan por base con bloqueo MySQL transitorio para evitar coincidencias simultáneas. Sin índices únicos nuevos ni migración: futuras inserciones manuales/importación deben aplicar esta regla y revisar históricos conflictivos.
- Nuevo formulario y tablero muestran resultado desde MySQL, detalle, estado y filtros; el filtro de fechas usa el calendario operativo, no la zona horaria del navegador.

Limitaciones de este corte: no edición/cancelación, confirmación versionada, proveedor/mapa, saneamiento/importación ni asignación/pagos. El siguiente corte de direcciones necesita acordar su modelo antes de aplicar otra migración.

## Preparación

Con Node 24, Docker Desktop activo y los .env locales completados desde los ejemplos:

```powershell
npm ci --prefix backend
npm ci --prefix frontend
npm --prefix backend run setup-session
docker compose config --quiet
docker compose up -d --build
```

setup-session genera un secreto aleatorio local si falta, conserva los existentes y no imprime valores. Los .env están ignorados. Para HTTPS: COOKIE_SECURE=true y APP_ORIGIN con origen exacto; desarrollo: http://localhost:5173. Acceder mediante 127.0.0.1 requiere configurar ese origen, no habilitar cualquier origen. Recrear backend después de cambiar su entorno.

Compose configura API_PROXY_TARGET=http://backend:3000; Vite nativo usa http://127.0.0.1:3000. Es proxy de desarrollo, no configuración de producción. Si el volumen de dependencias antiguo oculta las dependencias de la imagen reconstruida, sincronizarlo sin borrar volúmenes:

```powershell
docker compose exec -T backend npm ci
```

## Migración y recuperación

```powershell
npm --prefix backend run migrate -- --dry-run
npm --prefix backend run backup
npm --prefix backend run migrate -- --apply
```

Dry-run solo lee metadatos. El runner distingue base vacía, esquema inicial completo y parcial/incompatible. Una base nueva recibe init.sql una sola vez; la existente no lo reejecuta. Registra checksum normalizado de cada migración y rechaza modificaciones de una versión aplicada. 001 agrega sesiones y el runner registra schema_migrations; no cambia datos de clientes/pedidos.

Aplicar solo con respaldo y acuerdo para la base seleccionada. MySQL DDL puede confirmar implícitamente: no hay rollback general de DDL. Si falla entre crear tabla y registrar versión, el runner se detiene ante la tabla sin registro; revisar y recuperar en copia antes de continuar. No borrar tablas para resolverlo.

backup usa mysqldump dentro del servicio mysql del proyecto, no una base remota genérica. SQL local en temp/backups/, ignorado; puede contener datos personales, nunca se versiona ni se publica. Requiere root del contenedor; no imprime contraseñas ni las pasa en argumentos.

```powershell
npm --prefix backend run test:mysql
```

La verificación necesita MYSQL_ROOT_PASSWORD local (o TEST_DB_ROOT_PASSWORD), MySQL accesible y Compose. Crea bases nuevas mandatodo_test_* y mandatodo_restore_test_*. Ensaya migración, cuentas, sesión, revocación y dump/restauración, comparando las ocho tablas. Conserva bases con datos sintéticos y respaldo; no usa DROP/TRUNCATE ni borra volúmenes. No acredita importación del Excel ni recuperación de instalación corrupta.

## Crear cuentas del equipo (actualizado)

El administrador entra al sistema, abre **Usuarios**, completa nombre/email/rol/contraseña y su confirmación, y pulsa **Crear usuario**. El empleado ya puede ingresar con su cuenta. Solo admin puede listar/crear, validado en servidor; roles disponibles admin/operador. No hay registro público ni envío de contraseñas por email. Chofer operativo sigue pendiente del módulo de entregas.

Para la primera cuenta administrativa, el instalador ejecuta una sola vez desde una consola interactiva:

```powershell
npm --prefix backend run setup-admin
```

El comando pregunta nombre, email y contraseña (dos veces, sin mostrarla); no requiere variables ACCOUNT_*. No sobrescribe usuarios existentes: usar un email nuevo o gestionar recuperación en una tarea explícita. Es un comando local de instalación, no una ruta web anónima. Después, las cuentas se crean desde Usuarios.

API vigente: GET /api/usuarios lista hasta 100 cuentas sin hashes ni contraseñas; POST /api/usuarios recibe nombre/email/rol/password y devuelve cuenta pública. Anónimo 401; operador 403; duplicado 409; inválido 422. Reutiliza hash/creación transaccional existentes, sin cambiar esquema. Edición, baja y reset todavía fuera del corte.

## Método técnico anterior (opcional)

El método con variables se conserva para automatización local y compatibilidad. Para el uso normal seguir la pantalla Usuarios y el comando setup-admin anterior. El comando protege contraseña con scrypt y conserva cuentas/hashes existentes:

```powershell
$env:ACCOUNT_NAME = Read-Host 'Nombre de la cuenta'
$env:ACCOUNT_EMAIL = Read-Host 'Email'
$env:ACCOUNT_ROLE = Read-Host 'Rol: admin u operador'
$accountSecurePassword = Read-Host 'Contraseña (12 a 128 caracteres)' -AsSecureString
$accountPasswordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($accountSecurePassword)
try {
    $env:ACCOUNT_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($accountPasswordPointer)
    npm --prefix backend run create-user
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($accountPasswordPointer)
    Remove-Item Env:ACCOUNT_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:ACCOUNT_NAME, Env:ACCOUNT_EMAIL, Env:ACCOUNT_ROLE -ErrorAction SilentlyContinue
    $accountSecurePassword.Dispose()
}
```

La base se selecciona con DB_* de backend/.env o, si faltan, MYSQL_* del .env raíz. No guardar ACCOUNT_PASSWORD en .env ni compartirla por chat. Modificación/inactivación/reset siguen para una tarea posterior.

## API y límites

| Ruta | Resultado |
| --- | --- |
| GET / | Respuesta original, no acredita DB |
| GET /health/live | Proceso disponible sin consultar MySQL |
| GET /health/ready | SELECT 1 con límite; 200/503; scope=database, no acredita esquema de negocio |
| POST /api/sesion | Email/password; cookie HttpOnly SameSite=Lax, 8 horas; 400 formato, 401 credenciales, 403 origen, 429 límite, 503 dependencia/configuración |
| GET /api/sesion | Usuario/rol y expiración; firma y sesión persistida verificadas |
| DELETE /api/sesion | Revoca en DB y expira cookie; token anterior inválido |

JWT HS256 valida issuer/audience/expiración. Se persiste jti, no el token. Usuarios inactivos o roles no soportados pierden acceso. Respuestas sin hashes/tokens ni errores SQL. Hashes anteriores de otros formatos no se interpretan como texto plano.

Limitador de login: 10 solicitudes por IP/15 minutos, en memoria; se reinicia con el proceso y no es distribuido. trust proxy permanece desactivado. El proxy de desarrollo agrupa solicitudes; revisar esa política antes de despliegue real.

Frontend recupera sesión al recargar, muestra nombre/rol reales y revoca al cerrar. El chofer conserva acceso explícito de demostración sin autenticación, con avisos de datos ficticios. Tablero/carga muestran aviso de prototipo sin guardado.

Próximos pasos: crear cuenta humana desde consola; cerrar campos/modelo de pedidos (sin pedidos nuevos incompletos); implementar carga persistida/tablero; integrar Georef/Leaflet y luego histórico con reconciliación. Clientes independiente para MVP 2; aclarar con docentes el CRUD académico cubierto por Hito 1.
