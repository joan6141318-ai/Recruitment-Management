
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

  // Carga el contexto de los emisores para que la IA sepa de qué hablas
  useEffect(() => {
    const loadContext = async () => {
      const data = await dataService.getEmisores(user);
      setUserEmisores(data);
    };
    loadContext();
  }, [user]);

  const contextString = useMemo(() => {
    if (userEmisores.length === 0) return "No hay emisores registrados aún.";
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
          text: `¡Hola ${user.nombre.split(' ')[0]}! Soy agencIA. Estoy lista para analizar tu base de datos de ${userEmisores.length} emisores. ¿Qué necesitas saber?`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        setIsTyping(false);
      }, 1000);
    }
  }, [user.nombre, userEmisores.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
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
      // IMPORTANTE: Aquí se usa la variable de entorno de forma segura
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userText,
        config: {
          systemInstruction: `Eres agencIA, el asistente experto de Agencia Moon. 
          Tu objetivo es ayudar al reclutador ${user.nombre} a gestionar sus emisores.
          DATOS DISPONIBLES:
          ${contextString}
          
          Instrucciones:
          1. Responde de forma ejecutiva y amable.
          2. Si te piden datos, analízalos (ej. quién tiene más horas).
          3. Si no conoces la respuesta o no está en los datos, admítelo.
          4. Usa un tono profesional pero cercano.`,
        },
      });

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: response.text || "No pude procesar esa solicitud.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "Hubo un error al conectar con el cerebro de agencIA. Reintenta en unos segundos.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 md:p-8 overflow-hidden bg-black/20 backdrop-blur-md">
      <div className="relative w-full h-full max-w-4xl bg-white sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg relative">
              <img src="/icon.svg" className="w-8 h-8 brightness-200" alt="Moon" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h2 className="font-brand font-black text-black tracking-widest uppercase text-sm">agencIA</h2>
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Inteligencia Moon Activa</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#FAFAFA]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}>
              <div className={`flex gap-4 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${msg.type === 'user' ? 'bg-black text-white' : 'bg-primary text-white'}`}>
                  {msg.type === 'user' ? <UserIcon size={18} /> : <Bot size={20} />}
                </div>
                <div className="space-y-2">
                  <div className={`p-5 rounded-2xl text-sm font-semibold leading-relaxed shadow-sm ${msg.type === 'user' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                  <p className={`text-[9px] font-black text-gray-400 uppercase tracking-widest px-1 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-6 md:p-10 bg-white border-t border-gray-50">
          <form onSubmit={handleSend} className="flex items-center gap-4 max-w-3xl mx-auto">
            <input 
              type="text" 
              placeholder="Pregunta algo sobre tus emisores..." 
              className="flex-1 bg-gray-50 border border-gray-100 px-6 py-4 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 ${!inputValue.trim() || isTyping ? 'bg-gray-100 text-gray-300' : 'bg-black text-white hover:bg-primary'}`}
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
