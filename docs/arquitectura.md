# Arquitectura verificada · 30/09/2026

## Cómo leer este documento · 28/10/2026

Los apartados iniciales describen cortes históricos y no el estado completo de la aplicación actual. Para el módulo de Benjamín, el comportamiento vigente incluye asignación, preparación, despacho, vista propia del chofer, entrega/fallo, importes, pagos y comprobantes. Sus reglas están consolidadas en [decisiones](decisiones.md) y sus pruebas y límites en [B06](entrega-b06.md). B01–B07 están finalizados en Jira; no afirmamos merge a MVP-1 ni aprobación global de Q01–Q04.

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
| backend/src/geocode/ | `georef.js` activo, `google.js` preparado pero bloqueado por incompatibilidad de términos con Leaflet y persistencia actual, `cache.js` e `index.js` (fábrica por `GEOCODER_PROVIDER`); nunca confirma una dirección por sí solo |
| backend/src/georef/ | `localidades.js`: cliente de localidades de Georef con timeout y errores clasificados; `config.georef` toma `GEOREF_BASE_URL` y `GEOREF_TIMEOUT_MS` |
| backend/src/constants/provincias.js | Las 24 jurisdicciones, variantes, tabla CPA y `normalizarProvincia`; lo usan validador, normalizador y el catálogo de la API |
| frontend/src/api/ y src/auth/ | Cliente Axios con `Authorization: Bearer`, contexto de sesión, guardas por rol y almacenamiento del token |
| frontend/src/pages/ | Login real, ABM de usuarios, ABM de clientes (`/clientes`), carga manual, listado general de pedidos (`/`) y bandeja/detalle de revisión de direcciones |
| frontend/src/components/ | Selector de cliente, formulario de cliente del ABM, formulario de dirección, mapa Leaflet (`MapPreview`) con validación de coordenadas (`mapa.js`), etiqueta de validación y helpers de presentación del listado |
| frontend/src/App.jsx | Router de React Router; la barra lateral conserva la navegación y el tablero usa el listado real de pedidos |

Flujo implementado: login contra `POST /api/auth/login` → token JWT → guardas de ruta por rol → operaciones con `Authorization: Bearer`. El backend valida permisos, formato y pertenencia; la guarda del cliente es solo navegación, no seguridad.

Contrato vigente: `GET/POST/PUT /api/usuarios` (solo ADMINISTRADOR), `GET/POST /api/pedidos` (el listado acepta `estado`, `estado_validacion`, `cliente`, `fecha_desde` y `fecha_hasta`; el alta recibe cliente, canal de origen del catálogo MVP, observaciones y dirección; si detecta un pedido del mismo cliente con la misma dirección normalizada dentro de `DUPLICADOS_VENTANA_HORAS` responde `409 DUPLICADO_POTENCIAL` y sólo crea con `confirmar_duplicado: true`), `GET /api/pedidos/:id`, `PUT /api/pedidos/:id/direccion`, `POST /api/pedidos/:id/geocodificar` (permite `indice_candidato`), `POST /api/pedidos/:id/rechazar-ubicacion`, `POST /api/pedidos/:id/confirmar-direccion` y `GET/POST/PUT/DELETE /api/clientes` (ADMINISTRADOR y OPERADOR), `GET /api/estados` y `POST /api/estados/:id` (transiciones y `puedeDespacharse`), `GET /api/provincias` (catálogo público de 24 nombres), `GET /api/localidades?provincia=…&nombre=…` (ADMINISTRADOR y OPERADOR), `GET /api/health` y `POST /api/auth/login`, `GET /api/auth/me`. Los pedidos se crean como borrador `EN STOCK` con `estado_validacion` decidido por el validador (`VALIDA` o `CON_ADVERTENCIAS`) y la respuesta de alta y edición incluye `problemas`. `GET /api/pedidos/:id` calcula `problemas` al leer sobre la dirección guardada; no los persiste ni modifica el `estado_validacion` almacenado. Editar la dirección normaliza y valida de nuevo, descarta coordenadas y, si estaba `CONFIRMADA`, invalida la confirmación. `POST /api/pedidos/:id/geocodificar` exige `VALIDA`, registra cada intento y sólo guarda coordenadas y confianza para una opción seleccionada; `POST /api/pedidos/:id/confirmar-direccion` exige `VALIDA` con coordenadas y es la única vía a `CONFIRMADA`. El punto de rechazo registra la acción y vuelve a la corrección. `puedeDespacharse(pedido)` bloquea el paso a `EN ENVÍO` sin `CONFIRMADA`. Al crear o editar la dirección, `PedidoService` consulta Georef a través de `LocalidadService`: si la localidad no figura suma la ADVERTENCIA `LOCALIDAD_NO_ENCONTRADA` y si el proveedor no responde suma `LOCALIDAD_NO_VERIFICADA`; nunca agrega un ERROR ni cambia el `estado_validacion`. El navegador nunca llama a Georef; usa `GET /api/localidades` con el token de sesión. La ruta del chofer sigue siendo maqueta.

Tarifas de envío: `GET /api/tarifas` (ADMINISTRADOR y OPERADOR) devuelve el precio por km y los datos de sucursal; `PUT /api/tarifas` y `PUT /api/tarifas/sucursal` son solo para ADMINISTRADOR. La sucursal se normaliza y valida en el servidor; si tiene errores devuelve `400`. Se geocodifica con Georef y se guarda el primer candidato con su dirección y coordenadas; si Georef devuelve `ZERO_RESULTS` o `ERROR`, responde `409` sin guardar. `GET /api/pedidos/:id/importe-sugerido` (ADMINISTRADOR y OPERADOR) calcula sin persistir: informa el motivo cuando falta confirmación vigente, coordenadas de destino o sucursal, o precio por km. Si están disponibles, calcula Haversine, redondea la distancia a 1 decimal antes de multiplicar y devuelve el importe con 2 decimales. Al crear un pedido se puede omitir el importe base o enviarlo vacío; ambos casos lo guardan como `NULL`, y se puede completar después.

El ABM de clientes permite listar y buscar por nombre, DNI, teléfono o email, crear, editar y eliminar. El DNI se normaliza quitando puntos, espacios y guiones; otros caracteres se rechazan y su duplicado se rechaza. Teléfono o email repetido sólo se avisa, sin fusionar, identificando al otro cliente con nombre y DNI. La baja es física y sólo se permite si el cliente no tiene pedidos: la FK `pedidos.cliente_id` usa `ON DELETE RESTRICT` y el servicio devuelve un conflicto legible antes de intentar el borrado.

Límites vigentes: `database/init.sql` no se tocó ni se reaplicó; geolocalización y mapa usan Georef/Leaflet según D06. La entrada por `GEOCODER_PROVIDER` selecciona Georef; Google queda bloqueado hasta incorporar mapa Google y eliminación de coordenadas a 30 días. Hay caché de cinco minutos y diez candidatos como máximo por consulta. D09 (borradores/cancelación) sigue pendiente. D11 sigue pendiente en la resolución/fusión: se detectan y avisan duplicados de clientes y pedidos, pero no se fusionan ni se resuelven discrepancias. Para pedidos, el aviso usa el mismo cliente y la dirección normalizada dentro de `DUPLICADOS_VENTANA_HORAS` (24 h por defecto), responde 409 y exige confirmación explícita antes de crear. No hay pruebas end-to-end de navegador ni prueba del flujo contra contenedores en esta sesión.

## Asignación B01 y borrador de vista del chofer
Se montan /api/asignaciones (ADMINISTRADOR/OPERADOR) y /api/chofer/pedidos (CHOFER) con listado y detalle propios. Asignar guarda chofer_id sin cambiar estado, exige dirección CONFIRMADA y chofer activo y registra historial en la misma transacción bajo FOR UPDATE. /asignaciones ofrece controles de asignación y /chofer consulta datos reales, sin acciones simuladas de entrega/pago. Contrato en frontend/specs/asignacion-chofer.md; todavía no hay API de despacho, entrega ni pago. B01 fue autorizada y completada el 25/10/2026: listado/guardado informan puede_asignar, motivo_bloqueo y puede_quitar; pantalla y API verificadas con MySQL aislado. La vista del chofer sigue siendo borrador y no acredita B03 terminada. Los merges remotos se trajeron hasta f87f6e1 el 25/10/2026.

B02 (25/10/2026): PUT /api/asignaciones/:id/estado integra preparación/despacho con validarTransicion existente, chofer activo y confirmación. Relectura/bloqueo de pedido/dirección/chofer, cambio de estado e historial se realizan en una transacción de AsignacionRepository. La ruta no expone entrega ni pago. Reasignación/desasignación siguen restringidas al tramo previo al despacho.

### Alta verificable (regla posterior vigente · 30/10)
POST /api/pedidos comprueba formato/localidad y respuesta geográfica antes de crear pedido/dirección.400 por datos inválidos o ZERO_RESULTS,503 por proveedor no verificable/sin punto válido, sin persistir pedido. Resultado aproximado permite continuar sólo con revisión humana posterior; no confirma automáticamente ni garantiza existencia física. Container inyecta adaptador existente. Reemplaza para nuevas altas la admisión anterior de borradores inválidos por pedido explícito del usuario; no modifica registros heredados, edición ni esquema. Ver decisiones y tareas para evidencia/límites.
