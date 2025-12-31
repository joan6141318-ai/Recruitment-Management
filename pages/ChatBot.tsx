
import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Bot as BotIcon, X, Sparkles, Lock } from 'lucide-react';
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

  const isRecruiter = user.rol === 'reclutador';

  useEffect(() => {
    if (isRecruiter) return; // No cargar datos si es reclutador

    const loadContext = async () => {
      const data = await dataService.getEmisores(user);
      setUserEmisores(data);
    };
    loadContext();
  }, [user, isRecruiter]);

  const getGreetingByTime = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "buenos días";
    if (hour >= 12 && hour < 19) return "buenas tardes";
    return "buenas noches";
  };

  const buildSystemInstruction = () => {
    const emisoresSummary = userEmisores.map(e => 
      `Emisor: ${e.nombre} | ID: ${e.bigo_id} | Horas: ${e.horas_mes} | Semillas: ${e.semillas_mes}`
    ).join('\n');

    return `Eres agencIA, el asistente de soporte ejecutivo de Agencia Moon.
    Tu objetivo es ayudar a ${user.nombre} con la gestión de sus emisores.
    
    DATOS ACTUALES:
    ${emisoresSummary || "No hay emisores registrados actualmente."}
    
    REGLAS ESTRICTAS DE RESPUESTA:
    1. PROHIBIDO usar símbolos de formato como '*', '-', '_', '#', o viñetas de puntos.
    2. Organiza la información numéricamente (1., 2., 3.) o mediante ESPACIOS EN BLANCO Y SALTOS DE LÍNEA.
    3. Si presentas datos numéricos o listas, alinéalos de forma que parezca un reporte profesional limpio.
    4. Sé extremadamente amable, servicial y profesional.
    5. No utilices Markdown (negritas/cursivas). Usa mayúsculas solo para encabezados cortos.
    6. Tus respuestas deben ser visualmente impecables, entendibles y estéticas sin símbolos basura.`;
  };

  useEffect(() => {
    if (isRecruiter) return;

    const timer = setTimeout(() => {
      const name = user.nombre.split(' ')[0];
      const greeting = getGreetingByTime();
      const initialText = `Hola ${name}, ${greeting}. ¿En qué puedo ayudarte con Agencia Moon hoy?`;
      
      setMessages([
        { 
          id: 1, 
          type: 'bot', 
          text: initialText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user.nombre, isRecruiter]);

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
    if (!inputValue.trim() || isTyping || isRecruiter) return;

    const userText = inputValue;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userText, time: timeString }]);
    setInputValue('');
    setIsTyping(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const rawHistory = messages
        .filter(m => m.id !== 1 && !m.isError)
        .map(m => ({
          role: m.type === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      const validatedHistory = [];
      let lastRole = null;
      for (const turn of rawHistory) {
        if (turn.role !== lastRole) {
          validatedHistory.push(turn);
          lastRole = turn.role;
        }
      }

      const contents = [...validatedHistory, { role: 'user', parts: [{ text: userText }] }];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: buildSystemInstruction(),
          temperature: 0.1,
        },
      });

      const responseText = response.text || "";
      const cleanedText = responseText.replace(/[*_#\-]/g, '').trim();

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: cleanedText || "He procesado su solicitud pero la respuesta está vacía.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error) {
      console.error("ChatBot Technical Failure:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: "Error de conexión. Intente nuevamente.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // VISTA "PRÓXIMAMENTE" PARA RECLUTADORES
  if (isRecruiter) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6">
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up flex flex-col items-center text-center p-10 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
          
          <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center shadow-xl mb-8 relative z-10">
            <Sparkles size={36} className="text-primary animate-pulse" />
          </div>

          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4 leading-tight">
            Soporte <span className="text-primary">agencIA</span>
          </h2>
          
          <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-1.5 rounded-full mb-6">
            <Lock size={14} className="text-gray-400" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Acceso Restringido</span>
          </div>

          <p className="text-gray-400 text-sm font-medium leading-relaxed mb-8 px-4">
            Estamos afinando los algoritmos de asistencia personalizada para nuestro equipo de reclutadores. 
            <br/><br/>
            Esta función estará <span className="text-black font-bold uppercase tracking-widest text-[10px]">disponible pronto</span> para ayudarte con la gestión automatizada de tu equipo.
          </p>

          <button 
            onClick={() => navigate('/')}
            className="w-full py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-95"
          >
            Volver al Inicio
          </button>

          <div className="mt-8">
            <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.6em]">Agencia Moon 2025</p>
          </div>
        </div>
      </div>
    );
  }

  // VISTA REAL PARA ADMINISTRADORES
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6">
      <div className="w-full h-full max-w-2xl bg-white md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header Ejecutivo */}
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
                  {isTyping ? 'Analizando' : 'Soporte Activo'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:px-10 md:py-8 space-y-8 bg-white scroll-smooth pb-16">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}>
              <div className={`flex items-start gap-3.5 max-w-[92%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-gray-100 mt-0.5 transition-all
                  ${msg.type === 'user' ? 'bg-black text-white' : 'bg-primary text-white shadow-purple-100'}
                `}>
                  {msg.type === 'user' ? <UserIcon size={18} strokeWidth={2.5} /> : <BotIcon size={18} strokeWidth={2.5} />}
                </div>

                <div className={`flex flex-col space-y-2 ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-4 md:p-5 rounded-[1.4rem] text-sm font-medium leading-relaxed shadow-sm whitespace-pre-wrap
                    ${msg.type === 'user' 
                      ? 'bg-black text-white rounded-tr-none shadow-[0_10px_20px_-6px_rgba(0,0,0,0.2)]' 
                      : 'bg-primary text-white rounded-tl-none shadow-[0_10px_25px_-6px_rgba(124,58,237,0.4)]'}
                  `}>
                    {msg.text}
                  </div>
                  <p className="text-[9px] font-black uppercase text-gray-600 tracking-widest px-1">
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

        {/* Input Area */}
        <div className="px-6 py-3 md:px-10 md:py-4 bg-white border-t border-gray-50 shrink-0">
          <form onSubmit={handleSend} className="flex gap-3">
            <input 
              type="text" 
              placeholder="Escriba su consulta..."
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
            <p className="text-[7px] font-black text-gray-300 uppercase tracking-[0.6em]">Agencia Moon • Inteligencia Artificial</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
