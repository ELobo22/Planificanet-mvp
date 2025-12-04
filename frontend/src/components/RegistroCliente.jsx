import React, { useState, useEffect } from "react";
import { authAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

const RegistroCliente = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    direccion: "",
    id_zona: "",
    id_barrio: ""
  });

  const [zonas, setZonas] = useState([]);
  const [barrios, setBarrios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // cargar zonas desde backend
    fetch("http://localhost:3001/api/zonas")
      .then((res) => res.json())
      .then((data) => setZonas(data))
      .catch((err) => console.error("Error cargando zonas:", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "id_zona") {
      // cargar barrios según zona
      fetch(`http://localhost:3001/api/barrios/${e.target.value}`)
        .then((res) => res.json())
        .then((data) => setBarrios(data))
        .catch((err) => console.error("Error cargando barrios:", err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authAPI.register(formData);
      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      navigate("/"); // redirige al login
    } catch (error) {
      setError(error.response?.data?.error || "Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow p-4" style={{ maxWidth: "500px", width: "100%" }}>
        <h2 className="text-center text-primary mb-3">Registro de Cliente</h2>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Nombre completo</label>
            <input type="text" name="nombre" className="form-control" onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-control" onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Teléfono</label>
            <input type="tel" name="telefono" className="form-control" onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label className="form-label">Dirección</label>
            <input type="text" name="direccion" className="form-control" onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label className="form-label">Contraseña</label>
            <input type="password" name="password" className="form-control" onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Zona</label>
            <select name="id_zona" className="form-select" onChange={handleChange} required>
              <option value="">Seleccione una zona</option>
              {zonas.map((z) => (
                <option key={z.id_zona} value={z.id_zona}>
                  {z.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Barrio</label>
            <select name="id_barrio" className="form-select" onChange={handleChange} required>
              <option value="">Seleccione un barrio</option>
              {barrios.map((b) => (
                <option key={b.id_barrio} value={b.id_barrio}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-success w-100" disabled={loading}>
            {loading ? "Cargando..." : "Registrarse"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistroCliente;
