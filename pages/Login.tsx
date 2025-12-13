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

    // Validación extra de nombre
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
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-[380px] relative z-10 animate-scale-in">
        <div className="mb-12 text-center">
            {/* Logo Central */}
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-card mx-auto relative group">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-500" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" fillOpacity="0.1"/>
                </svg>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-white animate-pulse"></div>
            </div>

            <h1 className="text-3xl font-bold text-secondary tracking-tight mb-2">
                {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
            </h1>
            <p className="text-gray-500">
                {isRegistering ? 'Ingresa tus datos para comenzar.' : 'Ingresa a tu espacio de trabajo.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Nombre (Solo registro) */}
            {isRegistering && (
                <div className="animate-slide-up" style={{animationDelay: '0.1s'}}>
                    <div className="relative group">
                        <UserIcon size={20} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
                            placeholder="Nombre Completo"
                            required={isRegistering}
                        />
                    </div>
                </div>
            )}

            <div className="relative group">
                <Mail size={20} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all shadow-sm"
                    placeholder="correo@ejemplo.com"
                    required
                />
            </div>

            <div className="relative group">
                <Lock size={20} className="absolute left-4 top-4 text-gray-400 group-focus-within:text-accent transition-colors" />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-accent focus:ring-4 focus:ring-accent/10 outline-none transition-all shadow-sm"
                    placeholder="Contraseña"
                    required
                />
            </div>

          {error && (
            <div className="animate-slide-up bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 items-start">
                <AlertCircle className="text-danger shrink-0 mt-0.5" size={18} />
                <p className="text-danger text-sm font-medium leading-tight">{error.message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white h-14 rounded-xl font-semibold text-base hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 shadow-lg shadow-black/10 mt-6"
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

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(null); setName(''); }}
            className="text-sm font-medium text-gray-500 hover:text-primary transition-colors focus:outline-none"
          >
            {isRegistering ? (
                <span>¿Ya tienes cuenta? <span className="text-secondary font-bold underline decoration-2 decoration-accent/30 underline-offset-4">Entra aquí</span></span>
            ) : (
                <span>¿Nuevo en Moon? <span className="text-secondary font-bold underline decoration-2 decoration-primary/30 underline-offset-4">Crea una cuenta</span></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;