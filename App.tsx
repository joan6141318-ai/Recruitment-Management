
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

const SplashScreen = () => (
  <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 animate-pulse">
        <Moon size={40} className="text-black fill-black" />
      </div>
      <h1 className="text-3xl font-black text-white tracking-tight mb-2">Agencia Moon</h1>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Minimo delay para mostrar el splash screen bonito
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
