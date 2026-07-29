import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote,
    ScanLine, DollarSign, ArrowDownUp, LogOut, Package, Zap, RefreshCw,
    CheckCircle, AlertCircle, X, ChevronDown, User, Printer, RotateCcw
} from 'lucide-react';
import axios from 'axios';
import useCartStore from '../../stores/useCartStore';
import useCajaStore from '../../stores/useCajaStore';
import AbrirCajaModal from '../../components/pos/AbrirCajaModal';
import CerrarCajaModal from '../../components/pos/CerrarCajaModal';
import MovimientoCajaModal from '../../components/pos/MovimientoCajaModal';
import BarcodeScanner from '../../components/ui/BarcodeScanner';

/* ====== Toast Component ====== */
const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3500);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-semibold animate-slide-down ${type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
            type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}>
            {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message}
            <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors">
                <X size={14} />
            </button>
        </div>
    );
};

/* ====== Badge tipo item ====== */
const TipoBadge = ({ tipo }) => {
    const config = {
        FISICO: { bg: 'bg-blue-50 text-blue-700', icon: <Package size={11} /> },
        SERVICIO: { bg: 'bg-violet-50 text-violet-700', icon: <Zap size={11} /> },
        RECARGA: { bg: 'bg-amber-50 text-amber-700', icon: <RefreshCw size={11} /> }
    };
    const c = config[tipo] || config.FISICO;
    return (
        <span className={`badge ${c.bg}`}>{c.icon} {tipo}</span>
    );
};

/* ====== Buscador de clientes inline ====== */
const ClienteSelector = ({ clienteId, clienteNombre, onSelect, onToast }) => {
    const [busquedaCliente, setBusquedaCliente] = useState('');
    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [showCrear, setShowCrear] = useState(false);
    const [nuevoCliente, setNuevoCliente] = useState({ tipo_identificacion: 'CEDULA', identificacion: '', nombre: '' });
    const [creando, setCreando] = useState(false);
    const debounceRef = useRef(null);
    const containerRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setShowCrear(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const buscar = useCallback(async (q) => {
        if (!q || q.length < 2) { setResultados([]); return; }
        setBuscando(true);
        try {
            const res = await axios.get('/api/clientes', { params: { q, limite: 8 } });
            setResultados(res.data.clientes || []);
        } catch { setResultados([]); }
        finally { setBuscando(false); }
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => buscar(busquedaCliente), 300);
        return () => clearTimeout(debounceRef.current);
    }, [busquedaCliente, buscar]);

    const handleSelect = (c) => {
        onSelect(c.id, c.nombre);
        setIsOpen(false);
        setBusquedaCliente('');
    };

    const handleCrear = async () => {
        if (!nuevoCliente.identificacion || !nuevoCliente.nombre) {
            onToast({ message: 'Identificación y nombre son obligatorios', type: 'error' });
            return;
        }
        setCreando(true);
        try {
            const res = await axios.post('/api/clientes', nuevoCliente);
            onSelect(res.data.id, res.data.nombre);
            setShowCrear(false);
            setIsOpen(false);
            setNuevoCliente({ tipo_identificacion: 'CEDULA', identificacion: '', nombre: '' });
            onToast({ message: `Cliente ${res.data.nombre} creado`, type: 'success' });
        } catch (err) {
            onToast({ message: err.response?.data?.error || 'Error al crear cliente', type: 'error' });
        } finally { setCreando(false); }
    };

    const resetear = () => {
        onSelect(1, 'CONSUMIDOR FINAL');
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <User size={14} className="text-slate-400 shrink-0" />
                    <span className={`truncate ${clienteId === 1 ? 'text-slate-400' : 'font-semibold text-slate-800'}`}>
                        {clienteNombre}
                    </span>
                </div>
                <ChevronDown size={14} className="text-slate-300 shrink-0" />
            </button>

            {isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl border border-slate-200 shadow-xl z-30 overflow-hidden animate-scale-in">
                    {/* Search input */}
                    <div className="p-2 border-b border-slate-100">
                        <input
                            type="text"
                            value={busquedaCliente}
                            onChange={e => setBusquedaCliente(e.target.value)}
                            placeholder="Buscar por cédula o nombre..."
                            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-brand-orange/25 placeholder:text-slate-300"
                            autoFocus
                        />
                    </div>

                    {/* CONSUMIDOR FINAL option */}
                    <button
                        onClick={resetear}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${clienteId === 1 ? 'bg-brand-orange/5 text-brand-orange' : 'text-slate-600'}`}
                    >
                        <span>CONSUMIDOR FINAL</span>
                        {clienteId === 1 && <CheckCircle size={14} className="text-brand-orange" />}
                    </button>

                    {/* Results */}
                    <div className="max-h-36 overflow-y-auto">
                        {buscando && <div className="p-3 text-center"><div className="w-4 h-4 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin mx-auto" /></div>}
                        {!buscando && resultados.filter(c => c.id !== 1).map(c => (
                            <button
                                key={c.id}
                                onClick={() => handleSelect(c)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors border-t border-slate-50 ${clienteId === c.id ? 'bg-brand-orange/5' : ''}`}
                            >
                                <span className="font-medium text-slate-800">{c.nombre}</span>
                                <span className="text-xs text-slate-400 ml-2">{c.tipo_identificacion}: {c.identificacion}</span>
                            </button>
                        ))}
                    </div>

                    {/* Create new client */}
                    <div className="border-t border-slate-100">
                        {!showCrear ? (
                            <button
                                onClick={() => setShowCrear(true)}
                                className="w-full text-left px-3 py-2.5 text-xs font-semibold text-brand-orange hover:bg-brand-orange/5 transition-colors flex items-center gap-1.5"
                            >
                                <Plus size={13} /> Crear cliente nuevo
                            </button>
                        ) : (
                            <div className="p-3 space-y-2">
                                <select
                                    value={nuevoCliente.tipo_identificacion}
                                    onChange={e => setNuevoCliente({ ...nuevoCliente, tipo_identificacion: e.target.value })}
                                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
                                >
                                    <option value="CEDULA">Cédula</option>
                                    <option value="RUC">RUC</option>
                                    <option value="PASAPORTE">Pasaporte</option>
                                    <option value="OTRO">Otro</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="Identificación *"
                                    value={nuevoCliente.identificacion}
                                    onChange={e => setNuevoCliente({ ...nuevoCliente, identificacion: e.target.value })}
                                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-orange/30"
                                />
                                <input
                                    type="text"
                                    placeholder="Nombre completo *"
                                    value={nuevoCliente.nombre}
                                    onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
                                    className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-brand-orange/30"
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => setShowCrear(false)} className="flex-1 text-xs py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg">Cancelar</button>
                                    <button
                                        onClick={handleCrear}
                                        disabled={creando}
                                        className="flex-1 text-xs py-1.5 bg-brand-orange text-white rounded-lg font-semibold hover:bg-brand-red disabled:opacity-50"
                                    >
                                        {creando ? '...' : 'Crear'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ====== Modal post-venta ====== */
const VentaExitosaModal = ({ ventaData, onClose }) => {
    if (!ventaData) return null;
    const { venta, cambio, cliente } = ventaData;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-scale-in text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                    <CheckCircle size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">¡Venta Registrada!</h3>
                <p className="text-sm text-slate-400 mb-4">#{String(venta.id).padStart(6, '0')}</p>

                <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total</span>
                        <span className="font-bold text-slate-800">${parseFloat(venta.total_factura).toFixed(2)}</span>
                    </div>
                    {venta.monto_recibido != null && (
                        <>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Recibido</span>
                                <span className="font-medium text-slate-700">${parseFloat(venta.monto_recibido).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                                <span className="font-bold text-emerald-700">Cambio</span>
                                <span className="font-bold text-emerald-700 text-lg">${cambio != null ? cambio.toFixed(2) : '0.00'}</span>
                            </div>
                        </>
                    )}
                    {cliente && cliente.id !== 1 && (
                        <div className="flex justify-between text-xs text-slate-400 border-t border-slate-100 pt-2">
                            <span>Cliente</span>
                            <span>{cliente.nombre}</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-gradient-to-r from-brand-orange to-brand-red text-white font-bold rounded-xl shadow-lg shadow-brand-orange/20 hover:shadow-xl active:scale-[0.98] transition-all"
                >
                    Continuar
                </button>
            </div>
        </div>
    );
};

/* ====== Main Component ====== */
const PosView = () => {
    // Stores
    const cart = useCartStore();
    const caja = useCajaStore();

    // State local
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [toast, setToast] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [showCerrar, setShowCerrar] = useState(false);
    const [showMovimiento, setShowMovimiento] = useState(false);
    const [loadingCaja, setLoadingCaja] = useState(false);
    const [showVentas, setShowVentas] = useState(false);
    const [ventasSesion, setVentasSesion] = useState([]);
    const [ventaExitosa, setVentaExitosa] = useState(null);
    const [reimprimiendo, setReimprimiendo] = useState(null);

    const searchInputRef = useRef(null);
    const debounceRef = useRef(null);
    const montoInputRef = useRef(null);

    // Cargar sesión activa al montar
    useEffect(() => {
        caja.fetchSesionActiva();
    }, []);

    // Buscar productos con debounce
    const searchProducts = useCallback(async (query) => {
        if (!query || query.length < 1) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await axios.get('/api/productos', {
                params: { q: query, limite: 15 }
            });
            setSearchResults(res.data.productos || []);
        } catch (err) {
            console.error('Error buscando productos:', err);
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchProducts(searchTerm);
        }, 250);
        return () => clearTimeout(debounceRef.current);
    }, [searchTerm, searchProducts]);

    // Handler para escáner
    const handleBarcodeScanned = async (code) => {
        setShowScanner(false);
        try {
            const res = await axios.get('/api/productos', { params: { q: code, limite: 1 } });
            const products = res.data.productos || [];
            if (products.length > 0) {
                cart.addItem(products[0]);
                setToast({ message: `${products[0].nombre} agregado`, type: 'success' });
            } else {
                setToast({ message: `Producto no encontrado: ${code}`, type: 'error' });
            }
        } catch (err) {
            setToast({ message: 'Error al buscar el producto escaneado', type: 'error' });
        }
    };

    // Agregar al carrito
    const handleAddToCart = (producto) => {
        // Validar stock para FISICO
        if (producto.tipo_item === 'FISICO') {
            const existingItem = cart.items.find(i => i.producto_id === producto.id);
            const currentQty = existingItem ? existingItem.cantidad : 0;
            if (currentQty >= producto.stock_actual) {
                setToast({ message: `Stock máximo alcanzado para ${producto.nombre}`, type: 'warning' });
                return;
            }
        }
        cart.addItem(producto);
        // Focus back to search
        searchInputRef.current?.focus();
    };

    // Cobrar
    const handleCobrar = async () => {
        if (cart.items.length === 0) return;

        // Validar monto recibido en efectivo
        if (cart.metodoPago === 'EFECTIVO') {
            const monto = parseFloat(cart.montoRecibido);
            if (isNaN(monto) || monto <= 0) {
                setToast({ message: 'Ingresa el monto recibido del cliente', type: 'error' });
                montoInputRef.current?.focus();
                return;
            }
            if (monto < total) {
                setToast({ message: 'El monto recibido es menor al total', type: 'error' });
                montoInputRef.current?.focus();
                return;
            }
        }

        setProcessing(true);
        try {
            const payload = cart.getPayload();
            const res = await axios.post('/api/ventas', payload);
            setVentaExitosa(res.data);
            cart.clear();
            setSearchTerm('');
            setSearchResults([]);
            // Refresh sesión para actualizar totales
            caja.fetchSesionActiva();
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al procesar la venta';
            setToast({ message: msg, type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    // Reimprimir ticket
    const handleReimprimir = async (ventaId) => {
        setReimprimiendo(ventaId);
        try {
            await axios.post(`/api/ventas/${ventaId}/reimprimir`);
            setToast({ message: `Ticket #${ventaId} enviado a imprimir`, type: 'success' });
        } catch (err) {
            setToast({ message: err.response?.data?.error || 'Error al reimprimir', type: 'error' });
        } finally {
            setReimprimiendo(null);
        }
    };

    // Abrir caja
    const handleAbrirCaja = async (saldoInicial) => {
        setLoadingCaja(true);
        const result = await caja.abrirCaja(saldoInicial);
        setLoadingCaja(false);
        if (result.success) {
            setToast({ message: 'Caja abierta exitosamente', type: 'success' });
        } else {
            setToast({ message: result.error, type: 'error' });
        }
    };

    // Cerrar caja
    const handleCerrarCaja = async (saldoReal) => {
        setLoadingCaja(true);
        const result = await caja.cerrarCaja(saldoReal);
        setLoadingCaja(false);
        setShowCerrar(false);
        if (result.success) {
            cart.clear();
            setToast({ message: 'Caja cerrada correctamente', type: 'success' });
        } else {
            setToast({ message: result.error, type: 'error' });
        }
    };

    // Registrar movimiento
    const handleMovimiento = async (tipo, monto, descripcion) => {
        setLoadingCaja(true);
        const result = await caja.registrarMovimiento(tipo, monto, descripcion);
        setLoadingCaja(false);
        setShowMovimiento(false);
        if (result.success) {
            setToast({ message: 'Movimiento registrado', type: 'success' });
        } else {
            setToast({ message: result.error, type: 'error' });
        }
    };

    // Cargar ventas de sesión
    const handleShowVentas = async () => {
        if (!caja.sesionActiva) return;
        try {
            const res = await axios.get(`/api/ventas/sesion/${caja.sesionActiva.id}`);
            setVentasSesion(res.data);
            setShowVentas(true);
        } catch (err) {
            setToast({ message: 'Error cargando ventas', type: 'error' });
        }
    };

    // Cálculos del carrito
    const subtotal0 = cart.getSubtotalBase0();
    const subtotalIVA = cart.getSubtotalBaseIVA();
    const montoIVA = cart.getMontoIVA();
    const total = cart.getTotal();
    const itemCount = cart.getItemCount();
    const cambio = cart.getCambio();

    // --- Si caja está cargando ---
    if (caja.isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center animate-fade-in">
                <div className="text-center">
                    <div className="w-10 h-10 border-3 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-slate-400 mt-4">Cargando caja...</p>
                </div>
            </div>
        );
    }

    // --- Si NO hay caja abierta ---
    if (!caja.sesionActiva) {
        return (
            <>
                <AbrirCajaModal onAbrir={handleAbrirCaja} loading={loadingCaja} />
                {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            </>
        );
    }

    // --- Sesión de caja activa: Vista POS ---
    return (
        <div className="flex flex-col lg:flex-row h-full animate-fade-in">
            {/* ====== PANEL IZQUIERDO: Búsqueda ====== */}
            <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-slate-200/80">
                {/* Header de caja */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                            Caja Abierta
                        </span>
                        <span className="text-xs text-slate-400">
                            desde {new Date(caja.sesionActiva.fecha_apertura).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleShowVentas}
                            className="text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors font-medium"
                            title="Ver ventas de esta sesión"
                        >
                            Ventas
                        </button>
                        <button
                            onClick={() => setShowMovimiento(true)}
                            className="text-xs px-3 py-1.5 rounded-lg text-brand-orange hover:bg-brand-orange/5 transition-colors font-medium flex items-center gap-1"
                        >
                            <ArrowDownUp size={13} /> Mov.
                        </button>
                        <button
                            onClick={() => setShowCerrar(true)}
                            className="text-xs px-3 py-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors font-medium flex items-center gap-1"
                        >
                            <LogOut size={13} /> Cerrar
                        </button>
                    </div>
                </div>

                {/* Barra de búsqueda */}
                <div className="p-4 pb-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400" />
                        </div>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar producto por nombre o código..."
                            className="w-full pl-11 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-sm
                                       focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange
                                       transition-all duration-200 placeholder:text-slate-400 shadow-sm"
                            autoFocus
                        />
                        <button
                            onClick={() => setShowScanner(true)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-brand-orange transition-colors"
                            title="Escanear código de barras"
                        >
                            <ScanLine size={20} />
                        </button>
                    </div>
                </div>

                {/* Resultados de búsqueda */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {searching && (
                        <div className="text-center py-8">
                            <div className="w-6 h-6 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin mx-auto" />
                        </div>
                    )}

                    {!searching && searchResults.length === 0 && searchTerm && (
                        <div className="text-center py-12 text-slate-400">
                            <Package size={36} className="mx-auto mb-3 opacity-40" />
                            <p className="text-sm">No se encontraron productos</p>
                        </div>
                    )}

                    {!searching && searchResults.length === 0 && !searchTerm && (
                        <div className="text-center py-12 text-slate-300">
                            <Search size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm text-slate-400">Busca un producto para agregar al carrito</p>
                            <p className="text-xs text-slate-300 mt-1">O escanea un código de barras</p>
                        </div>
                    )}

                    {!searching && searchResults.length > 0 && (
                        <div className="space-y-2">
                            {searchResults.map(prod => {
                                const inCart = cart.items.find(i => i.producto_id === prod.id);
                                const stockInfo = prod.tipo_item === 'FISICO'
                                    ? `Stock: ${prod.stock_actual}`
                                    : prod.tipo_item === 'SERVICIO' ? '∞' : '';

                                return (
                                    <button
                                        key={prod.id}
                                        onClick={() => handleAddToCart(prod)}
                                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 group
                                            ${inCart
                                                ? 'border-brand-orange/20 bg-brand-orange/5 hover:bg-brand-orange/5'
                                                : 'border-slate-100 bg-white hover:border-brand-orange/20 hover:shadow-sm'
                                            }
                                            ${prod.tipo_item === 'FISICO' && prod.stock_actual <= 0
                                                ? 'opacity-50 cursor-not-allowed' : ''
                                            }
                                        `}
                                        disabled={prod.tipo_item === 'FISICO' && prod.stock_actual <= 0}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold text-slate-800 truncate">
                                                        {prod.nombre}
                                                    </span>
                                                    {inCart && (
                                                        <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-1.5 py-0.5 rounded-full">
                                                            ×{inCart.cantidad}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TipoBadge tipo={prod.tipo_item} />
                                                    {stockInfo && (
                                                        <span className={`text-[11px] font-medium ${prod.tipo_item === 'FISICO' && prod.stock_actual <= (prod.stock_minimo || 5)
                                                            ? 'text-amber-600' : 'text-slate-400'
                                                            }`}>
                                                            {stockInfo}
                                                        </span>
                                                    )}
                                                    {prod.codigo_barras && (
                                                        <span className="text-[10px] text-slate-300 font-mono">{prod.codigo_barras}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className="text-base font-bold text-slate-800">
                                                    ${parseFloat(prod.precio_venta).toFixed(2)}
                                                </span>
                                                <div className="w-8 h-8 rounded-lg bg-brand-orange/5 flex items-center justify-center text-brand-orange 
                                                                group-hover:bg-brand-orange group-hover:text-white transition-all duration-200">
                                                    <Plus size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ====== PANEL DERECHO: Carrito ====== */}
            <div className="w-full lg:w-[400px] xl:w-[420px] flex flex-col bg-white shrink-0">
                {/* Header carrito */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <ShoppingCart size={18} className="text-brand-orange" />
                        <span className="font-bold text-slate-800">Carrito</span>
                        {itemCount > 0 && (
                            <span className="text-xs font-bold text-white bg-brand-orange rounded-full w-5 h-5 flex items-center justify-center">
                                {itemCount}
                            </span>
                        )}
                    </div>
                    {cart.items.length > 0 && (
                        <button
                            onClick={() => cart.clear()}
                            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Items del carrito */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                    {cart.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300 py-12">
                            <ShoppingCart size={40} className="mb-3 opacity-30" />
                            <p className="text-sm text-slate-400">Carrito vacío</p>
                            <p className="text-xs text-slate-300 mt-1">Busca productos para agregar</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {cart.items.map(item => (
                                <div
                                    key={item.producto_id}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 animate-scale-in"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{item.nombre}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-slate-400">
                                                ${item.precio_venta.toFixed(2)}
                                                {item.graba_iva && <span className="text-brand-orange ml-1">+IVA</span>}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Controles de cantidad */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => cart.updateQty(item.producto_id, item.cantidad - 1)}
                                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center 
                                                       text-slate-500 hover:text-red-500 hover:border-red-200 transition-all"
                                        >
                                            <Minus size={13} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold text-slate-800 tabular-nums">
                                            {item.cantidad}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (item.tipo_item === 'FISICO' && item.cantidad >= item.stock_actual) {
                                                    setToast({ message: 'Stock máximo alcanzado', type: 'warning' });
                                                    return;
                                                }
                                                cart.updateQty(item.producto_id, item.cantidad + 1);
                                            }}
                                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center 
                                                       text-slate-500 hover:text-brand-orange hover:border-brand-orange/20 transition-all"
                                        >
                                            <Plus size={13} />
                                        </button>
                                    </div>

                                    {/* Subtotal + eliminar */}
                                    <div className="text-right shrink-0 w-16">
                                        <p className="text-sm font-bold text-slate-800 tabular-nums">
                                            ${(item.precio_venta * item.cantidad).toFixed(2)}
                                        </p>
                                        <button
                                            onClick={() => cart.removeItem(item.producto_id)}
                                            className="text-[10px] text-red-400 hover:text-red-600 font-medium transition-colors mt-0.5"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Resumen y cobro */}
                {cart.items.length > 0 && (
                    <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50/50">
                        {/* Desglose fiscal */}
                        <div className="space-y-1.5 text-sm">
                            {subtotal0 > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal 0%</span>
                                    <span className="tabular-nums">${subtotal0.toFixed(2)}</span>
                                </div>
                            )}
                            {subtotalIVA > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal IVA</span>
                                    <span className="tabular-nums">${subtotalIVA.toFixed(2)}</span>
                                </div>
                            )}
                            {montoIVA > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span>IVA ({cart.ivaPorcentaje}%)</span>
                                    <span className="tabular-nums">${montoIVA.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-lg text-slate-900">
                                <span>Total</span>
                                <span className="tabular-nums">${total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Selector de cliente */}
                        <ClienteSelector
                            clienteId={cart.clienteId}
                            clienteNombre={cart.clienteNombre}
                            onSelect={(id, nombre) => cart.setCliente(id, nombre)}
                            onToast={setToast}
                        />

                        {/* Método de pago */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => cart.setMetodoPago('EFECTIVO')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${cart.metodoPago === 'EFECTIVO'
                                    ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/30'
                                    : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <Banknote size={16} /> Efectivo
                            </button>
                            <button
                                onClick={() => cart.setMetodoPago('TRANSFERENCIA')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${cart.metodoPago === 'TRANSFERENCIA'
                                    ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500/30'
                                    : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <CreditCard size={16} /> Transfer.
                            </button>
                        </div>

                        {/* Monto recibido (solo efectivo) */}
                        {cart.metodoPago === 'EFECTIVO' && (
                            <div className="space-y-1.5">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign size={16} className="text-slate-400" />
                                    </div>
                                    <input
                                        ref={montoInputRef}
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={cart.montoRecibido}
                                        onChange={(e) => cart.setMontoRecibido(e.target.value)}
                                        placeholder="Monto recibido del cliente *"
                                        className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold
                                                   focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400
                                                   transition-all placeholder:text-slate-300 placeholder:font-normal tabular-nums"
                                    />
                                </div>
                                {cambio != null && cambio >= 0 && (
                                    <div className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                        <span className="text-sm font-semibold text-emerald-700">Cambio</span>
                                        <span className="text-lg font-bold text-emerald-700 tabular-nums">${cambio.toFixed(2)}</span>
                                    </div>
                                )}
                                {cambio != null && cambio < 0 && (
                                    <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                                        <span className="text-xs font-medium text-red-600">Monto insuficiente</span>
                                        <span className="text-sm font-bold text-red-600 tabular-nums">Falta: ${Math.abs(cambio).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Checkbox imprimir ticket */}
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={cart.imprimirTicket}
                                onChange={(e) => cart.setImprimirTicket(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-brand-orange focus:ring-brand-orange cursor-pointer"
                            />
                            <div className="flex items-center gap-1.5 text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
                                <Printer size={14} />
                                <span>Imprimir nota de venta</span>
                            </div>
                        </label>

                        {/* Botón cobrar */}
                        <button
                            onClick={handleCobrar}
                            disabled={processing || cart.items.length === 0}
                            className="w-full py-4 bg-gradient-to-r from-brand-orange to-brand-red text-white font-bold text-lg
                                       rounded-xl shadow-lg shadow-brand-orange/30 hover:shadow-xl hover:shadow-brand-orange/40
                                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                                       active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {processing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <DollarSign size={20} />
                                    COBRAR ${total.toFixed(2)}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* ====== MODALES ====== */}
            {showCerrar && (
                <CerrarCajaModal
                    sesion={caja.sesionActiva}
                    onCerrar={handleCerrarCaja}
                    onClose={() => setShowCerrar(false)}
                    loading={loadingCaja}
                />
            )}

            {showMovimiento && (
                <MovimientoCajaModal
                    onRegistrar={handleMovimiento}
                    onClose={() => setShowMovimiento(false)}
                    loading={loadingCaja}
                />
            )}

            <BarcodeScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScanSuccess={handleBarcodeScanned}
            />

            {/* Modal de ventas de la sesión */}
            {showVentas && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden animate-scale-in">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800">Ventas de la Sesión</h3>
                            <button onClick={() => setShowVentas(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh] p-4">
                            {ventasSesion.length === 0 ? (
                                <p className="text-center text-slate-400 text-sm py-8">No hay ventas registradas en esta sesión</p>
                            ) : (
                                <div className="space-y-2">
                                    {ventasSesion.map(v => (
                                        <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                                            <div>
                                                <span className="text-sm font-bold text-slate-800">
                                                    #{String(v.id).padStart(4, '0')}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-2">
                                                    {new Date(v.fecha_hora).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${v.estado === 'COMPLETADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                                        }`}>
                                                        {v.estado}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">{v.metodo_pago}</span>
                                                    <span className="text-[10px] text-slate-400">{v.total_items} ítems</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-base font-bold tabular-nums ${v.estado === 'ANULADA' ? 'text-red-400 line-through' : 'text-slate-800'
                                                    }`}>
                                                    ${parseFloat(v.total_factura).toFixed(2)}
                                                </span>
                                                {v.estado === 'COMPLETADA' && (
                                                    <button
                                                        onClick={() => handleReimprimir(v.id)}
                                                        disabled={reimprimiendo === v.id}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-orange hover:bg-brand-orange/5 transition-colors disabled:opacity-50"
                                                        title="Reimprimir ticket"
                                                    >
                                                        {reimprimiendo === v.id
                                                            ? <div className="w-4 h-4 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin" />
                                                            : <Printer size={15} />
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal post-venta exitosa */}
            <VentaExitosaModal
                ventaData={ventaExitosa}
                onClose={() => setVentaExitosa(null)}
            />

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
};

export default PosView;
