import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Emisores from './pages/Emisores';
import Reclutadores from './pages/Reclutadores';
import { User } from './types';
import { Moon } from 'lucide-react';

const SplashScreen = () => (
  <div className="fixed inset-0 bg-primary z-50 flex flex-col items-center justify-center text-white">
    <div className="animate-bounce-slow mb-6">
       <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/10">
          <Moon size={48} className="text-white fill-current" />
       </div>
    </div>
    
    <h1 className="text-3xl font-bold tracking-tight animate-fade-in drop-shadow-sm">
      Agencia <span className="text-white/90">Moon</span>
    </h1>
    
    <div className="mt-10 flex space-x-2">
      <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
      <div className="w-2.5 h-2.5 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2.5 h-2.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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
      // Reduced splash screen time for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
    
    // Quick transition
    setTimeout(() => {
      setLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('agencia_user');
  };

  if (loading) return <SplashScreen />;

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
};

export default App;