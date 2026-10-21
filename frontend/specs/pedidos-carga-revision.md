# Carga y revisión de pedidos (T04/T05)

## Problema y usuarios
El operador y el administrador cargan pedidos manualmente y revisan que la
dirección de entrega sea correcta antes de habilitar el despacho. Hoy la pantalla
de carga es una maqueta sin persistencia ni validación geográfica.

## Alcance
- Alta manual de pedido contra `POST /api/pedidos` con dirección estructurada.
- Cliente del pedido: se elige uno existente de `GET /api/clientes` o se dan de
  alta sus datos (nombre, DNI, teléfono, email) con `POST /api/clientes` en la
  misma pantalla. El DNI duplicado se rechaza; un teléfono o email parecido solo
  se avisa, sin fusionar.
- Bandeja de revisión que lista los pedidos cuya validación no está `CONFIRMADA`.
- Detalle de revisión: mapa, intentos de geocodificación, edición de la
  dirección, geocodificación y confirmación manual.
- Rol habilitado: ADMINISTRADOR y OPERADOR. El backend es la única autoridad.

## Fuera de alcance
- Pantalla independiente de ABM de clientes (editar/borrar, D07 pendiente).
- Asignación de chofer, estados de entrega/pago (D04/D09 pendientes),
  optimización de rutas.

## Flujo
1. Carga: elegir un cliente frecuente o completar sus datos para dar de alta uno
   nuevo, cargar dirección, guardar borrador (`EN STOCK`, estado decidido por el
   validador), geocodificar y confirmar en el momento.
2. Revisión: filtrar pedidos no confirmados, entrar al detalle, corregir si hace
   falta, geocodificar y confirmar.

Dado un pedido con dirección confirmada, cuando el operador cambia calle o
altura, entonces la confirmación se invalida y la dirección vuelve a validarse.
Dado un pedido con resultado de geocodificación y estado `VALIDA`, cuando el
operador confirma, entonces `estado_validacion = CONFIRMADA` y
`direccion_validada = 1`.
Dado un operador sin cliente elegido, cuando completa el nombre y guarda, entonces
se da de alta el cliente y recién después se crea el pedido.
Dado un DNI ya registrado, cuando se intenta dar de alta el cliente, entonces el
alta se rechaza como conflicto y no se crea el pedido.
Dado un guardado con problemas de dirección, entonces se listan debajo del
formulario con su mensaje: `ERROR` en rojo y `ADVERTENCIA` en amarillo, y los
campos afectados se resaltan con el mismo color.
Dado un problema de dirección después de guardar en la carga, entonces aparece el
enlace "Corregir dirección" hacia `/pedidos/:id/revision`.
Dado un estado distinto de `VALIDA`, entonces Geocodificar está deshabilitado y se
explica el motivo. Confirmar además exige coordenadas.
Dado un `409` del backend, entonces se muestra el mensaje seguro que devuelve el
servidor.

## Estados de interfaz
- Vacío: sin pedidos / sin coincidencias de cliente.
- Carga: "Buscando…", "Geocodificando…", "Guardando…".
- Error: mensaje uniforme desde `mensajeError` (DNI duplicado, email inválido,
  conflicto al geocodificar o confirmar).
- Éxito: aviso de pedido guardado/confirmado y navegación a revisión.
- Aviso: cliente creado; si hay teléfono o email parecido, se informa sin
  bloquear el alta.
- Dirección: lista de problemas calculados por el backend, resaltado de campos,
  motivo visible bajo cada botón deshabilitado y atajo a la revisión cuando la
  carga guardó una dirección con problemas.

## Responsive
- Layout de dos columnas (formulario + validación) en escritorio; una columna en
  móvil. La grilla del formulario se apila sin escalar con `transform`.
