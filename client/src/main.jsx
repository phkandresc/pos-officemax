import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './services/api'; // Inicializar interceptores globalmente

import { ErrorBoundary } from 'react-error-boundary';
import { ErrorBoundaryFallback } from './components/ui/ErrorBoundaryFallback';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary FallbackComponent={ErrorBoundaryFallback} onReset={() => window.location.reload()}>
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
)
