import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Emisores from './pages/Emisores';
import Reclutadores from './pages/Reclutadores';
import { User } from './types';
import { Moon } from 'lucide-react';

const SplashScreen = () => (
  <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
    <div className="relative mb-6">
       {/* Animated Moon effect */}
       <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-50"></div>
       <div className="relative bg-white p-6 rounded-full border-4 border-purple-50 shadow-xl z-10 flex items-center justify-center">
          <Moon size={48} className="text-primary fill-current" />
       </div>
    </div>
    
    <div className="text-center space-y-2">
      <h1 className="text-3xl font-bold text-gray-900 tracking-tight animate-pulse">
        Agencia <span className="text-secondary">Moon</span>
      </h1>
      <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">Cargando Plataforma</p>
    </div>

    <div className="mt-12 flex gap-2">
       <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
       <div className="w-2.5 h-2.5 bg-secondary rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
       <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage and simulate initial load time for splash screen
    const initApp = async () => {
      const storedUser = localStorage.getItem('agencia_user');
      // Force a minimum splash screen time of 2 seconds for branding
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    
    initApp();
  }, []);

  const handleLogin = (newUser: User) => {
    // Show splash screen briefly during login transition
    setLoading(true);
    setUser(newUser);
    localStorage.setItem('agencia_user', JSON.stringify(newUser));
    
    // Transition delay
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('agencia_user');
  };

  if (loading) return <SplashScreen />;

  return (
    <HashRouter>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/emisores" element={<Emisores user={user} />} />
            
            {/* Admin Protected Routes */}
            {user.rol === 'admin' ? (
              <Route path="/reclutadores" element={<Reclutadores />} />
            ) : (
               <Route path="/reclutadores" element={<Navigate to="/" />} />
            )}
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      )}
    </HashRouter>
  );
};

export default App;