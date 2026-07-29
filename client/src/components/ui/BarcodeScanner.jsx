import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';

const BarcodeScanner = React.memo(({ isOpen, onClose, onScanSuccess }) => {
    const scannerRef = useRef(null);
    const [scanError, setScanError] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5QrcodeScanner. ", error);
                });
                scannerRef.current = null;
            }
            return;
        }

        const config = {
            fps: 15, // Aumentamos fotogramas por segundo para detección más rápida
            qrbox: { width: 300, height: 120 }, // Caja más ancha (ideal para códigos de barras de retail)
            rememberLastUsedCamera: true,
            supportedScanTypes: [0], // 0 = Solo cámara
            videoConstraints: {
                facingMode: "environment",
                focusMode: "continuous", // Intentar forzar auto-enfoque continuo en móviles
                width: { ideal: 1920 }, // Solicitar mayor resolución para leer códigos pequeños
                height: { ideal: 1080 }
            }
        };

        const scanner = new Html5QrcodeScanner(
            "reader",
            config,
            /* verbose= */ false
        );

        scannerRef.current = scanner;

        const handleScan = (decodedText) => {
            if (scannerRef.current) {
                scannerRef.current.clear();
            }
            onScanSuccess(decodedText);
        };

        const handleError = (error) => {
            if (!error.includes('NotFound')) {
                console.warn(error);
                setScanError("Problemas accediendo a la cámara. Revisa los permisos.");
            }
        };

        scanner.render(handleScan, handleError);

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
            }
        };
    }, [isOpen, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg md:max-w-md overflow-hidden flex flex-col h-[90vh] md:h-auto max-h-[90vh] animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="px-5 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
                            <Camera size={18} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Escanear Código</h3>
                            <p className="text-xs text-slate-400">Lectura automática por cámara</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-300 hover:text-slate-500 hover:bg-slate-50 p-1.5 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </header>

                <div className="p-4 flex-1 overflow-y-auto">
                    {scanError && (
                        <div className="mb-4 bg-amber-50 text-amber-700 p-3.5 rounded-xl text-sm flex items-start gap-2 border border-amber-100">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{scanError}</span>
                        </div>
                    )}

                    <p className="text-xs text-slate-400 mb-4 text-center font-medium">
                        Apunta la cámara al código de barras. La lectura es automática.
                    </p>

                    <div id="reader" className="w-full bg-slate-50 rounded-xl overflow-hidden min-h-[300px] flex-1 flex flex-col justify-center border border-slate-100" style={{ border: 'none' }}></div>
                </div>
            </div>
        </div>
    );
});

export default BarcodeScanner;
