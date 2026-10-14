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

## T05 mapa y revisión humana · 13/10/2026

Responsable Codex. Inicio limpio en branch-benjamin-1, HEAD 5ce500f. Leídos AGENTS raíz/frontend/backend, contexto, arquitectura, pantallas, decisiones y continuidad; skills direcciones y datos. Conservadas carga, tablero, usuarios y demo chofer. Sin commit/push/merge/deploy.

Decisiones humanas nuevas: admin/operador confirma; versión/coordenadas/responsable/fecha; todo cambio invalida; corrección manual permitida con observación obligatoria. Despacho operativo y requisitos adicionales consultados, aún pendientes D04/T07.

Archivos por propósito: backend/georef.js adapta proveedor con tiempo acotado y estados distintos; orders.js agrega candidatos, auditoría y confirmación transaccional sobre versión vigente; migración 003 y migrate.js agregan revisión incremental sin borrar filas; LocationReview.jsx/CSS y dos líneas en Orders.jsx agregan mapa al detalle; manifests/lock añaden Leaflet local 1.9.4; tests cubren proveedor, API y MySQL; spec mapa-confirmacion y docs mapa-ubicacion/decisiones/verificacion/pantallas registran contrato y límites. No cambios a init.sql ni a migraciones 001/002.

Migración 003 probada en mandatodo_test_20261013_b2c08e7a y versión final en mandatodo_test_20261013_9936c58e, con recuperación en copias nuevas. Dirección editada y luego restaurada sigue sin confirmación; versión vieja rechazada 409; se confirma la nueva versión. Confirmar no adelanta estado. Versión final conserva carga/consulta con 002 mientras se aprueba 003; confirmación bloqueada en servidor y UI hasta activar revisión. Dry-run actual: 001/002 already-applied, 003 pending. Respaldo actual SHA-256 e5ace1f2860a032cb26d0c54f77a6f6031331dd187e8da9cc21bb01f9f50f771. Autorización para aplicar 003 solicitada y pendiente; no se aplicó sobre base actual.

Verificación: npm run check final pasa, 30 pruebas sin MySQL + integración opt-in por separado; lint/build frontend. Un ensayo inicial de API esperaba 404 anónimo en despacho, recibió correctamente 401; corregida prueba para consultar autenticado y pasa. Primer test:mysql pasó SQL pero respaldo no pudo usar Docker en sandbox; repetición autorizada y restauración OK. QA navegador con componente aislado y datos sintéticos: OSM/punto/atribución visibles, revisión explícita habilita botón, editar coordenadas desmarca y bloquea; 320×740 305/305, 1280×900 1265/1265. Corregida entrada parcial de coordenadas que hacía fallar Leaflet. Fixture temporal eliminada. No login ni confirmación humana real probados en UI.

Georef: consulta pública real falló aun con red autorizada; diagnóstico HTTP 500. Fixtures pasan, pero éxito real del proveedor no acreditado. npm ci sincronizó volumen frontend Docker para Leaflet; npm informa dos avisos high de desarrollo preexistentes, sin actualización forzada. T05 parcial: pendientes autorización/aplicación 003, éxito real Georef, flujo de corrección de campos y transición de despacho con bloqueo servidor al definir D04/T07. T06/histórico y demás pendientes previos conservados. No presentar este corte como Hito 1 terminado.

Revisión final local: navegador recuperó la sesión existente sin ingresar credenciales; tablero consultó la base 002 y abrió detalle con mapa, aviso de activación pendiente y Confirmar deshabilitado. Sin enviar dirección humana a Georef ni confirmar pedidos reales. Contexto y git diff --check pasan; Git inicial limpio, todos los cambios de este corte son propios.


## Continuidad actual: mapa durante carga como demo · 13/10/2026

Responsable Codex; branch-benjamin-1 desde 5ce500f. Preservado diff propio anterior. Usuario autorizó demo desde temp, sus cuentas, dirección de prueba y aplicación 003. Recorrido admin/operador/chofer registrado en pantallas: carga automática/mapa/confirmación, stock/preparación, filtros/detalle, duplicados cancelar/continuar, entregas y efectivo/transferencia simulados (PAGADO ambos). Rutas/Clientes próximos; agrupamiento cercano sin cambio observable; frecuente sin coincidencia. No seguridad/persistencia remota ni banco/remito verificados. No se copian credenciales/dirección al código o docs.

Cambios: DraftLocationReview y estilos ponen mapa automático junto al formulario tras 500 ms; Orders.jsx conecta confirmar/guardar con validación HTML y corrige manejo de error de red; api.js calcula huella inicial consistente con servidor. backend/orders.js agrega preview geográfico sin crear borradores y guardado conjunto transaccional/idempotente de pedido y revisión; georef.js usa API v1 (v2 500, v1 200 real); App.jsx actualiza aviso. Specs y docs afectados actualizados. No implementación nueva de asignación/chofer/pagos/optimización por ver la demo.

003 aplicada con autorización. Respaldo SHA-256 355ce03b8a6f8f8403a20f3a3c566e61d2f484f2b45da210f4c95fc4920702f3. Apply dejó columna sin trigger/registro; runner frenó por objetos parciales. Recuperación administrativa acotada comprobó tipo/default y ausencia de trigger/registro, creó solo trigger y registró checksum original. Dry-run final 001/002/003 already-applied. Sin borrar/sobrescribir filas, init.sql ni volúmenes; scripts temporales retirados. Para migrar usar cuenta administrativa habilitada para triggers, sin ampliar permisos de app.

Verificaciones: npm run check final OK (32 tests; MySQL omitida ahí), test:mysql OK en mandatodo_test_20261013_807cee08 y recuperación de ocho tablas en mandatodo_restore_test_20261013_807cee08. Guardado conjunto, huella navegador/servidor, versión cambiada 409, reintento único y permisos/validación de preview probados. Primer ensayo de filtro de fecha sumó nuevo pedido fixture: fijada fecha y repetición OK. Navegador Docker confirma mapa real automático; QA nativo restringido no consulta proveedor, pero alternativa manual con coordenadas sintéticas y observación de ensayo guardó revisión visible en detalle y pedido tras recarga. Ningún envío humano real confirmado. QA cerrado y fixture de contraseña retirada. Desktop 1280×900 1265/1265, móvil 320×740 305/305; capturas ignoradas temp/qa/mapa-en-carga.png y mapa-en-carga-mobile.png. Lint/build/contexto/diff-check pasaron antes del cierre documental.

Pendientes D04/T07: transición efectiva de despacho y bloqueo servidor, asignación/permisos chofer, acreditación de transferencia; corrección de campos persistidos, importación T06 y reportería. Confirmar no cambia estado. Hito 1/T05 no íntegros aún. Sin commit/push/merge/deploy. Al cierre C: quedó sin espacio (0 bytes), D: con espacio; terminal y helper de parches fallaron por falta de espacio. Se completó documentación en D: mediante sesión existente, sin borrar archivos de usuario ni respaldos de C:. Última verificación global ya pasó; liberación de C: pendiente del usuario.

## Corrección de carga y consulta · 13/10/2026

Usuario pide un solo botón de confirmar/guardar, dirección original opcional, ajuste del punto solo por mouse, tablero de lectura con Editar y códigos PED-1/PED-2. Branch-benjamin-1; diff anterior preservado. Sin migración ni modificación de pedidos humanos existentes, commit/push/merge/deploy.

Orders.jsx retira Guardar pedido y evita guardado por Enter; único botón en panel geográfico, con validación de campos. Dirección original opcional en formulario, validación y preview; si se informa se conserva, si no queda vacía. LocationReview muestra ubicación confirmada de lectura y Editar abre revisión/cancelación. Controles latitud/longitud eliminados en carga/edición. Marker Leaflet draggable y clic permiten ajuste; mover desmarca revisión humana. CSS cambia círculo por pin arrastrable. El backend conserva coordenadas/auditoría y confirmación versionada aunque no haya entradas numéricas en UI.

orders.js devuelve código público PED-id y guarda ese código en pedidos nuevos dentro de la transacción; código temporal único de inserción no se expone y se sustituye antes del commit. Códigos internos históricos preservados. IDs autoincrementales pueden tener saltos por rollback; no hay contador comercial independiente ni renumeración destructiva. Tests de original omitido/vacío y código persistido agregados. Spec, decisiones, pantallas y contrato afectados actualizados.

Verificación: npm run check OK (33 pruebas sin DB, una SQL omitida), backend test final repetido tras permitir omisión del original en preview OK; lint/build frontend y git diff --check OK. Integración SQL pasó en mandatodo_test_20261013_54967f92, incluida comprobación PED-id almacenado; el comando global test:mysql falló después en respaldo/restauración y esa etapa no se acredita en este corte. C: confirmado con 0 bytes libres; no se borraron datos/respaldos para liberarlo.

Navegador: carga tiene un solo botón de guardar, original opcional, cero inputs Latitud/Longitud; pin arrastrado con mouse desmarca revisión y deshabilita confirmación. Tablero QA muestra PED-1/PED-2 y mapa confirmado sin controles de consulta/confirmación; Editar abre controles y Cancelar vuelve al mapa de lectura. QA solo base sintética; servicio cerrado y fixture de contraseña retirada. Captura ignorada temp/qa/mapa-unico-guardar.png. No se confirmó ni editó un pedido humano. Pendientes D04/T07/T06 anteriores conservados; edición ahora cubre punto, no campos persistidos de dirección. Próximo paso: definir transición de despacho y recuperar espacio de C: para completar nueva prueba de respaldo/restauración.

## Incidente Georef: timeout desde Docker · 13/10/2026

Usuario informa captura sin resultado para dirección autorizada. Se preservó diff anterior. Diagnóstico: Georef v1 desde Windows responde 200 en 271 ms con un candidato; backend /health/live y /health/ready 200; consulta desde backend termina TimeoutError a cinco segundos. Docker exec no devolvió salida y se interrumpió; C: continúa con 0 bytes. No se demuestra la causa de infraestructura. Ensayo HTTPS IPv4 también venció y se retiró; no dejarlo como solución ni atribuir fallo a IPv6. Archivo temporal de diagnóstico con nombre/código de error (sin dirección/credenciales) retirado.

Solución funcional: frontend/src/georef.js consulta el mismo Georef v1 desde navegador únicamente si API autenticada informa GEOREF_TIMEOUT/GEOREF_UNAVAILABLE; sin credenciales ni datos del cliente, solo campos geográficos. LocationReview.jsx aplica alternativa en carga/edición y limpia candidato/pin/revisión al reintentar. No se usa para 401/403, validación, límite ni errores ajenos a geocodificación; el servidor sigue validando versión, responsable y guardado. backend/georef.js distingue mensaje de timeout/conexión. Sin nuevos proveedores, dependencias, esquema ni cambios a pedidos humanos. Specs/contrato/verificación actualizados.

Verificación: npm run check OK (35 pruebas, MySQL opt-in omitida); lint/build frontend repetidos después de incorporar alternativa en edición OK; diff-check OK. Dos pruebas del adaptador navegador verifican consulta sin identidad/credenciales, coordenadas ausentes y límite sin éxito ficticio. Carga real volvió a mostrar candidato/punto con dirección autorizada mediante navegador; captura ignorada temp/qa/georef-recuperado.png. No confirmación ni guardado de un envío real. No se repite SQL, pues no cambió persistencia y el entorno de respaldo sigue bloqueado. Salida Docker/espacio C: pendientes de resolver; alternativa depende de conexión/CORS del navegador y mantiene corrección manual si también falla. Sin commit/push/merge/deploy.

## Botón confirmar/guardar: desbloqueo y mensajes · 13/10/2026

Usuario informa que el botón no funciona. Inspección: carga bloqueaba botón por casilla y observación vacía incluso para candidato Georef. Corregido DraftLocationReview: clic en confirmar/guardar es revisión humana explícita, sin casilla redundante; candidato Georef admite observación vacía con registro de acción, pin movido requiere explicación y muestra mensaje si falta. Versionado y validación servidor se conservan. Estado Guardando durante request; errores de validación/API visibles al lado del botón. Orders.jsx informa campo inválido en vez de retornar sin mensaje. No cambios de esquema, permisos, datos humanos ni dependencia.

Pruebas: lint/build frontend OK. Navegador QA en mandatodo_test_20261013_54967f92, cuenta sintética: datos incompletos enfocan campo y muestran mensaje; DNI de seis dígitos rechazado con error por campo/aviso junto a botón; seleccionar frecuente válido y confirmar candidato Georef sin original ni observación guarda PED-6 con ubicación confirmada. Solo ensayo en base aislada; no se aprobó un envío humano. Captura temp/qa/guardar-confirmacion-ok.png. QA cerrado y fixture de contraseña retirada. Spec/decisiones/contrato actualizados; pendientes operativos anteriores conservados. Sin commit/push/merge/deploy.

## Commit del corte de mapa · 13/10/2026

Usuario autoriza git add . y commit de todos los cambios del corte. Rama branch-benjamin-1; revisión de status/diff y diff-check sin errores. Se incluyen mapa/adaptadores, confirmación versionada/transaccional, migración 003, correcciones de UI, códigos PED-id, pruebas y documentación. Temporales, respaldos, capturas y credenciales permanecen ignorados. Sin solicitud de push/merge/deploy. El resultado del commit se informa tras verificar Git.

## Asignación manual y despacho · 14/10/2026

Branch-benjamin-1 desde b19a97c. Usuario acepta admin/operador para asignar/reasignar/despachar, ubicación confirmada → En preparación → En envío, chofer activo y confirmación vigente obligatorios para salir, reasignación antes de salida. Corte acotado T07: cuentas chofer reales, asignación, preparación, despacho y consulta de envíos propios. Entrega/cobro/fallos/cancelación, edición de campos de dirección, histórico T06 y reportería siguen pendientes; MVP1 no terminado.

Archivos: dispatch.js incorpora guardas, transacciones y auditoría; app/index conectan rutas; auth/create-user habilitan rol chofer con precondición de esquema; orders admite revisión durante preparación y descarta coordenadas nulas; 004 y migrate agregan FK/rol/estado sin editar init.sql. DispatchPanel y Orders conservan pantallas y agregan controles operativos; LiveDriverApp abre sesión/vista real separada de DriverApp ficticio; Users agrega chofer; ConfirmedMap reutiliza mapa de lectura. Spec asignacion-despacho registra aceptación. Pruebas cubren permisos, transición inválida, chofer inactivo, dirección cambiada, reintentos concurrentes y aislamiento de pedidos por chofer.

Verificación: npm run check OK (38 pruebas pasan, una SQL omitida; lint/build). npm --prefix backend run test:mysql OK en mandatodo_test_20261014_a5c99384; 004 repetible y ocho tablas restauradas con mismos registros en mandatodo_restore_test_20261014_a5c99384. QA navegador solo sintético: PED-1 pasó a preparación; despacho sin chofer rechazado con mensaje; asignación guardada y despacho exitoso; después de salida selección deshabilitada. Captura temp/qa/asignacion-despacho.png. Vista chofer verificada por API/SQL y build, todavía sin recorrido visual autenticado móvil. Sin pedidos humanos despachados, commit, push ni deploy.

Dry-run real: 001/002/003 aplicadas, 004 pendiente. Respaldo real creado tras reintento autorizado fuera del sandbox, SHA-256 c79e780e70b5f58cac17061382f034f68bf30f1a05f1d2975335e5be6741c11f; no se publica SQL. Aplicación 004 pendiente de autorización específica por AGENTS.md, sección Límites de alcance. Ante DDL parcial runner frena; no prometer rollback de ALTER. Revisar objetos faltantes y recuperar de forma acotada o restaurar copia nueva; nunca borrar tablas/volúmenes. Próximo paso inmediato: activar 004 tras autorización y verificar flujo local; luego acordar reglas de entrega y acreditación de pagos.

Actualización posterior: usuario autorizó y se aplicó 004 en base local. Apply exitoso; dry-run final 001–004 already-applied y /health/ready database available. Sin DDL parcial ni cambios a pedidos existentes. Frontend Docker tenía Leaflet ausente: npm ci --no-audit --no-fund autorizado y reinicio frontend recuperaron login. Cuenta previamente aportada para demo no autenticó en esta base local; no se cambió contraseña ni se creó cuenta real. QA operativo sigue acreditado en base sintética; recorrido autenticado de base local pendiente con su cuenta válida. Temporales de credenciales retirados y servicio QA cerrado.

## Docker: base completa y solo admin · 14/10/2026

Usuario pide instalación de una vez para compañeros, sin clientes/pedidos de ejemplo. Cambios propios previos de asignación preservados. initialize.js usa runner existente para base nueva y crea admin de INITIAL_ADMIN_*; valida cuenta antes del DDL, no modifica cuentas en reinicios y frena ante base existente con migraciones pendientes. create-user extrae validación reutilizable. Compose agrega servicio de instalación con root temporal y dependencia service_completed_successfully; monta database solo lectura. index soporta secreto persistido si falta variable; session_config separa secreto generado y backend lo monta de lectura. .env.example documenta cuenta inicial propia; README/acceso actualizan preparación de una orden Docker, sin Node host. Sin init.sql modificado, nuevas migraciones, datos demo ni contraseñas compartidas.

Pruebas: npm run check OK (40 pasan, una SQL omitida, lint/build OK); config Compose y build initialize OK. test:mysql primer ensayo falló por conteo de usuarios de prueba al sumar admin inicial; corregido esperado y repetición completa OK en mandatodo_test_20261014_2da19798, restauración ocho tablas con registros iguales en mandatodo_restore_test_20261014_2da19798. Inicialización inválida deja esquema vacío, repetición no duplica admin, hash distinto de contraseña y rechazo de migración automática de existente pendiente probados. Docker inicializador ejecutado dos veces en mandatodo_test_bootstrap_7ff588f7: cuatro migraciones, un administrador, cero clientes/pedidos. Solo bases sintéticas; no se recrearon servicios de aplicación ni se modificó .env real, usuarios humanos o volúmenes de datos. Build informa cuatro avisos high de dependencias backend; no se ejecutó actualización forzada fuera de alcance. No commit/push. Compañeros deben recibir cambios, completar .env y ejecutar docker compose up -d --build; futuro esquema sobre base poblada requiere respaldo/migración manual. Reglas pendientes de entrega/pagos siguen vigentes.

## Guía de arranque para compañeros · 14/10/2026

Solicitud documental: README actualizado con requisitos Docker Desktop/Linux, ubicación de terminal, copia segura y edición .env, tabla de campos MySQL/admin, instalación automática, estado esperado initialize Exited (0), login, health/ready, stop/up/rebuild y diagnóstico/dependencias. Corrige estado desactualizado del encabezado y distingue creación automática del administrador de alternativa manual. Conserva secciones de IA y ejecución nativa. Sin cambios de código, datos ni configuración real. Comandos contrastados con Compose, .env.example, instalador y ensayos del corte anterior; no se vuelve a levantar ni modificar base por escribir documentación. Diff-check/contexto verificados al cierre. Sin commit/push.

## Vista de chofer más cercana a demo · 14/10/2026

Skill ppp1-frontend. Cambio visual acotado a LiveDriverApp.jsx y nuevo LiveDriverApp.css; conserva DriverApp de demostración, API, roles y filtro de envíos despachados. Marca con icono, saludo, avatar iniciales, sesión activa, resumen de envíos de página (sin falso total diario/avance), tarjetas con estado/destinatario/dirección/teléfono/notas y mapa expandible accesible. Retira texto técnico de próximo corte y paginación innecesaria para única página. Actualizar limpia error para reintento. Referencia: relevamiento previo autorizado de demo y estructura de maqueta local; demo actual abrió login, no autenticación remota de chofer nueva.

Verificación: lint/build frontend OK. QA sesión real chofer sintético en base mandatodo_test_20261014_a5c99384: dos envíos visibles, datos correctos, abrir mapa de lectura, Actualizar conserva resultado. Capturas temp/qa/chofer-vista-desktop.png y chofer-vista-mobile.png. Móvil 320×740, ancho cliente/contenido 305/305, sin scroll horizontal. Sin cambios a pedidos humanos, migraciones ni backend; fixture de credenciales retirada y QA cerrado al terminar. No ensayo de entrega/pago ni estado vacío/error de red en navegador en este corte. Documentación pantallas actualizada; sin commit/push.

## Mapa en pestaña del navegador · 14/10/2026

Usuario pide Ver ubicación en pestaña nueva para chofer y operador. App detecta mapaPedido tras recuperar sesión; OrderMap/estilos consultan pedido vigente mediante API autorizada por rol y muestran mapa amplio de lectura. Enlace compartido OrderMapLink reemplaza mapas embebidos de consulta en LiveDriverApp y LocationReview; target blank y noopener/noreferrer. Carga y edición conservan mapa interactivo. URL solo ID, sin coordenadas ni identidad. Spec existente y pantallas actualizados. Sin cambios backend/DB humana ni migración.

Lint/build frontend pasan. QA chofer sintético: enlace correcto, pantalla original conservada, vista destino propia PED-2 con pin/OSM, ajeno PED-3 rechazado. Navegador integrado no inventarió pestaña al clic target blank; se verificó destino abriendo URL observada en otra pestaña y sesión compartida. QA operador sintético: detalle ofrece mismo enlace y destino se recupera con API staff. Captura temp/qa/mapa-pestana.png. No comprobación de apertura automática en Chrome/Edge ni viewport móvil del nuevo mapa. Fixture retirada y QA cerrado. Sin commit/push.

## Aclaración: mapa en modal · 14/10/2026

Usuario aclara que quería ventana superpuesta con fondo oscuro. OrderMapLink ahora botón con estado local y dialog nativo en LocationReview, consulta sesión/pedido actual con API de rol; cierre X/Escape/fondo y foco devuelto al disparador. Retirados OrderMap.jsx/CSS y ruta mapaPedido de App, sin tab externo. CSS modal responsive en LocationReview.css. Ambos actores reutilizan mismo control; spec/pantallas corregidos por aclaración, histórico conservado.

QA con chofer sintético: primer intento detectó autocierre por cleanup de StrictMode; manejador close ignora evento pendiente cuando dialog ya está abierto, corregido y repetición OK. Mapa/pin/OSM visible sobre fondo oscurecido; X, Escape y clic fondo cierran con foco en Ver ubicación. Móvil 320×740: 305/305, dialog 267px; sin overflow horizontal. Capturas temp/qa/mapa-modal.png y mapa-modal-mobile.png. Operador comparte componente ya conectado; sin nuevo recorrido visual de rol operador en este ajuste. Lint/build frontend repetidos después de fix. Fixture retirada y servicio QA cerrado. Sin cambios backend, DB humana, migración, commit/push.

## Tablero: mapa, chofer y estado en la fila · 14/10/2026

Solicitud sobre captura de tabla. Orders.jsx agrega columna Chofer y Acciones, OrderMapLink en cada fila y DispatchPanel compact con select autoguardado y botones preparación/despacho. Opciones de chofer compartidas en tablero; cada fila obtiene asignación vigente; carga de operación bloquea controles hasta respuesta, inactivo histórico se muestra sin inventar Sin asignar. Error visible local, pending deshabilita acciones; solo respuesta exitosa cambia select/estado. Filtros se vuelven a consultar y detalle abierto se sincroniza; guardado concurrente con cambio de filtro no falla por result null. Se retiran controles operativos duplicados del detalle. Orders.css mantiene tabla en escritorio y tarjetas etiquetadas en móvil. Sin cambios backend/esquema ni reglas de estados; asignación/confirmación siguen validadas servidor. Spec y pantallas actualizados.

QA operador real en base sintética mandatodo_test_20261014_a5c99384: despachar sin chofer rechazado; preparar sin confirmación rechazado; seleccionar chofer en PED-1 guarda automático; despacho desde fila actualiza En envío y bloquea selector; recarga conserva chofer/estado; Ver ubicación desde fila abre modal con pin confirmado. Móvil 320×740 sin overflow (305/305). Capturas temp/qa/tablero-operacion-filas.png y tablero-operacion-filas-mobile.png. Lint/build frontend y diff-check pasan. Solo datos sintéticos; pedidos humanos sin modificar. QA cerrado y fixture retirada. Sin commit/push ni nueva migración; pendientes entrega/pagos previos conservados.

## Detalle de pedido: tarjetas y jerarquía visual · 14/10/2026

Solicitud visual de una pantalla; ppp1-frontend ya aplicado. Orders.jsx reemplaza párrafos planos de detalle por header código/estado/icono/cierre y tarjetas con semántica dl para cliente/DNI/contactos y dirección/CP/localidad/provincia; original y notas diferenciados, vacíos explícitos, tel/mailto. CSS acotado order-detail en Orders.css, grid dos columnas y una móvil. LocationReview y modal/edición se reutilizan sin cambio de comportamiento. Sin backend, migraciones ni reglas nuevas.

Lint/build frontend y diff-check pasan. QA operador sintético: abrir PED-1, tarjetas/datos visibles, abrir/cerrar mapa desde detalle. Desktop 1280×900 y móvil 320×740 sin overflow (305/305). Capturas temp/qa/detalle-pedido-tarjetas.png y detalle-pedido-tarjetas-mobile.png. Sin datos humanos modificados; fixture retirada y QA cerrado al terminar. No nuevas pruebas SQL por cambio de presentación; sin commit/push.

## Entregas, fallos y reintentos · 14/10/2026

Usuario autoriza avanzar y confirma: chofer asignado/admin/operador pueden registrar resultado; receptor obligatorio en entrega, motivo/observación en fallo; sin foto/firma; staff vuelve Fallido a preparación con historial conservado. Corte separado de pago. Skill ppp1-funcionalidad y reglas frontend/backend aplicadas. Sin commit/push autorizado.

Backend deliveries.js valida resultado/clave UUID, autorización por rol/recurso, estado en_camino y transacción pedido/historial. Auditoría JSON usa historial_estados existente con actor/fecha/chofer/receptor/motivo/observación/clave/hash; consultas no exponen clave/hash y suman nombre actual de responsable. Repetir request no duplica; misma clave con otros datos devuelve 409. Reintento staff desde Fallido despeja chofer para próxima salida, audita y conserva intentos. App/index montan módulo antes de guardia staff general. Sin nueva migración, init.sql ni DB humana modificados. Dispatcher sigue exigiendo chofer activo y revisión vigente para salir.

Frontend DeliveryActions/CSS comparte modales real entrega/fallo en chofer y filas del tablero; campo receptor u observación obligatorio; guardando evita cierre/doble clic, Cancelar no cambia datos. Portal refresca pendientes y muestra éxito; acciones staff preparan reintento. DeliveryHistory en detalle muestra línea temporal con receptor/motivo/notas/fecha/responsable. Orders mergea resultado parcial sobre detalle para conservar campos/version/confirmación; QA detectó y corrigió pérdida visual de ubicación confirmada tras reintento. No altera revisión guardada. Spec entregas-intentos, pantallas/decisiones/arquitectura y README actualizados.

Pruebas: npm run check pasa (41 tests sin SQL, uno omitido ahí; lint/build/sintaxis/contexto); test:mysql completo en mandatodo_test_20261014_3836ecd9 y final con consulta nombres en mandatodo_test_20261014_2d8aeda0; restauración final mandatodo_restore_test_20261014_2d8aeda0 conserva ocho tablas/registros. Casos: anónimo 401, chofer ajeno 404, chofer reintento 403, campos inválidos 422, transición inválida409, fallo de auditoría revierte estado, resultado concurrente con misma clave registra una vez, fallo→reintento→despacho→entrega conserva tres eventos, pago sin modificación. Validaciones unitarias y snapshots de API sin secretos. Primer patch falló por contexto app distinto y se reaplicó tras lectura; no cambios parciales de ese patch.

QA navegador en base sintética anterior mandatodo_test_20261014_a5c99384: receptor vacío bloquea, entrega válida retira PED-2 de pendientes; cancelación de fallo sin cambio, motivo/observación guarda PED-1 y deja pendientes vacíos. Operador abre detalle, prepara reintento, asigna chofer, despacha, registra segundo fallo y prepara otra salida: historial conserva cuatro eventos y revisión vigente visible. Móvil modal 320×740 sin overflow (305/305). Capturas temp/qa/entrega-modal.png, intento-fallido-mobile.png, entregas-historial-reintento.png. Consulta con nombre de responsable probada en SQL final; QA helper cargado antes de ese ajuste muestra ID anterior. Lint/build repetidos tras merge detalle OK. Credenciales temporales retiradas y QA cerrado al terminar. Ninguna entrega ni cambio de cuentas humanos. Sin pruebas de cobros ni fotos/firmas. Próximo corte: acordar efectivo/transferencia, responsable de acreditación y relación con entrega; importación/reportería previas pendientes.

## Detalle modal, método de pago y notas opcionales · 14/10/2026

Usuario solicita detalle como mapa/modal, método de pago en entrega y notas opcionales para éxito/fallo. Respuesta explícita: solo efectivo/transferencia. Implementado DetailModal en Orders.jsx con dialog/fondo oscuro, encabezado sticky y scroll interno en Orders.css; conserva tarjetas/historial y mapa modal anidado. DeliveryActions agrega select requerido, envía metodoPago y muestra método en historial; textarea ya no required en fallo. deliveries.js valida método en éxito y motivo en fallo, notas vacías aceptadas; campo incluido en auditoría/hash. No estado PAGADO/acreditación de dinero ni nueva migración. Spec y docs afectados actualizados; histórico no reescrito ni datos inventados en resultados anteriores.

Verificaciones: npm run check OK (41 tests pasan, uno SQL omitido ahí; lint/build/sintaxis/contexto), test:mysql en mandatodo_test_20261014_0b5d7584 y restauración ocho tablas en mandatodo_restore_test_20261014_0b5d7584 OK. Pruebas nuevas: éxito exige método válido, fallo rechaza método, observaciones ausentes permitidas, historial persiste transferencia y notas vacías. QA base sintética mandatodo_test_20261014_a5c99384: receptor completo sin método bloquea formulario; transferencia con nota vacía registra entrega; motivo con nota vacía registra fallo. Operador abre detalle modal, historial muestra Transferencia; mapa anidado y Escape vuelven al detalle, segundo Escape cierra. Selector inicial de QA encontró cinco botones Ver ubicación y se acotó a región detalle; no bug de aplicación. Móvil 320×740 sin overflow (305/305). Capturas temp/qa/detalle-modal.png, detalle-modal-mobile.png, entrega-metodo-pago.png. Sin registros/cuentas humanas modificados, SQL operativo real ni cambios .env. Fixture retirada y QA cerrado al terminar. Sin commit/push. Cobros/acreditación y demás pendientes siguen separados.

## Portal chofer: avance y vistas como demo · 14/10/2026

Usuario pide completar portal real respecto a demostración local anterior. Skill ppp1-frontend / vertical existente; spec portal-chofer creada antes del código. Se inspeccionó DriverApp.jsx como referencia exacta local, sin nuevo login remoto de demo. Usuario ratifica mantener Entregado separado de Pagado. Alcance: marca/nombre/avatar, barra real de avance, tarjeta numerada, botón verde de entrega, vistas Pendientes/Entregadas/Fallidas, detalle modal con contacto/ubicación/notas/historial/método y radios Efectivo/Transferencia como referencia. Conserva observaciones opcionales, receptor/motivo obligatorios y roles aprobados; nada de remito/pagos ficticios. Avance total de pedidos actualmente asignados, sin afirmar avance diario ni orden de ruta optimizado.

Backend dispatch.js amplía lectura chofer con vista validada de tres estados, resumen global independiente de página, estado en payload y detalle permitido solo propietario en esos estados. Filtro se revalida al leer cada pedido, cuenta ajena sin datos. Sin cambios a migración/esquema ni escrituras de negocio. LiveDriverApp/CSS agrega vistas/progreso/detalle; DeliveryActions/CSS cambia select de método por tarjetas radio compartidas. Tests dispatch/integration agregan filtro inválido, finalizada consultable, resumen idéntico en página vacía y ausencia de DNI/email/recursos ajenos.

Verificación: npm run check completo OK (41 pasan, una SQL omitida ahí, lint/build/sintaxis/contexto); test:mysql OK en mandatodo_test_20261014_687ece27 y restauración ocho tablas/registros en mandatodo_restore_test_20261014_687ece27. QA solo mandatodo_test_20261014_a5c99384: dos pendientes → entrega efectivo sin nota → vista Entregadas y avance 1/2; detalle muestra receptor/método y mapa anidado; fallo sin nota → Fallidas y avance2/2 con un éxito y un fallo. Recarga conserva resumen/resultados y vistas; modal móvil sin overflow (305/305 a320×740). Capturas temp/qa/chofer-portal-pendientes.png, chofer-portal-entregadas.png, chofer-portal-mobile.png, chofer-portal-detalle.png, chofer-portal-detalle-mobile.png y chofer-metodo-tarjetas.png. Credenciales temporales retiradas y QA cerrado al terminar. Sin pedidos humanos modificados, commit/push ni migración. Pendientes cobros/acreditación/importación/reportería conservados.

## Guardar avance operativo y comenzar pagos · 14/10/2026

Usuario responde dale a propuesta de cobros/acreditación y commit previo. Se guarda corte actual: rol/portal chofer, asignación y despacho, migración 004, inicialización Docker con admin propio, README, entregas/fallos/reintentos, métodos declarados, observaciones opcionales, modales y tablero por fila. Incluye pruebas/documentación propias acumuladas; temporales/credenciales/respaldos ignorados. Sin push/merge/deploy. Verificaciones del corte previo: check completo, MySQL aislado y restauración OK; diff-check nuevo pasa. Próximo corte requiere respuestas de importe obligatorio, confirmación efectivo/transferencia y comprobantes; preguntas enviadas, reglas no asumidas ni pagos registrados.
