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
