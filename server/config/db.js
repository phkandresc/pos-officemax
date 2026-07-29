const { Pool } = require('pg');
require('dotenv').config();

// Configuración del Pool de conexiones según el contexto (PostgreSQL 18.1)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Configuraciones recomendadas para evitar problemas de timeouts en conexiones LAN/locales
    max: 10, // Optimizado para PC de bajos recursos
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Evento listener opcional para detectar problemas ocultos en el pool
pool.on('error', (err, client) => {
    console.error('Error inesperado de cliente idle en el pool de PG', err);
    process.exit(-1);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
