import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, Moon } from 'lucide-react';
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

  // Items de navegación
  const navItems = [
      { to: "/", icon: LayoutDashboard, label: "Panel Principal" },
      { to: "/emisores", icon: Radio, label: "Emisores" },
      ...(user.rol === 'admin' ? [{ to: "/reclutadores", icon: Users, label: "Equipo" }] : [])
  ];

  // Link Navbar Inferior
  const BottomNavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 relative ${
          active ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-primaryLight text-primary -translate-y-1' : ''}`}>
             <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className={`text-[10px] font-bold mt-1 ${active ? 'text-primary' : ''}`}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background font-sans text-black pb-24">
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-5 py-3 flex justify-between items-center shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-2 -ml-2 hover:bg-gray-50 rounded-xl transition-colors text-black"
          >
              <Menu size={24} strokeWidth={2} />
          </button>
          
          <div className="flex flex-col items-center">
              <span className="text-[10px] font-black tracking-[0.2em] uppercase text-primary">Agencia</span>
              <span className="text-sm font-black text-black leading-none">MOON</span>
          </div>

          <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-900/20">
             <span className="text-xs font-bold">{user.nombre.charAt(0).toUpperCase()}</span>
          </div>
      </header>

      {/* 2. SIDEBAR (MENÚ HAMBURGUESA) */}
      {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
              <div 
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setIsSidebarOpen(false)}
              ></div>
              
              <div className="relative w-[280px] bg-white h-full shadow-2xl flex flex-col animate-slide-right">
                  {/* Perfil Header */}
                  <div className="p-6 pt-10 pb-6 border-b border-gray-100 bg-gray-50">
                       <div className="flex justify-between items-start mb-4">
                           <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg">
                               <Moon size={24} fill="currentColor" />
                           </div>
                           <button onClick={() => setIsSidebarOpen(false)} className="bg-white p-1 rounded-full shadow-sm text-gray-400">
                               <X size={20} />
                           </button>
                       </div>
                       <h2 className="text-xl font-black text-black tracking-tight">{user.nombre}</h2>
                       <p className="text-xs text-gray-500 font-medium mb-3">{user.correo}</p>
                       <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                           user.rol === 'admin' ? 'bg-black text-white' : 'bg-primary text-white'
                       }`}>
                           {user.rol === 'admin' ? 'Administrador' : 'Reclutador'}
                       </span>
                  </div>
                  
                  {/* Navegación Lateral */}
                  <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                      <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Menú Principal</p>
                      {navItems.map((item) => (
                          <Link 
                            key={item.to}
                            to={item.to} 
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                                isActive(item.to) 
                                ? 'bg-primaryLight text-primary font-bold shadow-sm' 
                                : 'text-gray-600 hover:bg-gray-50 font-medium'
                            }`}
                          >
                              <item.icon size={22} strokeWidth={isActive(item.to) ? 2.5 : 2} />
                              <span className="text-sm">{item.label}</span>
                          </Link>
                      ))}
                  </div>

                  {/* Footer Logout */}
                  <div className="p-6 border-t border-gray-100">
                      <button 
                          onClick={onLogout} 
                          className="flex items-center w-full text-left bg-gray-50 hover:bg-red-50 text-black hover:text-red-600 p-4 rounded-xl transition-all group border border-gray-100 hover:border-red-100"
                      >
                          <LogOut size={20} className="mr-3 text-gray-400 group-hover:text-red-500" />
                          <span className="text-sm font-bold">Cerrar Sesión</span>
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 3. MAIN CONTENT */}
      <main className="px-4 py-6 max-w-3xl mx-auto">
          {children}
      </main>

      {/* 4. BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-safe pt-2 px-6 flex justify-between items-center h-[80px] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          {navItems.map(item => (
              <BottomNavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
      </nav>

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
      `}</style>
    </div>
  );
};

export default Layout;