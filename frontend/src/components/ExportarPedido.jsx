import { useRef, useState } from 'react'
import { obtenerExportacion } from '../api/exportaciones.js'
import { mensajeError } from '../api/client.js'
import { coordenadasDeMapa } from './mapa.js'
import './ExportarPedido.css'

export default function ExportarPedido({ pedidoId }) {
  const enCurso = useRef(false)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  async function descargar(soloMapa) {
    if (enCurso.current) return
    enCurso.current = true; setOcupado(true); setError(''); setAviso('')
    try {
      const datos = await obtenerExportacion(pedidoId)
      const [{ jsPDF }, { crearPedidoPdf, nombrePdf }] = await Promise.all([
        import('jspdf'), import('./pedidoPdf.js'),
      ])
      let mapa = null
      if (soloMapa) {
        if (!coordenadasDeMapa(datos.pedido.latitud, datos.pedido.longitud)) throw new Error('El pedido no tiene coordenadas disponibles para descargar el mapa.')
        const { imagenMapa } = await import('./mapaExportacion.js')
        try { mapa = await imagenMapa(datos.pedido) }
        catch { throw new Error('No se pudo cargar el mapa. Reintentá la descarga. La información del pedido se puede descargar por separado.') }
      }
      const doc = crearPedidoPdf(new jsPDF({ unit: 'mm', format: 'a4', compress: true }), datos, { mapa, soloMapa })
      await doc.save(nombrePdf(datos.pedido.id, datos.exportado_en, soloMapa), { returnPromise: true })
      setAviso('PDF generado. Revisá las descargas de tu navegador.')
    } catch (e) { setError(e.response ? mensajeError(e) : e.message || 'No se pudo generar el PDF. Reintentá.') }
    finally { enCurso.current = false; setOcupado(false) }
  }
  return <section className="exportar-pedido" aria-label="Exportar pedido" aria-busy={ocupado}>
    <div className="exportar-acciones"><button type="button" className="button button-outline" disabled={ocupado} onClick={() => descargar(false)}>Descargar información PDF</button>
      <button type="button" className="button button-outline" disabled={ocupado} onClick={() => descargar(true)}>Descargar mapa PDF</button></div>
    {ocupado && <p role="status">Generando PDF…</p>}
    {error && <p role="alert">{error}</p>}{aviso && <p role="status">{aviso}</p>}
  </section>
}
