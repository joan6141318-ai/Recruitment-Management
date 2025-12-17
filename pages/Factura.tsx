
import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
// Added missing FileText and ChevronDown imports
import { Download, Calendar, Coins, Users, Clock, CheckCircle, Shield, Briefcase, UserCheck, FileText, ChevronDown } from 'lucide-react';

interface FacturaProps {
  user: User;
}

const Factura: React.FC<FacturaProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [reclutadores, setReclutadores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Para administradores: selección de reclutador
  const [targetRecruiterId, setTargetRecruiterId] = useState(user.rol === 'admin' ? '' : user.id);

  useEffect(() => {
    const loadInitialData = async () => {
        if (user.rol === 'admin') {
            const data = await dataService.getRecruiters();
            setReclutadores(data);
            if (data.length > 0 && !targetRecruiterId) {
                setTargetRecruiterId(data[0].id);
            }
        }
        setLoading(false);
    };
    loadInitialData();

    const unsubscribe = dataService.subscribeToEmisores(user, (data) => {
      setEmisores(data);
    });
    return () => unsubscribe();
  }, [user]);

  const selectedRecruiter = useMemo(() => {
      if (user.rol === 'reclutador') return user;
      return reclutadores.find(r => r.id === targetRecruiterId) || null;
  }, [reclutadores, targetRecruiterId, user]);

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
    return emisores.filter(e => e.mes_entrada === selectedMonth && e.reclutador_id === targetRecruiterId);
  }, [emisores, selectedMonth, targetRecruiterId]);

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
      
      {/* Controles de Administración */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 no-print">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                  <div className="bg-black text-white p-2.5 rounded-2xl">
                      <FileText size={22} />
                  </div>
                  <div>
                      <h3 className="font-black text-gray-900 text-base uppercase tracking-tight">Panel de Facturación</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Generar reporte mensual oficial</p>
                  </div>
              </div>
              <button 
                onClick={handlePrint}
                className="w-full md:w-auto bg-black text-white px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl active:scale-95 transition-all hover:bg-gray-900"
              >
                  <Download size={18} /> Descargar Factura
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Periodo de Liquidación</label>
                  <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                          type="month" 
                          className="w-full bg-gray-50 border border-gray-100 pl-11 pr-4 py-3.5 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-black/5"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                      />
                  </div>
              </div>

              {user.rol === 'admin' && (
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Emitir factura para:</label>
                      <div className="relative">
                          <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <select 
                            className="w-full bg-gray-50 border border-gray-100 pl-11 pr-10 py-3.5 rounded-2xl text-sm font-black outline-none appearance-none focus:ring-2 focus:ring-black/5"
                            value={targetRecruiterId}
                            onChange={(e) => setTargetRecruiterId(e.target.value)}
                          >
                            <option value={user.id}>{user.nombre} (Mía)</option>
                            {reclutadores.filter(r => r.id !== user.id).map(r => (
                                <option key={r.id} value={r.id}>{r.nombre}</option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronDown size={16} className="text-gray-400" />
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* DOCUMENTO DE FACTURA FORMAL */}
      <div id="invoice-document" className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none print:m-0 print:rounded-none">
          
          {/* Header Corporativo */}
          <div className="bg-black text-white p-12 flex justify-between items-center print:p-8">
              <div className="space-y-2">
                  <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">AGENCIA MOON</h1>
                  <p className="text-[11px] font-bold text-primary uppercase tracking-[0.3em]">Socio Operativo de Bigo Live</p>
                  <div className="pt-6 border-t border-white/10 mt-6">
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-relaxed">
                          Identidad Independiente de Gestión de Talento <br/> Digital y Reclutamiento Estratégico
                      </p>
                  </div>
              </div>
              <div className="text-right flex flex-col items-end">
                  <img src="/icon.svg" className="w-20 h-20 mb-6 grayscale brightness-200" alt="Logo" />
                  <div className="bg-white/10 px-5 py-2.5 rounded-2xl inline-block border border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Documento de Pago</p>
                      <p className="text-base font-black">REF-{selectedMonth.replace('-', '')}</p>
                  </div>
              </div>
          </div>

          <div className="p-12 space-y-12 print:p-8">
              
              {/* Bloque Informativo de Identidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-gray-100 pb-12">
                  <div className="space-y-8">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reclutador Beneficiario:</p>
                          <p className="text-2xl font-black text-gray-900 leading-tight">{selectedRecruiter?.nombre}</p>
                          <p className="text-sm text-gray-500 font-mono mt-1">{selectedRecruiter?.correo}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Periodo de Servicios:</p>
                          <p className="text-xl font-black text-black">{getFormattedMonth(selectedMonth)}</p>
                      </div>
                  </div>
                  <div className="space-y-8">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Concepto Detallado:</p>
                          <p className="text-sm font-bold text-gray-700 leading-relaxed uppercase">
                            Bonificación por productividad de Emisores reclutados y seguimiento de metas operativas.
                          </p>
                      </div>
                      <div className="flex gap-10">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Puesto:</p>
                              <p className="text-xs font-black text-primary uppercase bg-purple-50 px-3 py-1 rounded-lg border border-purple-100 inline-block">Reclutador Moon</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Divisa:</p>
                              <p className="text-xs font-black text-gray-900 uppercase">USD (Dólares)</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Métricas de Desempeño Mensual */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-tighter">Emisores Ingresados</p>
                      <p className="text-3xl font-black text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-tighter">No Productivos</p>
                      <p className="text-3xl font-black text-gray-900">{stats.nonProductive}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-tighter">Meta Horas (44h+)</p>
                      <p className="text-3xl font-black text-gray-900">{stats.hourGoal}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-tighter">Meta Semillas</p>
                      <p className="text-3xl font-black text-green-600">{stats.seedGoalCount}</p>
                  </div>
              </div>

              {/* Desglose de Emisores */}
              <div className="space-y-6">
                  <div className="flex items-center gap-3 border-l-4 border-black pl-4">
                      <h3 className="text-xs font-black text-black uppercase tracking-[0.2em]">Desglose Detallado de Emisores</h3>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm print:text-xs">
                          <thead className="border-b-2 border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                              <tr>
                                  <th className="py-4 px-2">Nombre del Emisor</th>
                                  <th className="py-4 px-2">Bigo ID</th>
                                  <th className="py-4 px-2 text-center">Horas en el mes</th>
                                  <th className="py-4 px-2 text-center">Objetivo Semillas</th>
                                  <th className="py-4 px-2 text-right">Comisión</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {filteredData.length > 0 ? filteredData.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-5 px-2 font-black text-gray-900">{e.nombre}</td>
                                    <td className="py-5 px-2 font-mono text-xs text-gray-500">{e.bigo_id}</td>
                                    <td className="py-5 px-2 text-center font-bold">{e.horas_mes || 0}h</td>
                                    <td className="py-5 px-2 text-center">
                                        <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-3 py-1 rounded-full uppercase border border-gray-200">
                                            {getSeedMeta(e.semillas_mes || 0)}
                                        </span>
                                    </td>
                                    <td className="py-5 px-2 text-right font-black text-primary">
                                        $ {calculateCommission(e.semillas_mes || 0, e.horas_mes || 0).toFixed(2)}
                                    </td>
                                </tr>
                              )) : (
                                  <tr><td colSpan={5} className="py-16 text-center text-gray-300 text-xs italic uppercase tracking-widest">Sin registros operacionales en este periodo.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Resumen Financiero Final */}
              <div className="bg-gray-100 rounded-[2.5rem] p-12 flex flex-col md:flex-row justify-between items-center gap-12 border-[5px] border-white shadow-2xl shadow-gray-200/50 print:p-8 print:shadow-none">
                  <div className="space-y-6 w-full md:w-auto">
                      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-200 flex items-center gap-4">
                          <Briefcase size={20} className="text-gray-400" />
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Canal de Liquidación:</p>
                            <p className="text-sm font-black text-black uppercase">Transferencia / Monedero Electrónico</p>
                          </div>
                      </div>
                      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 border-l-8 border-l-primary flex items-center gap-4">
                          <Coins size={20} className="text-primary" />
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Estatus de Pago:</p>
                            <p className="text-sm font-black text-primary uppercase">Pendiente de Aprobación</p>
                          </div>
                      </div>
                  </div>
                  <div className="text-center md:text-right">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Pago Total Neto</p>
                      <p className="text-6xl font-black text-black leading-none print:text-5xl">$ {stats.totalPayment.toFixed(2)}</p>
                      <p className="text-[10px] font-black text-primary mt-4 uppercase tracking-widest">Dólares Americanos (USD)</p>
                  </div>
              </div>

              {/* Declaración de Recepción y Firma */}
              <div className="bg-white border-4 border-dashed border-gray-100 rounded-[2.5rem] p-12 text-center space-y-6 print:p-8 print:border-2">
                  <div className="max-w-2xl mx-auto">
                      <p className="text-[11px] font-medium text-gray-400 uppercase leading-loose italic">
                        "Recibí la cantidad de <span className="text-black font-black font-sans tracking-tight">$ {stats.totalPayment.toFixed(2)} USD</span> por concepto de mis servicios profesionales e independientes ofrecidos a <span className="text-black font-bold uppercase tracking-wider">Agencia Moon</span> en el puesto operativo de <span className="text-black font-bold">Reclutador</span> para el ecosistema Bigo Live."
                      </p>
                  </div>
                  <div className="pt-12 flex flex-col items-center">
                      <div className="w-64 h-px bg-gray-200 mb-4"></div>
                      <p className="text-[10px] font-black text-black uppercase tracking-[0.5em]">Firma de Conformidad Digital</p>
                      <p className="text-[9px] text-gray-400 font-mono mt-2 uppercase tracking-tighter">Autenticado vía: {selectedRecruiter?.correo}</p>
                      <p className="text-[8px] text-gray-300 font-mono mt-1 uppercase">Sello de Tiempo: {new Date().toLocaleDateString()}</p>
                  </div>
              </div>

          </div>

          <div className="bg-gray-50 py-8 text-center border-t border-gray-100">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.6em]">Documento Oficial de Liquidación - AGENCIA MOON - 2024</p>
          </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          main { margin: 0 !important; padding: 0 !important; max-width: 100% !important; }
          #invoice-document { 
            border: none !important; 
            border-radius: 0 !important; 
            width: 100% !important; 
            box-shadow: none !important; 
            display: block !important;
            page-break-after: always;
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          @page {
            size: auto;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default Factura;
