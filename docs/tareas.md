# Tareas y continuidad · 30/09/2026

## Primer corte de implementación · 13/10/2026

Responsable: Codex; rama branch-benjamin-1 comprobada antes de cambios. Git inicial: solo docs/hito-1-contrato.md sin trackear, borrador del turno anterior preservado. Sin commits, push, merge ni deploy. Las secciones del 30/09 siguientes se conservan como históricas.

T01 sigue parcial. Usuario: no permitir pedidos nuevos incompletos, ABM independiente de Clientes para MVP 2, evaluar Georef/Leaflet/OSM. Posteriormente indicó solo piso opcional: DNI/CP dejan de proponerse opcionales; se solicitó precisión sobre contactos y campo combinado Piso/Depto. D05 resuelta solo para migración de sesiones, autorizada tras respaldo; resto del modelo de pedidos no aplicado.

Cambios por propósito:
- Backend: factory Express, pool MySQL, salud HTTP/DB, JWT con sesión persistida/revocable, scrypt, validación/origen/límite de intentos y errores sin SQL. jsonwebtoken es nueva dependencia; proxy-addr indirecta actualizada para corregir aviso crítico.
- Datos/CLI: migración 001, runner con checksum/dry-run, bootstrap de cuentas sin sobrescritura, generación local de secreto, dump y restauración en copia. Aplicación real aprobada; no cambió datos/tablas de negocio ni cuentas existentes.
- Frontend: login conectado, recuperación/cierre de sesión, identidad real; demo de chofer explícita y avisos de tablero/carga sin guardado. Proxy y polling Docker/Windows; corregido ancho mínimo móvil y logout oculto.
- Entorno/docs: Dockerfiles npm ci y ejemplos de entorno sin secretos; README, arquitectura, contexto, decisiones, pantallas, spec de acceso y [guía de uso](acceso-y-entorno.md) actualizados.

Aceptación: 18 pruebas HTTP/password/salud pasan; integración SQL ejecutada por separado en base aislada, con migración repetible, cuenta sin duplicados y sesión/revocación persistidas. Dump/restauración conservan ocho tablas y sus registros de prueba. Navegador real: credenciales inválidas rechazadas, demo chofer preservada y login móvil sin desborde. Evidencia en [verificación](verificacion.md).

Base actual: respaldada, SHA-256 c3a9a07e67c292926a209898441e44c762c8e372fb4e6e4da7e1106cb71b6206; 001 aplicada. .env locales con secreto preparado sin imprimir/rotar existentes. MySQL/volumen conservados; backend/frontend reconstruidos y volumen de dependencias sincronizado sin borrado.

Límites: Hito 1 no terminado; no hay pedidos persistidos, importación del Excel, mapa ni entregas/pagos reales. Crear cuenta humana desde consola con contraseña propia, nunca por chat. Éxito de sesión en UI humana pendiente, aunque SQL/API se probaron con datos sintéticos. Avisos de dependencias de desarrollo pendientes; sin actualizaciones forzadas.

Próximo paso: finalizar D08 de campos y T01 del pedido; diseñar migración mínima para cliente dentro del envío y dirección versionada, revisar antes de aplicar; T04 vertical con formulario/API y después T05. No activar Clientes independiente. T06 sigue obligatoria para Hito 1; histórico incompleto se conserva para revisión sin habilitar despacho.

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

## Segundo corte T04 y continuidad actual · 13/10/2026

Estado actual al cierre: branch-benjamin-1, sin commits/push/merge. Se conservan los cambios del primer corte de acceso/entorno descrito arriba y se agrega carga persistida/consulta de pedidos. Hito 1 todavía no completo.

Usuario cerró D08: todos los campos listados del cliente/dirección obligatorios salvo Piso/Depto; notas opcionales. Se implementan nombre/apellido, DNI, teléfono, email, calle, altura positiva, localidad, provincia, CP y conservación de original recibido. Clientes independiente permanece para MVP 2; búsqueda/selección de frecuentes dentro del pedido sí implementada. D04 permite creación/consulta para admin/operador; permisos y transiciones posteriores siguen pendientes.

Archivos del corte: backend/orders.js y tests; database/migrations/002_carga_pedidos.sql y runner; frontend/src/Orders.jsx, Orders.css y api.js, extracción de maqueta en App.jsx; spec previa de carga y documentación afectada. Propósito: guardado transaccional real y tablero desde MySQL. No editar ni fusionar frecuentes silenciosamente, no guardar datos incompletos, no permitir estado/confirmación desde frontend. Clave UUID y hash evitan duplicar por reintento, también simultáneo; falla tras insertar cliente/dirección revierte todo. Mapa/despacho siguen deshabilitados.

002 aplicada a base actual con autorización y respaldo SHA-256 65849dd65a065a82bf72afcec98787d5b05bf0b3205033369da4be4bf3a98131. Agrega apellido/DNI nullable para preservar histórico, Piso/Depto y clave/hash de pedido. Dry-run posterior reconoce 001/002 already-applied. No se borraron filas, bases o volúmenes.

Verificación: 24 pruebas sin DB pasan; integración MySQL separada pasa con idempotencia/concurrencia, rollback real, fechas Buenos Aires y recuperación de ocho tablas. Prueba de navegador aislado: cuenta sintética inicia sesión, carga pedido sin Piso/Depto, guardado visible; recarga conserva sesión y muestra pedido en tablero; logout seguido de recarga vuelve a login. Formulario/tablero a 320×740 sin desborde global (clientWidth=scrollWidth=305). Capturas ignoradas en temp/qa. Datos y cuentas de QA solo en base mandatodo_test_20261013_0487eaf8; servicios temporales QA cerrados y contraseña sintética temporal eliminada. Docker principal sigue disponible en localhost:5173; cuenta humana se crea siguiendo la guía sin pedir contraseña por chat.

Pendientes: importación histórica T06, geocodificación/mapa/confirmación versionada T05, corrección de pedidos con nueva revisión, transiciones operativas/chofer/pagos T07, reportería académica y defensa. No marcar T01 completo para esas reglas pendientes. Próximo corte recomendado: modelo mínimo de versiones/confirmación y adaptador Georef, luego interfaz de mapa; respaldar/revisar antes de otra migración. ABM Clientes y permisos de baja definidos inicialmente se difieren a MVP 2. Ver [acceso y entorno](acceso-y-entorno.md) para comandos del estado actual.

## Cuentas por administrador · 13/10/2026

Usuario solicitó simplificar altas: cuentas individuales de empleados creadas por admin. Implementado en branch-benjamin-1, preservando todo el trabajo anterior sin commits. Spec previa usuarios.md; backend users.js + create-user.js y montaje en app/index; frontend Users.jsx + navegación admin; comando setup-admin en package.json. Sin migración ni dependencia nueva, sin usuarios reales creados automáticamente.

Admin lista/crea; operador/anónimo no puede, incluso por API. Email repetido no sobrescribe. Rol actual admin/operador; chofer operativo diferido. UI limpia contraseña tras éxito, confirma coincidencia y no guarda credenciales. Bootstrap interactivo local para primera cuenta: npm --prefix backend run setup-admin; no alta pública. Método de variables anterior conserva compatibilidad técnica, no es el flujo de empleados.

Pruebas: npm run check OK (24 y SQL omitida aquí); integración MySQL ampliada, inicialmente falló por esperar una sola sesión revocada después de agregar el empleado; ajustado a dos y repetición OK en mandatodo_test_20261013_1eb227b5, incluida recuperación de ocho tablas. Verificados 401/403, alta admin, duplicado 409, rol/password inválidos, campos extra y login de empleado recién creado, sin hashes en listado/respuesta. Navegador: pantalla/lista con admin sintético y diseño 320×740 sin desborde. No se ingresaron credenciales humanas ni se probaron manualmente nuevas contraseñas reales. Guía actualizada; pendientes de T05/T06 y edición/baja/reset de empleados conservados.

## Cuenta administrativa local de prueba · 13/10/2026

Usuario pidió configurar una cuenta administrativa con datos proporcionados en el chat. Aplicado únicamente a esa cuenta de la base local: contraseña almacenada con salt/scrypt, rol admin y activo; sesiones anteriores de esa cuenta revocadas. Excepción explícita de longitud para la cuenta local solicitada, sin cambiar validación de 12 caracteres en altas normales. No hay credenciales nuevas hardcodeadas en frontend, backend o documentación.

Verificación real: POST /api/sesion devolvió 200 e identidad/rol esperados; DELETE /api/sesion cerró la sesión de prueba con 204. No se modificaron otros usuarios ni datos de pedidos. Herramienta temporal sin credenciales eliminada después de usarla. Rama branch-benjamin-1; sin commits/push. Pendientes T05/T06 conservados.

## Compactación de vistas · 13/10/2026

Solicitud: reducir campos y espacios, especialmente Cargar Pedido. Rama branch-benjamin-1; cambios anteriores preservados. Orders.css reduce altura/fuentes/gaps y áreas de texto, también aplicado a formulario Usuarios que comparte estilos. Orders.jsx reutiliza grillas de cliente/dirección, email en fila completa y etiqueta Provincia/CABA más corta. App.css retira escalado global preexistente de 1,5 y ajusta navegación de escritorio con medidas directas. Spec de carga actualizada; sin API/DB ni reglas de negocio cambiadas.

Navegador 1280×900: controles reales de 30 px (antes 40 CSS con aumento global), formulario completo de aproximadamente 755 px de alto, sin transform ni desborde horizontal. Móvil 320×740: controles 36 px, clientWidth=scrollWidth=305. Capturas ignoradas en temp/qa/cargar-pedido-compacto.png y versión mobile. Lint/build frontend pasan; no se agregan tests para modificación visual reversible. Pendientes funcionales T05/T06 conservados; sin commit/push.

## Bloqueo de clientes repetidos · 13/10/2026

Usuario retira registrar aparte: DNI/email/teléfono coincidentes no pueden pertenecer a otra persona. Branch-benjamin-1, cambios previos preservados. Orders.jsx elimina checkbox/estado/bandera, verifica coincidencias al salir del campo y ofrece selección explícita; bloquea guardar mientras hay conflicto. Orders.css retira estilos del checkbox. orders.js rechaza bandera antigua, normaliza comparaciones y devuelve 409 con errores por campo, sin excepciones. Seleccionar cliente permite varios pedidos sin alterar sus datos. No se modifica esquema ni registros actuales.

Altas nuevas se serializan con GET_LOCK transitorio por base para prevenir duplicados simultáneos entre procesos de la app; se libera después de commit/rollback. No equivale a índice único para escrituras manuales o futuros importadores: T06 debe aplicar esta regla y mantener históricos conflictivos para revisión, sin fusionarlos.

Pruebas MySQL aisladas: coincidencia independiente en cada dato, email con mayúsculas/espacios, teléfono con paréntesis/guiones, bandera antigua rechazada, múltiples pedidos de cliente seleccionado y dos altas simultáneas con mismo DNI (201/409, un cliente). Rollback forzado sigue probado después de insertar cliente/dirección. Navegador QA: checkbox ausente, aviso al salir de DNI, Guardar deshabilitado; seleccionar frecuente limpia conflicto y habilita nuevo pedido. Captura local temp/qa/cliente-existente-aviso-qa.png. Checks y recuperación de ocho tablas pasan; sin borrado/fusión de registros actuales, sin commit/push. T05/T06 pendientes.

## Filtro en vivo de clientes frecuentes · 13/10/2026

Solicitud: lista progresiva al escribir DNI/email/teléfono. Implementado en branch-benjamin-1, preservando cambios anteriores. Orders.jsx sustituye botón Buscar por consulta con espera de 250 ms, aborta anteriores y oculta resultados de otro texto; cuenta/carga/sin resultados/error visibles, selección explícita autocompleta y cierra lista. Enter en buscador no guarda. Orders.css organiza resultados y limita altura. orders.js acepta q desde un carácter, coincidencias parciales y teléfono normalizado, exactas primero, máximo 20; SQL parametrizado con comodines literales escapados. Sin esquema/dependencias nuevas ni cambios de identidad/guardado.

Verificación SQL aislada: DNI corto/completo, email parcial/mayúsculas, teléfono parcial/formateado, caracteres %/_ literales, consulta vacía rechazada y sin resultados. Checks completos pasan; recuperación de ocho tablas pasa. Navegador: 8000000 muestra dos, 80000001 uno, cambiar rápidamente a teléfono conserva resultados actuales, texto ausente muestra vacío, selección completa cliente. Lista móvil a 320×740 sin desborde (305/305). Captura ignorada temp/qa/clientes-filtro-vivo-qa.png; cuentas/datos solo QA. No commits/push; T05/T06 pendientes.

## Tipografía legible · 13/10/2026

Usuario pidió aumentar un poco letra tras compactación. Solo Orders.css: etiquetas/ayuda 13 px, entradas/buscador/nombres de candidatos 14 px, datos secundarios/errores/botones 12 px, títulos de bloque 16 px y título de carga 22 px; divisores más oscuros. Altura de controles conserva 30 px escritorio/36 móvil y textarea 52 px. Sin cambios de datos/API/validación.

Frontend lint/build OK. Navegador a 1280×900 confirma fuente 14 px/control 30 px y sin desborde; 320×740 fuente 14 px/control 36 px, clientWidth=scrollWidth=305. Captura vacía sin datos de clientes en temp/qa/cargar-pedido-letra-legible.png. Branch-benjamin-1; sin commit/push; pendientes funcionales conservados.
