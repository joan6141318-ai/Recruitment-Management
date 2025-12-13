import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const BrandLogo = () => (
  <div className="flex items-center gap-2">
    <div className="relative w-8 h-8 flex items-center justify-center">
       <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
         <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" fillOpacity="0.1"/>
       </svg>
       <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white shadow-sm animate-pulse-slow"></div>
    </div>
    <span className="font-bold text-xl tracking-tight text-secondary">Moon</span>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label, colorClass, activeColorClass }: { to: string, icon: any, label: string, colorClass: string, activeColorClass: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`group flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden ${
          active 
            ? `bg-white shadow-sm ${activeColorClass}` 
            : 'text-gray-500 hover:bg-white hover:text-secondary hover:shadow-sm'
        }`}
      >
        <Icon 
          size={20} 
          className={`transition-colors duration-300 ${active ? 'scale-110' : 'group-hover:text-secondary'}`} 
          strokeWidth={active ? 2.5 : 2} 
        />
        <span className={`font-medium text-sm ${active ? 'font-bold' : ''}`}>{label}</span>
        {/* Active Indicator Dot */}
        {active && <div className={`absolute right-4 w-1.5 h-1.5 rounded-full ${colorClass}`}></div>}
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] bg-surface flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Mobile Header (Glass) */}
      <div className="md:hidden glass px-5 py-4 flex justify-between items-center sticky top-0 z-30 shrink-0 border-b border-gray-100/50">
        <BrandLogo />
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-secondary active:scale-95 transition-transform">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed md:static top-0 left-0 h-[100dvh] md:h-full w-72 bg-surface md:bg-white/60 md:backdrop-blur-xl border-r border-gray-200/50 z-40 transform transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) flex flex-col
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 shrink-0">
          <div className="mb-12 pl-2 hidden md:block animate-fade-in">
             <BrandLogo />
          </div>

          <div className="mb-6 px-2 animate-slide-up stagger-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Menú Principal</p>
            <nav className="space-y-2">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" colorClass="bg-secondary" activeColorClass="text-secondary" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" colorClass="bg-primary" activeColorClass="text-primary" />
              {user.rol === 'admin' && (
                <NavItem to="/reclutadores" icon={Users} label="Equipo" colorClass="bg-accent" activeColorClass="text-accent" />
              )}
            </nav>
          </div>
        </div>

        <div className="mt-auto p-6 shrink-0 mb-safe border-t border-gray-100/50 animate-slide-up stagger-2">
           <div className="flex items-center gap-3 mb-6 px-2 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-400 p-[2px] shadow-glow">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                    <span className="font-bold text-primary text-sm">{user.nombre.charAt(0).toUpperCase()}</span>
                </div>
             </div>
             <div className="overflow-hidden">
                <p className="text-sm font-bold text-secondary truncate">{user.nombre}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{user.rol}</p>
             </div>
           </div>

          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-gray-400 hover:text-danger hover:bg-red-50 rounded-xl transition-all font-medium text-sm group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-full w-full relative">
        <div className="max-w-7xl mx-auto p-5 md:p-12 pb-28 md:pb-12">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center p-2 pb-safe z-20 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.03)]">
        <Link to="/" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${isActive('/') ? 'text-secondary' : 'text-gray-300'}`}>
          <LayoutDashboard size={24} strokeWidth={isActive('/') ? 2.5 : 2} className={isActive('/') ? 'animate-scale-in' : ''} />
        </Link>
        
        {/* Botón Central Flotante para Emisores */}
        <Link to="/emisores" className="relative -top-6">
           <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${isActive('/emisores') ? 'bg-secondary text-white ring-4 ring-white shadow-xl shadow-black/20' : 'bg-white text-gray-400 border border-gray-100'}`}>
              <Radio size={28} strokeWidth={2.5} className={isActive('/emisores') ? 'animate-scale-in' : ''} />
           </div>
        </Link>

         {user.rol === 'admin' ? (
             <Link to="/reclutadores" className={`flex flex-col items-center p-3 rounded-2xl transition-all ${isActive('/reclutadores') ? 'text-accent' : 'text-gray-300'}`}>
             <Users size={24} strokeWidth={isActive('/reclutadores') ? 2.5 : 2} className={isActive('/reclutadores') ? 'animate-scale-in' : ''} />
           </Link>
         ) : (
            <div className="w-10"></div> // Spacer
         )}
      </div>
    </div>
  );
};

export default Layout;