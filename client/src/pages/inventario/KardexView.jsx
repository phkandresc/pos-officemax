import { useState, useEffect } from 'react';
import { History, Search, ArrowDownRight, ArrowUpRight, ArrowRightLeft, FileText, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, CalendarDays, X } from 'lucide-react';
import axios from 'axios';

const API_URL = '/api/inventario/movimientos';
const ITEMS_PER_PAGE = 30;

/* ====== Sub-components ====== */

// Movement badge
const MovimientoBadge = ({ tipo }) => {
    const config = {
        ENTRADA: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: ArrowDownRight, label: 'Entrada' },
        SALIDA: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: ArrowUpRight, label: 'Salida' },
        VENTA: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: ArrowUpRight, label: 'Venta' },
        AJUSTE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: ArrowRightLeft, label: 'Ajuste' }
    };
    const c = config[tipo] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', icon: FileText, label: tipo };
    const Icon = c.icon;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${c.bg} ${c.text} border ${c.border}`}>
            <Icon size={12} />
            {c.label}
        </span>
    );
};

// Desktop skeleton row
const SkeletonRow = () => (
    <tr>
        <td className="p-4"><div className="skeleton h-4 w-28" /></td>
        <td className="p-4"><div className="skeleton h-4 w-36 mb-1.5" /><div className="skeleton h-3 w-20" /></td>
        <td className="p-4"><div className="skeleton h-6 w-20" /></td>
        <td className="p-4 text-center"><div className="skeleton h-5 w-10 mx-auto" /></td>
        <td className="p-4 text-center"><div className="skeleton h-6 w-12 mx-auto rounded-lg" /></td>
        <td className="p-4"><div className="skeleton h-4 w-28" /></td>
    </tr>
);

// Mobile skeleton card
const SkeletonCard = () => (
    <div className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm">
        <div className="flex justify-between mb-2"><div className="skeleton h-3 w-24" /><div className="skeleton h-5 w-16 rounded-md" /></div>
        <div className="skeleton h-4 w-3/4 mb-1.5" />
        <div className="skeleton h-3 w-1/2" />
    </div>
);

// Pagination controls
const Pagination = ({ pagina, totalPaginas, total, onPageChange }) => {
    if (totalPaginas <= 1) return null;

    return (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">
                {total} movimiento{total !== 1 ? 's' : ''} · Página {pagina} de {totalPaginas}
            </span>
            <div className="flex gap-1.5">
                <button
                    onClick={() => onPageChange(pagina - 1)}
                    disabled={pagina <= 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    onClick={() => onPageChange(pagina + 1)}
                    disabled={pagina >= totalPaginas}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-100 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

// Mobile movement card
const MovimientoCard = ({ mov, formatDate }) => {
    const cantColor = mov.tipo_movimiento === 'ENTRADA' ? 'text-emerald-600'
        : mov.tipo_movimiento === 'AJUSTE' ? 'text-amber-600'
            : 'text-red-600';
    const cantSign = mov.tipo_movimiento === 'ENTRADA' ? '+' : (mov.tipo_movimiento === 'SALIDA' || mov.tipo_movimiento === 'VENTA') ? '−' : '';

    return (
        <div className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm animate-slide-up">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-slate-400 font-medium">{formatDate(mov.fecha_hora)}</span>
                <MovimientoBadge tipo={mov.tipo_movimiento} />
            </div>
            <div className="font-semibold text-sm text-slate-800 leading-snug">{mov.producto_nombre}</div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5 mb-2">
                ID: {mov.producto_id} · CB: {mov.codigo_barras || '—'}
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm ${cantColor}`}>
                        {cantSign}{Math.abs(mov.cantidad)}
                    </span>
                    <span className="text-[11px] text-slate-400">→ Stock: <strong className="text-slate-700">{mov.stock_resultante}</strong></span>
                </div>
                {mov.referencia_id && (
                    <span className="px-1.5 py-0.5 bg-brand-orange/5 text-brand-orange rounded text-[10px] font-semibold border border-brand-orange/15">
                        Venta #{mov.referencia_id}
                    </span>
                )}
            </div>
            {mov.motivo && (
                <p className="text-[11px] text-slate-400 mt-1.5 truncate" title={mov.motivo}>📝 {mov.motivo}</p>
            )}
        </div>
    );
};

/* ====== Main Component ====== */

const KardexView = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState('');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    // Pagination
    const [pagina, setPagina] = useState(1);
    const [totalMovimientos, setTotalMovimientos] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(1);

    const fetchKardex = async (pag = pagina) => {
        setCargando(true);
        try {
            const params = new URLSearchParams();
            if (busqueda) params.set('busqueda', busqueda);
            if (fechaDesde) params.set('fecha_desde', fechaDesde);
            if (fechaHasta) params.set('fecha_hasta', fechaHasta);
            params.set('pagina', pag);
            params.set('limite', ITEMS_PER_PAGE);

            const res = await axios.get(`${API_URL}?${params.toString()}`);
            setMovimientos(res.data.movimientos);
            setTotalMovimientos(res.data.total);
            setTotalPaginas(res.data.totalPaginas);
            setPagina(res.data.pagina);
            setError(null);
        } catch (err) {
            console.error('Error obteniendo Kardex:', err);
            setError('No se pudo cargar el historial de movimientos.');
        } finally {
            setCargando(false);
        }
    };

    // Reset page when filters change
    useEffect(() => {
        setPagina(1);
    }, [busqueda, fechaDesde, fechaHasta]);

    useEffect(() => {
        const delay = setTimeout(() => { fetchKardex(pagina); }, 500);
        return () => clearTimeout(delay);
    }, [busqueda, fechaDesde, fechaHasta, pagina]);

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('es-EC', {
            year: 'numeric', month: 'short', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    const clearFilters = () => {
        setBusqueda('');
        setFechaDesde('');
        setFechaHasta('');
    };

    const hasFilters = busqueda || fechaDesde || fechaHasta;

    const handlePageChange = (newPage) => {
        setPagina(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 md:gap-6 animate-fade-in">
            {/* — Header — */}
            <header className="flex flex-col gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 md:gap-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center shadow-md shadow-brand-orange/20">
                        <History className="text-white w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    Kardex de Movimientos
                </h1>
                <p className="text-slate-400 text-xs md:text-sm ml-10 md:ml-12">Auditoría completa de entradas, salidas y ventas.</p>
            </header>

            {/* — Search Bar — */}
            <div className="bg-white p-2.5 md:p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2.5">
                {/* Row 1: text search + refresh */}
                <div className="flex gap-2 md:gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar producto por nombre o código..."
                            className="w-full bg-slate-50/80 border border-slate-100 rounded-xl py-2.5 pl-9 md:pl-11 pr-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <button
                        onClick={() => fetchKardex(pagina)}
                        className="bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 px-3 md:px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium border border-slate-100 text-sm shrink-0"
                    >
                        <RefreshCw size={16} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>

                {/* Row 2: date range filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <CalendarDays size={14} className="text-slate-300 shrink-0" />
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="bg-slate-50/80 border border-slate-100 rounded-lg py-1.5 px-3 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 transition-all"
                        title="Fecha desde"
                    />
                    <span className="text-slate-300 text-xs">→</span>
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="bg-slate-50/80 border border-slate-100 rounded-lg py-1.5 px-3 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 transition-all"
                        title="Fecha hasta"
                    />
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="ml-auto text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors"
                        >
                            <X size={12} />
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            {/* — Error — */}
            {error && (
                <div className="bg-amber-50/80 text-amber-700 p-3 md:p-4 rounded-xl flex items-start gap-2 border border-amber-200/60 animate-slide-down">
                    <AlertCircle className="shrink-0 mt-0.5" size={16} />
                    <span className="text-xs md:text-sm">{error}</span>
                </div>
            )}

            {/* ====== MOBILE: Card Layout ====== */}
            <div className="md:hidden flex flex-col gap-2.5">
                {cargando ? (
                    <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                ) : movimientos.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                        <History className="mx-auto text-slate-200 mb-3" size={36} />
                        <p className="text-slate-400 text-sm font-medium">No se encontraron movimientos</p>
                    </div>
                ) : (
                    movimientos.map(mov => (
                        <MovimientoCard key={mov.id} mov={mov} formatDate={formatDate} />
                    ))
                )}
            </div>

            {/* ====== DESKTOP: Table Layout ====== */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[150px]">Fecha / Hora</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Producto</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[120px]">Movimiento</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-[90px]">Cantidad</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-[100px]">Stock Res.</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Motivo / Ref</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {cargando ? (
                                <><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                            ) : movimientos.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center">
                                        <History className="mx-auto text-slate-200 mb-3" size={40} />
                                        <p className="text-slate-400 font-medium">No se encontraron movimientos</p>
                                        <p className="text-slate-300 text-sm mt-1">Los movimientos de inventario aparecerán aquí</p>
                                    </td>
                                </tr>
                            ) : (
                                movimientos.map(mov => (
                                    <tr key={mov.id} className="table-row-hover">
                                        <td className="p-4 text-xs text-slate-500 whitespace-nowrap font-medium">{formatDate(mov.fecha_hora)}</td>
                                        <td className="p-4">
                                            <div className="font-semibold text-sm text-slate-800">{mov.producto_nombre}</div>
                                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {mov.producto_id} · CB: {mov.codigo_barras || '—'}</div>
                                        </td>
                                        <td className="p-4"><MovimientoBadge tipo={mov.tipo_movimiento} /></td>
                                        <td className="p-4 text-center">
                                            <span className={`font-bold text-sm ${mov.tipo_movimiento === 'ENTRADA' ? 'text-emerald-600' :
                                                mov.tipo_movimiento === 'AJUSTE' ? 'text-amber-600' : 'text-red-600'
                                                }`}>
                                                {(mov.tipo_movimiento === 'SALIDA' || mov.tipo_movimiento === 'VENTA') ? '−' : mov.tipo_movimiento === 'ENTRADA' ? '+' : ''}
                                                {Math.abs(mov.cantidad)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center min-w-[2.5rem] bg-slate-50 px-2.5 py-1 rounded-lg text-slate-700 text-xs font-bold border border-slate-100">
                                                {mov.stock_resultante}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-slate-500 max-w-[220px] truncate" title={mov.motivo}>
                                            {mov.motivo || <span className="text-slate-300 italic">Sin especificar</span>}
                                            {mov.referencia_id && (
                                                <span className="ml-2 px-2 py-0.5 bg-brand-orange/5 text-brand-orange rounded-md text-[11px] font-semibold border border-brand-orange/15">
                                                    Venta #{mov.referencia_id}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* — Pagination — */}
            {!cargando && (
                <Pagination
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    total={totalMovimientos}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
};

export default KardexView;
