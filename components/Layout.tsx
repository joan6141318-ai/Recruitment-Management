import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { dataService } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

// NUEVO LOGO: "Orbital Focus"
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

  useEffect(() => { setIsSidebarOpen(false); }, [location]);

  const isActive = (path: string) => location.pathname === path;

  // Nav Item Genérico (Usado en Desktop y Mobile Drawer)
  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`
          flex items-center px-4 py-3.5 rounded-xl mb-1 transition-all duration-200 group
          ${active 
            ? 'bg-black text-white font-medium shadow-lg shadow-gray-200' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-black'
          }
        `}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} className="mr-3" />
        <span className="text-sm tracking-wide">{label}</span>
      </Link>
    );
  };

  // Nav Item para Bottom Bar (Solo Móvil)
  const BottomNavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
      const active = isActive(to);
      return (
          <Link to={to} className={`flex flex-col items-center justify-center w-full py-1 ${active ? 'text-black' : 'text-gray-400'}`}>
              <div className={`p-1.5 rounded-full mb-0.5 transition-all ${active ? 'bg-black text-white shadow-md' : ''}`}>
                <Icon size={20} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold tracking-tight">{label}</span>
          </Link>
      )
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col md:flex-row font-sans text-gray-900">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 h-screen sticky top-0 z-50">
          <div className="h-24 flex items-center px-8">
             <div className="flex items-center gap-3">
                 <BrandLogo className="w-10 h-10" />
                 <div>
                    <h1 className="font-bold text-lg text-black leading-none tracking-tight">Agencia Moon</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gestor RRHH</p>
                 </div>
             </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Reclutadores" />}
          </nav>

          <div className="p-6 border-t border-gray-50">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
                    {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-black truncate">{user.nombre}</p>
                    <button onClick={onLogout} className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1">
                        Cerrar Sesión
                    </button>
                </div>
             </div>
          </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-40">
          <div className="flex items-center gap-3">
              <BrandLogo className="w-9 h-9" />
              <span className="font-bold text-lg text-black tracking-tight">Agencia Moon</span>
          </div>
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold border border-gray-200">
             {user.nombre.charAt(0).toUpperCase()}
          </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-5 md:p-10 max-w-7xl mx-auto w-full mb-20 md:mb-0">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-2 z-50 flex justify-between items-center h-[70px] shadow-[0_-5px_20px_rgba(0,0,0,0.02)]">
         <BottomNavItem to="/" icon={LayoutDashboard} label="Inicio" />
         <BottomNavItem to="/emisores" icon={Radio} label="Emisores" />
         {user.rol === 'admin' && <BottomNavItem to="/reclutadores" icon={Users} label="Equipo" />}
         <button onClick={onLogout} className="flex flex-col items-center justify-center w-full py-1 text-gray-400">
             <div className="p-1.5 mb-0.5"><LogOut size={20} /></div>
             <span className="text-[10px] font-bold">Salir</span>
         </button>
      </div>
    </div>
  );
};

export default Layout;