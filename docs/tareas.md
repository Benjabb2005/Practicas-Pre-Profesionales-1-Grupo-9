# Tareas y continuidad · 30/09/2026

## Estado

Preparación terminada y handed off. No hay negocio implementado: frontend maqueta, backend con solo `GET /`, SQL inicial sin migrar. El handoff del 30/09/2026 verificó el descubrimiento de skills en OpenCode, cerró dos huecos reales y dejó evidencia fresca. Sigue pendiente arrancar el stack, probar sesiones nuevas de Codex y Claude Code, y ejecutar T01. Ver [verificación](verificacion.md).

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
