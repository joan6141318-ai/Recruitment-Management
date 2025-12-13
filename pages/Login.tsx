import React, { useState } from 'react';
import { authService } from '../services/auth';
import { User } from '../types';
import { ArrowRight, Lock, Mail, User as UserIcon, AlertCircle, Sparkles } from 'lucide-react';

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
      
      if (user) {
        onLogin(user);
      }
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      let errorMsg = 'Ocurrió un error inesperado.';
      const errorCode = err.code || 'unknown';

      if (errorCode === 'auth/invalid-email') errorMsg = 'El correo electrónico no es válido.';
      else if (errorCode === 'auth/email-already-in-use') errorMsg = 'Este correo ya está registrado.';
      else if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') errorMsg = 'Correo o contraseña incorrectos.';
      else if (errorCode === 'auth/weak-password') errorMsg = 'La contraseña es muy débil (mínimo 6 caracteres).';

      setError({ message: errorMsg, code: errorCode });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-6 relative overflow-hidden">
      
      {/* Animated Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-400/20 rounded-full blur-3xl animate-float pointer-events-none mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-gradient-to-tr from-accent/20 to-orange-300/20 rounded-full blur-3xl animate-float-delayed pointer-events-none mix-blend-multiply"></div>

      <div className="w-full max-w-[400px] relative z-10 animate-scale-in">
        <div className="glass-card p-8 rounded-[2rem] shadow-soft">
            <div className="mb-10 text-center">
                {/* Logo Central */}
                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/10 mx-auto relative group transition-transform duration-500 hover:rotate-3">
                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-primary group-hover:scale-110 transition-transform duration-500" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" fillOpacity="0.1"/>
                    </svg>
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent rounded-full border-2 border-white animate-pulse-slow shadow-sm"></div>
                </div>

                <h1 className="text-3xl font-bold text-secondary tracking-tight mb-2">
                    {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
                </h1>
                <p className="text-subtle text-sm font-medium">
                    {isRegistering ? 'Únete a Moon para gestionar tu equipo.' : 'Ingresa a tu espacio de trabajo digital.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Nombre (Solo registro) */}
                {isRegistering && (
                    <div className="animate-slide-up" style={{animationDelay: '0ms'}}>
                        <div className="relative group">
                            <UserIcon size={20} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors duration-300" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl text-secondary placeholder-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
                                placeholder="Nombre Completo"
                                required={isRegistering}
                            />
                        </div>
                    </div>
                )}

                <div className="relative group animate-slide-up" style={{animationDelay: isRegistering ? '100ms' : '0ms'}}>
                    <Mail size={20} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-secondary transition-colors duration-300" />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl text-secondary placeholder-gray-400 focus:bg-white focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none transition-all shadow-sm"
                        placeholder="correo@ejemplo.com"
                        required
                    />
                </div>

                <div className="relative group animate-slide-up" style={{animationDelay: isRegistering ? '200ms' : '100ms'}}>
                    <Lock size={20} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-accent transition-colors duration-300" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-gray-200 rounded-xl text-secondary placeholder-gray-400 focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all shadow-sm"
                        placeholder="Contraseña"
                        required
                    />
                </div>

                {error && (
                    <div className="animate-fade-in bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 items-start mt-2">
                        <AlertCircle className="text-danger shrink-0 mt-0.5" size={18} />
                        <p className="text-danger text-sm font-medium leading-tight">{error.message}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-secondary text-white h-14 rounded-xl font-bold text-base hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 shadow-xl shadow-secondary/20 mt-6 animate-slide-up"
                    style={{animationDelay: isRegistering ? '300ms' : '200ms'}}
                >
                    {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                    <span className="flex items-center">
                        {isRegistering ? 'Comenzar Ahora' : 'Iniciar Sesión'} 
                        <ArrowRight size={18} className="ml-2 opacity-80" />
                    </span>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center animate-fade-in" style={{animationDelay: '400ms'}}>
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setError(null); setName(''); }}
                    className="text-sm font-medium text-gray-500 hover:text-primary transition-colors focus:outline-none"
                >
                    {isRegistering ? (
                        <span>¿Ya tienes cuenta? <span className="text-secondary font-bold underline decoration-2 decoration-accent/30 underline-offset-4 hover:decoration-accent transition-all">Entra aquí</span></span>
                    ) : (
                        <span>¿Nuevo en Moon? <span className="text-secondary font-bold underline decoration-2 decoration-primary/30 underline-offset-4 hover:decoration-primary transition-all">Crea una cuenta</span></span>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;