
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User as UserIcon, MessageCircle, HelpCircle, Zap, ShieldCheck } from 'lucide-react';

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'bot', 
      text: '¡Hola! Soy Moon AI, tu asistente personal de Agencia Moon. ¿En qué puedo ayudarte hoy?',
      time: 'Ahora' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMsg = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newUserMsg]);
    setInputValue('');
  };

  const quickActions = [
    { label: '¿Meta 44H?', icon: Zap },
    { label: 'Dudas Pagos', icon: HelpCircle },
    { label: 'Soporte', icon: MessageCircle },
    { label: 'Privacidad', icon: ShieldCheck }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-100px)] animate-slide-up bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      
      {/* HEADER DEL CHAT */}
      <div className="bg-black text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase tracking-widest">Moon AI</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">En Línea • Asistente</span>
            </div>
          </div>
        </div>
        <img src="/icon.svg" alt="Moon" className="w-8 h-8 opacity-50 grayscale brightness-200" />
      </div>

      {/* ÁREA DE MENSAJES */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#FDFDFD]"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm
                ${msg.type === 'user' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}
              `}>
                {msg.type === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>
              
              <div className="space-y-1">
                <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed
                  ${msg.type === 'user' 
                    ? 'bg-black text-white rounded-tr-none' 
                    : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200/50'}
                `}>
                  {msg.text}
                </div>
                <p className={`text-[9px] font-bold uppercase text-gray-300 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* SUGERENCIAS RÁPIDAS */}
        {messages.length === 1 && (
          <div className="grid grid-cols-2 gap-3 pt-4">
            {quickActions.map((action, idx) => (
              <button 
                key={idx}
                onClick={() => setInputValue(action.label)}
                className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl hover:border-primary hover:text-primary transition-all shadow-sm group"
              >
                <action.icon size={14} className="text-gray-400 group-hover:text-primary" />
                <span className="text-[10px] font-black uppercase tracking-tight text-gray-600 group-hover:text-primary">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* INPUT DE MENSAJE */}
      <div className="p-4 bg-white border-t border-gray-50">
        <form onSubmit={handleSend} className="relative">
          <input 
            type="text" 
            placeholder="Escribe tu mensaje aquí..."
            className="w-full bg-gray-50 border-none pl-5 pr-14 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/5 transition-all"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-3">
          Moon AI puede cometer errores. Verifica la información importante.
        </p>
      </div>
    </div>
  );
};

export default ChatBot;
