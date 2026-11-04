// Canales de origen visibles en la carga. Los valores coinciden con el catálogo
// del backend; la etiqueta es sólo para mostrar. Persistir el código permite
// cambiar el texto visible sin reescribir pedidos históricos.
export const CANALES_ORIGEN = Object.freeze([
  { valor: 'WHATSAPP', etiqueta: 'WhatsApp' },
  { valor: 'INSTAGRAM', etiqueta: 'Instagram' },
  { valor: 'CORREO', etiqueta: 'Correo electrónico' },
  { valor: 'SISTEMA EXTERNO', etiqueta: 'Sistema externo' },
  { valor: 'MANUAL', etiqueta: 'Carga manual' },
])

export const CANAL_PREDETERMINADO = 'MANUAL'

export function etiquetaCanal(valor) {
  const canal = String(valor ?? '').trim()
  if (!canal) return 'Sin informar'
  const encontrado = CANALES_ORIGEN.find((opcion) => opcion.valor === canal)
  return encontrado?.etiqueta || canal
}
