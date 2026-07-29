import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, UserPlus } from 'lucide-react';

const API_URL = '/api/clientes';

const ClienteModal = ({ isOpen, onClose, onGuardado, clienteAEditar }) => {
    const defaultForm = {
        tipo_identificacion: 'CEDULA',
        identificacion: '',
        nombre: '',
        direccion: '',
        telefono: '',
        correo: ''
    };

    const [formData, setFormData] = useState(defaultForm);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (clienteAEditar) {
            setFormData({
                tipo_identificacion: clienteAEditar.tipo_identificacion || 'CEDULA',
                identificacion: clienteAEditar.identificacion || '',
                nombre: clienteAEditar.nombre || '',
                direccion: clienteAEditar.direccion || '',
                telefono: clienteAEditar.telefono || '',
                correo: clienteAEditar.correo || ''
            });
        } else {
            setFormData(defaultForm);
        }
        setError(null);
    }, [clienteAEditar, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCargando(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                identificacion: formData.identificacion.trim(),
                nombre: formData.nombre.trim(),
                direccion: formData.direccion.trim() || null,
                telefono: formData.telefono.trim() || null,
                correo: formData.correo.trim() || null
            };

            if (clienteAEditar) {
                await axios.put(`${API_URL}/${clienteAEditar.id}`, payload);
            } else {
                await axios.post(API_URL, payload);
            }
            onGuardado();
        } catch (err) {
            setError(err.response?.data?.error || 'Error al guardar el cliente');
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
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                            <UserPlus size={18} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-slate-800">
                                {clienteAEditar ? 'Editar Cliente' : 'Nuevo Cliente'}
                            </h2>
                            <p className="text-[11px] md:text-xs text-slate-400">
                                {clienteAEditar ? 'Modifica los datos del cliente' : 'Registra un nuevo cliente'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-500 hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
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
                                Nombre / Razón Social *
                            </label>
                            <input
                                type="text"
                                name="nombre"
                                required
                                value={formData.nombre}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none uppercase transition-all placeholder:text-slate-300"
                                placeholder="Ej: JUAN PÉREZ"
                            />
                        </div>

                        {/* Tipo Identificación e Identificación */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Tipo ID *
                                </label>
                                <select
                                    name="tipo_identificacion"
                                    value={formData.tipo_identificacion}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none bg-white transition-all"
                                >
                                    <option value="CEDULA">Cédula</option>
                                    <option value="RUC">RUC</option>
                                    <option value="PASAPORTE">Pasaporte</option>
                                    <option value="OTRO">Otro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Identificación *
                                </label>
                                <input
                                    type="text"
                                    name="identificacion"
                                    required
                                    value={formData.identificacion}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="Ej: 0102030405"
                                />
                            </div>
                        </div>

                        {/* Dirección */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                Dirección <span className="normal-case font-normal text-slate-400">(Opcional)</span>
                            </label>
                            <input
                                type="text"
                                name="direccion"
                                value={formData.direccion}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all placeholder:text-slate-300"
                                placeholder="Calle, número, ciudad"
                            />
                        </div>

                        {/* Teléfono y Correo */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Teléfono <span className="normal-case font-normal text-slate-400">(Opcional)</span>
                                </label>
                                <input
                                    type="tel"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="0991234567"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                    Correo <span className="normal-case font-normal text-slate-400">(Opcional)</span>
                                </label>
                                <input
                                    type="email"
                                    name="correo"
                                    value={formData.correo}
                                    onChange={handleChange}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50/50 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all placeholder:text-slate-300"
                                    placeholder="correo@ejemplo.com"
                                />
                            </div>
                        </div>
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
                            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-200 disabled:opacity-50 disabled:shadow-none active:scale-[0.97] text-center"
                        >
                            {cargando ? 'Guardando...' : 'Guardar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClienteModal;
