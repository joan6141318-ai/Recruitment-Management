import React from 'react';
import { Banknote, Clock, Target, Info, Sparkles, Coins } from 'lucide-react';

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
    <div className="space-y-8 animate-slide-up max-w-2xl mx-auto">
      {/* Header Centralizado */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight font-brand">Plan de Pagos</h2>
        <p className="text-gray-500 text-sm font-medium">Requisitos y escala de beneficios vigentes</p>
      </div>

      {/* Requisitos con el nuevo estilo Estético */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-100 p-5 rounded-[2rem] border-[6px] border-white shadow-xl shadow-gray-200/50 flex items-center gap-4 transition-transform hover:scale-[1.02]">
          <div className="p-3 bg-white text-primary rounded-2xl shadow-sm">
            <Clock size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Diario</p>
            <p className="text-xl font-black text-gray-900 leading-tight">2 Horas</p>
          </div>
        </div>
        
        <div className="bg-gray-100 p-5 rounded-[2rem] border-[6px] border-white shadow-xl shadow-gray-200/50 flex items-center gap-4 transition-transform hover:scale-[1.02]">
          <div className="p-3 bg-white text-accent rounded-2xl shadow-sm">
            <Target size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Mensual</p>
            <p className="text-xl font-black text-gray-900 leading-tight">44 Horas</p>
          </div>
        </div>
      </div>

      {/* Tabla con Marco Blanco y Fondo Gris */}
      <div className="bg-gray-100 rounded-[2.5rem] border-[6px] border-white shadow-2xl shadow-gray-300/40 overflow-hidden">
        
        {/* Cabecera de la Tabla */}
        <div className="p-8 pb-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-black p-1.5 rounded-lg text-white">
                    <Sparkles size={16} />
                </div>
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Escala de Semillas</h3>
            </div>
            <div className="bg-white/80 backdrop-blur px-4 py-1.5 rounded-full border border-gray-200 text-[10px] font-black text-gray-600 uppercase tracking-tighter shadow-sm">
                Divisa: USD
            </div>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-white rounded-[1.8rem] overflow-hidden shadow-inner border border-gray-50">
            <table className="w-full text-left border-collapse">
                <thead>
                <tr className="bg-gray-50/80">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Metas Semillas</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Pago Bruto</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                {paymentData.map((item, index) => (
                    <tr key={index} className="hover:bg-purple-50/30 transition-colors group">
                    <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                <Coins size={14} className="text-gray-400 group-hover:text-primary" />
                            </div>
                            <span className="text-sm font-black text-gray-800 tracking-tight">{item.seeds}</span>
                        </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                        <div className="inline-flex items-center gap-1.5 bg-gray-50 px-4 py-2 rounded-2xl group-hover:bg-black group-hover:text-white transition-all duration-300">
                            <span className="text-xs font-bold opacity-60">$</span>
                            <span className="text-sm font-black tracking-tighter">{item.usd}</span>
                        </div>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        </div>
        
        {/* Nota Informativa */}
        <div className="p-8 pt-4 bg-gray-100">
            <div className="bg-white/40 p-5 rounded-2xl border border-white/60 flex items-start gap-3">
                <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <p className="text-[11px] leading-relaxed font-bold text-gray-500 uppercase tracking-tight italic">
                    Nota: Los pagos se procesan únicamente si el emisor cumple el 100% de la meta de horas. Valores sujetos a políticas de la agencia.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Remuneracion;