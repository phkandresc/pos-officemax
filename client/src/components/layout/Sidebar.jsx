import { NavLink, useLocation } from 'react-router-dom';
import { ShoppingCart, PackageSearch, History, ChevronRight, Store, Users, Users2 } from 'lucide-react';

const navItems = [
    {
        to: '/pos',
        label: 'Caja',
        icon: ShoppingCart,
        description: 'Punto de venta',
        mobileLabel: 'Caja'
    },
    {
        to: '/inventario',
        label: 'Inventario',
        icon: PackageSearch,
        description: 'Catálogo y stock',
        mobileLabel: 'Inventario'
    },
    {
        to: '/kardex',
        label: 'Kardex',
        icon: History,
        description: 'Movimientos',
        mobileLabel: 'Kardex'
    },
    {
        to: '/clientes',
        label: 'Clientes',
        icon: Users,
        description: 'Base de clientes',
        mobileLabel: 'Clientes'
    },
    {
        to: '/usuarios',
        label: 'Usuarios y Roles',
        icon: Users2,
        description: 'Gestión de accesos',
        mobileLabel: 'Usuarios'
    }
];

import useAuthStore from '../../stores/useAuthStore';

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useAuthStore();

    // Filtrar elementos según el rol
    const filteredNavItems = navItems.filter(item => {
        if (user?.rol === 'CAJERO') {
            return ['/pos', '/clientes'].includes(item.to);
        }
        return true;
    });

    return (
        <>
            {/* ======= DESKTOP SIDEBAR (left) ======= */}
            <aside
                className="
                    hidden md:flex md:flex-col
                    md:w-[260px] md:min-w-[260px] md:min-h-screen
                    text-slate-300 shrink-0
                "
                style={{ background: 'linear-gradient(180deg, #000000 0%, #111111 100%)' }}
            >
                {/* Brand */}
                <div className="flex items-center gap-3 p-6 pb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-orange to-brand-red flex items-center justify-center shadow-lg shadow-brand-orange/30">
                        <Store size={22} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight">OfficeMax</h1>
                        <p className="text-[11px] text-brand-orange/70 font-medium tracking-wide uppercase">Sistema POS</p>
                    </div>
                </div>

                {/* Separator */}
                <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />

                {/* Navigation */}
                <nav className="flex flex-col p-4 pt-5 gap-1 flex-1">
                    {filteredNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.to;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={() => `
                                    group relative flex items-center justify-start
                                    gap-3 px-4 py-3
                                    rounded-xl
                                    transition-all duration-200 ease-out
                                    ${isActive
                                        ? 'bg-white/10 text-white shadow-lg shadow-brand-orange/10'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }
                                `}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-gradient-to-b from-brand-orange to-brand-red rounded-r-full" />
                                )}

                                <Icon
                                    size={20}
                                    className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-brand-orange' : 'text-slate-500 group-hover:text-brand-orange'}`}
                                />

                                <div className="flex items-center justify-between flex-1 min-w-0">
                                    <span className={`text-sm font-semibold transition-colors duration-200 ${isActive ? 'text-white' : ''}`}>
                                        {item.label}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-normal truncate ml-2">
                                        {item.description}
                                    </span>
                                </div>

                                {isActive && (
                                    <ChevronRight size={14} className="text-brand-orange/60 shrink-0" />
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Bottom */}
                <div className="mx-5 h-px bg-gradient-to-r from-transparent via-slate-600/50 to-transparent" />
                <div className="flex flex-col p-5 gap-3">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[11px] text-slate-600 font-medium">Papelería OfficeMax</p>
                        <p className="text-[10px] text-slate-700">v1.1.0 - Acceso Seguro</p>
                    </div>
                    
                    {/* Botón Cerrar Sesión Móvil/Desktop inferido en Sidebar (opcional, ya lo tiene arriba pero sirve) */}
                    <button 
                        onClick={logout}
                        className="text-[12px] font-medium text-slate-400 hover:text-white transition-colors text-left py-1"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* ======= MOBILE BOTTOM NAV ======= */}
            <nav
                className="
                    md:hidden fixed bottom-0 left-0 right-0 z-50
                    flex items-stretch
                    bg-white/95 backdrop-blur-lg
                    border-t border-slate-200/80
                    shadow-[0_-2px_10px_rgba(0,0,0,0.06)]
                    pb-[env(safe-area-inset-bottom)]
                "
            >
                {filteredNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={() => `
                                flex-1 flex flex-col items-center justify-center gap-0.5
                                py-2 pt-2.5
                                transition-colors duration-200
                                ${isActive
                                    ? 'text-brand-orange'
                                    : 'text-slate-400 active:text-slate-600'
                                }
                            `}
                        >
                            <div className={`relative ${isActive ? '' : ''}`}>
                                {isActive && (
                                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-brand-orange rounded-full" />
                                )}
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-semibold ${isActive ? 'text-brand-orange' : 'text-slate-400'}`}>
                                {item.mobileLabel}
                            </span>
                        </NavLink>
                    );
                })}
            </nav>
        </>
    );
};

export default Sidebar;
