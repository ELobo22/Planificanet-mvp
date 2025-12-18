import React, { useState, useEffect } from "react";
import { turnosAPI } from "../services/api";
import Swal from "sweetalert2";


const formatFecha = (fecha) => {
  return new Date(fecha).toLocaleDateString("es-ES");
};

const Turnos = ({ user }) => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTurnos();
  }, []);

  const loadTurnos = async () => {
    try {
      setLoading(true);
      const response = await turnosAPI.getAll();
      

      setTurnos(response.data);
    } catch (err) {
      setError("Error cargando turnos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const detalleHora = {
    mañana: "09:00 - 12:00",
    tarde: "13:00 - 17:00",
    noche: "18:00 - 21:00",
  };
const handleAccion = async (id_turno, nuevoEstado) => {
  try {
    await updateStatus(id_turno, nuevoEstado);

    if (nuevoEstado === "Confirmado") {
      Swal.fire({
        icon: "success",
        title: "Turno confirmado",
        text: "El turno fue confirmado correctamente.",
        timer: 2000,
        showConfirmButton: false
      });
    }

    if (nuevoEstado === "Cancelado") {
      Swal.fire({
        icon: "info",
        title: "Turno cancelado",
        text: "El turno fue cancelado correctamente.",
        timer: 2000,
        showConfirmButton: false
      });
    }

  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Ocurrió un error al actualizar el turno.",
    });
  }
};




  const updateStatus = async (id_turno, nuevoEstado) => {
    try {
      await turnosAPI.updateStatus(id_turno, nuevoEstado);
      loadTurnos();
    } catch (err) {
      setError("Error actualizando estado");
      console.error(err);
    }
  };

  const getEstadoClass = (estado) => {
    const classes = {
      pendiente: "bg-warning text-dark",
      confirmado: "bg-success text-white",
      cancelado: "bg-danger text-white",
    };
    return classes[estado.toLowerCase()] || "bg-secondary text-white";

  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }


  return (
    <div className="min-vh-100 bg-transparent">

      {/* Navbar unificada */}
      <nav className="navbar navbar-dark bg-primary shadow-sm">
        <div className="container">
          <span className="navbar-brand fw-bold">PlanificaNet</span>
          <a href="/dashboard" className="btn btn-outline-light btn-sm">
            Volver al Dashboard
          </a>
        </div>
      </nav>

      <div className="container mt-4">

        {/* Título */}
        <h2 className="page-title text-center mb-2">
          {user.rol === 3 && "📋 Todos los Turnos"}
          {user.rol === 2 && "🛠️ Mis Turnos Asignados"}
          {user.rol === 1 && "📅 Mis Turnos"}
        </h2>

        <p className="page-subtitle text-center mb-4">
          Gestión y seguimiento de turnos
        </p>

        {/* Error */}
        {error && (
          <div className="alert alert-danger text-center">{error}</div>
        )}

        {/* Contenedor principal */}
        <div className="card-container">

          {turnos.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No hay turnos para mostrar</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Franja Horaria</th>
                    <th>Servicio</th>
                    <th>Descripción</th>
                    {(user.rol === 3 || user.rol === 2) && <th>Cliente</th>}
                    {(user.rol === 3 || user.rol === 1) && <th>Técnico</th>}
                    <th>Estado</th>
                    {<th>Acciones</th>}
                  </tr>
                </thead>

                <tbody>
                  {turnos.map((turno) => (
                    <tr key={turno.id_turno}>
                      <td>{formatFecha(turno.fecha)}</td>

                      <td>
                        {turno.franja_horaria} (
                        {detalleHora[turno.franja_horaria]})
                      </td>

                      <td>
                        <span className="badge bg-secondary">
                          {turno.servicio_nombre}
                        </span>
                      </td>

                      <td>{turno.descripcion || "-"}</td>

                      {(user.rol === 3 || user.rol === 2) && (
                        <td>{turno.cliente_nombre}</td>
                      )}

                      {(user.rol === 3 || user.rol === 1) && (
                        <td>{turno.tecnico_nombre || "Por asignar"}</td>
                      )}

                      <td>
                        <span className={`badge ${getEstadoClass(turno.estado)}`}>
                          {turno.estado.charAt(0).toUpperCase() + turno.estado.slice(1).toLowerCase()}
                        </span>
                      </td>

                      <td className="d-flex flex-column gap-2">

                        {/* ✅ Cliente puede cancelar */}
                        {user.rol === 1 && turno.estado.toLowerCase() !== "cancelado" && (
                          <button
                            className="btn btn-sm d-flex align-items-center gap-1 text-danger"
                            style={{ background: "transparent", border: "none" }}
                            onClick={() => handleAccion(turno.id_turno, "Cancelado")}
                          >
                            ❌ <span>Cancelar</span>
                          </button>
                        )}

                        {/* ✅ Técnico/Admin pueden confirmar */}
                        {(user.rol === 2 || user.rol === 3) &&
                          turno.estado.toLowerCase() === "pendiente" && (
                            <button
                              className="btn btn-sm d-flex align-items-center gap-1 text-success"
                              style={{ background: "transparent", border: "none" }}
                              onClick={() => handleAccion(turno.id_turno, "Confirmado")}
                            >
                              ✅ <span>Confirmar</span>
                            </button>
                          )}

                        {/* ✅ Técnico/Admin pueden cancelar */}
                        {(user.rol === 2 || user.rol === 3) &&
                          turno.estado.toLowerCase() !== "cancelado" && (
                            <button
                              className="btn btn-sm d-flex align-items-center gap-1 text-danger"
                              style={{ background: "transparent", border: "none" }}
                              onClick={() => handleAccion(turno.id_turno, "Cancelado")}
                            >
                              ❌ <span>Cancelar</span>
                            </button>
                          )}

                      </td>


                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Turnos;
