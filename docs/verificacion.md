# Verificación y evidencia · 30/09/2026

## Filtro en vivo · 13/10/2026

npm run check completo OK (24 sin DB; integración omitida aquí). test:mysql ejecutado aparte en mandatodo_test_20261013_f4f3c9ce y su copia de recuperación: consultas parciales desde un carácter, reducción por DNI completo, email con mayúsculas, teléfono con separadores/parcial, %/_ literales, vacío 400, sin coincidencias; resto de reglas y recuperación de ocho tablas preservados. Ajuste final prioriza coincidencia exacta antes de límite 20 y bloquea Enter del buscador para no enviar pedido; repetir integración final antes de cerrar.

Navegador QA: sin botón Buscar, lista automática dos→uno por DNI; cambios rápidos email→teléfono con resultado del texto final; vacío sin registros, selección autocompleta y cierra lista. Lista a 320×740 clientWidth=scrollWidth=305. Captura ignorada temp/qa/clientes-filtro-vivo-qa.png. Sin crear/modificar clientes de base actual durante QA; sin migraciones/dependencias.

Repetición final después de priorizar coincidencias exactas y bloquear Enter: npm run check completo OK y test:mysql OK en mandatodo_test_20261013_207db3c4 y su copia restaurada. git diff --check OK. Procesos QA cerrados y contraseña temporal de fixture retirada; servicios principales conservados.

## Clientes sin excepción de duplicados · 13/10/2026

npm run check OK: 24 pruebas, SQL omitida aquí y ejecutada por separado. MySQL aislado en mandatodo_test_20261013_69a80206: rechaza coincidencias independientes de DNI/email/teléfono, normalización de email y formato telefónico, bandera vieja, y dos altas simultáneas de igual DNI (201/409). Conserva idempotencia de pedidos y pedidos múltiples de cliente seleccionado. Rollback real llega a INSERT de pedido después de cliente/dirección y conserva recuentos. Dump/restauración de ocho tablas OK.

Navegador sobre QA: checkbox eliminado; ingresar DNI sintético coincidente y salir del campo muestra aviso/candidato/error y bloquea Guardar; seleccionar limpia aviso. Captura ignorada en temp/qa/cliente-existente-aviso-qa.png. Sin escrituras a clientes/pedidos reales ni migración; pruebas en base aislada. La corrección de históricos incompletos y restricción de escrituras externas quedan para sus tareas.

Repetición final luego de comparación binaria de email: npm run check completo OK, test:mysql OK en mandatodo_test_20261013_1f687dfa y mandatodo_restore_test_20261013_1f687dfa. git diff --check sin errores. Procesos temporales QA cerrados y contraseña de fixture eliminada; aplicación principal conservada.

## Creación de usuarios por admin · 13/10/2026

npm run check completo OK, 24 pruebas y una integración omitida sin configuración. Integración MySQL ampliada ejecutada: anónimo 401, operador GET/POST 403, admin POST 201, email duplicado 409, rol/password inválidos 422, campos extra 400; listado/respuesta sin hashes/contraseñas; empleado creado ingresa y no accede a Usuarios. Primer ensayo falló por recuento antiguo de revocaciones (2 frente a 1); corrección de aserción y repetición OK en mandatodo_test_20261013_1eb227b5 y mandatodo_restore_test_20261013_1eb227b5, con recuperación de ocho tablas.

Navegador con admin/base sintéticos: navegación Usuarios, formulario y lista observados, ancho a 320×740 clientWidth=scrollWidth=305. Captura local temp/qa/usuarios-admin-qa.png. No se crearon credenciales humanas en navegador ni cuentas en la base actual. Bootstrap interactivo implementado, pendiente ejecución por instalador humano. No hay nueva migración ni dependencias. Cuenta/contraseña de fixture solo QA, sin imprimir; se retiran procesos y archivo temporal al terminar.

## Primer corte · 13/10/2026

Segundo corte T04 del mismo día: npm run check pasa con 24 pruebas sin DB y una integración omitida intencionalmente. Integración SQL ejecutada aparte y exitosa: 001/002 repetibles, creación/consulta, rechazo de incompletos, duplicado de cliente, idempotencia incluida concurrencia, fallo forzado tras cliente/dirección con rollback real, límite de fechas Buenos Aires y dump/restauración de ocho tablas. Últimas bases de prueba: mandatodo_test_20261013_6afebc3c y su copia de recuperación; el ensayo final se registra con nombre nuevo al ejecutarse.

Verificación final ejecutada: npm run check completo OK (24 pasan, una SQL omitida aquí); test:mysql separado OK en mandatodo_test_20261013_cfbdbef2 y mandatodo_restore_test_20261013_cfbdbef2, incluido límite de medianoche Buenos Aires. Dry-run actual reconoce 001/002 already-applied. git diff --check y context:check OK. Servicios temporales QA (3001/5175) terminados; aplicación principal 3000/5173 y MySQL permanecen activos.

002 aplicada en base actual luego de aprobación y segundo respaldo; dry-run confirma ambas migraciones registradas. QA en navegador con base aislada y cuenta sintética: login, carga completa sin Piso/Depto, guardado, recarga/sesión/tablero y logout/recarga comprobados. Formulario y tablero a 320×740: ancho de contenido coincide con viewport útil (305), sin desborde global. Capturas en temp/qa/pedidos-persistidos-qa.png y carga-pedidos-mobile-qa.png; no son datos reales ni integración geográfica. Servicios de QA temporales cerrados; contraseña temporal borrada. Base/servicios principales conservados. Las limitaciones de falta de persistencia/éxito UI del primer corte siguiente quedaron superadas para carga/consulta y prueba sintética.

Rama branch-benjamin-1; ejecuciones nuevas, no heredadas. Las secciones del 30/09 siguientes se conservan como históricas.

| Comando/caso | Resultado y alcance |
| --- | --- |
| npm run check inicial | OK: contexto, sintaxis, dos smoke tests, lint/build |
| Docker config --quiet / ps | Sandbox rechazó configuración local; repetidos con acceso autorizado, OK: tres servicios activos, MySQL healthy |
| Instalar jsonwebtoken@9 | Sandbox rechazó red/cache; repetido autorizado desde registry, OK |
| npm audit backend | Cinco avisos iniciales; actualización indirecta proxy-addr corrigió crítico; cuatro altos restantes en cadena de desarrollo. Sin fix --force |
| npm run check con código nuevo | Primer lint falló por process en vite.config; agregado import node:process. Repetición OK: 18 tests pasan, uno SQL aislado se omite sin configuración; lint/build pasan |
| npm --prefix backend run test:mysql | SQL real OK: migración nueva/repetida, cuenta duplicada rechazada, sesión/recuperación/revocación persistidas |
| test:mysql con recuperación | OK: mandatodo_test_20261013_0846dcd8 y mandatodo_restore_test_20261013_0846dcd8. Dump/restauración y comparación de ocho tablas; se conservan sin borrar bases |
| migrate --dry-run actual | baseline existing, 001 pending; sin escrituras |
| backup actual | SQL local ignorado, SHA-256 en tareas; sin publicar filas/credenciales |
| migrate --apply actual | Aprobado después de respaldo: 001 applied; no cambió datos/tablas de negocio |
| setup-session | Secretos locales preparados, sin imprimir ni sobrescribir existentes |
| Docker build/up backend/frontend | npm ci en imágenes; MySQL conservado. npm ci en backend sincronizó volumen de dependencias anterior; recreado para cargar secreto |
| Health directo y vía Vite | 200: proceso y SELECT 1; scope=database, no acreditan esquema de pedidos |
| /api/sesion sin cookie vía Vite | 401 SESSION_REQUIRED |
| Navegador localhost:5173 | Credenciales sintéticas inválidas: rechazo genérico; demo del chofer separada, regreso al acceso |
| Login móvil 320×740 | Detectado desborde por body min-width 320 y scrollbar; corregido a 0, verificado clientWidth=scrollWidth=305. Logout no se oculta en CSS móvil |

Capturas locales de escritorio/móvil en temp/qa/, ignoradas. Éxito/recarga/logout en navegador humano pendientes de crear cuenta; SQL/API probados con datos sintéticos. No se probaron pedidos, importación ni geocodificador. Docker informó también dos avisos altos del frontend, sin actualización general fuera del corte. El ensayo SQL inicial también dejó mandatodo_test_20261013_c3bdeaa3 con datos sintéticos.

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
# Verificación T05 · 13/10/2026

Corrección posterior de UI: npm run check pasa con 33 tests sin DB; backend test final y diff-check pasan. SQL aislada en mandatodo_test_20261013_54967f92 pasa, incluida persistencia de código PED-id. El comando test:mysql no completó respaldo/restauración en este corte; no acreditarlo como éxito total. C: sin espacio confirmado. Navegador comprueba un solo guardado, original opcional, ausencia de entradas de coordenadas, arrastre del pin desmarca revisión, tablero de lectura y edición/cancelación explícita. Sin escrituras en pedidos humanos. Captura temp/qa/mapa-unico-guardar.png y continuidad en tareas.

Desde HEAD 5ce500f: npm run check pasa (30 tests, integración MySQL omitida en suite habitual), lint/build y contexto. npm --prefix backend run test:mysql pasa separadamente en mandatodo_test_20261013_9936c58e, con recuperación de las ocho tablas en mandatodo_restore_test_20261013_9936c58e. SQL prueba confirmación persistida, Origin, anónimo, observación, versión cambiada y restauración del texto sin revivir confirmación. Fixtures de proveedor/API prueban ausencia/múltiples/sin coordenadas, límite/timeout/respuesta inválida y roles permitidos/rechazados. No hay transición de despacho implementada: POST directo autenticado al endpoint inexistente rechaza 404; esto no acredita T07.

Navegador: componente QA aislado, OSM visible y atribuido, punto sintético, observación/casilla obligatorias; editar coordenadas desmarca revisión. Sin desborde en 320×740 (305/305) y 1280×900 (1265/1265). Fixture eliminada. No se ingresaron credenciales humanas ni se probaron confirmaciones reales por UI. Georef real con dirección pública devolvió HTTP 500; no hay prueba real exitosa. Migración actual 003 pendiente de autorización, con respaldo creado y dry-run ejecutado. [Detalles](mapa-ubicacion.md).


## Verificación posterior: mapa durante carga · 13/10/2026

Supera API v2/migración pendiente del primer corte. Georef v1 real 200, candidato/coordenadas y mapa automático en Docker. 003 autorizada/aplicada tras respaldo y recuperación acotada de DDL parcial; dry-run 001–003 applied. npm run check OK (32 tests), SQL aislado OK en mandatodo_test_20261013_807cee08 con restauración de ocho tablas. Guardado/revisión conjuntos, versión cambiada 409, reintento único, huella cliente/servidor y preview autenticado validado probados. QA UI probó alternativa manual de proveedor fallido y guardado visible en detalle/recarga, sin aprobar envío humano. Mapa real en carga a 1280×900 (1265/1265) y 320×740 (305/305). Capturas ignoradas. Demo recorrida con roles y ambos cobros simulados; límites en pantallas. Despacho efectivo sigue pendiente. C: sin espacio al cerrar bloqueó herramientas de terminal/parches; documentación final escrita en D: y revisión global previa OK.

Incidente posterior de Georef: host v1 200 en 271 ms, backend timeout confirmado, IPv4 ensayado sin éxito y retirado. Alternativa al mismo proveedor desde navegador aplicada solo a errores geográficos de conexión/timeout. Consulta real en formulario volvió a mostrar candidato/punto; captura temp/qa/georef-recuperado.png. npm run check pasa con 35 tests; lint/build final y diff-check OK. Archivo temporal de diagnóstico retirado. No SQL ni pedidos humanos modificados. Infraestructura Docker/espacio C: todavía pendiente; no presentar alternativa como reparación de la red del contenedor.

Corrección botón de carga: lint/build frontend pasan. UI aislada probó campos incompletos con mensaje, DNI de seis dígitos con rechazo visible y guardado exitoso PED-6 con frecuente válido, candidato Georef y dirección original/observación vacías. Clic del botón expresa confirmación humana; sin casilla adicional en carga, observación solo para pin corregido. No escrituras en pedidos humanos. Captura temp/qa/guardar-confirmacion-ok.png; base QA mandatodo_test_20261013_54967f92. No se presenta nueva prueba de respaldo/restauración como ejecutada.
