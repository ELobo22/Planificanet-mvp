import React from 'react'
import { Link } from 'react-router-dom'

const Dashboard = ({ user, onLogout }) => {
  const getDashboardContent = () => {
    switch (user.tipo) {
      case 'cliente':
        return (
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h5 className="card-title">Solicitar Turno</h5>
                  <p className="card-text">Solicita un nuevo turno para instalación o soporte técnico</p>
                  <Link to="/solicitar-turno" className="btn btn-primary">
                    Solicitar Turno
                  </Link>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <h5 className="card-title">Mis Turnos</h5>
                  <p className="card-text">Revisa el estado de tus turnos solicitados</p>
                  <Link to="/turnos" className="btn btn-outline-primary">
                    Ver Mis Turnos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'tecnico':
        return (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <h5 className="card-title">Panel del Técnico</h5>
                  <p className="card-text">Gestiona tus turnos asignados</p>
                  <Link to="/turnos" className="btn btn-primary btn-lg">
                    Ver Mis Asignaciones
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'admin':
        return (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <h5 className="card-title">Panel de Administración</h5>
                  <p className="card-text">Gestiona todos los turnos del sistema</p>
                  <Link to="/turnos" className="btn btn-primary btn-lg">
                    Ver Todos los Turnos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">PlanificaNet</span>
          <div className="navbar-nav ms-auto">
            <span className="navbar-text me-3">
              Hola, {user.nombre} ({user.tipo})
            </span>
            <button 
              className="btn btn-outline-light btn-sm"
              onClick={onLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h4 className="mb-0">Dashboard Principal</h4>
              </div>
              <div className="card-body">
                {getDashboardContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard