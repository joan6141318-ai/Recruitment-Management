import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Navigation Items
  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${
          active ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <Icon size={24} strokeWidth={active ? 2.5 : 1.5} className="mb-1" />
        <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-900 pb-24">
      
      {/* 1. HEADER - Minimalista y Limpio */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-5 py-4 flex justify-between items-center">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors text-gray-700"
          >
              <Menu size={22} strokeWidth={1.5} />
          </button>
          
          <div className="text-center">
              <span className="text-xs font-bold tracking-widest uppercase text-gray-900">Agencia Moon</span>
          </div>

          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
             <span className="text-xs font-bold text-gray-700">{user.nombre.charAt(0).toUpperCase()}</span>
          </div>
      </header>

      {/* 2. SIDEBAR (Perfil y Ajustes) - Estilo iOS/Moderno */}
      {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
              {/* Backdrop */}
              <div 
                  className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
                  onClick={() => setIsSidebarOpen(false)}
              ></div>
              
              {/* Drawer Content */}
              <div className="relative w-[280px] bg-white h-full shadow-2xl flex flex-col animate-slide-right">
                  <div className="p-6 pt-12 pb-8 border-b border-gray-50">
                       <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">{user.nombre}</h2>
                       <p className="text-sm text-gray-500 font-medium">{user.correo}</p>
                       <div className={`mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                           user.rol === 'admin' ? 'bg-gray-900 text-white' : 'bg-purple-50 text-purple-700'
                       }`}>
                           {user.rol === 'admin' ? 'Administrador' : 'Reclutador'}
                       </div>
                  </div>
                  
                  <div className="flex-1 py-4">
                      {/* Aquí podrían ir opciones futuras como "Ajustes", "Ayuda", etc. */}
                      <div className="px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Cuenta</div>
                  </div>

                  <div className="p-6 border-t border-gray-50">
                      <button 
                          onClick={onLogout} 
                          className="flex items-center w-full text-left text-red-600 hover:bg-red-50 p-3 rounded-lg transition-colors group"
                      >
                          <LogOut size={18} className="mr-3" />
                          <span className="text-sm font-semibold">Cerrar Sesión</span>
                          <ChevronRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 text-red-400" />
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 3. MAIN CONTENT */}
      <main className="px-5 py-6 max-w-2xl mx-auto">
          {children}
      </main>

      {/* 4. BOTTOM NAVIGATION - Flotante o Fija muy limpia */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-safe pt-2 px-6 flex justify-between items-center h-[80px]">
          <NavItem to="/" icon={LayoutDashboard} label="Inicio" />
          <NavItem to="/emisores" icon={Radio} label="Emisores" />
          {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo" />}
      </nav>

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        @keyframes slide-right {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
        }
        .animate-slide-right { animation: slide-right 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default Layout;