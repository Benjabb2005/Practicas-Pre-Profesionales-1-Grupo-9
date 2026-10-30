import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function PedidoGuardado({ pedido, onContinuar }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialogo = ref.current
    const foco = document.activeElement
    const anterior = document.body.style.overflow
    dialogo.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      if (dialogo.open) dialogo.close()
      document.body.style.overflow = anterior
      foco?.focus()
    }
  }, [])
  return <dialog ref={ref} className="saved-dialog" aria-labelledby="saved-title" onCancel={e => { e.preventDefault(); onContinuar() }}>
    <div className="saved-check"><Icon name="check" size={36}/></div>
    <p className="eyebrow">Un paso más cerca del destino</p>
    <h2 id="saved-title">Listo. Tu pedido ya está guardado.</h2>
    <p>Conservamos los datos del cliente y del envío.</p>
    <div className="saved-receipt"><strong>{pedido.codigo || `#${pedido.id}`}</strong>{pedido.cliente_nombre && <span>{pedido.cliente_nombre}</span>}<span className="detail-state">{pedido.estado}</span></div>
    <p className="saved-next"><Icon name="pin" size={18}/>Ahora revisá el punto en el mapa y confirmá la ubicación antes de despachar.</p>
    <div className="saved-actions"><button type="button" className="button button-primary" autoFocus onClick={onContinuar}>Revisar ubicación →</button><Link className="button button-outline" to={`/pedidos/${pedido.id}`}>Ver detalle del pedido</Link></div>
  </dialog>
}
