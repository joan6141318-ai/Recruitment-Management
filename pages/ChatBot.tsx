
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, X } from 'lucide-react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';

interface ChatBotProps {
  user: User;
}

const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Generar saludo personalizado según la hora
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return 'buenos días';
      if (hour >= 12 && hour < 19) return 'buenas tardes';
      return 'buenas noches';
    };

    const firstName = user.nombre.split(' ')[0];
    const initialGreeting = `Hola ${firstName}, ${getGreeting()}, ¿en qué puedo asistirte hoy?`;
    
    setIsTyping(true);
    const timer = setTimeout(() => {
      setMessages([
        { 
          id: 1, 
          type: 'bot', 
          text: initialGreeting,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [user.nombre]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    const newUserMsg = {
      id: Date.now(),
      type: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);
    
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: `Entendido. Estoy procesando tu consulta sobre "${userText}". Como tu asistente de Agencia Moon, mi prioridad es optimizar tu gestión de reclutamiento.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-8 overflow-hidden">
      {/* Fondo translúcido grisáceo con desenfoque profesional */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-fade-in"
        onClick={() => navigate('/')}
      ></div>
      
      {/* Contenedor del Chat - Adaptado a pantalla móvil y desktop */}
      <div className="relative w-full h-full max-w-4xl bg-white sm:rounded-[2.5rem] shadow-[0_32px_80px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-slide-up border border-white/20">
        
        {/* HEADER PREMIUM - DISEÑO REFINADO */}
        <div className="bg-black text-white p-5 md:p-7 flex items-center justify-between relative z-10 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group">
                <img src="/icon.svg" alt="Moon" className="w-9 h-9 md:w-10 md:h-10 object-contain grayscale" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-black rounded-full"></div>
            </div>
            <div>
              <h2 className="font-brand font-black text-sm md:text-lg uppercase tracking-[0.2em] leading-none mb-1 text-white">agencIA Support</h2>
              <div className="flex items-center gap-2">
                <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {isTyping ? 'Escribiendo respuesta...' : 'Soporte Premium Activo'}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all active:scale-90 border border-white/10"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* ÁREA DE MENSAJES - MINIMALISMO PROFESIONAL */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-[#FBFBFB]"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}
            >
              <div className={`flex gap-4 max-w-[88%] md:max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Avatar minimalista */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border
                  ${msg.type === 'user' 
                    ? 'bg-black border-black text-white' 
                    : 'bg-primary border-primary text-white'}
                `}>
                  {msg.type === 'user' ? <UserIcon size={16} strokeWidth={2.5} /> : <Bot size={18} strokeWidth={2.5} />}
                </div>
                
                <div className="space-y-2">
                  <div className={`p-4 md:p-5 rounded-[1.8rem] text-sm md:text-base font-semibold leading-relaxed shadow-sm
                    ${msg.type === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-primary text-white rounded-tl-none'}
                  `}>
                    {msg.text}
                  </div>
                  <p className={`text-[8px] md:text-[9px] font-black uppercase text-gray-300 tracking-widest px-1 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex justify-start animate-pulse">
               <div className="flex gap-4 max-w-[85%]">
                 <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-sm">
                   <Bot size={18} strokeWidth={2.5} />
                 </div>
                 <div className="bg-primary text-white/50 p-5 rounded-[1.8rem] rounded-tl-none flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* INPUT DE MENSAJE - ULTRA CLEAN */}
        <div className="p-6 md:p-8 bg-white border-t border-gray-100 relative z-10">
          <form onSubmit={handleSend} className="relative group max-w-4xl mx-auto flex items-center gap-3">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="¿En qué puedo ayudarte?"
                className="w-full bg-gray-50 border-2 border-transparent px-8 py-5 rounded-[2rem] text-sm md:text-base font-bold text-gray-900 outline-none focus:bg-white focus:border-primary/20 transition-all placeholder:text-gray-400 placeholder:font-medium shadow-inner"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping}
              />
            </div>
            <button 
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className={`w-14 h-14 rounded-[1.4rem] flex items-center justify-center shadow-xl transition-all shrink-0
                ${isTyping || !inputValue.trim() 
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-primary active:scale-90 shadow-gray-200'}
              `}
            >
              <Send size={22} strokeWidth={2.5} />
            </button>
          </form>
          
          <div className="flex justify-center items-center gap-3 mt-6 opacity-30 select-none">
             <img src="/icon.svg" alt="Moon" className="w-4 h-4 grayscale" />
             <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em]">
               Agencia Moon 2026
             </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ChatBot;
