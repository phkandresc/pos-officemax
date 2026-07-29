import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, ArrowRightLeft, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const CerrarCajaModal = ({ sesion, onCerrar, onClose, loading }) => {
    const [saldoReal, setSaldoReal] = useState('');
    const [resumen, setResumen] = useState(null);
    const [loadingResumen, setLoadingResumen] = useState(true);

    useEffect(() => {
        const fetchResumen = async () => {
            try {
                const res = await axios.get(`/api/caja/${sesion.id}/resumen`);
                setResumen(res.data);
            } catch (err) {
                console.error('Error cargando resumen:', err);
            } finally {
                setLoadingResumen(false);
            }
        };
        fetchResumen();
    }, [sesion.id]);

    const saldoEsperado = resumen?.saldo_esperado ?? 0;
    const saldoRealNum = parseFloat(saldoReal) || 0;
    const diferencia = parseFloat((saldoRealNum - saldoEsperado).toFixed(2));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (saldoReal === '') return;
        onCerrar(saldoRealNum);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold">Cerrar Caja</h2>
                        <p className="text-amber-100 text-xs mt-0.5">
                            Abierta desde {new Date(sesion.fecha_apertura).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {loadingResumen ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-2 border-brand-orange/20 border-t-brand-orange rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-slate-400 mt-3">Cargando resumen...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-5">
                        {/* Resumen de la sesión */}
                        <div className="space-y-2 mb-5">
                            <ResumenRow
                                icon={<DollarSign size={15} />}
                                label="Saldo Inicial"
                                value={parseFloat(sesion.saldo_inicial)}
                                color="text-slate-600"
                            />
                            <ResumenRow
                                icon={<TrendingUp size={15} />}
                                label={`Ventas (${resumen?.ventas?.cantidad || 0})`}
                                value={parseFloat(sesion.total_ingresos_ventas)}
                                color="text-emerald-600"
                                positive
                            />
                            {resumen?.movimientos?.total_ingresos_extra > 0 && (
                                <ResumenRow
                                    icon={<TrendingUp size={15} />}
                                    label="Ingresos Extra"
                                    value={resumen.movimientos.total_ingresos_extra}
                                    color="text-emerald-600"
                                    positive
                                />
                            )}
                            {resumen?.movimientos?.total_egresos > 0 && (
                                <ResumenRow
                                    icon={<TrendingDown size={15} />}
                                    label="Egresos"
                                    value={resumen.movimientos.total_egresos}
                                    color="text-red-600"
                                    negative
                                />
                            )}
                            <div className="border-t border-slate-200 pt-2">
                                <ResumenRow
                                    icon={<ArrowRightLeft size={15} />}
                                    label="Saldo Esperado"
                                    value={saldoEsperado}
                                    color="text-brand-orange"
                                    bold
                                />
                            </div>
                        </div>

                        {/* Input saldo real */}
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Saldo Real (Conteo físico)
                        </label>
                        <div className="relative mb-3">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <DollarSign size={18} className="text-slate-400" />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={saldoReal}
                                onChange={(e) => setSaldoReal(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-lg font-semibold
                                           focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400
                                           transition-all duration-200 placeholder:text-slate-300"
                                autoFocus
                            />
                        </div>

                        {/* Diferencia */}
                        {saldoReal !== '' && (
                            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mb-5 ${diferencia === 0 ? 'bg-emerald-50 text-emerald-700' :
                                    diferencia > 0 ? 'bg-blue-50 text-blue-700' :
                                        'bg-red-50 text-red-700'
                                }`}>
                                {diferencia === 0 ? (
                                    <><CheckCircle size={16} /> Cuadre perfecto</>
                                ) : diferencia > 0 ? (
                                    <><TrendingUp size={16} /> Sobrante: ${diferencia.toFixed(2)}</>
                                ) : (
                                    <><AlertTriangle size={16} /> Faltante: ${Math.abs(diferencia).toFixed(2)}</>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || saldoReal === ''}
                            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold 
                                       rounded-xl shadow-lg shadow-amber-500/30 hover:shadow-xl 
                                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                                       active:scale-[0.98]"
                        >
                            {loading ? 'Cerrando...' : 'Cerrar Caja'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const ResumenRow = ({ icon, label, value, color, positive, negative, bold }) => (
    <div className={`flex items-center justify-between py-1.5 ${bold ? 'font-bold text-base' : 'text-sm'}`}>
        <span className={`flex items-center gap-2 ${color}`}>
            {icon} {label}
        </span>
        <span className={`${color} font-semibold tabular-nums`}>
            {positive && '+'}{negative && '-'}${Math.abs(value).toFixed(2)}
        </span>
    </div>
);

export default CerrarCajaModal;
