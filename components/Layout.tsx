import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X } from 'lucide-react';
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
        className={`group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-500 ${
          active 
            ? 'bg-black text-white shadow-lg shadow-black/20 scale-105' 
            : 'text-gray-400 hover:text-black hover:bg-gray-100'
        }`}
      >
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        <span className="font-bold text-sm tracking-wide">{label}</span>
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-lg px-6 py-4 flex justify-between items-center sticky top-0 z-30 border-b border-gray-100">
        <span className="font-black text-2xl tracking-tighter text-black">MOON</span>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-black active:scale-90 transition-transform">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed md:static top-0 left-0 h-full w-80 bg-surface border-r border-gray-100 z-40 transform transition-transform duration-700 cubic-bezier(0.2, 0.8, 0.2, 1) flex flex-col p-8
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="mb-16 hidden md:block">
             <h1 className="font-black text-4xl tracking-tighter text-black">MOON.</h1>
             <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.3em] mt-1">Agency</p>
          </div>

          <nav className="space-y-3 flex-1">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" />
              {user.rol === 'admin' && (
                <NavItem to="/reclutadores" icon={Users} label="Equipo" />
              )}
          </nav>

          <div className="mt-auto pt-8 border-t border-gray-100">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                    {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-sm font-bold text-black">{user.nombre}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{user.rol}</p>
                </div>
             </div>
             <button onClick={onLogout} className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest">
                <LogOut size={14} /> Salir
             </button>
          </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto p-6 md:p-12 pb-32">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-black text-white rounded-[2rem] shadow-2xl flex justify-around items-center p-4 z-20">
        <Link to="/" className={isActive('/') ? 'text-primary' : 'text-gray-500'}><LayoutDashboard size={24} /></Link>
        <Link to="/emisores" className={isActive('/emisores') ? 'text-primary' : 'text-gray-500'}><Radio size={24} /></Link>
        {user.rol === 'admin' && <Link to="/reclutadores" className={isActive('/reclutadores') ? 'text-primary' : 'text-gray-500'}><Users size={24} /></Link>}
      </div>
    </div>
  );
};

export default Layout;