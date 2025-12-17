import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Download, Calendar, Coins, Users, Clock, CheckCircle, Shield, Briefcase } from 'lucide-react';

interface FacturaProps {
  user: User;
}

const Factura: React.FC<FacturaProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const unsubscribe = dataService.subscribeToEmisores(user, (data) => {
      // Cada reclutador solo ve su propia data
      setEmisores(data.filter(e => e.reclutador_id === user.id));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const commissionBrackets = [
    { seeds: 3000000, usd: 500.00 },
    { seeds: 2000000, usd: 400.00 },
    { seeds: 1000000, usd: 300.00 },
    { seeds: 500000, usd: 200.00 },
    { seeds: 400000, usd: 150.00 },
    { seeds: 300000, usd: 100.00 },
    { seeds: 250000, usd: 85.00 },
    { seeds: 200000, usd: 65.00 },
    { seeds: 150000, usd: 55.00 },
    { seeds: 100000, usd: 40.00 },
    { seeds: 60000, usd: 25.00 },
    { seeds: 30000, usd: 15.00 },
    { seeds: 20000, usd: 12.00 },
    { seeds: 10000, usd: 7.00 },
    { seeds: 5000, usd: 3.50 },
    { seeds: 2000, usd: 1.50 },
  ];

  const getSeedMeta = (seeds: number) => {
    const bracket = commissionBrackets.find(b => seeds >= b.seeds);
    return bracket ? `${bracket.seeds.toLocaleString()} Semillas` : "Sin Meta";
  };

  const calculateCommission = (seeds: number, hours: number) => {
    if (hours < 44) return 0;
    const bracket = commissionBrackets.find(b => seeds >= b.seeds);
    return bracket ? bracket.usd : 0;
  };

  const filteredData = useMemo(() => {
    return emisores.filter(e => e.mes_entrada === selectedMonth);
  }, [emisores, selectedMonth]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const nonProductive = filteredData.filter(e => (e.horas_mes || 0) < 20).length;
    const hourGoal = filteredData.filter(e => (e.horas_mes || 0) >= 44).length;
    const seedGoalCount = filteredData.filter(e => {
        const bracket = commissionBrackets.find(b => (e.semillas_mes || 0) >= b.seeds);
        return bracket && (e.horas_mes || 0) >= 44;
    }).length;
    
    const totalPayment = filteredData.reduce((acc, curr) => acc + calculateCommission(curr.semillas_mes || 0, curr.horas_mes || 0), 0);

    return { total, nonProductive, hourGoal, seedGoalCount, totalPayment };
  }, [filteredData]);

  const handlePrint = () => { window.print(); };

  const getFormattedMonth = (iso: string) => {
    const [year, month] = iso.split('-');
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Generando reporte de facturación...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-slide-up">
      
      {/* Selector de Mes */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="flex items-center gap-3">
              <div className="bg-black text-white p-2 rounded-xl">
                  <Calendar size={20} />
              </div>
              <div>
                  <h3 className="font-bold text-gray-900 text-sm">Consultar Factura</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Elige el mes para descargar</p>
              </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
              <input 
                  type="month" 
                  className="flex-1 md:w-48 bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-black"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
              />
              <button 
                onClick={handlePrint}
                className="bg-black text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg active:scale-95 transition-transform"
              >
                  <Download size={18} /> Descargar Factura
              </button>
          </div>
      </div>

      {/* DOCUMENTO DE FACTURA */}
      <div id="invoice-document" className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none">
          
          <div className="bg-black text-white p-10 flex justify-between items-center">
              <div>
                  <h1 className="text-3xl font-black tracking-tighter mb-1 uppercase">AGENCIA MOON</h1>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.25em]">Socio Operativo de Bigo Live</p>
                  <p className="text-[9px] text-gray-400 mt-4 leading-relaxed max-w-[250px] uppercase font-bold">
                      Identidad Independiente de Gestión de Talento
                  </p>
              </div>
              <div className="text-right">
                  <img src="/icon.svg" className="w-14 h-14 ml-auto mb-4 grayscale brightness-200" alt="Logo" />
                  <div className="bg-white/10 px-4 py-2 rounded-xl inline-block">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Periodo</p>
                      <p className="text-sm font-black">{selectedMonth}</p>
                  </div>
              </div>
          </div>

          <div className="p-10 space-y-10">
              
              {/* Información de la Factura */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-gray-100 pb-10">
                  <div className="space-y-6">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Factura emitida a nombre de:</p>
                          <p className="text-xl font-black text-gray-900">{user.nombre}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Referente al periodo del mes de:</p>
                          <p className="text-lg font-black text-black">{getFormattedMonth(selectedMonth)}</p>
                      </div>
                  </div>
                  <div className="space-y-6">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Por el motivo de:</p>
                          <p className="text-sm font-bold text-gray-700">Emisores reclutados durante el mes de {getFormattedMonth(selectedMonth)}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Puesto Operativo:</p>
                          <p className="text-sm font-black text-primary uppercase">Reclutador</p>
                      </div>
                  </div>
              </div>

              {/* Estadísticas de la Factura */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Emisores ingresados</p>
                      <p className="text-2xl font-black text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Emisores no productivos</p>
                      <p className="text-2xl font-black text-gray-900">{stats.nonProductive}</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Cumplieron objetivo horas</p>
                      <p className="text-2xl font-black text-gray-900">{stats.hourGoal}</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Cumplieron meta semillas</p>
                      <p className="text-2xl font-black text-gray-900">{stats.seedGoalCount}</p>
                  </div>
              </div>

              {/* Lista Detallada */}
              <div className="space-y-4">
                  <h3 className="text-xs font-black text-black uppercase tracking-widest">Lista detallada de Emisores con cumplimiento</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase">
                              <tr>
                                  <th className="py-3">Nombre</th>
                                  <th className="py-3">Bigo ID</th>
                                  <th className="py-3 text-center">Horas en el mes</th>
                                  <th className="py-3 text-center">Meta en semillas</th>
                                  <th className="py-3 text-right">Comisión</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {filteredData.length > 0 ? filteredData.map(e => (
                                <tr key={e.id}>
                                    <td className="py-4 font-bold">{e.nombre}</td>
                                    <td className="py-4 font-mono text-xs">{e.bigo_id}</td>
                                    <td className="py-4 text-center font-bold">{e.horas_mes || 0}h</td>
                                    <td className="py-4 text-center">
                                        <span className="text-[9px] font-black bg-gray-100 px-2 py-1 rounded-full uppercase">
                                            {getSeedMeta(e.semillas_mes || 0)}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right font-black text-primary">
                                        $ {calculateCommission(e.semillas_mes || 0, e.horas_mes || 0).toFixed(2)}
                                    </td>
                                </tr>
                              )) : (
                                  <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-xs italic">Sin registros en este mes.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Totales y Declaración */}
              <div className="bg-gray-50 rounded-3xl p-10 flex flex-col md:flex-row justify-between items-center gap-8 border border-gray-100">
                  <div className="space-y-4">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Canal de pago:</p>
                          <p className="text-sm font-bold text-black uppercase">Transferencia / Wallet Digital</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pago total:</p>
                          <p className="text-2xl font-black text-primary">$ {stats.totalPayment.toFixed(2)} USD</p>
                      </div>
                  </div>
                  <div className="text-center md:text-right space-y-6">
                      <div className="max-w-xs ml-auto">
                          <p className="text-[11px] font-medium text-gray-500 italic leading-relaxed">
                            "Recibí la cantidad de <span className="text-black font-bold font-sans">$ {stats.totalPayment.toFixed(2)} USD</span> por concepto de mis servicios ofrecidos a agencia moon en el puesto de Reclutador."
                          </p>
                      </div>
                      <div className="pt-6 border-t border-gray-200">
                          <p className="text-[10px] font-black text-black uppercase tracking-[0.4em]">Firma Digital Autorizada</p>
                      </div>
                  </div>
              </div>

          </div>

          <div className="bg-gray-50 py-6 text-center border-t border-gray-100">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.5em]">Agencia Moon - Documento de Liquidación Mensual</p>
          </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #invoice-document { border: none !important; border-radius: 0 !important; width: 100%; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Factura;