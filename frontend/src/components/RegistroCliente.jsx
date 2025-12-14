import React, { useState, useEffect } from "react";
import { authAPI, ubicacionesAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";


const RegistroCliente = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    direccion: "",
    id_zona: "",
    id_barrio: "",
    id_rol: 1
  });

  const [zonas, setZonas] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    ubicacionesAPI.getZonas().then((res) => setZonas(res.data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "id_zona") {
      setFormData({ ...formData, id_zona: value, id_barrio: "" });
      ubicacionesAPI.getBarrios(value).then((res) => setBarrios(res.data));
      return;
    }

    setFormData({ ...formData, [name]: value });
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    await authAPI.register(formData);

    Swal.fire({
      title: "¡Registro exitoso!",
      text: "Tu cuenta fue creada correctamente.",
      icon: "success",
      confirmButtonText: "Ir al login",
      confirmButtonColor: "#0d6efd",
      background: "#ffffff",
      color: "#333",
      customClass: {
        popup: "rounded-4 shadow"
      }
    }).then(() => {
      navigate("/");
    });

  } catch (error) {
    Swal.fire({
      title: "Error",
      text: error.response?.data?.error || "Error de conexión",
      icon: "error",
      confirmButtonColor: "#d33"
    });
  } finally {
    setLoading(false);
  }
};



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
          maxWidth: "550px",
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
            Registro de Cliente
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Nombre */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Nombre completo</label>
            <input type="text" name="nombre" className="form-control" onChange={handleChange} required />
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Email</label>
            <input type="email" name="email" className="form-control" onChange={handleChange} required />
          </div>

          {/* Teléfono */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Teléfono</label>
            <input type="tel" name="telefono" className="form-control" onChange={handleChange} />
          </div>

          {/* Dirección */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Dirección</label>
            <input type="text" name="direccion" className="form-control" onChange={handleChange} />
          </div>

          {/* Contraseña */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Contraseña</label>
            <input type="password" name="password" className="form-control" onChange={handleChange} required />
          </div>

          {/* Zona */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Zona</label>
            <select name="id_zona" className="form-select" onChange={handleChange} required>
              <option value="">Seleccione una zona</option>
              {zonas.map((z) => (
                <option key={z.id_zona} value={z.id_zona}>{z.nombre}</option>
              ))}
            </select>
          </div>

          {/* Barrio */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Barrio</label>
            <select
              name="id_barrio"
              className="form-select"
              onChange={handleChange}
              required
              disabled={!formData.id_zona}
            >
              <option value="">Seleccione un barrio</option>
              {barrios.map((b) => (
                <option key={b.id_barrio} value={b.id_barrio}>{b.nombre}</option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <button type="submit" className="btn btn-success w-100" disabled={loading}>
            {loading ? "Cargando..." : "Registrarse"}
          </button>

          <button
            type="button"
            className="btn btn-secondary w-100 mt-2"
            onClick={() => navigate("/")}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistroCliente;
