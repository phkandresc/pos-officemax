import { create } from 'zustand';
import axios from 'axios';

/**
 * Zustand Store para la sesión de caja.
 * Maneja el estado de apertura/cierre de caja.
 */
const useCajaStore = create((set, get) => ({
    // Estado
    sesionActiva: null,
    isLoading: true,

    // === Acciones ===

    /** Obtiene la sesión de caja activa desde el backend */
    fetchSesionActiva: async () => {
        try {
            set({ isLoading: true });
            const res = await axios.get('/api/caja/activa');
            set({ sesionActiva: res.data, isLoading: false });
            return res.data;
        } catch (err) {
            console.error('Error obteniendo sesión activa:', err);
            set({ sesionActiva: null, isLoading: false });
            return null;
        }
    },

    /** Abre una nueva sesión de caja */
    abrirCaja: async (saldoInicial) => {
        try {
            const res = await axios.post('/api/caja/abrir', {
                saldo_inicial: parseFloat(saldoInicial) || 0
            });
            set({ sesionActiva: res.data });
            return { success: true, data: res.data };
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al abrir la caja';
            return { success: false, error: msg };
        }
    },

    /** Cierra la sesión de caja activa */
    cerrarCaja: async (saldoFinalReal) => {
        try {
            const res = await axios.post('/api/caja/cerrar', {
                saldo_final_real: parseFloat(saldoFinalReal)
            });
            set({ sesionActiva: null });
            return { success: true, data: res.data };
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al cerrar la caja';
            return { success: false, error: msg };
        }
    },

    /** Registra un movimiento extraordinario */
    registrarMovimiento: async (tipoMovimiento, monto, descripcion) => {
        try {
            const res = await axios.post('/api/caja/movimiento', {
                tipo_movimiento: tipoMovimiento,
                monto: parseFloat(monto),
                descripcion
            });
            return { success: true, data: res.data };
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al registrar movimiento';
            return { success: false, error: msg };
        }
    },

    /** Obtiene el resumen para cuadre de la sesión activa */
    getResumen: async () => {
        const sesion = get().sesionActiva;
        if (!sesion) return null;
        try {
            const res = await axios.get(`/api/caja/${sesion.id}/resumen`);
            return res.data;
        } catch (err) {
            console.error('Error obteniendo resumen:', err);
            return null;
        }
    }
}));

export default useCajaStore;
