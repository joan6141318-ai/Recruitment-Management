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
      setError({ message: 'Credenciales incorrectas.', code: err.code });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[360px] animate-pop-in">
        
        <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg mb-4">
                <Moon className="text-white fill-white" size={20} />
            </div>
            <h1 className="text-xl font-black text-black tracking-tight">Agencia Moon</h1>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-gray-100">
            <h2 className="text-lg font-bold text-black mb-6">
                {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
                {isRegistering && (
                    <div className="relative group">
                        <UserIcon size={16} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-black font-medium text-sm focus:bg-white focus:border-black outline-none transition-all"
                            placeholder="Nombre completo"
                            required={isRegistering}
                        />
                    </div>
                )}

                <div className="relative group">
                    <Mail size={16} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-black font-medium text-sm focus:bg-white focus:border-black outline-none transition-all"
                        placeholder="correo@ejemplo.com"
                        required
                    />
                </div>

                <div className="relative group">
                    <Lock size={16} className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-black font-medium text-sm focus:bg-white focus:border-black outline-none transition-all"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && (
                    <div className="bg-red-50 p-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={14} />
                        <p className="text-red-500 text-xs font-medium">{error.message}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-900 transition-all flex items-center justify-center gap-2 mt-2"
                >
                    {loading ? (
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                       <>
                         {isRegistering ? 'Registrarse' : 'Entrar'} <ArrowRight size={16} />
                       </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center pt-4 border-t border-gray-50">
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                    className="text-xs font-bold text-gray-400 hover:text-black transition-colors"
                >
                    {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;