import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Turnos from './components/Turnos'
import SolicitarTurno from './components/SolicitarTurno'
import RegistroCliente from './components/RegistroCliente'
import Notificaciones from './components/Notificaciones'



function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
           <Route path="/registro" element={<RegistroCliente />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/" />} />
          <Route path="/turnos" element={user ? <Turnos user={user} /> : <Navigate to="/" />} />
          <Route path="/solicitar-turno" element={user && user.rol === 1 ? <SolicitarTurno user={user} /> : <Navigate to="/dashboard" />} />
          <Route   path="/notificaciones"    element={<Notificaciones user={user} onLogout={handleLogout} />} />

        </Routes>
      </div>
    </Router>
  )
}

export default App