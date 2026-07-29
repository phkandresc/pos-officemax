/**
 * Servicio de Impresión de Tickets — Epson TM-U220D (ESC/POS)
 * 
 * Modo dual:
 * - PRINTER_ENABLED=true  → Envía comandos ESC/POS reales al puerto USB/COM.
 * - PRINTER_ENABLED=false → Imprime un ticket formateado en la consola (mock).
 * 
 * Configuración de hardware vía .env:
 *   PRINTER_ENABLED, PRINTER_INTERFACE, PRINTER_PORT, PRINTER_BAUD_RATE, PRINTER_WIDTH
 * 
 * Configuración del contenido del ticket vía .env:
 *   TICKET_NOMBRE_NEGOCIO, TICKET_RUC, TICKET_DIRECCION, TICKET_TELEFONO,
 *   TICKET_MENSAJE_PIE, TICKET_TIPO_DOCUMENTO, TICKET_ABRIR_CAJON
 * 
 * Dependencia: npm install node-thermal-printer
 */

const {
    ThermalPrinter,
    PrinterTypes,
    CharacterSet
} = require('node-thermal-printer');

// ============================================================
// CONFIGURACIÓN DE HARDWARE
// ============================================================

const PRINTER_ENABLED = process.env.PRINTER_ENABLED === 'true';
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE || 'serial';
const PRINTER_PORT = process.env.PRINTER_PORT || (process.platform === 'win32' ? 'COM3' : '/dev/usb/lp0');
const PRINTER_BAUD_RATE = parseInt(process.env.PRINTER_BAUD_RATE, 10) || 9600;
const ANCHO_TICKET = parseInt(process.env.PRINTER_WIDTH, 10) || 40;

// ============================================================
// CONFIGURACIÓN DEL CONTENIDO DEL TICKET
// ============================================================

const TICKET_CONFIG = {
    nombreNegocio: process.env.TICKET_NOMBRE_NEGOCIO || 'PAPELERIA OFFICEMAX',
    ruc: process.env.TICKET_RUC || '',
    direccion: process.env.TICKET_DIRECCION || 'Cuenca - Ecuador',
    telefono: process.env.TICKET_TELEFONO || '',
    mensajePie: process.env.TICKET_MENSAJE_PIE || 'Gracias por su compra!',
    tipoDocumento: process.env.TICKET_TIPO_DOCUMENTO || 'Nota de Venta',
    abrirCajon: process.env.TICKET_ABRIR_CAJON !== 'false', // true por defecto
};

// ============================================================
// FUNCIONES DE FORMATO
// ============================================================

function lineaTexto(char = '-') {
    return char.repeat(ANCHO_TICKET);
}

function centrarTexto(texto) {
    const espacios = Math.max(0, Math.floor((ANCHO_TICKET - texto.length) / 2));
    return ' '.repeat(espacios) + texto;
}

function columnasTexto(izq, der, ancho = ANCHO_TICKET) {
    const espacios = Math.max(1, ancho - izq.length - der.length);
    return izq + ' '.repeat(espacios) + der;
}

/** Quita acentos para compatibilidad con charset de impresoras térmicas */
function limpiarTexto(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// ============================================================
// CREAR INSTANCIA DE IMPRESORA
// ============================================================

function crearPrinter() {
    return new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: PRINTER_PORT,
        characterSet: CharacterSet.LATINA,
        removeSpecialCharacters: false,
        width: ANCHO_TICKET,
        options: {
            timeout: 5000
        }
    });
}

// ============================================================
// IMPRESIÓN REAL — Epson TM-U220D
// ============================================================

async function imprimirReal(venta, detalle, cliente = null) {
    const fecha = new Date(venta.fecha_hora);
    const fechaStr = fecha.toISOString().substring(0, 10);
    const horaStr = fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const printer = crearPrinter();

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
        console.error('⚠️  Impresora no conectada. Fallback a consola...');
        imprimirMock(venta, detalle, cliente);
        return;
    }

    try {
        // === ENCABEZADO ===
        printer.alignCenter();
        printer.println(limpiarTexto(TICKET_CONFIG.nombreNegocio));
        
        if (TICKET_CONFIG.ruc) {
            printer.println(`RUC: ${TICKET_CONFIG.ruc}`);
        }
        if (TICKET_CONFIG.direccion) {
            printer.println(limpiarTexto(TICKET_CONFIG.direccion));
        }
        if (TICKET_CONFIG.telefono) {
            printer.println(`Tel: ${TICKET_CONFIG.telefono}`);
        }
        printer.drawLine();

        // === DATOS DE LA VENTA ===
        printer.alignCenter();
        printer.println(`${limpiarTexto(TICKET_CONFIG.tipoDocumento.toUpperCase())} NRO: ${String(venta.id).padStart(9, '0')}`);
        
        printer.alignLeft();
        const clienteNombre = cliente && cliente.id !== 1 ? cliente.nombre : 'CONSUMIDOR FINAL';
        const clienteIdent = cliente && cliente.id !== 1 && cliente.identificacion ? cliente.identificacion : '9999999999999';
        const clienteDir = cliente && cliente.id !== 1 && cliente.direccion ? cliente.direccion : '';
        const clienteEmail = cliente && cliente.id !== 1 && cliente.email ? cliente.email : '';

        printer.println(limpiarTexto(`Cliente: ${clienteNombre}`));
        printer.println(`Ruc/CI : ${clienteIdent}`);
        printer.println(`Fecha  : ${fechaStr}  Hora: ${horaStr}`);
        if(clienteDir) printer.println(limpiarTexto(`Direccion: ${clienteDir}`));
        if(clienteEmail) printer.println(`Email: ${clienteEmail}`);

        // === DETALLE DE ÍTEMS ===
        printer.drawLine();
        printer.println('CANT  PROD                V.UNIT V.TOTAL');
        printer.drawLine();

        // Limite del ancho = 40.
        for (const item of detalle) {
            const nombre = limpiarTexto(item.nombre || `Producto #${item.producto_id}`).substring(0, 18);
            const cant = parseFloat(item.cantidad).toString().padStart(4, ' ');
            const pUnit = parseFloat(item.precio_unitario).toFixed(2).padStart(6, ' ');
            const sub = parseFloat(item.subtotal).toFixed(2).padStart(7, ' ');

            // Formato: 4 (CANT) + 2 + 18 (PROD) + 2 + 6 (V.UNIT) + 1 + 7 (V.TOTAL) = 40 chars
            printer.println(`${cant}  ${nombre.padEnd(18, ' ')}  ${pUnit} ${sub}`);
        }

        // === TOTALES ===
        printer.newLine();
        const totalBase0 = parseFloat(venta.subtotal_base_0).toFixed(2).padStart(7, ' ');
        const totalBaseIva = parseFloat(venta.subtotal_base_iva).toFixed(2).padStart(7, ' ');
        const totalMontoIva = parseFloat(venta.monto_iva).toFixed(2).padStart(7, ' ');
        const totalFactura = parseFloat(venta.total_factura).toFixed(2).padStart(7, ' ');
        const ivaPerc = parseFloat(venta.porcentaje_iva_aplicado).toFixed(0);

        const padLeftTot = ' '.repeat(Math.max(0, ANCHO_TICKET - 22)); 
        
        if (parseFloat(venta.subtotal_base_0) > 0) printer.println(`${padLeftTot}Subtotal 0%: ${totalBase0}`);
        printer.println(`${padLeftTot}Subtotal IVA: ${totalBaseIva}`);
        printer.println(`${padLeftTot}IVA ${ivaPerc.padEnd(2, ' ')}%:      ${totalMontoIva}`);
        printer.println(`${padLeftTot}Total:        ${totalFactura}`);

        // Monto recibido y cambio (solo efectivo)
        if (venta.monto_recibido != null) {
            printer.newLine();
            const montoRecibido = parseFloat(venta.monto_recibido).toFixed(2).padStart(7, ' ');
            const cambio = (parseFloat(venta.monto_recibido) - parseFloat(venta.total_factura)).toFixed(2).padStart(7, ' ');
            printer.println(`${padLeftTot}Recibido:     ${montoRecibido}`);
            printer.println(`${padLeftTot}CAMBIO:       ${cambio}`);
        }

        // === PIE ===
        printer.newLine();
        printer.alignCenter();
        if (TICKET_CONFIG.mensajePie) {
            printer.println(limpiarTexto(TICKET_CONFIG.mensajePie));
        }
        printer.println('DOCUMENTO SIN VALIDEZ TRIBUTARIA');

        // Avanzar papel y cortar
        printer.newLine();
        printer.newLine();
        printer.partialCut();

        // Abrir cajón de dinero (ESC p m t1 t2)
        if (TICKET_CONFIG.abrirCajon) {
            printer.raw(Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]));
        }

        await printer.execute();
        console.log(`🖨️  Ticket #${venta.id} impreso en ${PRINTER_PORT}`);
    } catch (err) {
        console.error('❌ Error imprimiendo ticket:', err.message);
        imprimirMock(venta, detalle, cliente);
    }
}

// ============================================================
// IMPRESIÓN MOCK — Consola
// ============================================================

function imprimirMock(venta, detalle, cliente = null) {
    const fecha = new Date(venta.fecha_hora);
    const fechaStr = fecha.toISOString().substring(0, 10);
    const horaStr = fecha.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const t = [];

    t.push(centrarTexto(limpiarTexto(TICKET_CONFIG.nombreNegocio)));
    if (TICKET_CONFIG.ruc) t.push(centrarTexto(`RUC: ${TICKET_CONFIG.ruc}`));
    if (TICKET_CONFIG.direccion) t.push(centrarTexto(limpiarTexto(TICKET_CONFIG.direccion)));
    if (TICKET_CONFIG.telefono) t.push(centrarTexto(`Tel: ${TICKET_CONFIG.telefono}`));
    t.push(lineaTexto('-'));

    t.push(centrarTexto(`${limpiarTexto(TICKET_CONFIG.tipoDocumento.toUpperCase())} NRO: ${String(venta.id).padStart(9, '0')}`));
    
    const clienteNombre = cliente && cliente.id !== 1 ? cliente.nombre : 'CONSUMIDOR FINAL';
    const clienteIdent = cliente && cliente.id !== 1 && cliente.identificacion ? cliente.identificacion : '9999999999999';
    const clienteDir = cliente && cliente.id !== 1 && cliente.direccion ? cliente.direccion : '';
    const clienteEmail = cliente && cliente.id !== 1 && cliente.email ? cliente.email : '';

    t.push(limpiarTexto(`Cliente: ${clienteNombre}`));
    t.push(`Ruc/CI : ${clienteIdent}`);
    t.push(`Fecha  : ${fechaStr}  Hora: ${horaStr}`);
    if(clienteDir) t.push(limpiarTexto(`Direccion: ${clienteDir}`));
    if(clienteEmail) t.push(`Email: ${clienteEmail}`);

    t.push(lineaTexto('-'));
    t.push('CANT  PROD                V.UNIT V.TOTAL');
    t.push(lineaTexto('-'));

    for (const item of detalle) {
        const nombre = limpiarTexto(item.nombre || `Producto #${item.producto_id}`).substring(0, 18);
        const cant = parseFloat(item.cantidad).toString().padStart(4, ' ');
        const pUnit = parseFloat(item.precio_unitario).toFixed(2).padStart(6, ' ');
        const sub = parseFloat(item.subtotal).toFixed(2).padStart(7, ' ');

        t.push(`${cant}  ${nombre.padEnd(18, ' ')}  ${pUnit} ${sub}`);
    }

    t.push('');
    const totalBase0 = parseFloat(venta.subtotal_base_0).toFixed(2).padStart(7, ' ');
    const totalBaseIva = parseFloat(venta.subtotal_base_iva).toFixed(2).padStart(7, ' ');
    const totalMontoIva = parseFloat(venta.monto_iva).toFixed(2).padStart(7, ' ');
    const totalFactura = parseFloat(venta.total_factura).toFixed(2).padStart(7, ' ');
    const ivaPerc = parseFloat(venta.porcentaje_iva_aplicado).toFixed(0);

    const padLeftTot = ' '.repeat(Math.max(0, ANCHO_TICKET - 22));
    
    if (parseFloat(venta.subtotal_base_0) > 0) t.push(`${padLeftTot}Subtotal 0%: ${totalBase0}`);
    t.push(`${padLeftTot}Subtotal IVA: ${totalBaseIva}`);
    t.push(`${padLeftTot}IVA ${ivaPerc.padEnd(2, ' ')}%:      ${totalMontoIva}`);
    t.push(`${padLeftTot}Total:        ${totalFactura}`);

    if (venta.monto_recibido != null) {
        t.push('');
        const montoRecibido = parseFloat(venta.monto_recibido).toFixed(2).padStart(7, ' ');
        const cambio = (parseFloat(venta.monto_recibido) - parseFloat(venta.total_factura)).toFixed(2).padStart(7, ' ');
        t.push(`${padLeftTot}Recibido:     ${montoRecibido}`);
        t.push(`${padLeftTot}CAMBIO:       ${cambio}`);
    }

    t.push('');
    if (TICKET_CONFIG.mensajePie) t.push(centrarTexto(limpiarTexto(TICKET_CONFIG.mensajePie)));
    t.push(centrarTexto('DOCUMENTO SIN VALIDEZ TRIBUTARIA'));
    t.push(lineaTexto('='));

    console.log('\n🖨️  [TICKET MOCK - Epson TM-U220D]');
    console.log(t.join('\n'));
}

// ============================================================
// TICKET DE PRUEBA
// ============================================================

/**
 * Imprime un ticket de prueba para verificar que la impresora funciona
 * y que el formato se ve correcto.
 */
async function imprimirTicketPrueba() {
    const ventaFake = {
        id: 0,
        fecha_hora: new Date().toISOString(),
        metodo_pago: 'EFECTIVO',
        subtotal_base_0: '2.50',
        subtotal_base_iva: '10.00',
        porcentaje_iva_aplicado: '15.00',
        monto_iva: '1.50',
        total_factura: '14.00'
    };

    const detalleFake = [
        {
            producto_id: 1,
            nombre: 'CUADERNO ACADEMICO 100H',
            cantidad: 2,
            precio_unitario: '3.50',
            subtotal: '7.00',
            aplico_iva: true
        },
        {
            producto_id: 2,
            nombre: 'ESFERO BIC PUNTA FINA',
            cantidad: 3,
            precio_unitario: '0.50',
            subtotal: '1.50',
            aplico_iva: true
        },
        {
            producto_id: 3,
            nombre: 'BORRADOR PELIKAN',
            cantidad: 1,
            precio_unitario: '0.75',
            subtotal: '0.75',
            aplico_iva: true
        },
        {
            producto_id: 4,
            nombre: 'COPIA B/N (TAMAÑO A4)',
            cantidad: 5,
            precio_unitario: '0.05',
            subtotal: '0.25',
            aplico_iva: false
        },
        {
            producto_id: 5,
            nombre: 'IMPRESION COLOR A4',
            cantidad: 3,
            precio_unitario: '0.75',
            subtotal: '2.25',
            aplico_iva: false
        }
    ];

    await imprimirTicket(ventaFake, detalleFake);
}

/**
 * Imprime un ticket de prueba directamente en la impresora real
 * para verificar alineación, caracteres y corte del papel.
 */
async function imprimirTestHardware() {
    if (!PRINTER_ENABLED) {
        console.log('⚠️  PRINTER_ENABLED=false. Usa el endpoint /api/printer/test-mock para ver el ticket en consola.');
        return { success: false, error: 'Impresora deshabilitada en .env' };
    }

    const printer = crearPrinter();

    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
        return { success: false, error: `Impresora no conectada en ${PRINTER_PORT}` };
    }

    try {
        printer.alignCenter();
        printer.bold(true);
        printer.println('=== TEST DE IMPRESORA ===');
        printer.bold(false);
        printer.println(limpiarTexto(TICKET_CONFIG.nombreNegocio));
        if (TICKET_CONFIG.direccion) printer.println(limpiarTexto(TICKET_CONFIG.direccion));
        if (TICKET_CONFIG.telefono) printer.println(`Tel: ${TICKET_CONFIG.telefono}`);
        if (TICKET_CONFIG.ruc) printer.println(`RUC: ${TICKET_CONFIG.ruc}`);
        printer.drawLine();

        printer.alignLeft();
        printer.println(`Ancho: ${ANCHO_TICKET} caracteres`);
        printer.println(`Puerto: ${PRINTER_PORT}`);
        printer.println(`Fecha: ${new Date().toLocaleString('es-EC')}`);
        printer.drawLine();

        // Test de alineación con columnas
        printer.bold(true);
        printer.println(columnasTexto('IZQUIERDA', 'DERECHA'));
        printer.bold(false);
        printer.println(columnasTexto('Item de prueba', '$99.99'));
        printer.println(columnasTexto('  @$10.00 *', '$99.99'));
        printer.drawLine('=');
        printer.bold(true);
        printer.println(columnasTexto('  TOTAL:', '$199.98'));
        printer.drawLine('=');
        printer.bold(false);
        printer.newLine();

        // Test de caracteres especiales
        printer.alignCenter();
        printer.println('Caracteres: 0123456789');
        printer.println('ABCDEFGHIJKLMNOPQRSTUV');
        printer.println('abcdefghijklmnopqrstuv');
        printer.println('$.,;:!?()-/#@%&*');
        printer.newLine();

        if (TICKET_CONFIG.mensajePie) {
            printer.println(limpiarTexto(TICKET_CONFIG.mensajePie));
        }
        printer.println('=== FIN DEL TEST ===');
        printer.newLine();
        printer.newLine();
        printer.newLine();
        printer.partialCut();

        await printer.execute();
        console.log('🖨️  Test de impresora ejecutado exitosamente');
        return { success: true, message: `Ticket de prueba impreso en ${PRINTER_PORT}` };
    } catch (err) {
        console.error('❌ Error en test de impresora:', err.message);
        return { success: false, error: err.message };
    }
}

// ============================================================
// FUNCIÓN PRINCIPAL
// ============================================================

async function imprimirTicket(venta, detalle, cliente = null) {
    if (PRINTER_ENABLED) {
        await imprimirReal(venta, detalle, cliente);
    } else {
        imprimirMock(venta, detalle, cliente);
    }
}

/** Devuelve la configuración actual del ticket (para debug/frontend) */
function getConfig() {
    return {
        hardware: {
            enabled: PRINTER_ENABLED,
            interface: PRINTER_INTERFACE,
            port: PRINTER_PORT,
            baudRate: PRINTER_BAUD_RATE,
            width: ANCHO_TICKET
        },
        ticket: { ...TICKET_CONFIG }
    };
}

module.exports = {
    imprimirTicket,
    imprimirTicketPrueba,
    imprimirTestHardware,
    getConfig
};
