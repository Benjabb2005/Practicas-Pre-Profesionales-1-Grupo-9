# Carga y revisión de pedidos (T04/T05)

## Problema y usuarios
El operador y el administrador cargan pedidos manualmente y revisan que la
dirección de entrega sea correcta antes de habilitar el despacho. Hoy la pantalla
de carga es una maqueta sin persistencia ni validación geográfica.

## Alcance
- Alta manual de pedido contra `POST /api/pedidos` con cliente real elegido de
  `GET /api/clientes` y dirección estructurada.
- Bandeja de revisión que lista los pedidos cuya validación no está `CONFIRMADA`.
- Detalle de revisión: mapa, intentos de geocodificación, edición de la
  dirección, geocodificación y confirmación manual.
- Rol habilitado: ADMINISTRADOR y OPERADOR. El backend es la única autoridad.

## Fuera de alcance
- ABM de clientes (D07 pendiente), asignación de chofer, estados de entrega/pago
  (D04/D09 pendientes), optimización de rutas.

## Flujo
1. Carga: elegir cliente, cargar dirección, guardar borrador (`EN STOCK`,
   `PENDIENTE`), geocodificar y confirmar en el momento.
2. Revisión: filtrar pedidos no confirmados, entrar al detalle, corregir si hace
   falta, geocodificar y confirmar.

Dado un pedido con dirección confirmada, cuando el operador cambia calle o
altura, entonces la confirmación se invalida y vuelve a `PENDIENTE`.
Dado un pedido con resultado de geocodificación, cuando el operador confirma,
entonces `estado_validacion = CONFIRMADA` y `direccion_validada = 1`.

## Estados de interfaz
- Vacío: sin pedidos / sin coincidencias de cliente.
- Carga: "Buscando…", "Geocodificando…", "Guardando…".
- Error: mensaje uniforme desde `mensajeError`.
- Éxito: aviso de pedido guardado/confirmado y navegación a revisión.

## Responsive
- Layout de dos columnas (formulario + validación) en escritorio; una columna en
  móvil. La grilla del formulario se apila sin escalar con `transform`.
