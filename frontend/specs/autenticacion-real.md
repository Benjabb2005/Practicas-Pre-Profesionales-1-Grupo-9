# Autenticación real y ABM de usuarios

## Usuario y problema

El personal de MandáTodo (Administrador, Operador y Chofer) necesita entrar al sistema con credenciales propias y que el backend reconozca su rol. Antes, el login era una maqueta con cuentas y contraseña fijas y el rol vivía en el estado del navegador. Ahora la sesión se valida contra el servidor y la interfaz adapta la navegación al rol real.

## Alcance

- Reemplazar el login de demostración por uno que llama a `POST /api/auth/login` y guarda el token.
- Recuperar la sesión al recargar con `GET /api/auth/me`.
- Ocultar rutas según rol con una guarda de navegación; la autorización efectiva la sigue aplicando el backend.
- Pantalla de **Usuarios** para el administrador: listar, crear y editar cuentas (`GET/POST/PUT /api/usuarios`).
- Cerrar sesión desde la barra lateral y desde la vista del chofer.
- Cliente HTTP único con `Authorization: Bearer` y mensajes de error en español.
- Proxy de desarrollo `/api` hacia Express y arnés mínimo de pruebas (Vitest) para la capa API/sesión.

## Fuera de alcance

- Registro público, recuperación de contraseña, refresco de token o expiración proactiva.
- Persistencia del token más allá del `localStorage` del navegador.
- Cambios en las pantallas de Tablero, Carga Manual y Ruta del chofer más allá de conectar el cierre de sesión.
- ABM de clientes, direcciones, pedidos o asignaciones.
- Servicio de mapas o geocodificación.
- Autorización como seguridad del lado del cliente: la guarda es solo navegación.

## Flujo y pantallas

1. **Login** (`/login`): email y contraseña contra el backend. Si el rol es Chofer va a `/chofer`; si no, a la ruta pedida o al Tablero.
2. **Tablero y Carga Manual** (`/`, `/form`): requieren sesión de Administrador u Operador.
3. **Usuarios** (`/usuarios`): requiere Administrador. Tabla con nombre, email, rol y estado; formulario de alta y edición.
4. **Ruta del chofer** (`/chofer`): requiere Chofer.
5. Sin sesión, cualquier ruta protegida redirige a `/login` y vuelve al destino tras ingresar.

## Criterios de aceptación

1. **Ingreso válido** — Given credenciales correctas, When el usuario envía el formulario, Then se guarda el token y se navega según el rol.
2. **Ingreso inválido** — Given credenciales incorrectas, When el usuario envía el formulario, Then se muestra el mensaje seguro del backend y no se navega.
3. **Sesión persistente** — Given un token válido guardado, When se recarga la página, Then `GET /api/auth/me` restaura al usuario sin volver a pedir la contraseña.
4. **Token inválido** — Given un token vencido o alterado, When la app arranca, Then el token se descarta y se muestra el login.
5. **Guarda por rol** — Given una sesión de Operador, When navega a `/usuarios`, Then se lo redirige al Tablero. Given una sesión de Chofer, When navega a `/`, Then se lo redirige a su ruta.
6. **ABM (admin)** — Given una sesión de Administrador en `/usuarios`, When crea o edita una cuenta, Then la lista se refresca con el resultado del backend.
7. **Rechazo del backend** — Given un alta con datos inválidos (por ejemplo contraseña corta o rol inexistente), When se envía, Then se muestra el error y no queda una fila nueva.
8. **Cierre de sesión** — Given una sesión activa, When el usuario cierra sesión, Then el token se borra y vuelve al login.
9. **Errores de red** — Given el backend caído, When el login o la lista fallan, Then se muestra un mensaje de conexión, nunca texto crudo del servidor.

## Estados de interfaz

- **Cargando sesión:** guarda de ruta con «Cargando sesión…».
- **Login:** botón «Ingresando…» mientras se espera; mensaje de error accesible (`role="alert"`).
- **Usuarios:** «Cargando usuarios…», tabla vacía («Todavía no hay usuarios cargados») y aviso de éxito.
- **Sesión cerrada:** redirección al login.

## Comportamiento responsive

- Mismo lenguaje visual que la maqueta existente (barra lateral y encabezados reutilizados).
- Formulario de usuarios a dos columnas y una sola columna por debajo de 620 px.
- Tabla de usuarios con desplazamiento horizontal en pantallas angostas sin romper el layout.

## Supuestos a confirmar

- Guardar el token en `localStorage` es aceptable para el MVP; cualquier script de la página podría leerlo. Se evalúa una cookie `HttpOnly` en una etapa posterior.
- La expiración de la sesión no es proactiva: se detecta cuando el backend responde 401.
- El ABM no elimina usuarios: se desactiva con el campo `activo`.
