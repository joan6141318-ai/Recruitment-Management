import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Emisores from './pages/Emisores';
import Reclutadores from './pages/Reclutadores';
import Remuneracion from './pages/Remuneracion';
import Factura from './pages/Factura';
import { User } from './types';
import { authService } from './services/auth'; 
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth'; 

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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await authService.getUserProfile(firebaseUser.uid, firebaseUser.email || '');
          setUser(profile);
        } catch (error) {
          console.error("Error crítico recuperando perfil:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  if (loading) return <SplashScreen />;

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