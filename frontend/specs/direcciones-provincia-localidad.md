# Provincia y localidad en la carga de dirección

## Problema y alcance

La carga manual de pedidos ya tiene dirección estructurada, pero provincia era texto
libre y localidad no ofrecía ayuda. Eso permitía escribir jurisdicciones que no existen
o localidades de otra provincia. Esta spec cubre sólo el formulario de dirección:

- Provincia se elige de las 24 jurisdicciones que devuelve `GET /api/provincias`.
- Localidad sugiere nombres con `GET /api/localidades?provincia=…&nombre=…`, que el
  backend resuelve contra Georef. El navegador nunca llama a Georef.
- La localidad sigue siendo texto libre: si no aparece en las sugerencias, se puede
  escribir igual. El backend avisa con una advertencia al guardar, nunca con un error.

## No objetivos

- ABM de localidades ni persistencia del catálogo.
- Optimización de rutas, mapas o geocodificación de direcciones (D06 ya cubierto).
- Cambiar las reglas del validador: sigue siendo lógica pura, sin red.

## Pantalla y flujo

Formulario compartido `DireccionForm` (carga manual y detalle de revisión):

1. Al montar, pide las provincias y las muestra en un `<select>` con opción vacía
   "Elegí una provincia". Si el valor guardado no está en la lista, se conserva como
   opción visible para no perder datos viejos.
2. Cuando hay provincia elegida y la localidad tiene 2+ caracteres, espera 300 ms y
   pide sugerencias. Las muestra en un `<datalist>` asociado al `<input>`.
3. Si cambia la localidad o la provincia, descarta respuestas tardías.
4. Si Georef o el backend fallan, no hay sugerencias y el formulario sigue usable.
5. Al guardar, el backend puede devolver `LOCALIDAD_NO_ENCONTRADA` o
   `LOCALIDAD_NO_VERIFICADA` como ADVERTENCIA; se listan con los demás problemas y
   no bloquean geocodificar ni confirmar.

## Criterios de aceptación

- Dado un usuario autenticado en la carga, cuando abre el formulario, entonces ve las
  24 provincias oficiales y no puede escribir una provincia inventada.
- Dada una provincia elegida y "Ros" escrito, cuando Georef responde, entonces el
  `<datalist>` muestra hasta 10 localidades de esa provincia.
- Dado "Rosario del Tala" en Santa Fe, cuando guarda, entonces ve la advertencia
  `LOCALIDAD_NO_ENCONTRADA` y el pedido igual se guarda.
- Dado que Georef no responde, cuando guarda, entonces ve
  `LOCALIDAD_NO_VERIFICADA`, sin error de bloqueo.
- Dado un navegador sin acceso al backend, entonces el formulario no se rompe: la
  localidad se puede escribir a mano y provincia muestra el aviso de recarga.

## Estados y responsive

- Vacío: sin sugerencias hasta elegir provincia y escribir 2 caracteres.
- Cargando provincias: select con opción vacía; si falla, aviso discreto.
- Error de sugerencias: silencioso, sin borrar lo escrito.
- Responsive: el `select` y el `input` respetan la grilla existente de `.form-field`
  y los estilos de error/advertencia se aplican también al `select`.
