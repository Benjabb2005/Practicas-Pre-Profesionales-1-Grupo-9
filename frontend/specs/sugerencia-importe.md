# Sugerencia del costo de envío desde la sucursal

Responsable: Tomás Laruina (KAN-49). Completa el cambio de alcance del recargo por entrega fallida.

## Problema
El importe del envío se carga a mano al crear el pedido. El sistema tiene un precio por km,
pero no lo usa porque no sabe desde dónde sale el envío ni dónde queda el destino hasta que
se confirma la ubicación en el mapa.

## Alcance
- Una sola sucursal, configurable por el administrador en la pantalla "Tarifa de envío".
- La dirección de la sucursal se normaliza, se valida y se ubica con Georef al guardarla.
- Distancia en línea recta entre la sucursal y el destino confirmado.
- Importe sugerido = km × precio por km. La persona lo acepta o lo cambia.
- El importe deja de ser obligatorio al cargar el pedido.

## Fuera de alcance
- Varias sucursales, distancia por calles, tarifas por zona.
- No se modifica el recargo del 50% ni el registro de pago.

## Criterios de aceptación
- Sin sucursal, sin precio por km o sin ubicación confirmada, no se sugiere ningún número
  y se explica qué falta.
- Una dirección de sucursal con errores (por ejemplo altura S/N) no se guarda.
- Si Georef no encuentra la sucursal, no se guardan coordenadas inventadas.
- Con todo cargado, al confirmar la ubicación se ve "Sugerido: $X (Y km en línea recta)"
  y el campo de importe viene completado con ese valor, editable.
- Un pedido creado sin importe se puede completar después con el botón existente.