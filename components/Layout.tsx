import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Moon, Edit2, Check, Menu, X } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado para menú hamburguesa

  useEffect(() => { setTempName(user.nombre); }, [user.nombre]);

  // Cerrar sidebar al cambiar de ruta en móvil
  useEffect(() => { setIsSidebarOpen(false); }, [location]);

  const isActive = (path: string) => location.pathname === path;

  const handleSaveName = async () => {
    if (tempName.trim() && tempName !== user.nombre) {
        await dataService.updateUserName(user.id, tempName);
        user.nombre = tempName; 
    }
    setIsEditingName(false);
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`
          flex items-center px-4 py-3 rounded-lg mb-1 transition-colors duration-200
          ${active 
            ? 'bg-black text-white font-medium' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-black'
          }
        `}
      >
        <Icon size={20} strokeWidth={2} className="mr-3" />
        <span className="text-sm">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-900">
      
      {/* MOBILE HEADER CON HAMBURGUESA */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="p-1">
                  <Menu size={24} className="text-black" />
              </button>
              <span className="font-bold text-lg">Agencia Moon</span>
          </div>
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center">
              <Moon size={16} className="text-white fill-white" />
          </div>
      </div>

      {/* OVERLAY PARA MOVIL */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* SIDEBAR (Desktop & Mobile Drawer) */}
      <aside className={`
          fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          {/* Logo Area */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                    <Moon size={18} className="text-white fill-white" />
                 </div>
                 <span className="font-bold text-lg tracking-tight">Agencia Moon</span>
             </div>
             {/* Botón cerrar solo en móvil */}
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
                <X size={20} />
             </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-1">
              <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Menú</div>
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/emisores" icon={Radio} label="Mis Emisores" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo Reclutamiento" />}
          </nav>

          {/* User Profile */}
          <div className="absolute bottom-0 w-full p-4 border-t border-gray-100 bg-white">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 border border-gray-200">
                    {user.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    {isEditingName ? (
                        <div className="flex items-center gap-1">
                             <input 
                                autoFocus 
                                value={tempName} 
                                onChange={(e) => setTempName(e.target.value)} 
                                onBlur={handleSaveName} 
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} 
                                className="w-full text-sm font-bold border-b border-black outline-none bg-transparent" 
                             />
                             <Check size={14} className="text-green-600 cursor-pointer" onClick={handleSaveName}/>
                        </div>
                    ) : (
                        <div onClick={() => setIsEditingName(true)} className="cursor-pointer group">
                            <p className="text-sm font-bold text-gray-900 truncate flex items-center gap-2">
                                {user.nombre} <Edit2 size={10} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{user.rol}</p>
                        </div>
                    )}
                </div>
             </div>
             <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors">
                <LogOut size={14} /> Cerrar Sesión
             </button>
          </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

export default Layout;