import { useState } from 'react';
import { DollarSign, Lock } from 'lucide-react';

const AbrirCajaModal = ({ onAbrir, loading }) => {
    const [saldo, setSaldo] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAbrir(parseFloat(saldo) || 0);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scale-in overflow-hidden">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-brand-orange to-brand-red p-6 text-white">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                        <Lock size={28} />
                    </div>
                    <h2 className="text-xl font-bold">Abrir Caja</h2>
                    <p className="text-indigo-100 text-sm mt-1">
                        Ingresa el saldo inicial para comenzar la jornada
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Saldo Inicial (Efectivo en caja)
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <DollarSign size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={saldo}
                            onChange={(e) => setSaldo(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-xl text-lg font-semibold
                                       focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange
                                       transition-all duration-200 placeholder:text-slate-300"
                            autoFocus
                        />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        Cuenta el efectivo físico antes de abrir. Puedes dejar en $0.00 si empiezas sin efectivo.
                    </p>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-6 w-full py-3.5 bg-gradient-to-r from-brand-orange to-brand-red text-white font-bold 
                                   rounded-xl shadow-lg shadow-brand-orange/30 hover:shadow-xl hover:shadow-brand-orange/40 
                                   transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                                   active:scale-[0.98] text-base"
                    >
                        {loading ? 'Abriendo...' : 'Abrir Caja'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AbrirCajaModal;
