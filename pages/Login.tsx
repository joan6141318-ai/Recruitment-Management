import React, { useState } from 'react';
import { authService } from '../services/db';
import { User } from '../types';
import { ArrowRight, Moon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await authService.login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Credenciales incorrectas');
        setLoading(false);
      }
    } catch (err) {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 animate-fade-in">
      <div className="w-full max-w-sm">
        {/* Header Minimalista */}
        <div className="mb-12">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6 shadow-glow">
             <Moon size={24} className="text-white fill-current" />
          </div>
          <h1 className="text-4xl font-bold text-black tracking-tight mb-2">Bienvenido.</h1>
          <p className="text-gray-400 text-lg">Inicia sesión en Moon.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="group">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className="w-full pb-3 bg-transparent border-b-2 border-gray-100 text-xl font-medium text-black focus:border-black focus:outline-none transition-all placeholder-gray-200"
                placeholder="usuario@moon.com"
                required
              />
            </div>

            <div className="group">
               <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">Contraseña</label>
               <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full pb-3 bg-transparent border-b-2 border-gray-100 text-xl font-medium text-black focus:border-black focus:outline-none transition-all placeholder-gray-200"
                  placeholder="••••••••"
                />
            </div>
          </div>

          {error && (
            <p className="text-danger text-sm font-medium animate-slide-up flex items-center">
              <span className="w-1.5 h-1.5 bg-danger rounded-full mr-2"></span>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white h-14 rounded-xl font-semibold text-lg hover:bg-gray-900 focus:ring-4 focus:ring-gray-200 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group shadow-soft"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Entrar <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;