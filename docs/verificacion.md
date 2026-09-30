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
