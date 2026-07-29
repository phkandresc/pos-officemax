import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import InventarioView from './pages/inventario/InventarioView';
import KardexView from './pages/inventario/KardexView';
import PosView from './pages/pos/PosView';
import ClientesView from './pages/clientes/ClientesView';
import UsuariosView from './pages/usuarios/UsuariosView';
import LoginView from './pages/auth/LoginView';
import ProtectedRoute from './components/auth/ProtectedRoute';
import useAuthStore from './stores/useAuthStore';
import { useState, useEffect } from 'react';

// Header superior — solo visible en desktop, simplificado en mobile

const TopHeader = () => {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const getPageTitle = () => {
        switch (location.pathname) {
            case '/pos': return 'Caja Registradora';
            case '/inventario': return 'Gestión de Catálogo';
            case '/kardex': return 'Kardex de Movimientos';
            case '/clientes': return 'Gestión de Clientes';
            case '/usuarios': return 'Usuarios y Roles';
            default: return 'Sistema POS';
        }
    };

    const getPageBreadcrumb = () => {
        switch (location.pathname) {
            case '/pos': return 'Ventas';
            case '/inventario': return 'Inventario';
            case '/kardex': return 'Inventario / Kardex';
            case '/clientes': return 'Clientes';
            case '/usuarios': return 'Administración / Usuarios';
            default: return 'Inicio';
        }
    };

    return (
        <header className="hidden md:flex h-14 border-b border-slate-200/80 bg-white/70 backdrop-blur-md items-center justify-between px-6 shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">{getPageBreadcrumb()}</span>
                <span className="text-slate-300">›</span>
                <span className="text-sm font-semibold text-slate-700">{getPageTitle()}</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 font-mono tracking-wider tabular-nums">
                    {time.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                {user && (
                    <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-bold text-slate-700">{user.nombre}</span>
                            <span className="text-[10px] font-medium text-brand-orange uppercase">{user.rol}</span>
                        </div>
                        <button 
                            onClick={logout}
                            title="Cerrar sesión"
                            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                        >
                            <span className="text-xs font-bold">{user.nombre.charAt(0)}</span>
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

function AppContent() {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<LoginView />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <div className="flex min-h-screen bg-[var(--bg-body)] font-sans text-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                <TopHeader />
                <main className="flex-1 relative overflow-y-auto pb-16 md:pb-0">
                    <Routes>
                        <Route path="/" element={<Navigate to="/pos" replace />} />
                        <Route path="/login" element={<Navigate to="/pos" replace />} />
                        <Route path="/pos" element={<ProtectedRoute><PosView /></ProtectedRoute>} />
                        <Route path="/inventario" element={<ProtectedRoute requiredRole="ADMINISTRADOR"><InventarioView /></ProtectedRoute>} />
                        <Route path="/kardex" element={<ProtectedRoute requiredRole="ADMINISTRADOR"><KardexView /></ProtectedRoute>} />
                        <Route path="/clientes" element={<ProtectedRoute><ClientesView /></ProtectedRoute>} />
                        <Route path="/usuarios" element={<ProtectedRoute requiredRole="ADMINISTRADOR"><UsuariosView /></ProtectedRoute>} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
