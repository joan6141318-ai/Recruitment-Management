import React, { useState } from 'react';
import { authService } from '../services/db';
import { User } from '../types';
import { Lock, Mail, Moon } from 'lucide-react';

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
        // More specific error message based on input
        if (password) {
           setError('Contraseña incorrecta. Verifica que sea: Moon2026');
        } else {
           setError('Usuario no encontrado o requiere contraseña.');
        }
        setLoading(false);
      }
    } catch (err) {
      setError('Error al conectar con el sistema.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/5 rounded-full mb-4 animate-pulse">
             <Moon size={32} className="text-primary fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agencia <span className="text-secondary">Moon</span></h1>
          <p className="text-gray-500">Gestión de Emisores y Reclutadores</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value);
                    setError(''); // Clear error on type
                }}
                className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                placeholder="ejemplo@agencia.com"
                required
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Contraseña
               <span className="ml-2 text-xs text-gray-400 font-normal">(Requerida para Reclutadores)</span>
             </label>
             <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                      setPassword(e.target.value);
                      setError(''); // Clear error on type
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
                  placeholder="Contraseña Maestra"
                />
             </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center animate-pulse border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-purple-800 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-70"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400 space-y-2">
          <p className="font-semibold text-gray-500">Credenciales de Acceso:</p>
          <div className="grid grid-cols-1 gap-1">
             <p>Admin: <span className="font-mono bg-gray-100 px-1 rounded">Joan... / elianaloor...</span> (Sin pass)</p>
             <p>Reclutador: <span className="font-mono bg-gray-100 px-1 rounded">Cualquier Correo</span> + <span className="font-mono font-bold text-primary">Moon2026</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;