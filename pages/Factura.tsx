import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Download, Calendar, Coins, Users, Clock, CheckCircle, Shield, Briefcase, ChevronDown } from 'lucide-react';

interface FacturaProps {
  user: User;
}

const Factura: React.FC<FacturaProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const unsubscribe = dataService.subscribeToEmisores(user, (data) => {
      // Filtrar por el usuario actual (incluso si es admin, se genera su factura personal o la de un reclutador si el admin quiere verla)
      // Pero el prompt dice: cada reclutador podrá descargar su factura individual.
      setEmisores(data.filter(e => e.reclutador_id === user.id));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Tabulador de comisiones para cálculo de meta en semillas
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
    // Solo aplica si cumple el mínimo de horas (44h/2h diario promedio)
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

  const handlePrint = () => {
    window.print();
  };

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
              <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <Calendar size={20} />
              </div>
              <div>
                  <h3 className="font-bold text-gray-900 text-sm">Periodo de Facturación</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Selecciona el mes a consultar</p>
              </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                  <input 
                      type="month" 
                      className="w-full md:w-48 bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-black"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                  />
              </div>
              <button 
                onClick={handlePrint}
                className="bg-black text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg active:scale-95 transition-transform"
              >
                  <Download size={18} /> Descargar PDF
              </button>
          </div>
      </div>

      {/* DOCUMENTO DE FACTURA */}
      <div id="invoice-document" className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none">
          
          {/* Cabecera Corporativa */}
          <div className="bg-black text-white p-10 flex justify-between items-center">
              <div>
                  <h1 className="text-3xl font-black tracking-tighter mb-1 uppercase">AGENCIA MOON</h1>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-[0.3em]">Socio Operativo de Bigo Live</p>
                  <p className="text-[10px] text-gray-400 mt-4 leading-relaxed max-w-[200px]">
                      Entidad independiente de gestión de talento y reclutamiento digital.
                  </p>
              </div>
              <div className="text-right">
                  <img src="/icon.svg" className="w-16 h-16 ml-auto mb-4 grayscale brightness-200" alt="Logo" />
                  <div className="bg-white/10 px-4 py-2 rounded-xl inline-block">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Folio Mensual</p>
                      <p className="text-sm font-black">MOON-{selectedMonth.replace('-', '')}</p>
                  </div>
              </div>
          </div>

          <div className="p-10 space-y-10">
              
              {/* Información del Receptor y Concepto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-gray-100 pb-10">
                  <div className="space-y-4">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Factura emitida a nombre de:</p>
                          <p className="text-xl font-black text-gray-900">{user.nombre}</p>
                          <p className="text-sm text-gray-500 font-medium">{user.correo}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Puesto Operativo:</p>
                          <p className="text-sm font-bold text-primary uppercase tracking-wider">Reclutador Interno</p>
                      </div>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Referente al periodo del mes de:</p>
                          <p className="text-xl font-black text-gray-900">{getFormattedMonth(selectedMonth)}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Motivo de Pago:</p>
                          <p className="text-sm font-medium text-gray-600">Servicios de reclutamiento y seguimiento de productividad de emisores durante el periodo mensual vigente.</p>
                      </div>
                  </div>
              </div>

              {/* Estadísticas de Gestión */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <Users size={16} className="text-gray-400 mb-2"/>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Emisores Ingresados</p>
                      <p className="text-2xl font-black text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <Shield size={16} className="text-accent mb-2"/>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">No Productivos</p>
                      <p className="text-2xl font-black text-gray-900">{stats.nonProductive}</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <Clock size={16} className="text-primary mb-2"/>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Meta Horas Cumplida</p>
                      <p className="text-2xl font-black text-gray-900">{stats.hourGoal}</p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <CheckCircle size={16} className="text-green-600 mb-2"/>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Meta Semillas Lograda</p>
                      <p className="text-2xl font-black text-gray-900">{stats.seedGoalCount}</p>
                  </div>
              </div>

              {/* Tabla Detallada */}
              <div className="space-y-4">
                  <h3 className="text-xs font-black text-black uppercase tracking-widest border-l-4 border-primary pl-3">Desglose de Emisores con Cumplimiento</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead>
                              <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  <th className="py-3 px-2">Nombre Emisor</th>
                                  <th className="py-3 px-2">Bigo ID</th>
                                  <th className="py-3 px-2 text-center">Horas</th>
                                  <th className="py-3 px-2 text-center">Meta Lograda</th>
                                  <th className="py-3 px-2 text-right">Monto</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {filteredData.length > 0 ? filteredData.map(e => {
                                  const commission = calculateCommission(e.semillas_mes || 0, e.horas_mes || 0);
                                  return (
                                    <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-2 font-bold text-gray-900">{e.nombre}</td>
                                        <td className="py-4 px-2 font-mono text-xs text-gray-500">{e.bigo_id}</td>
                                        <td className="py-4 px-2 text-center font-bold">{e.horas_mes || 0}h</td>
                                        <td className="py-4 px-2 text-center">
                                            <span className="text-[10px] font-black bg-purple-50 text-primary px-2 py-1 rounded-full">
                                                {getSeedMeta(e.semillas_mes || 0)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-2 text-right font-black text-primary">
                                            $ {commission.toFixed(2)}
                                        </td>
                                    </tr>
                                  );
                              }) : (
                                  <tr>
                                      <td colSpan={5} className="py-10 text-center text-gray-400 text-xs italic">
                                          Sin registros de emisores en este periodo.
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Resumen Final de Pago */}
              <div className="bg-gray-100 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center gap-8 border-[4px] border-white shadow-xl shadow-gray-200/50">
                  <div className="space-y-3">
                      <div className="flex items-center gap-3">
                          <Briefcase size={16} className="text-gray-400"/>
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Canal de Pago Sugerido</p>
                      </div>
                      <p className="text-sm font-bold text-black bg-white px-4 py-2 rounded-xl inline-block shadow-sm">Transferencia / Monedero Digital</p>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Monto Total a Recibir</p>
                      <p className="text-5xl font-black text-black leading-none">$ {stats.totalPayment.toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-primary mt-2 uppercase tracking-tighter">Dólares Americanos (USD)</p>
                  </div>
              </div>

              {/* Declaración de Recepción */}
              <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-8 text-center space-y-4">
                  <p className="text-[10px] font-medium text-gray-400 uppercase leading-relaxed max-w-xl mx-auto italic">
                      "Recibí la cantidad de <span className="text-black font-bold font-sans tracking-normal">$ {stats.totalPayment.toFixed(2)} USD</span> por concepto de mis servicios profesionales independientes ofrecidos a Agencia Moon en el puesto de Reclutador para la plataforma Bigo Live, correspondientes al periodo mensual indicado."
                  </p>
                  <div className="pt-8 flex flex-col items-center">
                      <div className="w-48 h-px bg-gray-200 mb-2"></div>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest">Firma de Conformidad Digital</p>
                      <p className="text-[9px] text-gray-400 font-mono mt-1 uppercase">Validado via: {user.correo}</p>
                  </div>
              </div>

          </div>

          <div className="bg-gray-50 py-6 text-center border-t border-gray-100">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.6em]">Documento Oficial de Uso Interno - Agencia Moon</p>
          </div>
      </div>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          main { margin: 0 !important; padding: 0 !important; }
          #root { width: 100%; }
          #invoice-document { border: none !important; border-radius: 0 !important; shadow: none !important; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Factura;