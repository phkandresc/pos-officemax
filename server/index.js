const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS para la red local según contexto.md
app.use(cors({
    origin: '*', // En producción LAN podemos ser más específicos si las IPs son estáticas
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
});

const { pool } = require('./config/db');

// Rutas de Controladores
const productoRoutes = require('./routes/productoRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const cajaRoutes = require('./routes/cajaRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const printerRoutes = require('./routes/printerRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

// Ruta Módulo Productos e Inventarios
app.use('/api/productos', productoRoutes);
app.use('/api/inventario', inventarioRoutes);

// Ruta Módulo Caja y Ventas
app.use('/api/caja', cajaRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/printer', printerRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Ruta de prueba

app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        message: 'POS Papelería API working',
        timestamp: new Date()
    });
});

// Ruta de prueba de BD HTTP
app.get('/api/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ conectada: true, tiempoBD: result.rows[0].now });
    } catch (err) {
        res.status(500).json({ conectada: false, error: err.message });
    }
});

const server = app.listen(port, () => {
    console.log(`Servidor POS ejecutándose en http://localhost:${port}`);
    console.log(`Accesible en la LAN para dispositivos móviles`);
});

server.on('connection', (stream) => {
    console.log('>>> Conexion TCP entrante desde', stream.remoteAddress);
});
