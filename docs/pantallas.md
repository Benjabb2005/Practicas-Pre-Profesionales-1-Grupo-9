# Referencia de pantallas — relevamiento recibido y revisión local 30/09/2026

Corrección posterior 13/10: carga con un solo botón Confirmar ubicación y guardar pedido; Enter no guarda fuera de ese flujo. Dirección original opcional. Sin controles de coordenadas; el punto se mueve por clic/arrastre y eso desmarca la revisión. Tablero muestra mapa de ubicación confirmada de lectura, sin consulta/confirmación repetida; Editar abre nueva revisión con observación e historial, Cancelar conserva la ubicación guardada. Códigos visibles PED-id, históricos internos preservados. Esta versión prevalece sobre la descripción de controles del primer corte.

T05 local 13/10: detalle del tablero agrega Leaflet/OSM, consulta de candidatos Georef, corrección por clic/coordenadas y revisión humana con observación. No reemplaza pantallas existentes ni habilita despacho. Confirmación admin/operador vinculada a revisión de dirección, pendiente de activar migración 003 en base local. Componente QA sin datos humanos verificado a 320 y 1280 px; cartografía visible. Georef real falló HTTP 500. [Contrato](mapa-ubicacion.md).

Tipografía ajustada posteriormente: Cargar Pedido y formularios compartidos con etiquetas/ayuda 13 px, entradas y nombres de lista 14 px, detalles 12 px y títulos 16/22 px. Se mantienen campos compactos de 30 px escritorio/36 móvil. Verificado en escritorio y 320 px, sin desborde horizontal.

Filtro en vivo de frecuentes: al escribir parte del DNI/email/teléfono aparece lista con nombre y datos de identificación/contacto, se acota al completar y muestra sin coincidencias. Sin botón Buscar; 250 ms de espera y consultas viejas canceladas. Seleccionar autocompleta cliente y cierra lista. Verificado con datos sintéticos en escritorio y móvil; regla de no duplicar personas conservada.

D11 posterior: retirada casilla de registrar coincidencia por separado. Al salir de DNI/email/teléfono, una coincidencia exacta normalizada muestra aviso junto a cliente, error en campo y candidatos frecuentes; Guardar bloqueado hasta selección/corrección. Seleccionar limpia aviso y permite otro pedido. Backend impone la misma regla, sin bandera de excepción.

Compactación del 13/10: Cargar Pedido vuelve a controles de 30 px en escritorio, textos y espacios moderados, textarea 52 px y grillas de cliente/dirección. Se retira transform scale(1.5) preexistente para dimensionar directamente; navegación ajustada. Controles de 36 px en móvil y sin desborde a 320 px. Usuarios comparte el estilo compacto de formulario. No hay cambios de permisos/validación/guardado.

Usuarios (solicitud del 13/10, nueva funcionalidad propia, no observación de demo): visible a admin, listado nombre/email/rol/estado y formulario de alta con contraseña/confirmación. Operador no ve acceso y servidor rechaza operación. [Spec Usuarios](../frontend/specs/usuarios.md). Comprobada visualmente en escritorio y 320×740 con cuenta/base sintéticas; sin desborde global.

Segundo corte del 13/10: [carga persistida](../frontend/specs/carga-persistida.md), con obligatorios acordados, Piso/Depto y notas opcionales, búsqueda/selección explícita de frecuentes. Guardado lleva a éxito con código y revisión pendiente. Tablero consulta MySQL, filtros/fechas/paginación y detalle. Se retiraron controles de agrupamiento y chofer simulados de estas pantallas hasta su implementación autorizada. Descripción de maqueta de carga/tablero del primer corte siguiente es histórica; mapa/confirmación siguen pendientes.

Actualización local del 13/10: login conectado a servidor, sin cuentas hardcodeadas; recupera sesión y muestra nombre/rol reales. Acceso explícito al prototipo del chofer con aviso de datos ficticios; no es login real de chofer. Tablero/carga conservan maqueta con aviso de que no guardan. Clientes independiente sigue deshabilitado por corresponder a MVP 2. [Spec del acceso](../frontend/specs/acceso-real.md). La descripción local antigua de rechazo al chofer queda superada por la demo implementada antes de este corte.

## Procedencia
Las observaciones de roles y pantallas siguientes provienen del ZIP, de una sesión previa; no son pruebas repetidas por este agente. En esta preparación se abrió la URL en navegador y se verificó únicamente el login público: marca, mensaje, usuario/email, contraseña y botón de ingreso. No se proporcionó una sesión autenticada ni se usaron las cuentas locales contra la demo. El acceso textual web falló; el navegador sí cargó el login. No se probaron pedidos, guardado, mapas, pagos ni viewport móvil remoto.

URL: https://demo-tp.vercel.app/
Esta es la referencia visual final indicada por el usuario. Observación mediante navegador, sin examinar su implementación. No confundir presencia de botones con funcionamiento validado. No se crearon ni modificaron pedidos durante esta revisión.

## Login
Marca MandáTodo / Sistema Logístico. Mensaje “Gestión simple. Entregas seguras.”. Usuario o email, contraseña, Iniciar sesión. El ZIP informa acceso previo a tres roles mediante el mecanismo seguro del navegador; esta integración solo volvió a observar el login público. No almacenar credenciales ni replicar cuentas hardcodeadas en la aplicación real.

## Administrador y operador
Ambos muestran navegación: Cargar Pedido, Tablero de Envíos, Rutas PRÓX., Clientes PRÓX. Identidad/rol y Cerrar sesión. Las vistas observadas coinciden en controles visibles; esto no demuestra que deban tener permisos idénticos ni valida autorización del servidor.

### Tablero General de Despacho
- Encabezado Centro de Operaciones y acceso Cargar nuevo pedido.
- Indicadores: Pedidos Registrados, En Preparación, En Ruta de Envío, Entregados y Pagados.
- Envíos del Día; botón Agrupar envíos lejanos automáticamente (no ejecutado).
- Filtro de estado: todos, EN STOCK, EN PREPARACIÓN, EN ENVÍO, ENTREGADO, PAGADO.
- Filtro de chofer: todos, Andrés Silva, Roberto Piazza, Federico Muñoz. Son valores de la demo, no lista a hardcodear.
- Estado vacío: “Todavía no hay pedidos cargados”, explicación y Cargar primer pedido. Todos los contadores eran cero.
- Navegación verificada desde tablero a carga y cambio de rol por cierre de sesión.

### Carga Manual de Pedido
Sección 1 Datos del cliente y envío; sección 2 Validación Geográfica.
- Cliente frecuente: búsqueda cuyo placeholder indica DNI, email o teléfono. No se verificó autocompletado.
- Nombre y apellido obligatorios según asteriscos.
- DNI, teléfono, email sin asterisco visible.
- Calle, altura, localidad y código postal obligatorios según asteriscos.
- Piso/Depto, entre calles, notas/instrucciones de entrega.
- Chofer: Sin asignar o uno de los tres nombres de la demo.
- Estado inicial: En stock o En preparación.
- No se observó un campo Provincia.
- Panel geográfico con texto de actualización en tiempo real, área de ubicación vacía y mensaje para completar dirección.
- En formulario vacío: alerta “La altura falta o no es válida” y botón Confirmar Ubicación y Habilitar Despacho deshabilitado; botón Corregir Datos visible.
- Botón Ver tablero.
No se comprobó qué acción guarda el pedido ni si la confirmación guarda y habilita a la vez. Tampoco se probó servicio real de mapas o selección de resultados.

### Aspecto visual observado en carga, escritorio
Barra lateral azul marino oscuro con marca y navegación; acentos azules; fondo gris muy claro; tarjetas blancas con bordes redondeados. Área principal con título, descripción y dos columnas: formulario ancho a la izquierda, validación geográfica a la derecha. Etiquetas por encima de campos; jerarquía por secciones; alerta roja suave; botón primario azul. Mantener este lenguaje visual. No hay medidas ni tipografías exactas verificadas. No se probó viewport móvil.

## Chofer
Pantalla diferente del panel administrativo. Marca MandáTodo, saludo y nombre Andrés Silva, indicador En línea, HOY y número de paradas. Avance del Día con paradas completadas/total. Estado vacío: “No tenés entregas asignadas todavía”; indica que al asignar un pedido aparecerá con sus datos. No hay pedidos visibles, por lo que no se observaron tarjetas, acciones de navegación, confirmación de entrega ni registro de pago.

## Diferencias con el Docs y límites de alcance
1. Clientes aparece PRÓX. en demo, mientras el Docs propone gestión de clientes en MVP 1. Separar datos del cliente al cargar pedido, búsqueda/recuperación de frecuentes y pantalla independiente de listado/ABM. Los dos primeros pertenecen al flujo propuesto; el ABM independiente sigue pendiente de confirmar. La etiqueta no elimina datos del cliente ni confirma el módulo independiente.
2. Agrupar envíos lejanos automáticamente aparece en tablero, pero agrupamiento corresponde a MVP 2. Mantenerlo fuera de implementación MVP 1 salvo nuevo acuerdo; no prometer que ya funciona.
3. Provincia figura en el Docs y no en el formulario. Resolver cómo capturarla/derivarla con confirmación explícita; no asumir toda localidad dentro de Provincia de Buenos Aires (CABA es diferente).
4. DNI no tiene asterisco, pero sustenta identificación de clientes. Definir obligatoriedad y alternativa cuando falte.
5. Código postal tiene asterisco. Confirmar si realmente debe bloquear carga cuando la dirección es localizable sin él.
6. El contador Entregados y Pagados agrupa dos hechos. Definir métricas y estados de entrega/pago sin asumir que son equivalentes.
7. La ausencia de pedidos impide revisar flujo completo. Obtener capturas de casos poblados o probar con datos ficticios en entorno local de desarrollo; no marcar estos flujos como verificados.

## Criterios propuestos para implementación (no pruebas realizadas)
- El operador carga, valida y confirma mapa antes de habilitar despacho.
- Cambiar una dirección previamente confirmada debe invalidar esa confirmación y requerir nueva revisión.
- Bloqueo de despacho y permisos se hacen cumplir en backend.
- El chofer solo accede a entregas autorizadas/asignadas, incluso si intenta consultar otro ID.
- Errores de geocodificación y de guardado muestran estado comprensible sin inventar éxito.
- Adaptar formulario y vista de chofer a móvil sin perder campos ni acciones.
- Completar especificación de estados vacíos, cargando, error, éxito y reintento cuando se revise cada flujo.

## Código local inspeccionado en esta preparación

Reinspeccionado al integrar el ZIP actualizado; no se modificó código de interfaz.
frontend/src/App.jsx reproduce login, tablero vacío y formulario. La navegación usa estado React. Admin y operador entran a la misma identidad visible de operador; chofer se rechaza. No existe la vista vacía de chofer del relevamiento remoto. Rutas y Clientes están deshabilitados. Los filtros y búsqueda son visuales, el mapa es un placeholder, la alerta es estática y confirmar está siempre deshabilitado. No se observó selector de estado inicial en el formulario local. No hay guardado ni llamadas al backend. Los asteriscos de Field no aplican required al input. Esta inspección de código no equivale a una prueba visual en navegador.

## Revisión pendiente por decisión del usuario

El 30/09/2026 el usuario indicó dejar pendiente el acceso de prueba. No había sesión autenticada disponible y no se recibió repositorio del prototipo. No se probaron pedidos poblados, validación exitosa, entregas ni pagos. Para retomar T08, habilitar sesión de prueba desde el navegador o aportar código autorizado, capturas/exportación sin credenciales ni datos personales. Nunca pedir contraseñas por chat. Registrar por flujo: rol, datos sintéticos, estado inicial, acción, resultado visible y evidencia; distinguir interfaz de persistencia y autorización real.


## Revisión autenticada y mapa durante carga · 13/10/2026

Usuario autorizó demo referenciada en temp, cuentas de prueba y dirección. Recorridos admin/operador/chofer: carga con mapa automático, confirmación/guardado, estado inicial stock/preparación, filtros estado/chofer, detalle al pulsar fila, dirección repetida con Cancelar y revisar / Continuar de todos modos, mapa chofer, entrega/cobro simulado efectivo y transferencia (ambos PAGADO). Rutas/Clientes próximos; agrupamiento de envíos cercanos sin cambio observable; frecuentes solo sin coincidencia. Sin prueba de banco/remito, permisos API o persistencia remota. No registrar aquí credenciales ni dirección privada.

Carga de demo: formulario izquierda y Validación Geográfica derecha; Corregir Datos enfoca calle. DNI/contactos opcionales allí; MandáTodo conserva D08 y provincia obligatoria. Implementación local: mapa automático tras 500 ms, candidato único visible sin confirmación automática, múltiples seleccionables, error/vacío permite corrección manual con observación. Cambiar dirección descarta revisión y aborta consulta. Confirmar ubicación y guardar pedido persiste todo en una transacción. Despacho operativo/chofer/pagos siguen pendientes. Georef v1 real y mapa verificados; 003 aplicada. 1280×900 1265/1265 y 320×740 305/305. Capturas ignoradas en temp/qa/mapa-en-carga.png y mapa-en-carga-mobile.png. Esta actualización supera los pendientes del primer corte T05.

## Asignación y despacho · 14/10/2026

Se conservan carga y tablero. El detalle agrega selección de chofer activo, Guardar asignación, Pasar a En preparación y Despachar · En envío según estado. Errores visibles; despacho verifica en servidor ubicación vigente y chofer activo. Después de salir la asignación queda de lectura. Usuarios permite crear cuentas chofer solo por administrador. Login de chofer abre vista real de sus envíos con contacto necesario y mapa confirmado de lectura; la demostración ficticia queda separada. Entrega y cobro todavía pendientes. Sin 004 aparece aviso de operación no activada.

## Vista real del chofer: ajuste visual · 14/10/2026

Usuario solicita similitud con demo. Se toma el relevamiento previo del portal chofer y la maqueta local como referencia: marca/icono, saludo/avatar, indicador de sesión, tarjeta resumen y tarjetas de entrega. LiveDriverApp conserva API/identidad real y suma CSS propio para no modificar DriverApp ficticio. Cuenta de envíos corresponde solo a página actual; no presenta avance completado ni total diario porque API todavía no informa entregas finalizadas. Datos de contacto, dirección/notas y mapa confirmado de lectura; teléfono con enlace tel. Sin acciones ficticias de entrega/pago. Estado vacío explica aparición después del despacho. No nuevo recorrido autenticado de demo: referencia abrió login y se usó relevamiento ya registrado.

14/10, solicitud posterior: mapa de consulta pasa a pestaña nueva con Ver ubicación en chofer y detalle operador/admin. App abre OrderMap autenticado por mapaPedido; consulta API de rol con ID, sin coordenadas ni datos del cliente en URL. Carga y corrección mantienen mapa en formulario. Vista de consulta amplia, de lectura, con Volver al sistema.

14/10, aclaración: Ver ubicación ahora abre ventana modal sobre chofer o detalle operador/admin, con fondo oscuro, título/dirección/mapa, X y cierre por Escape/fondo. Se retira vista mapaPedido y nueva pestaña literal. Mantiene permisos y consulta vigente; carga/edición conservan mapa en formulario.

14/10, tablero operativo por fila: Código/Cliente/Dirección/Chofer/Estado/Acciones. Chofer select guarda al cambiar; estado tiene distintivo y botón de transición válida, errores/pending en fila. En envío deshabilita reasignación. Acciones Ver ubicación abre modal desde fila y Ver detalle muestra datos/revisión; controles operativos ya no duplicados en detalle. Móvil presenta filas como tarjetas etiquetadas.

14/10, detalle visual: encabezado con icono/código/distintivo de estado y Cerrar detalle; cuadrícula de tarjetas Cliente, Dirección de entrega, Ubicación y revisión e Indicaciones. Campos con etiquetas, DNI/contactos separados, enlaces teléfono/email, dirección original en recuadro y notas con saltos de línea conservados. Móvil una columna. Consulta mapa modal y edición existentes conservadas.

## Entregas e intentos · 14/10/2026

Chofer: Registrar entrega e Intento fallido en cada envío abren modal con receptor u observación/motivo. Cancelar no modifica; guardando bloquea cierre/doble envío. Confirmar éxito actualiza pendientes y muestra mensaje; no afirma pago. Tablero: mismas acciones en En envío; Fallido ofrece Preparar reintento y vuelve a En preparación sin chofer asignado. Detalle agrega historial de intentos/reintentos con fecha/responsable/receptor/motivo/observación. Motivos disponibles: ausente, rechazo, dirección incorrecta, sin acceso u otro. Layout móvil y modalidades mapa/detalle conservados.

14/10, detalle ahora modal: conserva tarjetas e historial sobre tablero oscurecido, scroll interno y encabezado de cierre fijo. Cierre con botón/Escape/fondo; mapa se abre encima y cerrar mapa devuelve al detalle. Entrega incorpora select obligatorio Efectivo/Transferencia; observaciones opcionales en ambos formularios, historial muestra método registrado.

## Portal chofer completo sobre demo local · 14/10/2026

Referencia DriverApp.jsx y relevamiento previo. LiveDriverApp recupera nombre/avatar/marca, numeración de tarjetas, barra de avance y botón entrega verde; agrega navegación Pendientes/Entregadas/Fallidas, contadores globales y detalle modal propio con dirección/contacto/indicaciones/historial/método. Las finalizadas permanecen consultables a su chofer actual. Avance de tus envíos cuenta pedidos actualmente asignados en envío/entregado/fallido, resueltos = entregados+fallidos; no es jornada diaria ni ruta optimizada. Reintento que despeja/reasigna chofer deja de verse al anterior según propiedad vigente. Método exitoso ahora tarjetas radio Efectivo/Transferencia en formulario compartido. Usuario ratifica no marcar PAGADO automáticamente. Mapa/modal anidado y estados vacíos por vista conservados.

14/10, revisión integral: mensajes posteriores a confirmación/carga ya indican preparar/asignar/despachar desde tablero; retirado aviso viejo de despacho no habilitado. Editar ubicación se ofrece solo en estados que admite backend (pendiente_validacion, requiere_revision, direccion_validada, en_preparacion); demás estados dejan consulta del mapa. Si estado cambia mientras editor abierto deja de ofrecer esa edición.

## Tema claro/oscuro · 14/10/2026

Barra global superior con botón Modo oscuro / Modo claro, visible desde login y roles reales/demo. Sidebar se ubica debajo de barra para no tapar marca; móvil conserva controles separados. Tema afecta superficies/textos/campos/estados/errores/modales y presentación Leaflet (tiles filtrados, controles oscuros, pin y atribución preservados). Preferencia local por navegador, persiste recarga/logout y sincroniza entre pestañas; primera carga usa preferencia sistema. Cambiar no borra formularios ni altera datos de pedidos.

Ajuste de tema (14/10): sin barra superior adicional ni aviso operativo amarillo. Ícono sol/luna junto a marca del menú, esquina del login y encabezado chofer. Oscuro en gris carbón; demo identificada discretamente como ficticia.

El menú lateral conserva el azul original tanto en modo claro como oscuro (pedido posterior del usuario).

Tablero: encabezado sin descripción técnica de MySQL; filtros de estado y fechas con labels13px, controles14px y altura36px para facilitar lectura.

Por devolución posterior, filtros del tablero se compactan: labels10px, controles/botón11px y altura mínima28px, reemplazando tamaños del ajuste anterior.

## Búsqueda de pedidos · 14/10/2026

Tablero administrador/operador: buscador compacto por código PED, nombre completo, DNI o teléfono. Buscar o Enter aplica coincidencia parcial literal en toda la base; Limpiar búsqueda conserva estado/fechas. Combina filtros, vuelve a página1 y mantiene total/paginación del resultado. Estados cargando/error/vacío existentes; pantalla móvil adapta filas.

Buscador admite número de pedido sin PED-: coincidencia exacta de ID además de búsqueda DNI/teléfono. Error de choferes se muestra separado con reintento; Actualizar vuelve a consultar choferes.

Búsqueda numérica ahora exacta: número de pedido, DNI completo o teléfono completo. No se compara un número corto con fragmentos de contactos.
