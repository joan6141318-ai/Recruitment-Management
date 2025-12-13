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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`group flex items-center gap-4 px-6 py-5 rounded-[1.5rem] transition-all duration-500 mb-2 ${
          active 
            ? 'bg-black text-white shadow-xl shadow-black/20 scale-105' 
            : 'text-gray-400 hover:text-black hover:bg-white hover:shadow-card'
        }`}
      >
        <Icon size={24} strokeWidth={active ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
        <span className="font-black text-sm tracking-wide uppercase">{label}</span>
        {active && <ChevronRight size={16} className="ml-auto opacity-50" />}
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-lg px-6 py-5 flex justify-between items-center sticky top-0 z-30 border-b border-gray-100/50">
        <span className="font-black text-3xl tracking-tighter text-black">MOON.</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-black active:scale-90 transition-transform bg-gray-50 rounded-xl">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed md:static top-0 left-0 h-full w-80 bg-surface border-r border-gray-100 z-40 transform transition-transform duration-700 cubic-bezier(0.2, 0.8, 0.2, 1) flex flex-col p-8
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="mb-12 hidden md:block">
             <h1 className="font-black text-5xl tracking-tighter text-black mb-2">MOON.</h1>
             <div className="h-1 w-12 bg-primary rounded-full"></div>
          </div>

          <nav className="flex-1 py-4">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" />
              {user.rol === 'admin' && (
                <NavItem to="/reclutadores" icon={Users} label="Equipo" />
              )}
          </nav>

          {/* PERFIL PROTAGONISTA */}
          <div className="mt-auto pt-8 border-t border-gray-100">
             <div className="mb-6">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{user.rol}</p>
                {/* Nombre Masivo */}
                <h2 className="text-2xl font-black text-black leading-none break-words uppercase tracking-tight">
                    {user.nombre}
                </h2>
             </div>
             
             <button 
                onClick={onLogout} 
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-xs font-bold text-gray-400 transition-all uppercase tracking-widest group"
             >
                <span>Cerrar Sesión</span>
                <LogOut size={16} className="group-hover:translate-x-1 transition-transform"/>
             </button>
          </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 overflow-y-auto relative bg-background">
        <div className="max-w-[1400px] mx-auto p-6 md:p-12 pb-32">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-black text-white rounded-[2rem] shadow-2xl flex justify-around items-center p-5 z-20">
        <Link to="/" className={isActive('/') ? 'text-primary scale-110' : 'text-gray-500'}><LayoutDashboard size={26} strokeWidth={isActive('/') ? 3 : 2} /></Link>
        <Link to="/emisores" className={isActive('/emisores') ? 'text-primary scale-110' : 'text-gray-500'}><Radio size={26} strokeWidth={isActive('/emisores') ? 3 : 2}/></Link>
        {user.rol === 'admin' && <Link to="/reclutadores" className={isActive('/reclutadores') ? 'text-primary scale-110' : 'text-gray-500'}><Users size={26} strokeWidth={isActive('/reclutadores') ? 3 : 2}/></Link>}
      </div>
    </div>
  );
};

export default Layout;