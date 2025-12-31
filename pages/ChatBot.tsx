
import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Bot, Sparkles, Trash2 } from 'lucide-react';
// Correct import from @google/genai
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { User } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatBotProps {
  user: User;
}

const ChatBot: React.FC<ChatBotProps> = ({ user }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `¡Hola ${user.nombre}! Soy el asistente de Agencia Moon. ¿En qué puedo ayudarte hoy con la gestión de tus emisores o dudas sobre remuneración?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<Chat | null>(null);

  // Initialize Gemini Chat session
  useEffect(() => {
    const initChat = () => {
      // Always use process.env.API_KEY in a named parameter
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview', // Use recommended model for text tasks
        config: {
          systemInstruction: `Eres "Soporte AgencIA", el asistente virtual inteligente de Agencia Moon. 
          Tu objetivo es ayudar a los reclutadores de Bigo Live con dudas sobre el sistema MOON, 
          la gestión de emisores, y las tablas de remuneración.
          Sé profesional, amable y directo en tus respuestas. 
          El usuario actual se llama ${user.nombre} y su rol es ${user.rol}.`,
        },
      });
    };
    initChat();
  }, [user]);

  // Handle automatic scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !chatRef.current) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Use chat.sendMessage for conversational context
      const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userMessage });
      
      // Access text as a property, not a method
      const modelResponse = response.text || "Lo siento, no pude procesar tu solicitud en este momento.";
      setMessages(prev => [...prev, { role: 'model', text: modelResponse }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Hubo un inconveniente al conectar con Soporte AgencIA. Por favor, intenta de nuevo más tarde." }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('¿Deseas reiniciar la conversación?')) {
      setMessages([{ role: 'model', text: `Chat reiniciado. ¿En qué más puedo apoyarte, ${user.nombre}?` }]);
      // Re-initialize chat to clear history in the model context
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `Eres Soporte AgencIA de Agencia Moon. Ayuda al reclutador ${user.nombre}.`,
        },
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] max-w-4xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-black rounded-2xl shadow-lg shadow-purple-200">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="font-black text-sm uppercase tracking-tight text-gray-900">Soporte AgencIA</h2>
            <p className="text-[10px] text-primary font-black uppercase tracking-widest">Asistente Virtual Moon</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Limpiar Conversación"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]"
      >
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-black text-white' : 'bg-white border border-gray-100 text-primary'}`}>
                {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-pulse">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center">
                <Bot size={14} className="text-primary" />
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-2xl rounded-tl-none flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-6 bg-white border-t border-gray-50">
        <form onSubmit={handleSendMessage} className="relative">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="¿En qué puedo ayudarte hoy?"
            className="w-full pl-6 pr-14 py-4 bg-gray-50 border-none rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder-gray-400"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className={`absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center rounded-xl transition-all ${input.trim() && !loading ? 'bg-black text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}
          >
            <Send size={18} />
          </button>
        </form>
        <p className="text-[9px] text-gray-400 text-center mt-4 uppercase font-bold tracking-widest">
          Desarrollado con Gemini 3 Flash Preview &bull; Agencia Moon 2025
        </p>
      </div>
    </div>
  );
};

export default ChatBot;
