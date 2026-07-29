require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const pool = require('../config/db').pool;

async function update() {
    try {
        const h1 = await bcrypt.hash('admin123', 10);
        await pool.query('UPDATE usuarios SET password_hash = $1 WHERE usuario = $2', [h1, 'admin']);
        const h2 = await bcrypt.hash('caja123', 10);
        await pool.query('UPDATE usuarios SET password_hash = $1 WHERE usuario = $2', [h2, 'cajero']);
        console.log('Updated hashes in db via pool');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
update();
