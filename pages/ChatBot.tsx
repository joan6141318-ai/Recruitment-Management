
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Send, Bot, User as UserIcon, X, Sparkles } from 'lucide-react';
import { User, Emisor } from '../types';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/db';
import { GoogleGenAI } from "@google/genai";

interface ChatBotProps {
  user: User;
}

const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userEmisores, setUserEmisores] = useState<Emisor[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Cargar datos reales del reclutador para el contexto de la IA
  useEffect(() => {
    const loadContext = async () => {
      const data = await dataService.getEmisores(user);
      setUserEmisores(data);
    };
    loadContext();
  }, [user]);

  // Generar el contexto de texto para la IA - Única fuente de verdad
  const contextString = useMemo(() => {
    if (userEmisores.length === 0) return "No hay emisores registrados actualmente en tu base de datos.";
    return userEmisores.map(e => 
      `- Nombre: ${e.nombre}, ID Bigo: ${e.bigo_id}, País: ${e.pais}, Horas este mes: ${e.horas_mes}, Semillas: ${e.semillas_mes}, Estado: ${e.estado}`
    ).join('\n');
  }, [userEmisores]);

  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return 'buenos días';
      if (hour >= 12 && hour < 19) return 'buenas tardes';
      return 'buenas noches';
    };

    const firstName = user.nombre.split(' ')[0];
    const initialGreeting = `Hola ${firstName}, ${getGreeting()}. Soy agencIA. Tengo acceso a tu base de datos de ${userEmisores.length} emisores. ¿En qué análisis o duda puedo ayudarte hoy?`;
    
    if (messages.length === 0) {
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
    }
  }, [user.nombre, userEmisores.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
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

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userText,
        config: {
          systemInstruction: `Eres agencIA, el asistente de inteligencia artificial exclusivo de Agencia Moon para el reclutador ${user.nombre}. 
          TU REGLA DE ORO: Solo puedes responder preguntas utilizando la información de la base de datos proporcionada a continuación. 
          Si el usuario pregunta por algo que no está en los datos o pide información general fuera de este contexto, responde amablemente que como asistente de seguridad de Agencia Moon, solo tienes acceso a su cartera de emisores actual.
          
          DATOS DEL RECLUTADOR:
          ${contextString}
          
          Responde de forma profesional, concisa y motivadora. Usa emojis sutiles relacionados con la luna o analítica.`,
        },
      });

      const botResponse = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.text || "Lo siento, tuve un problema procesando la información. ¿Podrías intentar de nuevo?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("Error AI:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "Error de conexión con agencIA. Por favor, verifica tu conexión.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-8 md:p-12 overflow-hidden">
      {/* Fondo translúcido Luxury Blur */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-2xl animate-fade-in"
        onClick={() => navigate('/')}
      ></div>
      
      {/* Contenedor del Chat */}
      <div className="relative w-full h-full max-w-3xl bg-white sm:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-slide-up border border-white/30">
        
        {/* HEADER PREMIUM */}
        <div className="bg-white px-8 py-7 flex items-center justify-between border-b border-gray-100 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-14 h-14 bg-black rounded-3xl flex items-center justify-center shadow-xl">
                <img src="/icon.svg" alt="Moon" className="w-9 h-9 brightness-200 grayscale" />
              </div>
              {/* Punto verde con parpadeo intermitente sutil (3s para mayor elegancia) */}
              <div className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-subtle-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-[3px] border-white shadow-sm"></span>
              </div>
            </div>
            <div>
              <h2 className="font-brand font-black text-base uppercase tracking-[0.4em] leading-none text-black">agencIA</h2>
              <div className="flex items-center gap-2 mt-2">
                 <div className="bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                    <Sparkles size={10} className="text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary">Análisis en Tiempo Real</span>
                 </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-12 h-12 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg shadow-black/20"
            title="Cerrar chat"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* ÁREA DE MENSAJES */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 bg-[#FAFAFA]"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}
            >
              <div className={`flex gap-5 max-w-[85%] md:max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xl border-2 border-white transition-all
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
                 <div className="bg-primary/5 border border-primary/10 p-6 rounded-[2.5rem] rounded-tl-none flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* INPUT SECTION - CONTRASTE OSCURECIDO (placeholder:text-gray-700) */}
        <div className="p-8 md:p-12 bg-white z-10 border-t border-gray-50">
          <form onSubmit={handleSend} className="relative group max-w-4xl mx-auto flex items-center gap-5">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Escribe tu consulta sobre la base de datos..."
                className="w-full bg-gray-100 border border-gray-200/40 px-10 py-6 rounded-full text-sm md:text-base font-bold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-gray-700 placeholder:font-semibold shadow-inner"
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
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed' 
                  : 'bg-black text-white hover:bg-primary shadow-gray-300'}
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
        @keyframes subtle-pulse { 
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-subtle-pulse { animation: subtle-pulse 3s ease-in-out infinite; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default ChatBot;
