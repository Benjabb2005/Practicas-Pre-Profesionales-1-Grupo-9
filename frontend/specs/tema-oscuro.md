# Modo oscuro global

14/10/2026. Solicitud: botón claro/oscuro en toda la web.

Control global accesible desde login, administración/operación, chofer real y demo. Preferencia local persistente entre recargas; si no hay elección previa, usar preferencia del sistema. Si storage no está disponible, cambio sigue funcionando en la sesión. Aplicar al documento para cubrir dialog modales fuera del contenedor visual. Mantener contraste de texto/campos, botones principales, estados, errores y foco. Mapas conservan proveedor/coordenadas/pin/atribución; solo presentación de cartografía y controles.

Sin API, nuevas dependencias ni cambios de identidad/pedidos. Criterios: alternar sin recarga, persistir después de recarga/logout, formularios/tablero/detalles/mapa/chofer/delivery modales legibles; control por teclado y layout móvil sin solapamientos ni scroll horizontal; elección también sincronizada entre pestañas del mismo origen. Inicialización antes de render para evitar destello de tema incorrecto.

Corrección: sin barra superior ni aviso operativo amarillo. Botón compacto en marca lateral, login y encabezado chofer. Paleta gris carbón y demo identificada discretamente.

Ajuste posterior: menú lateral conserva azul original y selección azul en ambos temas; grises carbón solo para el contenido.
