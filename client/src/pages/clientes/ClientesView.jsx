import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Users, AlertCircle, Edit3, Trash2, ChevronLeft, ChevronRight, CheckCircle, X, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import axios from 'axios';
import ClienteModal from '../../components/clientes/ClienteModal';

const API_URL = '/api/clientes';
const ITEMS_PER_PAGE = 25;

/* ====== Sub-components ====== */

// Skeleton row (desktop)
function SkeletonRow() {
    return (
        <tr>
            {[...Array(6)].map((_, i) => (
                <td key={i} className="px-4 py-3.5"><div className="skeleton h-4 rounded-md" style={{ width: `${50 + Math.random() * 30}%` }} /></td>
            ))}
        </tr>
    );
}

// Skeleton card (mobile)
function SkeletonCard() {
    return (
        <div className="p-4 bg-white rounded-2xl border border-slate-100 space-y-3 animate-pulse">
            <div className="skeleton h-4 w-2/3 rounded-md" />
            <div className="skeleton h-3 w-1/2 rounded-md" />
            <div className="skeleton h-3 w-1/3 rounded-md" />
        </div>
    );
}

// Stat card
function StatCard({ icon: Icon, label, value, color, bgColor }) {
    return (
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 min-w-[140px]">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${bgColor}`}>
                <Icon size={18} className={color} />
            </div>
            <div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{label}</p>
                <p className="text-lg font-bold text-slate-800 tabular-nums">{value}</p>
            </div>
        </div>
    );
}

// Tipo identificación badge
function TipoBadge({ tipo }) {
    const styles = {
        CEDULA: 'bg-blue-50 text-blue-700',
        RUC: 'bg-violet-50 text-violet-700',
        PASAPORTE: 'bg-amber-50 text-amber-700',
        OTRO: 'bg-slate-100 text-slate-600'
    };
    return (
        <span className={`badge ${styles[tipo] || styles.OTRO}`}>
            {tipo}
        </span>
    );
}

// Toast notification
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

// Pagination controls
function Pagination({ pagina, totalPaginas, total, onPageChange }) {
    if (totalPaginas <= 1) return null;
    return (
        <div className="flex items-center justify-between px-1 py-3">
            <span className="text-xs text-slate-400 font-medium">
                Pág. {pagina} de {totalPaginas} · {total} cliente{total !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onPageChange(pagina - 1)}
                    disabled={pagina <= 1}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    onClick={() => onPageChange(pagina + 1)}
                    disabled={pagina >= totalPaginas}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}

// Mobile client card
function ClientCard({ cliente, onEdit, onDelete }) {
    return (
        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow animate-slide-up">
            <div className="flex items-start justify-between mb-2.5">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{cliente.nombre}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <TipoBadge tipo={cliente.tipo_identificacion} />
                        <span className="text-xs text-slate-500 font-mono">{cliente.identificacion}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-1 mb-3">
                {cliente.telefono && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Phone size={12} className="text-slate-400" />
                        <span>{cliente.telefono}</span>
                    </div>
                )}
                {cliente.correo && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Mail size={12} className="text-slate-400" />
                        <span className="truncate">{cliente.correo}</span>
                    </div>
                )}
                {cliente.direccion && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="truncate">{cliente.direccion}</span>
                    </div>
                )}
            </div>

            {/* Actions — proteger CONSUMIDOR FINAL (id=1) */}
            <div className="flex gap-2 pt-2 border-t border-slate-50">
                <button
                    onClick={() => onEdit(cliente)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-brand-orange bg-brand-orange/5 hover:bg-brand-orange/10 active:scale-[0.97] transition-all"
                >
                    <Edit3 size={13} /> Editar
                </button>
                {cliente.id !== 1 && (
                    <button
                        onClick={() => onDelete(cliente)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 active:scale-[0.97] transition-all"
                    >
                        <Trash2 size={13} /> Eliminar
                    </button>
                )}
            </div>
        </div>
    );
}

// Confirm dialog
function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, loading }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
                <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                        {loading ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ====== Main Component ====== */

function ClientesView() {
    // Data state
    const [clientes, setClientes] = useState([]);
    const [total, setTotal] = useState(0);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // UI state
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [debouncedBusqueda, setDebouncedBusqueda] = useState('');

    // Modal state
    const [modalAbierto, setModalAbierto] = useState(false);
    const [clienteAEditar, setClienteAEditar] = useState(null);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, cliente: null });
    const [eliminando, setEliminando] = useState(false);

    // Toast state
    const [toast, setToast] = useState(null);

    // Debounce búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedBusqueda(busqueda);
            setPagina(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [busqueda]);

    // Fetch clientes
    const fetchClientes = useCallback(async (pag = pagina) => {
        setCargando(true);
        try {
            const params = new URLSearchParams();
            if (debouncedBusqueda) params.append('q', debouncedBusqueda);
            params.append('pagina', pag);
            params.append('limite', ITEMS_PER_PAGE);

            const res = await axios.get(`${API_URL}?${params.toString()}`);
            setClientes(res.data.clientes);
            setTotal(res.data.total);
            setPagina(res.data.pagina);
            setTotalPaginas(res.data.totalPaginas);
        } catch (err) {
            console.error('Error fetching clientes:', err);
            setToast({ message: 'Error al cargar clientes', type: 'error' });
        } finally {
            setCargando(false);
        }
    }, [debouncedBusqueda, pagina]);

    useEffect(() => {
        fetchClientes(pagina);
    }, [debouncedBusqueda, pagina]);

    // Handlers
    const handleEdit = (cliente) => {
        setClienteAEditar(cliente);
        setModalAbierto(true);
    };

    const handleDelete = async () => {
        if (!confirmDialog.cliente) return;
        setEliminando(true);
        try {
            await axios.delete(`${API_URL}/${confirmDialog.cliente.id}`);
            setToast({ message: 'Cliente eliminado correctamente', type: 'success' });
            setConfirmDialog({ isOpen: false, cliente: null });
            fetchClientes(pagina);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Error al eliminar el cliente';
            setToast({ message: errorMsg, type: 'error' });
            setConfirmDialog({ isOpen: false, cliente: null });
        } finally {
            setEliminando(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPagina(newPage);
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
                        <Users size={24} className="text-emerald-600" />
                        Clientes
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 mt-0.5">Gestiona tu base de clientes</p>
                </div>
                <button
                    onClick={() => { setClienteAEditar(null); setModalAbierto(true); }}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 transition-all active:scale-[0.97]"
                >
                    <Plus size={18} /> Nuevo Cliente
                </button>
            </div>

            {/* Stats */}
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                <StatCard icon={Users} label="Total" value={total} color="text-emerald-600" bgColor="bg-emerald-50" />
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o identificación..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none shadow-sm transition-all placeholder:text-slate-300"
                />
                {busqueda && (
                    <button
                        onClick={() => setBusqueda('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 p-1 rounded-lg"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left border-b border-slate-100">
                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nombre</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tipo</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Identificación</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Teléfono</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Correo</th>
                                <th className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {cargando ? (
                                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                            ) : clientes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Users size={40} className="text-slate-200" />
                                            <p className="text-slate-400 font-medium">No se encontraron clientes</p>
                                            <p className="text-xs text-slate-300">
                                                {busqueda ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer cliente'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                clientes.map((c) => (
                                    <tr key={c.id} className="table-row-hover group">
                                        <td className="px-4 py-3.5">
                                            <span className="font-semibold text-slate-800">{c.nombre}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <TipoBadge tipo={c.tipo_identificacion} />
                                        </td>
                                        <td className="px-4 py-3.5">
                                            <span className="font-mono text-slate-600 text-xs">{c.identificacion}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-500">
                                            {c.telefono || <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-500 truncate max-w-[200px]">
                                            {c.correo || <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(c)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit3 size={15} />
                                                </button>
                                                {c.id !== 1 && (
                                                    <button
                                                        onClick={() => setConfirmDialog({ isOpen: true, cliente: c })}
                                                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 border-t border-slate-50">
                    <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total} onPageChange={handlePageChange} />
                </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {cargando ? (
                    [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
                ) : clientes.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                        <Users size={40} className="text-slate-200" />
                        <p className="text-slate-400 font-medium">No se encontraron clientes</p>
                    </div>
                ) : (
                    clientes.map((c) => (
                        <ClientCard
                            key={c.id}
                            cliente={c}
                            onEdit={handleEdit}
                            onDelete={(cliente) => setConfirmDialog({ isOpen: true, cliente })}
                        />
                    ))
                )}
                <Pagination pagina={pagina} totalPaginas={totalPaginas} total={total} onPageChange={handlePageChange} />
            </div>

            {/* Modal */}
            <ClienteModal
                isOpen={modalAbierto}
                onClose={() => { setModalAbierto(false); setClienteAEditar(null); }}
                onGuardado={() => {
                    setModalAbierto(false);
                    setClienteAEditar(null);
                    setToast({ message: clienteAEditar ? 'Cliente actualizado' : 'Cliente registrado', type: 'success' });
                    fetchClientes(pagina);
                }}
                clienteAEditar={clienteAEditar}
            />

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Eliminar Cliente"
                message={`¿Estás seguro de eliminar a "${confirmDialog.cliente?.nombre}"? Esta acción no se puede deshacer si el cliente no tiene ventas asociadas.`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDialog({ isOpen: false, cliente: null })}
                loading={eliminando}
            />

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

export default ClientesView;
