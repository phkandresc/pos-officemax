import { useState, useEffect } from 'react';
import { X, UserRound, Shield, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const API_URL = '/api/usuarios';

function UsuarioModal({ isOpen, onClose, onGuardado, usuarioAEditar }) {
    const [formData, setFormData] = useState({
        nombre: '',
        usuario: '',
        password: '',
        rol: 'CAJERO',
        activo: true
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState('');
    const esEdicion = !!usuarioAEditar;

    useEffect(() => {
        if (isOpen) {
            if (esEdicion) {
                setFormData({
                    nombre: usuarioAEditar.nombre || '',
                    usuario: usuarioAEditar.usuario || '',
                    password: '', // En edición, la clave se deja en blanco para no cambiarla
                    rol: usuarioAEditar.rol || 'CAJERO',
                    activo: usuarioAEditar.activo !== undefined ? usuarioAEditar.activo : true
                });
            } else {
                setFormData({
                    nombre: '',
                    usuario: '',
                    password: '',
                    rol: 'CAJERO',
                    activo: true
                });
            }
            setError('');
            setShowPassword(false);
        }
    }, [isOpen, usuarioAEditar, esEdicion]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        setError('');

        if (!formData.nombre.trim() || !formData.usuario.trim()) {
            setError('Nombre y Usuario son obligatorios');
            setGuardando(false);
            return;
        }

        if (!esEdicion && !formData.password.trim()) {
            setError('La contraseña es obligatoria para un usuario nuevo');
            setGuardando(false);
            return;
        }

        try {
            if (esEdicion) {
                await axios.put(`${API_URL}/${usuarioAEditar.id}`, formData);
            } else {
                await axios.post(API_URL, formData);
            }
            onGuardado();
        } catch (err) {
            console.error('Error guardando usuario:', err);
            setError(err.response?.data?.error || 'Error al guardar el usuario. Verifica los datos.');
        } finally {
            setGuardando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-auto animate-scale-in flex flex-col max-h-[90vh]">
                
                {/* Header Fijo */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <UserRound size={22} className="text-brand-orange" />
                        {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Scrollable */}
                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-3.5 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                            <AlertCircle size={18} className="shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form id="usuario-form" onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Tipo de Usuario (Rol) - Más visual */}
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Rol de Usuario</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rol: 'ADMINISTRADOR' })}
                                    className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                                        formData.rol === 'ADMINISTRADOR'
                                            ? 'border-brand-orange bg-brand-orange/5 text-brand-orange font-semibold'
                                            : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-white'
                                    }`}
                                >
                                    <Shield size={18} className={formData.rol === 'ADMINISTRADOR' ? 'text-brand-orange' : 'text-slate-400'} />
                                    <span>Administrador</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rol: 'CAJERO' })}
                                    className={`p-3 rounded-xl border-2 flex items-center gap-2 transition-all ${
                                        formData.rol === 'CAJERO'
                                            ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-semibold'
                                            : 'border-slate-100 hover:border-slate-200 text-slate-500 bg-white'
                                    }`}
                                >
                                    <UserRound size={18} className={formData.rol === 'CAJERO' ? 'text-blue-600' : 'text-slate-400'} />
                                    <span>Cajero</span>
                                </button>
                            </div>
                        </div>

                        {/* Datos Básicos */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre Completo <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange focus:bg-white outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de Usuario (Login) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={formData.usuario}
                                        onChange={(e) => setFormData({ ...formData, usuario: e.target.value.toLowerCase().replace(/\s/g, '') })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange focus:bg-white outline-none transition-all placeholder:text-slate-400"
                                        placeholder="Ej. jperez"
                                    />
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">Sin espacios, recomendado en minúsculas.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                    Contraseña {!esEdicion && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required={!esEdicion}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange focus:bg-white outline-none transition-all placeholder:text-slate-400"
                                        placeholder={esEdicion ? "Dejar en blanco para mantener la actual" : "********"}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Fijo */}
                <div className="px-6 py-4 border-t border-slate-100 mt-auto shrink-0 flex gap-3 justify-end bg-slate-50/50 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={guardando}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="usuario-form"
                        disabled={guardando}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-orange hover:bg-brand-red active:scale-[0.98] transition-all shadow-sm flex items-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {guardando ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} />
                                {esEdicion ? 'Guardar Cambios' : 'Crear Usuario'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default UsuarioModal;
