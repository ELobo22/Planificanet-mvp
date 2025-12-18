import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { usuariosAPI } from "../services/api";
import { Link } from "react-router-dom";

const PerfilUsuario = ({ user, onLogout }) => {
  const [datos, setDatos] = useState({
    nombre: "",
    email: "",
    telefono: "",
    direccion: ""
  });

  const [passwords, setPasswords] = useState({
    actual: "",
    nueva: "",
    repetir: ""
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const response = await usuariosAPI.getById(user.id);
      setDatos(response.data);
    } catch (err) {
      Swal.fire("Error", "No se pudieron cargar tus datos", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setDatos({ ...datos, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const guardarCambios = async () => {
    try {
      await usuariosAPI.update(user.id, datos);

      Swal.fire({
        icon: "success",
        title: "Datos actualizados",
        text: "Tus datos personales fueron guardados correctamente",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire("Error", "No se pudieron guardar los cambios", "error");
    }
  };

  const cambiarClave = async () => {
    if (passwords.nueva !== passwords.repetir) {
      return Swal.fire("Error", "Las contraseñas no coinciden", "error");
    }

    try {
      await usuariosAPI.updatePassword(user.id, passwords);

      Swal.fire({
        icon: "success",
        title: "Contraseña actualizada",
        text: "Tu contraseña fue cambiada correctamente",
        timer: 2000,
        showConfirmButton: false
      });

      setPasswords({ actual: "", nueva: "", repetir: "" });

    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "No se pudo cambiar la contraseña", "error");
    }
  };

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="min-vh-100 bg-transparent">

      {/* NAVBAR  */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
        <div className="container">

          <span className="navbar-brand fw-bold">PlanificaNet</span>
          <a href="/dashboard" className="btn btn-outline-light btn-sm">
            Volver al Dashboard
          </a>
          
        </div>
      </nav>

      {/* CONTENIDO DEL PERFIL */}
      <div className="container perfil-container mt-4">

        <h2 className="page-title text-center mb-3">👤 Mi Perfil</h2>
        <p className="page-subtitle text-center mb-4">Gestiona tus datos personales</p>

        <div className="card p-4 shadow-sm">

          {/* DATOS PERSONALES */}
          <h4 className="mb-3">Datos personales</h4>

          <div className="form-group mb-3">
            <label>Nombre completo</label>
            <input
              type="text"
              name="nombre"
              className="form-control"
              value={datos.nombre}
              onChange={handleChange}
            />
          </div>

          <div className="form-group mb-3">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={datos.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group mb-3">
            <label>Teléfono</label>
            <input
              type="text"
              name="telefono"
              className="form-control"
              value={datos.telefono}
              onChange={handleChange}
            />
          </div>

          <div className="form-group mb-3">
            <label>Dirección</label>
            <input
              type="text"
              name="direccion"
              className="form-control"
              value={datos.direccion}
              onChange={handleChange}
            />
          </div>

          <button className="btn btn-primary w-100 mt-2" onClick={guardarCambios}>
            Guardar cambios
          </button>

          <hr className="my-4" />

          {/* CAMBIO DE CONTRASEÑA */}
          <h4 className="mb-3">Cambiar contraseña</h4>

          <div className="form-group mb-3">
            <label>Contraseña actual</label>
            <input
              type="password"
              name="actual"
              className="form-control"
              value={passwords.actual}
              onChange={handlePasswordChange}
            />
          </div>

          <div className="form-group mb-3">
            <label>Nueva contraseña</label>
            <input
              type="password"
              name="nueva"
              className="form-control"
              value={passwords.nueva}
              onChange={handlePasswordChange}
            />
          </div>

          <div className="form-group mb-3">
            <label>Repetir nueva contraseña</label>
            <input
              type="password"
              name="repetir"
              className="form-control"
              value={passwords.repetir}
              onChange={handlePasswordChange}
            />
          </div>

          <button className="btn btn-danger w-100" onClick={cambiarClave}>
            Cambiar contraseña
          </button>

        </div>
      </div>
    </div>
  );
};

export default PerfilUsuario;
