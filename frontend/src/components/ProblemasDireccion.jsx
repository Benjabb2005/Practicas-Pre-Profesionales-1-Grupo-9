import Icon from './Icon.jsx'

// Lista de problemas que devuelve el backend al validar la dirección. Es sólo
// presentación: el estado y los bloqueos reales los decide el servidor.
function ProblemasDireccion({ problemas = [] }) {
  if (!problemas.length) return null
  return <ul className="direccion-problemas" id="problemas-direccion">
    {problemas.map((problema, indice) => {
      const esError = problema.gravedad === 'ERROR'
      return <li key={`${problema.codigo}-${problema.campo}-${indice}`} className={`direccion-problema ${esError ? 'error' : 'advertencia'}`}>
        <Icon name="alert" size={12}/>
        <span><b>{esError ? 'Error' : 'Advertencia'}:</b> {problema.mensaje}</span>
      </li>
    })}
  </ul>
}

export default ProblemasDireccion
