# Verificación y evidencia · 30/09/2026

## Comandos disponibles

Desde la raíz, después de instalar las dependencias de backend y frontend:
```powershell
npm run check
```

Ejecuta en orden y corta ante error:
1. npm run context:check: archivos requeridos presentes y no vacíos, frontmatter y referencias locales de skills, enlaces relativos de la documentación; si hay copias Claude comprueba sincronía.
2. npm --prefix backend run check: sintaxis de archivos JS/CJS/MJS del backend, incluidos tests. **No es un lint semántico.**
3. npm --prefix backend test: node:test, dos smoke tests por HTTP real en puerto efímero, sin MySQL.
4. npm --prefix frontend run lint: ESLint existente.
5. npm --prefix frontend run build: Vite existente.

La raíz no tiene dependencias. No se añadió framework de pruebas ni librería. Separar backend/app.js del arranque permite probar el contrato HTTP sin DB; la respuesta y lógica de conexión de index.js se conservaron. No hay compilación backend porque es JavaScript ejecutado directamente.

`npm run skills:sync` genera adaptadores de Claude; `npm run skills:check` los compara con fuente. La comprobación local no reemplaza la prueba de descubrimiento de cada agente descrita en agentes.md.

## Resultados de la preparación anterior (informe conservado)

Esta tabla ya existía al comenzar la integración del ZIP actualizado; no representa ejecuciones repetidas por esta tarea. En particular, el Git limpio es histórico. La evidencia nueva se registra debajo.

| Verificación | Resultado / alcance |
| --- | --- |
| Git al inicio | Limpio, commit c574c75 |
| Frontend lint y build antes de cambios | Pasaron; Vite 8.2.2, 17 módulos |
| Backend sintaxis y node:test | Pasaron; GET / 200 y ruta inexistente 404, 2 tests |
| Sincronización y comparación Claude | 6 skills generadas y coincidentes |
| Sincronizador en copia temporal | Detecta copias faltantes/desactualizadas, repara copias generadas y rechaza sobrescribir una skill manual; todos los casos pasaron |
| Validador oficial quick_validate.py de skill-creator | Intentado; no pudo arrancar porque el Python disponible no tiene PyYAML. No se instalación globalmente; se usa validación local de formato/referencias |
| Docker Compose version | v5.5.0; requirió salir del sandbox para leer configuración de Docker |
| docker compose config --quiet | Válido; no se imprimieron secretos interpolados |
| docker compose ps | Falló: motor Docker Desktop Linux no disponible |
| Demo remota | Login público observado en navegador; resto solo relevamiento previo del ZIP |
| Excel | Hojas, dimensiones y encabezados revisados; no se importó ni se validó cada fila |
| Agentes nativos | OpenCode 1.18.30 reconoció las 6 skills con debug skill --pure y búsqueda Claude desactivada; conversación nueva en cada producto pendiente |
| npm run check | Pasó completo: contexto, skills, sintaxis, 2 tests, lint y build |
| git diff --check | Pasó sin errores de whitespace; Git informó conversión habitual LF/CRLF en Windows |

No se ejecutaron npm ci, docker compose up, importación SQL/Excel, migraciones ni pruebas con geocodificador. npm ls encontró dos dependencias extraneous de backend; no se cambiaron instalaciones ajenas.

También se intentó usar js-yaml desde dependencias frontend para una comprobación adicional, pero ese módulo no estaba disponible. La validación local restringida y el descubrimiento real de las seis skills en OpenCode sí pasaron; no se presenta el validador oficial como ejecutado con éxito.

## Verificaciones del handoff (30/09/2026, OpenCode)

Ejecutadas realmente en este checkout, con Node v24.15.0 y npm 11.12.1. No se modificó código de negocio.

| Verificación | Resultado |
| --- | --- |
| `git status --short` y `git diff` iniciales | 7 archivos modificados y 25 sin trackear ya presentes; preservados |
| Lectura de los 2 ZIP entregados | Ambos abren; contienen AGENTS.md, LEEME-CODEX.txt, docs/contexto.md y docs/pantallas.md. La versión `(1)` trae un AGENTS.md más extenso (8692 bytes) que la anterior (3600) |
| Rutas locales de una sola PC en documentación | Ninguna; solo URLs públicas y localhost |
| `npm run context:check` | OK, 6 skills |
| `npm run skills:check` | 6 skills verificadas y coincidentes |
| `npm --prefix backend run check` | Sintaxis OK |
| `npm --prefix backend test` | 2/2 pasan: GET / 200 y ruta inexistente 404 |
| `npm --prefix frontend run lint` | Sin errores |
| `npm --prefix frontend run build` | OK, Vite 8.2.2, 17 módulos |
| `npm run check` completo | Pasó de punta a punta |
| Detección negativa del validador de contexto | Se probaron los tres modos de fallo y luego se restauró todo: enlace inexistente inyectado en un doc → `Enlace roto` y exit 1; `docs/fuentes.md` vaciado → `Vacío` y exit 1; `docs/decisiones.md` movido fuera → `Falta` más cuatro enlaces rotos y exit 1. Tras restaurar, `context:check` volvió a OK |
| `opencode debug skill --pure` con `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1` | OpenCode 1.18.33 devolvió las 6 skills de `.agents/skills` más la skill integrada. Descubrimiento nativo comprobado |
| `codex` y `claude` en PATH | No encontrados en esta máquina; compatibilidad documentada, no ejecutada aquí |
| `.env.example` y `backend/.env.example` | Solo nombres de variable con valores ficticios vacíos; sin secretos |
| `docker compose` | No ejecutado en este handoff; sigue pendiente con el resultado anterior |
| `temp/` y `.gitignore` (Hueco 3 de T00b) | `git check-ignore` marca como ignorados los dos ZIP dentro de `temp/`, más un PDF y un PNG de prueba. `git check-ignore` confirma que `abm`, `codigo_prueba`, `datos_tp` y `tmp` ya no están ignorados y que se eliminaron reglas de carpetas que no existen. `git status --ignored` muestra solo `.env`, `.idea`, `node_modules`, `dist`, `.claude/skills` y los ZIP de `temp/` |
| Detección negativa de `temp/.gitkeep` (Hueco 3) | Se movió el archivo: `Falta temp/.gitkeep` y exit 1. Restaurado, `context:check` volvió a OK. Requiere excepción explícita en la comprobación de archivos vacíos, porque está vacío por diseño |
| `npm run check` completo tras T00c | Pasó de punta a punta con los `AGENTS.md` nuevos: contexto y 6 skills, sintaxis de backend, 2/2 tests HTTP, ESLint y build de Vite 8.2.2 |
| Detección negativa de `backend/AGENTS.md` (Hueco 3 de T00c) | Se movió el archivo: `Falta backend/AGENTS.md` y exit 1. Restaurado, `context:check` volvió a OK |
| Escaneo de carpetas externas (Hueco 2 de T00b) | Sin coincidencias de `abm`, `codigo_prueba`, `datos_tp` ni rutas de carpetas vecinas. Las apariciones restantes de "TP" son el nombre de la materia y las de "ABM" el concepto de ABM de Clientes de D07 |
| `git diff --check` | Sin errores de espacios en ningún momento del handoff |

Lo que este handoff NO comprobó: arranque de los 3 servicios, conexión a MySQL, migración o importación, geocodificador real, sesión nueva de Codex o Claude Code, y todo el negocio pendiente de T01 en adelante. La detección de skills de OpenCode prueba descubrimiento del cliente, no que una conversación completa interprete bien el contexto.

## Qué falta probar cuando haya negocio

- Validación de entradas y permiso real en servidor, sesión ausente/inválida y manipulación de ID por otro chofer.
- Despacho rechazado con dirección incompleta, sin confirmación o modificada después de confirmar.
- Persistencia comprobada por guardado/recarga y consulta en base de prueba.
- Rollback de DML ante fallo y restricciones relacionales; no asumir rollback de DDL.
- Migración: dry-run, recuentos por hoja, relaciones, idempotencia y recuperación de respaldo.
- Normalizador/geocodificador: resultados vacíos/ambiguos, timeout, cuotas, respuesta tardía y confirmación humana.
- Frontend: teclado, móvil/escritorio, carga/error/éxito; aún no hay harness de interacción.

No marcar ninguna de estas como aprobada con los smoke tests actuales. Usar fixtures sintéticos; un mock de DB o geocodificación no acredita la integración real.

## Diagnóstico sin pérdida de datos

Comprobar estado de entorno y reproducir primero. Si Docker no responde, iniciar el motor local y repetir config --quiet / ps; no borrar volúmenes. Revisar logs acotados sin publicarlos con datos personales. Si / responde y falla MySQL, recordar que el servidor actual escucha igualmente. Si UI no guarda, no es problema de conexión: todavía no existe integración.

Para resultados nuevos anotar comando, fecha, salida relevante, versión, criterio cubierto y limitación. Evitar registrar contraseñas o filas del Excel.

## Precaución al editar en Windows

`Set-Content`, `Out-File` y `Add-Content` de PowerShell 5.1 reconvierten a UTF-8 con BOM y pueden reinterpretar como ISO-8859-1 los bytes UTF-8 ya presentes, dejando acentos y ñ ilegibles. Para restaurar un archivo usar las herramientas de edición del agente, o `Get-Content -Raw` junto a `[System.IO.File]::WriteAllText($ruta, $texto, [System.Text.UTF8Encoding]::new($false))`. Si aparece un BOM, quitarlo antes de cerrar la tarea. Ningún Markdown del repositorio debe tener BOM.

## Verificaciones del MVP1 (13/10/2026, OpenCode)

Ejecutadas realmente en esta sesión sobre la rama `MVP-1`, con Node v24.20.0 y MySQL 8.4 en un contenedor desechable (`mandatodo_test_mysql`, puerto 3307), independiente del volumen de desarrollo.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Contexto y skills | `node scripts/check-context.mjs` | `Contexto y 7 skills OK` |
| Sintaxis backend | `npm --prefix backend run check` | OK |
| Pruebas backend | `npm --prefix backend test` | 21/21 (HTTP, auth, estados, importación) |
| Lint frontend | `npm --prefix frontend run lint` | Sin errores |
| Build frontend | `npm --prefix frontend run build` | OK, 92 módulos |
| Pruebas frontend | `npm --prefix frontend test` | 6/6 (Vitest) |
| Verificación completa | `npm run check` desde la raíz | Pasó de punta a punta: contexto y 7 skills, sintaxis backend, 21/21 tests, lint y build de Vite |
| Migración | `node backend/scripts/migrate.mjs` | Aplica 001; reejecución: «No hay migraciones pendientes» |
| Seed | `node backend/scripts/seed.mjs` | Crea ADMINISTRADOR/OPERADOR/CHOFER; reejecución no duplica |
| Importación dry-run | `import-excel.mjs --file ... --dry-run` | Clasifica sin escribir |
| Importación aplicar/reejecutar | `import-excel.mjs --file ...` | 1.ª: +2 clientes, +1 pedido, +1 dirección, +1 intento; 2.ª: +0 (existentes); conteos estables |
| Smoke HTTP con MySQL real | backend en `:3010` + `Invoke-RestMethod` | login admin OK; `GET /api/usuarios` = 3; `POST` crea id 4; payload inválido → 400; chofer → 403 |

Límites de esta verificación: el smoke HTTP y la importación usaron la base de prueba, no el volumen de desarrollo; la importación se hizo con un `.xlsx` sintético porque el Excel real no está en `temp/`; no hubo pruebas de navegador (sin harness de interacción/E2E), por lo que la interfaz se acredita con lint, build y pruebas unitarias, no con un flujo real en el navegador. `npm audit` reportó 2 vulnerabilidades altas en el árbol del frontend; no se ejecutó `npm audit fix` para no alterar versiones ajenas.

## Importación real y carga/revisión T04/T05 (14–15/10/2026, OpenCode)

Ejecutadas sobre la rama `MVP-1` con Node v24.20.0. La importación usó el Excel real depositado en `temp/Caso 7 Normalizacion_geolocalizacion.xlsx` contra un MySQL 8.4 desechable (contenedor `mandatodo_test_mysql`, puerto 3307), luego eliminado; no se tocó el volumen de desarrollo.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Importación dry-run (Excel real) | `import-excel.mjs --file temp/... --dry-run` | Clientes aceptadas 11/revisión 1; Pedidos aceptadas 8/revisión 4; Historial aceptadas 12 |
| Importación aplicar (Excel real) | `import-excel.mjs --file temp/...` | clientes +11, pedidos +8, direcciones +8, historial +8 (sinPedido 4) |
| Importación idempotente | 2.ª corrida | +0 en todas las hojas (existentes 11/8/0/8) |
| Pruebas backend T04/T05 | `npm --prefix backend test` | 39/39 (incluye borradores, invalidación D09/D10, geocode ok/aprox/sin resultado/timeout/error y guardas 401/403/200) |
| Lint frontend | `npm --prefix frontend run lint` | Sin errores |
| Build frontend | `npm --prefix frontend run build` | OK, 144 módulos, Vite 8.2.2 |
| Pruebas frontend | `npm --prefix frontend test` | 6/6 (Vitest) |
| Verificación completa | `npm run check` desde la raíz | Pasó de punta a punta; exit 0 |
| Configuración Compose | `docker compose config --quiet` | Exit 0 (con avisos por variables sin `.env`, esperados) |

Dependencias nuevas del frontend: `leaflet@1.9.4` y `react-leaflet@5.0.0` (decisión D06). `npm audit` sigue reportando 2 vulnerabilidades altas preexistentes; no se ejecutó `npm audit fix`.

Límites: no se probó el flujo de carga/revisión contra los contenedores ni contra el proveedor real (Nominatim) por depender de servicios en ejecución y de red; el mapa carga teselas de OSM y requiere Internet en el navegador. No hay pruebas end-to-end de navegador. D09 y D11 siguen pendientes del cliente: sólo se avisan posibles duplicados, no se fusionan.

## Reparación del entorno Docker y smoke real (15/10/2026, OpenCode)

Ejecutado sobre la rama `MVP-1`. Se reactivó el stack de desarrollo conservando el volumen nombrado `mysql_data` (sin `down -v` ni `DROP`) y se probó el flujo real contra los contenedores.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Recuperación de acceso MySQL | `docker exec mandatodo_mysql mysql -uroot -p…` | Root accesible; base `mandatodo` vacía (sin tablas ni usuario de aplicación) |
| Usuario de aplicación | `CREATE USER IF NOT EXISTS … ; GRANT … ON mandatodo.*` | Creado en el volumen existente (el entrypoint no lo crea si el volumen ya está inicializado) |
| Recreación del stack | `docker compose up -d --build -V` | 3 servicios `Up`; MySQL `healthy`; imágenes reconstruidas y volúmenes anónimos de `node_modules` renovados |
| Migración | `npm.cmd --prefix backend run migrate` (desde el host) | Aplicada `001_esquema_inicial.sql` |
| Seed | `npm.cmd --prefix backend run seed` | Creados admin, operador y chofer |
| Login real | `POST /api/auth/login` admin | Token emitido, rol `ADMINISTRADOR` |
| Consultas autenticadas | `GET /api/pedidos`, `GET /api/clientes` con Bearer | `200`, 0 filas (base recién migrada) |
| Backend ↔ MySQL | log del contenedor | `Conexión a MySQL exitosa` |
| Frontend | `GET http://localhost:5173/` | `200` |

Límites: no se ejecutó el flujo completo en navegador (carga → geocodificar → confirmar → revisión) ni la geocodificación real con Nominatim. `npm run migrate` **dentro del contenedor** falla con `ENOENT` porque `database/migrations/` no entra en la imagen ni en el bind mount `./backend:/app`; migración y seed se corrieron desde el host. Queda como observación para decidir si el contenedor debe poder migrar por sí mismo.

## Alta de cliente en la carga manual (15/10/2026, OpenCode)

Ejecutado sobre la rama `MVP-1`, continuando T04. Se agregó el alta de cliente con `POST /api/clientes` para poder cargar pedidos cuando no existe el cliente (la base tenía 0 clientes y la pantalla sólo permitía elegir uno existente). Sin cambios de esquema.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Pruebas backend | `npm.cmd --prefix backend test` | 44/44 (5 nuevas de clientes: normalización de DNI, conflicto por DNI, aviso de teléfono/email sin fusionar, DNI sin dígitos, guardas 401/403/400) |
| Lint frontend | `npm.cmd --prefix frontend run lint` | Sin errores |
| Build frontend | `npm.cmd --prefix frontend run build` | `vite build` OK (146 módulos) |
| Alta real de cliente | `POST /api/clientes` con Bearer de OPERADOR | `201`; id 1, DNI normalizado `30111222` (entró `30.111.222`), `posiblesDuplicados` vacío |
| DNI duplicado real | segundo `POST /api/clientes` con el mismo DNI | `409 CONFLICTO`, no crea |
| Autorización real | `POST /api/clientes` sin token | `401` |
| Pedido con el cliente nuevo | `POST /api/pedidos` con `cliente_id = 1` y dirección estructurada | `201`; pedido id 1 `EN STOCK` / `PENDIENTE` |

El backend del contenedor se reinició (`docker compose restart backend`) para tomar el código nuevo del bind mount antes del smoke.

Límites: el flujo en navegador y la geocodificación real con Nominatim siguen sin ejecutarse. El aviso de duplicados es informativo y no fusiona (D09/D11 pendientes); el DNI duplicado sí bloquea porque identifica al cliente. El smoke dejó datos de prueba en la base de desarrollo: cliente id 1 (DNI `30111222`) y pedido id 1; no se borraron para no usar operaciones destructivas.

## ABM de clientes (20/10/2026, OpenCode)

Ejecutado sobre la rama `feature/clientes-registro-pedidos-duplicados`, con Node v24.21.0. No se modificó el esquema ni `database/init.sql`. La verificación combina servicios, contrato HTTP con base vacía simulada, capa API del frontend y un smoke real contra MySQL 8.0 local (base `mandatodo`, migración `001_esquema_inicial.sql` y seed). No se usó Docker en esta sesión.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Instalación reproducible | `npm.cmd ci --prefix backend` y `npm.cmd ci --prefix frontend` | Lockfiles respetados; no se modificaron versiones. `npm audit` reporta 6 vulnerabilidades en backend (5 altas, 1 crítica) y 2 altas en frontend, preexistentes; no se ejecutó `npm audit fix` |
| Pruebas backend | `npm.cmd --prefix backend test` | 100/100, incluye normalización de DNI/teléfono, conflicto por DNI, aviso de coincidencias sin fusionar, actualización, baja bloqueada por pedidos, baja inexistente, búsqueda por dígitos, mensaje público de `AppError` y guardas 401/403/400 |
| Pruebas frontend | `npm.cmd --prefix frontend test` | 15/15 (Vitest), incluye capa API de clientes, mensaje de conflicto y 3 casos de contacto/precarga del cliente en la carga |
| Lint frontend | `npm.cmd --prefix frontend run lint` | Sin errores |
| Build frontend | `npm.cmd --prefix frontend run build` | OK, 150 módulos, Vite 8.2.2 |
| Verificación completa | `npm run check` desde la raíz | Pasó de punta a punta: contexto y 7 skills, sintaxis backend, 100/100 tests, lint y build de Vite; exit 0 |
| Preparación MySQL local | `npm.cmd run migrate` y `npm.cmd run seed` en `backend/` | Base `mandatodo` creada vacía; migración `001_esquema_inicial.sql` aplicada; usuarios admin/operador/chofer creados sin imprimir contraseñas |
| Arranque nativo | `npm.cmd start` en `backend/` | `Servidor funcionando en http://localhost:3000` y `Conexión a MySQL exitosa` |
| Smoke ABM real | App Express con pool MySQL local en puerto efímero: health, login, listado, alta, DNI repetido, edición y baja | Health 200; login 200; listado inicial 200 con 0 clientes; alta 201; DNI repetido 409; edición 200; baja 204; listado final 200 con 0. Cliente de prueba eliminado |
| Mensajes 409 reales | Repetición del alta con DNI existente y baja de un cliente con pedido | DNI repetido: `{"codigo":"CONFLICTO","mensaje":"Ya existe un cliente con ese DNI."}`. Baja con pedido: `{"codigo":"CONFLICTO","mensaje":"No se puede eliminar un cliente con pedidos asociados."}`. Se corrigió `AppError`, que no exponía `mensaje`, y se agregaron pruebas |
| Proxy Vite | `GET http://localhost:5173/api/health` con backend en 3000 y Vite en 5173 | 200; `{"estado":"ok","servicios":{"http":"ok","db":"ok"}}` |

Cobertura de los criterios del ABM: búsqueda por nombre/DNI/teléfono/email, alta y edición con normalización, DNI duplicado como conflicto, teléfono/email repetido como aviso, baja sólo sin pedidos y guardas de rol. El smoke real cubrió health, login, listado, alta, DNI repetido, edición, baja sin pedidos y los mensajes 409 de DNI repetido y baja con pedido. La baja con pedidos se ejecutó contra MySQL real creando y limpiando un pedido de prueba; el caso de carrera que dispara `ER_ROW_IS_REFERENCED_2` no se provocó y queda cubierto sólo por la traducción del servicio.

Límites: no se probó con Docker ni en navegador; no hay prueba end-to-end de interfaz ni verificación visual responsive. La búsqueda SQL, el ABM y los mensajes 409 se probaron contra MySQL 8.0 local, no contra el contenedor 8.4. El error de FK por carrera al borrar no se provocó. D07 queda implementada localmente por pedido del equipo, con validación académica pendiente.

## Búsqueda de clientes en la carga de pedido — punto 2 (20/10/2026, OpenCode)

Ejecutado sobre la rama `feature/clientes-registro-pedidos-duplicados`, con Node v24.21.0 y MySQL 8.0 local. El backend ya resolvía `GET /api/clientes?busqueda=` por nombre, DNI, teléfono, email y código; esta tarea completó la experiencia visible del selector y su evidencia. No se modificó el esquema, `database/init.sql` ni el contrato de la API.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Pruebas frontend | `npm.cmd --prefix frontend test` | 15/15 (4 archivos); 3 casos nuevos de `contactoDeCliente` y precarga de `datosDeCliente` |
| Pruebas backend | `npm.cmd --prefix backend test` | 100/100; incluye la búsqueda por los dígitos del texto para DNI y teléfono |
| Lint y build | `npm.cmd --prefix frontend run lint` y `npm.cmd --prefix frontend run build` | Sin errores; 150 módulos, Vite 8.2.2 |
| Verificación completa | `npm run check` desde la raíz | Contexto y 7 skills, sintaxis backend, 100/100 tests, lint y build; exit 0 |
| Smoke real de búsqueda | App Express con pool MySQL local en puerto efímero: alta de 2 clientes sintéticos y `GET /api/clientes?busqueda=` | DNI sintético formateado con puntos, nombre, teléfono con guiones, DNI parcial y texto inexistente: encontró los clientes esperados y no devolvió resultados para el texto inexistente |
| Pedido con cliente recuperado | `POST /api/pedidos` con el `cliente_id` del cliente encontrado y una dirección sintética | 201; `pedidos.cliente_id` correcto; el conteo de clientes quedó igual antes y después, sin alta duplicada |
| Limpieza | `DELETE` del pedido y de los clientes sintéticos | Datos de prueba eliminados; no se tocaron los clientes preexistentes |

Cobertura del punto 2: búsqueda por DNI con puntos, nombre, teléfono con guiones y DNI parcial; selección de un cliente existente para crear el pedido sin un alta adicional; estados de carga, sin coincidencias y error del selector; y precarga de los campos editables del cliente. La lógica visible se acredita con pruebas de las funciones puras y con el smoke de la API; no hay prueba de interacción DOM porque el proyecto no tiene un arnés de componentes React.

Límites: no se probó en navegador ni con Docker; no se verificó visualmente el selector en escritorio ni en móvil. La detección de clientes duplicados (punto 3) y el aviso de pedidos duplicados (punto 5) siguen pendientes y no se probaron como si estuvieran terminados. D11 sigue abierto: no se fusionan clientes.

## Detección de clientes duplicados — punto 3 (20/10/2026, OpenCode)

Ejecutado sobre la rama `feature/clientes-registro-pedidos-duplicados`, con Node v24.21.0 y MySQL 8.0 local. No se modificó el esquema ni `database/init.sql`. El smoke usó una app Express con el pool local en un puerto efímero y datos sintéticos; no se tocaron clientes preexistentes.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Normalización de DNI | `normalizarDni()` con puntos, espacios y guiones | `20.123.456`, `20 123 456` y `20-123-456` devuelven `20123456`; barras y letras devuelven `null` |
| Pruebas backend | `npm.cmd --prefix backend test` | 105/105; incluye 5 casos nuevos de normalización, rechazo de letras, DNI repetido con formatos distintos, aviso al actualizar y exclusión del propio cliente |
| Pruebas frontend | `npm.cmd --prefix frontend test` | 18/18 (4 archivos); 3 casos nuevos de `describirCoincidenciasClientes` |
| Lint y build | `npm.cmd --prefix frontend run lint` y `npm.cmd --prefix frontend run build` | Sin errores; 150 módulos, Vite 8.2.2 |
| Verificación completa | `npm run check` desde la raíz | Contexto y 7 skills OK; sintaxis backend OK; 105/105 tests; lint y build OK; exit 0 |
| Alta con DNI con puntos | `POST /api/clientes` con DNI `79.xxx.xxx`, teléfono con guiones y email sintético | 201; DNI y teléfono normalizados a dígitos; `posiblesDuplicados` vacío |
| Edición del mismo cliente | `PUT /api/clientes/:id` con los mismos datos | 200; el cliente no se avisó a sí mismo como duplicado |
| Teléfono compartido | `POST /api/clientes` con otro DNI y el mismo teléfono | 201; `posiblesDuplicados` incluye al primer cliente con su `nombre` y `dni`; no se fusionó |
| Email compartido | `POST /api/clientes` con otro DNI y el mismo email en mayúsculas y con espacios | 201; `posiblesDuplicados` incluye al primer cliente con su `nombre` y `dni`; no se fusionó |
| DNI repetido con otro formato | `POST /api/clientes` con el DNI del primer cliente escrito con espacios | 409; mensaje `Ya existe un cliente con ese DNI.`; no se creó otro cliente |
| DNI con letras | `POST /api/clientes` con una letra intercalada en el DNI | 400; el error informa el campo `dni`; no se creó el cliente |
| Separación de registros | Búsquedas por teléfono y email compartidos | Aparecen los ids de los clientes separados; el primer cliente conserva su email original |
| Limpieza | `DELETE` de los ids sintéticos y búsqueda por la marca usada | 3 clientes sintéticos eliminados; búsqueda final sin restos; no se borraron datos preexistentes |

Cobertura del punto 3: DNI idéntico tras normalizar, rechazo de caracteres no admitidos, aviso por teléfono y email con nombre y DNI del otro cliente, exclusión del propio cliente en ediciones y ausencia de fusión. La interfaz se acredita con pruebas de las funciones puras, lint, build y el smoke de API; no hay prueba de interacción DOM porque el proyecto no tiene un arnés de componentes React.

Límites: no se probó en navegador ni con Docker; no se verificó visualmente el aviso en escritorio ni en móvil. El teléfono conserva la normalización preexistente que quita todo carácter no numérico; la validación estricta de separadores se aplicó al DNI. D08 (obligatoriedad del DNI) y D11 (resolución/fusión de duplicados) siguen abiertos; no se fusionan clientes. El aviso de pedidos duplicados (punto 5) no se implementó ni se probó como terminado.

## Registro manual de pedidos — punto 4 (20/10/2026, OpenCode)

Ejecutado sobre la rama `feature/clientes-registro-pedidos-duplicados`, con Node v24.21.0 y MySQL 8.0 local. No se modificó el esquema ni `database/init.sql`. El smoke usó una app Express con el pool local en un puerto efímero, un cliente y pedidos sintéticos, y limpió sólo sus propios registros.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Catálogo y validación | `POST /api/pedidos` con `canal_origen` `WHATSAPP` (smoke) y `CORREO` (prueba del controlador); valor fuera de la lista | Los válidos se aceptan; `PALOMA` responde 400 con `campos.canal_origen` y no crea pedido |
| Estado impuesto | Alta con `estado: "PAGADO"` en el cuerpo | El pedido se crea igual en `EN STOCK`; el controlador no reenvía `estado` al servicio |
| Pruebas backend | `npm.cmd --prefix backend test` | 109/109; incluye canal y observaciones persistidos, predeterminado `MANUAL`, estado ignorado, canal inválido 400, chofer 403 |
| Pruebas frontend | `npm.cmd --prefix frontend test` | 22/22 (6 archivos); incluye catálogo/etiquetas, fallback y contrato del alta |
| Lint y build | `npm.cmd --prefix frontend run lint` y `npm.cmd --prefix frontend run build` | Sin errores; 151 módulos transformados, Vite 8.2.2 |
| Verificación completa | `npm run check` desde la raíz | Contexto y 7 skills OK; sintaxis backend OK; 109/109 tests; lint y build OK; exit 0 |
| Pedido con canal y observaciones | Alta real con cliente sintético, `canal_origen: "WHATSAPP"` y observaciones | 201; detalle y fila MySQL con `EN STOCK`, `canal_origen = WHATSAPP`, observaciones y dirección `PENDIENTE`; `direccion_validada = 0` |
| Pedido sin canal | Alta real sin `canal_origen` | 201; persiste `MANUAL` y sigue en `EN STOCK` |
| Validaciones de entrada | Canal inválido y observaciones de 2001 caracteres | 400 en ambos casos, campo informado y conteo de pedidos sin cambios |
| Autorización | Alta sin token y con token de CHOFER | 401 y 403 respectivamente; no se creó pedido |
| Limpieza | Borrado de los pedidos sintéticos y del cliente de prueba | Conteos finales sin registros de la marca sintética; no se tocaron datos preexistentes |

Cobertura del punto 4: elección o alta de cliente ya existente, canal de origen validado y persistido, observaciones persistidas, estado inicial `EN STOCK` no manipulable desde el cliente, resumen visible del canal y del estado, y guardas de rol. La interfaz se acredita con pruebas de funciones puras, lint, build y el smoke de API; no hay prueba de interacción DOM porque el proyecto no tiene un arnés de componentes React.

Límites: no se probó en navegador ni con Docker; no se verificó visualmente el selector ni el resumen en escritorio o móvil. El catálogo de canales (D22) es una adopción local basada en el contexto y debe confirmarse con el cliente. El punto 5 (aviso de pedidos duplicados con confirmación explícita) sigue pendiente; la lista informativa existente no se considera terminada. D08 y D11 siguen abiertos.

## Aviso de pedidos duplicados — punto 5 (21/10/2026, OpenCode)

Ejecutado sobre la rama `feature/clientes-registro-pedidos-duplicados`, con Node v24.21.0 y MySQL 8.0 local. No se modificó el esquema ni `database/init.sql`. El smoke usó una app Express con el pool local en un puerto efímero, dos clientes y pedidos sintéticos, y limpió sólo sus propios registros.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Pruebas backend | `npm.cmd --prefix backend test` | 120/120; incluye dirección normalizada equivalente, confirmación explícita, altura/localidad distintas, ausencia de altura, ventana configurable, configuración por entorno, error y middleware, consulta de candidatos y confirmación no booleana |
| Pruebas frontend | `npm.cmd --prefix frontend test` | 24/24 (6 archivos); incluye reenvío de `confirmar_duplicado` y extracción de `posiblesDuplicados` del conflicto |
| Lint y build | `npm.cmd --prefix frontend run lint` y `npm.cmd --prefix frontend run build` | Sin errores; 151 módulos transformados, Vite 8.2.2 |
| Verificación completa | `npm run check` desde la raíz | Contexto y 7 skills OK; sintaxis backend OK; 120/120 tests; lint y build OK; exit 0 |
| Configuración de Compose | `docker compose config --quiet` | Parsea correctamente; sólo avisa por variables de entorno no definidas en esta sesión |
| Configuración | `loadEnv` con `DUPLICADOS_VENTANA_HORAS` ausente, `6` y `0` | 24 h por defecto, 6 h configuradas y vuelta a 24 ante un valor inválido |
| Comparación normalizada | `claveDireccion` y `direccionEquivalente` | «Av. H. Yrigoyen» y «Avenida Hipólito Yrigoyen» coinciden; 1234 y 1235 no; CABA y Capital Federal se asimilan |
| Consulta de candidatos | Repositorio con `db.query` falso | Filtra por `cliente_id` y `INTERVAL ? HOUR`; no excluye `PAGADO`; devuelve dirección y fecha |
| Aviso sin crear | `POST /api/pedidos` con dirección equivalente dentro de la ventana | `409 DUPLICADO_POTENCIAL`; `posiblesDuplicados` con el pedido existente; conteo del cliente sin cambios |
| Confirmación explícita | Mismo alta con `confirmar_duplicado: true` | `201`; crea exactamente un pedido y devuelve la coincidencia |
| Casos que no avisan | Otra altura, otro cliente, otra localidad, sin altura | `201` con `posiblesDuplicados: []` en cada caso |
| Ventana | Pedido actualizado a `NOW() - INTERVAL 3 DAY`, luego alta equivalente | `201` sin aviso, porque queda fuera de las 24 h |
| Reintento y validación | Alta equivalente sin confirmar después de crear; `confirmar_duplicado: "true"` | `409` sin escritura; `400` por confirmación no booleana |
| Autorización | Alta sin token y con token de CHOFER | `401` y `403`, respectivamente; sin escrituras |
| Limpieza | Borrado de los pedidos y clientes sintéticos, y verificación por marca | Sin restos; no se tocaron datos preexistentes |

Cobertura del punto 5: mismo cliente y dirección normalizada dentro de una ventana configurable, aviso con el pedido existente, bloqueo del alta hasta la confirmación explícita, confirmación que crea el pedido, descarte del aviso al cambiar datos y exclusión de casos que no son el mismo domicilio. La interfaz se acredita con pruebas de las funciones puras, lint, build y smoke de API; no hay prueba de interacción DOM porque el proyecto no tiene un arnés de componentes React.

Límites: no se probó en navegador ni con Docker; no se verificó visualmente el aviso ni sus botones en escritorio o móvil. La ventana de 24 h es configurable y queda pendiente de confirmación con el cliente. La comparación tolera iniciales y abreviaturas, pero no separa calle y altura escritas en un solo campo. D11 sigue abierto en la resolución/fusión: no se fusionan pedidos ni clientes. D08 sigue abierto.

## Listado de pedidos — punto 6 (21/10/2026, OpenCode)

Ejecutado sobre la rama `feature/clientes-registro-pedidos-duplicados`, con Node v24.21.0 y MySQL 8.0 local. No se modificó el esquema ni `database/init.sql`. El smoke usó una app Express con el pool local en un puerto efímero, un cliente y dos pedidos sintéticos, y limpió sólo sus propios registros.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Pruebas backend | `npm.cmd --prefix backend test` | 125/125; incluye consulta de listado con estado/cliente/fechas, listado sin filtros, traslado del controlador, fechas inválidas/rango invertido y HTTP con filtros/400 |
| Pruebas frontend | `npm.cmd --prefix frontend test` | 30/30 (7 archivos); incluye parámetros de filtros, filtros activos, resumen por estado, dirección/fecha y contrato de `listarPedidos` |
| Lint y build | `npm.cmd --prefix frontend run lint` y `npm.cmd --prefix frontend run build` | Sin errores; 154 módulos transformados, Vite 8.2.2 |
| Verificación completa | `npm run check` desde la raíz | Contexto y 7 skills OK; sintaxis backend OK; 125/125 tests; lint y build OK; exit 0. Las pruebas de frontend se ejecutaron aparte con 30/30 |
| Formato del diff | `git diff --check` | Sin errores; sólo avisos preexistentes de finales de línea CRLF en archivos ya tocados |
| Consulta del repositorio | `db.query` falso con estado, cliente `20.123`, desde y hasta | SQL parametrizado con `p.estado`, `c.nombre`/`c.dni`/`c.telefono`/`c.email`, dígitos normalizados, `p.created_at >= ?` y `p.created_at < DATE_ADD(?, INTERVAL 1 DAY)`; orden por fecha e id descendente |
| Listado sin filtros | Repositorio con `db.query` falso | No agrega `WHERE`; valores vacíos |
| Traslado del controlador | `GET` simulado con cliente `"  Juan Pérez  "` y fechas | El servicio recibe `cliente: "Juan Pérez"`, `fechaDesde` y `fechaHasta` en camelCase |
| Fechas inválidas | `2026-02-30` y rango `2026-10-21` → `2026-10-20` | `400 DATOS_INVALIDOS` con `campos.fecha_desde` y `campos.fecha_hasta`, respectivamente |
| Listado HTTP | Admin autenticado con estado, cliente y rango de fechas | `200`; la consulta SQL recibe los filtros; rango invertido `400` |
| Filtro por nombre | Pedidos sintéticos de un cliente con nombre único | Devuelve los dos pedidos, sin pedidos de otros clientes |
| Filtro por DNI | Mismo cliente buscado con puntos (`76.123.456`) | Encuentra los pedidos porque la consulta también usa los dígitos |
| Filtro por estado | `EN PREPARACIÓN` sobre los pedidos sintéticos | Devuelve sólo el pedido en ese estado |
| Filtro por fecha | Día actual y hace dos días, rango inclusivo | Cada rango devuelve sólo el pedido correspondiente; no se mezclan |
| Filtros combinados | Cliente con DNI, estado `EN STOCK` y fecha de hace dos días | Devuelve sólo el pedido esperado |
| Fechas rechazadas en smoke | Rango invertido y `2026-02-30` | `400` con el campo afectado; no se muestran resultados como éxito |
| Autorización | Listado sin token y con token de CHOFER | `401` y `403`, respectivamente |
| Limpieza | Borrado de pedidos y cliente sintéticos y verificación por marca | Sin restos; no se tocaron datos preexistentes |

Cobertura del punto 6: listado real en el tablero, filtros combinables por estado, cliente y rango de fechas, búsqueda de cliente por nombre/DNI/teléfono/email, contadores sobre el total, estados de carga/error/vacío y acceso al detalle. La interfaz se acredita con pruebas de funciones puras, lint, build y smoke de API; no hay prueba de interacción DOM porque el proyecto no tiene un arnés de componentes React. El usuario confirmó el punto 6 el 21/10/2026 y reportó los hallazgos de validación geográfica corregidos en el apartado siguiente.

Límites: no se probó en navegador ni con Docker; no se verificó visualmente el tablero, los filtros ni la tabla en escritorio o móvil. No hay paginación ni exportación. El rango de fechas se interpreta con la zona horaria de MySQL/servidor y no se normaliza en esta tarea. La etiqueta «entregados o pagados» agrupa ambos estados sin afirmar equivalencia; la definición de entrega y acreditación de pago sigue en D04/D09. D08 (obligatoriedad del DNI) y D11 (fusión de duplicados) siguen abiertos. El smoke está en `temp/smoke-punto6.cjs`, que está ignorado por Git.

## Corrección de la validación geográfica — 21/10/2026 (OpenCode)

Ejecutado sobre la rama `feature/clientes-registro-pedidos-duplicados`, con Node v24.21.0 y MySQL 8.0 local. No se modificó el esquema, `database/init.sql`, el backend ni el contrato API. El smoke creó un cliente y dos pedidos sintéticos, usó el proveedor real Nominatim y limpió sólo sus propios registros.

Diagnóstico: en `frontend/src/components/MapPreview.jsx`, `Number(null)` devuelve `0`. Un pedido recién guardado tiene `latitud` y `longitud` nulas, por lo que el mapa se montaba en (0,0) en lugar de mostrar el placeholder. No era un fallo de las teselas ni del proveedor: OpenStreetMap y Nominatim respondieron correctamente.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Pruebas frontend | `npm.cmd --prefix frontend test` | 34/34 (8 archivos); incluye 4 casos de `coordenadasDeMapa` con `null`, `undefined`, vacío, texto inválido, fuera de rango y `0,0` explícito |
| Lint frontend | `npm.cmd --prefix frontend run lint` | Sin errores |
| Build frontend | `npm.cmd --prefix frontend run build` | OK, 155 módulos transformados, Vite 8.2.2 |
| Verificación completa | `npm run check` desde la raíz | Contexto y 7 skills OK; sintaxis backend OK; backend 125/125; lint y build frontend OK; exit 0 |
| Tesela de OpenStreetMap | `https://tile.openstreetmap.org/16/22179/36414.png` | `200 image/png`, 4890 bytes |
| Nominatim, dirección real | `Av. Corrientes 1234, CABA, Argentina` | `OK` con latitud/longitud y confianza `ALTO` |
| Nominatim, dirección inexistente | `Calle Falsa 99999, CABA, Argentina` | `ZERO_RESULTS`, sin coordenadas |
| Borrador real | `POST /api/pedidos` con dirección válida | `201`; `latitud`/`longitud` nulas, `PENDIENTE`, `direccion_validada = 0` |
| Búsqueda real | `POST /api/pedidos/:id/geocodificar` | `200`; `OK` con punto y `estado_validacion` `VALIDA`, condición que habilita el botón de confirmación |
| Confirmación humana | `POST /api/pedidos/:id/confirmar-direccion` | `200`; `CONFIRMADA` y `direccion_validada` habilitado |
| Sin resultados | Alta y geocodificación de una dirección inexistente | `ZERO_RESULTS`; sin coordenadas, `PENDIENTE`; confirmar responde `409` |
| Limpieza | Borrado de pedidos y cliente sintéticos y verificación por marca | Sin restos; no se tocaron datos preexistentes |

Cobertura de la corrección: el mapa no se abre sin coordenadas; el resultado de la búsqueda se informa con un bloque visible y un estado de accesibilidad; sólo un resultado con punto habilita la confirmación; la confirmación sigue siendo humana; «Cargar otro pedido» limpia los campos controlados y remonta el selector para borrar su búsqueda interna. La interfaz se acredita con la prueba de la función pura, lint, build, revisión de código y smoke de API.

Límites: el usuario confirmó visualmente que el mapa ya muestra calles. El ajuste posterior confirmó el flujo de búsqueda automática y el estado del botón; no se verificó específicamente el recentrado ni el viewport móvil, y no hay prueba de interacción DOM. El mapa depende de Internet para las teselas y Nominatim tiene límites de uso; el smoke respetó una pausa entre consultas. Guardar un pedido sigue creando un borrador `EN STOCK` sin exigir geocodificación; cambiarlo requiere una definición de alcance (D09). D08 y D11 siguen abiertos. El smoke está en `temp/smoke-geo-validacion.cjs`, ignorado por Git.

## Ajuste de búsqueda automática y estado visual del botón — 21/10/2026, aceptado 22/10/2026 (OpenCode)

El usuario probó la corrección anterior y confirmó que el mapa ya muestra las calles. Reportó que la búsqueda manual seguía siendo un paso extra y que el botón de confirmación se veía deshabilitado aunque ya estuviera habilitado. No se modificó backend, esquema ni contrato API.

Diagnóstico:
- La búsqueda sólo se ejecutaba desde el botón; después de `POST /api/pedidos` no había una llamada automática a `POST /api/pedidos/:id/geocodificar`.
- `App.css` definía `.confirm-button` con `background: #9bb5f5` y `cursor: not-allowed` para todos los estados. El atributo `disabled` y la condición `puedeConfirmar` eran correctos, pero el estilo no distinguía habilitado de deshabilitado. Por eso el botón se podía clickear aunque pareciera bloqueado.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Pruebas frontend | `npm.cmd --prefix frontend test` | 34/34 (8 archivos) |
| Lint frontend | `npm.cmd --prefix frontend run lint` | Sin errores |
| Build frontend | `npm.cmd --prefix frontend run build` | OK, 155 módulos transformados, Vite 8.2.2 |
| Verificación completa | `npm run check` desde la raíz | Contexto y 7 skills OK; backend 125/125; lint y build frontend OK; exit 0 |
| Revisión de código | `PedidosCargaPage.jsx` | Tras `crearPedido`, se llama `buscarDireccion(data.pedido.id)`; la función también atiende el botón manual y captura sus propios errores sin revertir el alta |
| Revisión de estilos | `App.css` y CSS compilado | `.confirm-button` habilitado usa azul y cursor normal; `:disabled` usa azul claro, cursor bloqueado y sin sombra. El CSS de `frontend/dist` contiene ambas reglas |
| Revisión del placeholder | `MapPreview.jsx` | Mientras `buscando` es verdadero muestra «Buscando la dirección en OpenStreetMap…» |

Cobertura del ajuste: el guardado dispara la búsqueda automática cuando la dirección queda `VALIDA`; el botón manual queda como reintento; la búsqueda no bloquea el alta y un fallo informa que el pedido ya quedó guardado; el estado visual del botón ahora coincide con el atributo `disabled`. En la integración final se adoptó la regla del target: sólo `VALIDA` con coordenadas habilita Geocodificar y Confirmar, y la confirmación sigue siendo humana.

El usuario confirmó visualmente el 22/10/2026 que la búsqueda automática y el estado visual del botón funcionan en el flujo de carga. Límites: no se probó en viewport móvil; no hay prueba de interacción DOM ni de estilos computados. La búsqueda automática y el color del botón se acreditan con esa prueba manual, revisión de código, lint, build y la verificación completa. No se repitió el smoke de API porque el backend no cambió; sus resultados de la sección anterior siguen vigentes. La búsqueda automática depende de Nominatim y de la red; si falla, el pedido queda guardado y el botón permite reintentar. D08, D09 y D11 siguen abiertos.

## Integración con los aportes de MVP-1 (22/10/2026, OpenCode)

Al rebasar sobre origin/MVP-1 se incorporaron la validación/normalización, la visualización de problemas y las provincias/localidades con Georef. Las verificaciones siguientes son las del target y se conservan como antecedente; la verificación final de la rama integrada se registra al cierre.

## Validación y normalización en pedidos (20/10/2026, OpenCode)

Ejecutado sin base de datos ni proveedor real, con repositorios y adaptadores falsos en las pruebas.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Pruebas backend | `npm.cmd --prefix backend test` (desde `backend/`) | 101/101; incluye creación con `VALIDA`/`CON_ADVERTENCIAS`, `problemas` en la respuesta, normalización de calle/altura/provincia/CP, abreviaturas equivalentes, dirección legacy, invalidación de confirmación, descarte de coordenadas al corregir una `VALIDA` geocodificada, geocodificación bloqueada para `PENDIENTE`/`CON_ADVERTENCIAS`/`CONFIRMADA`, proveedor que no cambia estado y confirmación sólo `VALIDA` |
| Check coordinado | `npm run check` desde la raíz | `context:check` OK, sintaxis backend OK, backend 101/101 y lint frontend sin errores; el build de Vite falló porque `react-router-dom` está declarado en `frontend/package.json` pero no instalado en `node_modules`. Es una limitación previa del entorno, ajena a esta tarea |

Límites: no se ejecutó SQL ni migraciones; `database/init.sql` y el esquema quedaron intactos. No se probó el flujo real contra MySQL/Docker ni Nominatim, ni la visualización de `problemas` en el frontend (fuera del alcance de esta tarea). El build de frontend no se pudo verificar por la dependencia faltante; no se instaló nada para no modificar el entorno.

## Problemas de dirección en carga y revisión (20/10/2026, OpenCode)

Ejecutado sin base de datos ni proveedor real; los casos de `obtener` usan el repositorio falso existente.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Pruebas backend | `npm test` (desde `backend/`) | 103/103; suma dos casos de `obtener`: dirección guardada incompleta devuelve `CAMPO_OBLIGATORIO`/`ERROR` sin escribir, y dirección válida devuelve `problemas: []` |
| Lint frontend | `npm run lint` (desde `frontend/`) | Sin errores |
| Pruebas frontend | `npm test` (desde `frontend/`) | No ejecutable: `vitest` está declarado en `frontend/package.json` pero no instalado en `node_modules` (limitación previa del entorno) |
| Build frontend | `npm run build` (desde `frontend/`) | No ejecutable: falta `react-router-dom` en `node_modules`; el error es de resolución de una dependencia preexistente, no de los archivos modificados |

Límites: no se ejecutó SQL ni migraciones; no se probó en navegador, viewport móvil, MySQL/Docker ni Nominatim. No se instalaron dependencias para no modificar el entorno. La verificación visual de colores, foco de teclado y layout responsive queda pendiente.

## Provincias y localidades con Georef (20/10/2026)

Verificación ejecutada sobre el checkout local. Georef se reemplazó por un `fetch` simulado: no hubo llamadas reales a Internet.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Pruebas backend | `npm.cmd --prefix backend test` | 125/125; 22 casos nuevos de cliente Georef, servicio, endpoints y advertencias de localidad. Los 103 casos previos pasaron sin cambios |
| Sintaxis backend | `npm run check` (raíz) | Ver bloque siguiente |
| Lint frontend | `npm.cmd --prefix frontend run lint` | Sin errores |
| Build frontend | `npm.cmd --prefix frontend run build` | `vite build` OK (148 módulos). En esta sesión las dependencias declaradas ya estaban instaladas; la limitación anterior de `node_modules` no se reprodujo |
| Pruebas frontend | `npm.cmd --prefix frontend test` | No ejecutadas en esta tarea; el cambio de UI se acredita con lint y build, no con un test de navegador |
| Georef real | - | No ejecutado: requiere red y no se usaron datos personales |

Casos cubiertos con proveedor simulado: respuesta válida recortada a 10, HTTP 503, fallo de red, timeout (`AbortError`), respuesta con forma inesperada, provincia canónica en la consulta, deduplicación de sugerencias, `EXISTE`/`NO_EXISTE`/`NO_VERIFICADO`, CABA y Capital Federal, y roles 401/403/200 en `/api/localidades`. También que una localidad inexistente o no verificada queda como ADVERTENCIA y conserva `estado_validacion: VALIDA`, y que no se consulta Georef si la provincia ya es inválida.

Límites de esta verificación: no se probó con MySQL/Docker ni en navegador; no se validó la disponibilidad ni la latencia real de Georef; no se agregó caché ni control de cuota propio.

## Integración final de la rama (22/10/2026, OpenCode)

Verificación ejecutada sobre el checkout rebasado en `origin/MVP-1`, sin base de datos ni proveedores reales.

| Verificación | Comando / método | Resultado |
| --- | --- | --- |
| Verificación coordinada | `npm run check` desde la raíz | Exit 0: contexto y 7 skills OK, sintaxis backend OK, backend 165/165, lint frontend OK y build OK |
| Pruebas frontend | `npm --prefix frontend test` | 35/35 (8 archivos) |
| Build frontend | incluido en `npm run check` | Vite 8.2.2, 157 módulos transformados; warning de chunk JS de 501,12 kB (>500 kB), sin error |
| Integridad del diff | `git diff --check origin/MVP-1...HEAD` | OK, sin errores de espacios ni marcadores de conflicto |
| Proveedores reales | - | No ejecutado: sin MySQL/Docker, sin Nominatim real y sin Georef real |

Cobertura de la integración: las pruebas del target conservan validación, normalización, problemas, provincias/localidades, bloqueo de geocodificación fuera de `VALIDA`, confirmación sólo con `VALIDA` y coordenadas, e invalidación de coordenadas al corregir. Las pruebas propias conservan clientes, búsqueda, detección de duplicados, canal, aviso de duplicados, listado y la corrección de la búsqueda automática. Los fakes se ajustaron para el nuevo método `buscarCandidatosDuplicados`.

Límites: no se probó el flujo real en navegador, MySQL/Docker, Nominatim ni Georef; no hay prueba de interacción DOM ni de estilos computados. El PR y el push quedan como paso posterior a este registro.
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

## Navegación del chofer (22/10/2026)
Verificación ejecutada en Docker: frontend 11/11 pruebas, lint y build OK; git diff --check OK. Incluye cuatro regresiones de navegación/renderizado con redirección simulada; no acredita navegación real de navegador. Recargar /chofer para comprobar visualmente.

## Corrección de caché Vite en Docker Desktop (22/10/2026)
Verificado en navegador: se reprodujo el blanco al entrar como chofer antes del reinicio; después, recargar la sesión existente y hacer un login nuevo llevan a /chofer con la pantalla visible. Abrir / con sesión de chofer redirige a /chofer sin errores de consola. GET del módulo de guarda confirma código actualizado. Docker: 11/11 tests frontend, lint y build OK. Los pedidos mostrados siguen siendo de maqueta.

## T07 — asignación y consulta propia (24/10/2026)
Ver evidencia y comandos en el apartado de Benjamín de tareas.md: 134 tests backend, 14 frontend, integración MySQL aislada 1/1, sintaxis host y lint/build OK. Prueba de navegador con cuentas reales locales para lecturas, sin modificar pedidos existentes. Check raíz bloqueado por sincronización de skills preexistente; check backend en Docker requiere script raíz no montado.

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
