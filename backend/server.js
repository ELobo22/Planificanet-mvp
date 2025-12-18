import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';


function formatearFecha(fecha) {
  const d = new Date(fecha);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const año = d.getFullYear();
  return `${dia}-${mes}-${año}`;
}



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
// RUTAS DE ZONAS Y BARRIOS
// =======================

// Obtener todas las zonas
app.get('/api/zonas', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id_zona, nombre FROM zonas ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo zonas:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener barrios por zona
app.get('/api/barrios/:id_zona', async (req, res) => {
  try {
    const { id_zona } = req.params;
    const [rows] = await db.execute(
      'SELECT id_barrio, nombre FROM barrios WHERE id_zona = ? ORDER BY nombre ASC',
      [id_zona]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo barrios:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});



// =======================
// RUTAS DE TURNOS
// =======================

// Obtener turnos según rol
app.get('/api/turnos', authMiddleware, async (req, res) => {
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
        ORDER BY t.fecha DESC, t.franja_horaria DESC
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
// ✅ Obtener el próximo turno del cliente o técnico
app.get('/api/turnos/proximo', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRol = req.user.rol;

    let query = "";
    let params = [];

    // ✅ Cliente → próximo turno del cliente
    if (userRol === 1) {
      query = `
        SELECT t.id_turno, t.fecha, t.franja_horaria, t.estado,
               t.descripcion, u.nombre AS tecnico_nombre, s.nombre AS servicio_nombre
        FROM turnos t
        JOIN servicios s ON t.servicio_id = s.id_servicio
        LEFT JOIN usuarios u ON t.tecnico_id = u.id_usuario
        WHERE t.cliente_id = ?
          AND t.fecha >= CURDATE()
          AND t.estado IN ('pendiente', 'confirmado')
        ORDER BY t.fecha ASC, FIELD(t.franja_horaria, 'mañana', 'tarde', 'noche')
        LIMIT 1
      `;
      params = [userId];
    }

    // ✅ Técnico → próximo turno asignado al técnico
    else if (userRol === 2) {
      query = `
        SELECT t.id_turno, t.fecha, t.franja_horaria, t.estado,
               t.descripcion, c.nombre AS cliente_nombre, s.nombre AS servicio_nombre
        FROM turnos t
        JOIN servicios s ON t.servicio_id = s.id_servicio
        LEFT JOIN usuarios c ON t.cliente_id = c.id_usuario
        WHERE t.tecnico_id = ?
          AND t.fecha >= CURDATE()
          AND t.estado IN ('pendiente', 'confirmado')
        ORDER BY t.fecha ASC, FIELD(t.franja_horaria, 'mañana', 'tarde', 'noche')
        LIMIT 1
      `;
      params = [userId];
    }

    // 
    else {
      return res.json(null);
    }

    const [rows] = await db.execute(query, params);
    return res.json(rows[0] || null);

  } catch (error) {
    console.error('Error obteniendo próximo turno:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});


// Crear turno
app.post('/api/turnos', authMiddleware, async (req, res) => {
  try {
    if (req.user.rol !== 1) {
      return res.status(403).json({ error: 'Solo clientes pueden crear turnos' });
    }

    const { fecha, franja_horaria, servicio_id, descripcion } = req.body;

    const clienteId = req.user.id;

    const franjasValidas = ['Mañana', 'Tarde', 'Noche'];
    if (!franjasValidas.includes(franja_horaria)) {
      return res.status(400).json({ error: 'Franja horaria inválida' });
    }

    // Obtener nombre del servicio
    const [servicioRows] = await db.execute(
      'SELECT nombre FROM servicios WHERE id_servicio = ?',
      [servicio_id]
    );
    if (servicioRows.length === 0) {
      return res.status(400).json({ error: 'Servicio no válido' });
    }

    // Seleccionar técnico disponible
   const [tecnicos] = await db.execute(
        ` SELECT u.id_usuario
        FROM usuarios u
        WHERE u.id_rol = 2
          AND u.id_usuario NOT IN (
            SELECT tecnico_id
            FROM turnos
            WHERE fecha = ?
              AND franja_horaria = ?
          )
        LIMIT 1
        `,
        [fecha, franja_horaria]
      );


      if (tecnicos.length === 0) {
        return res.status(400).json({
          error: "No hay técnicos disponibles. Por favor prueba otra fecha u otra Franja horaria"
        });
      }

    const tecnicoId = tecnicos[0].id_usuario;

    // Crear turno
    const [result] = await db.execute(
      'INSERT INTO turnos (cliente_id, tecnico_id, fecha, franja_horaria, servicio_id, descripcion, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [clienteId, tecnicoId, fecha, franja_horaria, servicio_id, descripcion, 'Pendiente']

    );

    const fechaFormateada = formatearFecha(fecha);

    // ✅ Notificación para el cliente
    await db.execute(
      'INSERT INTO notificaciones (id_usuario, mensaje, fecha_envio, leida) VALUES (?, ?, NOW(), 0)',
      [
        clienteId,
        `Tu turno de ${servicioRows[0].nombre} para el ${fechaFormateada} (${franja_horaria}) fue creado correctamente.`
      ]
    );

    // ✅ Notificación para el técnico
    await db.execute(
      'INSERT INTO notificaciones (id_usuario, mensaje, fecha_envio, leida) VALUES (?, ?, NOW(), 0)',
      [
        tecnicoId,
        `Se te asignó un nuevo turno de ${servicioRows[0].nombre} para el ${fechaFormateada} (${franja_horaria}).`
      ]
    );

    // Respuesta final
    res.status(201).json({
      message: 'Turno creado exitosamente',
      turnoId: result.insertId,
      servicio_nombre: servicioRows[0].nombre,
      franja_horaria
    });

  } catch (error) {
    console.error('Error creando turno:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});



// Actualizar estado del turno (confirmar, cancelar, etc.)
app.put('/api/turnos/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const userId = req.user.id;
    const userRol = req.user.rol;

    // Solo técnicos o admin pueden actualizar estados
    if (userRol !== 2 && userRol !== 3) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar estados' });
    }

    const estadosValidos = ['Pendiente', 'Confirmado', 'Cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // Obtener turno
    const [turnos] = await db.execute(
      'SELECT cliente_id, tecnico_id, fecha, franja_horaria, servicio_id, descripcion FROM turnos WHERE id_turno = ?',
      [id]
    );

    if (turnos.length === 0) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    const turno = turnos[0];

    // Si es técnico, solo puede modificar sus propios turnos
    if (userRol === 2 && turno.tecnico_id !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este turno' });
    }

    // Obtener nombre del usuario que realiza la acción
    const [usuarios] = await db.execute(
      'SELECT nombre FROM usuarios WHERE id_usuario = ?',
      [userId]
    );
    const usuarioAccion = usuarios[0]?.nombre || "Un usuario";

    //  Actualizar estado
    await db.execute('UPDATE turnos SET estado = ? WHERE id_turno = ?', [estado, id]);

    // Formatear fecha
    const fechaFormateada = formatearFecha(turno.fecha);

    //  Notificaciones según estado
    if (estado === 'Confirmado') {

      // Cliente
      await db.execute(
        'INSERT INTO notificaciones (id_usuario, mensaje, fecha_envio, leida) VALUES (?, ?, NOW(), 0)',
        [
          turno.cliente_id,
          `Tu turno del ${fechaFormateada} (${turno.franja_horaria}) fue confirmado.`
        ]
      );

      // Técnico
      await db.execute(
        'INSERT INTO notificaciones (id_usuario, mensaje, fecha_envio, leida) VALUES (?, ?, NOW(), 0)',
        [
          turno.tecnico_id,
          `${usuarioAccion} confirmó el turno del ${fechaFormateada} (${turno.franja_horaria}).`
        ]
      );

    } else if (estado === 'Cancelado') {

      // Cliente
      await db.execute(
        'INSERT INTO notificaciones (id_usuario, mensaje, fecha_envio, leida) VALUES (?, ?, NOW(), 0)',
        [
          turno.cliente_id,
          `Tu turno del ${fechaFormateada} (${turno.franja_horaria}) fue cancelado.`
        ]
      );

      // Técnico
      await db.execute(
        'INSERT INTO notificaciones (id_usuario, mensaje, fecha_envio, leida) VALUES (?, ?, NOW(), 0)',
        [
          turno.tecnico_id,
          `${usuarioAccion} canceló el turno del ${fechaFormateada} (${turno.franja_horaria}).`
        ]
      );
    }

    res.json({ message: 'Estado actualizado y notificaciones enviadas' });

  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// =======================
// RUTAS DE USUARIOS
// =======================
// Obtener datos del usuario
app.get('/api/usuarios/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Solo el usuario o el admin pueden ver estos datos
    if (req.user.id !== parseInt(id) && req.user.rol !== 3) {
      return res.status(403).json({ error: 'No tienes permiso para ver estos datos' });
    }

    const [rows] = await db.execute(
      'SELECT id_usuario, nombre, email, telefono, direccion FROM usuarios WHERE id_usuario = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});


// Actualizar datos personales
app.put('/api/usuarios/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, direccion } = req.body;

    // Solo el usuario o el admin pueden editar
    if (req.user.id !== parseInt(id) && req.user.rol !== 3) {
      return res.status(403).json({ error: 'No tienes permiso para editar estos datos' });
    }

    // VALIDACIÓN: evitar emails duplicados
    const [existe] = await db.execute(
  'SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario <> ?',
  [email, id]
    );

if (existe.length > 0) {
  return res.status(400).json({ error: 'El email ya está en uso' });
}
 // Actualizar datos
    await db.execute(
      `UPDATE usuarios 
       SET nombre = ?, email = ?, telefono = ?, direccion = ?
       WHERE id_usuario = ?`,
      [nombre, email, telefono, direccion, id]
    );

    res.json({ message: 'Datos actualizados correctamente' });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});


// Cambiar contraseña
app.put('/api/usuarios/:id/password', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { actual, nueva } = req.body;

    // Solo el usuario puede cambiar su propia contraseña
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ error: 'No puedes cambiar la contraseña de otro usuario' });
    }

    // Obtener contraseña actual
    const [rows] = await db.execute(
      'SELECT password FROM usuarios WHERE id_usuario = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const passwordHash = rows[0].password;

    // Validar contraseña actual
    const coincide = await bcrypt.compare(actual, passwordHash);
    if (!coincide) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    // Encriptar nueva contraseña
    const nuevaHash = await bcrypt.hash(nueva, 10);

    // Guardar nueva contraseña
    await db.execute(
      'UPDATE usuarios SET password = ? WHERE id_usuario = ?',
      [nuevaHash, id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
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
// RUTA DE SERVICIOS
// =======================
app.get('/api/servicios', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id_servicio AS id, nombre FROM servicios ORDER BY nombre ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo servicios:', error);
    res.status(500).json({ error: 'Error del servidor' });
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