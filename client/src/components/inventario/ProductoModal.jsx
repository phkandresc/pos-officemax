import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Package } from 'lucide-react';

const API_URL = '/api/productos';

const ProductoModal = ({ isOpen, onClose, onGuardado, productoAEditar, codigoBarrasInicial = '' }) => {
    const defaultForm = {
        codigo_barras: '',
        nombre: '',
        tipo_item: 'FISICO',
        precio_compra: 0,
        precio_venta: 0,
        graba_iva: true,
        stock_minimo: 5,
        descripcion: ''
    };

    const [formData, setFormData] = useState(defaultForm);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (productoAEditar) {
            setFormData({
                codigo_barras: productoAEditar.codigo_barras || '',
                nombre: productoAEditar.nombre,
                tipo_item: productoAEditar.tipo_item,
                precio_compra: productoAEditar.precio_compra,
                precio_venta: productoAEditar.precio_venta,
                graba_iva: productoAEditar.graba_iva,
                stock_minimo: productoAEditar.stock_minimo ?? 5,
                descripcion: productoAEditar.descripcion || ''
            });
        } else {
            setFormData({ ...defaultForm, codigo_barras: codigoBarrasInicial || '' });
        }
        setError(null);
    }, [productoAEditar, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                codigo_barras: formData.codigo_barras.trim() === '' ? null : formData.codigo_barras.trim(),
                precio_compra: parseFloat(formData.precio_compra) || 0,
                precio_venta: parseFloat(formData.precio_venta) || 0,
                stock_minimo: parseInt(formData.stock_minimo, 10) || 5,
                descripcion: formData.descripcion.trim() || null
            };

            if (productoAEditar) {
                await axios.put(`${API_URL}/${productoAEditar.id}`, payload);
            } else {
                await axios.post(API_URL, payload);
            }
            onGuardado();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar el producto');
        } finally {
            setCargando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-end md:items-center z-50 animate-fade-in" onClick={onClose}>
            <div
                className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden animate-slide-up md:animate-scale-in max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-5 md:px-6 py-4 md:py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center shadow-sm">
                            <Package size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-slate-800">
                                {productoAEditar ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <p className="text-[11px] md:text-xs text-slate-400">
                                {productoAEditar ? 'Modifica los datos del ítem' : 'Registra un nuevo ítem al catálogo'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-500 hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form (scrollable) */}
                <form onSubmit={handleSubmit} className="p-5 md:p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 md:mb-5 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                Descripción / Nombre *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                required
                                value={formData.nombre}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none uppercase transition-all placeholder:text-slate-300"
                                placeholder="Ej: CAJA DE ESFEROS BIC"
                            />
                        </div>

                        {/* Código y Tipo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Código de Barras
                                </label>
                                <input
                                    type="text"
                                    name="codigo_barras"
                                    value={formData.codigo_barras}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none bg-slate-50/50 transition-all placeholder:text-slate-300"
                                    placeholder="Opcional"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Tipo de Ítem *
                                </label>
                                <select
                                    name="tipo_item"
                                    value={formData.tipo_item}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none bg-white transition-all"
                                >
                                    <option value="FISICO">Producto Físico</option>
                                    <option value="SERVICIO">Servicio (Copias/Impresiones)</option>
                                    <option value="RECARGA">Recargas Electrónicas</option>
                                </select>
                            </div>
                        </div>

                        {/* Precios */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    P. Venta ($) *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="precio_venta"
                                    required
                                    value={formData.precio_venta}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Costo ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="precio_compra"
                                    value={formData.precio_compra}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 bg-slate-50/50 focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Stock Mínimo — solo para FISICO */}
                        {formData.tipo_item === 'FISICO' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Stock Mínimo <span className="normal-case font-normal text-slate-400">(Alerta)</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    name="stock_minimo"
                                    value={formData.stock_minimo}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 bg-slate-50/50 focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none transition-all"
                                    placeholder="5"
                                />
                            </div>
                        )}

                        {/* Descripción / Notas internas */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                Notas internas <span className="normal-case font-normal text-slate-400">(Opcional)</span>
                            </label>
                            <input
                                type="text"
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none transition-all placeholder:text-slate-300"
                                placeholder="Proveedor, ubicación, etc."
                            />
                        </div>

                        {/* IVA */}
                        <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 cursor-pointer hover:bg-slate-100/70 active:bg-slate-100 transition-colors">
                            <input
                                type="checkbox"
                                name="graba_iva"
                                checked={formData.graba_iva}
                                onChange={handleChange}
                                className="w-4 h-4 text-brand-orange rounded border-slate-300 cursor-pointer accent-brand-orange"
                            />
                            <span className="text-sm font-medium text-slate-700">
                                Graba IVA (15%)
                            </span>
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors text-center"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={cargando}
                            className="w-full sm:w-auto bg-gradient-to-r from-brand-orange to-brand-red hover:from-brand-red hover:to-brand-red text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-brand-orange/20 disabled:opacity-50 disabled:shadow-none active:scale-[0.97] text-center"
                        >
                            {cargando ? 'Guardando...' : 'Guardar Producto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductoModal;
