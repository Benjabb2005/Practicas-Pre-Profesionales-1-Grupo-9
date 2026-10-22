// Formulario compartido por el alta y la edición de clientes. El backend es la
// fuente de verdad: acá solo se marcan los campos obligatorios y se muestra el
// error que devuelve el servidor.
function ClienteForm({ valor, onChange, onSubmit, onCancel, enviando = false, modo = 'crear' }) {
  const editando = modo === 'editar'

  return <section className="panel clientes-form-panel" aria-labelledby="cliente-form-title">
    <div className="section-heading">
      <span className="step-number">{editando ? '✎' : '+'}</span>
      <div>
        <h2 id="cliente-form-title">{editando ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <p>{editando ? 'Corregí los datos y guardá los cambios.' : 'Completá los datos del cliente. El nombre es obligatorio.'}</p>
      </div>
    </div>

    <form className="clientes-form" onSubmit={onSubmit}>
      <label htmlFor="cliente-nombre">Nombre y apellido *</label>
      <input
        id="cliente-nombre"
        value={valor.nombre}
        onChange={(event) => onChange('nombre', event.target.value)}
        required
        maxLength={150}
        autoComplete="off"
      />

      <label htmlFor="cliente-dni">DNI</label>
      <input
        id="cliente-dni"
        value={valor.dni}
        onChange={(event) => onChange('dni', event.target.value)}
        placeholder="Con o sin puntos"
        maxLength={20}
        inputMode="numeric"
        autoComplete="off"
      />

      <label htmlFor="cliente-telefono">Teléfono</label>
      <input
        id="cliente-telefono"
        value={valor.telefono}
        onChange={(event) => onChange('telefono', event.target.value)}
        placeholder="Ej. 11 5555-5555"
        maxLength={50}
        inputMode="tel"
        autoComplete="off"
      />

      <label htmlFor="cliente-email">Email</label>
      <input
        id="cliente-email"
        type="email"
        value={valor.email}
        onChange={(event) => onChange('email', event.target.value)}
        placeholder="Ej. nombre@correo.com"
        maxLength={150}
        autoComplete="off"
      />

      <label htmlFor="cliente-tipo">Tipo</label>
      <select id="cliente-tipo" value={valor.tipo} onChange={(event) => onChange('tipo', event.target.value)}>
        <option value="particular">Particular</option>
        <option value="empresa">Empresa</option>
      </select>

      <label className="clientes-span-2" htmlFor="cliente-domicilio">Domicilio</label>
      <input
        className="clientes-span-2"
        id="cliente-domicilio"
        value={valor.domicilio}
        onChange={(event) => onChange('domicilio', event.target.value)}
        placeholder="Calle, altura, localidad"
        maxLength={255}
        autoComplete="off"
      />

      <div className="clientes-form-actions">
        <button className="button button-primary" type="submit" disabled={enviando}>
          {enviando ? 'Guardando…' : 'Guardar'}
        </button>
        <button className="button button-outline" type="button" onClick={onCancel} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  </section>
}

export default ClienteForm
