# Geolocalización, confirmación y corrección

## Problema y alcance

El operador necesita ver dónde ubica el proveedor una dirección válida, escoger entre resultados ambiguos y confirmar personalmente antes de habilitar el despacho. Este flujo cubre el proveedor del backend, el mapa Leaflet, el historial y el bloqueo de transición a `EN ENVÍO`.

## Flujo

1. La pantalla envía al backend el pedido; el backend acepta sólo direcciones `VALIDA`.
2. Georef devuelve cero o más candidatos. Cero resultados, error, timeout y límite de uso se informan sin fingir una ubicación.
3. Si devuelve varios candidatos, el operador elige uno y lo vuelve a solicitar por su índice. Sólo esa ubicación queda guardada para revisión.
4. El operador elige **Confirmar ubicación** o **No es correcta**. La primera acción deja la dirección `CONFIRMADA` y `direccion_validada = true`; la segunda registra el rechazo y lleva al formulario.
5. Guardar una corrección normaliza y valida otra vez, descarta coordenadas anteriores y permite reintentar sin un contador máximo.
6. `puedeDespacharse(pedido)` es el punto de control del cambio de estado a `EN ENVÍO`; exige `CONFIRMADA`.

## Criterios observables

- Una dirección inválida no alcanza al proveedor.
- El mapa muestra el punto confirmado visualmente, la dirección enviada y la confianza.
- Cada búsqueda, rechazo y confirmación queda asociada a la dirección y al usuario cuando existe.
- Una dirección cambiada pierde coordenadas, confianza y confirmación.
- Un pedido sin estado de dirección `CONFIRMADA` no puede pasar a `EN ENVÍO`.
- Timeout, sin resultados y `429` muestran mensajes accionables y permiten reintentar.
- Las coordenadas permanecen en el mapa Leaflet con tiles de OpenStreetMap; el texto puede partirse sin desbordar la tarjeta en pantallas angostas.

## Límites de proveedores

Georef es el proveedor activo, gratuito y regional. Sus coordenadas se presentan como aproximadas; la confianza es una clasificación conservadora derivada de calle, altura y zona (MEDIO/BAJO), nunca sustituye la confirmación humana. Google queda opcional a futuro: sus resultados no se deben dibujar sobre Leaflet y las coordenadas requieren eliminación a los 30 días según sus términos. Por eso la fábrica rechaza activar Google mientras no exista mapa Google y retención automática.

Referencias oficiales: [Georef, normalización de direcciones](https://datosgobar.github.io/georef-ar-api/addresses/), [términos de Google Maps Platform](https://cloud.google.com/maps-platform/terms/maps-service-terms).
