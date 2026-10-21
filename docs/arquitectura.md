# Arquitectura verificada · 30/09/2026

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

## Material descartado

La revisión previa encontró material de aprendizaje ajeno a este proyecto: un ABM de ejemplo con CRUD `/Clientes` sobre una tabla `Cliente`, CORS abierto, consultas parametrizadas pero sin validación de permisos ni de entradas, y logging del cuerpo de la petición; además una guía de Angular con SQL Server, incompatibles con el stack vigente. Nada de eso forma parte del repositorio y no se copió. Este proyecto se construye con el código que hay en `backend/`, `frontend/` y `database/`: no hace falta ningún módulo heredado para arrancarlo.

## Actualización MVP1 · 13/10/2026

Se implementó el núcleo del MVP1 sobre la rama `MVP-1`. Este apartado describe el estado real verificado en la sesión; el bloque del 30/09/2026 queda como fotografía histórica.

| Ruta | Qué hace hoy |
| --- | --- |
| backend/app.js | Fábrica `createApp(deps)` sin base: monta `/`, `/api/health`, `/api/auth`, `/api/usuarios`, `/api/estados`, `/api/pedidos`, `/api/clientes`, `/api/provincias`, `/api/localidades`, notFound y errorHandler |
| backend/index.js | Carga env, crea el pool `mysql2/promise`, escucha HTTP y avisa por consola si MySQL no responde |
| backend/src/ | `config`, `constants`, `lib`, `middleware`, `repositories`, `services`, `controllers`, `routes`, `import`: presentación, contrato, lógica y persistencia separadas |
| backend/scripts/ | `migrate.mjs` (con `--dry-run`), `seed.mjs` e `import-excel.mjs`, idempotentes |
| database/migrations/ | `001_esquema_inicial.sql`: esquema objetivo (usuarios, clientes, pedidos, direcciones, historial_geolocalizacion, pagos, historial_estados, schema_migrations) |
| backend/src/geocode/ | `nominatim.js` (adaptador de Nominatim/OSM) e `index.js` (fábrica según `config.geocode`); nunca confirma una dirección por sí solo |
| backend/src/georef/ | `localidades.js`: cliente de localidades de Georef con timeout y errores clasificados; `config.georef` toma `GEOREF_BASE_URL` y `GEOREF_TIMEOUT_MS` |
| backend/src/constants/provincias.js | Las 24 jurisdicciones, variantes, tabla CPA y `normalizarProvincia`; lo usan validador, normalizador y el catálogo de la API |
| frontend/src/api/ y src/auth/ | Cliente Axios con `Authorization: Bearer`, contexto de sesión, guardas por rol y almacenamiento del token |
| frontend/src/pages/ | Login real, ABM de usuarios, carga manual y bandeja/detalle de revisión de direcciones |
| frontend/src/components/ | Selector de cliente, formulario de dirección, mapa Leaflet (`MapPreview`) y etiqueta de validación |
| frontend/src/App.jsx | Router de React Router; la barra lateral y el tablero reutilizan la maqueta |

Flujo implementado: login contra `POST /api/auth/login` → token JWT → guardas de ruta por rol → operaciones con `Authorization: Bearer`. El backend valida permisos, formato y pertenencia; la guarda del cliente es solo navegación, no seguridad.

Contrato vigente: `GET/POST/PUT /api/usuarios` (solo ADMINISTRADOR), `GET/POST /api/pedidos`, `GET /api/pedidos/:id`, `PUT /api/pedidos/:id/direccion`, `POST /api/pedidos/:id/geocodificar`, `POST /api/pedidos/:id/confirmar-direccion` y `GET/POST /api/clientes` (ADMINISTRADOR y OPERADOR), `GET /api/estados` y `POST /api/estados/:id` (transiciones y `puedeDespacharse`), `GET /api/provincias` (catálogo público de 24 nombres), `GET /api/localidades?provincia=…&nombre=…` (ADMINISTRADOR y OPERADOR), `GET /api/health` y `POST /api/auth/login`, `GET /api/auth/me`. Los pedidos se crean como borrador `EN STOCK` con `estado_validacion` decidido por el validador (`VALIDA` o `CON_ADVERTENCIAS`) y la respuesta de alta y edición incluye `problemas`. `GET /api/pedidos/:id` calcula `problemas` al leer sobre la dirección guardada; no los persiste ni modifica el `estado_validacion` almacenado. Editar la dirección normaliza y valida de nuevo, descarta coordenadas y, si estaba `CONFIRMADA`, invalida la confirmación. `POST /api/pedidos/:id/geocodificar` exige `VALIDA` y sólo guarda coordenadas y confianza; `POST /api/pedidos/:id/confirmar-direccion` exige `VALIDA` con coordenadas y es la única vía a `CONFIRMADA`. Al crear o editar la dirección, `PedidoService` consulta Georef a través de `LocalidadService`: si la localidad no figura suma la ADVERTENCIA `LOCALIDAD_NO_ENCONTRADA` y si el proveedor no responde suma `LOCALIDAD_NO_VERIFICADA`; nunca agrega un ERROR ni cambia el `estado_validacion`. El navegador nunca llama a Georef; usa `GET /api/localidades` con el token de sesión. La ruta del chofer sigue siendo maqueta.

Límites vigentes: `database/init.sql` no se tocó ni se reaplicó; la geocodificación/mapa (D06) quedó implementada sobre Nominatim/Leaflet y la importación real del Excel (T06) se validó contra MySQL. D09 (borradores/cancelación) y D11 (duplicados) siguen pendientes del cliente: sólo se avisan potenciales duplicados, no se fusionan. No hay pruebas end-to-end de navegador ni prueba del flujo contra contenedores en esta sesión.
