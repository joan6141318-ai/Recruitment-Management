
import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor, InvoiceConfig, CommissionBracket } from '../types';
import { dataService } from '../services/db';
// Added 'X' to the lucide-react imports to fix the "Cannot find name 'X'" error
import { Download, Calendar, Coins, Users, Clock, CheckCircle, Shield, Briefcase, UserCheck, FileText, ChevronDown, Edit3, Save, Plus, Trash2, Eye, X } from 'lucide-react';

interface FacturaProps {
  user: User;
}

const Factura: React.FC<FacturaProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [reclutadores, setReclutadores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [targetRecruiterId, setTargetRecruiterId] = useState(user.rol === 'admin' ? '' : user.id);
  
  // Estado para la configuración de factura (Editable por Admin)
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [excludedEmisores, setExcludedEmisores] = useState<string[]>([]);

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
        const bracket = invoiceConfig.brackets.find(b => (e.seeds || 0) >= b.seeds);
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

  if (loading || !invoiceConfig) return <div className="p-10 text-center text-gray-400">Preparando módulos de facturación...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-slide-up">
      
      {/* MÓDULOS DE EDICIÓN PARA EL ADMINISTRADOR */}
      {user.rol === 'admin' && (
          <div className="space-y-4 no-print">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="bg-primary p-2 rounded-xl text-white">
                          <Edit3 size={20} />
                      </div>
                      <div>
                          <h3 className="font-black text-sm uppercase tracking-tight">Editor de Facturación</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Modificar información y tabuladores</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setEditMode(!editMode)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors flex items-center gap-2 ${editMode ? 'bg-orange-50 text-accent' : 'bg-gray-100 text-gray-600'}`}
                  >
                      {editMode ? <><X size={14} /> Cerrar Editor</> : <><Edit3 size={14} /> Editar Contenido</>}
                  </button>
              </div>

              {editMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                      {/* Modulo 1: Info Agencia */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Módulo 1: Identidad de Agencia</h4>
                          <div className="space-y-3">
                              <input 
                                className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold border-none"
                                value={invoiceConfig.agenciaNombre}
                                onChange={e => setInvoiceConfig({...invoiceConfig, agenciaNombre: e.target.value})}
                                placeholder="Nombre de Agencia"
                              />
                              <textarea 
                                className="w-full bg-gray-50 p-3 rounded-xl text-xs font-medium border-none h-20"
                                value={invoiceConfig.agenciaInfo}
                                onChange={e => setInvoiceConfig({...invoiceConfig, agenciaInfo: e.target.value})}
                                placeholder="Información de identidad"
                              />
                          </div>
                      </div>

                      {/* Modulo 2: Tabulador de Pagos */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Módulo 2: Tabulador de Comisiones</h4>
                          <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                              {invoiceConfig.brackets.map((b, i) => (
                                  <div key={i} className="flex gap-2 items-center">
                                      <input 
                                        type="number" className="flex-1 bg-gray-50 p-2 rounded-lg text-[10px] font-bold" 
                                        value={b.seeds} onChange={e => {
                                            const nb = [...invoiceConfig.brackets];
                                            nb[i].seeds = Number(e.target.value);
                                            setInvoiceConfig({...invoiceConfig, brackets: nb});
                                        }}
                                      />
                                      <span className="text-gray-300 text-[10px]">→</span>
                                      <input 
                                        type="number" className="flex-1 bg-gray-50 p-2 rounded-lg text-[10px] font-bold" 
                                        value={b.usd} onChange={e => {
                                            const nb = [...invoiceConfig.brackets];
                                            nb[i].usd = Number(e.target.value);
                                            setInvoiceConfig({...invoiceConfig, brackets: nb});
                                        }}
                                      />
                                      <button onClick={() => {
                                          const nb = invoiceConfig.brackets.filter((_, idx) => idx !== i);
                                          setInvoiceConfig({...invoiceConfig, brackets: nb});
                                      }}><Trash2 size={12} className="text-red-300"/></button>
                                  </div>
                              ))}
                          </div>
                          <button 
                            onClick={() => setInvoiceConfig({...invoiceConfig, brackets: [...invoiceConfig.brackets, {seeds:0, usd:0}]})}
                            className="w-full py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase text-gray-400 border border-dashed border-gray-200"
                          >+ Añadir Rango</button>
                      </div>

                      {/* Modulo 3: Concepto y Canal */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Módulo 3: Concepto y Pago</h4>
                          <textarea 
                            className="w-full bg-gray-50 p-3 rounded-xl text-xs font-medium border-none h-16"
                            value={invoiceConfig.conceptoSector}
                            onChange={e => setInvoiceConfig({...invoiceConfig, conceptoSector: e.target.value})}
                          />
                          <input 
                            className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold border-none"
                            value={invoiceConfig.canalPagoDefault}
                            onChange={e => setInvoiceConfig({...invoiceConfig, canalPagoDefault: e.target.value})}
                          />
                      </div>

                      {/* Modulo 4: Selección de Emisores */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Módulo 4: Selección de Emisores</h4>
                          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-2">
                              {emisores.filter(e => e.mes_entrada === selectedMonth && e.reclutador_id === targetRecruiterId).map(e => (
                                  <label key={e.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        checked={!excludedEmisores.includes(e.id)} 
                                        onChange={() => {
                                            if (excludedEmisores.includes(e.id)) setExcludedEmisores(excludedEmisores.filter(id => id !== e.id));
                                            else setExcludedEmisores([...excludedEmisores, e.id]);
                                        }}
                                      />
                                      <span className="text-[10px] font-bold text-gray-600 truncate">{e.nombre} ({e.bigo_id})</span>
                                  </label>
                              ))}
                          </div>
                      </div>

                      <button 
                        onClick={handleSaveConfig}
                        className="md:col-span-2 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2"
                      >
                          <Save size={18} /> Guardar Cambios en Módulos
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Panel de Selección y Generación */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Periodo:</label>
                  <input 
                      type="month" 
                      className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-sm font-black outline-none focus:ring-1 focus:ring-black"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                  />
              </div>

              {user.rol === 'admin' && (
                  <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Reclutador:</label>
                      <select 
                        className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-sm font-black outline-none"
                        value={targetRecruiterId}
                        onChange={(e) => setTargetRecruiterId(e.target.value)}
                      >
                        {reclutadores.map(r => (
                            <option key={r.id} value={r.id}>{r.nombre}</option>
                        ))}
                      </select>
                  </div>
              )}
          </div>
          <button 
            onClick={handlePrint}
            className="w-full bg-black text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl active:scale-95 transition-all"
          >
              <Download size={18} /> Descargar Factura Mensual
          </button>
      </div>

      {/* FORMATO DE FACTURA ORIGINAL */}
      <div id="invoice-document" className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none print:m-0 print:rounded-none">
          
          {/* Header de la Factura */}
          <div className="bg-black text-white p-12 print:p-8 space-y-4">
              <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">{invoiceConfig.agenciaNombre}</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm">
                  {invoiceConfig.agenciaInfo}
              </p>
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <div className="bg-white/10 px-4 py-2 rounded-xl">
                      <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Folio Documento</p>
                      <p className="text-sm font-black">REF-{selectedMonth.replace('-','')}</p>
                  </div>
                  <img src="/icon.svg" className="w-12 h-12 grayscale brightness-200" alt="Moon" />
              </div>
          </div>

          <div className="p-12 print:p-8 space-y-10">
              
              {/* Bloque 1: Datos de Emisión */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-gray-100 pb-10">
                  <div className="space-y-6">
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Factura emitida a nombre de :</p>
                          <p className="text-xl font-black text-gray-900">{selectedRecruiter?.nombre || '...'}</p>
                      </div>
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Referente al periodo del mes de :</p>
                          <p className="text-base font-black text-black">{getFormattedMonth(selectedMonth)}</p>
                      </div>
                  </div>
                  <div className="space-y-6">
                      <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Por el motivo de :</p>
                          <p className="text-sm font-bold text-gray-700">Emisores reclutados durante el mes de {getFormattedMonth(selectedMonth)}</p>
                      </div>
                  </div>
              </div>

              {/* Bloque 2: Métricas (Labels Originales) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Número de Emisores ingresados</p>
                      <p className="text-3xl font-black text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Número de Emisores no productivos</p>
                      <p className="text-3xl font-black text-gray-900">{stats.nonProductive}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Objetivo mensual en horas logrado</p>
                      <p className="text-3xl font-black text-gray-900">{stats.hourGoal}</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Emisores con meta en semillas</p>
                      <p className="text-3xl font-black text-primary">{stats.seedGoalCount}</p>
                  </div>
              </div>

              {/* Bloque 3: Tabla Detallada */}
              <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-black uppercase tracking-widest border-l-4 border-black pl-3">Lista detallada de Emisores con cumplimiento</h3>
                  <div className="overflow-hidden rounded-2xl border border-gray-50">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                              <tr>
                                  <th className="py-4 px-4">Bigo ID</th>
                                  <th className="py-4 px-2 text-center">horas en el mes</th>
                                  <th className="py-4 px-4 text-right">meta en semillas</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {filteredData.length > 0 ? filteredData.map(e => (
                                <tr key={e.id}>
                                    <td className="py-5 px-4 font-black">{e.bigo_id}</td>
                                    <td className="py-5 px-2 text-center font-bold">{e.horas_mes || 0}h</td>
                                    <td className="py-5 px-4 text-right">
                                        <span className="text-[9px] font-black bg-purple-50 text-primary px-3 py-1 rounded-full border border-purple-100">
                                            {getSeedMeta(e.semillas_mes || 0)}
                                        </span>
                                    </td>
                                </tr>
                              )) : (
                                  <tr><td colSpan={3} className="py-10 text-center text-gray-300 italic">No se encontraron registros para este periodo.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Bloque 4: Resumen de Pago (Labels Originales) */}
              <div className="bg-gray-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-center gap-10 border-[4px] border-white shadow-xl shadow-gray-200/50 print:p-6 print:shadow-none">
                  <div className="space-y-4 w-full md:w-auto">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Pago total :</p>
                        <p className="text-2xl font-black text-black leading-none">$ {stats.totalPayment.toFixed(2)} USD</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Canal de pago:</p>
                        <p className="text-xs font-bold text-gray-600 uppercase bg-white px-3 py-1 rounded-lg inline-block border border-gray-100">{invoiceConfig.canalPagoDefault}</p>
                      </div>
                  </div>
                  <div className="text-center md:text-right flex-1 md:max-w-xs">
                      <p className="text-[10px] font-medium text-gray-400 italic leading-relaxed uppercase">
                        Recibí la cantidad de : <span className="text-black font-black">$ {stats.totalPayment.toFixed(2)} USD</span> <br/>
                        {invoiceConfig.conceptoSector}
                      </p>
                      <div className="mt-8 pt-6 border-t border-gray-200">
                          <p className="text-[9px] font-black text-black uppercase tracking-[0.5em]">Firma de Conformidad</p>
                      </div>
                  </div>
              </div>

          </div>

          <div className="bg-gray-50 py-6 text-center border-t border-gray-100">
              <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.6em]">Documento Oficial de Liquidación - AGENCIA MOON</p>
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
