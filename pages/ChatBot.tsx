
import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, X } from 'lucide-react';
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
    const initialGreeting = `Hola ${user.nombre.split(' ')[0]}. Soy agencIA. Estoy aquí para asistirte con la gestión de tus emisores de forma profesional.`;
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
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-6">
      <div className="w-full h-full max-w-2xl bg-white md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header - Se mantiene según diseño profesional de la app */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
              <img src="/icon.svg" alt="App Icon" className="w-8 h-8 brightness-200 grayscale" />
            </div>
            <div>
              <h2 className="font-brand font-black text-sm uppercase tracking-[0.2em] text-black leading-none">agencIA</h2>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-primary animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  {isTyping ? 'Analizando' : 'Activo'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Chat Area - Burbujas e Iconos solicitados */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-white">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}>
              <div className={`flex items-end gap-3 max-w-[90%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Icono al lado de la conversación */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md border border-gray-100 overflow-hidden
                  ${msg.type === 'user' ? 'bg-black text-white' : 'bg-primary'}
                `}>
                  {msg.type === 'user' ? (
                    <UserIcon size={18} />
                  ) : (
                    <img src="/icon.svg" className="w-6 h-6 brightness-200 grayscale" alt="IA" />
                  )}
                </div>

                {/* Burbuja de Mensaje con Sombra Inferior */}
                <div className="flex flex-col space-y-1.5">
                  <div className={`p-5 rounded-[1.5rem] text-sm font-medium leading-relaxed whitespace-pre-wrap
                    ${msg.type === 'user' 
                      ? 'bg-black text-white rounded-br-none shadow-[0_10px_20px_-5px_rgba(0,0,0,0.2)]' 
                      : 'bg-primary text-white rounded-bl-none shadow-[0_10px_25px_-5px_rgba(124,58,237,0.45)]'}
                  `}>
                    {msg.text}
                  </div>
                  <p className={`text-[8px] font-black uppercase text-gray-300 tracking-widest px-2 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>

              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-end gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md overflow-hidden">
                   <img src="/icon.svg" className="w-6 h-6 brightness-200 grayscale" alt="IA" />
                </div>
                <div className="bg-primary/5 p-4 rounded-[1.5rem] rounded-bl-none flex gap-1.5 shadow-inner border border-primary/10">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Se mantiene el diseño original de la app */}
        <div className="p-8 md:p-10 bg-white border-t border-gray-50">
          <form onSubmit={handleSend} className="flex gap-4">
            <input 
              type="text" 
              placeholder="Realizar consulta profesional..."
              className="flex-1 bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-primary/5 focus:bg-white transition-all placeholder-gray-400 shadow-inner"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center hover:bg-primary disabled:bg-gray-50 disabled:text-gray-200 transition-all active:scale-95 shadow-xl"
            >
              <Send size={20} strokeWidth={2.5} />
            </button>
          </form>
          <div className="text-center mt-6">
            <p className="text-[9px] font-black text-gray-200 uppercase tracking-[0.5em]">Asistente de Soporte Moon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
