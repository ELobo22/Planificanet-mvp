import axios from "axios";

// ===============================
// CONFIGURACIÓN BASE DE AXIOS
// ===============================
const api = axios.create({
  baseURL: "/api" // React usará el proxy hacia http://localhost:3001
});

// ===============================
// INTERCEPTORES
// ===============================

// Agregar token a cada request si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Manejo de errores globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

// ===============================
// API: AUTENTICACIÓN
// ===============================
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData)
};

// ===============================
// API: TURNOS
// ===============================
export const turnsAPI = {
  getAll: () => api.get("/turns"),
  create: (turnData) => api.post("/turns", turnData),
  updateStatus: (id, status) =>
    api.put(`/turns/${id}/status`, { estado: status })
};

// ===============================
// API: UBICACIONES (ZONAS Y BARRIOS)
// ===============================
export const ubicacionesAPI = {
  getZonas: () => api.get("/zonas"),
  getBarrios: (id_zona) => api.get(`/barrios/${id_zona}`)
};

// ===============================
// EXPORTACIÓN GENERAL
// ===============================
export default api;
