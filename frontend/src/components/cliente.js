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
  { clave: 'dni', etiqueta: 'DNI', placeholder: 'Con o sin puntos', clase: '' },
  { clave: 'telefono', etiqueta: 'Teléfono', placeholder: 'Ej. 11 5555-5555', clase: '' },
  { clave: 'email', etiqueta: 'Email', placeholder: 'Ej. nombre@correo.com', clase: 'span-2' },
]

// Formulario del ABM: incluye tipo y domicilio además de los datos de contacto.
export const CLIENTE_ABM_VACIO = {
  nombre: '',
  dni: '',
  telefono: '',
  email: '',
  tipo: 'particular',
  domicilio: '',
}

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

// Línea de contacto para identificar una opción de búsqueda o al cliente ya
// elegido. Prioriza DNI y teléfono, que son los datos de recuperación rápida;
// el email queda como dato adicional cuando existe.
export function contactoDeCliente(cliente) {
  if (!cliente) return ''
  return [
    cliente.dni && `DNI ${cliente.dni}`,
    cliente.telefono && `Tel. ${cliente.telefono}`,
    cliente.email,
  ].filter(Boolean).join(' · ')
}

// Aviso cuando el backend encuentra otro cliente con el mismo teléfono o email.
// El DNI repetido no llega acá porque el servidor lo rechaza; este texto sólo
// informa y nunca fusiona datos.
export function describirCoincidenciasClientes(coincidencias = []) {
  if (!Array.isArray(coincidencias) || !coincidencias.length) return ''
  const detalle = coincidencias.map((cliente) => {
    const nombre = String(cliente?.nombre ?? '').trim() || 'Cliente sin nombre'
    const dni = String(cliente?.dni ?? '').trim()
    return dni ? `${nombre} (DNI ${dni})` : `${nombre} (sin DNI)`
  }).join(', ')
  const encabezado = coincidencias.length === 1
    ? 'Atención: el teléfono o email coincide con otro cliente'
    : 'Atención: el teléfono o email coincide con otros clientes'
  return `${encabezado}: ${detalle}. No se fusionaron datos.`
}

export function datosDeClienteAbm(cliente) {
  if (!cliente) return { ...CLIENTE_ABM_VACIO }
  return {
    nombre: cliente.nombre ?? '',
    dni: cliente.dni ?? '',
    telefono: cliente.telefono ?? '',
    email: cliente.email ?? '',
    tipo: cliente.tipo || 'particular',
    domicilio: cliente.domicilio ?? '',
  }
}
