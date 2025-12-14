import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

// Logo Minimalista
const BrandLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
     <rect width="100" height="100" rx="50" className="fill-black"/>
     <path d="M72 26C65.8 20.8 58 18 50 18C32.3269 18 18 32.3269 18 50C18 67.6731 32.3269 82 50 82C67.6731 82 82 67.6731 82 50C82 46.5 81.4 43.1 80.3 39.9" stroke="white" strokeWidth="8" strokeLinecap="round"/>
     <circle cx="78" cy="26" r="6" className="fill-primary"/>
  </svg>
);

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => { setIsSidebarOpen(false); }, [location]);

  const isActive = (path: string) => location.pathname === path;

  // Nav Item para Sidebar Desktop
  const NavItem = ({ to, icon: Icon, label, colorClass = "text-gray-400" }: { to: string, icon: any, label: string, colorClass?: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`
          flex items-center px-4 py-3.5 rounded-xl mb-1 transition-all duration-200 group relative
          ${active 
            ? 'bg-black text-white shadow-lg shadow-gray-200' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
          }
        `}
      >
        <Icon 
            size={20} 
            strokeWidth={active ? 2 : 1.5} 
            className={`mr-3 transition-colors ${active ? 'text-white' : colorClass} group-hover:text-black`} 
        />
        <span className={`text-sm tracking-wide ${active ? 'font-medium' : 'font-normal'}`}>{label}</span>
      </Link>
    );
  };

  // Nav Item para Bottom Bar (Móvil)
  const BottomNavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
      const active = isActive(to);
      return (
          <Link to={to} className={`flex flex-col items-center justify-center w-full py-1 ${active ? 'text-black' : 'text-gray-400'}`}>
              <div className={`p-2 rounded-xl mb-0.5 transition-all ${active ? 'bg-black text-white' : 'bg-transparent'}`}>
                <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              </div>
              <span className={`text-[10px] font-medium tracking-tight ${active ? 'text-black' : 'text-gray-400'}`}>{label}</span>
          </Link>
      )
  };

  const SidebarContent = () => (
      <div className="flex flex-col h-full bg-white">
          <div className="h-28 flex flex-col justify-center px-8 border-b border-gray-50">
             <div className="flex items-center gap-3 mb-1">
                 <BrandLogo className="w-8 h-8" />
                 <span className="font-bold text-lg text-black tracking-tight">MOON</span>
             </div>
             <p className="text-[10px] text-gray-400 uppercase tracking-widest pl-1">Manager V1.0</p>
          </div>

          <nav className="flex-1 px-6 py-8 space-y-2">
              <p className="px-4 text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-2">Menu</p>
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" colorClass="text-gray-400" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" colorClass="text-gray-400" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo" colorClass="text-gray-400" />}
          </nav>

          <div className="p-6 border-t border-gray-50">
             <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-black border border-gray-200 flex items-center justify-center text-sm font-bold">
                    {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                    {/* NOMBRE VISIBLE Y PRINCIPAL */}
                    <p className="text-sm font-bold text-black truncate capitalize">{user.nombre}</p>
                    {/* CORREO SECUNDARIO */}
                    <p className="text-[10px] text-gray-400 truncate">{user.correo}</p>
                </div>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] bg-purple-50 text-primary border border-purple-100 px-2.5 py-1 rounded-full uppercase font-bold tracking-wide">
                    {user.rol}
                </span>
                <button onClick={onLogout} className="text-xs text-gray-400 hover:text-red-500 font-medium transition-colors flex items-center gap-1">
                    <LogOut size={14} /> Salir
                </button>
             </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-gray-900">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 h-screen sticky top-0 z-50">
          <SidebarContent />
      </aside>

      {/* MOBILE HEADER CON HAMBURGUESA */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-5 h-[60px] flex justify-between items-center z-40">
          <div className="flex items-center gap-3">
              <BrandLogo className="w-7 h-7" />
              <span className="font-bold text-base text-black tracking-tight">MOON</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center active:scale-95 transition-transform"
          >
             <Menu size={18} />
          </button>
      </div>

      {/* MOBILE DRAWER (SIDEBAR) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
            {/* Overlay Oscuro */}
            <div 
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
            />
            
            {/* Drawer */}
            <div className="absolute top-0 left-0 h-full w-[80%] max-w-[300px] bg-white shadow-2xl animate-slide-right flex flex-col border-r border-gray-100">
                <div className="absolute top-4 right-4 z-10">
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400 hover:text-black transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <SidebarContent />
            </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-5 md:p-12 max-w-6xl mx-auto w-full mt-[60px] md:mt-0 mb-24 md:mb-0">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 z-50 flex justify-between items-center h-[80px]">
         <BottomNavItem to="/" icon={LayoutDashboard} label="Inicio" />
         <BottomNavItem to="/emisores" icon={Radio} label="Emisores" />
         {user.rol === 'admin' && <BottomNavItem to="/reclutadores" icon={Users} label="Equipo" />}
      </div>

    </div>
  );
};

export default Layout;