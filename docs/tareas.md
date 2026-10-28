# Tareas y continuidad · 30/09/2026

## Estado

Núcleo del MVP1 implementado el 13/10/2026: entorno, esquema con migraciones y seed, autenticación JWT, ABM de usuarios, módulo de estados e importación histórica en backend; login real con guardas por rol y pantalla de Usuarios en frontend. La maqueta del tablero, la carga manual y la ruta del chofer siguen sin integrarse al backend. Falta la importación real del Excel (no está en `temp/`), la geocodificación/mapa (D06) y cerrar T04/T05/T07. Ver [verificación](verificacion.md).

Responsables de las tareas siguientes: a asignar por el equipo. Cada tarea debe registrar rama/checkout, archivos reservados, decisión vinculada y evidencia de aceptación.

| ID | Próximo trabajo | Dependencias | Criterios de aceptación |
| --- | --- | --- | --- |
| T01 | Acordar contrato mínimo de pedidos/roles y modelo | D04–D11 | Tabla de permisos por acción/recurso; transiciones con bloqueos; alcance Clientes separado; propuesta de esquema y conflictos con init.sql; decisiones humanas registradas. No modificar DB en esta tarea |
| T02 | Entorno reproducible y migración de esquema | T01 | Arranque de los 3 servicios; estrategia para BD nueva y existente; backup/restauración ensayados en copia; migración versionada conserva datos; instalación desde lockfiles; readiness distingue HTTP y DB |
| T03 | Autenticación y autorización | D02, D04, T02 | Cuentas individuales con hash; sesión definida; ausencia/invalidez de credenciales rechazada; operador/admin según matriz; chofer no puede leer/modificar otro pedido manipulando ID; reemplazar accesos de maqueta |
| T04 | Primer flujo vertical de carga y revisión | T01–T03 y D06 para integración real | Dirección/cliente validados en servidor; datos originales conservados; guardado y recarga desde DB; fallos visibles; frecuentes no sobrescriben silenciosamente; no habilitar despacho por presencia de coordenadas |
| T05 | Geocodificación, mapa y confirmación | D06, D08, D10; puede definirse adaptador antes | Error, timeout, ambigüedad y ausencia de resultados; confirmación vinculada a dirección revisada; cambio invalida; solicitud directa a API no puede omitir bloqueo; un caso real de integración documentado |
| T06 | Importación histórica | T01, T02 | Dry-run sin escrituras; mapeo por hoja/fila; 12 filas por hoja reconciliadas entre aceptadas/revisión/rechazadas; relaciones preservadas; reejecución idempotente; no inventar DNI ni fusionar pedidos por cliente |
| T07 | Asignación, entregas y pagos | D04, D09, T03–T05 | Chofer solo ve asignadas; acciones según transición; entrega y cobro trazables; reintento no duplica registro; validar transferencia según acuerdo |
| T08 | Completar referencia y ensayo académico | Acceso de prueba/capturas y D12 | Casos poblados, mapa exitoso, entregas/pagos y móvil observados; reporte mínimo acordado; cada integrante explica su aporte y verifica un flujo |

No planificar T07 como rutas optimizadas. ABM independiente de Clientes sigue fuera de implementación hasta D07. Las dependencias de integración no impiden redactar especificaciones o trabajar con fixtures sintéticos claramente identificados.

## Entrega de cada tarea

Registrar: fecha y responsable; alcance; cambios/archivos; criterios cumplidos y no cumplidos; comandos con resultados; casos manuales y limitaciones; decisión nueva; siguiente paso. No marcar terminado por solo compilar.

## Preparación anterior conservada

- Integradas instrucciones raíz y frontend; documentación persistente y matriz de decisiones.
- Seis skills con formato y referencias verificables; adaptadores y guías por agente.
- Verificación coordinada y dos smoke tests HTTP sin dependencia nueva; separada app Express del arranque sin cambiar la respuesta existente.
- Fuentes originales no copiadas ni alteradas dentro del repo. No se ejecutaron migraciones, importación, cambios de datos, commit ni publicación.

## Integración anterior: T00

Estado: completada, 30/09/2026. Responsable: agente de integración documental; revisión humana pendiente. Checkout actual en main, sin crear rama ni commit. Archivos de esta integración: AGENTS.md y docs/contexto.md, arquitectura.md, pantallas.md, fuentes.md, agentes.md, decisiones.md, tareas.md, verificacion.md.

Aceptación: ZIP contrastado con instrucciones existentes; estado Git inicial registrado; manifests, Compose, Dockerfiles, SQL y código inspeccionados; reglas y límites de negocio enlazados; compatibilidad contrastada con fuentes oficiales; seis skills preexistentes conservadas sin nuevas copias canónicas; verificaciones existentes ejecutadas; solicitud de acceso resuelta dejando revisión pendiente. No hay funcionalidades de negocio nuevas.

Para T01 bloquean D04 (permisos/transiciones/pagos), D05 (modelo), D08/D09 (campos/borradores) y D11 (duplicados); D06 bloquea elegir integración geográfica real. D07 y D12 requieren equipo/docentes para cerrar alcance académico. D15 bloquea solamente completar evidencia visual remota: no impide especificaciones basadas en requisitos confirmados. No pedir que se resuelvan todas estas dudas para realizar trabajo documental independiente.

## Handoff T00b: revisión y cierre de la preparación

Estado: completada, 30/09/2026. Responsable: agente OpenCode continuando el trabajo del agente previo. Checkout en main, sin rama, commit, push ni deploy. No se implementó negocio ni se tocaron backend, frontend, SQL ni Docker.

Inspección: `git status`, `git diff` y los 25 archivos sin trackear de la integración previa; lectura completa de AGENTS.md raíz, CLAUDE.md, frontend/AGENTS.md, frontend/CLAUDE.md, los nueve documentos de docs/, las seis skills, los tres scripts, backend/app.js y backend/test/http.test.js. No se encontró ningún archivo parcialmente escrito. No hay rutas personales ni secretos en la documentación.

Aceptación cumplida:
- `npm run check` pasó completo: contexto y skills, sincronía de copias Claude, sintaxis de backend, 2/2 tests HTTP, ESLint y build de Vite.
- Descubrimiento nativo comprobado en la versión instalada: OpenCode 1.18.33 devolvió las 6 skills desde `.agents/skills` con `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1`.
- Hueco 1 cerrado: el material temporal se concentró en `temp/`, que se versiona vacía mediante `.gitkeep` e ignora su contenido. Los dos ZIP de contexto quedaron ahí dentro, y enunciados, Excel o capturas que el equipo comparta tienen un lugar claro. Antes no había regla que los protegiera de un commit.
- Hueco 3 cerrado: la documentación dependía de carpetas vecinas y de rutas de otra máquina. Ahora el repositorio se presenta como fuente única de contexto, sin referencias externas.
- Hueco 2 cerrado: `context:check` no exigía `docs/fuentes.md`, `database/init.sql`, `package.json` raíz ni los scripts, no detectaba archivos vacíos y no validaba enlaces relativos. Ahora los exige, rechaza vacíos y falla ante enlace roto. Se comprobaron los tres modos de fallo (enlace roto, archivo vacío, archivo ausente) y se restauró todo.
- Documentación actualizada con la evidencia de esta revisión y una nota de precaución sobre la codificación en Windows.

Límites de esta revisión: no se arrancó Docker ni MySQL, no se probó Codex ni Claude Code porque no están en PATH en esa máquina, no se leyó el Excel ni se aplicó SQL, y no se tocó la maqueta. La revisión autenticada de la demo sigue diferida por D15.

Siguiente paso sugerido: T01 con el equipo presente, porque necesita cerrar D04, D05, D08, D09 y D11 antes de escribir esquema o API.

## Handoff T00c: reglas de trabajo para que la IA avance sola

Estado: completada, 30/09/2026. Responsable: agente OpenCode. Checkout en main, sin rama, commit, push ni deploy. No se implementó negocio ni se tocó la maqueta, el SQL ni Docker.

Motivo: el pedido fue comprobar que las instrucciones y skills alcanzan para que la IA programe sola ante cualquier tarea, conserve el contexto al cambiar de herramienta o sesión, y no amplíe el alcance de lo que se le pide.

Inspección: se auditaron `AGENTS.md` raíz, `frontend/AGENTS.md`, las seis skills y los nueve documentos de `docs/` contra esas cuatro necesidades. El contexto de negocio, la verificación y la persistencia de decisiones ya estaban sólidos. Faltaban cuatro cosas concretas.

Cambios, todos en instrucciones y validación, ninguno en código de producto:
- Hueco 1, el más grave: no existía ninguna regla que impidiera ampliar el alcance. Una tarea chica podía venir acompañada de reformateos, refactors y documentos actualizados que nadie pidió. Se agregó la sección Límites de alcance al `AGENTS.md` raíz, con la comprobación final de que todo archivo modificado tenga un motivo que se pueda explicar en una frase, y la instrucción de no reescribir documentación para que calce con el código cuando el bug puede estar del lado del código.
- Hueco 2: el ruteo de skills vivía solo en `docs/desarrollo-ia.md`, así que decidir con qué skill arrancar obligaba a leer un archivo extra. Ahora el `AGENTS.md` raíz trae la tabla tipo de tarea → skill con disparadores típicos, y qué hacer cuando ninguna encaja.
- Hueco 3: había reglas de frontend pero ninguna de backend, así que una tarea de servidor solo recibía el archivo raíz. Se crearon `backend/AGENTS.md` y `backend/CLAUDE.md`, con la separación `app.js` sin base contra `index.js` que conecta MySQL, SQL parametrizado, autorización por rol y recurso, y el límite de DROP/TRUNCATE. `context:check` ahora exige ambos archivos.
- Hueco 4: el `AGENTS.md` raíz no tenía mapa de archivos ni regla de idioma, y un agente sin hilo no tenía un punto de retorno explícito. Se agregó el mapa del repo, la respuesta en español con voseo porque el equipo tiene que defender el código, y releer el último apartado de `docs/tareas.md` al retomar.

Aceptación cumplida: `npm run check` pasó completo, `git diff --check` sin errores y sin problemas de codificación. Se comprobó la detección negativa de `backend/AGENTS.md` ausente restaurando el archivo después.

Límites: no se arrancó Docker ni MySQL, no se leyeron los ZIP ni el Excel, no se implementó negocio y no se probaron Codex ni Claude Code porque no están en PATH. `frontend/AGENTS.md` sigue en inglés, en inglés de origen del equipo: se dejó así para no reescribir un archivo ajeno, y se anota como observación.

## Sesión MVP1: núcleo (13/10/2026)

Estado: completada en backend y en la autenticación de frontend; importación real y geocodificación pendientes. Responsable: agente OpenCode sobre rama `MVP-1`. Sin commit, push ni deploy. Verificación detallada en [verificación](verificacion.md).

Alcance: entorno reproducible, esquema con migraciones y seed, autenticación JWT, autorización por rol y recurso, ABM de usuarios, módulo de estados y `puedeDespacharse`, importación histórica del Excel y frontend con login real, guardas de ruta y pantalla de Usuarios.

Cambios y archivos:
- Backend: `app.js` como fábrica sin base; `index.js` con pool; `src/config/env.js`, `src/lib/errors.js`, `src/lib/validar.js`, `src/lib/publico.js`, `src/constants/{roles,estados}.js`, middleware `auth`, `roles`, `errorHandler`, `notFound`; repositorios, servicios, controladores y rutas de auth, usuarios y estados; y `src/import/importador.js`.
- Datos: `database/migrations/001_esquema_inicial.sql` y scripts `migrate.mjs`, `seed.mjs`, `import-excel.mjs`; `database/init.sql` sin tocar.
- Frontend: `src/api/client.js`, `src/auth/{contexto.js,AuthContext.jsx,useAuth.js,ProtectedRoute.jsx,tokenStore.js}`, `src/pages/{LoginPage,UsersPage}.jsx`, `src/components/Icon.jsx`, `App.jsx` con router, `main.jsx` y `vite.config.js` con proxy.
- Pruebas: `backend/test/{auth,estados,import}.test.js` y `frontend/src/**/*.test.js`; spec `frontend/specs/autenticacion-real.md`.

Criterios cumplidos: 21/21 pruebas de backend y 6/6 de frontend; lint y build de Vite OK; smoke HTTP real con login admin, `GET`/`POST /api/usuarios`, rechazo 400 de payload inválido y 403 para chofer; migración y seed idempotentes; importación reejecutable sin duplicar contra MySQL 8.4.

No cumplidos / límites: no se importó el Excel real (ausente en `temp/`); la maqueta de tablero, carga manual y ruta del chofer no llaman al backend; no hay geocodificación ni mapa (D06); no hay pruebas end-to-end de navegador.

Decisión nueva: D18 (importación idempotente), D19 (token en `localStorage`), D20 (arnés de pruebas), además de actualizar D02, D04, D05 y D10.

Siguiente paso: T04/T05 (flujo de carga y revisión con geocodificación) y depositar el Excel en `temp/` para validar la importación real (T06).

## Sesión MVP1: carga y revisión de direcciones (T04/T05, 15/10/2026)

Estado: T04 y T05 implementados en backend y frontend, con pruebas de negocio; pendiente la prueba end-to-end contra MySQL/Docker y el cierre de decisiones humanas. Responsable: agente OpenCode sobre rama `MVP-1`. Sin commit, push ni deploy. Verificación en [verificación](verificacion.md).

Alcance:
- Carga manual de pedidos con cliente real (`GET /api/clientes`) y dirección estructurada, guardada como borrador `EN STOCK`.
- Bandeja de revisión de direcciones no confirmadas y detalle con mapa, historial e invalidación al cambiar la dirección.
- Geocodificación vía Nominatim (OSM) y confirmación manual con mapa Leaflet (D06).

Cambios y archivos:
- Backend: `src/repositories/{ClienteRepository,PedidoRepository}.js`; `src/services/{ClienteService,PedidoService,GeocodeService}.js`; `src/geocode/{nominatim.js,index.js}`; `src/controllers/{pedidos.controller,clientes.controller}.js`; `src/routes/{pedidos.routes,clientes.routes}.js`; bloque `geocode` en `src/config/env.js`; `container.js` y `app.js` con las rutas `/api/pedidos` y `/api/clientes`.
- Frontend: `src/api/pedidos.js`; `src/components/{ClienteSelector,DireccionForm,MapPreview,EstadoValidacionBadge}.jsx` y `src/components/direccion.js`; `src/pages/{PedidosCargaPage,PedidosRevisionPage,PedidoRevisionDetallePage}.jsx` y `src/pages/Pedidos.css`; rutas y navegación en `App.jsx`; spec `frontend/specs/pedidos-carga-revision.md`. Dependencias nuevas: `leaflet` y `react-leaflet` (D06).
- Pruebas: `backend/test/{pedidos,geocode}.test.js`.

Criterios cumplidos: 39/39 pruebas de backend (incluye borradores, invalidación D09/D10, geocodificación ok/aproximada/sin resultados/timeout/error y guardas de rol 401/403/200) y 6/6 de frontend; lint y build de Vite OK; `npm run check` completo (exit 0).

No cumplidos / límites: no se probó el flujo contra MySQL/Docker ni con el proveedor real (Nominatim) porque requiere contenedores en ejecución y red; el mapa muestra teselas de OSM y depende de acceso a Internet en el navegador; no hay pruebas end-to-end de navegador. D09 (borradores/cancelación) y D11 (duplicados) siguen pendientes del cliente: sólo se avisan potenciales duplicados, no se fusionan.

Siguiente paso: probar el flujo real contra los contenedores (login → carga → geocodificar → confirmar → revisión), y retomar T07 (asignación, entregas y pagos) cuando D04/D09 se definan.

## Reparación del entorno Docker y smoke real (T04/T05, 15/10/2026)

Estado: completada. Responsable: agente OpenCode sobre rama `MVP-1`. Sin commit, push ni deploy. Se reactivó el stack Docker y se corrió el flujo real de autenticación y consulta.

Motivo: los contenedores habían quedado creados con `.env` incompleto (secretos vacíos) y con volúmenes anónimos de `node_modules` desactualizados, por lo que el backend caía con `MODULE_NOT_FOUND` y el login no funcionaba.

Cambios y archivos:
- `.env` (raíz) y `backend/.env`: completados con valores de desarrollo (contraseña de root, usuario y contraseña de aplicación y `JWT_SECRET`, definidos localmente). Están gitignoreados y no se versionan; los `.env.example` siguen con los campos vacíos para no publicar credenciales.
- MySQL: el volumen nombrado `mysql_data` ya estaba inicializado (root con contraseña y base `mandatodo` vacía, sin tablas ni usuario de aplicación); no se borró ningún volumen. Se creó el usuario de aplicación con `CREATE USER IF NOT EXISTS` + `GRANT` sobre `mandatodo.*`, porque el entrypoint no lo crea sobre un volumen ya inicializado.
- Stack recreado con `docker compose up -d --build -V` para reconstruir imágenes (traen `bcryptjs`, `jsonwebtoken`, `zod` en backend y `leaflet`, `react-leaflet` en frontend) y renovar los volúmenes anónimos de `node_modules`.

Observación (no abordada, queda para otra tarea): `backend/scripts/migrate.mjs` resuelve `../../database/migrations/` respecto de su propia ubicación, así que `npm run migrate` **dentro del contenedor** falla con `ENOENT` porque ese directorio no entra ni en la imagen ni en el bind mount `./backend:/app`. Migración y seed se corrieron desde el host (`npm.cmd --prefix backend run migrate|seed`) contra `127.0.0.1:3306`. Falta decidir si el contenedor debe poder migrar por sí mismo.

Evidencia: `docker compose ps` con los 3 servicios `Up` (MySQL `healthy`); log del backend `Conexión a MySQL exitosa`; `POST /api/auth/login` admin devuelve token (rol `ADMINISTRADOR`); `GET /api/pedidos` y `GET /api/clientes` responden `200` (0 filas, base recién migrada); `http://localhost:5173/` responde `200`.

Credenciales de desarrollo del seed (ya presentes en `.env.example`): `admin@mandatodo.com`, `operador@mandatodo.com`, `chofer@mandatodo.com`, todas con contraseña `[contraseña local omitida]`.

Siguiente paso: probar el flujo real en el navegador (login → carga → geocodificar → confirmar → revisión) y retomar T07 cuando D04/D09 se definan.

## Alta de cliente en la carga manual (continuación de T04, 15/10/2026)

Estado: completada. Responsable: agente OpenCode sobre rama `MVP-1`. Sin commit, push ni deploy.

Motivo: la base de desarrollo tenía 0 clientes y la pantalla de carga sólo permitía elegir uno existente, así que no se podía cargar ningún pedido ni geocodificar. Se agregó el alta de cliente dentro del mismo formulario. Es parte del flujo de MVP1 ("datos del cliente dentro del pedido"); no es la pantalla independiente de ABM de clientes, que sigue pendiente en D07.

Cambios y archivos:
- Backend: `repositories/ClienteRepository.js` (`crear`, `buscarPorDni`, `buscarCoincidencias`); `services/ClienteService.js` (`crear` normaliza el DNI a solo dígitos, rechaza DNI duplicado como conflicto y devuelve coincidencias por teléfono/email sin fusionar); `controllers/clientes.controller.js` (`crear` con zod); `routes/clientes.routes.js` (`POST /api/clientes`, ADMINISTRADOR y OPERADOR). Sin cambios de esquema. Pruebas nuevas en `test/clientes.test.js`.
- Frontend: `api/pedidos.js` (`crearCliente`); nuevos `components/{ClienteCampos.jsx,cliente.js}`; `pages/PedidosCargaPage.jsx` (elige frecuente o carga un cliente nuevo; crea el cliente y después el pedido) y `pages/Pedidos.css`; spec `frontend/specs/pedidos-carga-revision.md`.
- Docs: `arquitectura.md` (contrato `POST /api/clientes`), `pantallas.md` (campos del cliente en la carga), este apartado y `verificacion.md`.

Evidencia (detalle en `docs/verificacion.md`): backend `npm.cmd --prefix backend test` 44/44; lint y build de frontend OK; smoke real contra los contenedores con alta de cliente (`201`, DNI `30.111.222` → `30111222`), DNI duplicado (`409`), sin token (`401`) y pedido creado con ese cliente (`EN STOCK`/`PENDIENTE`).

Límites: no se probó en navegador ni la geocodificación real con Nominatim; el aviso de duplicados es informativo y no fusiona (D09/D11 pendientes). El smoke dejó datos de prueba en la base de desarrollo (cliente id 1 y pedido id 1), no borrados.

Siguiente paso: probar en navegador la carga de un pedido con cliente nuevo y geocodificar; retomar T07 cuando D04/D09 se definan.

## Sesión MVP1: ABM de clientes (20/10/2026)

Estado: completada en backend, pantalla y pruebas; con smoke real contra MySQL 8.0 local, sin prueba con Docker ni en navegador. Responsable: Julián (pedido del equipo) sobre la rama `feature/clientes-registro-pedidos-duplicados`. Sin commit, push ni deploy. Verificación en [verificación](verificacion.md).

Alcance: punto 1 del módulo «Clientes, registro de pedidos y detección de duplicados»: ABM de clientes con búsqueda, alta, edición y baja. Se mantuvo separado de la carga de pedido y de la pantalla de frecuentes. No se modificó el esquema ni `database/init.sql`.

Cambios y archivos:
- Backend: `ClienteRepository` (búsqueda por DNI/teléfono con dígitos normalizados, `actualizar`, `tienePedidos`, `eliminar`); `ClienteService` (normalización de DNI/teléfono/email, DNI duplicado como conflicto, aviso de coincidencias, baja bloqueada por pedidos y traducción de `ER_DUP_ENTRY`/FK); `clientes.controller` (`PUT`/`DELETE`, Zod y validación de id); `clientes.routes` (nuevas rutas con los mismos roles).
- Corrección posterior: `src/lib/errors.js` no guardaba `mensaje` en `AppError`; el middleware respondía sólo `codigo` y el frontend mostraba el texto genérico. Se agregó la propiedad y pruebas del mensaje público.
- Frontend: `api/clientes.js` (se movieron las funciones de clientes desde `api/pedidos.js`); `components/ClienteForm.jsx`; `pages/ClientesPage.jsx` y `ClientesPage.css`; `components/cliente.js` (estado y precarga del ABM); `App.jsx` (ruta `/clientes` y ítem de barra lateral); imports actualizados en `ClienteSelector.jsx` y `PedidosCargaPage.jsx`.
- Pruebas: 9 casos nuevos en `backend/test/clientes.test.js` (14 en total) y 6 en frontend (5 de la API de clientes y 1 del mensaje de conflicto).
- Documentación: `frontend/specs/abm-clientes.md`, `docs/arquitectura.md`, `docs/pantallas.md`, `docs/decisiones.md` (D07) y este apartado.

Criterios cumplidos: backend 100/100 y frontend 12/12; lint y build de Vite OK; `npm run check` completo (exit 0); búsqueda por nombre, DNI, teléfono y email; DNI normalizado y duplicado rechazado con 409 y mensaje visible; teléfono/email repetido sólo se avisa; baja sin pedidos y conflicto con pedidos; guardas 401/403/400 en HTTP; sin SQL concatenado ni datos personales en logs. Smoke real contra MySQL 8.0 local: health 200, login 200, listado inicial 0, alta 201, DNI repetido 409 con `mensaje`, edición 200, baja 204, listado final 0, baja con pedido 409 con `mensaje`; proxy de Vite 5173 contra backend 3000 con `http` y `db` en `ok`. La base `mandatodo` se creó vacía y se aplicaron migración 001 y seed; los clientes/pedidos de prueba se eliminaron.

No cumplidos / límites: no se probó con Docker ni en navegador; no hay prueba end-to-end de interfaz ni verificación visual responsive. La baja con pedidos se ejecutó contra MySQL real, pero el caso de carrera que dispara `ER_ROW_IS_REFERENCED_2` no se provocó. El borrado es físico y no hay baja lógica. D07 queda implementada localmente por pedido del equipo, pero el alcance académico debe validarse con cliente/docentes. D11 sigue pendiente: no se fusionan clientes. `npm ci` se ejecutó porque faltaban dependencias; `npm audit` reporta vulnerabilidades preexistentes y no se aplicó `npm audit fix`.

Siguiente paso: punto 2, búsqueda de clientes por DNI en el formulario de pedido (el selector de frecuentes ya usa `GET /api/clientes`), y luego punto 3, detección de clientes duplicados.

## Punto 2: búsqueda de clientes en la carga de pedido (20/10/2026)

Estado: completado en frontend y verificado con smoke real contra MySQL 8.0 local; sin cambios de esquema ni del contrato API. Responsable: Julián (pedido del equipo) sobre la rama `feature/clientes-registro-pedidos-duplicados`. Sin commit, push ni deploy. Verificación en [verificación](verificacion.md).

Motivo: el punto 2 del módulo pide recuperar rápido un cliente recurrente desde el formulario de pedido buscando por DNI, nombre o teléfono. El backend ya resolvía `GET /api/clientes?busqueda=` y el DNI con puntos; faltaba que la pantalla lo comunicara, mostrara el teléfono en los resultados y dejara evidencia de que elegir un frecuente no crea otro cliente.

Cambios y archivos:
- `frontend/src/components/ClienteSelector.jsx`: ayuda visible «Buscá por DNI, nombre o teléfono. El DNI puede llevar puntos o guiones», placeholder con ejemplos de DNI, nombre y teléfono, `maxLength` alineado al límite del servidor y estado sin coincidencias que guía al alta. Los resultados y el cliente elegido muestran DNI, teléfono y email.
- `frontend/src/components/cliente.js`: `contactoDeCliente()` centraliza la línea de contacto y prioriza DNI y teléfono.
- `frontend/src/components/cliente.test.js`: 3 casos nuevos para la línea de contacto y la precarga de los campos editables del cliente elegido.
- `frontend/src/pages/PedidosCargaPage.jsx` y `frontend/src/pages/Pedidos.css`: subtítulo y estilo de la ayuda del selector. La selección sigue usando el `id` del cliente y bloquea sus campos; no se modificó la lógica de alta.
- `frontend/specs/pedidos-carga-revision.md`: alcance, flujo, criterios y estado vacío actualizados.
- Documentación: `docs/pantallas.md`, `docs/verificacion.md` y este apartado.

Criterios cumplidos: frontend 15/15 y backend 100/100; lint y build de Vite OK; `npm run check` completo (exit 0); `git diff --check` limpio. El smoke real encontró un cliente por DNI con puntos, nombre, teléfono con guiones y DNI parcial; no devolvió resultados para un texto inexistente. Al crear un pedido con el cliente recuperado, el pedido quedó asociado a su `cliente_id` y el conteo de clientes no cambió. Los datos sintéticos se eliminaron.

No cumplidos / límites: no se probó en navegador ni con Docker; no hay prueba de interacción DOM, por lo que la selección y el bloqueo visual se acreditan con revisión de código, pruebas de funciones puras y el smoke de API. No se implementó todavía la detección de clientes duplicados (punto 3) ni el aviso de pedidos duplicados (punto 5). D11 sigue abierto: no se fusionan clientes.

Siguiente paso: punto 3, detección de clientes duplicados por DNI normalizado y aviso por teléfono o email coincidente.

## Punto 3: detección de clientes duplicados (20/10/2026)

Estado: completado en backend y frontend, con smoke real contra MySQL 8.0 local; sin cambios de esquema ni del contrato API. Responsable: Julián (pedido del equipo) sobre la rama `feature/clientes-registro-pedidos-duplicados`. Sin commit, push ni deploy. Verificación en [verificación](verificacion.md).

Motivo: el punto 3 pide rechazar un DNI idéntico después de quitar puntos, espacios y guiones, y avisar cuando el teléfono o el email coinciden con otro cliente. El backend ya tenía el rechazo y devolvía `posiblesDuplicados`; faltaba que la normalización no borrara letras u otros caracteres y que la carga de pedido identificara al otro cliente por nombre y DNI, en lugar de mostrar sólo una cantidad.

Cambios y archivos:
- `backend/src/services/ClienteService.js`: `normalizarDni()` quita únicamente puntos, espacios y guiones y exige que el resto sean dígitos. Un DNI con letras, barras u otros caracteres se rechaza con 400 en vez de recortarse en silencio. El mensaje de validación informa los separadores admitidos.
- `backend/test/clientes.test.js`: 5 casos nuevos para normalización con los tres formatos, rechazo de letras, DNI repetido con formatos distintos, aviso de coincidencias al actualizar y exclusión del propio cliente en la consulta SQL.
- `frontend/src/components/cliente.js`: `describirCoincidenciasClientes()` centraliza el aviso, muestra nombre y DNI de cada coincidencia (o «sin DNI») y aclara que no se fusionaron datos.
- `frontend/src/pages/ClientesPage.jsx` y `frontend/src/pages/PedidosCargaPage.jsx`: usan el helper; el aviso del ABM y el de la carga de pedido ya no dependen de contar clientes.
- `frontend/src/components/ClienteForm.jsx` y `frontend/src/components/cliente.js`: el placeholder del DNI pasa a «Con o sin puntos».
- `frontend/src/components/cliente.test.js`: 3 casos nuevos para una coincidencia, varias coincidencias con y sin DNI, y ausencia de aviso.
- `frontend/specs/abm-clientes.md` y `frontend/specs/pedidos-carga-revision.md`: criterios de normalización, DNI duplicado y aviso con nombre/DNI actualizados.
- Documentación: `docs/arquitectura.md`, `docs/pantallas.md`, `docs/decisiones.md` (D11), `docs/verificacion.md` y este apartado.

Criterios cumplidos: `20.123.456`, `20 123 456` y `20-123-456` se normalizan a `20123456`; si el DNI ya existe, el alta o la edición responde 409 y no se guarda. Un DNI con letras u otros caracteres se rechaza con 400. Un teléfono o email compartido no bloquea: el alta responde 201, devuelve `posiblesDuplicados` con `nombre` y `dni`, y el aviso visible los muestra sin fusionar datos. En la edición, el propio cliente se excluye de las coincidencias. Backend 105/105, frontend 18/18, lint y build de Vite OK, `npm run check` completo (exit 0) y `git diff --check` limpio.

No cumplidos / límites: no se probó en navegador ni con Docker; no hay prueba de interacción DOM ni verificación visual responsive. El smoke usó MySQL 8.0 local y datos sintéticos, que se eliminaron. El teléfono mantiene la normalización preexistente a dígitos; la validación estricta de separadores se aplicó al DNI. D08 (obligatoriedad del DNI) y D11 (resolución/fusión de duplicados) siguen abiertos; no se fusionan clientes. El aviso de pedidos duplicados (punto 5) no se implementó ni se probó como terminado.

Siguiente paso: punto 4, registro manual de pedidos con elección o alta de cliente, canal de origen, observaciones y estado inicial.

## Punto 4: registro manual de pedidos con canal de origen (20/10/2026)

Estado: completado en backend, frontend y documentación, con smoke real contra MySQL 8.0 local; sin cambios de esquema ni de `database/init.sql`. Responsable: Julián (pedido del equipo) sobre la rama `feature/clientes-registro-pedidos-duplicados`. Sin commit, push ni deploy. Verificación en [verificación](verificacion.md).

Motivo: el punto 4 pide que la carga manual elija o cree el cliente, registre el canal de origen y las observaciones, y cree el pedido en el estado inicial. La elección/alta de cliente y las observaciones ya funcionaban; faltaba un canal visible, validado y persistido, y una confirmación de que el estado inicial no puede imponerse desde el cliente.

Cambios y archivos:
- `backend/src/constants/canales.js`: catálogo único `MANUAL`, `WHATSAPP`, `INSTAGRAM`, `CORREO` y `SISTEMA EXTERNO`, con `CANAL_PREDETERMINADO = MANUAL`.
- `backend/src/controllers/pedidos.controller.js`: `canal_origen` se valida contra el catálogo con Zod; un valor fuera de la lista responde 400 con el campo afectado. El esquema de alta no acepta `estado`, por lo que un intento de imponer otro estado se descarta antes del servicio.
- `backend/src/services/PedidoService.js`: usa `CANAL_PREDETERMINADO` en lugar de un string suelto; sigue creando con `ESTADO_INICIAL` (`EN STOCK`).
- `backend/src/repositories/PedidoRepository.js`: el detalle del pedido devuelve `canal_origen`, útil para confirmar la persistencia y mostrar el resumen.
- `frontend/src/components/canal.js`: etiquetas visibles del catálogo (`WhatsApp`, `Instagram`, `Correo electrónico`, `Sistema externo`, `Carga manual`) y `etiquetaCanal()` con fallback sin inventar datos.
- `frontend/src/pages/PedidosCargaPage.jsx`: selector de canal en «Datos del pedido», envío del canal al alta, resumen del canal y del estado `EN STOCK` después de guardar, y reinicio del canal en «Cargar otro pedido».
- `frontend/src/pages/Pedidos.css`: separación del bloque de datos del pedido y margen del resumen.
- Pruebas: 4 casos backend nuevos y 1 ampliado (canal y observaciones persistidos, canal predeterminado, estado impuesto ignorado, canal inválido 400, chofer 403) y 4 frontend (catálogo/etiquetas, fallback y contrato del alta).
- Documentación: `frontend/specs/pedidos-carga-revision.md`, `docs/pantallas.md`, `docs/arquitectura.md`, `docs/decisiones.md` (D22) y este apartado.

Criterios cumplidos: el alta con `canal_origen` válido y observaciones responde 201, devuelve el pedido en `EN STOCK` y la dirección en `PENDIENTE`, y persiste ambos datos en MySQL. El estado enviado por el cliente se ignora y siempre nace `EN STOCK`. Sin canal, se guarda `MANUAL`. Un canal fuera del catálogo responde 400 y no crea pedido; las observaciones de más de 2000 caracteres también se rechazan. Sin token responde 401 y el chofer 403, sin crear pedido. Backend 109/109, frontend 22/22, lint y build de Vite OK. Smoke real: pedido con canal `WHATSAPP` y observaciones persistido; pedido sin canal en `MANUAL`; estado impuesto ignorado; rechazos 400/401/403 sin escrituras; datos sintéticos eliminados.

No cumplidos / límites: no se probó en navegador ni con Docker; no hay prueba de interacción DOM ni verificación visual responsive. El catálogo de canales es una adopción local basada en la operación multicanal del contexto (D22) y debe confirmarse con el cliente. El aviso de pedidos duplicados con confirmación explícita sigue siendo el punto 5; la lista informativa actual no se considera terminada. D08 (obligatoriedad del DNI) y D11 (fusión de clientes) siguen abiertos.

Siguiente paso: punto 5, aviso de pedidos duplicados por mismo cliente y misma dirección normalizada dentro de una ventana configurable, con confirmación explícita antes de continuar.

## Punto 5: aviso de pedidos duplicados (21/10/2026)

Estado: implementado y verificado técnicamente en backend, frontend y documentación, con smoke real contra MySQL 8.0 local; probado y confirmado por el usuario el 21/10/2026. Sin cambios de esquema ni de `database/init.sql`. Responsable: Julián (pedido del equipo) sobre la rama `feature/clientes-registro-pedidos-duplicados`. Sin commit, push ni deploy. Verificación en [verificación](verificacion.md).

Motivo: el punto 5 exige avisar cuando el mismo cliente vuelve a cargar la misma dirección normalizada dentro de una ventana configurable, mostrar el pedido existente y exigir confirmación explícita. La implementación previa comparaba calle y altura crudas, no aplicaba ventana y creaba el pedido igual.

Cambios y archivos:
- `backend/src/services/PedidoService.js`: `claveDireccion` consume `NormalizadorDireccion`, `normalizarTexto` y `normalizarProvincia` (para asimilar CABA y Capital Federal); compara calle (tolera iniciales como «H.» frente a «Hipólito»), altura y, cuando están cargadas en ambos pedidos, localidad y provincia. No compara piso/departamento. Busca candidatos por cliente y ventana; si hay coincidencia sin `confirmar_duplicado: true`, lanza `409 DUPLICADO_POTENCIAL` sin crear; con confirmación crea y devuelve los existentes.
- `backend/src/repositories/PedidoRepository.js`: `buscarCandidatosDuplicados` filtra por `cliente_id` y `created_at >= NOW() - INTERVAL ? HOUR`, sin excluir estados, y devuelve los datos del pedido y su dirección para mostrarlos.
- `backend/src/controllers/pedidos.controller.js`: `confirmar_duplicado` es un booleano opcional con predeterminado `false`; un valor no booleano responde `400`.
- `backend/src/lib/errors.js` y `backend/src/middleware/errorHandler.js`: error específico `DUPLICADO_POTENCIAL` que conserva `posiblesDuplicados` en el cuerpo de la respuesta.
- `backend/src/config/env.js`, `backend/.env.example`, `.env.example`, `docker-compose.yml` y `backend/src/container.js`: `DUPLICADOS_VENTANA_HORAS` configurable, con 24 horas por defecto, inyectada al servicio y pasada por Compose.
- `frontend/src/api/pedidos.js`: `pedidosDuplicadosDeError` extrae la lista de pedidos existentes del conflicto, sin confundirlo con otros errores.
- `frontend/src/pages/PedidosCargaPage.jsx` y `frontend/src/pages/Pedidos.css`: aviso visible con código o id, estado, fecha y dirección de cada pedido existente; acciones «Sí, crear otro pedido» y «Cancelar»; el aviso se descarta al cambiar cliente, dirección, canal u observaciones; el éxito posterior informa que se confirmó la coincidencia.
- Pruebas: 11 casos backend nuevos (dirección equivalente, confirmación, altura/localidad distintas, sin altura, ventana configurable, comparación normalizada, configuración por entorno, error y middleware, consulta de candidatos, confirmación no booleana) y 2 frontend nuevos (reenvío de la confirmación y extracción del conflicto). Se actualizaron los dobles de prueba del repositorio.
- Documentación: `frontend/specs/pedidos-carga-revision.md`, `docs/pantallas.md`, `docs/arquitectura.md`, `docs/decisiones.md` (D11) y este apartado.

Criterios cumplidos: con un pedido del mismo cliente y la misma dirección normalizada dentro de la ventana, el alta sin confirmación responde `409 DUPLICADO_POTENCIAL`, no crea el pedido y devuelve los datos del existente. Con `confirmar_duplicado: true` crea exactamente un pedido y devuelve la coincidencia. «Av. H. Yrigoyen» y «Avenida Hipólito Yrigoyen» se reconocen como la misma dirección; altura, localidad, provincia y cliente distintos no generan aviso; sin altura no se arriesga un duplicado; un pedido de hace 3 días queda fuera de la ventana de 24 h. Sin token responde `401` y el chofer `403`, sin escrituras. Backend 120/120, frontend 24/24, lint y build de Vite OK, `npm run check` exit 0 y `git diff --check` sin errores. Smoke real: 409 sin crear, confirmación con 201, reintento posterior sin confirmar con 409, confirmación no booleana con 400 y limpieza de los datos sintéticos.

No cumplidos / límites: no se probó en navegador ni con Docker; no hay prueba de interacción DOM ni verificación visual responsive, así que el aviso y sus botones se acreditan con revisión de código, pruebas de las funciones puras y el smoke de API. La ventana de 24 h es una adopción local configurable, pendiente de confirmación con el cliente. La comparación tolera iniciales y abreviaturas, pero no separa una calle y altura escritas en un solo campo; esa mejora sigue en el alcance de normalización. D11 sigue abierto en la resolución/fusión: no se fusionan pedidos ni clientes. D08 (obligatoriedad del DNI) sigue abierto.

## Punto 6: listado de pedidos con filtros (21/10/2026)

Estado: implementado y verificado técnicamente en backend, frontend y documentación, con smoke real contra MySQL 8.0 local; probado y confirmado por el usuario el 21/10/2026. Sin cambios de esquema ni de `database/init.sql`. Responsable: Julián (pedido del equipo) sobre la rama `feature/clientes-registro-pedidos-duplicados`. Sin commit, push ni deploy. Verificación en [verificación](verificacion.md).

Motivo: el punto 6 pide listar los pedidos con filtros por estado, cliente y fecha. El tablero seguía siendo una maqueta con contadores en cero, filtros visuales de estado/chofer y un estado vacío; `GET /api/pedidos` sólo filtraba por estado y estado de validación.

Cambios y archivos:
- `backend/src/repositories/PedidoRepository.js`: `listar` acepta `cliente`, `fechaDesde` y `fechaHasta`; busca cliente por nombre, DNI, teléfono o email y, si el texto tiene dígitos, también por DNI/teléfono normalizados. Las fechas se comparan por día completo e inclusivo con `created_at >= ?` y `created_at < DATE_ADD(?, INTERVAL 1 DAY)`. El orden pasa a fecha de creación descendente y luego id descendente.
- `backend/src/controllers/pedidos.controller.js`: `esquemaListar` valida `cliente` (máximo 150), `fecha_desde`/`fecha_hasta` como días `AAAA-MM-DD` reales y rechaza un rango invertido con `400` y el campo afectado. El controlador traslada los filtros al servicio.
- `frontend/src/pages/PedidosListadoPage.jsx`: reemplaza la maqueta del tablero por el listado real. Muestra contadores sobre el total, filtros de estado/cliente/desde/hasta, tabla con pedido, fecha, cliente, dirección, estado, validación y acción «Ver»/«Revisar», y estados de carga, error, vacío sin pedidos y vacío con filtros.
- `frontend/src/components/pedidoListado.js`: helpers de presentación para parámetros de filtros, detección de filtros activos, resumen de estados, dirección visible y fecha local. No accede a la API.
- `frontend/src/pages/PedidosListadoPage.css`: ajustes de filtros y tabla del tablero; reutiliza las clases visuales existentes.
- `frontend/src/App.jsx`: la ruta `/` usa `PedidosListadoPage`; se retiraron del tablero el filtro de chofer y el botón de agrupamiento de envíos lejanos de la maqueta, porque asignación y agrupamiento pertenecen a otros alcances.
- Pruebas: 5 casos backend nuevos (consulta por estado/cliente/fechas, listado sin filtros, traslado del controlador, fechas inválidas/rango invertido y HTTP con filtros/400) y 6 frontend nuevos (parámetros, filtros activos, resumen, dirección, fecha y contrato de `listarPedidos`).
- Documentación: `frontend/specs/listado-pedidos.md`, `docs/pantallas.md`, `docs/arquitectura.md` y este apartado.

Criterios cumplidos: el listado sin filtros devuelve todos los pedidos; los filtros por estado, cliente y rango de fechas se combinan con AND y usan SQL parametrizado. El cliente se encuentra por nombre, DNI con o sin puntos, teléfono o email. El rango es inclusivo por día; una fecha inexistente, con formato inválido o un rango invertido responde `400` con el campo afectado. La pantalla muestra contadores reales sobre el total, tabla y accesos al detalle; los estados vacíos distinguen «sin pedidos» de «sin coincidencias». Sin token responde `401` y el chofer `403`. Backend 125/125, frontend 30/30, lint y build de Vite OK; smoke real: filtros por nombre, DNI con puntos, estado, fechas y combinación, además de 400 y guardas de rol, con limpieza de los datos sintéticos.

No cumplidos / límites: no se probó en navegador ni con Docker; no hay prueba de interacción DOM ni verificación visual responsive, así que la pantalla se acredita con pruebas de funciones puras, lint, build y smoke de API. No hay paginación ni exportación. El filtro de fecha se interpreta en la zona horaria de MySQL/servidor, que no se normaliza en esta tarea. Los contadores «entregados o pagados» agrupan ambos estados sin afirmar que sean equivalentes; la definición de entrega y acreditación de pago sigue en D04/D09. D08 (obligatoriedad del DNI) y D11 (fusión de duplicados) siguen abiertos. El acceso visual a la demo remota sigue pendiente (D15).

Siguiente paso: punto 6 cerrado y aceptado por el usuario. Corregir los hallazgos de presentación de la validación geográfica que surgieron al probarlo (apartado siguiente). No hacer commit, push, merge ni deploy sin pedido explícito.

## Corrección de la validación geográfica en la carga (21/10/2026)

Estado: implementado y verificado técnicamente en frontend, con smoke real contra MySQL 8.0 local y el proveedor Nominatim; probado por el usuario el 21/10/2026, que confirmó que el mapa ya muestra calles y reportó los dos ajustes del apartado siguiente. Sin cambios de esquema, `database/init.sql`, backend ni contrato API. Responsable: Julián (pedido del equipo) sobre la rama `feature/clientes-registro-pedidos-duplicados`. Sin commit, push ni deploy. Verificación en [verificación](verificacion.md).

Motivo: al probar el punto 6, el usuario reportó que al guardar un pedido el mapa Leaflet se actualizaba pero no mostraba calles, que no entendía qué hacía «Geocodificar dirección», que «Confirmar ubicación y habilitar despacho» parecía bloqueado aunque los pedidos se creaban, y que «Cargar otro pedido» actualizaba los campos.

Diagnóstico: el defecto visual del mapa estaba en `MapPreview`: convertía `latitud` y `longitud` con `Number()`. Para un pedido recién guardado, ambas columnas son `null`, y `Number(null)` devuelve `0`; el mapa se montaba en el océano (0,0) en lugar de mostrar el estado sin coordenadas. La geocodificación y la confirmación del backend funcionaban: una dirección real devuelve un punto y habilita la confirmación; una dirección inexistente deja el pedido `PENDIENTE` y la confirmación responde `409`. Guardar crea un borrador `EN STOCK` por diseño (D09 pendiente), por eso el pedido existe aunque la dirección no esté confirmada.

Cambios y archivos:
- `frontend/src/components/mapa.js`: helper `coordenadasDeMapa()` que rechaza `null`, `undefined`, texto vacío, valores no numéricos y coordenadas fuera de rango. Acepta explícitamente `0,0` cuando el dato existe; no confunde el origen con un dato faltante.
- `frontend/src/components/MapPreview.jsx`: usa el helper, muestra el placeholder «Sin coordenadas todavía» cuando corresponde y recentra el mapa cuando cambian las coordenadas. La URL de teselas pasa a `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.
- `frontend/src/pages/PedidosCargaPage.jsx`: `puedeConfirmar` se calcula con los estados `VALIDA`/`CON_ADVERTENCIAS` (regla posteriormente restringida a `VALIDA` en la integración final); el panel explica el estado, muestra un bloque de resultado de la búsqueda (preciso, aproximado, sin resultados o error), aclara que la búsqueda no confirma por sí sola, indica que guardar crea un borrador, renombra la acción a «Buscar dirección en el mapa» y ofrece un enlace a la revisión para corregir la dirección. «Cargar otro pedido» remonta `ClienteSelector` para borrar también su búsqueda interna y muestra «Formulario limpio».
- `frontend/src/pages/PedidoRevisionDetallePage.jsx`: usa la misma etiqueta y ayuda para la búsqueda, y explica por qué la confirmación puede estar deshabilitada.
- `frontend/src/pages/Pedidos.css`: estilos para la ayuda, el bloque de resultado y la nota de guardado.
- `frontend/src/components/mapa.test.js`: 4 casos sobre coordenadas faltantes, inválidas, fuera de rango y el origen explícito `0,0`.
- `frontend/specs/pedidos-carga-revision.md`, `docs/pantallas.md` y `docs/verificacion.md`: criterios y evidencia de la corrección.

Criterios cumplidos: un pedido guardado sin coordenadas muestra el placeholder y no un mapa en (0,0); una búsqueda precisa o aproximada muestra el punto y habilita «Confirmar ubicación y habilitar despacho»; sin resultados o con error no se inventan coordenadas, se muestra el motivo y la confirmación sigue bloqueada; la confirmación humana deja `CONFIRMADA` y `direccion_validada = 1`; «Cargar otro pedido» limpia los campos controlados y la búsqueda del selector. Frontend 34/34, lint y build OK, `npm run check` exit 0; smoke real: borrador `PENDIENTE` sin coordenadas, geocodificación real con punto y confirmación exitosa, y dirección inexistente con `ZERO_RESULTS`, sin coordenadas y confirmación `409`. Tesela de OSM `200 image/png`; Nominatim respondió `OK` para una dirección real y `ZERO_RESULTS` para una inexistente.

No cumplidos / límites: el usuario confirmó visualmente que el mapa ya muestra calles; no se probó visualmente el bloque de resultado, el recentrado ni el viewport móvil. No hay prueba de interacción DOM, así que el mapa y los textos se acreditan con la prueba de la función pura, lint, build, revisión de código y smoke de API. El mapa depende de Internet para cargar teselas y Nominatim tiene límites de uso. La creación de un borrador antes de validar sigue siendo el comportamiento vigente; exigir la geocodificación para crear el pedido sería un cambio de alcance que requiere definición (D09). D08 y D11 siguen abiertos.

Siguiente paso: el usuario confirmó que el mapa ya muestra calles; quedan los ajustes de búsqueda automática y estado visual del botón, registrados a continuación. No hacer commit, push, merge ni deploy sin pedido explícito.

## Ajuste de búsqueda automática y estado del botón de confirmación (21/10/2026, aceptado 22/10/2026)

Estado: implementado y verificado técnicamente en frontend; probado y confirmado por el usuario el 22/10/2026. Sin cambios de esquema, `database/init.sql`, backend ni contrato API. Responsable: Julián (pedido del equipo) sobre la rama `feature/clientes-registro-pedidos-duplicados`. Sin commit, push ni deploy. Verificación en [verificación](verificacion.md).

Motivo: al probar la corrección anterior, el usuario confirmó que el mapa ya muestra las calles, pero reportó que era tedioso tocar «Buscar dirección en el mapa» manualmente después de guardar, y que el botón «Confirmar ubicación y habilitar despacho» seguía viéndose deshabilitado aunque ya se podía clickear y confirmaba correctamente.

Diagnóstico: la búsqueda sólo se disparaba desde el botón; el guardado no la iniciaba. El estado lógico del botón era correcto para la regla de ese momento (`disabled` dependía de `VALIDA`/`CON_ADVERTENCIAS`; la integración final lo restringió a `VALIDA` con coordenadas), pero `App.css` tenía `.confirm-button` con `background: #9bb5f5` y `cursor: not-allowed` para todos los estados. Por eso un botón habilitado conservaba la apariencia de deshabilitado. No era un problema del backend ni de la confirmación.

Cambios y archivos:
- `frontend/src/pages/PedidosCargaPage.jsx`: la búsqueda se extrajo a `buscarDireccion(id)`. Después de crear el pedido (incluida la creación tras confirmar un duplicado), se ejecuta automáticamente con el id devuelto, sin bloquear el alta: si la búsqueda falla, el pedido ya está guardado y se informa «El pedido se guardó, pero no se pudo buscar la dirección». El botón «Buscar dirección en el mapa» queda para reintentar. Mientras busca, el panel muestra «Buscando la dirección en OpenStreetMap…» y deshabilita las acciones que podrían pisar el resultado.
- `frontend/src/components/MapPreview.jsx`: acepta `buscando` para mostrar el estado de búsqueda en el placeholder, en lugar de pedir una acción manual mientras la búsqueda automática está en curso.
- `frontend/src/App.css`: `.confirm-button` ahora se ve azul y con cursor de acción cuando está habilitado; sólo `:disabled` usa el azul claro, el cursor bloqueado y sin sombra. Esto corrige la apariencia sin cambiar la lógica de habilitación.
- `frontend/src/pages/Pedidos.css`: los botones deshabilitados del panel geográfico se atenúan y muestran cursor bloqueado.
- `frontend/specs/pedidos-carga-revision.md`, `docs/pantallas.md` y `docs/verificacion.md`: criterios y evidencia del ajuste.

Criterios cumplidos: al guardar un pedido, la búsqueda en OpenStreetMap comienza sin una segunda acción del operador. El botón manual sigue disponible para reintentar. Si el proveedor devuelve un punto, el botón de confirmación se ve azul y habilitado; si no hay punto o hay error, sigue deshabilitado y atenuado. La confirmación sigue siendo humana y no se habilitó el despacho automáticamente. Frontend 34/34, lint y build OK; `npm run check` exit 0 con backend 125/125. La búsqueda automática y el cambio visual se acreditan con revisión de código y build; no hay prueba de interacción DOM.

No cumplidos / límites: el usuario confirmó visualmente el 22/10/2026 que la búsqueda automática y el estado visual del botón funcionan en el flujo de carga. No se probó en viewport móvil. No hay prueba automatizada de que el guardado dispare la búsqueda ni del color computado del botón, porque el proyecto no tiene arnés de componentes ni de estilos. La búsqueda automática depende de Nominatim y de la red; si falla, el pedido permanece guardado como borrador y el botón permite reintentar. D08, D09 y D11 siguen abiertos.

Siguiente paso: módulo de seis puntos cerrado funcionalmente y aceptado en el flujo probado. Quedan las decisiones abiertas D08, D09 y D11 y la verificación visual pendiente de los puntos 1 a 4; no hacer commit, push, merge ni deploy sin pedido explícito.

## Integración con los aportes de MVP-1 (22/10/2026)

Al rebasar la rama sobre origin/MVP-1 se incorporaron los aportes de validación, problemas de dirección y Georef. Los apartados siguientes conservan el registro de ese trabajo y deben leerse junto con la integración final de los seis puntos.

## Validación y normalización de direcciones en el flujo de pedidos (continuación de T04/T05, 20/10/2026)

Estado: completada en backend y pruebas. Responsable: agente OpenCode. Sin commit, push ni deploy. Sin cambios de esquema.

Motivo: el validador y el normalizador existían como módulos aislados; la creación y edición de pedidos seguía guardando `PENDIENTE` y el proveedor de geocodificación podía cambiar el estado. El despacho seguro necesita que el estado lo decida el validador y que las coordenadas no sobrevivan a una corrección de la dirección.

Cambios y archivos:
- `services/PedidoService.js`: `prepararDireccion` compone `direccion_original` con el texto crudo, normaliza los campos estructurados y recién después pasa faltantes a `null`. `crear` y `actualizarDireccion` validan, guardan el estado del validador y devuelven `problemas`. La comparación de cambios usa la dirección guardada y la nueva ya normalizadas.
- `repositories/PedidoRepository.js`: `crear` recibe `estado_validacion`; `actualizarDireccion` siempre escribe ese estado y descarta coordenadas y confianza ante cualquier cambio relevante; `registrarGeocodificacion` dejó de escribir el estado.
- `services/GeocodeService.js`: sólo geocodifica direcciones `VALIDA` (conflicto accionable para `PENDIENTE`, `CON_ADVERTENCIAS` y `CONFIRMADA`, con el mensaje "Esta dirección ya está confirmada." para esta última); el resultado del proveedor sólo guarda coordenadas y confianza. `confirmar` exige `VALIDA` con coordenadas.
- `test/pedidos.test.js`: actualizados los casos de creación, invalidación, geocodificación y confirmación; nuevos casos de normalización, abreviaturas equivalentes, dirección legacy y corrección de una `VALIDA` ya geocodificada.

Decisión: si un pedido `CONFIRMADA` recibe la misma dirección escrita distinto (por ejemplo `av. corrientes`), conserva la confirmación y las coordenadas. Si hay un cambio relevante, descarta coordenadas y confianza siempre, aunque el pedido no estuviera confirmado, porque pertenecen a la versión anterior de la dirección. Registrado en D10.

Evidencia (detalle en `docs/verificacion.md`): `npm.cmd --prefix backend test` 101/101; sin pruebas contra MySQL ni el proveedor real.

Límites y observación pendiente: el frontend todavía habilita confirmar con `CON_ADVERTENCIAS` y no muestra la lista `problemas`; se dejó fuera de esta tarea. Esta limitación quedó resuelta en la integración final: sólo `VALIDA` con coordenadas habilita Geocodificar y Confirmar, y la carga/revisión muestran `problemas`. No se probó el flujo completo contra contenedores.

Siguiente paso: mostrar `problemas` en las pantallas de carga/revisión, habilitar confirmar sólo con `VALIDA` y probar el flujo contra MySQL/Docker.

## Problemas de dirección visibles en carga y revisión (continuación de T04/T05, 20/10/2026)

Estado: completada. Responsable: agente OpenCode. Sin commit, push ni deploy. Sin cambios de esquema ni dependencias nuevas.

Motivo: el backend ya devolvía `problemas` al crear y editar la dirección, pero el frontend no los mostraba y todavía habilitaba Geocodificar/Confirmar con estados que el servidor rechaza. La pantalla de carga tampoco ofrecía un camino directo para corregir una dirección guardada con problemas.

Cambios y archivos:
- `backend/src/services/PedidoService.js`: `obtener` calcula `problemas` con `validarDireccion` sobre la dirección guardada y los devuelve junto con el pedido; no se persisten ni alteran `estado_validacion`.
- `backend/test/pedidos.test.js`: dos pruebas nuevas para `obtener` (dirección incompleta y dirección válida), verificando que no se escriben datos.
- `frontend/src/components/direccion.js`: helpers `tieneCoordenadas`, `motivoGeocodificar` y `motivoConfirmar`.
- `frontend/src/components/ProblemasDireccion.jsx` (nuevo): lista accesible de problemas, ERROR en rojo y ADVERTENCIA en amarillo.
- `frontend/src/components/DireccionForm.jsx`: resalta el campo afectado (`campo-error`/`campo-advertencia`) y lo asocia a la lista.
- `frontend/src/pages/PedidosCargaPage.jsx` y `PedidoRevisionDetallePage.jsx`: muestran los problemas, toman los del alta/edición/lectura, deshabilitan Geocodificar salvo `VALIDA`, exigen `VALIDA` con coordenadas para Confirmar, explican el motivo y, en la carga, agregan "Corregir dirección" hacia `/pedidos/:id/revision`.
- `frontend/src/pages/Pedidos.css`: estilos de la lista, bordes de campo, motivo y botones deshabilitados con la paleta existente.
- `frontend/src/api/client.test.js`: prueba del mensaje seguro de un `409`; `mensajeError` ya lo mostraba, no hizo falta cambiar el cliente API.
- Spec y docs: `frontend/specs/pedidos-carga-revision.md`, `docs/arquitectura.md`, `docs/pantallas.md`, `docs/verificacion.md`.

Evidencia: backend `npm test` 103/103 y lint de frontend OK. `npm test` del frontend y `npm run build` no pudieron ejecutarse porque `vitest` y `react-router-dom` están declarados pero no instalados en `frontend/node_modules`; es una limitación previa del entorno, no de estos cambios.

Límites: no se probó en navegador, contra MySQL/Docker ni con Nominatim. Después de guardar en la carga el formulario sigue bloqueado; la corrección se hace desde el detalle de revisión, ahora con acceso directo.

Siguiente paso: probar el flujo completo en navegador contra los contenedores (carga con problemas → Corregir dirección → corregir → geocodificar → confirmar) y restablecer las dependencias de frontend declaradas para poder correr Vitest y el build.

## Provincias y localidades con Georef (continuación de T04/T05, 20/10/2026)

Estado: completada en backend, frontend y pruebas con Georef simulado. Responsable: agente OpenCode. Sin commit, push ni deploy. Sin cambios de esquema ni dependencias nuevas.

Motivo: provincia era texto libre y localidad no tenía ayuda, así que se podían cargar jurisdicciones inexistentes o localidades de otra provincia. Se separó el catálogo de provincias y se agregó una consulta informativa a Georef sin debilitar la regla de oro: nunca bloquea el despacho ni convierte al validador en una llamada de red.

Cambios y archivos:
- Backend: `src/constants/provincias.js` (24 jurisdicciones, variantes, tabla CPA y `normalizarProvincia`), `src/lib/texto.js` (normalización compartida), `src/georef/localidades.js` (cliente con timeout y errores clasificados), `src/services/LocalidadService.js` (sugerencias y verificación), `src/controllers/localidades.controller.js`, `src/routes/{provincias,localidades}.routes.js`. `ValidadorDireccion` y `NormalizadorDireccion` importan el catálogo nuevo y el validador sigue reexportando `normalizarProvincia`. `PedidoService` suma `LOCALIDAD_NO_ENCONTRADA` / `LOCALIDAD_NO_VERIFICADA` como ADVERTENCIA al crear y editar, con `localidades` opcional para no romper usos existentes. `config/env.js` agrega `georef` (`GEOREF_BASE_URL`, `GEOREF_TIMEOUT_MS`); `container.js` permite inyectar el cliente y `app.js` monta `/api/provincias` y `/api/localidades`.
- Frontend: `src/api/localidades.js`; `DireccionForm.jsx` con `<select>` de provincias y `<datalist>` de localidades con debounce y descarte de respuestas tardías; `Pedidos.css` con estilos de error/advertencia para `select`; spec `frontend/specs/direcciones-provincia-localidad.md`.
- Pruebas: `backend/test/localidades.test.js` (cliente, servicio y endpoints con fetch simulado) y `backend/test/pedidos-localidad.test.js` (advertencias sin ERROR).
- Docs: `arquitectura.md`, `pantallas.md`, `decisiones.md` (D21), este apartado y `verificacion.md`.

Decisiones aceptadas por el usuario: `/api/provincias` público como `/api/estados`; localidades sólo ADMINISTRADOR y OPERADOR; las advertencias se calculan al guardar, no al leer; `localidades` queda opcional en `PedidoService`.

Evidencia (detalle en `docs/verificacion.md`): `npm.cmd --prefix backend test` 125/125; `npm.cmd --prefix frontend run lint` OK; `npm.cmd --prefix frontend run build` OK (148 módulos). Los tests existentes de validador, normalizador y pedidos pasaron sin cambios.

Límites: no se llamó a Georef real ni se probó contra MySQL/Docker o navegador. No se agregó caché ni límite de uso propio; el timeout es de 3 s por defecto y el navegador nunca consulta Georef. `docker-compose.yml` no reenvía `GEOREF_*`; la configuración se toma de `backend/.env`, igual que las variables de geocodificación actuales.

Siguiente paso: probar en navegador la carga con provincia y sugerencias contra los contenedores y, si hay red, verificar una localidad real de Georef sin datos personales.

## Cierre de la integración en la rama (22/10/2026)

Estado: rebase sobre `origin/MVP-1` completado y seis puntos integrados con los aportes de validación/normalización, problemas de dirección, provincias/localidades y Georef. Sin cambios de esquema, `database/init.sql` ni dependencias nuevas. Responsable: agente OpenCode, con autorización del usuario para commit, push y PR.

Cambios de integración:
- `backend/src/services/PedidoService.js`: combina la validación y normalización del target con canales de origen, problemas de localidad, detección de duplicados y `problemas` al leer. La regla final es la del target: sólo una dirección `VALIDA` permite geocodificar y confirmar; `CON_ADVERTENCIAS` exige corregir primero.
- `backend/src/container.js` y `backend/src/config/env.js`: inyectan `localidades` y `ventanaDuplicadosHoras`; `GEOREF_TIMEOUT_MS` usa `leerEnteroPositivo` y se conserva la configuración de duplicados.
- `frontend/src/pages/PedidosCargaPage.jsx`: conserva clientes, canal, duplicados y búsqueda automática, y suma `ProblemasDireccion`, el enlace «Corregir dirección», provincia/localidad y los motivos de los botones deshabilitados. La búsqueda automática sólo se dispara con `VALIDA`.
- `frontend/src/pages/PedidoRevisionDetallePage.jsx`: usa la versión del target con problemas, provincia/localidad y motivos de los botones.
- Pruebas: la suite del target queda en `backend/test/pedidos.test.js`; las pruebas propias de los seis puntos quedan en `backend/test/pedidos-modulo.test.js`. Se actualizaron los fakes de `pedidos-localidad.test.js` y `pedidos.test.js` para `buscarCandidatosDuplicados`.
- Documentación: D21 queda para provincias/localidades y D22 para canales de origen; arquitectura, pantallas, spec de carga/revisión y verificación se combinaron sin revertir ninguno de los dos aportes.

Evidencia ejecutada: `npm run check` desde la raíz exit 0 (contexto y 7 skills OK, sintaxis backend OK, backend 165/165, lint frontend OK, build OK con 157 módulos); `npm --prefix frontend test` 35/35. El build emite el warning preexistente de chunk mayor a 500 kB.

Límites: no se ejecutó MySQL, Docker, navegador, Nominatim real ni Georef real en esta integración; no hay prueba de interacción DOM ni de estilos computados. El PR queda pendiente de abrir contra `MVP-1`; no se hizo merge ni deploy.

Siguiente paso: publicar la rama, abrir el PR contra `MVP-1` y resolver la revisión del equipo. Las decisiones D08, D09 y D11 siguen abiertas.

## Geolocalización, confirmación y corrección (módulo Sabrina, 23/10/2026)

Estado: implementado en la rama `feature/sabrina-geolocalizacion`, basada en `origin/MVP-1`.

- Georef se selecciona por `GEOCODER_PROVIDER` (valor inicial `georef`), con timeout configurable, caché de consultas iguales por cinco minutos, hasta diez candidatos, y manejo de sin resultados, timeout, límite HTTP 429 y otros errores.
- `GoogleProvider` queda preparado, pero la fábrica rechaza activarlo: la pantalla actual dibuja resultados sobre Leaflet/OpenStreetMap y guarda coordenadas en MySQL; los términos vigentes de Google prohíben usar sus resultados con mapas no Google y limitan la retención. Ver D06 y la spec `frontend/specs/geolocalizacion-confirmacion.md`.
- `POST /api/pedidos/:id/geocodificar` admite `indice_candidato`; primero muestra candidatos, y solo guarda la opción seleccionada como coordenada revisable. Historial conserva cada consulta.
- `POST /api/pedidos/:id/rechazar-ubicacion` registra el rechazo del operador y vuelve al formulario de dirección. Guardar cambios vuelve a normalizar/validar y descarta coordenadas viejas; se permiten reintentos sin límite.
- La pantalla muestra la dirección enviada, confianza, mapa, elección de candidato e historial. `Confirmar ubicación` mantiene la única vía a `CONFIRMADA` y `direccion_validada = true`. `EstadoPedidoService.puedeDespacharse` sigue bloqueando `EN ENVÍO` sin `CONFIRMADA`.
- `S:\Proyectos\ppp\Practicas-Pre-Profesionales-1-Grupo-9` ya tenía un checkout Git; se creó una rama de trabajo separada de la rama de prototipo y se basó en MVP-1.

Verificación local: `npm run context:check`, la comprobación de sintaxis del backend, `git diff --check` y el lint del frontend pasaron. Los tests del backend no iniciaron seis archivos porque faltan paquetes locales (`bcryptjs`, `jsonwebtoken`, `express`); el frontend build se detuvo al resolver `react-router-dom`, también ausente. Falta probar Georef real, MySQL y el flujo visual. No se modificó el esquema y no existe endpoint de asignación a choferes (pertenece al módulo de Benjamín); todo cambio a `EN ENVÍO` que pase por el servicio de estados sí aplica el bloqueo.

Próximo paso: revisión del PR por el equipo. Acordar si Google queda fuera del MVP1 o si se incorpora mapa Google con política de borrado a 30 días.
## Reparación de base local para MVP-1 (22/10/2026)

Estado: completada. El error al abrir Cliente frecuente se debía a que el backend de MVP-1 consultaba una base con otro esquema: faltaban codigo_origen/domicilio en clientes y varias columnas/estados de pedidos y direcciones.

Se creó la base separada `mandatodo_mvp1` en el MySQL existente, se aplicó `001_esquema_inicial.sql` y se ejecutó el seed. Se copiaron las cuentas compatibles existentes (nombre, email, hash, rol y activo), conservando sus accesos. No se importaron clientes ni pedidos anteriores: requieren un mapeo explícito. La base anterior y el volumen permanecen intactos.

Cambios: `.env` y `backend/.env` locales apuntan a la base nueva; sus copias previas están en `temp/env-antes-mvp1.txt` y `temp/backend-env-antes-mvp1.txt`, ignoradas por Git y con secretos: no compartirlas. `docker-compose.yml` monta `./database:/database:ro` para que el runner encuentre las migraciones desde `/app/scripts`. No hay commit, push ni cambio de init.sql.

Recuperación: restaurar los archivos de entorno desde esas copias y recrear solamente el backend con `docker compose up -d --no-deps backend` vuelve a conectar con la base anterior, cuyo esquema seguirá siendo incompatible con esta rama. No borrar bases ni volúmenes. Cambiar de rama no cambia el esquema MySQL.

Aceptación: HTTP real autenticado, GET clientes 200; POST cliente sintético 201; POST pedido 201 con estado de dirección VALIDA; GET detalle y listado de pedidos 200. Quedan cliente y pedido sintéticos (pedido id 1). Pruebas en Docker: backend 125/125, frontend 7/7, lint y build OK. El token de prueba fue generado internamente con una cuenta activa: no se verificó login desde navegador, ni geocodificación/confirmación real.

Límites: el check raíz en host sigue bloqueado por copias de skills desactualizadas; las dependencias del host están incompletas. Se verificó dentro de los contenedores con sus dependencias instaladas. El tablero sigue siendo maqueta y no acredita los pedidos guardados; consultarlos en Revisión de direcciones. Próximo paso: recargar navegador y probar con una cuenta habitual.

## Recuperación del acceso administrador (22/10/2026)

Pedido explícito del usuario: restablecer solo la contraseña de admin@mandatodo.com usando SEED_ADMIN_PASSWORD del entorno local. Se actualizó el hash de una cuenta activa ADMINISTRADOR en mandatodo_mvp1; sin modificar otras cuentas ni la base anterior. No se registran secretos.

Corregido backend/src/middleware/errorHandler.js: AppError hereda message de Error; devolver error.mensaje omitía el texto y la UI mostraba un error genérico. Se agregó una aserción HTTP en backend/test/auth.test.js para exigir el mensaje de credenciales incorrectas. Backend reiniciado; npm test dentro de Docker: 125/125. No se verificó visualmente en navegador.

## Corrección de navegación del chofer (22/10/2026)

Causa: ProtectedRoute devolvía a / a cualquier usuario sin permiso, incluyendo al chofer que no puede entrar a /. LoginPage también podía enviar una sesión existente de chofer a /. Se corrigen ambas redirecciones para usar /chofer y se evita que un operador regrese a /chofer desde el login.

Archivos: frontend/src/auth/ProtectedRoute.jsx, frontend/src/pages/LoginPage.jsx y frontend/src/auth/navegacion.test.jsx. Casos de regresión: chofer rechazado por tablero, recuperación de sesión desde login, operador con destino previo de chofer y renderizado de DriverApp autorizado. La pantalla del chofer conserva datos de maqueta y cambios locales; esta corrección no implementa asignación, entregas ni pagos persistidos.
Verificación ejecutada en Docker: frontend 11/11 pruebas, lint y build OK; git diff --check OK. Incluye cuatro regresiones de navegación/renderizado con redirección simulada; no acredita navegación real de navegador. Recargar /chofer para comprobar visualmente.

## Pantalla en blanco: Vite servía módulos anteriores (22/10/2026)

Reproducido en navegador: administrador entraba, pero chofer terminaba en / con contenido vacío. La respuesta HTTP de /src/auth/ProtectedRoute.jsx todavía contenía `to: "/"` y LoginPage conservaba la redirección anterior pese a que los archivos del checkout estaban corregidos. Vite dentro de Docker no invalidaba los módulos al editar el bind mount desde Windows; compilar y correr tests en procesos separados no actualizaba el servidor de desarrollo.

Se agrega server.watch.usePolling condicionado por VITE_USE_POLLING en frontend/vite.config.js y se habilita esa variable en el servicio frontend de Compose. Se recrea solo frontend para limpiar su caché en memoria y activar la configuración. Esta corrección no cambia la autenticación ni datos de negocio.
Verificado en navegador: se reprodujo el blanco al entrar como chofer antes del reinicio; después, recargar la sesión existente y hacer un login nuevo llevan a /chofer con la pantalla visible. Abrir / con sesión de chofer redirige a /chofer sin errores de consola. GET del módulo de guarda confirma código actualizado. Docker: 11/11 tests frontend, lint y build OK. Los pedidos mostrados siguen siendo de maqueta.

## Benjamín — plan T07 y primer corte (24/10/2026)

Responsable humano: Benjamín. Alcance autorizado: plan de su módulo y comenzar implementación. Skill principal: ppp1-funcionalidad, con reglas de backend/frontend. Trabajo local sobre MVP-1; se preservan las modificaciones de reparación del 22/10. origin/MVP-1 tiene dos commits adicionales (ec5239d/0f153f8) con clientes/listado; no se hizo pull/merge ni commit. Coordinar la integración antes de publicar y conservar estos arreglos locales.

Plan de entregas:
1. Asignación segura y consulta propia del chofer (implementada en este corte): administrador/operador lista pedidos y choferes activos, asigna/reasigna/quita antes del despacho; chofer consulta únicamente pedidos propios EN ENVÍO con dirección CONFIRMADA.
2. Preparar/despachar/entregar: acordar con Santiago cómo exponer transiciones sin saltear EN PREPARACIÓN; conservar EstadoPedidoService como fuente de reglas, transacción con historial y verificación de chofer activo/confirmación al despachar. Después implementar entrega propia con confirmación UI, fecha/usuario y rechazo de repetición. No está implementado todavía.
3. Pago: cerrar D04 (quién acredita transferencias y cómo pasa a PAGADO), formulario método/monto y permisos, persistencia atómica y rechazo de duplicados; pruebas de celular y flujo completo. No está implementado todavía.

Decisión del primer corte (revisión del equipo pendiente): asignar no cambia estado. El reparto de ppp1-mvp1 decía asignar y pasar a EN ENVÍO, mientras el servicio vigente exige EN STOCK → EN PREPARACIÓN → EN ENVÍO. No se saltean transiciones ni se define acreditación. Reasignación posterior al despacho queda bloqueada hasta definir su regla.

Contrato y criterios: frontend/specs/asignacion-chofer.md. Sin tablas nuevas, sin modificar init.sql ni datos de negocio existentes. Se reutilizan chofer_id e historial_estados (mismo estado anterior/nuevo con observación de cambio de chofer).

Archivos del corte: backend/src/repositories/AsignacionRepository.js (SQL y transacción con bloqueo), services/AsignacionService.js (reglas y pertenencia), routes/asignaciones.routes.js (rutas/validación/permisos), container.js y app.js (registro), test/asignaciones*.test.js (reglas, HTTP y MySQL opt-in). Frontend: api/asignaciones.js y test, pages/AsignacionesPage.jsx y CSS, pages/ChoferPedidosPage.jsx, App.jsx (rutas/navegación) y auth/navegacion.test.jsx. DriverApp anterior queda como referencia, ya no es la ruta activa.

Verificación: backend 134 aprobadas, 1 integración MySQL omitida por defecto; esta última se ejecutó aparte y pasó 1/1 en mandatodo_test_asignaciones, una base aislada creada con el runner existente. Comprueba concurrencia de dos asignaciones iguales sin duplicar historial, persistencia, reasignación/desasignación, rollback real ante fallo inyectado y aislamiento entre dos choferes. Conserva fixtures sintéticos sólo en esa base. No se usa para probar geocodificación ni confirmación humana.

Comandos: docker compose exec -T backend npm test; npm.cmd --prefix backend run check (host, OK); docker compose exec -T frontend npm test (14/14), npm run lint y npm run build. Para MySQL: docker compose exec -T -e DB_NAME=mandatodo_test_asignaciones -e ASIGNACIONES_MYSQL=1 backend node --test test/asignaciones-mysql.test.js (requiere base aislada previamente migrada).

Límites de checks preexistentes: npm run check raíz se detiene por copias Claude desactualizadas de ppp1-mvp1; backend npm run check dentro del contenedor no encuentra /scripts/check-backend.mjs (scripts raíz no está montado), se ejecutó sintaxis desde host. No se modifican herramientas de contexto en esta tarea.

Navegador real: login de administrador → /asignaciones muestra pedidos reales y bloquea dirección sin confirmar; recarga y catálogo de choferes OK. Login chofer → /chofer muestra nombre de sesión y vacío real sin entregas ficticias, sin errores de consola observados. Estado vacío revisado a 390x844; tarjetas pobladas y asignación con clic no se probaron en navegador para no cambiar pedidos existentes. Persistencia y mutación cubiertas en MySQL aislado.

Siguiente paso: integrar los dos commits de compañeros preservando cambios locales, revisar este corte con Santiago/Julián y avanzar con preparación/despacho/entrega. Tu explicación para defensa: el navegador envía pedido y chofer; el servidor verifica rol, bloquea pedido/dirección, valida estado/confirmación y chofer activo, y guarda asignación e historial en una transacción. Al consultar como chofer, la identidad sale del token y el filtro de pertenencia se aplica en SQL.

## Planificación visual de MVP1 (25/10/2026)

Pedido del usuario: investigar herramientas gratuitas y crear planificación visual con estado, responsable y dependencias para todo el equipo. Se compararon GitHub Projects, Zoho Projects, ClickUp, Trello y Asana en fuentes oficiales. Se eligió GitHub Projects por integrarse al repositorio y ofrecer tablero/tabla/roadmap y dependencias en Free.

Se creó https://github.com/users/Benjabb2005/projects/1, con vistas Tablero general y Por responsable. Se crearon y asignaron 44 issues (#8–#51): 33 tareas de módulo, 4 decisiones abiertas y 7 pruebas/integración. Asignaciones verificadas desde el selector del repositorio: Santiago→filipelisanti, Julián→julianramos42, Tomás→TomasLaruina, Sabrina→Dinaitos, Benjamín→Benjabb2005. No se inventaron cuentas ni fechas.

Estados iniciales técnicos propuestos: 17 Pendiente, 7 En progreso, 20 Hecho, según código/documentación de origin/MVP-1 ec5239d. Cada responsable debe confirmarlos. Hecho no acredita aceptación integral del MVP. Las automatizaciones predeterminadas del proyecto cierran como completed los issues movidos a Hecho.

Rectificación del apartado anterior: el usuario aclaró que quería revisar el plan antes de implementar. El borrador local T07 adelantado por el asistente no está aprobado ni se atribuye como trabajo aceptado de Benjamín; B01–B06 se dejan Pendiente. No se modificó código de producto ni se retiraron borradores en esta tarea.

Fuente y copia local: docs/planificacion-mvp1.json y docs/planificacion-mvp1.md. Se verificó que las 44 IDs son únicas, que las 98 dependencias refieren a IDs existentes y que el grafo no tiene ciclos. Las dependencias indican requisitos de integración/cierre, no impiden trabajo independiente en paralelo. Cantidad de tarjetas no mide esfuerzo; las transversales conservan un coordinador.

Las tareas incluyen Depende de, aceptación y evidencia. Se cargaron relaciones mediante el editor nativo de GitHub; la verificación tras recargar detectó selecciones no persistidas y relaciones auxiliares incompletas. No se presentan las 98 como nativas verificadas: el mapa completo y las descripciones son la referencia. El tablero y su agrupación por responsable sí se verificaron guardados. El proyecto permanece privado; no se enviaron invitaciones de acceso a compañeros/profesor. El dueño puede habilitarlos desde Settings → Manage access.

La integración GitHub rechazó crear issues con 403 Resource not accessible by integration; se utilizó la UI con la sesión del usuario, sin cambiar permisos de la integración. No hubo commit, push, merge ni modificación de datos de negocio.

Mapa completo publicado como documento de consulta separado (no se cuenta dentro de las 44 tareas): https://github.com/Benjabb2005/Practicas-Pre-Profesionales-1-Grupo-9/issues/52. Contiene los 44 nodos, 98 flechas y enlaces a cada issue. Guía del proyecto enlaza este documento. Se verificó publicación y que no está añadido como tarea al proyecto.
La vista Por responsable se verificó agrupada al recargar usando el enlace con parámetro groupedBy[columnId]=Assignees. GitHub sigue mostrando Unsaved changes en esa configuración: compartir el enlace completo con el parámetro, no afirmar que la agrupación predeterminada quedó guardada. El tablero general sí conserva sus tres estados y los 44 elementos.

## Pull y planificación (25/10/2026)

Pull --ff-only de de12d0e a f87f6e1: PR #6 (Julián) y #7 (Sabrina). Cambios locales respaldados en stash codex-respaldo-antes-pull-mvp1-20261025 y restaurados, conservando ambos registros en conflictos documentales. Sin commit ni push; no se implementó ninguna tarea nueva de Benjamín.

Planificación actualizada a Georef y evidencias nuevas, sin inferir actividad ni aceptación: 44 Pendiente hasta confirmación de responsables. Q/X son propuestas a validar. Primera tarea B01: revisar asignación versus despacho con Santiago, CONFIRMADA y transiciones existentes.

Verificación: git diff --check, sintaxis backend y lint frontend pasan. Check raíz detenido por copia Claude ppp1-mvp1 desactualizada. Docker apagado. Backend host: 70 pasan, 7 archivos fallan por dependencias ausentes (bcryptjs), 1 omitida. Frontend test no inicia por vitest ausente y build falla por react-router-dom ausente. Sin prueba de MySQL, proveedor real ni flujo visual; no se acredita regresión del merge con estos fallos de entorno.

## Auditoría para cierre técnico de tareas (25/10/2026)

El usuario autoriza marcar Hecho por comprobación de implementación completa y funcionando, sin inferir actividad actual de compañeros. Se revisa checkout f87f6e1 con reparaciones/borradores locales conservados. No se implementó producto nuevo ni se aprobaron B01–B06.

Resultado: 22 Hecho, 22 Pendiente, 0 En progreso. Hecho: S02, S03, S05, S07, J01, J02, J03, J04, J05, J06, T01, T02, T03, T04, T05, T06, R01, R02, R04, R05, R06, R07.

Evidencias ejecutadas: Docker Compose levantado sin borrar datos/volúmenes; MySQL mandatodo_mvp1 disponible, 8 tablas y 1 migración registrada. Backend npm test: 174 pasan, 0 fallan, 1 integración opt-in omitida. Frontend npm test: 42/42; lint y build pasan (warning chunk mayor de 500 kB). Logs locales ignorados: temp/pruebas-backend-auditoria.log y temp/pruebas-frontend-auditoria.log.

Auditoría HTTP/MySQL: temp/auditoria-mvp1.cjs, ejecutada por stdin dentro de backend, base fija mandatodo_test_asignaciones. Crea usuarios/clientes/pedidos sintéticos y limpia exclusivamente sus IDs. Verifica usuarios alta/edición/listado; login correcto/incorrecto/me y 403 chofer; clientes CRUD/búsqueda/DNI repetido/advertencias/baja restringida; pedidos guardados/recarga/duplicados con confirmación/listado filtrado; Georef real, rechazo, confirmación humana, edición equivalente conserva confirmación, cambio de altura descarta coordenadas y confirmación, reintento y registros CONFIRMO/RECHAZO asociados al usuario. No toca datos de negocio de desarrollo.

Proveedor: dirección pública Av. Corrientes 1234, CABA, respondió APPROXIMATE con confianza MEDIO. Además auditoría en memoria del adaptador Georef: caché de consulta idéntica, dos candidatos, HTTP 429/503, ZERO_RESULTS y timeout pasan. Son pruebas del adaptador activo, distintas de geocode.test.js que todavía prueba Nominatim anterior.

Navegador: login de administrador, tablero real con pedidos, formulario de carga y mapa Leaflet con punto e historial de un pedido confirmado; lecturas sin modificar pedidos existentes. No se publican datos personales ni capturas de esas pantallas en GitHub. S02/S07 también se apoyan en evidencia previa documentada de migración/seed e importación real idempotente (apartados 13/10), no reejecutada sobre desarrollo.

No cerradas: S01 requiere consolidar reparaciones locales y arranque reproducible para equipo; S04 permisos de entrega/pago aún sin flujo completo; S06 decisiones de transición y operaciones completas pendientes; R03 falta verificar selección múltiple/corrección de ubicación de punta a punta en UI; R08 no tiene integración final con despacho/asignación. B01–B06 conservan borrador previo no aprobado, faltan acciones reales de despacho/entrega/pago y prueba móvil integral. Q01–Q04 y X01–X07 siguen propuestas/decisiones/pruebas de integrantes pendientes; esta auditoría del asistente no acredita pruebas cruzadas realizadas por ellos.

Límite adicional: check raíz sigue bloqueado por copia Claude ppp1-mvp1 desactualizada; sintaxis backend, suites, lint/build se verificaron por separado. No commit ni push.

## B01 — Asignación manual autorizada y verificada (25/10/2026)

Pedido explícito de Benjamín: implementar pantalla y API de asignación manual y explicar cómo ver los cambios. Se revisó y completó el borrador previo sobre MVP-1 f87f6e1; B01 queda Hecho localmente. B02–B06 siguen pendientes y no se acredita su implementación completa.

Backend: AsignacionRepository conserva SQL parametrizado, selección de choferes activos y transacción con bloqueo de pedido/dirección/chofer. AsignacionService devuelve puede_asignar, motivo_bloqueo y puede_quitar en listado y guardado, usando CONFIRMADA y estados previos al despacho. El PUT vuelve a validar aunque se eluda UI; asigna sin adelantar estado y registra historial una sola vez por cambio. Endpoints GET /api/asignaciones, GET /api/asignaciones/choferes, PUT /api/asignaciones/:id para administrador/operador. Sin cambios de esquema ni nueva máquina de estados.

Frontend: /asignaciones, menú «Asignar choferes», tarjetas con pedido/cliente/dirección/estado/chofer, indicadores habilitados/bloqueados/choferes activos y filtro. Motivos de bloqueo y enlace a revisar dirección. Guardar requiere elección válida y cambio real; controles bloqueados durante escritura, éxito tras respuesta del servidor y error con reintento. Se conserva quitar/reasignar del borrador antes del despacho, sin cerrar B02. Contrato actualizado en frontend/specs/asignacion-chofer.md.

Verificación real: backend 175/175 y una MySQL opt-in omitida por defecto; frontend 42/42, lint y build OK (warning chunk >500 kB). Sintaxis backend y git diff --check pasan. MySQL opt-in ejecutada aparte: 1/1, persistencia/concurrencia/idempotencia/rollback; se añadió limpieza limitada a fixtures de esa ejecución. Auditoría HTTP real temp/b01-http-mysql.cjs en mandatodo_test_asignaciones: flags, asignación, nueva lectura persistida, historial sin duplicados, 403 chofer, 409 dirección sin confirmar, rechazo de otro rol/inactivo y exclusión del catálogo. Fixtures propios limpiados, desarrollo intacto. Logs temp/b01-backend.log y temp/b01-frontend.log.

Navegador real: /asignaciones carga 4 pedidos (2 habilitados/2 bloqueados) y 2 choferes activos del entorno. Filtro reduce a los habilitados; elegir chofer habilita Guardar. Se restableció selección sin escribir sobre pedidos existentes. Revisado a viewport angosto (319 px): tarjetas/controles caben en layout mínimo global de 320 px. No se acredita prueba exhaustiva de todos los estados visuales ni prueba poblada de /chofer.

Límite preexistente: npm run check raíz detenido por copia Claude ppp1-mvp1 desactualizada; verificaciones técnicas se ejecutaron por separado. No commit, push ni cambios de datos del usuario. Para ver: iniciar como administrador/operador → menú Asignar choferes → elegir uno de los pedidos con dirección confirmada y chofer activo → Guardar asignación → Actualizar/recargar comprueba persistencia. Asignar no despacha.

## Vista compacta de asignaciones (25/10/2026)

A pedido de Benjamín se mantiene el apartado independiente y se compacta su presentación. AsignacionesPage agrupa datos del pedido con etiqueta discreta y acciones breves (Asignar/Ver dirección); Asignaciones.css usa filas con datos, selector y acciones en escritorio, adaptación apilada en móvil, espacios menores, tipografía jerarquizada, contadores en una línea y controles bloqueados atenuados. Sin cambiar API ni reglas de asignación.

Lint y build frontend en Docker pasan (warning preexistente de chunk >500 kB). Revisión visual real del navegador angosto de 319 px: resumen y tarjetas compactos; filtro y selección siguen operativos, sin escribir en pedidos existentes. Vista de escritorio no revisada visualmente en esta sesión; CSS usa tres columnas y adapta a dos/una. No se agregan pruebas de negocio por ser cambio visual.

## Modal de dirección y publicación del módulo Benjamín (25/10/2026)

Pedido explícito: reutilizar el patrón modal de branch-benjamin-1, crear branch con nombre coherente al equipo y publicar cambios. Referencia leída: frontend/src/Orders.jsx (DetailModal nativo con showModal) y Orders.css de origin/branch-benjamin-1. Ver dirección ahora abre dialog dentro de /asignaciones; reutiliza PedidoRevisionDetallePage con pedidoId opcional, manteniendo su ruta independiente. Botón de cierre, Escape y fondo; foco devuelto al disparador, scroll de fondo bloqueado/restaurado y recarga de asignaciones al cerrar. Sin copiar contratos antiguos ni cambiar API de geolocalización.

Verificación: 42 pruebas frontend, lint y build Docker pasan; warning de chunk grande preexistente. Navegador real: abrir pedidos confirmados/no confirmados, cerrar con Escape y botón, URL /asignaciones estable y foco devuelto al botón correcto. No se modificaron pedidos existentes. Persistencia/API de B01 conservan verificación previa. Cierre por fondo implementado, no probado por clic en esta sesión; escritorio no revisado visualmente.

Branch creada desde MVP-1 f87f6e1: feature/benjamin-asignacion-entregas; nombre cubre próximas entregas del módulo sin exigir branch por tarjeta. Publicación autorizada por el usuario, sin merge a MVP-1. Se separan reparaciones locales de acceso/entorno y asignación/documentación. Se conserva la base local de consulta propia del chofer; B02–B06 siguen pendientes, no se acreditan entrega/pago ni el cierre de B03 por incluir ese borrador. No se incluyen .env, contraseñas, respaldos ni archivos temporales.

## Separación de mapa e información (25/10/2026)

A pedido de Benjamín se reemplaza Ver dirección por Ver mapa y Más información, según el patrón OrderMapLink y DetailModal de branch-benjamin-1. Modales de consulta independientes: mapa/estado de confirmación por un lado; cliente, contacto, dirección, estado, canal y notas por otro. Ambos usan obtenerPedido y contemplan carga/error/reintento. Sin cambios de backend ni escritura; editar/confirmar continúa en Revisión de Direcciones.

Lint y build Docker pasan, con warning preexistente de chunk grande. Navegador real: Información contiene 12 campos y ningún mapa; Mapa contiene un Leaflet y ningún campo del detalle; URL /asignaciones estable, cierre por botón y Escape. Sin cambios de pedidos. Esta modificación queda local sobre feature/benjamin-asignacion-entregas; no se hizo un nuevo commit/push en este pedido.

## Tema oscuro y menú sin subrayado (25/10/2026)

Autorizado por Benjamín: recuperar tema de branch-benjamin-1 y pushear todo a feature/benjamin-asignacion-entregas. Se copiaron theme.js, ThemeToggle.jsx y Theme.css desde origin/branch-benjamin-1, adaptando selectores para MVP-1. Conserva paleta, luna/sol, localStorage mandatodo-theme, preferencia del sistema, aplicación antes de render y sincronización storage entre pestañas. Fallback sin window/matchMedia y tolerancia a storage bloqueado. Selector en lateral, login y cabecera chofer. Menú lateral sin subrayados conservando estado activo.

Adaptados formularios, tablas y modales actuales, incluidos Ver mapa y Más información. Esta publicación incluye esa separación pendiente del pedido anterior. Sin cambios de API ni datos de negocio. Spec frontend/specs/tema.md.

Verificación: 46 pruebas frontend (4 nuevas de tema) aprobadas, lint y build Docker pasan (warning preexistente de chunk >500 kB). Navegador real: alternancia claro/oscuro y persistencia al recargar; tarjeta/modal con fondo RGB 34,37,43 y texto 237,240,244; los seis enlaces laterales devuelven textDecorationLine none. Probado modal de información en oscuro y retorno al listado, sin escribir pedidos. No se acredita prueba visual exhaustiva de todas las pantallas/desktop. Se conserva límite preexistente del check raíz por copia Claude ppp1-mvp1 desactualizada.

## B02 — Preparación, despacho y cambio de chofer (25/10/2026)

Autorizado por Benjamín: levantar Docker e implementar segunda tarea. Estados de Santiago conservados; preparación EN STOCK → EN PREPARACIÓN y despacho EN PREPARACIÓN → EN ENVÍO. Reasignar cambia chofer y Quitar chofer deja null, solo antes del despacho como ya establecía B01; después del despacho se rechazan ambos. Entrega y pago siguen en B04/B05; Q01 y las demás decisiones de equipo no se declaran cerradas. Spec frontend/specs/despacho.md.

API PUT /api/asignaciones/:id/estado, cuerpo estricto con estado EN PREPARACIÓN o EN ENVÍO, administrador/operador. Reutiliza validarTransicion de EstadoPedidoService. AsignacionRepository vuelve a leer y bloquear pedido/dirección/chofer en la misma transacción de UPDATE e historial. Despacho exige CONFIRMADA y usuario CHOFER activo. Repetición/concurrencia responde conflicto sin duplicar historial; fallo de historial revierte estado. El servicio devuelve puede_preparar/puede_despachar/motivo_despacho.

UI /asignaciones: encabezado Asignación y despacho, secuencia de los cinco estados, botones Preparar/Despachar, etiqueta Reasignar cuando ya hay chofer, Quitar chofer y confirmación de despacho con pedido/chofer/dirección. Evita cambios de estado mientras hay selección de chofer sin guardar. Estado y botones se actualizan al responder el servidor. Modal cancelable con Escape y Cancelar; no permite cerrar/enviar doble mientras guarda.

Verificación: backend 178 pasan, 0 fallan, 1 opt-in omitida por defecto; frontend 47/47, lint y build OK (warning preexistente de chunk >500 kB). MySQL opt-in 1/1: reasignación/desasignación, rollback real, concurrentes preparación/despacho con una sola escritura e historial, rechazo de dirección cambiada/chofer inactivo, aislamiento de consulta propia y cambios posteriores bloqueados; fixtures propios limpiados. HTTP/MySQL aislado temp/b02-http-mysql.cjs: administrador prepara, operador despacha, consulta propia chofer y nueva lectura persisten, saltos/ENTREGADO-PAGADO/rol chofer/cuerpo inválido rechazados. Sin modificar pedidos del usuario. Logs ignorados temp/b02-backend.log, temp/b02-frontend.log. Navegador real: login y pantalla con Preparar, Reasignar y Quitar chofer según datos vigentes; no se pulsaron mutaciones sobre pedidos existentes. Despacho por clic con pedido sintético en UI queda sin verificar; API y persistencia sí probadas. Check raíz mantiene bloqueo preexistente de copia Claude ppp1-mvp1 desactualizada.

Puerto Docker: 3306 local ocupado por proceso 3980. Se usó override temporal sin publicación y después, por pedido explícito, se cambió docker-compose.yml a MYSQL_HOST_PORT:-3307. .env.example y README documentan localhost:3307 para host y mysql:3306 interno. docker compose up -d confirma mysql healthy y 3307→3306; no se detuvo MySQL local, borraron datos/volúmenes ni cambiaron credenciales. Para iniciar normalmente usar docker compose up -d sin override.

B02 queda implementada y verificada técnicamente en la branch local feature/benjamin-asignacion-entregas. No se hizo commit ni push en este pedido. B03–B06 siguen pendientes.

## Colores de estados en asignaciones (25/10/2026)
Pedido de Benjamín: distinguir Bloqueado de En envío. Bloqueado usa rojo, En envío azul y habilitados/entregados/pagados conservan verde, con variantes claras/oscuras. Se corrige la clase compartida que hacía que los pedidos enviados usaran el color de bloqueo. Lint y build frontend Docker pasan; warning de chunk grande preexistente. Cambio visual local, sin nuevas pruebas de negocio ni push.

## Sesión visible en carga y asignaciones (25/10/2026)
Se elimina display:none del bloque profile en móvil y se mueve bajo el logo, antes de la navegación, para mantenerlo visible sin depender del pie del lateral. Sidebar recibe el usuario completo y muestra nombre real (email como alternativa), rol y botón textual Cerrar sesión; reutiliza logout y redirección existentes. Cambio compartido entre todas las rutas de administrador/operador. 47 pruebas frontend, lint y build Docker pasan (warning preexistente de chunk grande). Navegador real verifica profile visible y botón en /asignaciones y /form, sin modificar pedidos; no se cerró la sesión del usuario durante esta comprobación. Cambio local sin push.

## Rectificación visual de sesión (25/10/2026)
Benjamín rechaza ubicar el perfil bajo el logo. Se restaura al pie del lateral con avatar/nombre/rol y botón de icono centrado, como antes; en móvil queda una barra inferior y se reserva espacio para que no tape contenido. Se ajusta la altura del sidebar al escalado de escritorio preexistente para que su pie no quede fuera del viewport en páginas largas, sin modificar el escalado global. Lint y build pasan. Navegador angosto: pie termina en y=672 igual al alto visible; avatar y botón comparten centro vertical y cierre de sesión accesible. No se probó visualmente escritorio en esta sesión. La nota anterior de perfil bajo el logo queda superada. Cambio local sin push.

## Contraste de clientes y login oscuro (25/10/2026)
Pedido de Benjamín: clientes guardados poco legibles y login con paleta distinta. Theme.css aplica explícitamente texto claro a td y texto secundario a th en Clientes; ajusta confirmación/baja y éxito. Login oscuro comparte fondo general #17191e, panel de marca #0c1b30 como sidebar, campos #22252b y texto #edf0f4, incluido autofill. Lint/build pasan (warning preexistente chunk grande). Navegador real: clientes td RGB237,240,244 sobre tarjeta34,37,43; login fondo23,25,30 y marca12,27,48; autofill con sombra interior34,37,43. Sesión de prueba restaurada tras verificar login; no se cambiaron datos de clientes. Cambio local sin push.

## Publicación del cierre B02 (25/10/2026)

Benjamín autoriza pushear B02 con información de cambios y actualizar la tabla; luego explicar B03 sin implementarla. Resumen de entrega y verificaciones/límites en docs/entrega-b02.md. Se publican B02 y ajustes solicitados de puerto/colores/sesión/contraste en feature/benjamin-asignacion-entregas, separados en commits revisables. Las notas anteriores de cambios locales quedan superadas una vez verificado el push. B02 Hecho y B03–B06 Pendiente; Q01 conserva coordinación del equipo pendiente.

## Vinculación de commits y tickets (25/10/2026)

Por pedido de Benjamín, se actualizaron los mensajes de los seis commits publicados para incluir (#35) o (#36), Refs y el enlace al ticket. Se preservaron los árboles de archivos, autoría y fechas; cambian los identificadores. Respaldo local: backup/benjamin-antes-vincular-tickets-20261025. Push con force-with-lease contra el SHA remoto esperado, no se sobrescribieron cambios ajenos. Descripciones de #35/#36 contienen enlaces directos a sus commits; GitHub muestra enlaces al ticket dentro de cada commit.

| Anterior | Actual | Ticket |
| --- | --- | --- |
| 3ff0823 | 8c6c987 | #35 |
| ed317b9 | e0b7eff | #35 |
| ee02d46 | cc2cd7a | #35 |
| f2763ef | 164807b | #36 |
| c6653b9 | 3e241c7 | #36 |
| a9d0576 | a58901a | #36 |

Los SHA anteriores en registros históricos de esta documentación están superados por esta tabla. Para las próximas tareas, incluir el ticket correspondiente en cada mensaje de commit y actualizar los enlaces del ticket al publicar; no usar Closes hasta que se pretenda cerrar por merge. No se implementa B03 en esta tarea.

## Réplica de planificación en Jira (25/10/2026)

Por pedido de Benjamín se copiaron las 44 tareas de GitHub Projects al proyecto KAN de benjabb2005.atlassian.net: KAN-4 a KAN-47. Correspondencia completa en migracion-jira-mvp1.json. Se conservaron KAN-1, KAN-2 y la subtarea KAN-3 existentes. Importación inicial confirma 44 creadas: 24 Finalizado y 20 Por hacer; ninguna tarea migrada se marcó En curso. KAN-2 conserva su estado En curso previo.

Cada descripción incluye responsable, origen, dependencias por ID, aceptación, evidencia/límites y enlace al issue GitHub. B01/B02 incluyen sus commits publicados. Q/X mantienen la aclaración de propuestas de planificación. Segunda importación por claves existentes: 44 actualizadas, 0 creadas y exactamente 98 enlaces Blocks creados, sin WARN/ERROR; se verificó en KAN-32 la dirección blocks/is blocked by. Son dependencias de integración/cierre, no prohibición de trabajo independiente.

Campo de texto Responsable TP y etiquetas por integrante permiten identificar a los cinco responsables sin crear cuentas ni enviar invitaciones. B01–B06 (KAN-31 a KAN-36) y X04 (KAN-44) asignadas a la cuenta existente Benjamin Abbatiello, verificadas en lista. El resto conserva Assignee sin asignar hasta disponer de cuentas verificadas; el responsable académico sí está cargado. Vista List guardada para el espacio con Work, Assignee, Status, Responsable TP y Linked work items. Captura local ignorada temp/jira-mvp1.png. No se configuró sincronización automática GitHub/Jira ni se reescribieron commits para agregar claves KAN. Sin cambios de aplicación, commit o push en esta tarea.

## B03 y paginado de listas (26/10/2026)

Benjamín autoriza levantar Docker, implementar B03 y paginar todos los listados. Spec frontend/specs/chofer-paginacion.md y entrega completa en docs/entrega-b03.md. Se completa búsqueda/actualización/reintento y presentación móvil del chofer sobre la API propia existente. Paginado compartido 5/10/20 para todos los listados de registros, incluidos frecuentes, duplicados, candidatos e historial; opciones fijas de formularios y menú no se paginan. Se eliminan topes silenciosos de clientes. Paginado en memoria, no de servidor; no cambia el contrato API ni el esquema.

Docker activo y health HTTP/DB OK. Frontend 51/51, backend 178 pasan/1 MySQL opt-in omitida, lint/build/sintaxis OK; warning de bundle grande previo. Check raíz bloqueado por copia Claude ppp1-mvp1 desactualizada, sin tocarla. Navegador chofer vacío a 360px claro/oscuro sin desbordes; no había envíos propios para comprobar tarjetas pobladas. Recorrido interactivo del paginado con 23 registros sintéticos, filtro y cambio de tamaño correcto; harness temporal retirado sin insertar datos. Jira KAN-33 En revisión y descripción actualizada con evidencia/límites. GitHub #37 conserva estado anterior hasta revisión/publicación. Cambios locales sin commit/push; B04/B05 no se implementaron. Se preservaron las modificaciones documentales de migración Jira que ya estaban al empezar.

## Asignaciones y auditoría Jira (26/10/2026)

Benjamín confirma que invitó a sus compañeros y autoriza asignar los tickets. Se verificaron las cinco cuentas asignables de KAN y se completaron 20 asignaciones faltantes. Consulta posterior confirma 44/44 responsables correctos: Santiago Filipeli 13, Sabrina Villano 10, Benjamin Abbatiello 7, tomaslaruina06 7 y Julián Ramos 7 (incluyen coordinación y pruebas propuestas Q/X). Comparación contra migracion-jira-mvp1.json: 44 IDs únicos, sin faltantes ni duplicados; 98 dependencias Blocks exactas, sin enlaces faltantes ni adicionales. KAN-1, KAN-2 y KAN-3 son registros previos ajenos al inventario MVP y se preservaron. No se modificaron estados en esta auditoría.

## Limpieza de ejemplos Jira (26/10/2026)
Con confirmación explícita del borrado irreversible, se eliminaron KAN-1 Task 1, KAN-2 Task 2 y KAN-3 Subtask 2.1. Consulta posterior completa del proyecto: 44 tickets, todos MVP1; ninguno de los tres ejemplos permanece. Las tareas del equipo se conservaron.

## Seguimiento simultáneo Jira y GitHub Projects (26/10/2026)

Benjamín pide usar ambos tableros mientras el equipo aprende a trabajar con tickets y evalúa cuál prefiere. En adelante, cada avance, cambio de estado, cierre y publicación debe reflejarse en el ticket correspondiente de Jira KAN y en el issue/GitHub Project del MVP. Usar la correspondencia docs/migracion-jira-mvp1.json; conservar enlaces al código y la evidencia/límites en ambos. La actualización es manual, sin sincronización automática configurada. No abandonar ninguno hasta nueva indicación del usuario, ni inferir actividad de compañeros. Si uno no puede actualizarse por acceso o error, informar cuál quedó pendiente.

## Corrección de seguimiento B03 en GitHub (26/10/2026)
Se corrige la omisión señalada por Benjamín: issue #37 pasa de Pendiente a En progreso en GitHub Projects y la descripción incorpora implementación local, evidencia, límites y enlace a Jira KAN-33. GitHub no tiene columna En revisión: En progreso cubre revisión/integración pendiente y equivale al En revisión de Jira en este caso. Guardado y estado verificados tras recargar. Sin commit/push.

## Ajustes visuales B03 y paginado fijo (26/10/2026)
Se revisó el reparto antes de implementar: cabecera/mapa de lectura del chofer pertenecen a B03; R03 de Sabrina conserva geocodificación, selección y confirmación sin modificaciones. Paginado/sidebar son ajustes compartidos explícitos. Paginado fijo 10 sin selector y controles compactos; sidebar trasladado fuera del contenedor escalado para fijarse al viewport, conservando dimensiones visuales. Cabecera del chofer azul marino, Ver mapa interno con consulta protegida propia y Google Maps separado. Referencia: OrderMapModal de branch-benjamin-1. Backend intacto en este ajuste.
Verificación: 52 pruebas frontend, lint/build pasan; warning bundle grande previo. Sidebar a 1440x900 conserva top0/bottom900 al bajar639px. Chofer 360px claro/oscuro sin desborde. Paginado con23 registros sintéticos:10 por página sin selector. Diálogo con ID inexistente: rechazo, reintento y Escape correctos. Harness retirado, sin insertar datos. Mapa con pedido propio poblado pendiente por cuenta vacía. Jira KAN-33 conserva En revisión, GitHub #37 En progreso; descripciones actualizadas. Sin commit/push.

## Cabecera compacta del chofer en PC (26/10/2026)
Por pedido de Benjamín, driver-topbar queda centrada con max452px como el contenido móvil. A1440px ambos tienen x494/ancho452. Build pasa, warning preexistente bundle grande. Jira KAN-33 y GitHub #37 registran el ajuste; sin commit/push.

## Corrección de apertura Ver mapa (26/10/2026)
Reproducido cierre inmediato en MapaChofer bajo StrictMode: close del cleanup de efecto queda encolado y desmontaba el diálogo reabierto. onClose ahora verifica !dialog.open antes de avisar al padre. Harness temporal con StrictMode: antes desaparecía; después permanece, cierra con botón/Escape y reabre. ID inexistente, sin modificar datos; mapa propio poblado pendiente. Harness retirado. 52 pruebas frontend, lint/build pasan. GitHub #37 actualizado. Jira KAN-33 pendiente de actualizar por fallo de lectura del conector Atlassian en esta sesión. Sin commit/push.

## Cierre técnico y publicación B03 (26/10/2026)
Benjamín autoriza commit/push y finalizar B03 (#37 / KAN-33). Incluye vista móvil propia, paginado fijo10, mapa interno y corrección StrictMode, sidebar fijo y cabecera compacta. Frontend52/52, lint/build pasan nuevamente. Check raíz conserva fallo preexistente de copia Claude; UI poblada MySQL pendiente registrada, sin afirmar validación integral. Se publica en feature/benjamin-asignacion-entregas con referencias bidireccionales a ambos tickets. B04 sólo se explica, sin implementar.

## B04 entrega/fallo y avance B05 pago (26/10/2026)
Benjamín autoriza implementar B04 y agregar entrega fallida y pago posterior, verificando reparto. Pago pertenece a su B05, no a otro compañero; se registra en ticket separado. Elige explícitamente FALLIDA → EN PREPARACIÓN para revisión del operador, con motivo obligatorio. B04 implementa entrega propia, historial y reintentos idempotentes bajo transacción/bloqueo; B05 registro efectivo/transferencia y monto, único por pedido, sin acreditar ni cambiar a PAGADO (D04/Q02 pendiente). No se modifica módulo S06 ni esquema; conserva controles de nuevo despacho.

Entrega detallada y límites en entrega-b04.md. Backend184 pasan/2opt-in omitidas; frontend53, lint/build y sintaxis pasan. Prueba MySQL real aislada B04/B05 ejecutada aparte y pasa (concurrencia/rollback/persistencia/aislamiento). UI sintética StrictMode360px claro/oscuro y1440px: confirmación, motivo obligatorio, fallo, pago con error/reintento e historial. Harness retirado y MySQL de prueba detenido, desarrollo intacto. No acredita UI+API+MySQL conjunta ni celular físico. Check raíz conserva fallo previo de copia Claude; warning bundle grande previo. Jira KAN-34 En revisión, KAN-35 En curso; GitHub #38/#39 En progreso, comentarios y estados verificados. Cambios locales sin commit/push.

## Ajustes pedidos el26/10/2026: importe, historial y bloqueados
Benjamín pide quitar monto del panel de pago y decide explícitamente dejar pendiente conectarlo al futuro importe del pedido; no modificar carga de Julián ni esquema. AccionChofer sólo permite elegir método, muestra aviso y deshabilita guardado para no inventar un importe ni enviar un pago incompleto. El contrato backend previo con monto se conserva como borrador no conectado; B05 sigue En progreso. Historial muestra estado actual y transiciones reales, sin fechas/usuario/observaciones ni movimientos sin cambio de estado; auditoría DB intacta. Resumen de asignaciones cuenta bloqueados sólo EN STOCK/EN PREPARACIÓN no habilitados: ya no suma EN ENVÍO/ENTREGADO/PAGADO. Caso de regresión mixto54 pruebas frontend; lint/build verificados en Docker. Sin commit/push.

## Historial según branch-benjamin-1 (26/10/2026)
Benjamín rechaza la lista genérica y pide recuperar referencia anterior. Se inspeccionaron DeliveryHistory de DeliveryActions.jsx y su CSS en origin/branch-benjamin-1. Se adapta la línea vertical con tarjetas de Entregado/Intento fallido, fecha de Buenos Aires, responsable y motivo del fallo. Sólo eventos de entrega/intento; no asignaciones, preparación inicial ni pago. Paginado10 conservado. La petición de referencia supera el ajuste anterior de ocultar fecha/usuario. API y auditoría intactas; sin fabricar campos receptor/pago que el evento actual no tiene. Frontend55, lint/build pasan; sin nueva prueba visual en esta corrección. Sin commit/push.

## Ampliación del historial visual (26/10/2026)
Benjamín aclara incluir también cambios de estado con la misma línea vertical de branch-benjamin-1. Ahora incluye creación, preparación, despacho y demás transiciones reales, además de entrega e intento fallido. Título anterior→nuevo para cambios, fecha/autor y motivo de fallo conservados; movimientos sin cambio de estado no se agregan. Paginado10 y auditoría intactos. Frontend55, lint/build pasan. Sin commit/push.

## Etiquetas del historial aclaradas (26/10/2026)
Benjamín aclara que cada entrada muestre sólo estado de destino: En stock, En preparación, Despachado, Entregado o Pagado; sin anterior ni flecha. Conserva todos los movimientos en línea vertical, fecha/autor y motivo del intento fallido (En preparación · Intento fallido). No cambia estado persistido EN ENVÍO, sólo etiqueta Despachado. Frontend55, lint/build pasan; sin commit/push.

## Publicación B04 y planificación de importe (26/10/2026)
Benjamín autoriza commit/push y actualizar tickets. B04 Hecho; B05 sigue En progreso por importe/acreditación pendientes. Revisadas44 tareas Jira y búsqueda GitHub: sólo B05 menciona monto, sin tarea específica de importe en carga. Se crea B07 (#53/KAN-48), asignada a Benjamín y Pendiente, con aceptación/migración/permisos/pruebas; depende J04/S02 y bloquea integración B05. No se implementan precios ni se duplica el pago. Publicación en feature/benjamin-asignacion-entregas con refs #38/#39 y KAN-34/KAN-35. Verificación vigente: frontend55, backend184/2opt-in omitidas; MySQL aislado pasa aparte; lint/build/sintaxis OK, check raíz falla por copia Claude previa.

## B07 importe/tarifa y giro Caso7 (26/10/2026)
Benjamín autoriza implementar importe manual al cargar, tarifa/km sólo admin, sugerencia pendiente por no tener sucursal/origen y recargo50% por fallo. PDF Caso7 agrega además jornada posterior y facturación del recargo al emisor. Implementación/migración/backup y límites en entrega-b07.md; decisiónD23 y fuentehash en fuentes.md. Cada fallo nuevo suma mitad del base, no compuesto, reenvío no duplica, programa mañana Buenos Aires y bloquea despacho hoy. AntiguosNULL, completar antes de finalizar; total servidor para pago sin monto cliente. Backend187/2opt-in omitidas; frontend57, lint/build/sintaxis OK; MySQL y HTTP+MySQL aislados pasan. Respaldo restaurado y migración002 conservativa ensayada antes de aplicar localmente, runner sin pendientes. UI360 claro/oscuro consultada, sin pedidos sintéticos en desarrollo ni tarifa ficticia. Check raíz copia Claude previa; bundle grande previo. Jira KAN-48 En revisión/GitHub #53 En progreso, B05 continúa por acreditaciónQ02; ambos actualizados. Sin commit/push.

## Despacho manual de reintento (26/10/2026)
Benjamín pide permitir despacho manual aunque próxima visita sea futura. Se elimina bloqueo por fecha del servidor y motivo de UI; se conservan próxima fecha/recargo e invariantes de dirección confirmada, preparación y chofer activo. La fecha no impide la decisión manual del operador. Esta decisión explícita supera la interpretación previa de bloquear hasta mañana. Backend187 pasan/2 opt-in omitidas; prueba unitaria cubre permiso y botón habilitado con fecha futura. Test MySQL opt-in adaptado al despacho manual e historial adicional, no reejecutado en esta corrección. Sin commit/push.

## Publicación B07 y comienzo cierre B05 (26/10/2026)
Benjamín autoriza commit/push B07 y avanzar con B05. B07 se publica con refs #53/KAN-48 y #39/KAN-35; sugerencia por distancia queda diferida explícitamente, despacho manual permitido antes de próxima fecha. Pruebas vigentes backend187/frontend57, lint/build y MySQL aislado pasan, check raíz copia Claude previa. B05 comienza luego de este commit: efectivo al confirmar cobro a PAGADO y transferencia informada hasta acreditación por administrador, conforme propuesta previa al pedido de avanzar. Sin acreditaciones de datos reales por el agente.

## Cierre B05 implementado local (26/10/2026)
B07 publicada62c199d943e2529ba00c41b9de7437b418605e5e con refs #53/KAN-48 y #39/KAN-35; cerrada en ambos tableros. B05 posterior local: efectivo confirmado lleva a PAGADO; transferencia informada requiere acreditación admin activo con confirmación en Más información. Total servidor, transacciones, idempotencia e historial. Sin migración. Backend190/2opt-in omitidas y frontend59 pasan, lint/build/sintaxis OK. MySQL aislado pasa aparte: efectivo/acreditación concurrentes y rollback, despacho manual futuro incluido. UI sintética StrictMode360 claro/oscuro probada; sin acreditar pagos reales ni banco/celular físico/UI+MySQL conjunta. Harness retirado y MySQL prueba detenido. Entrega-b05.md; Jira KAN-35 En revisión y GitHub #39 En progreso, Q02 de Santiago informado sin cerrar. B05 sin commit/push.

## Acción visible y comprobantes B05 (26/10/2026)
Benjamín pide sacar acreditación de Más información y permitir al chofer foto/archivo. Botón Acreditar transferencia en tarjeta admin, confirmación con comprobantes; Más información pago sólo lectura. Chofer adjunta opcionalmente al informar transferencia o luego en Entregados. JPG/PNG/WEBP/PDF5MB, validación real/tamaño/extensión/nombre en servidor; binario privado en tabla comprobantes_pago, sin dependencias ni enlaces públicos. Admin y chofer propio consultan, operador no; sólo chofer propio pendiente sube. SHA256 único por pago evita duplicado, conserva adjuntos previos; PDF descarga autenticada e imagen interna. Pago y carga separados: error de carga permite reintentar sin duplicar pago.
Migración003 ensayada con respaldo restaurado aislado y conservación de pagos verificada; aplicada local y runner sin pendientes. Respaldo ignorado temp/respaldo-antes-comprobantes.sql, no publicar. MySQL/HTTP real aislado pasa bytes exactos, concurrencia/hash, permisos ajeno/operador, acreditación y rechazo nueva carga posterior. Backend193 pasan/3opt-in omitidas en suite; frontend61, lint/build/sintaxis OK. UI sintética StrictMode360: botón tarjeta, galería con PNG sintético, subida/lista/imagen, admin acredita y desaparece acción; no desborde. Harness retirado, sin comprobantes/pagos reales modificados. Límite5MB por archivo y formatos indicados, archivos en DB aumentan tamaño de respaldos; no antivirus ni banco. Sin commit/push, ambos tickets actualizados y B05 sigue En revisión/En progreso.

## Comprobante opcional y pendiente visible (26/10/2026)
Benjamín pide mantener comprobante opcional y marcar pendiente de subir si falta. Selector aclara opcional, sin required; transferencias muestran Comprobante pendiente de subir en chofer, tarjeta admin y detalle hasta contar un adjunto real. El conteo viene de DB, no estado local. Al subir cambia a adjuntado y refresca listado del chofer. Pendiente independiente de acreditación: se permite al dueño adjuntar también en PAGADO, sin cambiar pago; supera restricción anterior de subida sólo antes de acreditar. No aplica efectivo. Backend193/3opt-in omitidas y frontend62, lint/build pasan. Se ajustó prueba antigua que confundía WHERE interno de conteo con filtro de listado. MySQL/HTTP aislado prueba conteos0→1 en chofer/admin/detalle y adjunto posterior a acreditación. Sin migración nueva ni commit/push.

## Asignaciones sin finalizados (26/10/2026)
Benjamín pide limpiar Asignar choferes. Filtro de presentación conserva EN STOCK/EN PREPARACIÓN/EN ENVÍO y ENTREGADO sólo con transferencia pendiente de acreditar; oculta PAGADO y otros entregados. Así admin aún puede acreditar desde botón directo y al confirmar desaparece de la lista. Datos completos siguen en Tablero/chofer. Resumen y paginado se calculan sobre lista activa, sin borrar datos ni cambiar API. Frontend63, lint/build pasan; prueba de regresión con estados mezclados. Sin commit/push.

## Vista previa del comprobante (26/10/2026)
Benjamín pide preview. ComprobantesPedido abre imágenes/PDF dentro del panel (antes PDF sólo descargaba). PreviewComprobante reutilizable muestra nombre, imagen o visor PDF nativo, cierre y descarga; fallback de descarga para navegadores sin PDF embebido. SelectorComprobante muestra preview local al elegir antes de subir. URLs blob locales revocadas al cambiar/cerrar/desmontar, sin publicar archivos ni alterar permisos. Frontend64, lint/build pasan; pruebas de render imagen/PDF y descarga. Sin nueva revisión visual del visor PDF nativo en esta corrección; soporte depende del navegador. Sin commit/push.

## Corrección del PDF en blanco (26/10/2026)
La captura mostraba sólo el selector y el visor nativo quedaba blanco al abrirlo; se verificó en navegador. ComprobantesPedido abre automáticamente el primer adjunto y normaliza MIME, con indicador de carga y descarte de respuestas obsoletas. Se reemplaza object por PDF.js (dependencia pdfjs-dist, worker servido localmente y carga dinámica), canvas con navegación entre páginas y descarga conservada. No transmite documentos a un visor externo. PDF real del pedido6 visible en escritorio y360px sin cambiar pago/archivo; captura local ignorada temp/b05-pdf-visible.png. Frontend en Docker: lint sin advertencias,64 pruebas y build pasan; aviso previo bundle grande. npm audit --omit=dev:0 vulnerabilidades; instalación informa4 de desarrollo, no se actualizaron dependencias ajenas. Los comandos host fallaron por dependencias incompletas (vitest/router); verificación válida realizada en Docker. Sin commit/push.

## Historial separado del chofer (26/10/2026)
Benjamín pide separar entregados con pago confirmado y comprobante. Tres pestañas: En envío, Entregados con pendientes, Historial completo. PAGADO+transferencia requiere comprobante para historial; efectivo confirmado no necesita adjunto según alcance vigente. Clasificación y búsqueda/conteo/paginado sobre vista; no se cambian API/estados/permisos ni datos. Chips diferenciados para entrega, pago por registrar/acreditar/confirmado y comprobante pendiente/adjunto. Al refrescar luego de subir se reclasifica. Prueba de estados mezclados cubre acreditado sin archivo, archivo sin acreditar, efectivo y reclasificación. Docker lint,65 pruebas y build pasan (bundle grande previo). UI sintética StrictMode verificada escritorio y360 claro/oscuro, sin alterar pedidos reales; harness retirado. Captura local ignorada temp/b05-chofer-pendientes.png. Sin commit/push.

## Registro y acreditación diferenciados (26/10/2026)
Benjamín pide colores distintos y consulta si confirmación corresponde al chofer. Sin pago: ámbar Falta registrar el pago; transferencia informada: violeta Esperando acreditación de administración; confirmado: verde. Aviso informativo sin botón de acreditar para chofer. Revisados servidor/UI: acreditar sigue sólo ADMINISTRADOR; OPERADOR no tiene permiso, se informó al usuario sin ampliar acceso silenciosamente. Efectivo conserva confirmación de recepción por chofer conforme regla vigente, distinta de acreditación bancaria. Docker lint/65pruebas/build pasan; UI sintética claro/oscuro revisada, ningún pago real cambiado, harness retirado. Captura ignorada temp/b05-colores-pago.png. Sin commit/push.

## Botones deshabilitados de pago/comprobante (26/10/2026)
Usuario confirma que Adjuntar permanece deshabilitado aun eligiendo archivo. Se separa ocupado de subida del estado cargandoVista: una descarga previa lenta no bloquea elegir/subir archivo. Verificación sintética StrictMode con descarga que nunca resuelve: elegir PNG habilita botón, subida simulada confirma y muestra preview; no guarda datos reales. El cursor wait aplicado a todo botón disabled confundía faltante con carga; ahora not-allowed salvo guardado real. Pago sin importe muestra botón Falta cargar el importe y explica siguiente paso, no asigna precio ni permite pagar sin total. Se detecta y corrige ciclo de bloqueo anterior: completarImporte admite ENTREGADO baseNULL sin pago, conserva PAGADO/base existente/pago como conflictos, recargo/historial transaccionales. Admin/operador desde Asignaciones Más información; lista incluye ENTREGADO sin pago para acceder, PAGADO oculto. Dos tests backend cubren recuperación y rechazos/rollback. Docker backend195 pasan/3 opt-in omitidas; frontend66/lint/build pasan. Sintaxis Docker falla porque /scripts no está montado; se verifica host aparte. No se reejecutó integración MySQL del nuevo caso, no se cambió precio ni pago real. Capturas ignoradas temp/b05-comprobante-sin-bloqueo.png y b05-importe-faltante-claro.png; harness retirado. Sin commit/push.
Verificación posterior: npm --prefix backend run check en host pasa (Sintaxis backend OK); git diff --check sin errores. Backend del nuevo caso cubierto por pruebas transaccionales con adaptador, no MySQL real en este ajuste.

## Publicación B05 autorizada (26/10/2026)
Benjamín autoriza commit/push B05 y detener Docker al terminar. Se agrupan cierre de pago/acreditación, comprobantes privados opcionales con migración003, preview PDF.js, pendientes/historial del chofer, recuperación de importe antiguo y ajustes de interfaz. Refs #39/KAN-35, rama feature/benjamin-asignacion-entregas. Verificaciones finales vigentes backend195/3opt-in omitidas, frontend66, lint/build y sintaxis host OK; MySQL aislado de pagos/comprobantes verificado antes, nuevo caso de recuperación sólo adaptador. Check raíz conserva bloqueo previo copia Claude; npm audit producción0, deuda dev4 y bundle grande registrados. No se incluyen temp/respaldo ni archivos reales. Planificación local B05 Hecho; se vinculará commit en ambos tickets tras push. Detención mediante compose stop, sin eliminar datos/volúmenes.

## Revisión de continuidad y arranque (27/10/2026)

Pedido de Benjamín: recuperar contexto, consultar Jira/GitHub Projects e iniciar Docker. Consulta actual de ambos tableros: B01–B05 y B07 Finalizado/Hecho; pendientes B06 (KAN-36/#40, ensayo móvil integral del chofer) y X04 (KAN-44/#48, prueba cruzada del núcleo de Santiago, bloqueada por dependencias en Projects). Las descripciones y la tabla inicial de planificación conservan estados históricos; no confundirlos con los campos actuales. B05 publicada en fbc3e68; checkout feature/benjamin-asignacion-entregas inicialmente limpio.

Se revisaron AGENTS y skills locales, documentación de contexto, arquitectura, decisiones, tareas, fuentes, verificación y entregas. Docker compose config --quiet y up -d --build ejecutados; tres servicios activos, MySQL healthy en puerto host 3307. GET /api/health devuelve HTTP200 con http/db ok y frontend HTTP200 en 5173. Se conserva advertencia previa DUPLICADOS_VENTANA_HORAS ausente; no se cambia entorno ni se ejecutan migraciones/seed. No se borran datos/volúmenes. No se ejecuta B06/X04 ni se acreditan nuevas pruebas de negocio o celular físico. Próximo paso: B06, recorrido integrado con datos sintéticos y evidencia móvil, persistencia, permisos, entrega y pago; después coordinar X04. Sin cambios de producto, commit/push ni actualización de tickets.

## B06 · pruebas solicitadas y regresión móvil (27/10/2026)

Benjamín pide ejecutar todas las pruebas necesarias. Skill ppp1-verificar; informe en [entrega-b06.md](entrega-b06.md). Check raíz final pasa en host tras skills:sync (copias ignoradas) y npm ci de backend/frontend, sin cambios de manifests/lockfiles. Backend195/0fallos, frontend66/lint/build OK; cuatro integraciones MySQL opt-in ejecutadas aparte y pasan, incluida nueva flujo-chofer-mysql.test.js con login real/roles/IDs ajenos/dirección bloqueada/concurrencia/recargos/acreditación y recuperación real de importe antiguo (8 resultados exitosos padre+7subpruebas).

UI real sobre Compose aislado con fixtures sintéticos: entrega/efectivo, fallo/motivo/recargo, transferencia opcional sin adjunto, preview PNG privado, acreditación admin e historial, mapa/Escape, paginado/búsqueda, recarga, error y recuperación al reiniciar backend. 360×800 claro/oscuro,320×740 y1440×900. Corregido desborde15px a320 por min-width global; después scrollWidth=clientWidth305, escritorio1425. Sin tocar permisos/API/esquema; contenedores de prueba detenidos, desarrollo activo e intacto. Capturas/logs sintéticos en temp ignorado.

Límites: selector de archivo por UI bloqueado por permiso de extensión (no cambiado); subida/duplicados/permisos sí probados por HTTP/MySQL. Sin celular físico ni nueva revisión visual PDF real. Audit detecta backend5 (1crítica/4altas), frontend4altas, detalle informe; no audit fix fuera del alcance. B06 no cerrado automáticamente, X04 no ejecutada como revisión del integrante. Próximo paso humano: galería/selector en celular y revisar resultados; deuda de dependencias requiere remediación separada. Sin commit/push ni mensajes/cambios de tickets.

## Paneles del chofer por IP HTTP (27/10/2026)

Usuario reporta que Ver historial/Ver comprobante y otros botones rompen desde celular por IP. Causa reproducida: AccionChofer ejecutaba crypto.randomUUID al montar cualquier tipo de panel; por HTTP en IP de LAN no existe esa API, aunque sí en localhost. Cinco pruebas nuevas fallaron antes con TypeError y pasan después. Se genera UUIDv4 con crypto.getRandomValues compatible con ese contexto, conservado en useState para reintentos; sólo entrega/fallo requieren identificador, consulta/pago no. Sin Math.random, dependencia nueva ni cambios de contrato/permisos/datos.

Frontend72 pruebas pasan; lint/build pasan. Ensayo real en Brave por IP HTTP y360px confirma isSecureContext=false/randomUUID=undefined: abre/cierra los cinco tipos y Escape/reapertura de historial funcionan bajo StrictMode. API del harness sintética y sin red real, no se mutaron pedidos; harness retirado. Captura ignorada temp/b06-panel-ip-corregido.png. Las pruebas B06 anteriores en localhost no cubrían la diferencia de contexto seguro; no acreditan este caso hasta esta corrección. Sin celular físico ni commit/push.

## Publicación B06 autorizada (28/10/2026)

Benjamín autoriza commit y push en feature/benjamin-asignacion-entregas y solicita instrucciones para abrir PR hacia MVP-1. Corte: regresión HTTP/MySQL del chofer, UUID compatible con HTTP por IP, pruebas de los cinco paneles y corrección de ancho mínimo móvil; informe entrega-b06.md y verificación actualizados. Check raíz ejecutado nuevamente pasa (backend195,4opt-in omitidas por defecto, lint/build/contexto/sintaxis); frontend72 pasan. Cuatro integraciones MySQL aisladas conservan evidencia previa, no reejecutadas en esta publicación. Se excluyen temporales, capturas, respaldos y secretos. Referencias #40/KAN-36 sin cierre automático ni modificación de tickets; límites físicos/selector y deuda de dependencias del informe se conservan. PR/merge no ejecutados: se entrega enlace de comparación e instrucciones al usuario.

## Sucursal para sugerencia de envío — backend (28/10/2026)

Responsable: Tomás Laruina. Tarjeta: KAN-49.

La sucursal única queda guardada en `tarifas_envio`. `GET /api/tarifas` también devuelve sus campos y `PUT /api/tarifas/sucursal` permite configurarla solo al administrador. El servidor normaliza y valida la dirección antes de consultar Georef; una dirección con errores devuelve 400 y un resultado `ZERO_RESULTS` o `ERROR` devuelve 409 sin guardar. Si hay candidatos, se usa el primero y se guardan la dirección informada por Georef, sus coordenadas y el usuario que actualizó la tarifa.

Se agregó `database/migrations/004_sucursal_envio.sql`; no se modificaron `002_importes_tarifas.sql` ni `database/init.sql`. Las pruebas usan repositorio y adaptador falsos, sin MySQL ni Internet. `npm test` ejecutado desde `backend/`: 204 pruebas, 200 aprobadas, 0 fallidas y 4 omitidas por requerir configuración optativa. `npm run check` del backend y `git diff --check` pasan. No se aplicó la migración a una base de datos. La prueba completa no modifica `backend/test/importes.test.js`.

También se ejecutó el check de la raíz: contexto, check, pruebas y lint pasaron, pero el build frontend no pudo resolver `pdfjs-dist` importado por `frontend/src/components/PreviewPdf.jsx`. No se cambió ni instaló nada del frontend porque queda fuera de esta parte.
