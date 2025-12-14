import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

// Logo Ajustado
const BrandLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
     <rect width="100" height="100" rx="22" className="fill-black"/>
     <path d="M72 26C65.8 20.8 58 18 50 18C32.3269 18 18 32.3269 18 50C18 67.6731 32.3269 82 50 82C67.6731 82 82 67.6731 82 50C82 46.5 81.4 43.1 80.3 39.9" stroke="white" strokeWidth="10" strokeLinecap="round"/>
     <circle cx="78" cy="26" r="8" className="fill-primary"/>
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => { setIsSidebarOpen(false); }, [location]);

  const isActive = (path: string) => location.pathname === path;

  // Nav Item con colores solicitados (Morado/Naranja/Negro)
  const NavItem = ({ to, icon: Icon, label, colorClass = "text-gray-400" }: { to: string, icon: any, label: string, colorClass?: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`
          flex items-center px-4 py-4 rounded-xl mb-1 transition-all duration-200 group relative overflow-hidden
          ${active 
            ? 'bg-gray-50 text-gray-900 font-bold' 
            : 'text-gray-500 hover:bg-gray-50/50 hover:text-black'
          }
        `}
      >
        {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-black rounded-r-full"></div>}
        <Icon 
            size={22} 
            strokeWidth={active ? 2.5 : 2} 
            className={`mr-4 transition-colors ${active ? 'text-primary' : colorClass} group-hover:text-primary`} 
        />
        <span className="text-sm tracking-wide">{label}</span>
        {active && <ChevronRight size={16} className="ml-auto text-gray-300" />}
      </Link>
    );
  };

  const SidebarContent = () => (
      <div className="flex flex-col h-full">
          <div className="h-24 flex items-center px-6 border-b border-gray-50">
             <div className="flex items-center gap-3">
                 <BrandLogo className="w-10 h-10" />
                 <div>
                    <h1 className="font-bold text-lg text-black uppercase tracking-widest leading-none">AGENCIA MOON</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gestor RRHH</p>
                 </div>
             </div>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" colorClass="text-gray-400" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" colorClass="text-gray-400" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo Reclutadores" colorClass="text-gray-400" />}
          </nav>

          <div className="p-6 border-t border-gray-50 bg-gray-50/50">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-purple-200">
                    {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-black truncate">{user.nombre}</p>
                    <p className="text-[10px] text-accent font-bold uppercase">{user.rol}</p>
                </div>
                <button onClick={onLogout} className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors">
                    <LogOut size={18} />
                </button>
             </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-gray-900">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-100 h-screen sticky top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <SidebarContent />
      </aside>

      {/* MOBILE HEADER CON HAMBURGUESA */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 h-[70px] flex justify-between items-center z-40 shadow-sm">
          <div className="flex items-center gap-3">
              <BrandLogo className="w-8 h-8" />
              <span className="font-bold text-base text-black uppercase tracking-widest">MOON</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-200 active:scale-95 transition-transform"
          >
             <Menu size={20} />
          </button>
      </div>

      {/* MOBILE DRAWER (SIDEBAR) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
            {/* Overlay Oscuro */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
            />
            
            {/* Drawer */}
            <div className="absolute top-0 right-0 h-full w-[85%] max-w-[320px] bg-white shadow-2xl animate-slide-left flex flex-col">
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full text-black hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </div>
                <SidebarContent />
            </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-5 md:p-10 max-w-7xl mx-auto w-full mt-[70px] md:mt-0">
        {children}
      </main>

    </div>
  );
};

export default Layout;