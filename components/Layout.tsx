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
  
  // Estado para editar nombre
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user.nombre);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    setTempName(user.nombre);
  }, [user.nombre]);

  const handleForceUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  const handleSaveName = async () => {
    if (tempName.trim() && tempName !== user.nombre) {
        await dataService.updateUserName(user.id, tempName);
        user.nombre = tempName; 
    }
    setIsEditingName(false);
  };

  const Logo = () => (
    <div className="flex items-center gap-3 select-none">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-md">
            <Moon className="text-white fill-white" size={16} />
        </div>
        <div className="flex flex-col justify-center leading-none">
            <span className="font-bold text-lg tracking-tight text-black">Agencia Moon</span>
        </div>
    </div>
  );

  const NavItem = ({ to, icon: Icon, label, accentColor }: { to: string, icon: any, label: string, accentColor?: string }) => {
    const active = isActive(to);
    const activeText = accentColor === 'purple' ? 'text-primary' : accentColor === 'orange' ? 'text-accent' : 'text-black';
    const activeBar = accentColor === 'purple' ? 'bg-primary' : accentColor === 'orange' ? 'bg-accent' : 'bg-black';

    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 relative overflow-hidden ${
          active 
            ? 'bg-white shadow-sm border border-gray-100' 
            : 'hover:bg-gray-50'
        }`}
      >
        {active && <div className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full ${activeBar}`}></div>}
        
        <Icon 
            size={20} 
            strokeWidth={active ? 2.5 : 2} 
            className={`transition-colors ${active ? activeText : 'text-gray-400 group-hover:text-black'}`} 
        />
        <span className={`text-sm ${active ? 'font-bold text-black' : 'font-medium text-gray-500 group-hover:text-black'}`}>
            {label}
        </span>
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col md:flex-row overflow-hidden font-sans text-sm">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white/90 backdrop-blur-md px-4 py-3 flex justify-between items-center sticky top-0 z-30 border-b border-gray-200">
        <Logo />
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-black active:scale-95 transition-transform bg-gray-50 rounded-lg">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed md:static top-0 left-0 h-full w-64 bg-surface border-r border-gray-200 z-40 transform transition-transform duration-300 ease-in-out flex flex-col p-6
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="mb-10 hidden md:block">
             <Logo />
          </div>

          <nav className="flex-1 space-y-1">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" accentColor="black" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" accentColor="purple" />
              {user.rol === 'admin' && (
                <NavItem to="/reclutadores" icon={Users} label="Equipo" accentColor="orange" />
              )}
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100 space-y-3">
             <div className="px-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{user.rol}</p>
                
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <input 
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                            className="w-full bg-gray-50 border-b border-black text-black font-bold text-sm outline-none capitalize"
                        />
                        <button onClick={handleSaveName} className="text-green-600"><Check size={16}/></button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between group">
                        <h2 className="text-sm font-bold text-black capitalize truncate pr-2">
                            {tempName.toLowerCase()}
                        </h2>
                        <button onClick={() => setIsEditingName(true)} className="text-gray-300 hover:text-black transition-colors opacity-0 group-hover:opacity-100">
                            <Edit2 size={12} />
                        </button>
                    </div>
                )}
             </div>
             
             <button 
                onClick={onLogout} 
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-gray-500 transition-all font-medium text-xs group"
             >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
             </button>

             <button 
                onClick={handleForceUpdate} 
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-xl transition-all font-bold text-[10px] uppercase tracking-wider"
             >
                <RefreshCw size={10} />
                <span>v1.3</span>
             </button>
          </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 overflow-y-auto relative bg-background">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 bg-black text-white rounded-2xl shadow-xl flex justify-around items-center p-3 z-20">
        <Link to="/" className={isActive('/') ? 'text-white' : 'text-gray-500'}><LayoutDashboard size={24} /></Link>
        <Link to="/emisores" className={isActive('/emisores') ? 'text-primary' : 'text-gray-500'}><Radio size={24} /></Link>
        {user.rol === 'admin' && <Link to="/reclutadores" className={isActive('/reclutadores') ? 'text-accent' : 'text-gray-500'}><Users size={24} /></Link>}
      </div>
    </div>
  );
};

export default Layout;