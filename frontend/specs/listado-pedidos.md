# Listado de pedidos con filtros

## Problema y usuarios
El administrador y el operador necesitan encontrar pedidos ya cargados sin recorrer
toda la tabla ni depender de la bandeja de revisión de direcciones. El tablero
general era una maqueta con contadores en cero y filtros visuales; este corte lo
convierte en el listado real de pedidos del MVP1.

## Alcance
- `GET /api/pedidos` acepta filtros combinables por:
  - `estado`: uno de `EN STOCK`, `EN PREPARACIÓN`, `EN ENVÍO`, `ENTREGADO` o `PAGADO`.
  - `cliente`: texto libre que busca en nombre, DNI, teléfono y email del cliente.
    Si el texto contiene dígitos, también busca DNI/teléfono sin puntos ni guiones.
  - `fecha_desde` y `fecha_hasta`: días completos en formato `AAAA-MM-DD`; el rango
    es inclusivo y se aplica sobre `pedidos.created_at`.
  - `estado_validacion` se conserva para la bandeja de revisión.
- Sin filtros, el listado devuelve todos los pedidos. El orden es por fecha de
  creación descendente y, ante empate, por id descendente.
- La pantalla principal (`/`, «Tablero General de Despacho») muestra:
  - cuatro contadores reales calculados sobre todos los pedidos: registrados,
    en preparación, en ruta de envío y entregados o pagados;
  - filtros de estado, cliente y rango de fechas;
  - tabla con pedido, fecha, cliente, dirección, estado y validación;
  - acceso al detalle de revisión de cada pedido.
- Roles habilitados: ADMINISTRADOR y OPERADOR. La autorización real la aplica el
  backend; la guarda de ruta del frontend es sólo navegación.

## Fuera de alcance
- Filtro por chofer y asignación de choferes: dependen del módulo de asignación.
- Agrupamiento automático de envíos lejanos: pertenece a MVP 2.
- Paginación, exportación, métricas históricas y reportes.
- Fusión o resolución automática de pedidos o clientes duplicados (D11).
- Transiciones de estado, entrega y acreditación de pago (D04/D09).

## Contrato de filtros
`GET /api/pedidos?estado=EN%20STOCK&cliente=20.123&fecha_desde=2026-10-01&fecha_hasta=2026-10-21`

- Los filtros vacíos no se envían y no restringen la consulta.
- `cliente` se recorta y tiene un máximo de 150 caracteres.
- Una fecha con formato inválido, una fecha de calendario inexistente o un rango
  con `fecha_desde` posterior a `fecha_hasta` responde `400 DATOS_INVALIDOS` con
  el campo afectado.
- La consulta usa SQL parametrizado y no concatena el texto del usuario.

## Criterios de aceptación
Dado un operador en el tablero, cuando no elige filtros, entonces ve todos los
pedidos ordenados por fecha descendente y los contadores sobre ese total.

Dado un pedido en `EN STOCK`, cuando se filtra por ese estado, entonces sólo
aparecen los pedidos en ese estado.

Dado un cliente con nombre, DNI o teléfono conocido, cuando se escribe ese dato
en el filtro de cliente, entonces aparecen sus pedidos; el DNI se encuentra con o
sin puntos, espacios o guiones.

Dado un rango de fechas, cuando se aplica, entonces se incluyen los pedidos
creados desde el comienzo de `fecha_desde` hasta el final de `fecha_hasta`.

Dado un rango con la fecha desde posterior a la hasta, entonces la pantalla
muestra el mensaje de validación y el backend responde `400`; no se muestran
resultados como si el filtro fuera válido.

Dado un pedido listado, cuando se elige «Ver» o «Revisar», entonces se abre su
detalle de revisión.

Dado un usuario sin sesión o con rol CHOFER, cuando consulta el listado, entonces
el backend responde `401` o `403`, respectivamente.

## Estados de interfaz
- Carga: contadores en `—` hasta que responde el resumen; tabla con «Buscando
  pedidos…».
- Error: mensaje uniforme de `mensajeError` o del campo validado, y estado de
  tabla sin resultados.
- Vacío sin filtros: «Todavía no hay pedidos cargados» y acción para cargar el
  primero.
- Vacío con filtros: «No hay pedidos con esos filtros», explicación y acción
  «Limpiar filtros».
- Éxito: contadores con números y tabla con la cantidad de pedidos en pantalla.
- El botón «Limpiar filtros» se deshabilita cuando no hay filtros activos.

## Responsive
- Escritorio: filtros en una fila con salto de línea si no entran; tabla con
  desplazamiento horizontal cuando hace falta.
- Móvil: filtros apilados, controles a ancho disponible y tabla desplazable; no
  se escala la pantalla con `transform` ni `zoom`.
