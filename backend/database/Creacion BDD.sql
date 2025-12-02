-- DROP TABLE IF EXISTS historial_visitas, seguridad_login, reportes, horarios, notificaciones, turnos, servicios, usuarios, zonas, roles;

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS planificanet;
USE planificanet;

-- Tabla de roles
CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de zonas
CREATE TABLE zonas (
    id_zona INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE barrios (
    id_barrio  INT AUTO_INCREMENT PRIMARY KEY,
    nombre  VARCHAR(150) NOT NULL,
    id_zona        INT NOT NULL,
    CONSTRAINT fk_barrio_zona FOREIGN KEY (id_zona)
        REFERENCES zonas(id_zona)
);
-- Tabla de usuarios
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    password VARCHAR(255) NOT NULL,
   id_rol INT NOT NULL,
   direccion VARCHAR(50),
    id_zona INT,
    id_barrio int, 
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
    FOREIGN KEY (id_zona) REFERENCES zonas(id_zona),
    FOREIGN KEY (id_barrio) REFERENCES barrios(id_barrio)
);

-- Tabla de servicios
CREATE TABLE servicios (
    id_servicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

-- Tabla de turnos
CREATE TABLE turnos (
    id_turno INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    franja_horaria ENUM('mañana','tarde','noche') NOT NULL,
    estado ENUM('pendiente','confirmado','cancelado') DEFAULT 'pendiente',
    cliente_id INT NOT NULL,
    tecnico_id INT,
    servicio_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion TEXT,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (servicio_id) REFERENCES servicios(id_servicio)
);

-- Tabla de notificaciones
CREATE TABLE notificaciones (
    id_notif INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE historial_visitas (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    turno_id INT NOT NULL,
    tecnico_id INT NOT NULL,
    cliente_id INT NOT NULL,
    estado_final ENUM('completado','cancelado','reprogramado') NOT NULL,
    duracion_minutos INT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (turno_id) REFERENCES turnos(id_turno),
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id_usuario)
);

CREATE TABLE seguridad_login (
    id_seg INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    intentos INT DEFAULT 0,
    ultimo_intento TIMESTAMP,
    token_recuperacion VARCHAR(255),
    token_expira TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id_usuario)
);


CREATE TABLE reportes (
    id_reporte INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    zona_id INT,
    barrio_id int,
    cantidad_turnos INT,
    promedio_duracion DECIMAL(5,2),
    cancelaciones INT,
    reprogramaciones INT,
    FOREIGN KEY (zona_id) REFERENCES zonas(id_zona),
    FOREIGN KEY (barrio_id) REFERENCES barrios(id_barrio)
);



-- ============================
-- Datos iniciales de prueba
-- ============================

-- Roles
INSERT INTO roles (nombre) VALUES ('cliente'), ('tecnico'), ('admin');

-- Zonas
INSERT INTO zonas (nombre) VALUES
('Zona Norte'),
('Zona Centro'),
('Zona Oeste'),
('Zona Sur');

-- Barrios
INSERT INTO barrios (nombre, id_zona) VALUES
('Belgrano', 1),
('Núñez', 1),
('Saavedra', 1),
('Colegiales', 1),
('Palermo', 1),
('Villa Urquiza', 1),
('Villa Pueyrredón', 1),
('Retiro', 1),
('Recoleta', 1),
('Coghlan', 1),
('Villa Ortúzar', 1),
('Chacarita', 1),
('Villa Crespo', 1)
;
INSERT INTO barrios (nombre, id_zona) VALUES
('Balvanera', 2),
('San Nicolás', 2),
('Monserrat', 2),
('San Telmo', 2),
('Constitución', 2),
('Almagro', 2),
('Boedo', 2),
('Caballito', 2),
('San Cristóbal', 2),
('Parque Chacabuco', 2),
('La Paternal', 2),
('Agronomía', 2);


INSERT INTO barrios (nombre, id_zona) VALUES
('Flores', 3),
('Floresta', 3),
('Villa Luro', 3),
('Vélez Sársfield', 3),
('Villa Real', 3),
('Monte Castro', 3),
('Villa del Parque', 3),
('Villa Devoto', 3),
('Villa Santa Rita', 3),
('Versalles', 3),
('Villa General Mitre', 3),
('Parque Chas', 3);

INSERT INTO barrios (nombre, id_zona) VALUES
('La Boca', 4),
('Barracas', 4),
('Parque Patricios', 4),
('Nueva Pompeya', 4),
('Villa Soldati', 4),
('Villa Lugano', 4),
('Villa Riachuelo', 4),
('Puerto Madero', 4),
('Parque Avellaneda', 4);


-- Usuarios 
INSERT INTO usuarios (nombre, email, telefono, password, id_rol, direccion, id_zona, id_barrio)
VALUES
('Laura Perez', 'cliente@planificanet.com', '+54 11 1234-5678',
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 1, 'Av. Santa Fe 1234', 1, 1),  
 
('Carlos Gomez', 'cliente2@planificanet.com', '+54 11 1234-5678',
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 1, 'Av. Rivadavia 1234', 2, 2),   
 
('Juan Rodriguez', 'tecnico@planificanet.com', '+54 11 8765-4321',
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 2, 'Av. Libertador 456', 1, 5),   

('Admin General', 'admin@planificanet.com', NULL,
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 3, 'Oficina Central', 2, 3);    

-- Servicios
INSERT INTO servicios (nombre, descripcion)
VALUES 
('Instalación Internet', 'Instalación de servicio de internet en domicilio'),
('Soporte Técnico', 'Visita técnica para resolver problemas de conexión'),
('Mantenimiento', 'Chequeo preventivo de equipos y redes');

-- Turnos
INSERT INTO turnos (fecha, franja_horaria, estado, cliente_id, tecnico_id, servicio_id,descripcion)
VALUES 
('2025-11-22', 'mañana', 'pendiente', 1, 3, 1, 'Instalación en domicilio particular' ),
('2025-11-23', 'tarde', 'confirmado', 2, 3, 2,'Soporte técnico por problemas de conexión intermitente');


-- Notificaciones
INSERT INTO notificaciones (id_usuario, mensaje,fecha_envio,leida)
VALUES 
(1, 'Su turno ha sido confirmado para el 12/12 en la mañana',NOW(),0),
(1, 'Su turno ha sido reprogramado para el 20/12 en la mañana',NOW(),  0),
(1, 'Se ha asignado un técnico a tu turno',NOW(), 0),
(1, 'Tu turno del 20 de noviembre fue completado', NOW(), 0),
(2, 'Su turno fue reprogramado',NOW(), 0),
(2, 'Tienes un nuevo turno asignado para el 6 de diciembre',NOW(), 0),
(2, 'El tgecnico ha marcado el turno como completado', NOW(), 0),
(3, 'Se han creado 5 nuevos turnos hoy', NOW(), 0);


-- Historial de visitas
INSERT INTO historial_visitas (turno_id, tecnico_id, cliente_id, estado_final, duracion_minutos)
VALUES 
(1, 3, 1, 'completado', 45),
(2, 3, 2, 'cancelado', NULL);

-- Seguridad login
INSERT INTO seguridad_login (usuario_id, intentos, ultimo_intento, token_recuperacion, token_expira)
VALUES 
(1, 2, NOW(), 'abc123token', DATE_ADD(NOW(), INTERVAL 1 DAY)),
(2, 0, NOW(), NULL, NULL);

-- Reportes
INSERT INTO reportes (fecha, zona_id, barrio_id, cantidad_turnos, promedio_duracion, cancelaciones, reprogramaciones)
VALUES 
('2025-11-28', 1, 1, 10, 40.5, 2, 1),  
('2025-11-29', 2, 13, 8, 35.0, 1, 0);  
