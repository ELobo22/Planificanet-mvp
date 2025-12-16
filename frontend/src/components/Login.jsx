import React, { useState } from 'react'
import { authAPI } from '../services/api'
import { useNavigate } from 'react-router-dom'
import Swal from "sweetalert2"

const Login = ({ onLogin }) => {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      })
      
console.log("TOKEN USER:", response.data.user)

      onLogin(response.data.user, response.data.token)

    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.error || "Error de conexión",
        icon: "error",
        confirmButtonColor: "#d33"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, #e3f2fd, #bbdefb, #e3f2fd)"
      }}
    >
      <div
        className="card shadow-lg p-4"
        style={{
          maxWidth: "450px",
          width: "100%",
          borderRadius: "18px",
          background: "white"
        }}
      >
        {/* Encabezado */}
        <div className="text-center mb-4">
          <h2 className="text-primary fw-bold" style={{ fontSize: "1.9rem" }}>
            PlanificaNet
          </h2>
          <p className="text-muted" style={{ fontSize: "1rem" }}>
            Sistema de Gestion de Turnos
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Contraseña */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Contraseña</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Botón de login */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Botón para ir al registro */}
        <div className="text-center mt-3">
          <button
            type="button"
            className="btn btn-link"
            onClick={() => navigate('/registro')}
          >
            ¿No tienes cuenta? Regístrate
          </button>
        </div>

        {/* Usuarios de prueba */}
        <div className="mt-4 p-3 bg-light rounded small">
          <strong>Usuarios de prueba:</strong><br />
          Admin: admin@planificanet.com / password<br />
          Técnico: tecnico@planificanet.com / password<br />
          Cliente: cliente@test.com / password
        </div>
      </div>
    </div>
  )
}

export default Login
