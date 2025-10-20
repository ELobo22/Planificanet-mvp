import React, { useState } from 'react'
import { turnsAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'

const SolicitarTurno = ({ user }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '09:00',
    servicio: 'instalacion',
    descripcion: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await turnsAPI.create(formData)
      setSuccess('Turno solicitado exitosamente!')
      setFormData({
        fecha: '',
        hora: '09:00',
        servicio: 'instalacion',
        descripcion: ''
      })
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/turnos')
      }, 2000)
      
    } catch (error) {
      setError(error.response?.data?.error || 'Error solicitando turno')
    } finally {
      setLoading(false)
    }
  }

  // Fecha mínima (hoy)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar simple */}
      <nav className="navbar navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">Solicitar Turno</span>
          <a href="/dashboard" className="btn btn-outline-light btn-sm">
            Volver al Dashboard
          </a>
        </div>
      </nav>

      <div className="container mt-4">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card">
              <div className="card-header">
                <h4 className="mb-0">Solicitar Nuevo Turno</h4>
              </div>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Fecha</label>
                    <input
                      type="date"
                      className="form-control"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleChange}
                      min={today}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Hora</label>
                    <select
                      className="form-select"
                      name="hora"
                      value={formData.hora}
                      onChange={handleChange}
                      required
                    >
                      <option value="09:00">09:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="17:00">05:00 PM</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Servicio</label>
                    <select
                      className="form-select"
                      name="servicio"
                      value={formData.servicio}
                      onChange={handleChange}
                      required
                    >
                      <option value="instalacion">Instalación</option>
                      <option value="soporte">Soporte Técnico</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Descripción (opcional)</label>
                    <textarea
                      className="form-control"
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Describe el problema o requerimiento..."
                    />
                  </div>

                  <div className="d-grid gap-2">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Solicitando...' : 'Solicitar Turno'}
                    </button>
                    <a href="/turnos" className="btn btn-outline-secondary">
                      Ver Mis Turnos
                    </a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SolicitarTurno