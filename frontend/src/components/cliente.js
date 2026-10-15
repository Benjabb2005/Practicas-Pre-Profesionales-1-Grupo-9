// Estado inicial de los datos del cliente y campos que lo componen. Vive fuera
// del componente para que el archivo sólo exporte componentes (Fast Refresh).
export const CLIENTE_VACIO = {
  nombre: '',
  dni: '',
  telefono: '',
  email: '',
}

export const CAMPOS_CLIENTE = [
  { clave: 'nombre', etiqueta: 'Nombre y apellido', placeholder: 'Ej. Juan Pérez', requerido: true, clase: 'span-2' },
  { clave: 'dni', etiqueta: 'DNI', placeholder: 'Sin puntos', clase: '' },
  { clave: 'telefono', etiqueta: 'Teléfono', placeholder: 'Ej. 11 5555-5555', clase: '' },
  { clave: 'email', etiqueta: 'Email', placeholder: 'Ej. nombre@correo.com', clase: 'span-2' },
]

// Toma solo los campos editables de un cliente del backend para precargar el
// formulario; no arrastra id ni campos que la pantalla no edite.
export function datosDeCliente(cliente) {
  if (!cliente) return { ...CLIENTE_VACIO }
  return {
    nombre: cliente.nombre ?? '',
    dni: cliente.dni ?? '',
    telefono: cliente.telefono ?? '',
    email: cliente.email ?? '',
  }
}
