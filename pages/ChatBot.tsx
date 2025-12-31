
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, X, AlertCircle } from 'lucide-react';
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

  // 1. Cargar datos específicos del reclutador para dar contexto a la IA
  useEffect(() => {
    const loadContext = async () => {
      const data = await dataService.getEmisores(user);
      setUserEmisores(data);
    };
    loadContext();
  }, [user]);

  // 2. Construcción de la Instrucción del Sistema Ultra-Especializada
  const buildSystemInstruction = () => {
    // Resumen de datos actuales para la IA
    const emisoresSummary = userEmisores.map(e => 
      `- ${e.nombre} (ID: ${e.bigo_id}): ${e.horas_mes}h, ${e.semillas_mes} semillas, Estado: ${e.estado}`
    ).join('\n');

    return `Eres agencIA, el asistente analítico de Agencia Moon.
    
    REGLAS DE SEGURIDAD Y CONTEXTO:
    - Solo tienes acceso a los datos de ${user.nombre}. No inventes datos de otros reclutadores.
    - RESTRICCIÓN TOTAL: No respondas sobre temas ajenos a Agencia Moon (noticias, cultura general, recetas, etc.). Si el usuario pregunta algo externo, di: "Mi capacidad de asistencia está limitada exclusivamente a la gestión de tu cartera en Agencia Moon. ¿En qué puedo ayudarte con tus emisores?"
    - No puedes generar imágenes.
    - No des consejos de vida externos, solo motivación básica orientada a metas de reclutamiento.

    REGLAS DE NEGOCIO (Lógica Matemática):
    - Meta de Reclutador: 15 nuevos emisores al mes.
    - Productividad: Se considera productivo si tiene >= 20 horas.
    - Bono de Comisión (Requiere 44h obligatorias):
      2k semillas: $1.5 | 5k: $3.5 | 10k: $7 | 20k: $12 | 30k: $15 | 60k: $25 | 100k: $40 | 150k: $55 | 200k: $65 | 250k: $85 | 300k: $100 | 400k: $150 | 500k: $200 | 1M: $300 | 2M: $400 | 3M: $500.

    DATOS ACTUALES DEL RECLUTADOR (${user.nombre}):
    ${emisoresSummary || "Actualmente no tienes emisores registrados."}

    FORMATO DE RESPUESTA:
    - Sé profesional, minimalista y ejecutivo.
    - ALINEACIÓN LIMPIA: No uses asteriscos (*) para negritas ni amontones texto. 
    - Usa espacios y saltos de línea para que los números sean fáciles de leer.
    - Si presentas una lista de emisores, hazlo de forma tabular simple usando texto.`;
  };

  useEffect(() => {
    const firstName = user.nombre.split(' ')[0];
    const initialGreeting = `Bienvenido al centro de mando, ${firstName}. Tengo acceso a tu base de datos actualizada. ¿Deseas analizar tu progreso del mes o el rendimiento de algún ID específico?`;
    
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
    }, 800);

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
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', text: userText, time: timeString }]);
    setInputValue('');
    setIsTyping(true);
    
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("MISSING_API_KEY");

      const ai = new GoogleGenAI({ apiKey });
      
      const history = messages
        .filter(m => !m.isError)
        .map(m => ({
          role: m.type === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...history, { role: 'user', parts: [{ text: userText }] }],
        config: {
          systemInstruction: buildSystemInstruction(),
          temperature: 0.3, // Menor temperatura para mayor precisión matemática
          topP: 0.8,
        },
      });

      const botText = response.text || "No pude procesar la consulta de datos en este momento.";

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: botText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (error: any) {
      const errorMsg = {
        id: Date.now() + 1,
        type: 'bot',
        text: "Error de conexión con el núcleo de datos. Verifica tu conexión.",
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
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary border-[3px] border-white rounded-full"></div>
            </div>
            <div>
              <h2 className="font-brand font-black text-sm md:text-base uppercase tracking-[0.3em] leading-none text-black">agencIA</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isTyping ? 'text-primary animate-pulse' : 'text-gray-400'}`}>
                  {isTyping ? 'Analizando base de datos...' : 'Núcleo Moon Activo'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="w-10 h-10 md:w-11 md:h-11 bg-gray-50 hover:bg-black hover:text-white text-gray-400 rounded-full flex items-center justify-center transition-all duration-300">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#FAFAFA]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-pop-in`}>
              <div className={`flex gap-4 max-w-[90%] ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md
                  ${msg.type === 'user' ? 'bg-black text-white' : (msg.isError ? 'bg-red-500 text-white' : 'bg-white text-primary border border-gray-100')}
                `}>
                  {msg.type === 'user' ? <UserIcon size={16} /> : (msg.isError ? <AlertCircle size={18} /> : <Bot size={18} />)}
                </div>
                <div className="space-y-1.5">
                  <div className={`p-5 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap shadow-sm
                    ${msg.type === 'user' ? 'bg-black text-white rounded-tr-none' : (msg.isError ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none')}
                  `}>
                    {msg.text}
                  </div>
                  <p className={`text-[8px] font-black uppercase text-gray-400 tracking-widest px-2 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
               <div className="flex gap-4">
                 <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-primary shadow-sm">
                   <Bot size={18} />
                 </div>
                 <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                 </div>
               </div>
             </div>
          )}
        </div>

        <div className="p-6 md:p-10 bg-white border-t border-gray-50">
          <form onSubmit={handleSend} className="relative flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Consulta tu base de datos..."
              className="flex-1 bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={isTyping || !inputValue.trim()}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all shrink-0
                ${isTyping || !inputValue.trim() ? 'bg-gray-100 text-gray-300' : 'bg-black text-white hover:bg-primary active:scale-95'}
              `}
            >
              <Send size={20} strokeWidth={2.5} />
            </button>
          </form>
          <p className="text-center mt-6 text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">Propiedad de Agencia Moon</p>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;
