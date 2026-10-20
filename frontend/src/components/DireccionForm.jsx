import { useEffect, useId, useState } from 'react'
import { DIRECCION_VACIA } from './direccion.js'
import { buscarLocalidades, listarProvincias } from '../api/localidades'

const CAMPOS = [
  { clave: 'calle', etiqueta: 'Calle', placeholder: 'Ej. Av. Corrientes', requerido: true, clase: 'street-field' },
  { clave: 'altura', etiqueta: 'Altura', placeholder: '1234', clase: '' },
  { clave: 'piso_depto', etiqueta: 'Piso/Depto', placeholder: 'Ej. 4° B', clase: '' },
  { clave: 'localidad', etiqueta: 'Localidad', placeholder: 'Ej. Rosario', clase: '' },
  { clave: 'provincia', etiqueta: 'Provincia', clase: '' },
  { clave: 'codigo_postal', etiqueta: 'Código Postal', placeholder: 'Ej. C1043', clase: '' },
  { clave: 'entre_calles', etiqueta: 'Entre calles', placeholder: 'Opcional', clase: 'span-2' },
]

const DEMORA_SUGERENCIAS_MS = 300

// La gravedad del campo es la peor de sus problemas: un ERROR pinta rojo y una
// ADVERTENCIA pinta amarillo.
function gravedadCampo(problemas, clave) {
  const delCampo = problemas.filter((problema) => problema.campo === clave)
  if (delCampo.some((problema) => problema.gravedad === 'ERROR')) return 'ERROR'
  return delCampo.length ? 'ADVERTENCIA' : ''
}

// Formulario de dirección estructurada. La altura es opcional: una dirección sin
// altura se guarda como borrador a revisar, nunca habilita el despacho sola.
// Provincia es una lista fija del backend; localidad sugiere con Georef a través
// de /api/localidades, pero se puede escribir un valor que no esté en la lista.
function DireccionForm({ valor = DIRECCION_VACIA, onChange, bloqueado = false, problemas = [] }) {
  const idSugerencias = useId()
  const [provincias, setProvincias] = useState([])
  const [sugerencias, setSugerencias] = useState({ clave: '', nombres: [] })
  const [errorProvincias, setErrorProvincias] = useState(false)

  const provinciaActual = valor.provincia ?? ''
  const localidadActual = valor.localidad ?? ''
  const claveSugerencia = `${provinciaActual.trim()}|${localidadActual.trim()}`

  useEffect(() => {
    let vigente = true
    listarProvincias()
      .then((nombres) => {
        if (vigente) setProvincias(nombres)
      })
      .catch(() => {
        if (vigente) setErrorProvincias(true)
      })
    return () => {
      vigente = false
    }
  }, [])

  // Guarda las sugerencias junto con la consulta que las originó: al cambiar la
  // localidad o la provincia, las viejas dejan de mostrarse sin setState extra.
  useEffect(() => {
    const nombre = localidadActual.trim()
    const provincia = provinciaActual.trim()
    if (!provincia || nombre.length < 2) return undefined

    let vigente = true
    const temporizador = setTimeout(() => {
      buscarLocalidades(provincia, nombre)
        .then((localidades) => {
          if (vigente) setSugerencias({ clave: `${provincia}|${nombre}`, nombres: localidades })
        })
        .catch(() => {
          if (vigente) setSugerencias({ clave: `${provincia}|${nombre}`, nombres: [] })
        })
    }, DEMORA_SUGERENCIAS_MS)

    return () => {
      vigente = false
      clearTimeout(temporizador)
    }
  }, [localidadActual, provinciaActual])

  const nombresSugeridos = sugerencias.clave === claveSugerencia ? sugerencias.nombres : []
  const provinciaFueraDeLista = provinciaActual !== '' && !provincias.includes(provinciaActual)

  return <div className="fields-grid address-fields">
    {CAMPOS.map((campo) => {
      const gravedad = gravedadCampo(problemas, campo.clave)
      const clase = gravedad === 'ERROR' ? 'campo-error' : gravedad === 'ADVERTENCIA' ? 'campo-advertencia' : ''
      const atributos = {
        id: `direccion-${campo.clave}`,
        className: clase || undefined,
        value: valor[campo.clave] ?? '',
        onChange: (event) => onChange(campo.clave, event.target.value),
        disabled: bloqueado,
        'aria-invalid': gravedad === 'ERROR' || undefined,
        'aria-describedby': gravedad ? 'problemas-direccion' : undefined,
      }

      return <label key={campo.clave} className={`form-field ${campo.clase}`} htmlFor={`direccion-${campo.clave}`}>
        <span>{campo.etiqueta}{campo.requerido && <b> *</b>}</span>

        {campo.clave === 'provincia'
          ? <>
              <select {...atributos}>
                <option value="">Elegí una provincia</option>
                {provinciaFueraDeLista && <option value={provinciaActual}>{provinciaActual}</option>}
                {provincias.map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}
              </select>
              {errorProvincias && <small className="campo-ayuda">No se pudieron cargar las provincias. Recargá la página.</small>}
            </>
          : campo.clave === 'localidad'
            ? <>
                <input {...atributos} list={idSugerencias} placeholder={campo.placeholder} autoComplete="off"/>
                <datalist id={idSugerencias}>
                  {nombresSugeridos.map((nombre) => <option key={nombre} value={nombre}/>)}
                </datalist>
              </>
            : <input {...atributos} placeholder={campo.placeholder} autoComplete="off"/>}
      </label>
    })}
  </div>
}

export default DireccionForm
