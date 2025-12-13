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
      setError({ message: 'Error de autenticación.', code: err.code });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-[400px] animate-pop-in">
        
        <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center shadow-xl shadow-black/20 mb-6 rotate-3">
                <Moon className="text-white fill-white" size={40} />
            </div>
            {/* TEXTO CORREGIDO: AGENCIA MOON */}
            <h1 className="text-4xl font-black text-black tracking-tighter uppercase text-center leading-none">
                AGENCIA<br/><span className="text-primary">MOON</span>
            </h1>
            <p className="text-accent font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Plataforma de Gestión</p>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-card border border-white relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[3rem] -z-0"></div>

            <h2 className="text-2xl font-black text-black mb-8 relative z-10 uppercase">
                {isRegistering ? 'Registro' : 'Ingresar'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {isRegistering && (
                    <div className="relative group">
                        <UserIcon size={20} className="absolute left-5 top-5 text-gray-300 group-focus-within:text-black transition-colors" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-14 pr-6 py-5 bg-background border-2 border-transparent rounded-2xl text-black font-bold placeholder-gray-300 focus:bg-white focus:border-black outline-none transition-all uppercase text-sm"
                            placeholder="NOMBRE"
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
                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-transparent rounded-2xl text-black font-bold placeholder-gray-300 focus:bg-white focus:border-black outline-none transition-all uppercase text-sm"
                        placeholder="CORREO"
                        required
                    />
                </div>

                <div className="relative group">
                    <Lock size={20} className="absolute left-5 top-5 text-gray-300 group-focus-within:text-black transition-colors" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-background border-2 border-transparent rounded-2xl text-black font-bold placeholder-gray-300 focus:bg-white focus:border-black outline-none transition-all uppercase text-sm"
                        placeholder="CONTRASEÑA"
                        required
                    />
                </div>

                {error && (
                    <div className="bg-red-50 p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
                        <AlertCircle className="text-red-500" size={16} />
                        <p className="text-red-500 text-xs font-bold uppercase">{error.message}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-3 mt-6 shadow-xl active:scale-95 duration-200"
                >
                    {loading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                       <>
                         {isRegistering ? 'Crear Cuenta' : 'Acceder'} <ArrowRight size={18} />
                       </>
                    )}
                </button>
            </form>
        </div>

        <div className="mt-8 text-center">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-[10px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-[0.2em]"
            >
                {isRegistering ? '¿Tienes cuenta? Entrar' : '¿No tienes cuenta? Crear'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;