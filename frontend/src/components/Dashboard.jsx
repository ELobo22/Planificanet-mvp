import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { turnosAPI, notificacionesAPI } from '../services/api'

const formatFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString("es-ES");
};

const detalleHora = {
  "Mañana": "09:00 - 12:00",
  "Tarde": "13:00 - 17:00",
  "Noche": "18:00 - 21:00"
};

const Dashboard = ({ user, onLogout }) => {

  const [proximoTurno, setProximoTurno] = useState(null)
  const [notificaciones, setNotificaciones] = useState([])
  const [mostrarDropdown, setMostrarDropdown] = useState(false)

  useEffect(() => {
    if (user.rol === 1 || user.rol === 2) {
      const fetchProximoTurno = async () => {
        try {
          const response = await turnosAPI.getProximoTurno(user.id_usuario || user.id)
          setProximoTurno(response.data)
        } catch (error) {
          console.error("Error obteniendo próximo turno:", error)
        }
      }

      const fetchNotificaciones = async () => {
        try {
          const response = await notificacionesAPI.getAll()
          setNotificaciones(response.data)
        } catch (error) {
          console.error("Error obteniendo notificaciones:", error)
        }
      }

      fetchProximoTurno()
      fetchNotificaciones()
    }
  }, [user])

  const noLeidas = notificaciones.filter(n => n.leida === 0).length

  const marcarComoLeida = async (id) => {
    try {
      await notificacionesAPI.marcarLeida(id)
      setNotificaciones(prev =>
        prev.map(n => n.id_notif === id ? { ...n, leida: 1 } : n)
      )
    } catch (error) {
      console.error("Error marcando notificación:", error)
    }
  }

  const getDashboardContent = () => {
    switch (user.rol) {

      case 1: // CLIENTE
        return (
          <div className="row">

            <div className="col-md-6 mb-4">
              <div className="card-container text-center">
                <h5 className="fw-bold">Solicitar Turno</h5>
                <p className="text-muted">Solicita un nuevo turno para instalación o soporte técnico</p>
                <Link to="/solicitar-turno" className="btn-main">
                  Solicitar Turno
                </Link>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card-container text-center">
                <h5 className="fw-bold">Mis Turnos</h5>
                <p className="text-muted">Revisa el estado de tus turnos solicitados</p>
                <Link to="/turnos" className="btn-secondary-custom">
                  Ver Mis Turnos
                </Link>
              </div>
            </div>

          </div>
        )

      case 2: // TÉCNICO
        return (
          <div className="row">
            <div className="col-12">
              <div className="card-container text-center">
                <h5 className="fw-bold">Panel del Técnico</h5>
                <p className="text-muted">Gestiona tus turnos asignados</p>
                <Link to="/turnos" className="btn-main">
                  Ver Mis Asignaciones
                </Link>
              </div>
            </div>
          </div>
        )

      case 3: // ADMIN
        return (
          <div className="row">
            <div className="col-12">
              <div className="card-container text-center">
                <h5 className="fw-bold">Panel de Administración</h5>
                <p className="text-muted">Gestiona todos los turnos del sistema</p>
                <Link to="/turnos" className="btn-main">
                  Ver Todos los Turnos
                </Link>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-vh-100 bg-transparent">

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">

          <span className="navbar-brand fw-bold">PlanificaNet</span>
          
          <div className="navbar-nav ms-auto align-items-center d-flex gap-3">
            {/* Nombre del usuario logueado */}
                <span className="text-white fw-semibold">
                  {user?.nombre}
                </span>



            {/* Menú de usuario (Perfil + Cerrar sesión) */}
            <div className="dropdown">
              <span
                className="text-white fs-5"
                style={{ cursor: "pointer" }}
                data-bs-toggle="dropdown"
              >
                👤
              </span>

              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <a className="dropdown-item" href="/perfil">Mi Perfil</a>
                </li>
                <li>
                  <button className="dropdown-item" onClick={onLogout}>
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>

            {/* Notificaciones (solo cliente y técnico) */}
            {(user.rol === 1 || user.rol === 2) && (
              <div className="me-3 position-relative">

                <span 
                  className="text-white fs-5"
                  style={{ cursor: "pointer" }}
                  onClick={() => setMostrarDropdown(!mostrarDropdown)}
                >
                  🔔
                </span>

                {noLeidas > 0 && (
                  <span 
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {noLeidas}
                  </span>
                )}

                {mostrarDropdown && (
                  <div 
                    className="notif-dropdown position-absolute" 
                    style={{ top: "35px", right: "0", zIndex: 999 }}
                  >
                    <h6 className="border-bottom pb-2 mb-2">Notificaciones</h6>

                    {notificaciones.length === 0 ? (
                      <p className="text-muted small mb-0">No tenés notificaciones.</p>
                    ) : (
                      notificaciones
                        .sort((a, b) => new Date(b.fecha_envio) - new Date(a.fecha_envio))
                        .slice(0, 8)
                        .map((notif) => (
                          <div 
                            key={notif.id_notif}
                            className={`d-flex justify-content-between align-items-center mb-2 
                              ${notif.leida ? "text-muted" : "fw-bold"}`}
                          >
                            <span className="small">{notif.mensaje}</span>

                            {!notif.leida && (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => marcarComoLeida(notif.id_notif)}
                              >
                                ✓
                              </button>
                            )}
                          </div>
                        ))
                    )}

                    <div className="text-center mt-2">
                      <Link 
                        to="/notificaciones"
                        className="small text-primary text-decoration-none"
                        onClick={() => setMostrarDropdown(false)}
                      >
                        Ver todas
                      </Link>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="container mt-4">

        <h2 className="page-title text-center mb-2">📊 Dashboard Principal</h2>
        <p className="page-subtitle text-center mb-4">Bienvenido al panel de gestión</p>

        {(user.rol === 1 || user.rol === 2) && (
          <div className="card-container mb-4">
            <h5 className="fw-bold mb-3">📅 Próximo Turno</h5>

            {proximoTurno ? (
              <div>
                <p><strong>Fecha:</strong> {formatFecha(proximoTurno.fecha)}</p>
                <p>
                  <strong>Franja horaria:</strong> {proximoTurno.franja_horaria} (
                    {detalleHora[
                      proximoTurno.franja_horaria.charAt(0).toUpperCase() + 
                      proximoTurno.franja_horaria.slice(1)
                    ]}
                  )
                </p>
                <p>
                  <strong>Estado:</strong>{" "}
                  {proximoTurno.estado.charAt(0).toUpperCase() + proximoTurno.estado.slice(1).toLowerCase()}
                </p>

                {proximoTurno.tecnico_nombre && (
                  <p><strong>Técnico asignado:</strong> {proximoTurno.tecnico_nombre}</p>
                )}

              </div>
            ) : (
              <p className="text-muted">No tenés turnos próximos.</p>
            )}
          </div>
        )}

        {getDashboardContent()}

      </div>
    </div>
  )
}

export default Dashboard
