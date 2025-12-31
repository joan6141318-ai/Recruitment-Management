
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, X, Sparkles } from 'lucide-react';
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

    return `Eres el asistente de Agencia Moon.
    Tu objetivo es ayudar a ${user.nombre} a gestionar sus emisores.
    Datos actuales del reclutador:
    ${emisoresSummary || "No hay emisores registrados."}
    
    Instrucciones:
    - Sé breve, profesional y directo.
    - No uses un lenguaje excesivamente entusiasta.
    - Responde solo dudas sobre los datos proporcionados o reglas de la agencia.`;
  };

  useEffect(() => {
    const initialGreeting = `Hola ${user.nombre.split(' ')[0]}, ¿en qué puedo ayudarte hoy con la gestión de tus emisores?`;
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
          temperature: 0.5,
        },
      });

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: response.text || "Lo siento, no pude procesar la solicitud.",
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/20 backdrop-blur-sm p-0 md:p-6">
      <div className="w-full h-full max-w-2xl bg-white md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header Minimalista */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-brand font-bold text-sm uppercase tracking-wider text-black">Asistente Moon</h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-1.5">
                {isTyping ? <span className="flex gap-0.5"><span className="w-1 h-1 bg-primary rounded-full animate-bounce"></span><span className="w-1 h-1 bg-primary rounded-full animate-bounce delay-100"></span></span> : <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                {isTyping ? 'Escribiendo' : 'En línea'}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}>
              <div className={`max-w-[85%] ${msg.type === 'user' ? 'bg-black text-white rounded-2xl rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-none'} p-4 shadow-sm`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-[8px] font-bold uppercase mt-2 opacity-40 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none flex gap-1">
                <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area Minimalista */}
        <div className="p-6 border-t border-gray-50">
          <form onSubmit={handleSend} className="flex gap-3">
            <input 
              type="text" 
              placeholder="Escribe tu consulta..."
              className="flex-1 bg-gray-50 border-none px-5 py-3.5 rounded-xl text-sm font-medium focus:ring-1 focus:ring-black outline-none transition-all"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95 shadow-lg"
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
