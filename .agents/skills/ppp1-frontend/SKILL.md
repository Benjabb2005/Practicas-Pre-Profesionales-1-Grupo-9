---
name: ppp1-frontend
description: Construir pantallas y formularios React del TP PPP1, estados de interfaz e integración con API a partir de la demo.
---

# Frontend React

## Contexto
Leer `frontend/AGENTS.md`, `docs/pantallas.md`, `docs/arquitectura.md` y `docs/decisiones.md`. Inspeccionar `frontend/src/App.jsx`: hoy login, tablero y carga son maqueta; chofer no tiene vista local.

## Procedimiento
1. Identificar evidencia de pantalla y contrato API. Distinguir observaciones del ZIP, acceso público actual y propuesta. No completar flujos de pagos/entregas como si se hubieran visto.
2. Para una funcionalidad, especificar usuario, alcance, criterios, estados vacío/cargando/error/éxito y comportamiento móvil. No crear especificación extra por corregir un espacio o texto aislado.
3. Reutilizar lenguaje visual: lateral azul oscuro, tarjetas claras, acento azul y voseo. Extraer componentes enfocados de App.jsx al necesitarlos; no sustituir stack.
4. Asociar labels, inputs y errores; mantener foco/teclado, controles accesibles y layout grid/flex. Asterisco no equivale a required ni a validación en servidor.
5. Separar cliente API de componentes; decidir base URL/proxy o CORS según arquitectura acordada. No inventar endpoint ni guardar pedidos solo en useState afirmando persistencia.
6. Manejar envío pendiente, errores de red y validación, resultados vacíos y reintento sin duplicar guardado. Mostrar éxito solo tras respuesta confirmada.
7. En dirección, distinguir validar, revisar mapa, confirmar y despachar. Cambiar datos invalida confirmación según contrato. Cliente frecuente requiere revisar conflictos.
8. Mantener Rutas avanzada y ABM independiente de Clientes fuera del alcance no confirmado. No copiar accesos de demo ni confiar en controles de rol de UI como seguridad.

## Verificar
npm --prefix frontend run lint y npm --prefix frontend run build. Probar teclado, escritorio y viewport móvil; indicar resoluciones y casos. Para integración, guardar/recargar, error API y sesión inválida. Si se añade harness de interacción, justificarlo y usar fixtures sintéticos deterministas; no llamar proveedor real en pruebas unitarias.

## Entregar
Pantalla/flujo implementado, capturas cuando se disponga, casos probados y no probados, contrato usado y actualización de pantallas/tareas. Identificar explícitamente mocks.
