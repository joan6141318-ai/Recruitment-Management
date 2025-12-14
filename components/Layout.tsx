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
          flex items-center transition-all duration-200
          ${mobileOnly 
            ? 'flex-col justify-center py-1 px-2 w-full text-center' // Mobile Styles
            : 'flex-row px-4 py-3 rounded-lg mb-1' // Desktop Styles
          }
          ${active 
            ? 'text-primary md:bg-purple-50 md:font-bold' 
            : 'text-gray-400 hover:text-gray-900 md:hover:bg-gray-100'
          }
        `}
      >
        <Icon size={mobileOnly ? 20 : 18} strokeWidth={active ? 2.5 : 2} className={mobileOnly ? "mb-1" : "mr-3"} />
        <span className={`${mobileOnly ? 'text-[10px]' : 'text-sm'} font-medium`}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-sm text-gray-900">
      
      {/* SIDEBAR (Desktop Only) */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3 shadow-md shadow-purple-200">
                <Moon size={16} className="text-white fill-white" />
             </div>
             <div>
                <span className="font-bold text-gray-900 block leading-none">Agencia Moon</span>
                <span className="text-[10px] text-gray-400 font-medium">Panel de Control</span>
             </div>
          </div>

          {/* Nav Desktop */}
          <nav className="flex-1 p-4">
              <div className="mb-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Menú Principal</div>
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/emisores" icon={Radio} label="Mis Emisores" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo Reclutamiento" />}
          </nav>

          {/* User Profile Desktop */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
             <div className="flex items-center justify-between mb-3">
                {isEditingName ? (
                    <div className="flex items-center gap-1 w-full mr-2 bg-white border border-gray-300 rounded px-2 py-1">
                        <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} className="w-full text-xs font-bold outline-none bg-transparent" />
                        <Check size={12} className="text-green-600 cursor-pointer" onClick={handleSaveName}/>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsEditingName(true)}>
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                            {user.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-bold text-xs text-gray-900 truncate w-24">{user.nombre}</p>
                            <p className="text-[10px] text-gray-500 capitalize">{user.rol}</p>
                        </div>
                        <Edit2 size={10} className="text-gray-400 opacity-0 group-hover:opacity-100" />
                    </div>
                )}
             </div>
             <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 rounded-md transition-all text-xs font-bold text-gray-500">
                <LogOut size={14} /> Cerrar Sesión
             </button>
          </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 pb-20 md:pb-8 p-4 md:p-6 max-w-7xl mx-auto w-full overflow-x-hidden">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <Moon size={16} className="text-white fill-white" />
                </div>
                <div>
                    <h1 className="font-bold text-sm leading-none text-gray-900">Agencia Moon</h1>
                    <p className="text-[10px] text-gray-500 capitalize">{user.nombre} • {user.rol}</p>
                </div>
            </div>
            <button onClick={onLogout} className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                <LogOut size={16} />
            </button>
        </div>

        {children}
      </main>

      {/* BOTTOM NAVIGATION (Mobile Only) - FIXED & STANDARD */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around items-center h-[60px] pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <NavItem to="/" icon={LayoutDashboard} label="Inicio" mobileOnly />
          <NavItem to="/emisores" icon={Radio} label="Emisores" mobileOnly />
          {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo" mobileOnly />}
      </nav>
    </div>
  );
};

export default Layout;