# Arquitectura verificada · 30/09/2026

Relevamiento histórico: la actualización del 13/10 al final prevalece sobre las descripciones antiguas de login/proxy/backend.

Reinspección para integrar `PPP1-contexto-para-Codex (1).zip`: base c574c75, rama main con seguimiento origin/main. Git **ya tenía cambios locales** al comenzar; se preservaron. Existían AGENTS.md raíz, frontend/AGENTS.md, adaptadores CLAUDE.md, seis skills, docs y scripts de verificación. No se encontró agent.md singular. La afirmación anterior de Git limpio correspondía a la preparación previa, no a esta integración.

Se releyeron manifests/lockfiles, Compose, ambos Dockerfiles, SQL, backend y frontend. Esta integración modifica instrucciones y documentación; app.js, tests HTTP y scripts ya existían al inicio y no se atribuyen a esta tarea.

## Estructura

| Ruta | Qué hace hoy |
| --- | --- |
| backend/index.js | Carga dotenv, conecta mysql2 y levanta servidor; un fallo DB se registra y no impide escuchar |
| backend/app.js | Aplicación Express separada del arranque para probar HTTP sin DB; conserva GET / |
| backend/test/http.test.js | Smoke por HTTP real en puerto efímero; no abre MySQL |
| frontend/src/App.jsx | Componentes de login, barra lateral, tablero vacío y formulario; navegación con useState |
| frontend/src/App.css e index.css | Estilos de la maqueta |
| frontend/src/main.jsx | Montaje React |
| database/init.sql | DDL inicial, no migración aplicada/verificada |
| docker-compose.yml | mysql, backend y frontend, con volumen mysql_data |
| scripts/ y package.json raíz | Verificación y sincronización de skills sin dependencias nuevas |
| AGENTS.md raíz, frontend/AGENTS.md, backend/AGENTS.md | Reglas siempre activas: comunes en la raíz, específicas por carpeta |

## Versiones

| Componente | Declaración | Lockfile / instalación observada |
| --- | --- | --- |
| Node | Dockerfiles node:24 | Host v24.15.0, npm 11.12.1 |
| Express | ^5.2.1 | 5.2.1 |
| mysql2 / dotenv | ^3.24.3 / ^17.4.2 | 3.24.3 / 17.4.2 |
| nodemon | ^3.1.14 | 3.1.14 |
| React / React DOM | ^19.2.8 | 19.2.8 |
| Vite / plugin React | ^8.2.2 / ^6.1.0 | 8.2.2 / 6.1.1 |
| ESLint | ^10.9.0 | 10.10.0 |
| MySQL | mysql:8.4 | Imagen declarada; motor no verificado en ejecución |
| Docker Compose | Sin versión fija en repo | CLI v5.5.0 disponible; motor apagado |

Backend CommonJS y frontend ESM/JSX. Los rangos del manifest no son versiones exactas. npm ls detectó cors y object-assign extraneous en backend/node_modules: no están declarados y no deben usarse implícitamente. npm ci reconstruye desde lockfile. No se ejecutó reinstalación ni actualización de dependencias.

## Flujo y límites

El frontend no hace fetch ni guarda pedidos. Login compara datos hardcodeados y permite administrador/operador, pero no conserva el rol: ambos ven identidad de operador. Chofer se rechaza. Los campos de pedido son principalmente no controlados; required en Field dibuja asteriscos, no validación persistente. Búsqueda, filtros, agrupamiento, corrección y mapa no tienen integración. No hay enrutador ni API de negocio.

Backend solo ofrece GET /. No hay middleware JSON de negocio, endpoints CRUD, autenticación JWT, hash de contraseñas, validadores ni autorización. JWT era una decisión registrada en AGENTS.md anterior; se conserva como dirección del equipo, pendiente de especificar sesión/expiración, no como funcionalidad instalada.

Patrones a conservar: componentes pequeños cuando se extraigan del archivo actual, CSS grid/flex, voseo, estado local para presentación, Express CommonJS y SQL parametrizado para futuras consultas. Separar servicios geográficos/datos al necesitarlos; no crear capas vacías.

## Base de datos existente

Seis tablas: clientes, direcciones, pedidos, historial_geolocalizacion, historial_estados, usuarios. Claves foráneas de pedidos a cliente/dirección y de historiales a pedido; historial se borra en cascada al borrar pedido, cliente restringe borrado, dirección usa SET NULL.

Brechas con negocio: clientes no tiene DNI; usuarios solo admin/operador; pedidos no tiene asignación de chofer ni pago; ENUM de pedidos usa pendiente_validacion, requiere_revision, direccion_validada, listo_despacho, en_camino, entregado, fallido, cancelado. Confirmación existe en historial_geolocalizacion como booleano, sin vínculo robusto con versión de dirección; proveedor default georef no acredita una elección aprobada. Estado normalizada no equivale a confirmación humana.

Compose no monta init.sql en /docker-entrypoint-initdb.d. Aunque se agregara ese montaje, los scripts de inicialización no migran un volumen ya creado. CREATE TABLE IF NOT EXISTS no actualiza tablas y los CREATE INDEX finales fallarían al reaplicarse con índices existentes. No ejecutar el archivo sobre datos actuales para “arreglar” el esquema.

## Docker y entorno

Puertos host 3306, 3000, 5173. Backend recibe DB_HOST=mysql y demás variables desde .env raíz mediante Compose; nativo usa backend/.env.example (DB_HOST=127.0.0.1). Dockerfiles usan npm install y comando dev; son configuración de desarrollo, no despliegue productivo. Hay bind mounts y volúmenes anónimos de node_modules. MySQL tiene healthcheck; frontend depende del inicio del backend, sin readiness de negocio.

No se cambió Docker ni SQL. Evaluar npm ci en Docker y readiness al preparar T02, sin reinicializar volúmenes. No imprimir docker compose config sin --quiet: puede mostrar secretos interpolados.

## Actualización implementada · 13/10/2026

Ampliación posterior de cuentas: users.js monta GET/POST /api/usuarios bajo authenticate y rol admin; reutiliza createUser con SQL parametrizado/hash scrypt y errores uniformes de validación/duplicado. Users.jsx ofrece lista y alta, navegación visible solo para administrador. setup-admin local pregunta datos/contraseña sin eco; no hay alta anónima web ni nuevas columnas/dependencias. Solicitud directa de operador rechazada por servidor.

Segundo corte T04: orders.js valida entrada y usa transacción para cliente/dirección/pedido/historial. La clave de creación y hash evitan doble guardado, incluso simultáneo. Consulta/detalle/frecuentes autenticados para admin/operador. Campos obligatorios D08; sin borradores ni fusión/sobrescritura de frecuentes. Migración 002 aprobada y aplicada con respaldo; direcciones versionadas/confirmación y geocodificador todavía pendientes.

Orders.jsx sustituye maqueta de carga/tablero por formulario controlado, éxito/error, búsqueda explícita, listado/detalle, filtros y paginación de MySQL. Se conserva apariencia y demo del chofer; no se activa ABM Clientes. API devuelve campos de error y sesión vencida devuelve al acceso. La descripción de tablero/carga como prototipos en el primer corte siguiente quedó superada.

Rama branch-benjamin-1. App ahora usa createApp con dependencias inyectadas. index crea pool mysql2/promise con tiempos acotados, auth-store parametrizado y cierre del pool al apagar. GET /health/live comprueba proceso; /health/ready consulta SELECT 1 y comunica solo scope=database. No comprueba aún versión de esquema de pedidos.

Autenticación real: rutas /api/sesion, JWT HS256 de ocho horas, cookie HttpOnly/SameSite, Origin exacto en mutaciones, scrypt y limitador de intentos en memoria. Sesiones guardadas y revocadas en MySQL; roles actuales admin/operador. jsonwebtoken es nueva dependencia directa para verificar/firmar JWT con algoritmo y claims restringidos; no se escribió criptografía JWT propia. proxy-addr indirecta actualizada dentro del rango para corregir aviso crítico. Quedan avisos de dependencias de desarrollo por revisar, sin npm audit fix --force.

Migración 001 agrega sesiones, con runner/checksum en schema_migrations; aprobada y aplicada tras respaldo a la base actual. Sin modificaciones de clientes/pedidos/direcciones. Runner dry-run, bootstrap de cuentas, generación local de secreto y respaldo/restauración documentados en [acceso y entorno](acceso-y-entorno.md).

Vite proxy /api y /health hacia backend:3000 en Compose, 127.0.0.1:3000 nativo. Dockerfiles usan npm ci. Login consulta servidor, recupera identidad al recargar y cierra sesión revocándola. El chofer conserva demo explícita sin autenticación; tablero/carga siguen sin API de negocio y muestran aviso. Clientes independiente queda para MVP 2 por usuario. Georef/Leaflet aprobados para evaluación, todavía no integrados.

## Material descartado

La revisión previa encontró material de aprendizaje ajeno a este proyecto: un ABM de ejemplo con CRUD `/Clientes` sobre una tabla `Cliente`, CORS abierto, consultas parametrizadas pero sin validación de permisos ni de entradas, y logging del cuerpo de la petición; además una guía de Angular con SQL Server, incompatibles con el stack vigente. Nada de eso forma parte del repositorio y no se copió. Este proyecto se construye con el código que hay en `backend/`, `frontend/` y `database/`: no hace falta ningún módulo heredado para arrancarlo.

## Corte operativo · 14/10/2026

backend/dispatch.js concentra transacciones de asignación/preparación/despacho, validación de ubicación vigente y auditoría en historial_estados. Bloquea pedido/dirección/cliente/chofer para decidir sobre datos actuales; reintento idéntico no duplica historial. API admin/operador: GET /api/choferes, GET /api/pedidos/:id/operacion y POST /api/pedidos/:id/asignar (choferId o null), /preparar y /despachar (objeto vacío). Chofer: GET /api/chofer/pedidos?page=1 y /:id; identidad tomada de sesión, recurso ajeno devuelve 404. No acepta estado arbitrario desde cliente. Migración 004 pendiente de activar localmente; schema anterior conserva carga/consulta.

## Arranque de instalación · 14/10/2026

Compose agrega initialize (node initialize.js) entre mysql saludable y backend; montaje database de lectura permite reutilizar runner y checksum, sin duplicar SQL. create-user exporta validación para revisar cuenta antes de migrar. Esquema nuevo se completa y recibe solo admin; repetición conserva cuentas existentes. initialize usa credenciales administrativas aisladas del proceso backend. Secreto de sesión opcional en .env; ausencia genera /runtime/session-secret persistido en session_config, backend lo lee si no tiene SESSION_SECRET. Fallo del instalador bloquea arranque backend; DDL parcial requiere recuperación manual. No cambios automáticos de esquema en bases existentes pendientes.

## Resultados de entrega · 14/10/2026

backend/deliveries.js se monta antes del middleware staff de pedidos; usa sesión real y ownership chofer en servidor. GET /api/pedidos/:id/entregas; POST /resultado con resultado/receptor/motivo/observacion; POST /reintentar con objeto vacío. Escrituras exigen Idempotency-Key UUID v4, bloqueo del pedido y transacción estado/historial; hash del resultado/actor detecta reutilización con datos distintos. Historial conserva cada intento en historial_estados, sin nueva tabla/migración; clave/hash internos no expuestos. Reintento staff limpia asignación y no duplica evento al repetir clave. Chofer ajeno recibe 404. Resultado únicamente desde en_camino; entregado/fallido separados del pago. DeliveryActions/DeliveryHistory comparten UI chofer/tablero/detalle.

14/10, contrato de resultado ampliado: metodoPago obligatorio en entregado, valores efectivo/transferencia; no admitido en fallido. observacion opcional en ambos. Campo se persiste en JSON de historial y hash idempotente, sin migración ni cambios financieros. Registros antiguos sin método conservados sin inventar valor. DetailModal usa dialog nativo y respeta modales anidados de mapa.

14/10, lectura del portal chofer: GET /api/chofer/pedidos?vista=en_camino|entregado|fallido&page=1 retorna resumen global pendientes/entregados/fallidos/total de asignación actual más página. GET /api/chofer/pedidos/:id permite esos estados siempre que chofer_id coincida; no incluye DNI/email. Consulta por filtro se revalida en lectura de recurso para no mezclar resultado que cambió estado durante la respuesta. UI separa finalizados y pendientes con progreso de resultados registrados, sin atribuir jornada/ruta optimizada ni pago acreditado. Historial existente consulta responsable/método en detalle real.
