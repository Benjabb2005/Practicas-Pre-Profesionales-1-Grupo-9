import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAddresses } from '../services/api.js'

function Dashboard() {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await listAddresses()
        if (!cancelled) setAddresses(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard admin</h1>
        <Link to="/login">Salir</Link>
      </header>

      {loading && <p>Cargando direcciones...</p>}

      {error && <p className="error">Error: {error}</p>}

      {!loading && !error && (
        <table className="addresses-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Calle</th>
              <th>Altura</th>
              <th>Ciudad</th>
              <th>Provincia</th>
            </tr>
          </thead>
          <tbody>
            {addresses.map((address) => (
              <tr key={address.id}>
                <td>{address.id}</td>
                <td>{address.street}</td>
                <td>{address.number}</td>
                <td>{address.city}</td>
                <td>{address.province}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && addresses.length === 0 && (
        <p>No hay direcciones cargadas todavía.</p>
      )}
    </div>
  )
}

export default Dashboard