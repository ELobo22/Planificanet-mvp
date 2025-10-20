import React, { useState } from 'react'
import { authAPI } from '../services/api'

const Login = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    tipo: 'cliente',
    telefono: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        const response = await authAPI.login({ email: formData.email, password: formData.password })
        onLogin(response.data.user, response.data.token)
      } else {
        await authAPI.register(formData)
        const loginResponse = await authAPI.login({ email: formData.email, password: formData.password })
        onLogin(loginResponse.data.user, loginResponse.data.token)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <h2 className="card-title text-primary">PlanificaNet</h2>
                  <p className="text-muted">Sistema de Gestión de Turnos</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <form onSubmit={handleSubmit}>
                  {!isLogin && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Nombre completo</label>
                        <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleChange} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Tipo de usuario</label>
                        <select className="form-select" name="tipo" value={formData.tipo} onChange={handleChange} required>
                          <option value="cliente">Cliente</option>
                          <option value="tecnico">Técnico</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Teléfono</label>
                        <input type="tel" className="form-control" name="telefono" value={formData.telefono} onChange={handleChange} />
                      </div>
                    </>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Contraseña</label>
                    <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} required />
                  </div>

                  <button type="submit" className="btn btn-primary w-100 mb-3" disabled={loading}>
                    {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                  </button>
                </form>

                <div className="text-center">
                  <button type="button" className="btn btn-link" onClick={() => setIsLogin(!isLogin)}>
                    {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
                  </button>
                </div>

                <div className="mt-4 p-3 bg-light rounded small">
                  <strong>Usuarios de prueba:</strong><br/>
                  Admin: admin@planificanet.com / password<br/>
                  Técnico: tecnico@planificanet.com / password<br/>
                  Cliente: cliente@test.com / password
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login