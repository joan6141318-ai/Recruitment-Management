import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, Moon, Edit2, Check } from 'lucide-react';
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
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
          active 
            ? 'bg-black text-white shadow-md' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-black'
        }`}
      >
        <Icon size={18} strokeWidth={active ? 2.5 : 2} />
        <span className="text-xs font-medium tracking-wide">{label}</span>
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col md:flex-row overflow-hidden font-sans text-sm">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-30">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center"><Moon size={16} className="text-white fill-white" /></div>
            <span className="font-bold text-sm tracking-tight text-black">Agencia Moon</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-50 rounded-lg text-gray-700 active:scale-95 transition-transform">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed md:static top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="p-6 border-b border-gray-100 flex items-center gap-3">
             <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg"><Moon size={16} className="text-white fill-white" /></div>
             <div>
                <h1 className="font-bold text-sm tracking-tight text-black leading-none">Agencia Moon</h1>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Gestión de Talento</p>
             </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard General" />
              <NavItem to="/emisores" icon={Radio} label="Mis Emisores" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo de Reclutamiento" />}
          </nav>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
             <div className="mb-3">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Usuario</p>
                {isEditingName ? (
                    <div className="flex items-center gap-2 bg-white border border-black rounded px-2 py-1">
                        <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} className="w-full text-xs font-bold outline-none capitalize" />
                        <Check size={12} className="text-green-600 cursor-pointer" onClick={handleSaveName}/>
                    </div>
                ) : (
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsEditingName(true)}>
                        <h2 className="text-sm font-bold text-black capitalize truncate pr-2">{tempName.toLowerCase()}</h2>
                        <Edit2 size={12} className="text-gray-300 group-hover:text-black opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
                <p className="text-[10px] text-gray-500 capitalize">{user.rol}</p>
             </div>
             
             <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:bg-black hover:text-white hover:border-black rounded-lg transition-all text-xs font-semibold shadow-sm">
                <LogOut size={14} /> Cerrar Sesión
             </button>
          </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-[1600px] mx-auto p-4 md:p-8 pb-24">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;