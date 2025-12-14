import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Moon, Edit2, Check } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { dataService } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.nombre);

  useEffect(() => { setTempName(user.nombre); }, [user.nombre]);

  const isActive = (path: string) => location.pathname === path;

  const handleSaveName = async () => {
    if (tempName.trim() && tempName !== user.nombre) {
        await dataService.updateUserName(user.id, tempName);
        user.nombre = tempName; 
    }
    setIsEditingName(false);
  };

  const NavItem = ({ to, icon: Icon, label, mobileOnly = false }: { to: string, icon: any, label: string, mobileOnly?: boolean }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`
          flex flex-col md:flex-row items-center justify-center md:justify-start 
          md:px-4 md:py-3 rounded-xl transition-all duration-200
          ${mobileOnly ? 'md:hidden' : ''}
          ${active 
            ? 'text-primary md:bg-purple-50 md:font-bold' 
            : 'text-gray-400 hover:text-gray-600 md:hover:bg-gray-50'
          }
        `}
      >
        <Icon size={24} strokeWidth={active ? 2.5 : 2} className="mb-1 md:mb-0 md:mr-3" />
        <span className="text-[10px] md:text-sm font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR (Desktop Only) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 z-40">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <Moon size={16} className="text-white fill-white" />
             </div>
             <span className="font-bold text-gray-900">Agencia Moon</span>
          </div>

          {/* Nav Desktop */}
          <nav className="flex-1 p-4 space-y-1">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/emisores" icon={Radio} label="Mis Emisores" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo" />}
          </nav>

          {/* User Profile Desktop */}
          <div className="p-4 border-t border-gray-100">
             <div className="flex items-center justify-between mb-3">
                {isEditingName ? (
                    <div className="flex items-center gap-1 w-full mr-2">
                        <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} className="w-full text-sm border-b border-primary outline-none" />
                        <Check size={14} className="text-green-600 cursor-pointer" onClick={handleSaveName}/>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsEditingName(true)}>
                        <p className="font-bold text-sm text-gray-900 truncate max-w-[120px]">{user.nombre}</p>
                        <Edit2 size={12} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                    </div>
                )}
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold uppercase text-gray-500">{user.rol}</span>
             </div>
             <button onClick={onLogout} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors">
                <LogOut size={14} /> Cerrar Sesión
             </button>
          </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 pb-24 md:pb-8 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Mobile Top Bar (Logo + User) */}
        <div className="md:hidden flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <Moon size={16} className="text-white fill-white" />
                </div>
                <div>
                    <h1 className="font-bold text-sm leading-none">Agencia Moon</h1>
                    <p className="text-[10px] text-gray-400 capitalize">{user.nombre}</p>
                </div>
            </div>
            <button onClick={onLogout} className="p-2 bg-gray-100 rounded-full text-gray-600">
                <LogOut size={16} />
            </button>
        </div>

        {children}
      </main>

      {/* BOTTOM NAVIGATION (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-6 py-2 pb-safe flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <NavItem to="/" icon={LayoutDashboard} label="Inicio" />
          <NavItem to="/emisores" icon={Radio} label="Emisores" />
          {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo" />}
      </nav>
    </div>
  );
};

export default Layout;