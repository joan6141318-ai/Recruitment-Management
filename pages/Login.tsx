import React, { useState } from 'react';
import { authService } from '../services/auth';
import { User } from '../types';
import { Loader2, ArrowRight } from 'lucide-react';

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
      
      if (user.rol === 'banned') {
          setError('Acceso restringido. Contacte a administración.');
          await authService.logout();
          setLoading(false);
          return;
      }
      onLogin(user);
    } catch (err: any) {
      setError('Credenciales inválidas.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans">
      
      <div className="w-full max-w-sm animate-pop-in">
        
        {/* --- BRANDING MINIMALISTA --- */}
        <div className="mb-14 text-center">
            {/* Logo Geométrico Sólido (Negro Puro) */}
            <div className="w-16 h-16 mx-auto mb-6">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100ZM50 88C70.9868 88 88 70.9868 88 50C88 29.0132 70.9868 12 50 12C42.8246 12 36.1159 14.281 30.5 18.2C41.5 24.8 48 36.5 48 50C48 63.5 41.5 75.2 30.5 81.8C36.1159 85.719 42.8246 88 50 88Z" fill="#000000"/>
                </svg>
            </div>
            
            <h1 className="text-3xl font-black text-black tracking-tighter mb-2">
                AGENCIA MOON
            </h1>
            
            <div className="flex items-center justify-center gap-2 opacity-100">
                <div className="h-[1px] w-4 bg-gray-300"></div>
                <p className="text-[10px] font-bold text-gray-500 tracking-[0.3em] uppercase">
                    Gestor de Reclutamiento
                </p>
                <div className="h-[1px] w-4 bg-gray-300"></div>
            </div>
        </div>

        {/* --- FORMULARIO CLEAN --- */}
        <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
                <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-black uppercase tracking-wider ml-1">Nombre</label>
                     <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold text-black focus:bg-white focus:border-black focus:ring-0 outline-none transition-all placeholder-gray-400"
                        placeholder="Nombre completo"
                        required
                     />
                </div>
            )}

            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-black uppercase tracking-wider ml-1">Correo</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold text-black focus:bg-white focus:border-black focus:ring-0 outline-none transition-all placeholder-gray-400"
                    placeholder="usuario@agencia.com"
                    required
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-black uppercase tracking-wider ml-1">Contraseña</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold text-black focus:bg-white focus:border-black focus:ring-0 outline-none transition-all placeholder-gray-400"
                    placeholder="••••••••"
                    required
                />
            </div>

            {error && (
                <div className="p-4 bg-red-50 rounded-xl flex items-center justify-center">
                    <p className="text-red-600 text-xs font-bold">{error}</p>
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 bg-black text-white h-14 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/5"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                        {isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
                        {!isRegistering && <ArrowRight size={14} />}
                    </>
                )}
            </button>
        </form>

        <div className="mt-10 text-center">
            <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-xs font-bold text-gray-400 hover:text-primary transition-colors pb-1 border-b border-transparent hover:border-primary"
            >
                {isRegistering 
                  ? '¿Ya tienes cuenta? Ingresa aquí' 
                  : 'Solicitar acceso a la plataforma'}
            </button>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="fixed bottom-6 w-full text-center pointer-events-none opacity-40">
          <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">© 2024 Moon Agency Platform</p>
      </div>
    </div>
  );
};

export default Login;