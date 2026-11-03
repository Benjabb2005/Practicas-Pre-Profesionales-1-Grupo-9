import { fechaHora } from './fechas.js'
import { moneda } from './importes.js'
import { historialEntregas } from './chofer.js'
import { datosMasInformacion, direccionDelPedido } from './datosMasInformacion.js'

const zona = { timeZone: 'America/Argentina/Buenos_Aires' }
const disponible = valor => valor == null || valor === '' ? 'No informado' : String(valor)

export function nombrePdf(id, fecha, soloMapa = false) {
  const dia = new Intl.DateTimeFormat('en-CA', { timeZone: zona.timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(fecha))
  return `pedido-${Number(id)}-${soloMapa ? 'mapa-' : ''}${dia}.pdf`
}

// La información sigue el contenido visible de Más información. El mapa es una
// descarga separada: únicamente dirección e imagen, con atribución en la imagen.
export function crearPedidoPdf(doc, datos, { mapa = null, soloMapa = false } = {}) {
  const p = datos.pedido, ancho = 178, margen = 16, limite = 277
  let y = 22
  function texto(valor, titulo = false) {
    doc.setFont('helvetica', titulo ? 'bold' : 'normal'); doc.setFontSize(titulo ? 12 : 10)
    const lineas = doc.splitTextToSize(String(valor).replaceAll('→', '->').replaceAll('—', '-'), ancho)
    if (titulo && y > limite - 18) { doc.addPage(); y = 22 }
    for (const linea of lineas) {
      if (y > limite) { doc.addPage(); y = 22 }
      doc.text(linea, margen, y); y += titulo ? 7 : 5
    }
    y += 2
  }
  function campo(etiqueta, valor) { texto(`${etiqueta}: ${disponible(valor)}`) }
  if (soloMapa) {
    if (!mapa) throw new Error('El mapa no está disponible para descargar.')
    campo('Dirección', direccionDelPedido(p))
    if (y + ancho * 400 / 640 > limite) { doc.addPage(); y = 22 }
    doc.addImage(mapa, 'PNG', margen, y, ancho, ancho * 400 / 640)
    return doc
  }

  texto('Más información', true)
  for (const [etiqueta, valor] of datosMasInformacion(p)) campo(etiqueta, valor)
  campo('Envío base', moneda(p.importe_base))
  if (Number(p.recargo_total) > 0) campo('Recargo por intentos fallidos (al emisor)', moneda(p.recargo_total))
  if (p.importe_total != null) campo('Total a cobrar', moneda(p.importe_total))
  if (p.proxima_visita) campo('Próxima visita', String(p.proxima_visita).slice(0, 10).split('-').reverse().join('/'))
  texto('Pago', true)
  if (!p.pago_metodo) texto('Sin pago registrado.')
  else {
    texto(`${p.pago_metodo === 'EFECTIVO' ? 'Efectivo' : 'Transferencia'} · ${moneda(p.pago_monto)}`)
    if (p.pago_metodo === 'TRANSFERENCIA') texto(Number(p.comprobantes_cantidad) > 0 ? 'Comprobante adjuntado' : 'Comprobante pendiente de subir')
    texto(p.estado === 'PAGADO' ? 'Pago confirmado · PAGADO' : 'Pendiente de acreditación')
  }
  texto('Historial del pedido', true)
  const movimientos = historialEntregas(datos.historial ?? [])
  if (!movimientos.length) texto('Todavía no se registraron cambios de estado ni intentos.')
  for (const h of movimientos) {
    texto(h.titulo, true)
    texto(`${fechaHora(h.fecha, zona)} · ${h.usuario_nombre || 'Usuario no disponible'}`)
    if (h.motivo) texto(`Motivo: ${h.motivo}`)
  }
  const paginas = doc.getNumberOfPages()
  for (let pagina = 1; pagina <= paginas; pagina++) {
    doc.setPage(pagina); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text(`${pagina} / ${paginas}`, margen, 289)
  }
  return doc
}
