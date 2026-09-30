---
name: ppp1-direcciones
description: Implementar normalización y geocodificación PPP1 con tratamiento de ambigüedad, mapa y confirmación humana previa al despacho.
---

# Direcciones y confirmación

## Contexto
Leer `docs/contexto.md`, `docs/pantallas.md`, `docs/decisiones.md` y `database/init.sql`. D06 no tiene proveedor elegido; el default georef del SQL no lo decide.

## Procedimiento
1. Separar texto original, campos estructurados, candidato del proveedor y dirección confirmada. No inventar altura ni localidad; distinguir CABA de provincia de Buenos Aires. Definir trato de S/N/esquinas y borradores con D08/D09.
2. Antes de elegir proveedor comparar documentación oficial vigente: cobertura, precisión, cuotas, licencia/atribución, costos, persistencia de respuestas y privacidad. No contratar ni activar facturación.
3. Aislar geocodificador detrás de un servicio/adaptador, independiente del componente de mapa. Definir entrada, candidatos, calidad disponible y errores; no fabricar score si la API no lo ofrece.
4. Conservar intentos y origen según modelo acordado. Manejar timeout, límites, cero resultados, resultado aproximado y múltiples candidatos como estados distintos, sin éxito ficticio.
5. Mostrar candidato en mapa y permitir revisión/corrección. Confirmación humana siempre, incluso para cliente recurrente o resultado de alta confianza.
6. Asociar confirmación con la dirección/versión revisada y responsable. Al cambiar dirección invalidarla; ignorar respuestas tardías de una consulta anterior.
7. Hacer cumplir en backend el bloqueo de despacho y la vigencia de la confirmación; no confiar en pin visible o booleano del navegador.

## Verificar
Fixtures sintéticos para altura faltante/cero/texto, provincia ambigua, cero/múltiples resultados, timeout, límite, candidato aproximado y respuesta tardía. Confirmar, cambiar dirección e intentar despachar por API debe rechazarse. Probar un caso real autorizado aparte para acreditar integración, sin usar datos personales del Excel. npm run check más pruebas de la funcionalidad.

## Entregar
Contrato de adaptador, fuente oficial consultada, comportamiento por error, criterios acordados de confirmación, pruebas mock y reales distinguidas, limitaciones y documentación actualizada. Si proveedor sigue pendiente, entregar interfaz/propuesta sin presentarla como integración terminada.
