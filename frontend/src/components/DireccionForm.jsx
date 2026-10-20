import { DIRECCION_VACIA } from './direccion.js'

const CAMPOS = [
  { clave: 'calle', etiqueta: 'Calle', placeholder: 'Ej. Av. Corrientes', requerido: true, clase: 'street-field' },
  { clave: 'altura', etiqueta: 'Altura', placeholder: '1234', clase: '' },
  { clave: 'piso_depto', etiqueta: 'Piso/Depto', placeholder: 'Ej. 4° B', clase: '' },
  { clave: 'localidad', etiqueta: 'Localidad', placeholder: 'Ej. CABA', clase: '' },
  { clave: 'provincia', etiqueta: 'Provincia', placeholder: 'Ej. CABA', clase: '' },
  { clave: 'codigo_postal', etiqueta: 'Código Postal', placeholder: 'Ej. C1043', clase: '' },
  { clave: 'entre_calles', etiqueta: 'Entre calles', placeholder: 'Opcional', clase: 'span-2' },
]

// La gravedad del campo es la peor de sus problemas: un ERROR pinta rojo y una
// ADVERTENCIA pinta amarillo.
function gravedadCampo(problemas, clave) {
  const delCampo = problemas.filter((problema) => problema.campo === clave)
  if (delCampo.some((problema) => problema.gravedad === 'ERROR')) return 'ERROR'
  return delCampo.length ? 'ADVERTENCIA' : ''
}

// Formulario de dirección estructurada. La altura es opcional: una dirección sin
// altura se guarda como borrador a revisar, nunca habilita el despacho sola.
function DireccionForm({ valor = DIRECCION_VACIA, onChange, bloqueado = false, problemas = [] }) {
  return <div className="fields-grid address-fields">
    {CAMPOS.map((campo) => {
      const gravedad = gravedadCampo(problemas, campo.clave)
      const clase = gravedad === 'ERROR' ? 'campo-error' : gravedad === 'ADVERTENCIA' ? 'campo-advertencia' : ''
      return <label key={campo.clave} className={`form-field ${campo.clase}`} htmlFor={`direccion-${campo.clave}`}>
        <span>{campo.etiqueta}{campo.requerido && <b> *</b>}</span>
        <input
          id={`direccion-${campo.clave}`}
          className={clase || undefined}
          value={valor[campo.clave] ?? ''}
          onChange={(event) => onChange(campo.clave, event.target.value)}
          placeholder={campo.placeholder}
          autoComplete="off"
          disabled={bloqueado}
          aria-invalid={gravedad === 'ERROR' || undefined}
          aria-describedby={gravedad ? 'problemas-direccion' : undefined}
        />
      </label>
    })}
  </div>
}

export default DireccionForm
