import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, Moon, Edit2, Check, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { dataService } from '../services/db';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.nombre);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => { setTempName(user.nombre); }, [user.nombre]);

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
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center justify-between px-3 py-2.5 mx-2 rounded-lg transition-all duration-200 group ${
          active 
            ? 'bg-black text-white shadow-md' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-black'
        }`}
      >
        <div className="flex items-center gap-3">
            <Icon size={18} strokeWidth={active ? 2.5 : 2} className={active ? 'text-white' : 'text-gray-400 group-hover:text-black transition-colors'} />
            <span className="text-xs font-semibold tracking-wide">{label}</span>
        </div>
        {active && <ChevronRight size={14} className="text-gray-500" />}
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col md:flex-row overflow-hidden font-sans text-sm">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center"><Moon size={16} className="text-white fill-white" /></div>
            <span className="font-bold text-sm tracking-tight text-black">Agencia Moon</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 active:scale-95 transition-transform">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed md:static top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-gray-100">
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/20">
                    <Moon size={18} className="text-white fill-white" />
                </div>
                <div className="flex flex-col">
                    <h1 className="font-bold text-sm text-black leading-none tracking-tight">Agencia Moon</h1>
                    <span className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wider">Management</span>
                </div>
             </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 space-y-1">
              <div className="px-6 mb-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Navegación</p>
              </div>
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/emisores" icon={Radio} label="Mis Emisores" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Reclutamiento" />}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
             <div className="flex items-center justify-between mb-4 px-1">
                <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Usuario</p>
                    {isEditingName ? (
                        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 py-1 shadow-sm">
                            <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} className="w-full text-xs font-bold outline-none capitalize bg-transparent" />
                            <Check size={12} className="text-green-600 cursor-pointer" onClick={handleSaveName}/>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                            <h2 className="text-xs font-bold text-gray-900 capitalize truncate">{tempName.toLowerCase()}</h2>
                            <Edit2 size={10} className="text-gray-400 group-hover:text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    )}
                </div>
                <div className="px-2 py-0.5 rounded bg-gray-200 text-[9px] font-bold text-gray-600 uppercase tracking-wide">{user.rol}</div>
             </div>
             
             <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all text-xs font-bold text-gray-600 shadow-sm">
                <LogOut size={14} /> Cerrar Sesión
             </button>
          </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;