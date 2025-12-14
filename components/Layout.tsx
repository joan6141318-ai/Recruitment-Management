
import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, Users, Radio, LayoutDashboard, Menu, X, UserCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  // Navigation Items
  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)} // Close sidebar on nav click (if used inside)
        className={`flex flex-col items-center justify-center py-2 px-4 transition-all duration-300 relative ${active ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-purple-50 translate-y-[-2px]' : ''}`}>
             <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className="text-[9px] font-bold uppercase mt-1 tracking-wide">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* 1. TOP BAR (Mobile & Desktop) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-gray-800 hover:bg-gray-50 rounded-lg">
              <Menu size={24} />
          </button>
          
          <div className="text-right">
              <h1 className="text-sm font-black uppercase tracking-tight text-gray-900 leading-none">{user.nombre}</h1>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${user.rol === 'admin' ? 'bg-black text-white' : 'bg-purple-100 text-purple-700'}`}>
                  {user.rol}
              </span>
          </div>
      </header>

      {/* 2. SIDEBAR (Overlay Drawer) */}
      {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
              {/* Backdrop */}
              <div 
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                  onClick={() => setIsSidebarOpen(false)}
              ></div>
              
              {/* Drawer Content */}
              <div className="relative w-3/4 max-w-xs bg-white h-full shadow-2xl flex flex-col animate-slide-right">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                      <div className="flex flex-col">
                           <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl font-black text-gray-400">
                                {user.nombre.charAt(0).toUpperCase()}
                           </div>
                           <h2 className="text-lg font-black text-gray-900 leading-tight">{user.nombre}</h2>
                           <p className="text-xs text-gray-400 font-medium break-all">{user.correo}</p>
                      </div>
                      <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-black">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex-1 p-6">
                      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                          <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Tu Rol Actual</p>
                          <p className="text-xl font-black text-purple-700 capitalize">{user.rol}</p>
                      </div>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50">
                      <button 
                          onClick={onLogout} 
                          className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors"
                      >
                          <LogOut size={16} /> Cerrar Sesión
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* 3. MAIN CONTENT */}
      <main className="p-4 max-w-5xl mx-auto">
          {children}
      </main>

      {/* 4. BOTTOM NAVIGATION (Sticky Footer) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 pb-safe pt-1 px-2 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] flex justify-around items-center h-[70px]">
          <NavItem to="/" icon={LayoutDashboard} label="Panel" />
          <NavItem to="/emisores" icon={Radio} label="Emisores" />
          {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo" />}
      </nav>

      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        @keyframes slide-right {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
        }
        .animate-slide-right { animation: slide-right 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default Layout;
