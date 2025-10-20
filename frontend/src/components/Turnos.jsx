import React, { useState, useEffect } from 'react'
import { turnsAPI } from '../services/api'

const Turnos = ({ user }) => {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Cargar turnos al montar el componente
  useEffect(() => {
    loadTurnos()
  }, [])

  const loadTurnos = async () => {
    try {
      setLoading(true)
      const response = await turnsAPI.getAll()
      setTurnos(response.data)
    } catch (error) {
      setError('Error cargando turnos')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Actualizar estado del turno
  const updateStatus = async (turnoId, nuevoEstado) => {
    try {
      await turnsAPI.updateStatus(turnoId, nuevoEstado)
      loadTurnos() // Recargar la lista
    } catch (error) {
      setError('Error actualizando estado')
      console.error(error)
    }
  }

  // Formatear fecha
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES')
  }

  // Obtener clase CSS según estado
  const getEstadoClass = (estado) => {
    const classes = {
      pendiente: 'bg-warning text-dark',
      asignado: 'bg-info text-white',
      en_curso: 'bg-primary text-white',
      completado: 'bg-success text-white'
    }
    return classes[estado] || 'bg-secondary text-white'
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar simple */}
      <nav className="navbar navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">PlanificaNet - Turnos</span>
          <a href="/dashboard" className="btn btn-outline-light btn-sm">
            Volver al Dashboard
          </a>
        </div>
      </nav>

      <div className="container mt-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h4 className="mb-0">
              {user.tipo === 'admin' && 'Todos los Turnos'}
              {user.tipo === 'tecnico' && 'Mis Turnos Asignados'}
              {user.tipo === 'cliente' && 'Mis Turnos'}
            </h4>
          </div>
          <div className="card-body">
            {turnos.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted">No hay turnos para mostrar</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Servicio</th>
                      {(user.tipo === 'admin' || user.tipo === 'tecnico') && <th>Cliente</th>}
                      {(user.tipo === 'admin' || user.tipo === 'cliente') && <th>Técnico</th>}
                      <th>Estado</th>
                      {user.tipo !== 'cliente' && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {turnos.map((turno) => (
                      <tr key={turno.id}>
                        <td>{formatFecha(turno.fecha)}</td>
                        <td>{turno.hora}</td>
                        <td>
                          <span className="badge bg-secondary">
                            {turno.servicio === 'instalacion' ? 'Instalación' : 'Soporte'}
                          </span>
                        </td>
                        {(user.tipo === 'admin' || user.tipo === 'tecnico') && (
                          <td>{turno.cliente_nombre}</td>
                        )}
                        {(user.tipo === 'admin' || user.tipo === 'cliente') && (
                          <td>{turno.tecnico_nombre || 'Por asignar'}</td>
                        )}
                        <td>
                          <span className={`badge ${getEstadoClass(turno.estado)}`}>
                            {turno.estado}
                          </span>
                        </td>
                        {user.tipo !== 'cliente' && (
                          <td>
                            {turno.estado === 'asignado' && (
                              <button
                                className="btn btn-sm btn-primary me-1"
                                onClick={() => updateStatus(turno.id, 'en_curso')}
                              >
                                Iniciar
                              </button>
                            )}
                            {turno.estado === 'en_curso' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => updateStatus(turno.id, 'completado')}
                              >
                                Completar
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Turnos