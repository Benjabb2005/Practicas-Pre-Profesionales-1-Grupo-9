# Previsualización de ubicación en la carga

## Problema
Según la devolución del profesor (28/10/2026), la carga debe ser más dinámica: hoy el mapa depende del pedido guardado. Hay que mostrar una ubicación **tentativa** mientras se completa la dirección, sin pulsar Guardar pedido.

## Alcance
- Búsqueda automática en `PedidosCargaPage` mientras no hay pedido guardado.
- Endpoint `POST /api/pedidos/previsualizar-ubicacion` (contrato en `docs/arquitectura.md`): sin pedido, sin cliente, sin importe, sin persistencia.
- El resultado tentativo se mantiene separado de la ubicación confirmada.

## Fuera de alcance
- Guardar, confirmar, asignar o despachar: no cambian. La confirmación sigue siendo humana, sobre el pedido guardado.
- Fallback directo al proveedor desde el navegador y obligatoriedad de código postal.
- Arrastrar el marcador.

## Flujo
- Se busca con calle, altura y provincia; localidad y CP mejoran el resultado pero no se exigen.
- Debounce de 500 ms. Cada cambio de calle, altura, localidad, provincia o CP cancela la consulta en vuelo. Piso/depto y entre calles no reinician la búsqueda.
- Cada resultado queda atado a la dirección que lo originó: si esos datos cambian o se vacían, el punto deja de mostrarse de inmediato.
- Al guardar, la previsualización se apaga y rige el flujo existente (geocodificar, elegir candidato, confirmar).

## Criterios de aceptación
- Dado calle, altura y provincia completos, cuando pasan 500 ms sin escribir, entonces el mapa muestra el punto tentativo sin guardar.
- Dado un cambio rápido de dirección, entonces se hace una sola consulta y una respuesta atrasada se descarta.
- Dado que se vacía calle, altura o provincia, entonces el mapa vuelve al estado vacío y no queda punto viejo.
- Dado más de un candidato, entonces se listan y el mapa no muestra ninguno hasta que el operador elige uno.
- Dada una dirección que el servidor considera incompleta (por ejemplo altura S/N), entonces se explica el motivo y no se consulta al proveedor.
- Dado ZERO_RESULTS, entonces se informa sin coordenadas inventadas.
- Dado un error del proveedor o de red, entonces se informa y hay botón Reintentar.
- Sólo ADMINISTRADOR y OPERADOR autenticados pueden consultar; no se crean pedidos ni clientes ni registros de geolocalización.

## Estados
Incompleta, esperando, buscando, tentativa (un candidato), varios candidatos, sin resultados, error con reintento.

## Responsive
El panel de validación usa el layout existente; la lista de candidatos y los mensajes ocupan el ancho de la columna también en móvil.
