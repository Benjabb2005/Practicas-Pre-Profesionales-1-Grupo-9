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
