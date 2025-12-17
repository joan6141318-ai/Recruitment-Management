import React from 'react';
import { 
  Timer as TimerIcon, 
  Target as TargetIcon, 
  Info as InfoIcon, 
  Sparkles as SparklesIcon, 
  FileText as FileIcon,
  ShieldCheck as ShieldIcon 
} from 'lucide-react';

const Remuneracion: React.FC = () => {
  const paymentData = [
    { seeds: '2,000', usd: '1.50' },
    { seeds: '5,000', usd: '3.50' },
    { seeds: '10,000', usd: '7.00' },
    { seeds: '20,000', usd: '12.00' },
    { seeds: '30,000', usd: '15.00' },
    { seeds: '60,000', usd: '25.00' },
    { seeds: '100,000', usd: '40.00' },
    { seeds: '150,000', usd: '55.00' },
    { seeds: '200,000', usd: '65.00' },
    { seeds: '250,000', usd: '85.00' },
    { seeds: '300,000', usd: '100.00' },
    { seeds: '400,000', usd: '150.00' },
    { seeds: '500,000', usd: '200.00' },
    { seeds: '1,000,000', usd: '300.00' },
    { seeds: '2,000,000', usd: '400.00' },
    { seeds: '3,000,000', usd: '500.00' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-slide-up">
      {/* Encabezado Ejecutivo Limpio */}
      <div className="border-l-4 border-black pl-4 py-1">
        <h2 className="text-2xl font-black text-black tracking-tight font-brand uppercase">Estructura de Comisiones</h2>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Escala Operativa Moon</p>
      </div>

      {/* Requisitos de Base - Diseño Simétrico de Alta Densidad */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-100 border-[5px] border-white p-5 rounded-[2.2rem] flex items-center gap-4 shadow-xl shadow-gray-200/40">
          <div className="w-12 h-12 bg-white text-primary rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <TimerIcon size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Actividad</p>
            <p className="text-xl font-black text-black leading-tight">2 Horas</p>
          </div>
        </div>
        
        <div className="bg-gray-100 border-[5px] border-white p-5 rounded-[2.2rem] flex items-center gap-4 shadow-xl shadow-gray-200/40">
          <div className="w-12 h-12 bg-white text-accent rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
            <TargetIcon size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Mensual</p>
            <p className="text-xl font-black text-black leading-tight">44 Horas</p>
          </div>
        </div>
      </div>

      {/* Tabulador Principal con Marco Blanco */}
      <div className="bg-gray-100 border-[6px] border-white rounded-[2.8rem] shadow-2xl shadow-gray-300/30 overflow-hidden">
        
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-200/30">
            <div className="flex items-center gap-2">
                <div className="bg-black p-1.5 rounded-lg text-white shadow-lg">
                  <SparklesIcon size={14} />
                </div>
                <span className="text-xs font-black text-black uppercase tracking-widest">Tabulador Semillas</span>
            </div>
            <div className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-tighter border border-gray-100 shadow-sm">
                Divisa: USD
            </div>
        </div>

        {/* Listado en Cuadrícula Compacta */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {paymentData.map((item, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100/50 hover:bg-black group transition-all duration-300 shadow-sm"
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter group-hover:text-gray-500 transition-colors">Volumen</span>
                <span className="text-sm font-black text-black font-brand group-hover:text-white transition-colors">{item.seeds}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter group-hover:text-gray-500 transition-colors">Comisión</span>
                <span className="text-sm font-black text-primary group-hover:text-white transition-colors">$ {item.usd}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sección de Notas Legales y Políticas */}
        <div className="bg-white p-8 border-t border-gray-200/40 space-y-6">
          
          {/* Confidencialidad */}
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-gray-50 text-black flex items-center justify-center shrink-0 shadow-inner">
               <ShieldIcon size={18} />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-black text-black uppercase tracking-widest">Protocolo de Confidencialidad</p>
              <p className="text-[10px] font-bold text-gray-400 leading-relaxed uppercase">
                Información exclusiva para el equipo interno. Este tabulador es <span className="text-black">estrictamente confidencial</span>. Los valores y criterios de pago pueden variar según el rendimiento global y políticas internas vigentes.
              </p>
            </div>
          </div>

          {/* Independencia de Objetivos - Rediseño Minimalista */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50 p-5 group hover:border-gray-200 transition-all">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16 opacity-50"></div>
             <div className="relative flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-white text-gray-400 flex items-center justify-center shrink-0 shadow-sm">
                  <FileIcon size={18} />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Independencia de Objetivos</p>
                  <p className="text-[10px] font-medium text-gray-500 leading-relaxed uppercase">
                    Este esquema es independiente de la remuneración y objetivos mensuales por ingreso de nuevos emisores. Los requisitos de tiempo (44h/2h) son vinculantes y obligatorios para la liquidación de las comisiones aquí presentadas.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Identidad de Marca Simplificada */}
      <div className="pt-6 text-center border-t border-gray-50">
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.6em]">Agencia Moon</p>
      </div>
    </div>
  );
};

export default Remuneracion;