# ABM de clientes

## Usuario y problema

El operador y el administrador necesitan consultar, dar de alta, corregir y dar de
baja clientes sin pasar por la carga de un pedido. Hoy la única forma de crear un
cliente es dentro del formulario de pedido, y no existe una pantalla para buscar,
editar o eliminar clientes existentes. Los datos mal cargados obligan a duplicar
clientes o a corregirlos por SQL.

## Alcance

- Pantalla «Clientes» accesible para Administrador y Operador desde la barra
  lateral.
- Listado de clientes con búsqueda por nombre, DNI, teléfono o email.
- Alta y edición de cliente con los campos: nombre y apellido (obligatorio), DNI,
  teléfono, email, tipo (particular o empresa) y domicilio.
- Validación de formato: DNI solo dígitos; se admiten puntos, espacios y guiones
  como separadores y se rechazan otros caracteres. Teléfono normalizado a
  dígitos; email con formato válido; nombre no vacío.
- Aviso de clientes con el mismo teléfono o email, mostrando nombre y DNI del
  otro cliente (o «sin DNI»), sin fusionar ni sobrescribir datos. El DNI repetido
  se rechaza porque identifica al cliente.
- Baja física de un cliente solo si no tiene pedidos asociados. Si los tiene, el
  servidor responde con un conflicto y explica el motivo.
- Mensajes de carga, error, éxito y listado vacío.

## Fuera de alcance

- Fusión automática de clientes o resolución de discrepancias (D11).
- Importación masiva o edición del Excel histórico.
- Historial de pedidos por cliente o pantalla de detalle de pedidos.
- ABM de direcciones independiente del pedido.
- Cambios de esquema o migraciones.
- Acceso para el rol Chofer.

## Pantalla y flujo

### Encabezado y búsqueda

- Título «Clientes» y texto breve sobre la gestión.
- Botón «Nuevo cliente».
- Campo de búsqueda con etiqueta accesible. La búsqueda se ejecuta con una
  demora breve para no consultar en cada tecla.
- La tabla muestra nombre, DNI, teléfono, email, domicilio y acciones.

### Formulario

- Se muestra en un panel arriba de la tabla, tanto para alta como para edición.
- El título cambia: «Nuevo cliente» o «Editar cliente».
- En edición, los campos se precargan con los datos actuales.
- «Guardar» envía el formulario; «Cancelar» lo cierra sin cambios.
- Al guardar, el panel se cierra, se muestra un aviso y se recarga el listado.
- Si el backend informa coincidencias por teléfono o email, el aviso muestra el
  nombre y el DNI de cada cliente coincidente (o «sin DNI») y aclara que no se
  fusionaron datos.

### Baja

- El botón «Eliminar» de cada fila abre una confirmación en pantalla con el
  nombre del cliente.
- «Eliminar» confirma; «Cancelar» cierra la confirmación sin cambios.
- Si el cliente tiene pedidos, el backend rechaza la baja y se muestra el
  mensaje de conflicto. El cliente no se borra.

## Criterios de aceptación

1. **Acceso por rol**
   - Given una sesión de Administrador u Operador,
   - When entra a «Clientes»,
   - Then ve el listado y puede buscar, crear y editar clientes.
   - Given una sesión de Chofer,
   - When intenta acceder a la ruta o a la API,
   - Then la interfaz no le muestra la pantalla y el servidor responde 403.

2. **Listado y búsqueda**
   - Given que existen clientes cargados,
   - When se abre la pantalla o se escribe en el buscador,
   - Then se listan los que coinciden por nombre, DNI, teléfono o email, y se
     muestra un estado vacío cuando no hay resultados.

3. **Alta**
   - Given el formulario «Nuevo cliente» con nombre válido,
   - When se guarda,
   - Then el cliente se crea, aparece en el listado y se muestra un aviso de
     éxito.

4. **Validación**
   - Given un formulario sin nombre, con DNI con letras u otros separadores no
     admitidos, o con email inválido,
   - When se intenta guardar,
   - Then la operación se rechaza y se muestra un mensaje comprensible; no se
     crea ni modifica el cliente.

5. **DNI duplicado**
   - Given un DNI que ya pertenece a otro cliente, escrito con puntos, espacios o
     guiones,
   - When se intenta crear o editar,
   - Then el servidor responde 409 y no se guarda el cambio.

6. **Teléfono o email repetido**
   - Given un teléfono o email que coincide con otro cliente,
   - When se guarda un alta o edición,
   - Then el cliente se guarda y se avisa la coincidencia con nombre y DNI del
     otro cliente, sin fusionar datos.

7. **Edición**
   - Given un cliente existente,
   - When se abre «Editar», se cambia un dato y se guarda,
   - Then el listado muestra el dato actualizado y el cliente conserva su id.

8. **Baja sin pedidos**
   - Given un cliente sin pedidos asociados,
   - When se confirma «Eliminar»,
   - Then el cliente desaparece del listado y se muestra un aviso de éxito.

9. **Baja con pedidos**
   - Given un cliente con al menos un pedido,
   - When se confirma «Eliminar»,
   - Then el servidor responde 409, el cliente sigue existiendo y se muestra el
     motivo.

10. **Integridad**
    - Given una petición directa a la API sin token o con rol Chofer,
    - When intenta crear, editar o eliminar,
    - Then el servidor responde 401 o 403, respectivamente.

## Estados de interfaz

- **Cargando:** texto «Cargando clientes…».
- **Vacío:** «Todavía no hay clientes cargados» y botón para crear el primero.
- **Sin resultados:** «No encontramos clientes con esa búsqueda».
- **Error:** alerta con el mensaje seguro del backend.
- **Éxito:** aviso de alta, edición o baja.
- **Éxito con coincidencias:** aviso de alta o edición que identifica al otro
  cliente por nombre y DNI, aclara que no se fusionaron datos y no bloquea la
  operación.
- **Confirmación de baja:** panel visible con el nombre y las acciones.

## Comportamiento responsive

- En pantallas angostas, el formulario pasa a una columna y la tabla permite
  desplazamiento horizontal sin romper el layout.
- Los botones y campos se mantienen utilizables con teclado y tacto.
- No se usa `transform` ni `zoom` para adaptar la pantalla.

## Supuestos a confirmar

- **D07:** la skill del MVP1 asigna el ABM de clientes y el equipo pidió
  implementarlo. La validación académica con docentes sobre la pantalla
  independiente sigue pendiente; se registra en `docs/decisiones.md`.
- **Baja física:** el esquema usa `ON DELETE RESTRICT` para pedidos. Se adopta
  baja física solo sin pedidos; si el cliente tiene pedidos, se informa el
  conflicto. No se agrega borrado lógico ni columna nueva.
- **DNI opcional:** se mantiene opcional porque D08 todavía no definió su
  obligatoriedad y la alternativa cuando falta.
- **Roles:** Administrador y Operador comparten el ABM, igual que el alta
  existente dentro de la carga de pedido. Si el equipo define otra matriz, se
  ajusta el middleware.
