import React, { useState } from 'react';
import { authService } from '../services/auth';
import { User } from '../types';
import { ArrowRight, Lock, Mail, User as UserIcon, AlertCircle, Moon } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string, code?: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isRegistering && name.trim().length < 2) {
        setError({ message: 'Nombre requerido.' });
        setLoading(false);
        return;
    }

    try {
      let user: User;
      if (isRegistering) {
        user = await authService.register(email, password, name);
      } else {
        user = await authService.login(email, password);
      }
      if (user) onLogin(user);
    } catch (err: any) {
      setError({ message: 'Error de acceso.', code: err.code });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-[380px]">
        
        {/* LOGO STATIC & CLEAN */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mb-4">
                <Moon className="text-white fill-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-black tracking-tight">Agencia Moon</h1>
            <p className="text-sm text-gray-400">Panel de Administración</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-black mb-6 border-b border-gray-100 pb-2">
                {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegistering && (
                    <div className="relative">
                        <UserIcon size={18} className="absolute left-3 top-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black focus:border-black outline-none transition-colors"
                            placeholder="Tu Nombre"
                            required={isRegistering}
                        />
                    </div>
                )}

                <div className="relative">
                    <Mail size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black focus:border-black outline-none transition-colors"
                        placeholder="Correo electrónico"
                        required
                    />
                </div>

                <div className="relative">
                    <Lock size={18} className="absolute left-3 top-3.5 text-gray-400" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-black focus:border-black outline-none transition-colors"
                        placeholder="Contraseña"
                        required
                    />
                </div>

                {error && (
                    <div className="bg-red-50 p-3 rounded-lg flex items-center gap-2">
                        <AlertCircle className="text-red-600" size={16} />
                        <p className="text-red-600 text-xs font-bold">{error.message}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-4"
                >
                    {loading ? 'Cargando...' : (isRegistering ? 'Registrar' : 'Entrar')}
                </button>
            </form>
        </div>

        <div className="mt-6 text-center">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-xs font-bold text-gray-500 hover:text-black transition-colors underline"
            >
                {isRegistering ? 'Volver al login' : '¿No tienes cuenta? Regístrate'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;