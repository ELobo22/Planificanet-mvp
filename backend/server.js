import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =======================
// Conexión a la base de datos
// =======================
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// =======================
// MIDDLEWARE DE AUTH
// =======================
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// =======================
// RUTAS DE AUTENTICACIÓN
// =======================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id_usuario, email: user.email, rol: user.id_rol },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id_usuario,
                email: user.email,
                nombre: user.nombre,
                rol: user.id_rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, nombre, telefono, direccion, id_zona, id_barrio } = req.body;

        const [existingUsers] = await db.execute('SELECT id_usuario FROM usuarios WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO usuarios (email, password, nombre, telefono, direccion, id_rol, id_zona, id_barrio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, nombre, telefono, direccion, 1, id_zona, id_barrio] // id_rol=1 → cliente
        );

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});


// =======================
// RUTAS DE TURNOS
// =======================


// Obtener turnos según rol
app.get('/api/turns', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRol = req.user.rol;

    let query = '';
    let params = [];

    if (userRol === 3) { // admin
      query = `
        SELECT t.id_turno, t.fecha, t.franja_horaria, t.estado,
               t.descripcion,
               c.nombre AS cliente_nombre,
               tec.nombre AS tecnico_nombre,
               s.nombre AS servicio_nombre
        FROM turnos t
        JOIN servicios s ON t.servicio_id = s.id_servicio
        LEFT JOIN usuarios c ON t.cliente_id = c.id_usuario
        LEFT JOIN usuarios tec ON t.tecnico_id = tec.id_usuario
        ORDER BY t.fecha DESC, t.franja_horaria DESC
      `;
    } else if (userRol === 2) { // técnico
      query = `
        SELECT t.id_turno, t.fecha, t.franja_horaria, t.estado,
               t.descripcion,
               c.nombre AS cliente_nombre,
               c.telefono,
               s.nombre AS servicio_nombre
        FROM turnos t
        JOIN servicios s ON t.servicio_id = s.id_servicio
        LEFT JOIN usuarios c ON t.cliente_id = c.id_usuario
        WHERE t.tecnico_id = ?
        ORDER BY t.fecha ASC, t.franja_horaria ASC
      `;
      params = [userId];
    } else { // cliente
      query = `
        SELECT t.id_turno, t.fecha, t.franja_horaria, t.estado,
               t.descripcion,
               u.nombre AS tecnico_nombre,
               s.nombre AS servicio_nombre
        FROM turnos t
        JOIN servicios s ON t.servicio_id = s.id_servicio
        LEFT JOIN usuarios u ON t.tecnico_id = u.id_usuario
        WHERE t.cliente_id = ?
        ORDER BY t.fecha DESC, t.franja_horaria DESC
      `;
      params = [userId];
    }

    const [turns] = await db.execute(query, params);
    res.json(turns);

  } catch (error) {
    console.error('Error obteniendo turnos:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});


// Crear turno (solo clientes)
app.post('/api/turns', authMiddleware, async (req, res) => {
  try {
    if (req.user.rol !== 1) {
      return res.status(403).json({ error: 'Solo clientes pueden crear turnos' });
    }

    const { fecha, franja_horaria, servicio_id, descripcion } = req.body;
    const clienteId = req.user.id;

    const franjasValidas = ['mañana', 'tarde', 'noche'];
    if (!franjasValidas.includes(franja_horaria)) {
      return res.status(400).json({ error: 'Franja horaria inválida' });
    }

    const [servicioRows] = await db.execute(
      'SELECT nombre FROM servicios WHERE id_servicio = ?',
      [servicio_id]
    );
    if (servicioRows.length === 0) {
      return res.status(400).json({ error: 'Servicio no válido' });
    }

    const [tecnicos] = await db.execute(
      "SELECT id_usuario FROM usuarios WHERE id_rol = 2 LIMIT 1"
    );
    if (tecnicos.length === 0) {
      return res.status(400).json({ error: 'No hay técnicos disponibles' });
    }
    const tecnicoId = tecnicos[0].id_usuario;

    // Insertar turno con descripción
    const [result] = await db.execute(
      'INSERT INTO turnos (cliente_id, tecnico_id, fecha, franja_horaria, servicio_id, estado, descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [clienteId, tecnicoId, fecha, franja_horaria, servicio_id, 'pendiente', descripcion]
    );

    res.status(201).json({
      message: 'Turno creado exitosamente',
      turnoId: result.insertId,
      servicio_nombre: servicioRows[0].nombre,
      franja_horaria,
      descripcion
    });

  } catch (error) {
    console.error('Error creando turno:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Actualizar estado de turno
app.put('/api/turns/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const userId = req.user.id;
    const userRol = req.user.rol;

    if (userRol !== 2 && userRol !== 3) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar estados' });
    }

    const estadosValidos = ['pendiente', 'confirmado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const [turnos] = await db.execute(
      'SELECT cliente_id, tecnico_id, fecha, franja_horaria, servicio_id , descripcion FROM turnos WHERE id_turno = ?',
      [id]
    );
    if (turnos.length === 0) return res.status(404).json({ error: 'Turno no encontrado' });

    const turno = turnos[0];

    if (userRol === 2 && turno.tecnico_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este turno' });
    }

    await db.execute('UPDATE turnos SET estado = ? WHERE id_turno = ?', [estado, id]);

    const [servicioRows] = await db.execute(
      'SELECT nombre FROM servicios WHERE id_servicio = ?',
      [turno.servicio_id]
    );
    const servicioNombre = servicioRows.length ? servicioRows[0].nombre : 'Servicio';

    // Notificación para cliente
    let mensajeCliente = '';
    if (estado === 'confirmado') {
      mensajeCliente = `Su turno de ${servicioNombre} el ${turno.fecha} (${turno.franja_horaria}) ha sido confirmado.`;
    } else if (estado === 'cancelado') {
      mensajeCliente = `Su turno de ${servicioNombre} el ${turno.fecha} (${turno.franja_horaria}) ha sido cancelado.`;
    }

    if (mensajeCliente) {
      await db.execute(
        'INSERT INTO notificaciones (id_usuario, mensaje) VALUES (?, ?)',
        [turno.cliente_id, mensajeCliente]
      );
    }

    // Notificación para técnico (si existe técnico asignado)
    if (turno.tecnico_id) {
      let mensajeTecnico = '';
      if (estado === 'confirmado') {
        mensajeTecnico = `Has confirmado el turno de ${servicioNombre} el ${turno.fecha} (${turno.franja_horaria}).`;
      } else if (estado === 'cancelado') {
        mensajeTecnico = `Has cancelado el turno de ${servicioNombre} el ${turno.fecha} (${turno.franja_horaria}).`;
      }

      if (mensajeTecnico) {
        await db.execute(
          'INSERT INTO notificaciones (id_usuario, mensaje) VALUES (?, ?)',
          [turno.tecnico_id, mensajeTecnico]
        );
      }
    }

    res.json({ message: 'Estado actualizado y notificaciones creadas' });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});



// =======================
// RUTAS DE NOTIFICACIONES
// =======================

// Listar notificaciones del usuario autenticado
app.get('/api/notificaciones', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await db.execute(
      `SELECT id_notif, mensaje, fecha_envio,leida
       FROM notificaciones
       WHERE id_usuario = ?
       ORDER BY fecha_envio DESC`,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Marcar notificación como leída 
app.put('/api/notificaciones/:id/leida', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rows] = await db.execute(
      'SELECT id_usuario FROM notificaciones WHERE id_notif = ?', [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notificación no encontrada' });
    }

    if (rows[0].id_usuario !== userId) {
      return res.status(403).json({ success: false, error: 'No tienes permiso para esta notificación' });
    }

    const [result] = await db.execute(
      'UPDATE notificaciones SET leida = 1 WHERE id_notif = ?',
      [id]
    );

    if (result.affectedRows === 1) {
      return res.json({ success: true });
    }

    return res.status(500).json({ success: false, error: 'No se pudo actualizar la notificación' });
  } catch (error) {
    console.error('Error actualizando notificación:', error);
    res.status(500).json({ success: false, error: 'Error del servidor' });
  }
});


// =======================
// Health check
// =======================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'PlanificaNet MVP funcionando',
        timestamp: new Date().toISOString()
    });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('🚀 PlanificaNet MVP Backend en puerto', PORT);
    });