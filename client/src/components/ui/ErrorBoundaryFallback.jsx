import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export function ErrorBoundaryFallback({ error, resetErrorBoundary }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border-t-4 border-brand-red">
                <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-brand-red" />
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    ¡Algo salió mal!
                </h1>
                
                <p className="text-gray-500 mb-6">
                    Ha ocurrido un error inesperado en la interfaz. El estado del sistema se ha protegido.
                </p>

                <div className="bg-gray-100 rounded-lg p-4 mb-8 text-left overflow-auto max-h-32 text-sm font-mono text-gray-700">
                    {error.message}
                </div>

                <button
                    onClick={resetErrorBoundary}
                    className="w-full flex items-center justify-center gap-2 bg-brand-orange text-white py-3 px-6 rounded-xl font-medium hover:bg-brand-red transition-colors duration-200"
                >
                    <RefreshCcw className="w-5 h-5" />
                    Recargar la página
                </button>
            </div>
        </div>
    );
}
