import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, AlertCircle, ArrowUpDown, ArrowDownRight, ArrowUpRight, ArrowRightLeft } from 'lucide-react';

const API_URL = '/api/inventario/movimiento';

const MovimientoStockModal = ({ isOpen, productoId, productoNombre, stockActual, onClose, onGuardado }) => {
    const [tipoMovimiento, setTipoMovimiento] = useState('ENTRADA');
    const [cantidad, setCantidad] = useState('');
    const [motivo, setMotivo] = useState('');
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState(null);

    // Resetear formulario al abrir el modal
    useEffect(() => {
        if (isOpen) {
            setTipoMovimiento('ENTRADA');
            setCantidad('');
            setMotivo('');
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const cantNum = parseInt(cantidad, 10);
        if (isNaN(cantNum) || cantNum <= 0) {
            setError("La cantidad debe ser un número mayor a cero.");
            return;
        }

        if (tipoMovimiento === 'SALIDA' && cantNum > stockActual) {
            setError(`No se puede retirar más de lo que existe. Stock actual: ${stockActual}`);
            return;
        }

        setGuardando(true);
        try {
            await axios.post(API_URL, {
                producto_id: productoId,
                tipo_movimiento: tipoMovimiento,
                cantidad: cantNum,
                motivo: motivo
            });
            onGuardado();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || "Error al registrar el movimiento de stock.");
        } finally {
            setGuardando(false);
        }
    };

    const tipos = [
        { value: 'ENTRADA', label: 'Entrada', sublabel: 'Agregar', icon: ArrowDownRight, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', activeBg: 'bg-emerald-100' },
        { value: 'SALIDA', label: 'Salida', sublabel: 'Retirar', icon: ArrowUpRight, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', activeBg: 'bg-red-100' },
        { value: 'AJUSTE', label: 'Ajuste', sublabel: 'Corregir', icon: ArrowRightLeft, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', activeBg: 'bg-amber-100' }
    ];

    const cantNum = parseInt(cantidad, 10);
    const previewStock = !isNaN(cantNum) && cantNum > 0
        ? tipoMovimiento === 'ENTRADA' ? stockActual + cantNum
            : tipoMovimiento === 'SALIDA' ? stockActual - cantNum
                : cantNum
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-xl overflow-hidden animate-slide-up md:animate-scale-in max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="px-5 md:px-6 py-4 md:py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                            <ArrowUpDown size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-base md:text-lg font-bold text-slate-800">Ajustar Stock</h3>
                            <p className="text-[11px] md:text-xs text-slate-400 truncate max-w-[200px] md:max-w-[240px]" title={productoNombre}>
                                {productoNombre}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-300 hover:text-slate-500 hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </header>

                <div className="p-5 md:p-6 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-sm flex items-start gap-2 border border-red-100 font-medium">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Current Stock Display */}
                    <div className="mb-4 md:mb-5 bg-slate-50 p-3.5 md:p-4 rounded-xl flex justify-between items-center border border-slate-100">
                        <span className="text-sm text-slate-500 font-medium">Stock Actual</span>
                        <span className="text-2xl md:text-3xl font-extrabold text-slate-800 tabular-nums">{stockActual}</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                        {/* Movement Type — Card selector */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                                Tipo de Movimiento
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {tipos.map(t => {
                                    const Icon = t.icon;
                                    const isSelected = tipoMovimiento === t.value;
                                    return (
                                        <button
                                            key={t.value}
                                            type="button"
                                            onClick={() => setTipoMovimiento(t.value)}
                                            className={`
                                                flex flex-col items-center gap-0.5 md:gap-1 p-2.5 md:p-3 rounded-xl text-center transition-all duration-200 border
                                                ${isSelected
                                                    ? `${t.activeBg} ${t.border} ${t.color} shadow-sm`
                                                    : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 active:bg-slate-100'
                                                }
                                            `}
                                        >
                                            <Icon size={18} className={isSelected ? t.color : 'text-slate-300'} />
                                            <span className="text-xs font-bold">{t.label}</span>
                                            <span className="text-[9px] md:text-[10px] font-normal opacity-70">{t.sublabel}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cantidad */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                Cantidad
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                placeholder={tipoMovimiento === 'AJUSTE' ? 'Nuevo stock real' : 'Cantidad a mover'}
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm bg-white focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>

                        {/* Stock Preview */}
                        {previewStock !== null && (
                            <div className="flex items-center justify-between bg-brand-orange/5 p-3 rounded-xl border border-brand-orange/15 animate-slide-up">
                                <span className="text-xs font-medium text-brand-orange">Stock resultante:</span>
                                <span className={`text-lg md:text-xl font-extrabold tabular-nums ${previewStock < 0 ? 'text-red-600' : 'text-brand-orange'}`}>
                                    {previewStock}
                                </span>
                            </div>
                        )}

                        {/* Motivo */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                Motivo <span className="normal-case font-normal text-slate-400">(Opcional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Ej. Inventario físico, Producto dañado"
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                className="w-full border border-slate-200 rounded-xl py-2.5 px-4 text-sm bg-white focus:ring-2 focus:ring-brand-orange/25 focus:border-brand-orange/40 outline-none transition-all placeholder:text-slate-300"
                            />
                        </div>

                        {/* Footer */}
                        <div className="pt-3 md:pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto px-5 py-2.5 text-sm text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-center"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={guardando}
                                className="w-full sm:w-auto bg-gradient-to-r from-brand-orange to-brand-red hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md shadow-brand-orange/20 transition-all active:scale-[0.97] disabled:shadow-none"
                            >
                                <Save size={16} />
                                {guardando ? 'Guardando...' : 'Confirmar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MovimientoStockModal;
