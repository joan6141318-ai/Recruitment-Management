import React, { useState } from 'react';
import { authService } from '../services/auth';
import { User } from '../types';
import { Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

// NUEVO LOGO: "Orbital Focus"
const BrandLogo = ({ className = "w-12 h-12" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none">
     <rect width="100" height="100" rx="22" className="fill-black"/>
     <path d="M72 26C65.8 20.8 58 18 50 18C32.3269 18 18 32.3269 18 50C18 67.6731 32.3269 82 50 82C67.6731 82 82 67.6731 82 50C82 46.5 81.4 43.1 80.3 39.9" stroke="white" strokeWidth="10" strokeLinecap="round"/>
     <circle cx="78" cy="26" r="8" className="fill-primary"/>
  </svg>
);

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
      setError({ message: 'Credenciales inválidas.', code: err.code });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6 font-sans">
      <div className="w-full max-w-[380px] animate-pop-in">
        
        {/* HEADER */}
        <div className="flex flex-col items-center mb-8">
            <div className="mb-4 shadow-2xl shadow-gray-200 rounded-[25px]">
                <BrandLogo className="w-20 h-20" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Agencia Moon</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Gestor de Reclutamiento</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-100 border border-white">
            <h2 className="text-lg font-bold text-gray-900 mb-6 text-center">
                {isRegistering ? 'Crear Cuenta' : 'Acceso'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegistering && (
                    <div className="relative group">
                        <UserIcon size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black/5 outline-none transition-all placeholder-gray-400"
                            placeholder="Nombre Completo"
                            required={isRegistering}
                        />
                    </div>
                )}

                <div className="relative group">
                    <Mail size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black/5 outline-none transition-all placeholder-gray-400"
                        placeholder="Correo electrónico"
                        required
                    />
                </div>

                <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-black/5 outline-none transition-all placeholder-gray-400"
                        placeholder="Contraseña"
                        required
                    />
                </div>

                {error && (
                    <div className="bg-red-50 p-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="text-red-600" size={16} />
                        <p className="text-red-600 text-xs font-bold">{error.message}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm hover:bg-gray-900 transition-all transform active:scale-95 shadow-lg mt-2"
                >
                    {loading ? 'Cargando...' : (isRegistering ? 'Registrar' : 'Entrar')}
                </button>
            </form>
        </div>

        <div className="mt-8 text-center">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-xs font-bold text-gray-400 hover:text-black transition-colors"
            >
                {isRegistering ? 'Ya tengo cuenta' : '¿No tienes cuenta? Regístrate'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;