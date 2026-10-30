import Icon from './Icon.jsx'
import { useEffect, useRef, useState } from 'react'

export default function ProcesoCarga({ titulo = 'Cargando…', detalle = 'Estamos consultando la información.', pantalla = false, breve = false }) {
  const ref = useRef(null)
  // El usuario pidió reproducir el recorrido en cada operación. La pausa es
  // explícita y local: una elección anterior no deja otra carga inmóvil.
  const [animar, setAnimar] = useState(true)
  function alternarAnimacion() {
    setAnimar(!animar)
  }
  const Contenedor = pantalla ? 'dialog' : 'section'
  useEffect(() => {
    if (!pantalla) return
    const dialogo = ref.current
    const anterior = document.body.style.overflow
    const foco = document.activeElement
    dialogo.showModal(); document.body.style.overflow = 'hidden'
    return () => { if (dialogo.open) dialogo.close(); document.body.style.overflow = anterior; foco?.focus() }
  }, [pantalla])
  return <Contenedor ref={ref} className={`process-status${pantalla ? ' process-status-screen' : ''}${breve ? ' process-status-short' : ''}${animar ? ' process-motion-enabled' : ''}`} aria-label={titulo} onCancel={pantalla ? e => e.preventDefault() : undefined}>
    {pantalla && <span className="process-brand">MandáTodo</span>}
    <div className="process-status-card">
      <p className="process-eyebrow">{pantalla ? 'Guardando tu pedido' : 'MandáTodo · En movimiento'}</p>
      <div className="process-route" aria-hidden="true"><span className="process-origin"/><span className="process-parcel">{pantalla ? <b>M</b> : <Icon name="truck" size={28}/>}</span><span className="process-destination"/></div>
      <div className="process-copy" role="status" aria-live="polite" aria-atomic="true"><strong>{titulo}</strong><p>{detalle}</p></div>
      <div className="process-loading-track" aria-hidden="true"><span/></div>
      <div className="process-stages" aria-hidden="true"><span>Datos del cliente</span><span>Pedido</span><span>Historial</span></div>
      <small className="process-footnote">No cierres esta ventana. Esperá la confirmación.</small>
      <button type="button" className="process-motion-choice" aria-pressed={animar} onClick={alternarAnimacion}>{animar ? 'Pausar animación' : 'Reproducir animación'}</button>
    </div>
  </Contenedor>
}
