import { useEffect, useRef, useState } from 'react'
import './DriverApp.css'

const STOPS = [
  {
    number: 1,
    customer: 'Carlos Gómez',
    address: 'Av. de Mayo 1420, CABA',
    status: 'next',
  },
  {
    number: 2,
    customer: 'María Luz Segura',
    address: 'Corrientes 3489, CABA',
    status: 'queued',
  },
  {
    number: 3,
    customer: 'Distribuidora San Juan',
    address: 'Riobamba 450, San Martín',
    status: 'completed',
  },
]

const STOP_STATUS = {
  next: { label: 'SIGUIENTE ENTREGA', className: 'next' },
  queued: { label: 'EN COLA', className: 'queued' },
  completed: { label: 'COMPLETADO', className: 'completed' },
}

function TruckIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/>
    <circle cx="7.5" cy="19" r="1.7"/>
    <circle cx="18" cy="19" r="1.7"/>
  </svg>
}

function DriverApp({ onLogout }) {
  const [stops, setStops] = useState(STOPS)
  const [activeStop, setActiveStop] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const progressRef = useRef(null)
  const focusProgressAfterClose = useRef(false)
  const completedCount = stops.filter((stop) => stop.status === 'completed').length
  const totalCount = stops.length

  useEffect(() => {
    if (activeStop) {
      dialogRef.current?.querySelector('input[type="radio"]')?.focus()
      return
    }

    if (focusProgressAfterClose.current) {
      progressRef.current?.focus()
      focusProgressAfterClose.current = false
    } else {
      triggerRef.current?.focus()
    }
    triggerRef.current = null
  }, [activeStop])

  function openPayment(stop, event) {
    triggerRef.current = event.currentTarget
    setPaymentMethod('cash')
    setActiveStop(stop)
  }

  function closePayment() {
    setActiveStop(null)
  }

  function confirmPayment() {
    const stopNumber = activeStop.number

    setStops((currentStops) => {
      const completedStops = currentStops.map((stop) => stop.number === stopNumber
        ? { ...stop, status: 'completed', paymentMethod }
        : stop)
      const nextStop = completedStops.find((stop) => stop.status !== 'completed')

      return completedStops.map((stop) => {
        if (stop.status === 'completed') return stop
        return { ...stop, status: stop.number === nextStop?.number ? 'next' : 'queued' }
      })
    })

    focusProgressAfterClose.current = true
    closePayment()
  }

  function handleDialogKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closePayment()
      return
    }

    if (event.key !== 'Tab') return

    const focusableElements = dialogRef.current?.querySelectorAll('input:not(:disabled), button:not(:disabled)')
    if (!focusableElements?.length) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  return <main className="driver-page">
    <div className="driver-shell">
      <header className="driver-header">
        <div className="driver-brand">
          <span className="driver-brand-icon"><TruckIcon/></span>
          <span className="driver-brand-copy">
            <strong>MandáTodo</strong>
            <small>HOY • {totalCount} PARADAS</small>
          </span>
        </div>
        <button className="driver-logout" type="button" onClick={onLogout}>Cerrar sesión</button>
      </header>

      <section className="driver-intro" aria-labelledby="driver-page-title">
        <div>
          <p className="driver-eyebrow">Ruta del día</p>
          <h1 id="driver-page-title">Andrés Silva</h1>
          <span className="driver-online"><span/>En línea</span>
        </div>
        <span className="driver-avatar" aria-label="Andrés Silva">AS</span>
      </section>

      <section className="driver-progress" aria-labelledby="driver-progress-title" ref={progressRef} tabIndex={-1}>
        <div className="driver-progress-heading">
          <h2 id="driver-progress-title">Avance del Día</h2>
          <strong>{completedCount} / {totalCount} <span>Paradas</span></strong>
        </div>
        <progress value={completedCount} max={totalCount} aria-label={`${completedCount} de ${totalCount} paradas completadas`}/>
      </section>

      <section className="driver-stops" aria-label="Paradas del día">
        {stops.map((stop) => {
          const status = STOP_STATUS[stop.status]

          return <article className="driver-stop" key={stop.number}>
            <div className="driver-stop-heading">
              <span className="driver-stop-number">{stop.number}</span>
              <span className={`driver-stop-status ${status.className}`}>{status.label}</span>
            </div>
            <div className="driver-stop-detail">
              <span>Cliente</span>
              <strong>{stop.customer}</strong>
            </div>
            <div className="driver-stop-detail">
              <span>Dirección de Entrega</span>
              <strong>{stop.address}</strong>
            </div>
            <div className="driver-stop-actions">
              <button className="driver-map-button" type="button">Ver en Mapa</button>
              {stop.status === 'completed'
                ? <button className="driver-delivery-button paid" type="button" disabled>PAGADO</button>
                : <button className="driver-delivery-button" type="button" onClick={(event) => openPayment(stop, event)}>ENTREGADO</button>}
            </div>
          </article>
        })}
      </section>
    </div>

    {activeStop && <div className="driver-dialog-backdrop">
      <section
        className="driver-payment-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-dialog-title"
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleDialogKeyDown}
      >
        <h2 id="driver-dialog-title">Actualizar Parada {activeStop.number}</h2>
        <p>Seleccione el método de cobro realizado para el pedido de {activeStop.customer}.</p>
        <fieldset className="driver-payment-options">
          <legend>Método de cobro</legend>
          <label>
            <input
              type="radio"
              name="driver-payment-method"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={(event) => setPaymentMethod(event.target.value)}
            />
            <span><strong>Efectivo</strong><small>Generar Remito físico o digital</small></span>
          </label>
          <label>
            <input
              type="radio"
              name="driver-payment-method"
              value="transfer"
              checked={paymentMethod === 'transfer'}
              onChange={(event) => setPaymentMethod(event.target.value)}
            />
            <span><strong>Transferencia</strong><small>Directo a cuenta de la empresa</small></span>
          </label>
        </fieldset>
        <div className="driver-dialog-actions">
          <button className="driver-confirm-payment" type="button" onClick={confirmPayment}>Confirmar y Registrar Pago</button>
          <button className="driver-cancel-payment" type="button" onClick={closePayment}>Cancelar</button>
        </div>
      </section>
    </div>}
  </main>
}

export default DriverApp