import React from 'react';
import { Banknote, Clock, Target, Info, Sparkles } from 'lucide-react';

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
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tabla de Remuneración</h2>
        <p className="text-gray-500 text-sm">Consulta las metas de semillas y sus correspondientes pagos.</p>
      </div>

      {/* Requisitos Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-primary rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requisito Diario</p>
            <p className="text-lg font-bold text-gray-900">2 Horas Diarias</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-accent rounded-xl">
            <Target size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Meta Mensual</p>
            <p className="text-lg font-bold text-gray-900">44 Horas Totales</p>
          </div>
        </div>
      </div>

      {/* Tabla de Pagos Profesional */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden relative">
        <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Escala de Comisiones</h3>
            </div>
            <div className="px-3 py-1 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-tighter">
                Pagos en USD
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">Meta Semillas Mensual</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 text-right">Pago Total (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paymentData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                        <span className="text-sm font-bold text-gray-700">{item.seeds} <span className="text-[10px] text-gray-400 font-medium ml-1 uppercase">Semillas</span></span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className="text-sm font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg group-hover:bg-black group-hover:text-white transition-all">
                        $ {item.usd}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer de la tabla */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="flex items-start gap-3 text-gray-500">
                <Info size={16} className="mt-0.5 text-primary flex-shrink-0" />
                <p className="text-[11px] leading-relaxed font-medium">
                    Los pagos están sujetos al cumplimiento estricto de las 44 horas mensuales y las 2 horas diarias de transmisión activa. Los montos se reflejan en dólares estadounidenses (USD).
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Remuneracion;