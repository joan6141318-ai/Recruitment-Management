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
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[400px] animate-pop-in">
        
        {/* LOGO SECTION */}
        <div className="flex flex-col items-center mb-10">
            <div className="w-24 h-24 bg-black rounded-3xl flex items-center justify-center shadow-2xl shadow-black/20 mb-6 -rotate-6">
                <Moon className="text-white fill-white" size={48} />
            </div>
            <h1 className="text-center leading-none">
                <span className="block text-sm font-bold text-gray-500 tracking-[0.4em] mb-2 uppercase">Plataforma</span>
                <span className="block text-5xl font-black text-black tracking-tight">Agencia Moon</span>
            </h1>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-card border border-white relative overflow-hidden">
            <h2 className="text-2xl font-black text-black mb-8 tracking-tight">
                {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {isRegistering && (
                    <div className="relative group">
                        <UserIcon size={20} className="absolute left-5 top-5 text-gray-300 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-background border-2 border-transparent rounded-2xl text-black font-bold placeholder-gray-300 focus:bg-white focus:border-black outline-none transition-all text-sm"
                            placeholder="Tu Nombre"
                            required={isRegistering}
                        />
                    </div>
                )}

                <div className="relative group">
                    <Mail size={20} className="absolute left-5 top-5 text-gray-300 group-focus-within:text-black transition-colors" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-transparent rounded-2xl text-black font-bold placeholder-gray-300 focus:bg-white focus:border-black outline-none transition-all text-sm"
                        placeholder="correo@ejemplo.com"
                        required
                    />
                </div>

                <div className="relative group">
                    <Lock size={20} className="absolute left-5 top-5 text-gray-300 group-focus-within:text-black transition-colors" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-transparent rounded-2xl text-black font-bold placeholder-gray-300 focus:bg-white focus:border-black outline-none transition-all text-sm"
                        placeholder="••••••••"
                        required
                    />
                </div>

                {error && (
                    <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-3 animate-pop-in">
                        <AlertCircle className="text-red-500" size={16} />
                        <p className="text-red-500 text-xs font-bold">{error.message}</p>
                    </div>
                )}

                {/* BOTÓN NEGRO (ELEGANCIA) */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition-all flex items-center justify-center gap-3 mt-6 shadow-xl active:scale-95 duration-200"
                >
                    {loading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                       <>
                         {isRegistering ? 'Registrar' : 'Ingresar'} <ArrowRight size={18} strokeWidth={3} />
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
                {isRegistering ? 'Ya tengo cuenta' : 'No tengo cuenta'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;