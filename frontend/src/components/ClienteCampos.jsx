import { CAMPOS_CLIENTE, CLIENTE_VACIO } from './cliente.js'

// Datos del cliente que viajan con el pedido (MVP1). Se completan para dar de
// alta un cliente nuevo o editando uno frecuente elegido. El backend valida y
// avisa duplicados; acá no se fusiona nada.
function ClienteCampos({ valor = CLIENTE_VACIO, onChange, bloqueado = false }) {
  return <div className="fields-grid cliente-campos">
    {CAMPOS_CLIENTE.map((campo) => <label key={campo.clave} className={`form-field ${campo.clase}`} htmlFor={`cliente-${campo.clave}`}>
      <span>{campo.etiqueta}{campo.requerido && <b> *</b>}</span>
      <input
        id={`cliente-${campo.clave}`}
        value={valor[campo.clave] ?? ''}
        onChange={(event) => onChange(campo.clave, event.target.value)}
        placeholder={campo.placeholder}
        autoComplete="off"
        type={campo.clave === 'email' ? 'email' : 'text'}
        disabled={bloqueado}
      />
    </label>)}
  </div>
}

export default ClienteCampos
