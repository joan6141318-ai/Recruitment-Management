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
    <div className="relative mb-8 animate-fade-in-up">
       <div className="relative bg-black p-6 rounded-2xl shadow-2xl flex items-center justify-center transform transition-transform hover:scale-105">
          <Moon size={40} className="text-white fill-current" />
       </div>
    </div>
    
    <div className="text-center space-y-3">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
        Agencia <span className="text-primary">Moon</span>
      </h1>
      <div className="flex justify-center gap-1.5 pt-2">
         <div className="w-1.5 h-1.5 bg-gray-200 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
         <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
         <div className="w-1.5 h-1.5 bg-black rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
      </div>
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
      // Force a minimum splash screen time for branding experience
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };
    
    initApp();
  }, []);

  const handleLogin = (newUser: User) => {
    setLoading(true);
    setUser(newUser);
    localStorage.setItem('agencia_user', JSON.stringify(newUser));
    
    setTimeout(() => {
      setLoading(false);
    }, 1500);
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