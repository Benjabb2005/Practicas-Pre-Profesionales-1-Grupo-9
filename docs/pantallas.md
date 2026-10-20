# Referencia de pantallas — relevamiento recibido y revisión local 30/09/2026

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

## Cambios locales implementados · 13/10/2026

Estos cambios son locales y no modifican el relevamiento remoto; la referencia visual sigue siendo la demo.

- **Login real** (`frontend/src/pages/LoginPage.jsx`): conserva el diseño del login de la maqueta, pero ahora valida contra el backend y guarda un token. Se retiraron las cuentas y la contraseña de demostración del código; para probar se usan las cuentas de `seed` definidas por variables de entorno, nunca credenciales versionadas.
- **Usuarios** (`frontend/src/pages/UsersPage.jsx`): pantalla nueva solo para ADMINISTRADOR, con tabla (nombre, email, rol, estado) y formulario de alta/edición. No aparece en el relevamiento remoto de operador y es una pieza propia del MVP.
- El tablero, la carga manual, la barra lateral y la ruta del chofer conservan su aspecto de maqueta; sólo cambiaron de navegación por `useState` a React Router y el cierre de sesión.

No se probó visualmente en navegador ni en viewport móvil en esta sesión; ver límites en [verificación](verificacion.md).

## Carga y revisión implementadas · 15/10/2026 (T04/T05)

Reemplazan a la maqueta de carga manual; conservan el lenguaje visual observado (dos columnas, tarjetas, acentos azules). Detalle funcional en `frontend/specs/pedidos-carga-revision.md`.

- **Carga Manual de Pedido** (`frontend/src/pages/PedidosCargaPage.jsx`, ruta `/form`): columna 1 con selector de cliente frecuente contra `GET /api/clientes` (búsqueda por nombre, email, teléfono o código), campos del cliente (nombre obligatorio, DNI, teléfono, email) y formulario de dirección estructurada (calle obligatoria; altura opcional: sin altura queda borrador). Provincia es un `<select>` con las 24 jurisdicciones de `GET /api/provincias`; localidad ofrece hasta 10 sugerencias de Georef vía `GET /api/localidades` en un `<datalist>`, pero sigue admitiendo texto libre. Si no se elige un frecuente, Guardar da de alta el cliente con `POST /api/clientes` y recién después crea el pedido; el DNI duplicado se rechaza y un teléfono/email parecido sólo se avisa. Los `problemas` que devuelve el backend se listan debajo de la dirección (ERROR en rojo, ADVERTENCIA en amarillo) y resaltan el campo afectado; si quedan problemas después de guardar, aparece "Corregir dirección" hacia el detalle de revisión. `LOCALIDAD_NO_ENCONTRADA` y `LOCALIDAD_NO_VERIFICADA` son advertencias: no bloquean el guardado ni la geocodificación. Columna 2 con mapa Leaflet, estado de validación y botones Geocodificar y Confirmar: Geocodificar exige `VALIDA`; Confirmar exige `VALIDA` y coordenadas, con el motivo visible cuando están deshabilitados. Guardar crea un borrador `EN STOCK`; avisa si hay posibles duplicados sin fusionarlos.
- **Revisión de direcciones** (`frontend/src/pages/PedidosRevisionPage.jsx`, ruta `/pedidos/revision`): tabla de pedidos con filtro por estado de validación (por defecto, sin confirmar) y enlace Revisar. Acceso nuevo en la barra lateral ("Revisión de Direcciones").
- **Detalle de revisión** (`frontend/src/pages/PedidoRevisionDetallePage.jsx`, ruta `/pedidos/:id/revision`): datos del cliente, dirección editable, mapa, historial de intentos de geocodificación y acciones Geocodificar y Confirmar. Los problemas se calculan al leer el pedido, se listan debajo de la dirección y resaltan el campo afectado; al guardar, el backend agrega las advertencias de localidad descriptas arriba. Usa el mismo formulario de provincia y localidad. Geocodificar exige `VALIDA`; Confirmar exige `VALIDA` y coordenadas, con el motivo visible cuando están deshabilitados. Guardar un cambio de calle/altura invalida la confirmación previa y exige revisar de nuevo.
- El mapa es de sólo lectura sobre teselas de OpenStreetMap; la corrección se hace en el formulario y la confirmación siempre la realiza una persona.

Estas pantallas no se probaron visualmente en navegador contra el backend en esta sesión; se acreditan con lint, build y pruebas unitarias de los servicios (ver [verificación](verificacion.md)).
