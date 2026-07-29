import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, UserRound, AlertCircle, Edit3, Shield, Power, PowerOff, X, CheckCircle } from 'lucide-react';
import axios from 'axios';
import UsuarioModal from '../../components/usuarios/UsuarioModal';
import useAuthStore from '../../stores/useAuthStore';

const API_URL = '/api/usuarios';

/* ====== Sub-components ====== */

function Toast({ message, type = 'success', onClose }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up
            ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}
        >
            {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message}
            <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-opacity"><X size={16} /></button>
        </div>
    );
}

function RoleBadge({ role }) {
    const isAdmin = role === 'ADMINISTRADOR';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
            ${isAdmin ? 'bg-brand-orange/5 text-brand-orange' : 'bg-blue-50 text-blue-700'}`}>
            {isAdmin ? <Shield size={12} /> : <UserRound size={12} />}
            {role}
        </span>
    );
}

function StatusBadge({ activo }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold
            ${activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {activo ? 'Activo' : 'Inactivo'}
        </span>
    );
}

/* ====== Main Component ====== */

function UsuariosView() {
    const { user: currentUser } = useAuthStore();
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [debouncedBusqueda, setDebouncedBusqueda] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [usuarioAEditar, setUsuarioAEditar] = useState(null);
    const [toast, setToast] = useState(null);

    // Debounce búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedBusqueda(busqueda);
        }, 350);
        return () => clearTimeout(timer);
    }, [busqueda]);

    const fetchUsuarios = useCallback(async () => {
        setCargando(true);
        try {
            const params = new URLSearchParams();
            if (debouncedBusqueda) params.append('q', debouncedBusqueda);
            
            const res = await axios.get(`${API_URL}?${params.toString()}`);
            setUsuarios(res.data.usuarios);
        } catch (err) {
            console.error('Error fetching usuarios:', err);
            setToast({ message: 'Error al cargar usuarios', type: 'error' });
        } finally {
            setCargando(false);
        }
    }, [debouncedBusqueda]);

    useEffect(() => {
        fetchUsuarios();
    }, [debouncedBusqueda, fetchUsuarios]);

    const handleEdit = (usuario) => {
        setUsuarioAEditar(usuario);
        setModalAbierto(true);
    };

    const handleToggleEstado = async (id, isActivo, nombre) => {
        if (!confirm(`¿Estás seguro de ${isActivo ? 'desactivar' : 'activar'} al usuario "${nombre}"?`)) return;

        try {
            await axios.patch(`${API_URL}/${id}/estado`);
            setToast({ message: `Usuario ${isActivo ? 'desactivado' : 'activado'} correctamente`, type: 'success' });
            fetchUsuarios();
        } catch (err) {
            setToast({ message: err.response?.data?.error || 'Error al cambiar el estado', type: 'error' });
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <UserRound size={24} className="text-brand-orange" />
                        Usuarios y Roles
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 mt-0.5">Controla quién tiene acceso al sistema</p>
                </div>
                <button
                    onClick={() => { setUsuarioAEditar(null); setModalAbierto(true); }}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-orange to-brand-red hover:from-indigo-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-brand-orange/20 transition-all active:scale-[0.97]"
                >
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o usuario..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none shadow-sm transition-all placeholder:text-slate-300"
                />
            </div>

            {/* Content List/Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                {cargando ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="w-8 h-8 border-4 border-brand-orange/15 border-t-brand-orange rounded-full animate-spin" />
                    </div>
                ) : usuarios.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center p-6">
                        <UserRound size={40} className="text-slate-200 mb-3" />
                        <p className="text-slate-500 font-medium text-lg">No se encontraron usuarios</p>
                        <p className="text-slate-400 text-sm mt-1">Ajusta tu búsqueda o crea uno nuevo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {usuarios.map(u => (
                            <div key={u.id} className={`p-5 rounded-2xl border ${u.activo ? 'border-slate-100 bg-white hover:shadow-md' : 'border-slate-100 bg-slate-50'} transition-all`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-sm ${u.rol === 'ADMINISTRADOR' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-blue-100 text-blue-700'} ${!u.activo && 'opacity-60 grayscale'}`}>
                                            {u.nombre.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-[15px] ${u.activo ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{u.nombre}</h3>
                                            <p className="text-xs font-mono text-slate-500 mt-0.5">@{u.usuario}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => handleEdit(u)}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors"
                                            title="Editar Usuario"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        {currentUser?.id !== u.id && ( // Evitar desactivarse a uno mismo
                                            <button 
                                                onClick={() => handleToggleEstado(u.id, u.activo, u.nombre)}
                                                className={`p-1.5 rounded-lg transition-colors ${u.activo ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                title={u.activo ? 'Desactivar Usuario' : 'Activar Usuario'}
                                            >
                                                {u.activo ? <PowerOff size={16} /> : <Power size={16} />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5 mt-auto">
                                    <RoleBadge role={u.rol} />
                                    <StatusBadge activo={u.activo} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <UsuarioModal
                isOpen={modalAbierto}
                onClose={() => { setModalAbierto(false); setUsuarioAEditar(null); }}
                onGuardado={() => {
                    setModalAbierto(false);
                    setUsuarioAEditar(null);
                    setToast({ message: usuarioAEditar ? 'Usuario actualizado' : 'Usuario registrado', type: 'success' });
                    fetchUsuarios();
                }}
                usuarioAEditar={usuarioAEditar}
            />

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

export default UsuariosView;
