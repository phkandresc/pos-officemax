import { useState } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const MovimientoCajaModal = ({ onRegistrar, onClose, loading }) => {
    const [tipo, setTipo] = useState('EGRESO');
    const [monto, setMonto] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!monto || !descripcion.trim()) return;
        onRegistrar(tipo, parseFloat(monto), descripcion.trim());
    };

    const isEgreso = tipo === 'EGRESO';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scale-in overflow-hidden">
                {/* Header */}
                <div className={`p-5 text-white flex items-center justify-between ${isEgreso
                        ? 'bg-gradient-to-r from-red-500 to-rose-500'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            {isEgreso ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Movimiento de Caja</h2>
                            <p className="text-white/70 text-xs">Registro de ingreso/egreso extraordinario</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5">
                    {/* Tipo */}
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo de Movimiento</label>
                    <div className="flex gap-2 mb-4">
                        <button
                            type="button"
                            onClick={() => setTipo('EGRESO')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${isEgreso
                                    ? 'bg-red-50 text-red-700 ring-2 ring-red-500/30'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                        >
                            <TrendingDown size={16} /> Egreso
                        </button>
                        <button
                            type="button"
                            onClick={() => setTipo('INGRESO_EXTRA')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${!isEgreso
                                    ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/30'
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                        >
                            <TrendingUp size={16} /> Ingreso Extra
                        </button>
                    </div>

                    {/* Monto */}
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Monto</label>
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <DollarSign size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-lg font-semibold
                                       focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange
                                       transition-all duration-200 placeholder:text-slate-300"
                            autoFocus
                        />
                    </div>

                    {/* Descripción */}
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción / Motivo</label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder={isEgreso ? 'Ej: Pago a proveedor, compra de suministros...' : 'Ej: Ingreso por préstamo, ajuste...'}
                        rows={2}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm
                                   focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange
                                   transition-all duration-200 placeholder:text-slate-400 resize-none"
                    />

                    <button
                        type="submit"
                        disabled={loading || !monto || !descripcion.trim()}
                        className={`mt-5 w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all duration-200 
                                    disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${isEgreso
                                ? 'bg-gradient-to-r from-red-500 to-rose-500 shadow-red-500/30'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30'
                            }`}
                    >
                        {loading ? 'Registrando...' : `Registrar ${isEgreso ? 'Egreso' : 'Ingreso'}`}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MovimientoCajaModal;
