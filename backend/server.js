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

// Conexión a la base de datos
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
            { id: user.id, email: user.email, tipo: user.tipo },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                tipo: user.tipo
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, nombre, tipo, telefono } = req.body;

        const [existingUsers] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO usuarios (email, password, nombre, tipo, telefono) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, nombre, tipo, telefono]
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
app.get('/api/turns', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userType = req.user.tipo;

        let query = '';
        let params = [];

        if (userType === 'admin') {
            query = `
                SELECT t.*, c.nombre as cliente_nombre, tec.nombre as tecnico_nombre
                FROM turnos t
                LEFT JOIN usuarios c ON t.cliente_id = c.id
                LEFT JOIN usuarios tec ON t.tecnico_id = tec.id
                ORDER BY t.fecha DESC, t.hora DESC
            `;
        } else if (userType === 'tecnico') {
            query = `
                SELECT t.*, c.nombre as cliente_nombre, c.telefono
                FROM turnos t
                LEFT JOIN usuarios c ON t.cliente_id = c.id
                WHERE t.tecnico_id = ?
                ORDER BY t.fecha ASC, t.hora ASC
            `;
            params = [userId];
        } else {
            query = `
                SELECT t.*, u.nombre as tecnico_nombre
                FROM turnos t
                LEFT JOIN usuarios u ON t.tecnico_id = u.id
                WHERE t.cliente_id = ?
                ORDER BY t.fecha DESC, t.hora DESC
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

app.post('/api/turns', authMiddleware, async (req, res) => {
    try {
        if (req.user.tipo !== 'cliente') {
            return res.status(403).json({ error: 'Solo clientes pueden crear turnos' });
        }

        const { fecha, hora, servicio, descripcion } = req.body;
        const clienteId = req.user.id;

        const [tecnicos] = await db.execute("SELECT id FROM usuarios WHERE tipo = 'tecnico' LIMIT 1");
        if (tecnicos.length === 0) {
            return res.status(400).json({ error: 'No hay técnicos disponibles' });
        }

        const tecnicoId = tecnicos[0].id;
        const [result] = await db.execute(
            'INSERT INTO turnos (cliente_id, tecnico_id, fecha, hora, servicio, descripcion, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [clienteId, tecnicoId, fecha, hora, servicio, descripcion, 'asignado']
        );

        res.status(201).json({
            message: 'Turno creado exitosamente',
            turnoId: result.insertId
        });

    } catch (error) {
        console.error('Error creando turno:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.put('/api/turns/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const userId = req.user.id;
        const userType = req.user.tipo;

        if (userType !== 'tecnico' && userType !== 'admin') {
            return res.status(403).json({ error: 'No tienes permiso para actualizar estados' });
        }

        if (userType === 'tecnico') {
            const [turnos] = await db.execute('SELECT tecnico_id FROM turnos WHERE id = ?', [id]);
            if (turnos.length === 0 || turnos[0].tecnico_id !== userId) {
                return res.status(403).json({ error: 'No tienes permiso para modificar este turno' });
            }
        }

        await db.execute('UPDATE turnos SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ message: 'Estado actualizado exitosamente' });

    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Health check
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