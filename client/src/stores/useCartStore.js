import { create } from 'zustand';

/**
 * Zustand Store para el carrito de compras del POS.
 * Maneja el estado del carrito, cálculos de IVA, método de pago,
 * selección de cliente, monto recibido y opción de impresión.
 */
const useCartStore = create((set, get) => ({
    // Estado
    items: [],
    metodoPago: 'EFECTIVO',
    ivaPorcentaje: 15.00, // Se sincroniza con el backend al cargar
    clienteId: 1, // 1 = CONSUMIDOR FINAL
    clienteNombre: 'CONSUMIDOR FINAL',
    montoRecibido: '',
    imprimirTicket: false, // Por defecto NO se imprime (decisión del usuario)

    // === Acciones ===

    /** Agrega un producto al carrito o incrementa su cantidad si ya existe */
    addItem: (producto) => {
        set((state) => {
            const existing = state.items.find(i => i.producto_id === producto.id);
            if (existing) {
                return {
                    items: state.items.map(i =>
                        i.producto_id === producto.id
                            ? { ...i, cantidad: i.cantidad + 1 }
                            : i
                    )
                };
            }
            return {
                items: [...state.items, {
                    producto_id: producto.id,
                    nombre: producto.nombre,
                    precio_venta: parseFloat(producto.precio_venta),
                    graba_iva: producto.graba_iva,
                    tipo_item: producto.tipo_item,
                    stock_actual: producto.stock_actual,
                    cantidad: 1
                }]
            };
        });
    },

    /** Elimina un producto del carrito */
    removeItem: (productoId) => {
        set((state) => ({
            items: state.items.filter(i => i.producto_id !== productoId)
        }));
    },

    /** Actualiza la cantidad de un ítem. Si qty <= 0, lo elimina */
    updateQty: (productoId, qty) => {
        if (qty <= 0) {
            get().removeItem(productoId);
            return;
        }
        set((state) => ({
            items: state.items.map(i =>
                i.producto_id === productoId
                    ? { ...i, cantidad: qty }
                    : i
            )
        }));
    },

    /** Limpia todo el carrito y resetea estados */
    clear: () => set({
        items: [],
        metodoPago: 'EFECTIVO',
        clienteId: 1,
        clienteNombre: 'CONSUMIDOR FINAL',
        montoRecibido: '',
        imprimirTicket: false
    }),

    /** Cambia el método de pago */
    setMetodoPago: (metodo) => set({ metodoPago: metodo }),

    /** Sincroniza el IVA desde el backend */
    setIVA: (porcentaje) => set({ ivaPorcentaje: porcentaje }),

    /** Establece el cliente seleccionado */
    setCliente: (id, nombre) => set({ clienteId: id, clienteNombre: nombre }),

    /** Establece el monto recibido */
    setMontoRecibido: (monto) => set({ montoRecibido: monto }),

    /** Alterna impresión de ticket */
    setImprimirTicket: (val) => set({ imprimirTicket: val }),

    // === Selectores derivados (computados al llamar) ===

    /** Subtotal de ítems con tarifa 0% */
    getSubtotalBase0: () => {
        return get().items
            .filter(i => !i.graba_iva)
            .reduce((acc, i) => acc + (i.precio_venta * i.cantidad), 0);
    },

    /** Subtotal de ítems que gravan IVA */
    getSubtotalBaseIVA: () => {
        return get().items
            .filter(i => i.graba_iva)
            .reduce((acc, i) => acc + (i.precio_venta * i.cantidad), 0);
    },

    /** Monto de IVA calculado */
    getMontoIVA: () => {
        const subtotalIVA = get().getSubtotalBaseIVA();
        return parseFloat((subtotalIVA * (get().ivaPorcentaje / 100)).toFixed(2));
    },

    /** Total de la factura */
    getTotal: () => {
        return parseFloat((get().getSubtotalBase0() + get().getSubtotalBaseIVA() + get().getMontoIVA()).toFixed(2));
    },

    /** Cantidad total de ítems */
    getItemCount: () => {
        return get().items.reduce((acc, i) => acc + i.cantidad, 0);
    },

    /** Calcula el cambio */
    getCambio: () => {
        const monto = parseFloat(get().montoRecibido);
        if (isNaN(monto) || monto <= 0) return null;
        return parseFloat((monto - get().getTotal()).toFixed(2));
    },

    /** Prepara los datos para enviar al backend */
    getPayload: () => {
        const state = get();
        const montoRecibido = parseFloat(state.montoRecibido);
        return {
            items: state.items.map(i => ({
                producto_id: i.producto_id,
                cantidad: i.cantidad
            })),
            metodo_pago: state.metodoPago,
            cliente_id: state.clienteId,
            monto_recibido: (!isNaN(montoRecibido) && montoRecibido > 0) ? montoRecibido : null,
            imprimir_ticket: state.imprimirTicket
        };
    }
}));

export default useCartStore;
