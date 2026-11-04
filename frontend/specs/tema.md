# Tema claro/oscuro de MandáTodo

Pedido de Benjamín, 25/10/2026: recuperar el modo oscuro de branch-benjamin-1, mantener su comportamiento y quitar subrayado de enlaces del menú lateral.

Se reutilizan theme.js, ThemeToggle.jsx y Theme.css de esa branch, adaptando selectores a MVP-1. Paleta gris #17191e/#22252b, textos claros, acentos azules e inversión de teselas Leaflet como en la referencia. Botón luna/sol en barra lateral, login y cabecera del chofer; nombre accesible indica la acción.

Persistencia en localStorage con la misma clave mandatodo-theme; una preferencia guardada válida prevalece sobre el sistema. Sin preferencia se usa prefers-color-scheme. Aplicación inicial antes del render para evitar destello claro. Si storage está bloqueado el control sigue funcionando; escucha storage para sincronizar otras pestañas. Fallback claro en entornos sin window/matchMedia.

Cobertura: fondos, tarjetas, formularios, tablas, estados, asignaciones y sus modales de mapa/información. Preservar resaltado activo/foco del menú sin subrayado. No cambiar autenticación, API ni datos de negocio.
