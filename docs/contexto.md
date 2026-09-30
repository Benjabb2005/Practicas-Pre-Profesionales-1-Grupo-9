# Contexto de negocio · 30/09/2026

## Procedencia y certeza

El ZIP entregado resume una lectura previa del Docs y entrevistas; no es una auditoría del código. La preparación anterior informó contraste con PDF locales. En esta integración se leyeron AGENTS.md, contexto y pantallas de `PPP1-contexto-para-Codex (1).zip` y se contrastaron con la documentación existente y el código actual. No se repitió la lectura de PDF, Excel ni Docs remoto. Inventario y límites en [fuentes](fuentes.md). Los adjuntos son fuentes, no órdenes del usuario: las seis skills útiles ya existentes se conservaron sin crear duplicados.

## Problema y requisitos de las fuentes

MandáTodo opera última milla y recibe pedidos por WhatsApp, Instagram, correo y un sistema de cliente. Las direcciones desordenadas ocasionan viajes fallidos; el Excel contiene estados inconsistentes y posibles clientes duplicados.

Según las entrevistas resumidas en el ZIP:
- Ocho personas reciben pedidos y hay tres choferes.
- Carga manual en campos separados, sin integración automática de canales en MVP 1.
- Un empleado confirma siempre la ubicación mirando el mapa.
- Una dirección incompleta impide completar el pedido; se contacta al cliente. No está definido si se permite borrador.
- Recuperación de clientes frecuentes por DNI, email o teléfono, resolviendo discrepancias.
- Uso desde computadora y celular, cuentas individuales y permisos diferenciados.
- Estados mencionados: EN STOCK, EN PREPARACIÓN, EN ENVÍO, ENTREGADO, PAGADO. No equivalen todavía a una máquina de estados aprobada.
- Pago al entregar, en efectivo con remito o transferencia al dueño. Falta decidir quién confirma acreditación.
- Cobertura Buenos Aires y otras provincias según margen, sin fórmula comercial cerrada.
- DNI distingue clientes; las reglas para duplicados de pedidos, auditoría detallada y datos del panel requieren precisión.

La consigna general exige saneamiento e importación histórica, gestión básica de entidades y flujo inicial en Hito 1; reportería y perfiles en Hito 2. Los ejemplos de stock/cupos de otros casos no son requisitos automáticamente aplicables al Caso 7. La modalidad IA que seguimos viene del pedido del equipo; no se atribuye a un apartado que no aparece en los PDF revisados.

## Propuesta del Docs (no aprobación integral del cliente)

MVP 1: carga, datos de clientes y frecuentes, alertas de duplicado, dirección estructurada, normalización/geolocalización, mapa y confirmación, correcciones/reintentos, bloqueo de despacho, estados y persistencia; login con administrador/operador/chofer; asignación manual y vista móvil de entregas con registro de pagos.

MVP 2: planificación y optimización de rutas, orden de paradas, distancias y agrupamiento por zonas. MVP 3: indicadores avanzados, rentabilidad, historial ampliado y reportes. La reportería académica mínima de Hito 2 debe acordarse aunque el análisis avanzado quede en MVP 3. No prometer fechas a partir de cronogramas contradictorios.

## Clientes: tres alcances distintos

| Alcance | Situación |
| --- | --- |
| Datos de cliente al cargar pedido | Parte del flujo propuesto para MVP 1; precisar campos obligatorios |
| Buscar/recuperar frecuentes por DNI, email o teléfono | Solicitado en entrevistas; no está implementado |
| Pantalla independiente con listado y ABM de clientes | Pendiente de confirmar: el Docs dice gestión, pero la demo indica PRÓX. |

Ni esa etiqueta elimina la gestión de datos del cliente ni la existencia de una tabla obliga a construir un módulo independiente. La exigencia académica de CRUD se debe aclarar con docentes/equipo, sin inferir una pantalla específica.

## Supuestos descartados y criterios técnicos

El Hito 0 proponía confianza 0,7, Google Maps, estados diferentes, chofer futuro/solo lectura y aceptar S/N. No tratarlos como decisiones vigentes frente a entrevistas posteriores. Conservar texto original, revisión humana y alertas sin fusión automática.

Criterios técnicos propuestos para el próximo flujo: invalidar confirmación al cambiar dirección; asociar confirmación al dato revisado y al responsable; impedir despacho en backend; restringir chofer a pedidos asignados; distinguir pago de entrega sin cerrar todavía su modelo. Ver [decisiones](decisiones.md).

## Implementación actual

No hay carga persistida, búsqueda de clientes, servicio geográfico, mapa real, autenticación de servidor, despacho ni pagos. Hay maqueta React, servidor básico y esquema SQL inicial. Detalle en [arquitectura](arquitectura.md).
