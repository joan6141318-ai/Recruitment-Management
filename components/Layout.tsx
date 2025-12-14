import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Moon, Edit2, Check, Menu } from 'lucide-react';
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
          group flex items-center transition-all duration-300 ease-out
          ${mobileOnly 
            ? 'flex-col justify-center py-2 px-1 w-full text-center' 
            : 'flex-row px-5 py-3.5 rounded-2xl mb-2 mx-3'
          }
          ${active 
            ? 'text-primary bg-purple-50 font-bold' 
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }
        `}
      >
        <Icon 
            size={mobileOnly ? 22 : 20} 
            strokeWidth={active ? 2.5 : 2} 
            className={`${mobileOnly ? "mb-1.5" : "mr-4"} transition-transform group-hover:scale-110`} 
        />
        <span className={`${mobileOnly ? 'text-[10px]' : 'text-sm'} font-medium`}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-gray-900">
      
      {/* SIDEBAR (Desktop) - Estética Glassmorphism sutil */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 h-screen sticky top-0 z-40 shadow-[4px_0_30px_rgba(0,0,0,0.02)]">
          {/* Brand */}
          <div className="h-24 flex items-center px-8">
             <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-4 shadow-lg shadow-purple-500/20">
                <Moon size={20} className="text-white fill-white" />
             </div>
             <div>
                <h1 className="font-bold text-lg tracking-tight text-black">Agencia Moon</h1>
                <p className="text-xs text-gray-400 font-medium">Gestión Profesional</p>
             </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-6">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Reclutadores" />}
          </nav>

          {/* Profile */}
          <div className="p-6 border-t border-gray-50">
             <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between group hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-sm font-bold text-primary shadow-sm">
                        {user.nombre.charAt(0).toUpperCase()}
                    </div>
                    
                    {isEditingName ? (
                        <div className="flex items-center gap-1 min-w-0">
                             <input 
                                autoFocus 
                                value={tempName} 
                                onChange={(e) => setTempName(e.target.value)} 
                                onBlur={handleSaveName} 
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} 
                                className="w-full text-sm font-bold bg-white border-b border-primary outline-none px-1" 
                             />
                             <Check size={14} className="text-green-500 cursor-pointer" onClick={handleSaveName}/>
                        </div>
                    ) : (
                        <div className="min-w-0 cursor-pointer" onClick={() => setIsEditingName(true)}>
                            <p className="font-bold text-sm text-gray-900 truncate">{user.nombre}</p>
                            <p className="text-xs text-gray-400 capitalize">{user.rol}</p>
                        </div>
                    )}
                </div>
                <button onClick={onLogout} className="text-gray-300 hover:text-red-500 transition-colors">
                    <LogOut size={18} />
                </button>
             </div>
          </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 pb-24 md:pb-10 p-5 md:p-10 max-w-7xl mx-auto w-full overflow-x-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center mb-6 pt-2">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/10">
                    <Moon size={18} className="text-white fill-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg text-black leading-none">Agencia Moon</h1>
                </div>
            </div>
            <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                    {user.nombre.charAt(0)}
                 </div>
                 <button onClick={onLogout} className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 shadow-sm">
                    <LogOut size={14} />
                 </button>
            </div>
        </div>

        {children}
      </main>

      {/* BOTTOM NAV (Mobile) - Estilo iOS Glass */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 z-50 flex justify-around items-center h-[70px] pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.03)]">
          <NavItem to="/" icon={LayoutDashboard} label="Inicio" mobileOnly />
          <NavItem to="/emisores" icon={Radio} label="Emisores" mobileOnly />
          {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo" mobileOnly />}
      </nav>
    </div>
  );
};

export default Layout;