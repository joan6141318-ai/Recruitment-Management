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

  // LOGOTIPO CORREGIDO: AGENCIA MOON
  const Logo = () => (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
            <Moon className="text-white fill-white" size={20} />
        </div>
        <span className="font-black text-xl tracking-tight text-black uppercase leading-none">
            AGENCIA<br/><span className="text-primary">MOON</span>
        </span>
    </div>
  );

  const NavItem = ({ to, icon: Icon, label, baseColor, activeColor }: { to: string, icon: any, label: string, baseColor: string, activeColor: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`group flex items-center gap-4 px-6 py-5 rounded-2xl transition-all duration-300 mb-2 relative overflow-hidden ${
          active 
            ? 'bg-white shadow-card' 
            : 'hover:bg-white/50'
        }`}
      >
        {active && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${activeColor}`}></div>}
        
        <Icon 
            size={24} 
            strokeWidth={active ? 2.5 : 2} 
            className={`transition-colors ${active ? baseColor : 'text-gray-400 group-hover:text-black'}`} 
        />
        <span className={`text-sm tracking-wide ${active ? 'font-black text-black' : 'font-bold text-gray-500 group-hover:text-black'}`}>
            {label.toUpperCase()}
        </span>
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white/80 backdrop-blur-lg px-6 py-5 flex justify-between items-center sticky top-0 z-30 border-b border-gray-100">
        <Logo />
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-black active:scale-90 transition-transform bg-gray-50 rounded-xl">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed md:static top-0 left-0 h-full w-80 bg-surface border-r border-gray-100 z-40 transform transition-transform duration-700 cubic-bezier(0.34, 1.56, 0.64, 1) flex flex-col p-8
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="mb-16 hidden md:block">
             <Logo />
          </div>

          <nav className="flex-1 py-4 space-y-1">
              <NavItem 
                to="/" 
                icon={LayoutDashboard} 
                label="Dashboard" 
                baseColor="text-black" // Icon color active
                activeColor="bg-black" // Bar color
              />
              <NavItem 
                to="/emisores" 
                icon={Radio} 
                label="Emisores" 
                baseColor="text-primary" 
                activeColor="bg-primary"
              />
              {user.rol === 'admin' && (
                <NavItem 
                    to="/reclutadores" 
                    icon={Users} 
                    label="Equipo" 
                    baseColor="text-accent" 
                    activeColor="bg-accent"
                />
              )}
          </nav>

          {/* PERFIL PROTAGONISTA (Sin correo) */}
          <div className="mt-auto pt-8 border-t border-gray-100">
             <div className="mb-6 px-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{user.rol}</p>
                {/* Nombre Grande */}
                <h2 className="text-3xl font-black text-black leading-none uppercase tracking-tight">
                    {user.nombre}
                </h2>
             </div>
             
             <button 
                onClick={onLogout} 
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 transition-colors font-bold text-xs uppercase tracking-widest group"
             >
                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/>
                <span>Salir</span>
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
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-black text-white rounded-3xl shadow-2xl flex justify-around items-center p-5 z-20">
        <Link to="/" className={isActive('/') ? 'text-white' : 'text-gray-600'}><LayoutDashboard size={24} strokeWidth={3} /></Link>
        <Link to="/emisores" className={isActive('/emisores') ? 'text-primary' : 'text-gray-600'}><Radio size={24} strokeWidth={3}/></Link>
        {user.rol === 'admin' && <Link to="/reclutadores" className={isActive('/reclutadores') ? 'text-accent' : 'text-gray-600'}><Users size={24} strokeWidth={3}/></Link>}
      </div>
    </div>
  );
};

export default Layout;