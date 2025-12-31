
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

  // Cargamos los emisores para darle contexto a la IA
  useEffect(() => {
    const loadContext = async () => {
      const data = await dataService.getEmisores(user);
      setUserEmisores(data);
    };
    loadContext();
  }, [user]);

  // Preparamos el resumen de datos para la IA
  const dataContext = useMemo(() => {
    if (userEmisores.length === 0) return "No hay emisores registrados actualmente.";
    return userEmisores.map(e => 
      `- ${e.nombre} (ID: ${e.bigo_id}): ${e.horas_mes}h, ${e.semillas_mes} semillas, Estado: ${e.estado}`
    ).join('\n');
  }, [userEmisores]);

  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setMessages([{ 
          id: 1, 
          type: 'bot', 
          text: `Hola ${user.nombre.split(' ')[0]}. Soy agencIA, tu asistente de gestión. He analizado tus ${userEmisores.length} emisores. ¿En qué puedo ayudarte hoy?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
      }, 1000);
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
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    
    setInputValue('');
    setIsTyping(true);

    try {
      // Inicialización segura de la IA
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: userText,
        config: {
          systemInstruction: `Eres agencIA, el asistente experto de Agencia Moon. 
          Tu tono es minimalista, profesional y ejecutivo.
          CONTEXTO DE LOS EMISORES DE ${user.nombre}:
          ${dataContext}
          
          Reglas:
          1. Responde de forma concisa.
          2. Si te preguntan por estadísticas, analízalos datos proporcionados arriba.
          3. No menciones que eres una IA de Google, preséntate siempre como agencIA.
          4. Usa el color morado de la marca en tus metáforas si es necesario.`,
        },
      });

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: response.text || "Lo siento, no pude procesar esa información.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error("Error en agencIA:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "He tenido un problema de conexión con la base de datos de Moon. ¿Podrías repetir tu consulta?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/5 animate-fade-in p-0 sm:p-4">
      <div 
        className="absolute inset-0 backdrop-blur-sm"
        onClick={() => navigate('/')}
      ></div>
      
      <div className="relative w-full h-full max-w-2xl bg-white sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-gray-100">
        
        {/* Header Premium */}
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg group">
              <Sparkles className="text-primary animate-pulse" size={24} />
            </div>
            <div>
              <h2 className="font-brand font-black text-sm uppercase tracking-[0.2em] text-black">agencIA</h2>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Inteligencia Moon Activa</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Área de Mensajes */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-white"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}
            >
              <div className={`flex gap-3 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border 
                  ${msg.type === 'user' ? 'bg-black text-white border-black' : 'bg-white text-primary border-gray-100 shadow-sm'}
                `}>
                  {msg.type === 'user' ? <UserIcon size={14} /> : <Bot size={16} />}
                </div>
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed
                    ${msg.type === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'}
                  `}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] font-black text-gray-300 uppercase tracking-widest ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 flex gap-1">
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
               </div>
             </div>
          )}
        </div>

        {/* Input Minimalista */}
        <div className="p-6 bg-white border-t border-gray-50">
          <form onSubmit={handleSend} className="flex items-center gap-3 max-w-3xl mx-auto">
            <input 
              type="text" 
              placeholder="Pregunta sobre tus emisores..." 
              className="flex-1 bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-300"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95
                ${!inputValue.trim() || isTyping 
                  ? 'bg-gray-100 text-gray-300' 
                  : 'bg-black text-white hover:bg-primary'}
              `}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
