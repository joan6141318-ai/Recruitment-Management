import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Emisores from './pages/Emisores';
import Reclutadores from './pages/Reclutadores';
import { User } from './types';
import { authService } from './services/auth'; 
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Moon } from 'lucide-react';

// Splash Screen Minimalista y Profesional
const SplashScreen = () => (
  <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
      <div className="mb-6 animate-pulse">
        <Moon size={48} className="text-primary" strokeWidth={1.5} />
      </div>
      <h1 className="text-xl font-bold text-gray-900 tracking-tight">Agencia Moon</h1>
      <p className="text-xs text-gray-400 mt-2">Cargando información...</p>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Breve delay para transición suave
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      if (firebaseUser) {
        try {
          const profile = await authService.getUserProfile(firebaseUser.uid, firebaseUser.email || '');
          if (profile.rol === 'banned') {
             await authService.logout();
             setUser(null);
          } else {
             setUser(profile);
          }
        } catch (error) {
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