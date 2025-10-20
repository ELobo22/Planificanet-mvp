-- Crear base de datos
CREATE DATABASE IF NOT EXISTS planificanet;
USE planificanet;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    tipo ENUM('cliente', 'tecnico', 'admin') NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de turnos
CREATE TABLE turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    tecnico_id INT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    servicio ENUM('instalacion', 'soporte') NOT NULL,
    descripcion TEXT,
    estado ENUM('pendiente', 'asignado', 'en_curso', 'completado') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id),
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
);

-- Datos de prueba
INSERT INTO usuarios (email, password, tipo, nombre, telefono) VALUES 
('admin@planificanet.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Administrador', '123456789'),
('tecnico@planificanet.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'tecnico', 'Juan Pérez', '123456780'),
('cliente@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'cliente', 'Carlos López', '123456781');

-- Contraseña para todos: "password"