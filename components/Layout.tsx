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

  // Actualizar nombre localmente si cambia el prop
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
        user.nombre = tempName; // Actualización optimista
    }
    setIsEditingName(false);
  };

  // LOGOTIPO MEJORADO: Title Case
  const Logo = () => (
    <div className="flex items-center gap-4 select-none">
        <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-xl shadow-black/20">
            <Moon className="text-white fill-white" size={24} />
        </div>
        <div className="flex flex-col justify-center leading-none">
            <span className="font-bold text-sm tracking-wide text-gray-400">Agencia</span>
            <span className="font-black text-3xl tracking-tight text-black">Moon</span>
        </div>
    </div>
  );

  const NavItem = ({ to, icon: Icon, label, accentColor }: { to: string, icon: any, label: string, accentColor?: string }) => {
    const active = isActive(to);
    // Color dinámico según la sección activa
    const activeText = accentColor === 'purple' ? 'text-primary' : accentColor === 'orange' ? 'text-accent' : 'text-black';
    const activeBar = accentColor === 'purple' ? 'bg-primary' : accentColor === 'orange' ? 'bg-accent' : 'bg-black';

    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`group flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 mb-2 relative overflow-hidden ${
          active 
            ? 'bg-white shadow-card' 
            : 'hover:bg-white/60'
        }`}
      >
        {active && <div className={`absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full ${activeBar}`}></div>}
        
        <Icon 
            size={24} 
            strokeWidth={active ? 2.5 : 2} 
            className={`transition-colors ${active ? activeText : 'text-gray-400 group-hover:text-black'}`} 
        />
        <span className={`text-sm tracking-wide ${active ? 'font-black text-black' : 'font-bold text-gray-500 group-hover:text-black'}`}>
            {label}
        </span>
      </Link>
    );
  };

  return (
    <div className="h-[100dvh] bg-background flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white/90 backdrop-blur-xl px-6 py-4 flex justify-between items-center sticky top-0 z-30 border-b border-gray-100/50">
        <div className="scale-75 origin-left"><Logo /></div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 text-black active:scale-95 transition-transform bg-gray-50 rounded-2xl">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed md:static top-0 left-0 h-full w-80 bg-surface border-r border-gray-100 z-40 transform transition-transform duration-500 cubic-bezier(0.2, 0.8, 0.2, 1) flex flex-col p-8
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="mb-16 hidden md:block">
             <Logo />
          </div>

          <nav className="flex-1 py-4 space-y-2">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" accentColor="black" />
              <NavItem to="/emisores" icon={Radio} label="Emisores" accentColor="purple" />
              {user.rol === 'admin' && (
                <NavItem to="/reclutadores" icon={Users} label="Equipo" accentColor="orange" />
              )}
          </nav>

          {/* PERFIL PROTAGONISTA & OPCIONES */}
          <div className="mt-auto pt-8 border-t border-gray-100 space-y-4">
             
             {/* Sección Nombre con Edición */}
             <div className="px-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{user.rol}</p>
                
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <input 
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleSaveName}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                            className="w-full bg-gray-50 border-b-2 border-black text-black font-black text-lg outline-none uppercase"
                        />
                        <button onClick={handleSaveName} className="text-green-600"><Check size={20}/></button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between group">
                        <h2 className="text-2xl font-black text-black leading-none tracking-tight break-words capitalize truncate pr-2">
                            {tempName.toLowerCase()}
                        </h2>
                        <button onClick={() => setIsEditingName(true)} className="text-gray-300 hover:text-black transition-colors opacity-0 group-hover:opacity-100">
                            <Edit2 size={16} />
                        </button>
                    </div>
                )}
             </div>
             
             <button 
                onClick={onLogout} 
                className="w-full flex items-center gap-3 px-6 py-4 bg-gray-50 hover:bg-black hover:text-white rounded-2xl text-gray-400 transition-all font-bold text-xs uppercase tracking-widest group"
             >
                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform"/>
                <span>Cerrar Sesión</span>
             </button>

             {/* BOTÓN HARD REFRESH */}
             <button 
                onClick={handleForceUpdate} 
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest"
             >
                <RefreshCw size={12} />
                <span>Actualizar Sistema</span>
             </button>
          </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 overflow-y-auto relative bg-background">
        <div className="max-w-[1400px] mx-auto p-6 md:p-10 pb-32">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 bg-black/90 backdrop-blur-xl text-white rounded-[2rem] shadow-2xl flex justify-around items-center p-5 z-20 border border-white/10">
        <Link to="/" className={isActive('/') ? 'text-white scale-110' : 'text-gray-500'}><LayoutDashboard size={26} strokeWidth={isActive('/') ? 3 : 2} /></Link>
        <Link to="/emisores" className={isActive('/emisores') ? 'text-primary scale-110' : 'text-gray-500'}><Radio size={26} strokeWidth={isActive('/emisores') ? 3 : 2}/></Link>
        {user.rol === 'admin' && <Link to="/reclutadores" className={isActive('/reclutadores') ? 'text-accent scale-110' : 'text-gray-500'}><Users size={26} strokeWidth={isActive('/reclutadores') ? 3 : 2}/></Link>}
      </div>
    </div>
  );
};

export default Layout;