import React, { useState } from 'react';
import { authService } from '../services/auth';
import { User } from '../types';
import { ArrowRight, Moon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let user: User;
      if (isRegistering) {
        user = await authService.register(email, password, name);
      } else {
        user = await authService.login(email, password);
      }
      
      if (user.rol === 'banned') {
          setError('Acceso denegado. Contacte al administrador.');
          await authService.logout();
          setLoading(false);
          return;
      }
      onLogin(user);
    } catch (err: any) {
      setError('Credenciales incorrectas.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {/* HEADER MINIMALISTA */}
        <div className="mb-10 text-center">
            <div className="flex justify-center mb-4">
                {/* Logo limpio sin contenedores extraños */}
                <Moon className="text-primary" size={42} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Agencia Moon
            </h1>
            <p className="text-sm text-gray-500 mt-2 font-medium">
                Gestor de Reclutamiento
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
                <div>
                     <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Nombre Completo</label>
                     <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-black focus:ring-0 outline-none transition-colors"
                        placeholder="Nombre y Apellido"
                        required
                     />
                </div>
            )}

            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Correo Electrónico</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-black focus:ring-0 outline-none transition-colors"
                    placeholder="nombre@ejemplo.com"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 ml-1">Contraseña</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:border-black focus:ring-0 outline-none transition-colors"
                    placeholder="••••••••"
                    required
                />
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-center">
                    <p className="text-red-600 text-xs font-medium">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-black text-white py-3.5 rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    {isRegistering ? 'Registrarse' : 'Iniciar Sesión'} 
                    <ArrowRight size={16} />
                  </>
                )}
            </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-gray-50">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-xs font-medium text-gray-500 hover:text-black transition-colors"
            >
                {isRegistering 
                  ? '¿Ya tienes cuenta? Inicia sesión' 
                  : '¿No tienes cuenta? Regístrate aquí'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;