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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-200 ${
          active 
            ? 'bg-black text-white shadow-soft' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
        }`}
      >
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        <span className={`font-medium ${active ? 'tracking-wide' : ''}`}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] bg-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Mobile Header (Glass) */}
      <div className="md:hidden glass px-6 py-4 flex justify-between items-center sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Moon size={16} className="text-white fill-current" />
            </div>
            <span className="font-bold text-lg tracking-tight">Moon</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-black focus:outline-none">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed md:static top-0 left-0 h-[100dvh] md:h-full w-72 bg-white border-r border-gray-100 z-40 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 shrink-0">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
                <Moon size={20} className="text-white fill-current" />
             </div>
             <div>
                <h1 className="text-xl font-bold text-black tracking-tight leading-none">Agencia Moon</h1>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-1">Workspace</p>
             </div>
          </div>

          <div className="flex items-center space-x-3 bg-surface p-4 rounded-2xl border border-gray-50">
            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-black font-bold text-lg shadow-sm">
              {user.nombre.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-black truncate">{user.nombre}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{user.rol}</p>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-2 flex-1 overflow-y-auto">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/emisores" icon={Radio} label="Emisores" />
          {user.rol === 'admin' && (
            <NavItem to="/reclutadores" icon={Users} label="Equipo" />
          )}
        </nav>

        <div className="p-6 shrink-0 mb-safe">
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 px-5 py-3 w-full text-gray-400 hover:text-danger hover:bg-red-50 rounded-xl transition-all font-medium text-sm"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full w-full bg-white scroll-smooth relative">
        <div className="max-w-6xl mx-auto p-4 md:p-10 pb-24 md:pb-10 animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around p-2 pb-safe z-20 shadow-soft">
        <Link to="/" className={`flex flex-col items-center p-2 rounded-lg ${isActive('/') ? 'text-black' : 'text-gray-300'}`}>
          <LayoutDashboard size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
        </Link>
        <Link to="/emisores" className={`flex flex-col items-center p-2 rounded-lg ${isActive('/emisores') ? 'text-black' : 'text-gray-300'}`}>
          <Radio size={24} strokeWidth={isActive('/emisores') ? 2.5 : 2} />
        </Link>
         {user.rol === 'admin' && (
             <Link to="/reclutadores" className={`flex flex-col items-center p-2 rounded-lg ${isActive('/reclutadores') ? 'text-black' : 'text-gray-300'}`}>
             <Users size={24} strokeWidth={isActive('/reclutadores') ? 2.5 : 2} />
           </Link>
         )}
      </div>
    </div>
  );
};

export default Layout;