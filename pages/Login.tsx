
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
      // Verificar si está baneado
      if (user.rol === 'banned') {
          setError('Acceso revocado. Contacta al administrador.');
          await authService.logout();
          setLoading(false);
          return;
      }
      onLogin(user);
    } catch (err: any) {
      setError('Credenciales incorrectas o error de conexión.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm animate-pop-in">
        
        {/* LOGO MODERNO */}
        <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl mb-4 shadow-lg shadow-purple-900/20">
                <Moon className="text-white fill-white" size={32} />
            </div>
            <h1 className="text-4xl font-black text-black tracking-tighter mb-1">
                Agency Moon
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">
                Gestor de Reclutamiento
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
                <div className="space-y-1">
                     <label className="text-[10px] font-bold text-gray-900 uppercase ml-1">Nombre Completo</label>
                     <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-black focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        placeholder="Ej. Juan Pérez"
                        required
                     />
                </div>
            )}

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-900 uppercase ml-1">Correo Electrónico</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-black focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    placeholder="usuario@agenciamoon.com"
                    required
                />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-900 uppercase ml-1">Contraseña</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-black focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    placeholder="••••••••"
                    required
                />
            </div>

            {error && (
                <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
            >
                {loading ? 'Cargando...' : (isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión')} 
                {!loading && <ArrowRight size={16} />}
            </button>
        </form>

        <div className="mt-8 text-center">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-xs font-bold text-gray-400 hover:text-black transition-colors"
            >
                {isRegistering ? '¿Ya tienes cuenta? Ingresa aquí' : '¿Nuevo reclutador? Crea una cuenta'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
