require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../config/db').pool;
const bcrypt = require('bcrypt');

async function fix() {
    try {
        console.log('Generando y actualizando hashes para admin y cajero...');
        const hashAdmin = await bcrypt.hash('admin123', 10);
        await pool.query("UPDATE usuarios SET password_hash = $1 WHERE usuario = 'admin'", [hashAdmin]);
        
        const hashCaja = await bcrypt.hash('caja123', 10);
        await pool.query("UPDATE usuarios SET password_hash = $1 WHERE usuario = 'cajero'", [hashCaja]);
        
        console.log('✅ Hashes actualizados con éxito en la base de datos.');
    } catch (e) {
        console.error('❌ Error actualizando la base de datos:', e.message);
    } finally {
        await pool.end();
    }
}

fix();
