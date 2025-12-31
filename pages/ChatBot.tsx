
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, X, AlertCircle } from 'lucide-react';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

interface ChatBotProps {
  user: User;
}

const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const systemInstruction = `Eres agencIA, el asistente inteligente oficial de Agencia Moon. 
  Tu objetivo es ayudar a los reclutadores a gestionar sus equipos, entender el tabulador de comisiones 
  y navegar por la plataforma. Eres sofisticado, profesional y eficiente. 
  Hablas en nombre de Agencia Moon. El usuario actual se llama ${user.nombre} y tiene el rol de ${user.rol}.`;

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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg = {
      id: Date.now(),
      type: 'user',
      text: userText,
      time: timeString
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);
    
    try {
      // Usamos la variable inyectada por Vite desde las Environment Variables de Vercel
      if (!process.env.API_KEY) {
        throw new Error("MISSING_API_KEY");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const history = messages.map(m => ({
        role: m.type === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: [{ text: userText }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const botText = response.text || "No pude generar una respuesta.";

      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: botText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botResponse]);
    } catch (error: any) {
      console.error("Error en ChatBot:", error);
      let errorMessage = "Hubo un error de conexión con agencIA. Por favor, inténtalo de nuevo.";
      
      if (error.message === "MISSING_API_KEY") {
        errorMessage = "Error de configuración: No se detecta la clave de IA. Por favor, asegúrate de haber hecho un 'Redeploy' en Vercel después de configurar la variable 'CLAVE API'.";
      }

      const errorMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: errorMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6 md:p-12 overflow-hidden">
      <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-3xl animate-fade-in" onClick={() => navigate('/')}></div>
      
      <div className="relative w-full h-full max-w-2xl bg-white sm:rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-slide-up border border-white/20">
        
        <div className="bg-white p-6 md:p-8 flex items-center justify-between border-b border-gray-50 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-black rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden">
                <img src="/icon.svg" alt="Moon" className="w-8 h-8 md:w-10 md:h-10 object-contain brightness-200 grayscale" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-[3px] border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="font-brand font-black text-sm md:text-base uppercase tracking-[0.3em] leading-none text-black">agencIA</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isTyping ? 'text-primary animate-pulse' : 'text-gray-400'}`}>
                  {isTyping ? 'Procesando respuesta...' : 'Soporte Activo'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="w-10 h-10 md:w-11 md:h-11 bg-gray-50 hover:bg-black hover:text-white text-gray-400 rounded-full flex items-center justify-center transition-all duration-300">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#FDFDFD]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 border-white
                  ${msg.type === 'user' ? 'bg-black text-white' : (msg.isError ? 'bg-red-500 text-white' : 'bg-gradient-to-br from-primary to-purple-600 text-white')}
                `}>
                  {msg.type === 'user' ? <UserIcon size={18} /> : (msg.isError ? <AlertCircle size={20} /> : <Bot size={20} />)}
                </div>
                <div className="space-y-2">
                  <div className={`p-5 md:p-6 rounded-[2.2rem] text-sm md:text-[15px] font-medium leading-relaxed
                    ${msg.type === 'user' ? 'bg-black text-white rounded-tr-none' : (msg.isError ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none' : 'bg-primary text-white rounded-tl-none')}
                  `}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] font-bold uppercase text-gray-500 tracking-widest px-2 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start animate-pulse">
               <div className="flex gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white border-2 border-white shadow-lg">
                   <Bot size={20} />
                 </div>
                 <div className="bg-primary/10 p-5 rounded-[2.2rem] rounded-tl-none flex items-center gap-1.5 border border-primary/10">
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                 </div>
               </div>
             </div>
          )}
        </div>

        <div className="p-6 md:p-10 bg-white z-10">
          <form onSubmit={handleSend} className="relative group max-w-3xl mx-auto flex items-center gap-4">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Escribe tu consulta aquí..."
                className="w-full bg-gray-50 border-none px-8 py-5 rounded-full text-sm md:text-base font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isTyping}
              />
            </div>
            <button 
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all shrink-0 active:scale-90
                ${isTyping || !inputValue.trim() ? 'bg-gray-100 text-gray-300' : 'bg-black text-white hover:bg-primary'}
              `}
            >
              <Send size={22} strokeWidth={2.5} />
            </button>
          </form>
          <div className="flex justify-center mt-8 opacity-40">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Agencia Moon 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
