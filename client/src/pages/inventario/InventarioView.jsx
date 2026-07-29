import { useState, useEffect } from 'react';
import { Search, Plus, Package, AlertCircle, ScanLine, PackageSearch, AlertTriangle, Zap, Edit3, ArrowUpDown, Trash2, ChevronLeft, ChevronRight, Filter, CheckCircle, X } from 'lucide-react';
import axios from 'axios';
import ProductoModal from '../../components/inventario/ProductoModal';
import MovimientoStockModal from '../../components/inventario/MovimientoStockModal';
import BarcodeScanner from '../../components/ui/BarcodeScanner';

const API_URL = '/api/productos';
const ITEMS_PER_PAGE = 25;

/* ====== Sub-components ====== */

// Skeleton row (desktop)
const SkeletonRow = () => (
    <tr>
        <td className="p-4"><div className="skeleton h-5 w-28" /></td>
        <td className="p-4"><div className="skeleton h-5 w-44 mb-2" /><div className="skeleton h-3 w-16" /></td>
        <td className="p-4 text-center"><div className="skeleton h-5 w-14 mx-auto" /></td>
        <td className="p-4 text-center"><div className="skeleton h-6 w-12 mx-auto rounded-lg" /></td>
        <td className="p-4 text-right"><div className="skeleton h-5 w-20 ml-auto" /></td>
    </tr>
);

// Skeleton card (mobile)
const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-5 w-3/4 mb-2" />
        <div className="skeleton h-3 w-16 mb-3" />
        <div className="flex justify-between items-center">
            <div className="skeleton h-6 w-14" />
            <div className="skeleton h-8 w-20 rounded-lg" />
        </div>
    </div>
);

// Stat card
const StatCard = ({ icon: Icon, label, value, color, bgColor }) => (
    <div className="flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl border border-slate-100 bg-white shadow-sm animate-slide-up">
        <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}>
            <Icon size={18} className={`${color} md:w-5 md:h-5`} />
        </div>
        <div>
            <p className="text-xl md:text-2xl font-bold text-slate-800 leading-none">{value}</p>
            <p className="text-[11px] md:text-xs text-slate-400 mt-0.5 font-medium">{label}</p>
        </div>
    </div>
);

// Type badge
const TipoBadge = ({ tipo }) => {
    const styles = {
        FISICO: 'bg-blue-50 text-blue-700 border border-blue-100',
        SERVICIO: 'bg-violet-50 text-violet-700 border border-violet-100',
        RECARGA: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    };
    const labels = { FISICO: 'Físico', SERVICIO: 'Servicio', RECARGA: 'Recarga' };

    return (
        <span className={`badge ${styles[tipo] || 'bg-slate-100 text-slate-600'}`}>
            {labels[tipo] || tipo}
        </span>
    );
};

// Stock indicator — usa stock_minimo del producto si existe
const StockIndicator = ({ tipo, stock, stockMinimo = 5 }) => {
    if (tipo !== 'FISICO') {
        return <span className="text-slate-300 text-lg">∞</span>;
    }
    const min = stockMinimo || 5;
    const cls = stock <= min
        ? 'bg-red-50 text-red-600 border-red-100'
        : stock <= min * 3
            ? 'bg-amber-50 text-amber-600 border-amber-100'
            : 'bg-emerald-50 text-emerald-600 border-emerald-100';

    return (
        <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2.5 py-1 rounded-lg text-xs font-bold border ${cls}`}>
            {stock}
        </span>
    );
};

// Toast notification
const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = type === 'success'
        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
        : 'bg-red-500 text-white shadow-lg shadow-red-200';

    return (
        <div className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium animate-slide-down ${styles}`}>
            {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message}
            <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100"><X size={14} /></button>
        </div>
    );
};

// Pagination controls
const Pagination = ({ pagina, totalPaginas, total, onPageChange }) => {
    if (totalPaginas <= 1) return null;

    return (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-xs text-slate-400 font-medium">
                {total} resultado{total !== 1 ? 's' : ''} · Página {pagina} de {totalPaginas}
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

// Mobile product card
const ProductCard = ({ prod, onEdit, onStock, onDeactivate }) => (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-slide-up">
        {/* Top row: code + badge */}
        <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                {prod.codigo_barras || '—'}
            </span>
            <TipoBadge tipo={prod.tipo_item} />
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm text-slate-800 leading-snug mb-3">{prod.nombre}</h3>

        {/* Bottom row: price + stock + actions */}
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span className="text-base font-bold text-slate-800">${Number(prod.precio_venta).toFixed(2)}</span>
                <StockIndicator tipo={prod.tipo_item} stock={prod.stock_actual} stockMinimo={prod.stock_minimo} />
            </div>
            <div className="flex gap-1.5">
                {prod.tipo_item === 'FISICO' && (
                    <button
                        onClick={() => onStock(prod)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 active:bg-amber-100 transition-colors"
                    >
                        <ArrowUpDown size={14} />
                    </button>
                )}
                <button
                    onClick={() => onEdit(prod)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-orange/5 text-brand-orange border border-brand-orange/15 active:bg-brand-orange/10 transition-colors"
                >
                    <Edit3 size={14} />
                </button>
                <button
                    onClick={() => onDeactivate(prod)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 border border-red-100 active:bg-red-100 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    </div>
);

// Confirm dialog
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, loading }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
            <div className="bg-white w-full md:max-w-sm md:rounded-2xl rounded-t-2xl shadow-xl p-5 md:p-6 animate-slide-up md:animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                        <Trash2 size={20} className="text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{title}</h3>
                        <p className="text-xs text-slate-400">{message}</p>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors font-medium">
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 active:scale-[0.97]"
                    >
                        {loading ? 'Desactivando...' : 'Desactivar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ====== Main Component ====== */

const InventarioView = () => {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [filtroTipo, setFiltroTipo] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [pagina, setPagina] = useState(1);
    const [totalProductos, setTotalProductos] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Modals
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [productoStock, setProductoStock] = useState(null);

    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Deactivate
    const [confirmDeactivate, setConfirmDeactivate] = useState(null);
    const [deactivating, setDeactivating] = useState(false);

    // Código de barras pre-llenado para nuevo producto (flujo escáner)
    const [codigoBarrasParaNuevo, setCodigoBarrasParaNuevo] = useState('');

    // Toast
    const [toast, setToast] = useState(null);

    const fetchProductos = async (pag = pagina) => {
        setCargando(true);
        try {
            const params = new URLSearchParams();
            if (busqueda) params.set('q', busqueda);
            if (filtroTipo) params.set('tipo_item', filtroTipo);
            params.set('pagina', pag);
            params.set('limite', ITEMS_PER_PAGE);

            const res = await axios.get(`${API_URL}?${params.toString()}`);
            setProductos(res.data.productos);
            setTotalProductos(res.data.total);
            setTotalPaginas(res.data.totalPaginas);
            setPagina(res.data.pagina);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('No se pudo conectar al servidor.');
            setProductos([]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        setPagina(1);
    }, [busqueda, filtroTipo]);

    useEffect(() => {
        const delay = setTimeout(() => { fetchProductos(pagina); }, 300);
        return () => clearTimeout(delay);
    }, [busqueda, filtroTipo, pagina]);

    const bajoStock = productos.filter(p => p.tipo_item === 'FISICO' && p.stock_actual <= (p.stock_minimo || 5)).length;
    const servicios = productos.filter(p => p.tipo_item === 'SERVICIO' || p.tipo_item === 'RECARGA').length;

    const handleEdit = (prod) => { setProductoSeleccionado(prod); setCodigoBarrasParaNuevo(''); setIsProductModalOpen(true); };
    const handleStock = (prod) => { setProductoStock(prod); setIsStockModalOpen(true); };

    // Flujo inteligente del escáner: producto existe → ENTRADA stock, no existe → crear producto
    const handleScanResult = async (decodedText) => {
        setIsScannerOpen(false);
        try {
            const res = await axios.get(`${API_URL}`, { params: { q: decodedText, limite: 5 } });
            const products = res.data.productos || [];
            // Buscar coincidencia exacta por código de barras
            const exactMatch = products.find(p => p.codigo_barras === decodedText);
            if (exactMatch) {
                // Producto encontrado → abrir modal de entrada de stock directamente
                setProductoStock(exactMatch);
                setIsStockModalOpen(true);
                setToast({ message: `${exactMatch.nombre} — Agregar stock`, type: 'success' });
            } else {
                // Producto no encontrado → abrir modal de nuevo producto con código pre-llenado
                setProductoSeleccionado(null);
                setCodigoBarrasParaNuevo(decodedText);
                setIsProductModalOpen(true);
                setToast({ message: `Código ${decodedText} no encontrado — Crear nuevo producto`, type: 'warning' });
            }
        } catch (err) {
            setToast({ message: 'Error al buscar el producto escaneado', type: 'error' });
        }
    };

    const handleDeactivate = async () => {
        if (!confirmDeactivate) return;
        setDeactivating(true);
        try {
            await axios.delete(`${API_URL}/${confirmDeactivate.id}`);
            setConfirmDeactivate(null);
            setToast({ message: 'Producto desactivado correctamente', type: 'success' });
            fetchProductos();
        } catch (err) {
            setToast({ message: err.response?.data?.error || 'Error al desactivar', type: 'error' });
        } finally {
            setDeactivating(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPagina(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-4 md:p-8 max-w-[1400px] mx-auto flex flex-col gap-4 md:gap-6 animate-fade-in">
            {/* — Toast — */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* — Page Header — */}
            <header className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-3 md:gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center shadow-md shadow-brand-orange/20">
                            <Package className="text-white w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        Gestión de Catálogo
                    </h1>
                    <p className="text-slate-400 mt-1 text-xs md:text-sm ml-10 md:ml-12">Administra productos, servicios y su stock.</p>
                </div>
                <button
                    onClick={() => { setProductoSeleccionado(null); setIsProductModalOpen(true); }}
                    className="w-full sm:w-auto bg-gradient-to-r from-brand-orange to-brand-red hover:from-brand-red hover:to-brand-red text-white px-4 md:px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md shadow-brand-orange/20 transition-all duration-200 active:scale-[0.97] focus-ring text-sm"
                >
                    <Plus size={18} strokeWidth={2.5} />
                    Nuevo Ítem
                </button>
            </header>

            {/* — Stats Cards — */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
                <StatCard icon={PackageSearch} label="Total ítems" value={totalProductos} color="text-brand-orange" bgColor="bg-brand-orange/5" />
                <StatCard icon={AlertTriangle} label="Bajo stock" value={bajoStock} color="text-amber-600" bgColor="bg-amber-50" />
                <StatCard icon={Zap} label="Servicios" value={servicios} color="text-violet-600" bgColor="bg-violet-50" />
            </div>

            {/* — Search Bar + Filter — */}
            <div className="bg-white p-2.5 md:p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-2 md:gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar código o descripción..."
                        className="w-full bg-slate-50/80 border border-slate-100 rounded-xl py-2.5 pl-9 md:pl-11 pr-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 transition-all placeholder:text-slate-300"
                    />
                </div>

                {/* Type filter dropdown */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="appearance-none bg-slate-50 hover:bg-slate-100 text-slate-600 pl-8 pr-3 md:pr-8 py-2.5 rounded-xl text-sm font-medium border border-slate-100 outline-none focus:ring-2 focus:ring-brand-orange/25 cursor-pointer transition-colors"
                    >
                        <option value="">Todos</option>
                        <option value="FISICO">Físico</option>
                        <option value="SERVICIO">Servicio</option>
                        <option value="RECARGA">Recarga</option>
                    </select>
                </div>

                <button
                    onClick={() => setIsScannerOpen(true)}
                    className="bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 px-3 md:px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors font-medium border border-slate-100 text-sm shrink-0"
                    title="Escanear con la Cámara"
                >
                    <ScanLine size={16} className="text-brand-orange" />
                    <span className="hidden sm:inline">Escanear</span>
                </button>
            </div>

            {/* — Error Alert — */}
            {error && (
                <div className="bg-amber-50/80 text-amber-700 p-3 md:p-4 rounded-xl flex items-start gap-2 md:gap-3 border border-amber-200/60 animate-slide-down">
                    <AlertCircle className="shrink-0 mt-0.5" size={16} />
                    <div>
                        <strong className="block font-semibold text-xs md:text-sm">Aviso del Sistema</strong>
                        <span className="text-xs md:text-sm">{error}</span>
                    </div>
                </div>
            )}

            {/* ====== MOBILE: Card Layout ====== */}
            <div className="md:hidden flex flex-col gap-3">
                {cargando ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : productos.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
                        <PackageSearch className="mx-auto text-slate-200 mb-3" size={36} />
                        <p className="text-slate-400 text-sm font-medium">No se encontraron productos</p>
                    </div>
                ) : (
                    productos.map(prod => (
                        <ProductCard
                            key={prod.id}
                            prod={prod}
                            onEdit={handleEdit}
                            onStock={handleStock}
                            onDeactivate={(p) => setConfirmDeactivate(p)}
                        />
                    ))
                )}
            </div>

            {/* ====== DESKTOP: Table Layout ====== */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-100">
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-[160px]">Código</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Descripción</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-[100px]">P. Venta</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-[80px]">Stock</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-[220px]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {cargando ? (
                                <>
                                    <SkeletonRow />
                                    <SkeletonRow />
                                    <SkeletonRow />
                                </>
                            ) : productos.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center">
                                        <PackageSearch className="mx-auto text-slate-200 mb-3" size={40} />
                                        <p className="text-slate-400 font-medium">No se encontraron productos</p>
                                        <p className="text-slate-300 text-sm mt-1">Intenta con otro término de búsqueda</p>
                                    </td>
                                </tr>
                            ) : (
                                productos.map(prod => (
                                    <tr key={prod.id} className="table-row-hover group">
                                        <td className="p-4">
                                            <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                {prod.codigo_barras || '—'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-sm text-slate-800">{prod.nombre}</div>
                                            <div className="mt-1.5"><TipoBadge tipo={prod.tipo_item} /></div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-bold text-sm text-slate-800">${Number(prod.precio_venta).toFixed(2)}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <StockIndicator tipo={prod.tipo_item} stock={prod.stock_actual} stockMinimo={prod.stock_minimo} />
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                                                {prod.tipo_item === 'FISICO' && (
                                                    <button
                                                        onClick={() => handleStock(prod)}
                                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors border border-amber-100"
                                                    >
                                                        <ArrowUpDown size={13} />
                                                        Stock
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(prod)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-orange hover:text-brand-red bg-brand-orange/5 hover:bg-brand-orange/10 px-3 py-1.5 rounded-lg transition-colors border border-brand-orange/15"
                                                >
                                                    <Edit3 size={13} />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeactivate(prod)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                                                >
                                                    <Trash2 size={13} />
                                                    Desactivar
                                                </button>
                                            </div>
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
                    total={totalProductos}
                    onPageChange={handlePageChange}
                />
            )}

            {/* — Modals — */}
            <ProductoModal
                isOpen={isProductModalOpen}
                productoAEditar={productoSeleccionado}
                codigoBarrasInicial={codigoBarrasParaNuevo}
                onClose={() => { setIsProductModalOpen(false); setCodigoBarrasParaNuevo(''); }}
                onGuardado={() => {
                    setIsProductModalOpen(false);
                    setCodigoBarrasParaNuevo('');
                    setToast({ message: productoSeleccionado ? 'Producto actualizado' : 'Producto creado exitosamente', type: 'success' });
                    fetchProductos();
                }}
            />
            <MovimientoStockModal
                isOpen={isStockModalOpen}
                productoId={productoStock?.id}
                productoNombre={productoStock?.nombre}
                stockActual={productoStock?.stock_actual}
                onClose={() => setIsStockModalOpen(false)}
                onGuardado={() => {
                    setIsStockModalOpen(false);
                    setToast({ message: 'Movimiento de stock registrado', type: 'success' });
                    fetchProductos();
                }}
            />
            <BarcodeScanner
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScanSuccess={handleScanResult}
            />
            <ConfirmDialog
                isOpen={!!confirmDeactivate}
                title="Desactivar producto"
                message={`¿Estás seguro de desactivar "${confirmDeactivate?.nombre}"? Podrás reactivarlo después.`}
                onConfirm={handleDeactivate}
                onCancel={() => setConfirmDeactivate(null)}
                loading={deactivating}
            />
        </div>
    );
};

export default InventarioView;
