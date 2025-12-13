import React, { useState } from 'react';
import { authService } from '../services/auth';
import { User } from '../types';
import { ArrowRight, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

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
        setError({ message: 'Por favor ingresa tu nombre completo.' });
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
      setError({ message: 'Error de autenticación. Verifica tus datos.', code: err.code });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[380px] animate-enter">
        
        <div className="text-center mb-10">
            <h1 className="text-5xl font-black text-black tracking-tighter mb-2">MOON.</h1>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.3em]">Agency Manager</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-purple-900/5 border border-gray-100">
            <h2 className="text-2xl font-bold text-black mb-6">{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegistering && (
                    <div className="relative group">
                        <UserIcon size={18} className="absolute left-5 top-5 text-gray-400 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-background border-2 border-transparent rounded-2xl text-black font-bold placeholder-gray-300 focus:bg-white focus:border-black outline-none transition-all"
                            placeholder="Nombre"
                            required={isRegistering}
                        />
                    </div>
                )}

                <div className="relative group">
                    <Mail size={18} className="absolute left-5 top-5 text-gray-400 group-focus-within:text-black transition-colors" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-background border-2 border-transparent rounded-2xl text-black font-bold placeholder-gray-300 focus:bg-white focus:border-black outline-none transition-all"
                        placeholder="Correo"
                        required
                    />
                </div>

                <div className="relative group">
                    <Lock size={18} className="absolute left-5 top-5 text-gray-400 group-focus-within:text-black transition-colors" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-background border-2 border-transparent rounded-2xl text-black font-bold placeholder-gray-300 focus:bg-white focus:border-black outline-none transition-all"
                        placeholder="Contraseña"
                        required
                    />
                </div>

                {error && (
                    <div className="bg-red-50 p-4 rounded-xl flex items-center gap-3">
                        <AlertCircle className="text-red-500" size={16} />
                        <p className="text-red-500 text-xs font-bold">{error.message}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 mt-4 shadow-xl active:scale-95 duration-200"
                >
                    {loading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                       <>
                         {isRegistering ? 'Registrarse' : 'Entrar'} <ArrowRight size={20} />
                       </>
                    )}
                </button>
            </form>
        </div>

        <div className="mt-8 text-center">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest"
            >
                {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;