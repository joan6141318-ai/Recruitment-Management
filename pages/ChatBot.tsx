
import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Bot as BotIcon, X } from 'lucide-react';
import { User, Emisor } from '../types';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { dataService } from '../services/db';

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

  useEffect(() => {
    const loadContext = async () => {
      const data = await dataService.getEmisores(user);
      setUserEmisores(data);
    };
    loadContext();
  }, [user]);

  const buildSystemInstruction = () => {
    const emisoresSummary = userEmisores.map(e => 
      `- ${e.nombre} (ID: ${e.bigo_id}): ${e.horas_mes}h, ${e.semillas_mes} semillas`
    ).join('\n');

    return `Eres agencIA, el asistente de soporte de Agencia Moon.
    Tu objetivo es ayudar a ${user.nombre} a gestionar sus emisores.
    Datos actuales del reclutador:
    ${emisoresSummary || "No hay emisores registrados actualmente."}
    
    Instrucciones de estilo:
    - Sé breve, directo y profesional.
    - Utiliza un tono ejecutivo.
    - Responde únicamente sobre temas de la agencia.`;
  };

  useEffect(() => {
    const initialGreeting = `Hola ${user.nombre.split(' ')[0]}. Soy agencIA. ¿En qué puedo asistirte con la gestión de tus emisores hoy?`;
    setMessages([
      { 
        id: 1, 
        type: 'bot', 
        text: initialGreeting,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [user.nombre]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userText, time: timeString }]);
    setInputValue('');
    setIsTyping(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages.map(m => ({
          role: m.type === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })), { role: 'user', parts: [{ text: userText }] }],
        config: {
          systemInstruction: buildSystemInstruction(),
          temperature: 0.4,
        },
      });

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: response.text || "No se pudo procesar la consulta.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "Error de conexión. Inténtalo de nuevo.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6">
      <div className="w-full h-full max-w-2xl bg-white md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header - Identidad App */}
        <div className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <img src="/icon.svg" alt="App Icon" className="w-6 h-6 brightness-200 grayscale" />
            </div>
            <div>
              <h2 className="font-brand font-black text-xs uppercase tracking-[0.2em] text-black leading-none">agencIA</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-primary animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                  {isTyping ? 'Procesando' : 'En Línea'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Chat Area - Burbujas Profesionales con Espaciado Optimizado */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:px-10 md:py-8 space-y-8 bg-white scroll-smooth pb-12">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}>
              <div className={`flex items-start gap-3.5 max-w-[90%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Iconos de Mensaje - Alineados a la parte superior de la burbuja */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 mt-0.5
                  ${msg.type === 'user' ? 'bg-black text-white' : 'bg-primary text-white'}
                `}>
                  {msg.type === 'user' ? (
                    <UserIcon size={18} strokeWidth={2.5} />
                  ) : (
                    <BotIcon size={18} strokeWidth={2.5} />
                  )}
                </div>

                {/* Contenedor de Burbuja */}
                <div className={`flex flex-col space-y-1.5 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 rounded-[1.4rem] text-sm font-medium leading-relaxed shadow-sm
                    ${msg.type === 'user' 
                      ? 'bg-black text-white rounded-tr-none shadow-[0_10px_20px_-6px_rgba(0,0,0,0.2)]' 
                      : 'bg-primary text-white rounded-tl-none shadow-[0_10px_25px_-6px_rgba(124,58,237,0.4)]'}
                  `}>
                    {msg.text}
                  </div>
                  {/* Contraste mejorado para el tiempo */}
                  <p className={`text-[9px] font-black uppercase text-gray-600 tracking-widest px-1`}>
                    {msg.time}
                  </p>
                </div>

              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm mt-0.5">
                   <BotIcon size={18} strokeWidth={2.5} />
                </div>
                <div className="bg-gray-50 p-4 rounded-[1.4rem] rounded-tl-none flex gap-1.5 shadow-inner border border-gray-100">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Altura reducida y compacta */}
        <div className="px-6 py-3 md:px-10 md:py-4 bg-white border-t border-gray-50 shrink-0">
          <form onSubmit={handleSend} className="flex gap-3">
            <input 
              type="text" 
              placeholder="Escribir mensaje..."
              className="flex-1 bg-gray-50 border-none px-5 py-3 rounded-xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/5 focus:bg-white transition-all placeholder-gray-400"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className="w-11 h-11 bg-black text-white rounded-xl flex items-center justify-center hover:bg-primary disabled:bg-gray-50 disabled:text-gray-200 transition-all active:scale-95 shadow-md"
            >
              <Send size={16} strokeWidth={3} />
            </button>
          </form>
          <div className="text-center mt-3">
            <p className="text-[7px] font-black text-gray-300 uppercase tracking-[0.6em]">Agencia Moon Inteligencia Artificial</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
