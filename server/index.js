const express = require('express');
const cors = require('cors');
require('dotenv').config();

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const { scheduleBackups } = require('./scripts/backup');

const app = express();
const port = process.env.PORT || 3000;

// Seguridad básica
app.use(helmet());

// Límite de peticiones (100 peticiones por ventana de 15 minutos por IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: { error: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Configuración de CORS para la red local según contexto.md
app.use(cors({
    origin: '*', // En producción LAN podemos ser más específicos si las IPs son estáticas
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use((req, res, next) => {
    logger.info(`[HTTP] ${req.method} ${req.url}`);
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

// Manejo global de errores (Global Error Handler)
app.use((err, req, res, next) => {
    logger.error(`Error no manejado: ${err.message}`, { stack: err.stack, url: req.originalUrl });
    
    // Si la respuesta ya fue enviada, delegar al manejador por defecto de Express
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Error interno del servidor';
    
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message: process.env.NODE_ENV === 'production' && statusCode === 500 ? 'Algo salió mal' : message,
    });
});

const server = app.listen(port, () => {
    logger.info(`Servidor POS ejecutándose en http://localhost:${port}`);
    logger.info(`Accesible en la LAN para dispositivos móviles`);
    
    // Iniciar sistema de backups automáticos
    scheduleBackups();
});

server.on('connection', (stream) => {
    logger.debug('>>> Conexion TCP entrante desde ' + stream.remoteAddress);
});
