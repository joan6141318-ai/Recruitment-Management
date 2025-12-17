
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, ChevronRight, Banknote, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cerrar sidebar al cambiar de ruta
  useEffect(() => { setIsSidebarOpen(false); }, [location]);

  const isActive = (path: string) => location.pathname === path;

  // Nav Item para Sidebar Desktop / Hamburguesa
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

  // Nav Item para Bottom Bar (Móvil)
  const BottomNavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
      const active = isActive(to);
      return (
          <Link to={to} className={`flex flex-col items-center justify-center w-full py-1 ${active ? 'text-black' : 'text-gray-400'}`}>
              <div className={`p-2 rounded-xl mb-0.5 transition-all ${active ? 'bg-black text-white shadow-lg shadow-purple-200' : 'bg-transparent'}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${active ? 'text-black' : 'text-gray-400'}`}>{label}</span>
          </Link>
      )
  };

  const SidebarContent = () => (
      <div className="flex flex-col h-full">
          <div className="h-24 flex items-center px-6 border-b border-gray-50">
             <div className="flex items-center gap-3">
                 <img src="/icon.svg" alt="Moon" className="w-10 h-10 object-contain rounded-full bg-black" />
                 <div>
                    <h1 className="font-bold text-lg text-black uppercase tracking-widest leading-none">AGENCIA MOON</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Gestor de Reclutamiento</p>
                 </div>
             </div>
          </div>

          <nav className="flex-1 px-4 py-8 space-y-2">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" />
              <NavItem to="/remuneracion" icon={Banknote} label="Remuneración" />
              <NavItem to="/factura" icon={FileText} label="Mi Factura" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo Reclutadores" />}
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
      <aside className="hidden md:flex flex-col w-80 bg-white border-r border-gray-100 h-screen sticky top-0 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] print:hidden">
          <SidebarContent />
      </aside>

      {/* MOBILE HEADER CON HAMBURGUESA */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-5 h-[60px] flex justify-between items-center z-40 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
              <img src="/icon.svg" alt="Moon" className="w-8 h-8 object-contain rounded-full bg-black" />
              <span className="font-bold text-base text-black uppercase tracking-widest">MOON</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-9 h-9 bg-gray-50 text-black border border-gray-100 rounded-full flex items-center justify-center active:bg-gray-100 transition-colors"
          >
             <Menu size={20} />
          </button>
      </div>

      {/* MOBILE DRAWER (SIDEBAR) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[60] md:hidden print:hidden">
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
            />
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

      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full mt-[60px] md:mt-0 mb-24 md:mb-0 print:m-0 print:p-0">
        {children}
      </main>

      {/* NAVIGATION BAR - DINÁMICA SEGÚN ROL */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-4 z-50 flex justify-between items-center h-[80px] shadow-[0_-5px_20px_rgba(0,0,0,0.03)] print:hidden">
         <BottomNavItem to="/" icon={LayoutDashboard} label="Inicio" />
         <BottomNavItem to="/emisores" icon={Radio} label="Emisores" />
         {user.rol === 'admin' ? (
           <BottomNavItem to="/reclutadores" icon={Users} label="Equipo" />
         ) : (
           <BottomNavItem to="/remuneracion" icon={Banknote} label="Pagos" />
         )}
      </div>

    </div>
  );
};

export default Layout;
