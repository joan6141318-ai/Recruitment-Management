
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

  useEffect(() => {
    const loadContext = async () => {
      const data = await dataService.getEmisores(user);
      setUserEmisores(data);
    };
    loadContext();
  }, [user]);

  const dataContext = useMemo(() => {
    if (userEmisores.length === 0) return "No hay emisores registrados actualmente.";
    return userEmisores.map(e => 
      `- ${e.nombre} (ID: ${e.bigo_id}): ${e.horas_mes}h, ${e.semillas_mes} semillas, Estado: ${e.estado}`
    ).join('\n');
  }, [userEmisores]);

  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([{ 
          id: 1, 
          type: 'bot', 
          text: `Bienvenido, ${user.nombre.split(' ')[0]}. Soy agencIA. Tengo acceso a tus ${userEmisores.length} emisores. ¿Qué necesitas analizar hoy?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
      }, 1000);
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite-latest',
        contents: userText,
        config: {
          systemInstruction: `Eres agencIA, el asistente analítico de Agencia Moon. 
          Tu tono es minimalista, profesional, ejecutivo y breve.
          DATOS REALES DEL RECLUTADOR:
          ${dataContext}
          
          Reglas:
          1. Responde siempre basado en los datos proporcionados.
          2. No des rodeos, sé directo y ejecutivo.
          3. Usa terminología de la agencia (emisores, semillas, horas).
          4. Si no sabes algo, admítelo profesionalmente.`,
        },
      });

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: response.text || "No he podido procesar los datos en este momento.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "Error de conexión con la inteligencia central de Moon.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/5 animate-fade-in p-0 sm:p-6">
      <div className="absolute inset-0 backdrop-blur-md" onClick={() => navigate('/')}></div>
      
      <div className="relative w-full h-full max-w-2xl bg-white sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header agencIA */}
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-primary animate-pulse" size={24} />
            </div>
            <div>
              <h2 className="font-brand font-black text-sm uppercase tracking-[0.2em]">agencIA</h2>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">IA Operativa Moon</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Mensajes */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-white">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border 
                  ${msg.type === 'user' ? 'bg-black text-white border-black' : 'bg-white text-primary border-gray-100 shadow-sm'}
                `}>
                  {msg.type === 'user' ? <UserIcon size={14} /> : <Bot size={16} />}
                </div>
                <div className="space-y-1.5">
                  <div className={`p-5 rounded-3xl text-sm font-medium leading-relaxed
                    ${msg.type === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-gray-50 text-gray-800 rounded-tl-none'}
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
               <div className="bg-gray-50 p-5 rounded-3xl rounded-tl-none border border-gray-100 flex gap-1.5">
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                 <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
               </div>
             </div>
          )}
        </div>

        {/* Input */}
        <div className="p-8 bg-white border-t border-gray-50">
          <form onSubmit={handleSend} className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Analizar productividad..." 
              className="flex-1 bg-gray-50 border-none px-6 py-5 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-gray-300"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95
                ${!inputValue.trim() || isTyping ? 'bg-gray-100 text-gray-300' : 'bg-black text-white hover:bg-primary'}
              `}
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
