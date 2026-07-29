const Producto = require('../models/Producto');

// GET /api/productos
// Soporta: ?q=texto &tipo_item=FISICO &pagina=1 &limite=50
exports.getAllProductos = async (req, res) => {
    try {
        const { q, tipo_item, pagina, limite } = req.query;
        const resultado = await Producto.getAll({
            busqueda: q,
            tipo_item,
            pagina,
            limite
        });
        res.json(resultado);
    } catch (err) {
        console.error('Error obteniendo productos:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener el catálogo' });
    }
};

// GET /api/productos/bajo-stock
exports.getBajoStock = async (req, res) => {
    try {
        const productos = await Producto.getBajoStock();
        res.json(productos);
    } catch (err) {
        console.error('Error obteniendo productos bajo stock:', err);
        res.status(500).json({ error: 'Error interno al obtener productos bajo stock' });
    }
};

// GET /api/productos/inactivos
exports.getInactivos = async (req, res) => {
    try {
        const productos = await Producto.getInactivos();
        res.json(productos);
    } catch (err) {
        console.error('Error obteniendo productos inactivos:', err);
        res.status(500).json({ error: 'Error interno al obtener productos inactivos' });
    }
};

// GET /api/productos/:id
exports.getProductoById = async (req, res) => {
    try {
        const producto = await Producto.getById(req.params.id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (err) {
        console.error('Error obteniendo producto:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// POST /api/productos
exports.createProducto = async (req, res) => {
    try {
        // Validaciones básicas
        const { nombre, tipo_item, precio_venta } = req.body;
        if (!nombre || !tipo_item || precio_venta == null) {
            return res.status(400).json({ error: 'Nombre, tipo_item y precio_venta son obligatorios' });
        }

        const validTipos = ['FISICO', 'SERVICIO', 'RECARGA'];
        if (!validTipos.includes(tipo_item)) {
            return res.status(400).json({ error: 'tipo_item inválido. Debe ser FISICO, SERVICIO o RECARGA' });
        }

        const nuevoProducto = await Producto.create(req.body);
        res.status(201).json(nuevoProducto);
    } catch (err) {
        console.error('Error creando producto:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'El código de barras ya está registrado' });
        }
        res.status(500).json({ error: 'Error interno al crear el producto' });
    }
};

// PUT /api/productos/:id
exports.updateProducto = async (req, res) => {
    try {
        const productoActualizado = await Producto.update(req.params.id, req.body);
        if (!productoActualizado) {
            return res.status(404).json({ error: 'Producto no encontrado o inactivo' });
        }
        res.json(productoActualizado);
    } catch (err) {
        console.error('Error actualizando producto:', err);
        if (err.code === '23505') {
            return res.status(409).json({ error: 'El código de barras ya está asignado a otro producto' });
        }
        res.status(500).json({ error: 'Error interno al actualizar' });
    }
};

// DELETE /api/productos/:id
exports.deactivateProducto = async (req, res) => {
    try {
        const resultado = await Producto.deactivate(req.params.id);
        if (!resultado) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ message: 'Producto desactivado correctamente' });
    } catch (err) {
        console.error('Error desactivando producto:', err);
        res.status(500).json({ error: 'Error interno al borrar' });
    }
};

// PATCH /api/productos/:id/reactivar
exports.reactivarProducto = async (req, res) => {
    try {
        const producto = await Producto.reactivar(req.params.id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado o ya está activo' });
        }
        res.json({ message: 'Producto reactivado correctamente', producto });
    } catch (err) {
        console.error('Error reactivando producto:', err);
        res.status(500).json({ error: 'Error interno al reactivar' });
    }
};
