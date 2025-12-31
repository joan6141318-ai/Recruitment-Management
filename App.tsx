
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Emisores from './pages/Emisores';
import Reclutadores from './pages/Reclutadores';
import Remuneracion from './pages/Remuneracion';
import Factura from './pages/Factura';
import ChatBot from './pages/ChatBot';
import { User } from './types';
import { authService } from './services/auth'; 
import { dataService } from './services/db';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth'; 
import { ShieldAlert, LogOut } from 'lucide-react';

const SplashScreen = () => (
  <div className="fixed inset-0 bg-[#FAFAFA] z-50 flex flex-col items-center justify-center">
    <div className="mb-8 animate-pulse shadow-2xl shadow-gray-200 rounded-full">
       <img src="/icon.svg" alt="Loading..." className="w-24 h-24 object-contain rounded-full bg-black" />
    </div>
    <div className="flex gap-2 items-center">
        <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
    </div>
  </div>
);

const RevokedScreen = ({ onLogout }: { onLogout: () => void }) => (
  <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-8 text-center animate-pop-in">
    <div className="bg-red-50 p-6 rounded-full mb-8 shadow-xl shadow-red-100">
      <ShieldAlert size={64} className="text-red-500" />
    </div>
    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-4 max-w-sm">
      Lo sentimos no tienes acceso para utilizar estos servicios
    </h1>
    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-10 max-w-xs leading-relaxed">
      Tu cuenta ha sido desactivada por un administrador de Agencia Moon.
    </p>
    <button 
      onClick={onLogout}
      className="flex items-center gap-3 bg-black text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-2xl shadow-gray-200 hover:scale-105 active:scale-95 transition-all"
    >
      <LogOut size={18} />
      Cerrar Sesión
    </button>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRevoked, setIsRevoked] = useState(false);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        unsubscribeProfile = dataService.subscribeToUserProfile(firebaseUser.uid, (profile) => {
          if (profile) {
            if (profile.activo === false) {
              setIsRevoked(true);
              setUser(profile);
            } else {
              setIsRevoked(false);
              setUser(profile);
            }
          } else {
            setUser(null);
            setIsRevoked(false);
          }
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUser(null);
        setIsRevoked(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleLoginSuccess = (newUser: User) => {
    if (newUser.activo === false) {
      setIsRevoked(true);
    }
    setUser(newUser);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setIsRevoked(false);
  };

  if (loading) return <SplashScreen />;
  if (isRevoked) return <RevokedScreen onLogout={handleLogout} />;

  return (
    <BrowserRouter>
      {!user ? (
        <Login onLogin={handleLoginSuccess} />
      ) : (
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/emisores" element={<Emisores user={user} />} />
            <Route path="/remuneracion" element={<Remuneracion />} />
            <Route path="/factura" element={<Factura user={user} />} />
            
            {/* El componente ChatBot maneja internamente la restricción por rol y muestra Próximamente */}
            <Route 
              path="/chatbot" 
              element={<ChatBot user={user} />} 
            />

            {user.rol === 'admin' ? (
              <Route path="/reclutadores" element={<Reclutadores user={user} />} />
            ) : (
               <Route path="/reclutadores" element={<Navigate to="/" />} />
            )}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      )}
    </BrowserRouter>
  );
};

export default App;
