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

Credenciales de desarrollo del seed (ya presentes en `.env.example`): `admin@mandatodo.com`, `operador@mandatodo.com`, `chofer@mandatodo.com`, todas con contraseña `Admin123!`.

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

Límites y observación pendiente: el frontend todavía habilita confirmar con `CON_ADVERTENCIAS` y no muestra la lista `problemas`; se dejó fuera de esta tarea. No se probó el flujo completo contra contenedores.

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
