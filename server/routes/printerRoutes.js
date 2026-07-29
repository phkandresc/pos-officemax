const express = require('express');
const router = express.Router();
const { imprimirTicketPrueba, imprimirTestHardware, getConfig } = require('../services/ticketService');

// GET /api/printer/config — Ver configuración actual de la impresora y ticket
router.get('/config', (req, res) => {
    res.json(getConfig());
});

// POST /api/printer/test-mock — Imprime un ticket de prueba en consola (siempre mock)
router.post('/test-mock', async (req, res) => {
    try {
        // Forzar modo mock para este test
        const originalEnabled = process.env.PRINTER_ENABLED;
        process.env.PRINTER_ENABLED = 'false';
        await imprimirTicketPrueba();
        process.env.PRINTER_ENABLED = originalEnabled;
        res.json({ success: true, message: 'Ticket de prueba impreso en consola del servidor' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/printer/test — Imprime un ticket de prueba en la impresora real
router.post('/test', async (req, res) => {
    try {
        await imprimirTicketPrueba();
        res.json({ success: true, message: 'Ticket de prueba enviado a la impresora' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/printer/test-hardware — Test básico de hardware (alineación, caracteres)
router.post('/test-hardware', async (req, res) => {
    try {
        const result = await imprimirTestHardware();
        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
