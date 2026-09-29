# MandáTodo · pantalla de acceso

Esta entrega reemplaza `frontend/index.html` y los archivos `frontend/src/App.jsx`, `frontend/src/App.css` y `frontend/src/index.css` del proyecto. No requiere dependencias adicionales: usa React y Vite ya presentes.

## Acceso de demostración

- `admin@mandatodo.com` — Administrador
- `operador@mandatodo.com` — Operador
- `chofer@mandatodo.com` — Chofer
- Contraseña para todas: `demo1234`

El formulario valida estas credenciales localmente y muestra el rol ingresado. Es una interacción de demostración; no autentica usuarios ni genera JWT. El botón para mostrar/ocultar contraseña y los mensajes de error/éxito también funcionan sin backend.

La fuente DM Sans se carga desde Google Fonts; si no hay conexión, se usa una fuente de sistema.
