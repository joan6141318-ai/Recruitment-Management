import React from 'react';
import { Banknote, Clock, Target, Info } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 animate-slide-up">
      {/* Encabezado Profesional */}
      <div className="border-l-4 border-primary pl-4 py-1">
        <h2 className="text-2xl font-bold text-black tracking-tight font-brand uppercase">Remuneración</h2>
        <p className="text-gray-500 text-sm font-medium">Escala de pagos por cumplimiento de metas mensuales.</p>
      </div>

      {/* Requisitos de Base - Simetría Lado a Lado */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-purple-50 text-primary rounded-xl flex items-center justify-center shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diario</p>
            <p className="text-lg font-bold text-black">2 Horas</p>
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-orange-50 text-accent rounded-xl flex items-center justify-center shrink-0">
            <Target size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mensual</p>
            <p className="text-lg font-bold text-black">44 Horas</p>
          </div>
        </div>
      </div>

      {/* Estructura de la Tabla: Fondo Gris con Marco Blanco */}
      <div className="bg-gray-100 border-[6px] border-white rounded-[2rem] shadow-xl overflow-hidden">
        
        {/* Título de sección dentro del frame */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-200/50">
            <div className="flex items-center gap-2">
                <Banknote size={18} className="text-gray-900" />
                <span className="text-xs font-bold text-black uppercase tracking-wider">Tabulador de Semillas</span>
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase">Moneda: USD</span>
        </div>

        {/* Tabla en Grid de 2 columnas para reducir altura */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          {paymentData.map((item, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200/40 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Meta Semillas</span>
                <span className="text-sm font-bold text-black font-brand">{item.seeds}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Pago Total</span>
                <span className="text-sm font-black text-primary">$ {item.usd}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Nota Legal Limpia y Profesional */}
        <div className="bg-white/40 p-8 border-t border-gray-200/50">
          <div className="flex gap-3 items-start max-w-2xl">
            <Info size={16} className="text-gray-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-black uppercase tracking-wide">Condiciones de Pago</p>
              <p className="text-[10px] font-medium text-gray-500 leading-relaxed uppercase">
                Para acceder a la remuneración es obligatorio cumplir con las 44 horas mensuales y las 2 horas diarias de transmisión. El incumplimiento de cualquiera de los dos requisitos anulará el bono de semillas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Identidad de Marca */}
      <div className="pt-4 text-center">
        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.5em]">Agencia Moon International</p>
      </div>
    </div>
  );
};

export default Remuneracion;