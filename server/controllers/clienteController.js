const Cliente = require('../models/Cliente');

// GET /api/clientes
// Soporta: ?q=texto&pagina=1&limite=25
exports.getAllClientes = async (req, res) => {
    try {
        const { q, pagina, limite } = req.query;
        const resultado = await Cliente.getAll({
            busqueda: q,
            pagina,
            limite
        });
        res.json(resultado);
    } catch (err) {
        console.error('Error obteniendo clientes:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener clientes' });
    }
};

// GET /api/clientes/buscar/:identificacion
exports.buscarPorIdentificacion = async (req, res) => {
    try {
        const cliente = await Cliente.buscarPorIdentificacion(req.params.identificacion);
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado con esa identificación' });
        }
        res.json(cliente);
    } catch (err) {
        console.error('Error buscando cliente por identificación:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// GET /api/clientes/:id
exports.getClienteById = async (req, res) => {
    try {
        const cliente = await Cliente.getById(req.params.id);
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(cliente);
    } catch (err) {
        console.error('Error obteniendo cliente:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// POST /api/clientes
exports.createCliente = async (req, res) => {
    try {
        const { identificacion, nombre } = req.body;
        if (!identificacion || !nombre) {
            return res.status(400).json({ error: 'Identificación y nombre son obligatorios' });
        }

        const tiposValidos = ['CEDULA', 'RUC', 'PASAPORTE', 'OTRO'];
        if (req.body.tipo_identificacion && !tiposValidos.includes(req.body.tipo_identificacion)) {
            return res.status(400).json({ error: 'Tipo de identificación inválido' });
        }

        const nuevoCliente = await Cliente.create(req.body);
        res.status(201).json(nuevoCliente);
    } catch (err) {
        console.error('Error creando cliente:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un cliente con esa identificación' });
        }
        res.status(500).json({ error: 'Error interno al crear el cliente' });
    }
};

// PUT /api/clientes/:id
exports.updateCliente = async (req, res) => {
    try {
        const { identificacion, nombre } = req.body;
        if (!identificacion || !nombre) {
            return res.status(400).json({ error: 'Identificación y nombre son obligatorios' });
        }

        const tiposValidos = ['CEDULA', 'RUC', 'PASAPORTE', 'OTRO'];
        if (req.body.tipo_identificacion && !tiposValidos.includes(req.body.tipo_identificacion)) {
            return res.status(400).json({ error: 'Tipo de identificación inválido' });
        }

        const clienteActualizado = await Cliente.update(req.params.id, req.body);
        if (!clienteActualizado) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(clienteActualizado);
    } catch (err) {
        console.error('Error actualizando cliente:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Ya existe otro cliente con esa identificación' });
        }
        res.status(500).json({ error: 'Error interno al actualizar el cliente' });
    }
};

// DELETE /api/clientes/:id
exports.deleteCliente = async (req, res) => {
    try {
        // Proteger al cliente por defecto (CONSUMIDOR FINAL)
        if (parseInt(req.params.id, 10) === 1) {
            return res.status(403).json({ error: 'No se puede eliminar al cliente por defecto (CONSUMIDOR FINAL)' });
        }

        const resultado = await Cliente.delete(req.params.id);
        if (!resultado) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json({ message: 'Cliente eliminado correctamente' });
    } catch (err) {
        console.error('Error eliminando cliente:', err);
        // ON DELETE RESTRICT — tiene ventas asociadas
        if (err.code === '23503') {
            return res.status(409).json({ error: 'No se puede eliminar: el cliente tiene ventas registradas' });
        }
        res.status(500).json({ error: 'Error interno al eliminar el cliente' });
    }
};
