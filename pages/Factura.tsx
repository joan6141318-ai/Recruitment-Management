import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor, InvoiceConfig } from '../types';
import { dataService } from '../services/db';
import { Download, Calendar, Coins, UserCheck, FileText, Edit3, Save, Trash2, X, Search, ChevronDown, CheckSquare, Square } from 'lucide-react';

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

  const instituciones = ["PayPal", "Payoneer", "Western Union", "Zelle", "Mercado Pago", "Remitly", "Otros"];

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

  const filteredData = useMemo(() => {
    return emisores.filter(e => 
      e.mes_entrada === selectedMonth && 
      e.reclutador_id === targetRecruiterId &&
      !excludedEmisores.includes(e.id)
    );
  }, [emisores, selectedMonth, targetRecruiterId, excludedEmisores]);

  const stats = useMemo(() => {
    if (!invoiceConfig) return { total: 0, nonProductive: 0, hourGoal: 0, seedGoalCount: 0, totalPayment: 0 };
    
    const calculateCommission = (seeds: number, hours: number) => {
        if (hours < 44) return 0;
        const bracket = [...invoiceConfig.brackets]
          .sort((a, b) => b.seeds - a.seeds)
          .find(b => seeds >= b.seeds);
        return bracket ? bracket.usd : 0;
    };

    const total = filteredData.length;
    const nonProductive = filteredData.filter(e => (e.horas_mes || 0) < 20).length;
    const hourGoal = filteredData.filter(e => (e.horas_mes || 0) >= 44).length;
    const seedGoalCount = filteredData.filter(e => {
        const bracket = invoiceConfig.brackets.find(b => (e.semillas_mes || 0) >= b.seeds);
        return bracket && (e.horas_mes || 0) >= 44;
    }).length;
    
    const totalPayment = filteredData.reduce((acc, curr) => acc + calculateCommission(curr.semillas_mes || 0, curr.horas_mes || 0), 0);

    return { total, nonProductive, hourGoal, seedGoalCount, totalPayment };
  }, [filteredData, invoiceConfig]);

  const handleUpdateEmisorDirect = async (id: string, field: string, value: string) => {
      if (user.rol !== 'admin') return;
      const numValue = Number(value);
      await dataService.updateEmisorData(id, { [field]: numValue }, user.id);
  };

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

  if (loading || !invoiceConfig) return <div className="p-10 text-center text-gray-400 font-brand">Sincronizando factura oficial...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-slide-up">
      
      {/* MÓDULOS DE EDICIÓN EXCLUSIVOS PARA ADMINISTRADOR */}
      {user.rol === 'admin' && (
          <div className="space-y-4 no-print">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="bg-black p-2 rounded-xl text-white">
                          <Edit3 size={20} />
                      </div>
                      <div>
                          <h3 className="font-black text-sm uppercase tracking-tight">Gestión de Factura</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Edición manual de módulos y selección ID por ID</p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setEditMode(!editMode)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 ${editMode ? 'bg-orange-50 text-accent' : 'bg-gray-100 text-gray-600'}`}
                  >
                      {editMode ? <><X size={14} /> Cerrar Módulos</> : <><Edit3 size={14} /> Editar Módulos</>}
                  </button>
              </div>

              {editMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                      {/* Módulo Identidad */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Datos de Identidad</h4>
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

                      {/* Módulo Pago */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institución de Pago</h4>
                          <div className="space-y-3">
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Transferencia vía:</p>
                             <div className="relative">
                                <select 
                                    className="w-full bg-gray-50 p-3.5 rounded-xl text-xs font-bold border-none outline-none appearance-none cursor-pointer focus:ring-1 focus:ring-black"
                                    value={invoiceConfig.institucionPago}
                                    onChange={e => setInvoiceConfig({...invoiceConfig, institucionPago: e.target.value})}
                                >
                                    {instituciones.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                             </div>
                             {invoiceConfig.institucionPago === "Otros" && (
                                <input 
                                    placeholder="Especifique institución..."
                                    className="w-full bg-gray-50 p-3.5 rounded-xl text-xs font-bold border-none outline-none focus:ring-1 focus:ring-black mt-2"
                                    onChange={e => setInvoiceConfig({...invoiceConfig, institucionPago: e.target.value})}
                                />
                             )}
                          </div>
                      </div>

                      {/* Módulo Selección ID por ID */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 md:col-span-2">
                          <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publicación Individual (ID por ID)</h4>
                              <div className="relative">
                                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                                  <input 
                                      placeholder="Filtrar por ID..." 
                                      className="pl-8 pr-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold outline-none" 
                                      value={idFilter} onChange={e => setIdFilter(e.target.value)}
                                  />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                              {emisores
                                .filter(e => e.mes_entrada === selectedMonth && e.reclutador_id === targetRecruiterId)
                                .filter(e => e.bigo_id.includes(idFilter))
                                .map(e => {
                                  const isExcluded = excludedEmisores.includes(e.id);
                                  return (
                                    <div 
                                        key={e.id} 
                                        onClick={() => {
                                            if (isExcluded) setExcludedEmisores(excludedEmisores.filter(id => id !== e.id));
                                            else setExcludedEmisores([...excludedEmisores, e.id]);
                                        }}
                                        className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border ${!isExcluded ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
                                    >
                                        {!isExcluded ? <CheckSquare size={14} /> : <Square size={14} />}
                                        <span className="text-[10px] font-black truncate">ID: {e.bigo_id}</span>
                                    </div>
                                  );
                                })}
                          </div>
                      </div>

                      <button 
                        onClick={handleSaveConfig}
                        className="md:col-span-2 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                          <Save size={18} /> Guardar Configuración de Módulos
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Selector de Periodo y Reclutador */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Periodo:</label>
                  <input type="month" className="w-full bg-gray-50 p-3.5 rounded-2xl text-sm font-black border-none outline-none focus:ring-1 focus:ring-black" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
              {user.rol === 'admin' && (
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Reclutador:</label>
                      <select className="w-full bg-gray-50 p-3.5 rounded-2xl text-sm font-black border-none outline-none" value={targetRecruiterId} onChange={(e) => setTargetRecruiterId(e.target.value)}>
                        {reclutadores.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                  </div>
              )}
          </div>
          <button onClick={handlePrint} className="w-full bg-black text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl hover:bg-gray-900 transition-colors">
              <Download size={18} /> Descargar Factura de Página
          </button>
      </div>

      {/* DOCUMENTO DE FACTURA (ESTILO FORMAL) */}
      <div id="invoice-document" className="bg-white border border-gray-100 shadow-2xl overflow-hidden print:shadow-none print:border-none print:m-0">
          
          {/* Encabezado Corporativo */}
          <div className="bg-black text-white p-12 print:p-8 flex justify-between items-start">
              <div className="space-y-6">
                  <h1 className="text-4xl font-black tracking-tighter uppercase leading-none font-brand border-b-2 border-primary pb-2 inline-block">
                    {invoiceConfig.agenciaNombre}
                  </h1>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm">
                      {invoiceConfig.agenciaInfo}
                  </p>
              </div>
              <div className="text-right flex flex-col items-end">
                  <img src="/icon.svg" className="w-16 h-16 mb-4 grayscale brightness-200" alt="Agencia Moon" />
                  <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                      <p className="text-[9px] font-black text-gray-500 uppercase mb-0.5">Referencia de Pago</p>
                      <p className="text-sm font-black tracking-widest">#{selectedMonth.replace('-','')}-{selectedRecruiter?.nombre.split(' ')[0].toUpperCase()}</p>
                  </div>
              </div>
          </div>

          <div className="p-12 print:p-10 space-y-12 bg-white">
              
              {/* Bloque Informativo 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-gray-100 pb-12">
                  <div className="space-y-8">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Factura emitida a nombre de :</p>
                          <p className="text-2xl font-black text-gray-900 border-l-4 border-black pl-4">{selectedRecruiter?.nombre || '...'}</p>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Referente al periodo del mes de :</p>
                          <p className="text-lg font-black text-black">{getFormattedMonth(selectedMonth)}</p>
                      </div>
                  </div>
                  <div className="space-y-8">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Por el motivo de :</p>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                             Servicios profesionales de reclutamiento y gestión de emisores activos correspondientes al periodo de {getFormattedMonth(selectedMonth)}.
                          </p>
                      </div>
                  </div>
              </div>

              {/* Métricas Mensuales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                      { label: "Número de Emisores ingresados", val: stats.total },
                      { label: "Número de Emisores no productivos", val: stats.nonProductive },
                      { label: "Objetivo mensual en horas logrado", val: stats.hourGoal },
                      { label: "Emisores con meta en semillas", val: stats.seedGoalCount }
                  ].map((item, idx) => (
                      <div key={idx} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center flex flex-col justify-between h-32">
                          <p className="text-[9px] font-black text-gray-400 uppercase leading-tight">{item.label}</p>
                          <p className="text-4xl font-black text-black">{item.val}</p>
                      </div>
                  ))}
              </div>

              {/* Tabla Detallada */}
              <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-3">
                    <span className="w-10 h-[2px] bg-black"></span> 
                    Lista detallada de Emisores con cumplimiento
                  </h3>
                  <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                      <table className="w-full text-left text-xs">
                          <thead className="bg-black text-white text-[9px] font-black uppercase tracking-widest">
                              <tr>
                                  <th className="py-5 px-6">Bigo ID</th>
                                  <th className="py-5 px-2 text-center">Horas en el mes</th>
                                  <th className="py-5 px-6 text-right">Meta en Semillas</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                              {filteredData.length > 0 ? filteredData.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-6 px-6 font-black text-gray-900">ID: {e.bigo_id}</td>
                                    <td className="py-6 px-2 text-center">
                                        {user.rol === 'admin' ? (
                                            <input 
                                                type="number" 
                                                className="w-16 bg-gray-100 border-none rounded p-1 text-center font-bold text-black no-print" 
                                                defaultValue={e.horas_mes}
                                                onBlur={(ev) => handleUpdateEmisorDirect(e.id, 'horas_mes', ev.target.value)}
                                            />
                                        ) : null}
                                        <span className={user.rol === 'admin' ? 'hidden print:inline' : 'inline'}>{e.horas_mes || 0} h</span>
                                    </td>
                                    <td className="py-6 px-6 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            {user.rol === 'admin' ? (
                                                <input 
                                                    type="number" 
                                                    className="w-24 bg-gray-100 border-none rounded p-1 text-right font-bold text-primary no-print" 
                                                    defaultValue={e.semillas_mes}
                                                    onBlur={(ev) => handleUpdateEmisorDirect(e.id, 'semillas_mes', ev.target.value)}
                                                />
                                            ) : null}
                                            <span className="font-bold text-gray-900">{(e.semillas_mes || 0).toLocaleString()} S.</span>
                                        </div>
                                    </td>
                                </tr>
                              )) : (
                                  <tr><td colSpan={3} className="py-20 text-center text-gray-300 font-bold uppercase tracking-widest">No se han seleccionado identificadores para facturar.</td></tr>
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Resumen Final de Liquidación */}
              <div className="bg-white rounded-3xl p-12 border-2 border-black flex flex-col md:flex-row justify-between items-center gap-12 relative overflow-hidden print:p-8">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-16 -mt-16 border-l border-b border-gray-100"></div>
                  
                  <div className="space-y-8 w-full md:w-auto relative z-10">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pago total a liquidar :</p>
                        <p className="text-5xl font-black text-black tracking-tighter leading-none">$ {stats.totalPayment.toFixed(2)} <span className="text-xl">USD</span></p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Canal de pago transferencia vía :</p>
                        <p className="text-base font-black text-black uppercase border-b border-black inline-block">{invoiceConfig.institucionPago}</p>
                      </div>
                  </div>
                  
                  <div className="text-center md:text-right flex-1 md:max-w-md space-y-10 relative z-10">
                      {/* TIPOGRAFÍA FORMAL DE IMPRENTA - SIN CURSIVAS */}
                      <div className="space-y-4 text-gray-900">
                          <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Declaración de recepción</p>
                          <p className="text-sm font-bold leading-relaxed text-justify" style={{ fontFamily: "'Inter', sans-serif" }}>
                            RECIBÍ LA CANTIDAD DE : <span className="font-black">$ {stats.totalPayment.toFixed(2)} USD</span> POR CONCEPTO DE MIS SERVICIOS OFRECIDOS A AGENCIA MOON EN EL PUESTO DE RECLUTADOR. EL PAGO SE HA PROCESADO DE MANERA EXITOSA Y DE CONFORMIDAD CON LAS POLÍTICAS VIGENTES DE LA ORGANIZACIÓN.
                          </p>
                      </div>
                      
                      <div className="pt-8 flex flex-col items-center md:items-end">
                          <div className="w-48 h-[2px] bg-black mb-3"></div>
                          <p className="text-[10px] font-black text-black uppercase tracking-[0.4em]">Firma de Conformidad</p>
                          <p className="text-[8px] text-gray-400 font-mono mt-1">Sello Digital: {selectedRecruiter?.id.slice(0,10).toUpperCase()}</p>
                      </div>
                  </div>
              </div>

          </div>

          <div className="bg-gray-50 py-10 text-center border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Este documento tiene validez oficial interna - AGENCIA MOON</p>
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
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          @page {
            size: A4;
            margin: 0mm;
          }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Factura;