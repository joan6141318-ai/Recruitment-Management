import React from 'react';
import { Clock, Target, Info, Sparkles, Coins, ArrowUpRight } from 'lucide-react';

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
    <div className="space-y-10 animate-slide-up max-w-4xl mx-auto px-4 pb-12">
      {/* Header Minimalista */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
          Estructura de Comisiones 2024
        </div>
        <h2 className="text-4xl font-black text-black tracking-tighter font-brand leading-none">
          TABULADOR MOON
        </h2>
        <div className="h-1 w-12 bg-black rounded-full"></div>
      </div>

      {/* KPI Requirements - Diseño Simétrico */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-card flex flex-col items-center text-center space-y-2 border border-gray-100">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-primary">
            <Clock size={24} strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compromiso Diario</p>
          <p className="text-2xl font-black text-black font-brand">2 HORAS</p>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] shadow-card flex flex-col items-center text-center space-y-2 border border-gray-100">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-accent">
            <Target size={24} strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Meta de Transmisión</p>
          <p className="text-2xl font-black text-black font-brand">44 HORAS</p>
        </div>
      </div>

      {/* Main Table Content - El "Frame" Blanco con Fondo Gris */}
      <div className="bg-gray-100 rounded-[3rem] border-[8px] border-white shadow-2xl overflow-hidden">
        
        {/* Subheader Interno */}
        <div className="p-10 pb-6 flex justify-between items-end">
            <div className="space-y-1">
                <h3 className="font-black text-black text-xl font-brand flex items-center gap-2">
                    <Sparkles size={20} className="text-primary" /> ESCALA DE ÉXITO
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Relación Semilla vs USD</p>
            </div>
            <div className="bg-black text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tighter shadow-lg">
                Official Agency Rates
            </div>
        </div>

        {/* Grid Symmetrical List - 2 Columnas para reducir largo */}
        <div className="px-8 pb-10 grid grid-cols-1 md:grid-cols-2 gap-3">
          {paymentData.map((item, index) => (
            <div 
                key={index} 
                className="bg-white rounded-[1.5rem] p-5 flex justify-between items-center group hover:bg-black hover:scale-[1.02] transition-all duration-300 border border-gray-200/50 shadow-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Coins size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white/50">Semillas</span>
                        <span className="text-base font-black text-black font-brand tracking-tight group-hover:text-white">{item.seeds}</span>
                    </div>
                </div>
                
                <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-primary font-black text-lg group-hover:text-white transition-colors">
                        <span className="text-sm opacity-50">$</span>
                        <span className="font-brand leading-none">{item.usd}</span>
                        <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                    </div>
                    <span className="text-[8px] font-bold text-gray-300 uppercase group-hover:text-white/30">Pago Bruto</span>
                </div>
            </div>
          ))}
        </div>

        {/* Footer Profesional - Nota Legal */}
        <div className="bg-white/50 backdrop-blur-sm p-8 border-t border-gray-200">
            <div className="flex items-start gap-4 max-w-2xl mx-auto">
                <div className="bg-black text-white p-2 rounded-lg mt-1">
                    <Info size={14} />
                </div>
                <div className="space-y-2">
                    <p className="text-[11px] font-black text-black uppercase tracking-widest">Protocolo de Validación de Pagos</p>
                    <p className="text-[10px] leading-relaxed font-medium text-gray-500 uppercase">
                        El desembolso total está estrictamente vinculado al cumplimiento simultáneo de las <span className="text-black font-bold">44 horas mensuales</span> y el promedio de <span className="text-black font-bold">2 horas diarias</span>. Cualquier incumplimiento en los requisitos de tiempo invalidará la bonificación por semillas, aplicándose únicamente las tasas base de la plataforma si corresponde.
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="flex justify-center items-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all pb-8">
          <div className="h-px w-12 bg-gray-400"></div>
          <span className="text-[10px] font-black tracking-[0.4em] text-gray-400 uppercase">Agencia Moon International</span>
          <div className="h-px w-12 bg-gray-400"></div>
      </div>
    </div>
  );
};

export default Remuneracion;