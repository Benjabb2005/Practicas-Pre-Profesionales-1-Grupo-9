import { describe, expect, it } from 'vitest'
import { jsPDF } from 'jspdf'
import { crearPedidoPdf, nombrePdf } from './pedidoPdf.js'
import { vistaMapa } from './mapaExportacion.js'

const mapa = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4XmMQ8T3+HwADyQIoSx6xNgAAAABJRU5ErkJggg=='
const datos = {
  pedido: { id: 12, cliente_nombre: 'Cliente sintético', estado: 'EN STOCK', calle: 'Calle de prueba', altura: '123', localidad: 'Localidad', provincia: 'Buenos Aires', direccion_original: 'ORIGINAL_NO_VISIBLE', latitud: -34.6, longitud: -58.4, chofer_nombre: 'CHOFER_NO_VISIBLE' },
  historial: [], geolocalizacion: [{ resultado: 'GEO_NO_VISIBLE' }], exportado_en: '2026-11-03T01:00:00Z',
}
function registrarTexto(doc) {
  const textos = [], original = doc.text.bind(doc)
  doc.text = (valor, ...args) => { textos.push(String(valor)); return original(valor, ...args) }
  return textos
}
describe('contenido de las descargas', () => {
  it('información incluye el panel y no agrega mapa, metadatos ni historial geográfico', () => {
    const doc = new jsPDF(), textos = registrarTexto(doc)
    crearPedidoPdf(doc, datos, { mapa })
    const salida = textos.join('\n')
    expect(doc.output()).toMatch(/^%PDF-/)
    expect(salida).toContain('Cliente: Cliente sintético')
    expect(salida).toContain('Piso / Depto: No informado')
    expect(salida).toContain('Envío base: Pendiente')
    expect(salida).toContain('Sin pago registrado.')
    expect(salida).toContain('Todavía no se registraron cambios de estado ni intentos.')
    for (const excluido of ['ORIGINAL_NO_VISIBLE','GEO_NO_VISIBLE','CHOFER_NO_VISIBLE','Coordenadas:','Exportado','Código:','Confianza:']) expect(salida).not.toContain(excluido)
    expect(doc.output()).not.toContain('/Subtype /Image')
  })
  it('el historial reproduce los movimientos visibles en Más información, sin asignaciones ni auditoría extra', () => {
    const doc = new jsPDF(), textos = registrarTexto(doc)
    crearPedidoPdf(doc, { ...datos, historial: [
      { id: 1, fecha: '2026-11-02T21:41:00Z', estado_anterior: 'EN ENVÍO', estado_nuevo: 'EN PREPARACIÓN', observaciones: 'Entrega [id] FALLIDA: Ausente', usuario_nombre: 'Responsable sintético' },
      { id: 2, fecha: '2026-11-02T22:00:00Z', estado_anterior: 'EN STOCK', estado_nuevo: 'EN STOCK', observaciones: 'ASIGNACION_NO_VISIBLE' },
    ] })
    expect(textos.join('\n')).toContain('Intento fallido')
    expect(textos.join('\n')).toContain('Motivo: Ausente')
    expect(textos.join('\n')).toContain('18:41:00')
    expect(textos.join('\n')).not.toContain('ASIGNACION_NO_VISIBLE')
  })
  it('pagina el historial visible completo, independientemente del paginado del panel', () => {
    const historial = Array.from({ length: 150 }, (_, id) => ({ id, fecha: '2026-11-02T21:41:00Z', estado_anterior: 'EN ENVÍO', estado_nuevo: 'EN PREPARACIÓN', observaciones: `Entrega [id] FALLIDA: Intento ${id}` }))
    const doc = new jsPDF(), textos = registrarTexto(doc)
    crearPedidoPdf(doc, { ...datos, historial })
    expect(doc.getNumberOfPages()).toBeGreaterThan(5)
    expect(textos.join('\n')).toContain('Intento 149')
  })
  it('el mapa contiene únicamente dirección e imagen', () => {
    const doc = new jsPDF(), textos = registrarTexto(doc)
    crearPedidoPdf(doc, datos, { mapa, soloMapa: true })
    expect(textos.join(' ')).toBe('Dirección: Calle de prueba 123 Localidad Buenos Aires')
    expect(doc.output()).toContain('/Subtype /Image')
    expect(doc.getNumberOfPages()).toBe(1)
  })
  it('no genera un mapa vacío si no hay imagen', () => {
    expect(() => crearPedidoPdf(new jsPDF(), datos, { soloMapa: true })).toThrow('El mapa no está disponible')
  })
  it('muestra en el pago el estado del comprobante sin exportar archivos', () => {
    const doc = new jsPDF(), textos = registrarTexto(doc)
    crearPedidoPdf(doc, { ...datos, pedido: { ...datos.pedido, pago_metodo: 'TRANSFERENCIA', pago_monto: '1000.00', comprobantes_cantidad: 1 } })
    expect(textos.join('\n')).toContain('Comprobante adjuntado')
    expect(textos.join('\n')).toContain('Pendiente de acreditación')
  })
  it('mantiene los márgenes para un campo de varias páginas', () => {
    const doc = new jsPDF(), posiciones = [], original = doc.text.bind(doc)
    doc.text = (texto, x, y, ...opciones) => { posiciones.push({ x, y }); return original(texto, x, y, ...opciones) }
    crearPedidoPdf(doc, { ...datos, pedido: { ...datos.pedido, observaciones: 'Texto largo '.repeat(2000) } })
    expect(doc.getNumberOfPages()).toBeGreaterThan(2)
    expect(posiciones.every(p => p.x >= 16 && p.y >= 16 && p.y <= 289)).toBe(true)
  })
  it('conserva ID y fecha sólo en los nombres de archivo', () => {
    expect(nombrePdf(12, datos.exportado_en)).toBe('pedido-12-2026-11-02.pdf')
    expect(nombrePdf(12, datos.exportado_en, true)).toBe('pedido-12-mapa-2026-11-02.pdf')
  })
})

describe('vista de mapa exportable', () => {
  it('rechaza coordenadas ausentes o inválidas', () => {
    expect(vistaMapa(null, null)).toBeNull()
    expect(vistaMapa('', '')).toBeNull()
    expect(vistaMapa(100, 10)).toBeNull()
  })
  it('descarga solamente las teselas de la vista', () => {
    for (const punto of [[-34.6, -58.4], [90, 180], [-90, -180], [0, 0]]) {
      const vista = vistaMapa(...punto)
      expect(vista.teselas.length).toBeGreaterThan(0)
      expect(vista.teselas.length).toBeLessThanOrEqual(12)
      expect(vista.teselas.every(t => /^https:\/\/tile.openstreetmap.org\/15\/\d+\/\d+\.png$/.test(t.url))).toBe(true)
    }
  })
})
