
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, X, Sparkles } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-8 md:p-12 overflow-hidden">
      {/* Fondo translúcido Luxury Blur */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-2xl animate-fade-in"
        onClick={() => navigate('/')}
      ></div>
      
      {/* Contenedor del Chat - Estética Minimalista Pro */}
      <div className="relative w-full h-full max-w-3xl bg-white sm:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-slide-up border border-white/30">
        
        {/* HEADER PREMIUM - HIGH CONTRAST */}
        <div className="bg-white px-8 py-7 flex items-center justify-between border-b border-gray-100 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-14 h-14 bg-black rounded-3xl flex items-center justify-center shadow-xl transition-transform hover:scale-105">
                <img src="/icon.svg" alt="Moon" className="w-9 h-9 brightness-200 grayscale" />
              </div>
              {/* Punto verde parpadeante pro */}
              <div className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-[3px] border-white"></span>
              </div>
            </div>
            <div>
              <h2 className="font-brand font-black text-base uppercase tracking-[0.4em] leading-none text-black">agencIA</h2>
              <div className="flex items-center gap-2 mt-2">
                 <div className="bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                    <Sparkles size={10} className="text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Soporte Premium</span>
                 </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-12 h-12 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg shadow-black/10"
            title="Cerrar chat"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* ÁREA DE MENSAJES - CLEAN FLOW */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 bg-[#FAFAFA]"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}
            >
              <div className={`flex gap-5 max-w-[82%] md:max-w-[75%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Bot Icon Styling - Improved Design */}
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xl border-2 border-white transition-all hover:scale-110
                  ${msg.type === 'user' 
                    ? 'bg-black text-white' 
                    : 'bg-gradient-to-tr from-[#1A1A1A] to-primary text-white'}
                `}>
                  {msg.type === 'user' ? <UserIcon size={18} strokeWidth={2.5} /> : <Bot size={22} strokeWidth={1.5} />}
                </div>
                
                <div className="space-y-3">
                  <div className={`p-6 md:p-7 rounded-[2.5rem] text-sm md:text-[15.5px] font-semibold leading-relaxed
                    ${msg.type === 'user' 
                      ? 'bg-black text-white rounded-tr-none shadow-2xl shadow-black/10' 
                      : 'bg-primary text-white rounded-tl-none shadow-2xl shadow-primary/30'}
                  `}>
                    {msg.text}
                  </div>
                  {/* Timestamp - Legibilidad mejorada */}
                  <p className={`text-[10px] font-bold uppercase text-gray-500 tracking-[0.2em] px-3 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex justify-start animate-pulse">
               <div className="flex gap-5">
                 <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1A1A1A] to-primary flex items-center justify-center text-white shadow-xl border-2 border-white">
                   <Bot size={22} />
                 </div>
                 <div className="bg-primary/5 border border-primary/10 p-6 rounded-[2.5rem] rounded-tl-none flex items-center gap-2 shadow-sm">
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* INPUT SECTION - MINIMALIST PRO CONTRAST */}
        <div className="p-8 md:p-12 bg-white z-10 border-t border-gray-50">
          <form onSubmit={handleSend} className="relative group max-w-4xl mx-auto flex items-center gap-5">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="¿Cómo puedo ayudarte?"
                className="w-full bg-gray-100 border border-gray-200/40 px-10 py-6 rounded-full text-sm md:text-base font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary/20 transition-all placeholder:text-gray-500 shadow-inner"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping}
              />
            </div>
            <button 
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all shrink-0 active:scale-95
                ${isTyping || !inputValue.trim() 
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none' 
                  : 'bg-black text-white hover:bg-primary shadow-gray-300 hover:-translate-y-1'}
              `}
            >
              <Send size={24} strokeWidth={2.5} className="mr-0.5 mb-0.5" />
            </button>
          </form>
          
          <div className="flex justify-center items-center gap-3 mt-10 opacity-70 select-none">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.6em]">
               Agencia Moon 2026
             </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
        ::-webkit-scrollbar-thumb:hover { background: #CBD5E1; }
      `}</style>
    </div>
  );
};

export default ChatBot;
