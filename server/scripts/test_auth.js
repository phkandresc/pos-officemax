const axios = require('axios');

async function testAuth() {
    console.log('--- Iniciando Pruebas de Autenticación ---\n');
    let adminToken = '';
    let cajeroToken = '';

    // Prueba 1: Login Admin
    try {
        console.log('1. Intentando login como Administrador...');
        const res = await axios.post('http://127.0.0.1:3000/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        console.log('✅ Login exitoso. Usuario:', res.data.user.nombre);
        adminToken = res.data.token;
    } catch (e) {
        console.error('❌ Error Login Admin:', e.response?.data || e.message);
    }

    // Prueba 2: Login Cajero
    try {
        console.log('\n2. Intentando login como Cajero...');
        const res = await axios.post('http://127.0.0.1:3000/api/auth/login', {
            username: 'cajero',
            password: 'caja123'
        });
        console.log('✅ Login exitoso. Usuario:', res.data.user.nombre);
        cajeroToken = res.data.token;
    } catch (e) {
        console.error('❌ Error Login Cajero:', e.response?.data || e.message);
    }

    // Prueba 3: Login Fallido
    try {
        console.log('\n3. Intentando login con contraseña incorrecta...');
        await axios.post('http://127.0.0.1:3000/api/auth/login', {
            username: 'admin',
            password: 'badpassword'
        });
        console.log('❌ Error: El login fallido fue aceptado indebidamente.');
    } catch (e) {
        console.log('✅ Rechazado correctamente:', e.response?.data);
    }

    // Prueba 4: Acceder a ruta protegida sin token
    try {
        console.log('\n4. Intentando acceder a caja/activa sin token...');
        await axios.get('http://127.0.0.1:3000/api/caja/activa');
        console.log('❌ Error: Se permitió el acceso a caja/activa sin token.');
    } catch (e) {
        console.log('✅ Error de autorización esperado:', e.response?.data);
    }

    // Prueba 5: Acceder a ruta protegida con token de Cajero
    try {
        console.log('\n5. Intentando acceder a caja/activa con token válido...');
        const res = await axios.get('http://127.0.0.1:3000/api/caja/activa', {
            headers: { Authorization: `Bearer ${cajeroToken}` }
        });
        console.log('✅ Acceso permitido. Estado de caja:', res.data ? res.data.estado : 'No hay sesión abierta');
    } catch (e) {
        console.error('❌ Error en caja/activa con token:', e.response?.data || e.message);
    }

    console.log('\n--- Pruebas de Autenticación Finalizadas ---');
}

testAuth();
