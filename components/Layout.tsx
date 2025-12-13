import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, UserPlus, Moon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link
      to={to}
      onClick={() => setIsSidebarOpen(false)}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive(to) 
          ? 'bg-primary/10 text-primary font-medium' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  return (
    // FIX: h-[100dvh] usa la altura dinámica del viewport para evitar problemas con la barra de URL en móviles
    <div className="h-[100dvh] bg-gray-50 flex flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-30 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center">
            <span className="text-primary mr-1">Agencia</span>
            <span className="text-secondary">Moon</span>
        </h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 focus:outline-none">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar / Drawer */}
      <aside className={`
        fixed md:static top-0 left-0 h-[100dvh] md:h-full w-64 bg-white shadow-xl md:shadow-none z-40 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 mb-1">
             <div className="p-1.5 bg-primary/10 rounded-lg">
                <Moon size={20} className="text-primary fill-primary" />
             </div>
             <h1 className="text-2xl font-bold text-gray-900 tracking-tight hidden md:block">
                Agencia <span className="text-secondary">Moon</span>
             </h1>
          </div>
          <p className="text-xs text-gray-400 font-medium ml-10">Management Platform</p>

          <div className="mt-8 flex items-center space-x-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-primary font-bold text-lg shadow-sm">
              {user.nombre.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 truncate">{user.nombre}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{user.rol}</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/emisores" icon={Radio} label="Emisores" />
          
          {user.rol === 'admin' && (
            <NavItem to="/reclutadores" icon={Users} label="Reclutadores" />
          )}
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0 mb-safe">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-full w-full animate-fade-in scroll-smooth">
        <div className="max-w-5xl mx-auto pb-24 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link to="/" className={`flex flex-col items-center ${isActive('/') ? 'text-primary' : 'text-gray-400'}`}>
          <LayoutDashboard size={24} />
          <span className="text-[10px] mt-1 font-medium">Inicio</span>
        </Link>
        <Link to="/emisores" className={`flex flex-col items-center ${isActive('/emisores') ? 'text-primary' : 'text-gray-400'}`}>
          <Radio size={24} />
          <span className="text-[10px] mt-1 font-medium">Emisores</span>
        </Link>
         {user.rol === 'admin' ? (
             <Link to="/reclutadores" className={`flex flex-col items-center ${isActive('/reclutadores') ? 'text-primary' : 'text-gray-400'}`}>
             <Users size={24} />
             <span className="text-[10px] mt-1 font-medium">Equipo</span>
           </Link>
         ) : (
            <div className="w-8"></div> 
         )}
      </div>
    </div>
  );
};

export default Layout;