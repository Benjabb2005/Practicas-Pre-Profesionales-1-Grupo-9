# Vista del chofer: Ruta del día

## Usuario y problema

El usuario es Andrés Silva, representado por una cuenta de demostración con rol Chofer. Necesita consultar en el celular las paradas del día, identificar su estado y registrar en el prototipo la entrega y el método de cobro.

Esta vista es una demostración frontend con datos fijos y estado en memoria. La cuenta demo no autentica al usuario ni acredita identidad o permisos.

## Alcance

- Vista móvil «Ruta del día» con marca, encabezado, identidad del chofer y disponibilidad ficticia.
- Tres paradas de demostración, sus clientes, direcciones y estados.
- Avance calculado a partir de las mismas paradas que se muestran en la lista.
- Diálogo para seleccionar el método de cobro.
- En la etapa 1, abrir el diálogo desde «ENTREGADO» y poder cerrarlo con «Cancelar» sin cambiar el estado.
- En la etapa 2, confirmar el cobro actualiza solo el estado local: la parada pasa a completada/pagada y se actualizan el avance y la próxima parada pendiente.
- «Ver en Mapa» aparece como control visual, sin navegación ni servicio conectado.
- Permitir que la cuenta demo de rol Chofer ingrese desde el login existente y mostrar esta vista según el rol. Los roles Administrador y Operador no cambian. Este cambio mínimo en `App.jsx` es parte del alcance.

## Fuera de alcance

- Backend, API, autenticación real, autorización o identidad verificada.
- Persistencia: recargar restablece los datos y estados iniciales de demostración.
- Procesamiento, acreditación o trazabilidad real de pagos.
- Proveedor de mapas, geocodificación, coordenadas o apertura de una aplicación de mapas.
- Edición de clientes, direcciones, asignaciones o planificación/optimización de rutas.
- Cambios en otras vistas (salvo habilitar el ingreso del rol Chofer en el login), documentación del proyecto fuera de esta especificación, estilos compartidos o esquema de datos.
- Generación real de remitos: la opción «Efectivo – Generar Remito físico o digital» es solo un texto en el prototipo.
- Dependencias nuevas.

## Pantalla y datos

### Encabezado

- Ícono de camión y marca «MandáTodo».
- Texto «HOY • N PARADAS». N se calcula de la lista de paradas y, por lo tanto, del mismo conjunto usado para el avance. Con los datos acordados, el valor inicial es «HOY • 3 PARADAS».
- Nombre «Andrés Silva» e indicador verde «En línea», ambos fijos de demostración.
- Avatar visual con las iniciales «AS». No usar imágenes ni cargar una fotografía.

### Avance del Día

- Mostrar el título «Avance del Día», una barra de progreso y el contador «X / N Paradas».
- X cuenta paradas completadas y N es el total de la lista.
- El valor inicial es «1 / 3 Paradas», porque la tercera parada comienza completada.

### Paradas

Mostrar una tarjeta por parada, en este orden:

| N.º | Estado inicial | Cliente | Dirección de Entrega |
| --- | --- | --- | --- |
| 1 | SIGUIENTE ENTREGA, naranja | Carlos Gómez | Av. de Mayo 1420, CABA |
| 2 | EN COLA, gris | María Luz Segura | Corrientes 3489, CABA |
| 3 | COMPLETADO, verde | Distribuidora San Juan | Riobamba 450, San Martín |

Cada tarjeta incluye el número, la etiqueta de estado, las etiquetas «Cliente» y «Dirección de Entrega», los datos correspondientes y un botón «Ver en Mapa». Las paradas no completadas muestran «ENTREGADO»; la parada completada muestra «PAGADO» deshabilitado. «Ver en Mapa» no ejecuta ninguna acción.

Al completar una parada pendiente en la etapa 2, actualizar su estado a completado, incrementar X y marcar como «SIGUIENTE ENTREGA» la primera parada pendiente en el orden de la lista. El total N no cambia.

### Ventana de pago

Al activar «ENTREGADO» en una parada pendiente, mostrar un diálogo titulado «Actualizar Parada N» con el texto: «Seleccione el método de cobro realizado para el pedido de [cliente].» Debe ofrecer dos opciones de radio nativas, agrupadas y asociadas a sus etiquetas:

- «Efectivo – Generar Remito físico o digital», seleccionado por defecto.
- «Transferencia – Directo a cuenta de la empresa».

Acciones: botón verde «Confirmar y Registrar Pago» y botón «Cancelar».

El diálogo es modal y accesible: usa `role="dialog"`, `aria-modal="true"` y `aria-labelledby` apuntando al título visible. Al abrir, el foco entra en el diálogo. Se cierra con Escape y con «Cancelar»; al cerrarse, el foco vuelve al botón «ENTREGADO» que lo abrió. La selección de cobro puede recorrerse y cambiarse con teclado usando el comportamiento nativo del grupo de radios.

## Criterios de aceptación

### Etapa 1: pantalla fija y diálogo cancelable

1. **Acceso y contenido inicial**
   - Given que la persona elige la cuenta demo de rol Chofer en el login existente,
   - When se muestra la vista del chofer,
   - Then ve «Ruta del día», a Andrés Silva, el indicador verde «En línea», el avatar «AS» sin imagen, «HOY • 3 PARADAS», el avance «1 / 3 Paradas» y las tres paradas en el orden, dirección y estado indicados.

2. **Total derivado de las paradas**
   - Given que la vista usa la lista de tres paradas de demostración,
   - When se renderizan el encabezado y el avance,
   - Then ambos reflejan el total de esa misma lista y muestran 3, sin mantener un contador independiente.

3. **Apertura del diálogo**
   - Given una parada pendiente y su botón «ENTREGADO»,
   - When el usuario lo activa,
   - Then aparece «Actualizar Parada N» con el nombre del cliente correcto, `role="dialog"`, `aria-modal="true"` y un título asociado mediante `aria-labelledby`; el foco se mueve al diálogo y Efectivo aparece seleccionado.

4. **Radios accesibles**
   - Given que el diálogo está abierto,
   - When el usuario revisa las opciones de cobro,
   - Then puede seleccionar exactamente una de las dos opciones mediante controles radio nativos, con etiquetas asociadas y navegación de teclado.

5. **Cancelación**
   - Given que el diálogo está abierto,
   - When el usuario activa «Cancelar»,
   - Then el diálogo se cierra, el estado de la parada y el avance no cambian, y el foco vuelve al botón «ENTREGADO» que lo abrió.

6. **Cierre con Escape**
   - Given que el diálogo está abierto,
   - When el usuario presiona Escape,
   - Then el diálogo se cierra sin cambiar el estado de la parada y el foco vuelve al botón que lo abrió.

7. **Parada ya completada**
   - Given que se muestra Distribuidora San Juan como completada,
   - When el usuario consulta sus acciones,
   - Then ve «PAGADO» deshabilitado y no puede abrir desde esa tarjeta una nueva ventana de pago.

8. **Mapa sin servicio**
   - Given que se muestra cualquier tarjeta,
   - When el usuario ve «Ver en Mapa»,
   - Then el botón está presente pero no inicia navegación ni solicita un servicio de mapas.

### Etapa 2: confirmación local

9. **Registro de cobro**
   - Given que el diálogo está abierto para una parada pendiente y hay un método seleccionado,
   - When el usuario activa «Confirmar y Registrar Pago»,
   - Then se cierra el diálogo y esa parada pasa a completada/pagada en el estado local.

10. **Actualización de ruta**
    - Given que se confirmó el cobro de una parada pendiente,
    - When se vuelve a mostrar la ruta,
    - Then el avance X aumenta en uno, N sigue derivándose de la lista, la parada muestra «COMPLETADO» y «PAGADO» deshabilitado, y la primera parada aún pendiente pasa a «SIGUIENTE ENTREGA».

11. **Sin persistencia**
    - Given que el usuario confirmó uno o más cobros,
    - When recarga la página,
    - Then vuelven los estados iniciales de demostración y el avance «1 / 3 Paradas».

## Estados de interfaz

- **Ruta inicial:** tres paradas; primera siguiente, segunda en cola, tercera completada; avance 1/3.
- **Diálogo abierto:** identifica parada y cliente; Efectivo seleccionado inicialmente; Transferencia puede elegirse.
- **Diálogo cancelado:** se cierra sin actualizar parada ni avance.
- **Diálogo cerrado con Escape:** mismo resultado que Cancelar y restaura el foco.
- **Cobro confirmado (etapa 2):** parada pagada/completada, diálogo cerrado, avance recalculado y siguiente pendiente promovida.
- **Parada completada:** botón «PAGADO» deshabilitado.
- **Ruta completa:** cuando todas las paradas están completadas, el avance muestra N / N (3 / 3 con los datos actuales) y ninguna parada queda como «SIGUIENTE ENTREGA».

No hay estados de carga o error de red porque no se realizan llamadas externas. La disponibilidad «En línea» no cambia.

## Comportamiento en celular

- Diseñar primero para pantallas angostas, desde 320 px: una sola columna, márgenes internos que mantengan legibles textos y controles y sin desplazamiento horizontal.
- En pantallas grandes, centrar la vista y limitar su ancho aproximado a 420 px.
- Mantener las tres tarjetas en el orden de la ruta, con dirección y acciones visibles sin superposición ni recorte.
- El diálogo debe caber en el viewport; si su contenido supera la altura disponible, permitir desplazamiento dentro de la ventana sin ocultar las acciones.
- Mantener indicadores de foco visibles y controles utilizables con teclado y tacto.

## Supuestos a confirmar

- **Total de paradas:** el diseño de referencia menciona «7», pero los datos de demostración acordados aquí contienen 3. Esta especificación adopta 3 y deriva el total de la lista; confirmar con el equipo si se deben agregar cuatro paradas o si la referencia quedó desactualizada.
- **Entrega y pago:** se presentan como un único paso únicamente para este prototipo. No define la transición real del negocio ni quién acredita una transferencia.
- **Cuenta Chofer:** es una cuenta de demostración para acceder a la vista, no autenticación real.
- **Disponibilidad y datos:** «En línea», el chofer y los pedidos/direcciones son valores fijos de demostración.
- **Mapa:** «Ver en Mapa» no tiene acción hasta definir el servicio de mapas y su comportamiento.

