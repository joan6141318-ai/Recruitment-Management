import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor, InvoiceConfig, CommissionBracket } from '../types';
import { dataService } from '../services/db';
import { Download, Calendar, Coins, Users, Clock, CheckCircle, Shield, Briefcase, UserCheck, FileText, ChevronDown, Edit3, Save, Trash2, X, Search } from 'lucide-react';

interface FacturaProps {
  user: User;
}

const Factura: React.FC<FacturaProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [reclutadores, setReclutadores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [targetRecruiterId, setTargetRecruiterId] = useState(user.rol === 'admin' ? '' : user.id);
  
  // Configuración Editable
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [excludedEmisores, setExcludedEmisores] = useState<string[]>([]);
  const [idFilter, setIdFilter] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
        const config = await dataService.getInvoiceConfig();
        setInvoiceConfig(config);

        if (user.rol === 'admin') {
            const data = await dataService.getRecruiters();
            setReclutadores(data);
            if (data.length > 0 && !targetRecruiterId) {
                setTargetRecruiterId(data[0].id);
            }
        }
    };
    loadInitialData();

    const unsubscribe = dataService.subscribeToEmisores(user, (data) => {
      setEmisores(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const selectedRecruiter = useMemo(() => {
      if (user.rol === 'reclutador') return user;
      return reclutadores.find(r => r.id === targetRecruiterId) || null;
  }, [reclutadores, targetRecruiterId, user]);

  const getSeedMeta = (seeds: number) => {
    if (!invoiceConfig) return "Sin Meta";
    const bracket = [...invoiceConfig.brackets]
      .sort((a, b) => b.seeds - a.seeds)
      .find(b => seeds >= b.seeds);
    return bracket ? `${bracket.seeds.toLocaleString()} Semillas` : "Sin Meta";
  };

  const calculateCommission = (seeds: number, hours: number) => {
    if (!invoiceConfig || hours < 44) return 0;
    const bracket = [...invoiceConfig.brackets]
      .sort((a, b) => b.seeds - a.seeds)
      .find(b => seeds >= b.seeds);
    return bracket ? bracket.usd : 0;
  };

  const filteredData = useMemo(() => {
    return emisores.filter(e => 
      e.mes_entrada === selectedMonth && 
      e.reclutador_id === targetRecruiterId &&
      !excludedEmisores.includes(e.id)
    );
  }, [emisores, selectedMonth, targetRecruiterId, excludedEmisores]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const nonProductive = filteredData.filter(e => (e.horas_mes || 0) < 20).length;
    const hourGoal = filteredData.filter(e => (e.horas_mes || 0) >= 44).length;
    const seedGoalCount = filteredData.filter(e => {
        if (!invoiceConfig) return false;
        const bracket = invoiceConfig.brackets.find(b => (e.semillas_mes || 0) >= b.seeds);
        return bracket && (e.horas_mes || 0) >= 44;
    }).length;
    
    const totalPayment = filteredData.reduce((acc, curr) => acc + calculateCommission(curr.semillas_mes || 0, curr.horas_mes || 0), 0);

    return { total, nonProductive, hourGoal, seedGoalCount, totalPayment };
  }, [filteredData, invoiceConfig]);

  const handleSaveConfig = async () => {
      if (invoiceConfig) {
          await dataService.updateInvoiceConfig(invoiceConfig);
          setEditMode(false);
      }
  };

  const handlePrint = () => { window.print(); };

  const getFormattedMonth = (iso: string) => {
    const [year, month] = iso.split('-');
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  if (loading || !invoiceConfig) return <div className="p-10 text-center text-gray-400 font-brand">Sincronizando módulos de facturación...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-slide-up">
      
      {/* SECCIÓN DE EDICIÓN (ADMIN) */}
      {user.rol === 'admin' && (
          <div className="space-y-4 no-print">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="bg-primary p-2 rounded-xl text-white">
                          <Edit3 size={20} />
                      </div>
                      <div>
                          <h3 className="font-black text-sm uppercase tracking-tight">Módulos de Edición</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Personalizar contenido de la factura</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setEditMode(!editMode)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 ${editMode ? 'bg-orange-50 text-accent' : 'bg-gray-100 text-gray-600'}`}
                  >
                      {editMode ? <><X size={14} /> Cerrar Editor</> : <><Edit3 size={14} /> Abrir Módulos</>}
                  </button>
              </div>

              {editMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                      {/* Modulo: Agencia */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Módulo: Datos Agencia</h4>
                          <input 
                            className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold border-none outline-none focus:ring-1 focus:ring-black"
                            value={invoiceConfig.agenciaNombre}
                            onChange={e => setInvoiceConfig({...invoiceConfig, agenciaNombre: e.target.value})}
                          />
                          <textarea 
                            className="w-full bg-gray-50 p-3 rounded-xl text-xs font-medium border-none h-20 outline-none focus:ring-1 focus:ring-black"
                            value={invoiceConfig.agenciaInfo}
                            onChange={e => setInvoiceConfig({...invoiceConfig, agenciaInfo: e.target.value})}
                          />
                      </div>

                      {/* Modulo: Pago y Banco */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Módulo: Institución de Pago</h4>
                          <div className="space-y-2">
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Transferencia vía (Manual):</p>
                             <input 
                                className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold border-none outline-none focus:ring-1 focus:ring-black"
                                value={invoiceConfig.institucionPago}
                                onChange={e => setInvoiceConfig({...invoiceConfig, institucionPago: e.target.value})}
                             />
                          </div>
                      </div>

                      {/* Modulo: Selección ID por ID */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 md:col-span-2">
                          <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Módulo: Publicación por ID</h4>
                              <div className="relative">
                                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                                  <input 
                                      placeholder="Filtrar ID..." 
                                      className="pl-8 pr-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold outline-none" 
                                      value={idFilter} onChange={e => setIdFilter(e.target.value)}
                                  />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-2">
                              {emisores
                                .filter(e => e.mes_entrada === selectedMonth && e.reclutador_id === targetRecruiterId)
                                .filter(e => e.bigo_id.includes(idFilter))
                                .map(e => (
                                  <label key={e.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                                      <input 
                                        type="checkbox" 
                                        checked={!excludedEmisores.includes(e.id)} 
                                        onChange={() => {
                                            if (excludedEmisores.includes(e.id)) setExcludedEmisores(excludedEmisores.filter(id => id !== e.id));
                                            else setExcludedEmisores([...excludedEmisores, e.id]);
                                        }}
                                      />
                                      <span className="text-[10px] font-black text-gray-600 truncate">ID: {e.bigo_id}</span>
                                  </label>
                              ))}
                          </div>
                      </div>

                      <button 
                        onClick={handleSaveConfig}
                        className="md:col-span-2 py-4 bg-black text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2"
                      >
                          <Save size={18} /> Guardar Configuración Manual
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Panel de Selección General */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Periodo:</label>
                  <input type="month" className="w-full bg-gray-50 p-3.5 rounded-2xl text-sm font-black outline-none" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
              {user.rol === 'admin' && (
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Reclutador:</label>
                      <select className="w-full bg-gray-50 p-3.5 rounded-2xl text-sm font-black outline-none" value={targetRecruiterId} onChange={(e) => setTargetRecruiterId(e.target.value)}>
                        {reclutadores.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                  </div>
              )}
          </div>
          <button onClick={handlePrint} className="w-full bg-black text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl active:scale-95 transition-all">
              <Download size={18} /> Descargar Factura Mensual
          </button>
      </div>

      {/* DOCUMENTO DE FACTURA (RESTAURACIÓN DE FORMATO) */}
      <div id="invoice-document" className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none print:m-0 print:rounded-none">
          
          <div className="bg-black text-white p-12 print:p-8 space-y-6">
              <h1 className="text-3xl font-black tracking-tighter uppercase leading-none font-brand">{invoiceConfig.agenciaNombre}</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm">
                  {invoiceConfig.agenciaInfo}
              </p>
              <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/5">
                      <p className="text-[8px] font-black uppercase text-gray-400 mb-1 tracking-widest">Referencia</p>
                      <p className="text-sm font-black">REF-{selectedMonth.replace('-','')}</p>
                  </div>
                  <img src="/icon.svg" className="w-14 h-14 grayscale brightness-200" alt="Logo" />
              </div>
          </div>

          <div className="p-12 print:p-8 space-y-12">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-gray-100 pb-12">
                  <div className="space-y-8">
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Factura emitida a nombre de :</p>
                          <p className="text-2xl font-black text-gray-900 leading-tight">{selectedRecruiter?.nombre || '...'}</p>
                      </div>
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Referente al periodo del mes de :</p>
                          <p className="text-lg font-black text-black">{getFormattedMonth(selectedMonth)}</p>
                      </div>
                  </div>
                  <div className="space-y-8">
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Por el motivo de :</p>
                          <p className="text-sm font-bold text-gray-700 leading-relaxed">Emisores reclutados durante el mes de {getFormattedMonth(selectedMonth)}</p>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-3 leading-tight h-6 flex items-center justify-center">Número de Emisores ingresados</p>
                      <p className="text-3xl font-black text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-3 leading-tight h-6 flex items-center justify-center">Número de Emisores no productivos</p>
                      <p className="text-3xl font-black text-gray-900">{stats.nonProductive}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-3 leading-tight h-6 flex items-center justify-center">Objetivo mensual en horas logrado</p>
                      <p className="text-3xl font-black text-gray-900">{stats.hourGoal}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-3 leading-tight h-6 flex items-center justify-center">Emisores con meta en semillas</p>
                      <p className="text-3xl font-black text-primary">{stats.seedGoalCount}</p>
                  </div>
              </div>

              <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">Lista detallada de Emisores con cumplimiento</h3>
                  <div className="overflow-hidden rounded-3xl border border-gray-100">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <tr>
                                  <th className="py-5 px-6">Bigo ID</th>
                                  <th className="py-5 px-2 text-center">horas en el mes</th>
                                  <th className="py-5 px-6 text-right">meta en semillas</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {filteredData.length > 0 ? filteredData.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-6 px-6 font-black text-gray-900">{e.bigo_id}</td>
                                    <td className="py-6 px-2 text-center font-bold text-gray-700">{e.horas_mes || 0}h</td>
                                    <td className="py-6 px-6 text-right">
                                        <span className="text-[9px] font-black bg-purple-50 text-primary px-4 py-1.5 rounded-full border border-purple-100">
                                            {getSeedMeta(e.semillas_mes || 0)}
                                        </span>
                                    </td>
                                </tr>
                              )) : (
                                  <tr><td colSpan={3} className="py-16 text-center text-gray-300 italic uppercase tracking-widest">No hay registros ID por ID seleccionados.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="bg-gray-100 rounded-[3rem] p-12 flex flex-col md:flex-row justify-between items-center gap-12 border-[5px] border-white shadow-2xl shadow-gray-200/50 print:p-8 print:shadow-none">
                  <div className="space-y-6 w-full md:w-auto">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Pago total :</p>
                        <p className="text-4xl font-black text-black leading-none">$ {stats.totalPayment.toFixed(2)} USD</p>
                      </div>
                      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Canal de pago transferencia vía :</p>
                        <p className="text-sm font-black text-black uppercase">{invoiceConfig.institucionPago}</p>
                      </div>
                  </div>
                  
                  <div className="text-center md:text-right flex-1 md:max-w-md space-y-8">
                      {/* TIPOGRAFÍA FORMAL PARA EL RECIBO */}
                      <p className="text-sm font-medium text-gray-500 italic leading-loose tracking-tight" style={{fontFamily: 'Georgia, serif'}}>
                        Recibí la cantidad de : <span className="text-black font-black not-italic">$ {stats.totalPayment.toFixed(2)} USD</span> <br/>
                        {invoiceConfig.conceptoSector}
                      </p>
                      
                      <div className="pt-8 border-t border-gray-200 inline-block md:block">
                          <p className="text-[9px] font-black text-black uppercase tracking-[0.5em]">Firma de Conformidad</p>
                          <p className="text-[8px] text-gray-300 font-mono mt-2 uppercase">Idéntico: {selectedRecruiter?.correo}</p>
                      </div>
                  </div>
              </div>

          </div>

          <div className="bg-gray-50 py-8 text-center border-t border-gray-100">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.6em]">Documento Oficial de Liquidación Mensual - AGENCIA MOON</p>
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