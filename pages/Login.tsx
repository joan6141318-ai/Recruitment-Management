import React, { useState } from 'react';
import { authService } from '../services/auth';
import { User } from '../types';
import { ArrowRight, Moon, Lock, Mail, User as UserIcon, AlertTriangle } from 'lucide-react';

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
      
      // Diagnóstico preciso de errores de configuración
      let errorMsg = 'Error desconocido.';
      const errorCode = err.code || 'unknown';

      switch (errorCode) {
        case 'auth/invalid-api-key':
          errorMsg = 'CRÍTICO: La API Key en services/firebase.ts es inválida o no existe.';
          break;
        case 'auth/operation-not-allowed':
          errorMsg = 'CONFIGURACIÓN: Debes habilitar "Correo/Contraseña" en la consola de Firebase > Authentication.';
          break;
        case 'auth/email-already-in-use':
          errorMsg = 'Este correo ya está registrado. Intenta iniciar sesión.';
          break;
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMsg = 'Correo o contraseña incorrectos.';
          break;
        case 'auth/weak-password':
          errorMsg = 'La contraseña es muy débil (mínimo 6 caracteres).';
          break;
        case 'permission-denied':
          errorMsg = 'PERMISOS: Las reglas de Firestore bloquean la escritura. Revisa las reglas de seguridad.';
          break;
        case 'auth/network-request-failed':
          errorMsg = 'Error de conexión. Verifica tu internet o la configuración de CORS.';
          break;
        default:
          errorMsg = err.message || 'Error de conexión o datos inválidos.';
      }

      setError({ message: errorMsg, code: errorCode });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 animate-fade-in">
      <div className="w-full max-w-sm">
        {/* Header Minimalista */}
        <div className="mb-10 text-center md:text-left">
          <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6 shadow-glow mx-auto md:mx-0">
             <Moon size={24} className="text-white fill-current" />
          </div>
          <h1 className="text-4xl font-bold text-black tracking-tight mb-2">
            {isRegistering ? 'Crear Cuenta' : 'Bienvenido'}
          </h1>
          <p className="text-gray-400 text-lg">
            {isRegistering ? 'Únete al equipo Moon.' : 'Inicia sesión en Moon.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            {isRegistering && (
              <div className="group">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nombre</label>
                <div className="relative">
                  <UserIcon size={20} className="absolute left-0 bottom-3 text-gray-300" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-8 pb-3 bg-transparent border-b-2 border-gray-100 text-lg font-medium text-black focus:border-black focus:outline-none transition-all placeholder-gray-200"
                    placeholder="Tu Nombre"
                    required={isRegistering}
                  />
                </div>
              </div>
            )}

            <div className="group">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Correo</label>
              <div className="relative">
                <Mail size={20} className="absolute left-0 bottom-3 text-gray-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="w-full pl-8 pb-3 bg-transparent border-b-2 border-gray-100 text-lg font-medium text-black focus:border-black focus:outline-none transition-all placeholder-gray-200"
                  placeholder="usuario@moon.com"
                  required
                />
              </div>
            </div>

            <div className="group">
               <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contraseña</label>
               <div className="relative">
                 <Lock size={20} className="absolute left-0 bottom-3 text-gray-300" />
                 <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    className="w-full pl-8 pb-3 bg-transparent border-b-2 border-gray-100 text-lg font-medium text-black focus:border-black focus:outline-none transition-all placeholder-gray-200"
                    placeholder="••••••••"
                    required
                  />
               </div>
            </div>
          </div>

          {error && (
            <div className="animate-slide-up bg-red-50 p-4 rounded-xl border border-red-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-danger shrink-0 mt-0.5" size={18} />
                <div>
                   <p className="text-danger text-sm font-bold">{error.message}</p>
                   <p className="text-red-400 text-xs mt-1 font-mono">{error.code}</p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white h-14 rounded-xl font-semibold text-lg hover:bg-gray-900 focus:ring-4 focus:ring-gray-200 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed group shadow-soft mt-4"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                {isRegistering ? 'Registrarse' : 'Entrar'} 
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
              className="ml-2 font-bold text-black hover:underline focus:outline-none"
            >
              {isRegistering ? 'Inicia Sesión' : 'Regístrate'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;