
import React, { useState } from 'react';
import { User } from '../types';
import { LogOut, Radio, LayoutDashboard, Banknote, FileText, Sparkles, Users, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 mb-1 ${
          active ? 'bg-black text-white shadow-lg shadow-black/10' : 'text-gray-400 hover:text-black hover:bg-gray-100'
        }`}
      >
        <Icon size={20} className={`mr-3 ${active ? 'text-primary' : ''}`} />
        <span className="text-sm font-bold tracking-tight">{label}</span>
      </Link>
    );
  };

  const BottomNavItem = ({ to, icon: Icon }: { to: string, icon: any }) => {
    const active = isActive(to);
    return (
      <Link to={to} className={`p-3 rounded-2xl transition-all ${active ? 'bg-black text-white' : 'text-gray-400'}`}>
        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-100 h-screen sticky top-0 p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <img src="/icon.svg" className="w-6 h-6 brightness-200" alt="Moon" />
          </div>
          <h1 className="font-brand font-black text-xl tracking-tighter">MOON</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/emisores" icon={Radio} label="Emisores" />
          <NavItem to="/remuneracion" icon={Banknote} label="Pagos" />
          <NavItem to="/factura" icon={FileText} label="Facturación" />
          <NavItem to="/chatbot" icon={Sparkles} label="agencIA" />
          {user.rol === 'admin' && <NavItem to="/reclutadores" icon={Users} label="Equipo" />}
        </nav>

        <div className="pt-8 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black uppercase">
              {user.nombre.charAt(0)}
            </div>
            <span className="text-xs font-bold truncate max-w-[100px]">{user.nombre}</span>
          </div>
          <button onClick={onLogout} className="text-gray-300 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-6 bg-white border-b border-gray-50">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" className="w-8 h-8 rounded-lg bg-black p-1" alt="Moon" />
            <span className="font-brand font-black text-lg">MOON</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black">
            {user.nombre.charAt(0)}
          </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-16 max-w-7xl mx-auto w-full mb-24 md:mb-0 animate-fade-in">
        {children}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 glass-nav border border-gray-100 rounded-[2.5rem] px-6 py-2.5 flex items-center gap-6 shadow-2xl z-50">
        <BottomNavItem to="/" icon={LayoutDashboard} />
        <BottomNavItem to="/emisores" icon={Radio} />
        <BottomNavItem to="/remuneracion" icon={Banknote} />
        <BottomNavItem to="/factura" icon={FileText} />
        <BottomNavItem to="/chatbot" icon={Sparkles} />
      </div>
    </div>
  );
};

export default Layout;
