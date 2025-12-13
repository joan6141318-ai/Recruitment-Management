import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Emisores from './pages/Emisores';
import Reclutadores from './pages/Reclutadores';
import { User } from './types';
import { authService, auth } from './services/db'; 
import { Moon } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';

const SplashScreen = () => (
  <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
    <div className="mb-8 relative">
       <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center shadow-2xl rotate-3 animate-[spin_3s_ease-in-out_infinite]">
          <Moon size={40} className="text-white fill-current -rotate-3" />
       </div>
    </div>
    
    <h1 className="text-2xl font-bold tracking-[0.2em] text-black animate-pulse">
      MOON
    </h1>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escucha real de Firebase Auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Si hay usuario en Auth, traemos sus datos de negocio de Firestore
          const profile = await authService.getUserProfile(firebaseUser.uid, firebaseUser.email || '');
          setUser(profile);
        } catch (error) {
          console.error("Error fetching profile", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      // Pequeño delay artificial para que la Splash Screen no parpadee demasiado rápido
      setTimeout(() => setLoading(false), 800);
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = (newUser: User) => {
    // El estado se actualizará automáticamente gracias a onAuthStateChanged,
    // pero podemos forzar el estado aquí para feedback inmediato si es necesario.
    setUser(newUser);
  };

  const handleLogout = async () => {
    await authService.logout();
    // setUser(null) lo maneja el onAuthStateChanged
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
              <Route path="/reclutadores" element={<Reclutadores />} />
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