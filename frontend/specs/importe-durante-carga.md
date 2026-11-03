# KAN-56 · importe sugerido antes de guardar

Administrador/operador carga una dirección. Con un único punto tentativo vigente
o candidato elegido explícitamente, se consulta POST /api/pedidos/importe-sugerido
con latitud/longitud numéricas. Servidor valida rangos y consulta sucursal/tarifa;
reutiliza Haversine, distancia a un decimal y cálculo exacto en centavos de KAN-49.
No lee pedidos, no guarda ni confirma ubicación. Chofer no tiene acceso.

El campo opcional precarga la sugerencia positiva mientras no se haya editado
manualmente. Una edición manual (incluso dejarlo vacío) se conserva; «Usar importe
sugerido» permite volver al cálculo automático. Si cambia la dirección/candidato,
el importe automático anterior desaparece de inmediato hasta tener sugerencia
vigente; el manual se conserva y se identifica como tal. Respuestas tardías se
descartan y consultas anteriores se cancelan. Cargar otro pedido reinicia el modo.

Se muestra estimación, distancia en línea recta/precio por km y advertencia de
ubicación tentativa. Sin punto o con candidatos ambiguos se explica qué falta.
Sin sucursal/tarifa, error o sugerencia cero/fuera del máximo, se permite ingreso
manual o guardar sin importe. Errores permiten reintento. La consulta no bloquea
guardar ni cambia duplicados, pago, tarifas ni confirmación humana posterior.
La caja mantiene estilos/anchos responsivos existentes. Ayuda deja de indicar que
hay que guardar el pedido para recibir sugerencia. Pedido ya guardado conserva
su importe y el flujo de completar faltantes después de confirmar.

Pruebas: fórmula compartida/redondeo, coordenadas/roles, ausencia de configuración,
consulta sólo de tarifa, cancelación/respuesta vieja, conservación manual y reinicio.
Regresión visual por rol/móvil pendiente para la revisión conjunta solicitada.

Ajuste de presentación solicitado: debajo de la casilla sólo ayuda corta y estimado;
sin fórmula/distancia/precio ni explicación larga de ubicación tentativa. «Usar
sugerido» sólo con edición manual; «Reintentar» sólo en error. Se retira actualizar
permanente. Se conservan avisos necesarios de selección y configuración.
