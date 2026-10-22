# Carga y revisión de pedidos (T04/T05)

## Problema y usuarios
El operador y el administrador cargan pedidos manualmente y revisan que la
dirección de entrega sea correcta antes de habilitar el despacho. Al inicio del
T04 la pantalla de carga era una maqueta sin persistencia ni validación
geográfica; este documento conserva el problema original y los criterios
vigentes.

## Alcance
- Alta manual de pedido contra `POST /api/pedidos` con dirección estructurada,
  canal de origen y observaciones. El canal se elige entre WhatsApp, Instagram,
  correo electrónico, sistema externo y carga manual (predeterminado); el
  servidor valida ese catálogo y guarda el código, mientras la interfaz muestra
  la etiqueta legible. Las observaciones son opcionales.
- Cliente del pedido: se busca y elige uno existente de `GET /api/clientes` por
  DNI (con o sin puntos), nombre o teléfono, o se dan de alta sus datos (nombre,
  DNI, teléfono, email) con `POST /api/clientes` en la misma pantalla. Al elegir
  un frecuente se usa su id y no se crea otro cliente. El DNI duplicado se
  rechaza aunque cambie el formato de puntos, espacios o guiones; un teléfono o
  email parecido solo se avisa, mostrando nombre y DNI del otro cliente, sin
  fusionar.
- Aviso de pedidos duplicados: antes de crear, el backend compara el mismo
  cliente y la dirección normalizada dentro de `DUPLICADOS_VENTANA_HORAS`
  (24 h por defecto). Si hay coincidencia, responde `409`
  `DUPLICADO_POTENCIAL`, no crea el pedido y devuelve los pedidos existentes.
  La pantalla los muestra y exige una confirmación explícita. La comparación
  tolera abreviaturas e iniciales; la altura debe estar cargada y coincidir y,
  cuando localidad o provincia están cargadas en ambos pedidos, también. El
  piso/departamento no define por sí solo la identidad de la dirección.
- Bandeja de revisión que lista los pedidos cuya validación no está `CONFIRMADA`.
- Detalle de revisión: mapa, intentos de geocodificación, edición de la
  dirección, geocodificación y confirmación manual.
- Problemas de dirección: la carga y la revisión muestran los `ERROR` y
  `ADVERTENCIA` que devuelve el backend, resaltan los campos afectados y, si el
  pedido ya se guardó, ofrecen un enlace a la revisión para corregirlos.
- Rol habilitado: ADMINISTRADOR y OPERADOR. El backend es la única autoridad.

## Fuera de alcance
- Pantalla independiente de ABM de clientes: ya existe fuera de esta pantalla
  (`abm-clientes.md`); la carga de pedido se limita a buscar y elegir.
- Resolución o fusión automática de pedidos duplicados (D11 pendiente): el
  operador sólo confirma o cancela la creación.
- Asignación de chofer, estados de entrega/pago (D04/D09 pendientes),
  optimización de rutas.

## Flujo
1. Carga: buscar un cliente frecuente por DNI, nombre o teléfono y elegirlo, o
   completar sus datos para dar de alta uno nuevo; cargar dirección, elegir el
   canal de origen, escribir observaciones si hace falta y guardar el borrador
   (`EN STOCK`, estado decidido por el validador). Si la dirección queda
   `VALIDA`, al guardar la búsqueda en OpenStreetMap se inicia automáticamente;
   si hay `ERROR` o `ADVERTENCIA`, primero se muestran los problemas y se
   corrigen. Luego el operador revisa el punto y confirma. El botón «Buscar
   dirección en el mapa» queda para reintentar. El resumen del pedido guardado
   muestra el canal y el estado `EN STOCK`. El mapa muestra «Sin coordenadas
   todavía» mientras el pedido no tenga un punto; nunca se abre en (0,0). La
   búsqueda informa si el resultado fue preciso, aproximado, sin resultados o
   con error. Sólo una dirección `VALIDA` con coordenadas habilita «Confirmar
   ubicación y habilitar despacho». Guardar crea el borrador; la confirmación
   humana es lo que habilita el despacho. Si el punto no es correcto, el panel
   enlaza a la revisión para corregir la dirección. Al volver a buscar, el mapa
   se recentra en las nuevas coordenadas.
2. Duplicado: si el cliente ya tiene un pedido con la misma dirección
   normalizada dentro de la ventana configurada, el alta no se crea. La pantalla
   muestra los pedidos existentes y ofrece «Sí, crear otro pedido» o
   «Cancelar». Cambiar cualquier dato descarta el aviso.
3. Revisión: filtrar pedidos no confirmados, entrar al detalle, corregir si hace
   falta, geocodificar y confirmar.

Dado un operador que elige un canal de origen y escribe observaciones, cuando
guarda el pedido, entonces el alta responde `201`, el pedido queda en `EN STOCK`
y ambos datos se persisten y se muestran en el resumen.
Dado un pedido enviado con un `estado` distinto de `EN STOCK`, cuando se guarda,
entonces el servidor ignora ese valor y conserva el estado inicial.
Dado un canal de origen fuera del catálogo, cuando se envía el alta, entonces
responde `400` con el campo afectado y no se crea el pedido.
Dado un pedido existente del mismo cliente con la misma dirección normalizada
dentro de la ventana configurada, cuando se intenta guardar otro sin
confirmación, entonces responde `409 DUPLICADO_POTENCIAL`, no se crea el pedido
y el aviso muestra los datos del pedido existente.
Dado ese aviso, cuando el operador confirma «Sí, crear otro pedido», entonces el
pedido se crea y se informa que la coincidencia fue confirmada.
Dado ese aviso, cuando el operador cancela o modifica el cliente, la dirección,
el canal o las observaciones, entonces el aviso desaparece y no se crea nada.
Dado un pedido con la misma dirección escrita de otra forma pero normalizada
equivalente, entonces el aviso se dispara igualmente.
Dado un pedido de otro cliente, fuera de la ventana configurada, con otra altura
o con localidad/provincia diferentes, entonces no se avisa duplicado.
Dado un pedido con dirección confirmada, cuando el operador cambia calle o
altura, entonces la confirmación se invalida y vuelve a `PENDIENTE`.
Dado un pedido con resultado de geocodificación y estado `VALIDA`, cuando el
operador confirma, entonces `estado_validacion = CONFIRMADA` y
`direccion_validada = 1`.
Dado un guardado con problemas de dirección, entonces se listan debajo del
formulario con su mensaje: `ERROR` en rojo y `ADVERTENCIA` en amarillo, y los
campos afectados se resaltan con el mismo color.
Dado un problema de dirección después de guardar en la carga, entonces aparece el
enlace «Corregir dirección» hacia `/pedidos/:id/revision`.
Dado un estado distinto de `VALIDA`, entonces Geocodificar está deshabilitado y se
explica el motivo. Confirmar además exige coordenadas.
Dado un pedido guardado sin coordenadas, cuando se muestra la validación,
entonces el mapa muestra «Sin coordenadas todavía» y no un mapa en (0,0).
Dado un pedido con búsqueda precisa o aproximada y estado `VALIDA`, cuando
termina la consulta, entonces el punto se muestra en el mapa y se habilita la
confirmación.
Dado un pedido con búsqueda sin resultados o con error, cuando termina la
consulta, entonces no se inventan coordenadas, se muestra el motivo y la
confirmación sigue deshabilitada.
Dado un pedido recién guardado con dirección `VALIDA`, cuando termina el alta,
entonces la búsqueda en OpenStreetMap se inicia automáticamente, sin que el
operador toque el botón.
Dado un resultado con punto y estado `VALIDA`, cuando termina la búsqueda,
entonces el botón de confirmación se ve habilitado y se puede accionar.
Dado un resultado sin punto o un error de búsqueda, entonces el botón de
confirmación se ve deshabilitado y atenuado.
Dado un pedido guardado, cuando el operador usa «Cargar otro pedido», entonces
se limpian los campos, el canal, las observaciones, el resultado y la búsqueda
interna del selector, y se muestra «Formulario limpio».
Dado un cliente existente, cuando el operador escribe su DNI con o sin puntos, su
nombre o su teléfono, entonces aparece en los resultados con DNI y teléfono para
identificarlo.
Dado un cliente frecuente elegido, cuando el operador guarda el pedido, entonces
se usa el id de ese cliente y no se crea un cliente nuevo.
Dado un operador sin cliente elegido, cuando completa el nombre y guarda, entonces
se da de alta el cliente y recién después se crea el pedido.
Dado un DNI ya registrado, cuando se intenta dar de alta el cliente con otro
formato de puntos, espacios o guiones, entonces el alta se rechaza como
conflicto y no se crea el pedido.
Dado un cliente nuevo con un teléfono o email que coincide con otro cliente,
cuando se guarda, entonces el cliente y el pedido se crean y el aviso identifica
al otro cliente con nombre y DNI, sin fusionar datos.

## Estados de interfaz
- Vacío: sin pedidos / «Sin coincidencias. Completá los datos para dar de alta un
  cliente nuevo.»
- Carga: "Buscando…", "Buscando en el mapa…" (automático al guardar o manual),
  "Guardando…".
- Error: mensaje uniforme desde `mensajeError` (canal inválido, DNI duplicado, DNI
  con caracteres no admitidos, email inválido, observaciones demasiado largas).
  Si falla la búsqueda automática, el aviso aclara que el pedido ya se guardó.
- Éxito: aviso de pedido guardado con su canal y estado `EN STOCK`; aviso de
  pedido confirmado y navegación a revisión.
- Resultado geográfico: bloque visible con coincidencia precisa, aproximada,
  sin resultados o error; la confirmación sólo se habilita con estado `VALIDA`,
  punto y el botón se ve azul cuando está habilitado, atenuado cuando no.
  «Cargar otro pedido» muestra «Formulario limpio» y reinicia la búsqueda del
  selector.
- Dirección: lista de problemas calculados por el backend, resaltado de campos,
  motivo visible bajo cada botón deshabilitado y atajo a la revisión cuando la
  carga guardó una dirección con problemas.
- Aviso: cliente creado; si hay teléfono o email parecido, se informa con nombre
  y DNI del otro cliente sin bloquear el alta.
- Duplicado: aviso visible con la lista de pedidos existentes (código o id,
  estado, fecha y dirección) y las acciones «Sí, crear otro pedido» y
  «Cancelar». No hay creación hasta la confirmación explícita y el botón
  «Guardar pedido» queda deshabilitado mientras el aviso está visible.
- Éxito tras confirmar un duplicado: el pedido se guarda y el aviso indica que se
  confirmó la coincidencia.
- Resumen del pedido guardado: canal de origen con etiqueta legible y estado
  `EN STOCK`; no se ofrece editar el estado en esta pantalla.

## Responsive
- Layout de dos columnas (formulario + validación) en escritorio; una columna en
  móvil. La grilla del formulario se apila sin escalar con `transform`.
