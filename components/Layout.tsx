import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, Moon, RefreshCw, Edit2, Check } from 'lucide-react';
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
        className={`flex items-center gap-3 px-3 py-2 rounded mb-0.5 transition-colors ${
          active ? 'bg-gray-100 text-black font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-black'
        }`}
      >
        <Icon size={16} strokeWidth={active ? 2.5 : 2} />
        <span className="text-xs">{label}</span>
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] bg-white flex flex-col md:flex-row overflow-hidden font-sans text-sm">
      {/* Mobile Header */}
      <div className="md:hidden bg-white px-4 py-3 flex justify-between items-center border-b border-gray-100 z-30">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded flex items-center justify-center"><Moon size={12} className="text-white fill-white" /></div>
            <span className="font-bold text-sm">Moon</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu size={20} /></button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed md:static top-0 left-0 h-full w-56 bg-white border-r border-gray-100 z-40 transform transition-transform duration-200 flex flex-col p-4 ${isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex items-center gap-2 mb-8 px-2">
             <div className="w-6 h-6 bg-black rounded flex items-center justify-center"><Moon size={12} className="text-white fill-white" /></div>
             <span className="font-black text-sm tracking-tight">AGENCIA MOON</span>
          </div>

          <nav className="flex-1 space-y-0.5">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" />
              {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo" />}
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-100">
             <div className="px-2 mb-4">
                <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">{user.rol}</p>
                {isEditingName ? (
                    <div className="flex items-center gap-1">
                        <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} className="w-full bg-gray-50 border-b border-black text-xs font-bold outline-none capitalize" />
                        <Check size={12} className="text-green-600 cursor-pointer" onClick={handleSaveName}/>
                    </div>
                ) : (
                    <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsEditingName(true)}>
                        <h2 className="text-xs font-bold text-black capitalize truncate">{tempName.toLowerCase()}</h2>
                        <Edit2 size={10} className="text-gray-300 group-hover:text-black opacity-0 group-hover:opacity-100" />
                    </div>
                )}
             </div>
             <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-black hover:bg-gray-50 rounded transition-colors text-xs font-medium">
                <LogOut size={14} /> Cerrar Sesión
             </button>
          </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="max-w-7xl mx-auto p-4 md:p-6 pb-20">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-2 z-20 text-[10px]">
        <Link to="/" className={`flex flex-col items-center p-2 ${isActive('/') ? 'text-black font-bold' : 'text-gray-400'}`}>
            <LayoutDashboard size={18} />
        </Link>
        <Link to="/emisores" className={`flex flex-col items-center p-2 ${isActive('/emisores') ? 'text-black font-bold' : 'text-gray-400'}`}>
            <Radio size={18} />
        </Link>
        {user.rol === 'admin' && <Link to="/reclutadores" className={`flex flex-col items-center p-2 ${isActive('/reclutadores') ? 'text-black font-bold' : 'text-gray-400'}`}><Users size={18} /></Link>}
      </div>
    </div>
  );
};

export default Layout;