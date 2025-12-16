import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { notificacionesAPI } from "../services/api";

const Notificaciones = ({ user, onLogout }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await notificacionesAPI.getAll();
        setNotificaciones(response.data);
      } catch (error) {
        console.error("Error obteniendo notificaciones:", error);
      }
    };

    fetchData();
  }, []);

  const marcarComoLeida = async (id) => {
    try {
      await notificacionesAPI.marcarLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) =>
          n.id_notif === id ? { ...n, leida: 1 } : n
        )
      );
    } catch (error) {
      console.error("Error marcando como leída:", error);
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const formatearFecha = (fecha) => {
    const d = new Date(fecha);
    return d.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <>
      {/* ✅ Navbar PlanificaNet */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">

          <span className="navbar-brand">PlanificaNet</span>

          <div className="navbar-nav ms-auto align-items-center">

            {(user.rol === 1 || user.rol === 2) && (
              <div className="me-3 position-relative">

                <span 
                  className="text-white text-decoration-none fs-5"
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
                    className="position-absolute bg-white shadow rounded p-2"
                    style={{
                      top: "35px",
                      right: "0",
                      width: "260px",
                      zIndex: 999
                    }}
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

            <span className="navbar-text me-3">
              {user.nombre}
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

      {/* ✅ Contenido principal */}
      <div className="container mt-4">
        <h3 className="mb-4 fw-bold">Notificaciones</h3>

        {/* ✅ Botón Volver */}
        <button 
          className="btn btn-outline-primary mb-3"
          onClick={() => window.history.back()}
        >
          ← Volver
        </button>

        <div className="card shadow-sm">
          <div className="card-body">

            {notificaciones.length === 0 ? (
              <p className="text-muted">No tenés notificaciones.</p>
            ) : (
              <ul className="list-group list-group-flush">
                {notificaciones.map((notif) => (
                  <li
                    key={notif.id_notif}
                    className={`list-group-item d-flex justify-content-between align-items-start py-3 
                      ${notif.leida ? "bg-light" : "bg-white border-start border-4 border-primary"}`}
                  >
                    <div className="ms-2 me-auto">
                      <div className={`${notif.leida ? "text-muted" : "fw-bold"}`}>
                        🔔 {notif.mensaje}
                      </div>
                      <small className="text-muted">
                        {formatearFecha(notif.fecha_envio)}
                      </small>
                    </div>

                    {!notif.leida && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => marcarComoLeida(notif.id_notif)}
                      >
                        Marcar como leída
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default Notificaciones;
