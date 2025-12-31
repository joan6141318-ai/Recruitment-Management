
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface ChatBotProps {
  user: User;
}

const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Generar saludo personalizado según la hora
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return 'buenos días';
      if (hour >= 12 && hour < 19) return 'buenas tardes';
      return 'buenas noches';
    };

    const firstName = user.nombre.split(' ')[0];
    const initialGreeting = `Hola ${firstName}, ${getGreeting()}, ¿hay algo en lo que pueda ayudarte?`;
    
    // Simular que el bot empieza a escribir al abrir
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
    }, 1500);

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
    
    // Simular respuesta de la IA con indicador
    setIsTyping(true);
    
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: `Entendido, estoy analizando tu solicitud sobre "${userText}". Como tu asistente de Agencia Moon, estoy aquí para facilitar tu gestión de reclutamiento.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 md:relative md:inset-auto z-40 md:z-0 flex items-center justify-center p-0 md:p-0">
      {/* Fondo translúcido con desenfoque para resaltar la ventana */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-xl md:hidden"></div>
      
      <div className="relative w-full h-full md:h-[calc(100vh-100px)] flex flex-col bg-white md:rounded-[2.5rem] md:border border-gray-100 shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden animate-slide-up">
        
        {/* HEADER PREMIUM */}
        <div className="bg-black text-white p-6 md:p-8 flex items-center justify-between border-b border-white/5 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden transition-transform hover:scale-105">
              <img src="/icon.svg" alt="Moon" className="w-9 h-9 md:w-10 md:h-10 object-contain" />
            </div>
            <div>
              <h2 className="font-black text-sm md:text-base uppercase tracking-[0.25em] leading-none">Soporte agencIA</h2>
              <div className="flex items-center gap-2 mt-2">
                {isTyping ? (
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse">Escribiendo...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">En línea</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex bg-white/10 px-4 py-2 rounded-xl border border-white/10">
             <span className="text-[9px] font-black uppercase text-white tracking-widest">Tecnología Moon</span>
          </div>
        </div>

        {/* ÁREA DE MENSAJES */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-[#FAFAFA]/80 backdrop-blur-md"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}
            >
              <div className={`flex gap-4 md:gap-5 max-w-[90%] md:max-w-[75%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                
                {/* Icono de Mensaje */}
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform hover:scale-110 border
                  ${msg.type === 'user' 
                    ? 'bg-black border-black text-white' 
                    : 'bg-white border-gray-100 text-primary'}
                `}>
                  {msg.type === 'user' ? <UserIcon size={18} strokeWidth={2.5} /> : <Bot size={20} strokeWidth={2.5} />}
                </div>
                
                <div className="space-y-2">
                  <div className={`p-5 md:p-6 rounded-[2rem] text-sm md:text-base font-medium leading-relaxed shadow-sm
                    ${msg.type === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-gray-100 text-gray-900 rounded-tl-none border-2 border-primary'}
                  `}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] font-black uppercase text-gray-400 tracking-widest px-2 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex justify-start animate-pulse opacity-60">
               <div className="flex gap-4 max-w-[85%]">
                 <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm">
                   <Bot size={20} strokeWidth={2.5} />
                 </div>
                 <div className="bg-gray-100 border-2 border-primary p-5 rounded-[2rem] rounded-tl-none">
                   <div className="flex gap-1.5">
                     <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                     <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                     <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                   </div>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* INPUT DE MENSAJE MINIMALISTA */}
        <div className="p-6 md:p-8 bg-white border-t border-gray-50 z-10">
          <form onSubmit={handleSend} className="relative group max-w-4xl mx-auto">
            <input 
              type="text" 
              placeholder="Escribe tu mensaje..."
              className="w-full bg-gray-50 border-2 border-transparent pl-8 pr-20 py-5 rounded-[2rem] text-sm md:text-base font-bold text-gray-900 outline-none focus:bg-white focus:border-primary/20 focus:ring-8 focus:ring-primary/5 transition-all placeholder:text-gray-400 placeholder:font-medium shadow-inner"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-14 h-14 rounded-[1.4rem] flex items-center justify-center shadow-2xl transition-all 
                ${isTyping || !inputValue.trim() 
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-primary active:scale-90 shadow-gray-200'}
              `}
            >
              <Send size={22} strokeWidth={2.5} />
            </button>
          </form>
          <div className="flex justify-center items-center gap-3 mt-6 opacity-20">
             <img src="/icon.svg" alt="Moon" className="w-4 h-4 grayscale" />
             <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.5em]">
               Agencia Moon 2026
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
