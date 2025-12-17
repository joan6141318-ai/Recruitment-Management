import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor, InvoiceConfig } from '../types';
import { dataService } from '../services/db';
import { Download, Calendar, Coins, UserCheck, FileText, Edit3, Save, Trash2, X, Search, ChevronDown, CheckSquare, Square, Eye, EyeOff, AlertCircle, Hash } from 'lucide-react';

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

  const instituciones = ["Paypal", "Payonner", "Western union", "Zelle", "Mercado pago", "Remitly", "Otros"];

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

  const invoiceKey = useMemo(() => `${selectedMonth}_${targetRecruiterId}`, [selectedMonth, targetRecruiterId]);
  
  const isAvailableForDownload = useMemo(() => {
      if (user.rol === 'admin') return true;
      return invoiceConfig?.publishedInvoices?.[invoiceKey] || false;
  }, [invoiceConfig, invoiceKey, user.rol]);

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

  const getFormattedMonth = (iso: string) => {
    const [year, month] = iso.split('-');
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

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

  const toggleInvoicePublication = async () => {
      if (!invoiceConfig) return;
      const currentMap = invoiceConfig.publishedInvoices || {};
      const newMap = { ...currentMap, [invoiceKey]: !currentMap[invoiceKey] };
      const updatedConfig = { ...invoiceConfig, publishedInvoices: newMap };
      setInvoiceConfig(updatedConfig);
      await dataService.updateInvoiceConfig(updatedConfig);
  };

  const handlePrint = () => { 
    if (!isAvailableForDownload) return;
    const originalTitle = document.title;
    // Título formal solicitado: factura mes de : [Mes]
    document.title = `factura mes de : ${getFormattedMonth(selectedMonth)}`;
    window.print(); 
    setTimeout(() => { document.title = originalTitle; }, 100);
  };

  if (loading || !invoiceConfig) return <div className="p-10 text-center text-gray-400 font-brand">Generando factura oficial...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-slide-up">
      
      {/* SECCIÓN DE EDICIÓN EXCLUSIVA PARA ADMINISTRADOR */}
      {user.rol === 'admin' && (
          <div className="space-y-4 no-print">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="bg-black p-2 rounded-xl text-white">
                          <Edit3 size={20} />
                      </div>
                      <div>
                          <h3 className="font-black text-sm uppercase tracking-tight">Módulos de Administración</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Edición manual y publicación</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={toggleInvoicePublication}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border ${invoiceConfig?.publishedInvoices?.[invoiceKey] ? 'bg-green-50 border-green-200 text-green-600 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                    >
                        {invoiceConfig?.publishedInvoices?.[invoiceKey] ? <><Eye size={14} /> Factura Publicada</> : <><EyeOff size={14} /> No Disponible</>}
                    </button>
                    <button 
                        onClick={() => setEditMode(!editMode)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 ${editMode ? 'bg-orange-50 text-accent' : 'bg-gray-100 text-gray-600'}`}
                    >
                        {editMode ? <><X size={14} /> Cerrar Editor</> : <><Edit3 size={14} /> Abrir Editor</>}
                    </button>
                  </div>
              </div>

              {editMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Datos Agencia</h4>
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

                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Canal de Pago</h4>
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
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Agregar ID:</p>
                             <input 
                                className="w-full bg-gray-50 p-3.5 rounded-xl text-xs font-bold border-none outline-none focus:ring-1 focus:ring-black"
                                value={invoiceConfig.referenciaId || ''}
                                placeholder="Ingrese ID manual..."
                                onChange={e => setInvoiceConfig({...invoiceConfig, referenciaId: e.target.value})}
                             />
                          </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 md:col-span-2">
                          <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agregar ID: por ID:</h4>
                              <div className="relative">
                                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                                  <input 
                                      placeholder="Filtrar ID..." 
                                      className="pl-8 pr-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold outline-none" 
                                      value={idFilter} onChange={e => setIdFilter(e.target.value)}
                                  />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
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
                                        className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border ${!isExcluded ? 'bg-black text-white border-black shadow-md' : 'bg-gray-50 text-gray-400 border-gray-100'}`}
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
                        className="md:col-span-2 py-4 bg-black text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-[0.98] transition-all"
                      >
                          <Save size={18} /> Guardar Configuración de Factura
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* Panel de Selección General */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Periodo de Factura:</label>
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
          {isAvailableForDownload && (
            <button onClick={handlePrint} className="w-full bg-black text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl hover:bg-gray-900 transition-colors">
                <Download size={18} /> Descargar Factura Mensual
            </button>
          )}
      </div>

      {/* RESTRICCIÓN PARA RECLUTADORES */}
      {!isAvailableForDownload ? (
          <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-gray-200 shadow-sm animate-pop-in">
              <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="text-accent" size={32} />
              </div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Factura No Generada</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                  la información no está dentro del periodo de pago
              </p>
          </div>
      ) : (
          /* DOCUMENTO DE FACTURA OFICIAL */
          <div id="invoice-document" className="bg-white border border-gray-100 shadow-2xl overflow-hidden print:shadow-none print:border-none print:m-0 font-sans">
              
              {/* Header Corporativo */}
              <div className="bg-black text-white p-12 print:p-8 flex justify-between items-start">
                  <div className="space-y-6">
                      <h1 className="text-4xl font-black tracking-tighter uppercase leading-none font-brand border-b-4 border-white pb-2 inline-block">
                        {invoiceConfig.agenciaNombre}
                      </h1>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed max-w-sm">
                          {invoiceConfig.agenciaInfo}
                      </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                      <img src="/icon.svg" className="w-16 h-16 mb-4 grayscale brightness-200" alt="Agencia Moon" />
                      <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                          <p className="text-[9px] font-black text-gray-500 uppercase mb-0.5 tracking-widest">Periodo de Liquidación</p>
                          <p className="text-sm font-black tracking-[0.2em]">#{selectedMonth.replace('-','')}-{selectedRecruiter?.nombre.split(' ')[0].toUpperCase()}</p>
                      </div>
                  </div>
              </div>

              <div className="p-12 print:p-10 space-y-12 bg-white">
                  
                  {/* Bloque: Identificación Formal */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b-2 border-gray-100 pb-12">
                      <div className="space-y-8">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Factura emitida a nombre de :</p>
                              <p className="text-2xl font-black text-gray-900 border-l-8 border-black pl-4 uppercase tracking-tighter">{selectedRecruiter?.nombre || '...'}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Correspondiente al mes de :</p>
                              <p className="text-lg font-black text-black uppercase">{getFormattedMonth(selectedMonth)}</p>
                          </div>
                      </div>
                      <div className="space-y-8">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Por el motivo de :</p>
                              <p className="text-sm font-black text-gray-800 uppercase leading-relaxed bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm">
                                 pago de servicios realizados durante el periodo de {getFormattedMonth(selectedMonth)}.
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* Bloque: Resumen Estadístico */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                          { label: "Número de Emisores ingresados", val: stats.total },
                          { label: "Número de Emisores no productivos", val: stats.nonProductive },
                          { label: "Objetivo mensual en horas logrado", val: stats.hourGoal },
                          { label: "Emisores con meta en semillas", val: stats.seedGoalCount }
                      ].map((item, idx) => (
                          <div key={idx} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center flex flex-col justify-between h-36">
                              <p className="text-[9px] font-black text-gray-400 uppercase leading-tight tracking-widest">{item.label}</p>
                              <p className="text-5xl font-black text-black tracking-tighter">{item.val}</p>
                          </div>
                      ))}
                  </div>

                  {/* Bloque: Listado de IDs */}
                  <div className="space-y-6">
                      <h3 className="text-[11px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-4">
                        <span className="w-16 h-[4px] bg-black"></span> 
                        RELACIÓN DETALLADA DE EMISORES CON CUMPLIMIENTO
                      </h3>
                      <div className="overflow-hidden rounded-3xl border-2 border-gray-100 shadow-sm">
                          <table className="w-full text-left text-xs">
                              <thead className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                                  <tr>
                                      <th className="py-6 px-8">Identificador Bigo ID</th>
                                      <th className="py-6 px-2 text-center">Horas en el mes</th>
                                      <th className="py-6 px-8 text-right">Meta en Semillas</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y-2 divide-gray-50">
                                  {filteredData.length > 0 ? filteredData.map(e => (
                                    <tr key={e.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-6 px-8 font-black text-gray-900">ID: {e.bigo_id}</td>
                                        <td className="py-6 px-2 text-center">
                                            {user.rol === 'admin' ? (
                                                <input 
                                                    type="number" 
                                                    className="w-20 bg-gray-100 border-none rounded-lg p-2 text-center font-black text-black no-print focus:ring-1 focus:ring-black" 
                                                    defaultValue={e.horas_mes}
                                                    onBlur={(ev) => handleUpdateEmisorDirect(e.id, 'horas_mes', ev.target.value)}
                                                />
                                            ) : null}
                                            <span className={user.rol === 'admin' ? 'hidden print:inline font-bold' : 'inline font-bold'}>{e.horas_mes || 0} h</span>
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                {user.rol === 'admin' ? (
                                                    <input 
                                                        type="number" 
                                                        className="w-28 bg-gray-100 border-none rounded-lg p-2 text-right font-black text-primary no-print focus:ring-1 focus:ring-black" 
                                                        defaultValue={e.semillas_mes}
                                                        onBlur={(ev) => handleUpdateEmisorDirect(e.id, 'semillas_mes', ev.target.value)}
                                                    />
                                                ) : null}
                                                <span className="font-black text-gray-900 tracking-tight">{(e.semillas_mes || 0).toLocaleString()} S.</span>
                                            </div>
                                        </td>
                                    </tr>
                                  )) : (
                                      <tr><td colSpan={3} className="py-24 text-center text-gray-300 font-black uppercase tracking-[0.4em]">Sin registros de cumplimiento seleccionados.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  {/* Bloque: Firma y Leyenda de Recibo Formal */}
                  <div className="bg-white rounded-[3rem] p-12 border-[4px] border-black flex flex-col md:flex-row justify-between items-center gap-12 relative overflow-hidden print:p-10 print:rounded-3xl">
                      <div className="space-y-10 w-full md:w-auto relative z-10">
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Liquidación Total :</p>
                            <p className="text-6xl font-black text-black tracking-tighter leading-none">$ {stats.totalPayment.toFixed(2)} <span className="text-2xl">USD</span></p>
                          </div>
                          <div className="space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Transferencia vía :</p>
                                <p className="text-lg font-black text-black uppercase border-b-4 border-black inline-block">{invoiceConfig.institucionPago || "No Definida"}</p>
                            </div>
                            {invoiceConfig.referenciaId && (
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Referencia ID :</p>
                                    <p className="text-sm font-black text-black uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-md border border-gray-100">{invoiceConfig.referenciaId}</p>
                                </div>
                            )}
                          </div>
                      </div>
                      
                      <div className="text-center md:text-right flex-1 md:max-w-md space-y-12 relative z-10">
                          {/* LEYENDA FORMAL - SIN CURSIVAS */}
                          <div className="space-y-6 text-gray-900">
                              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400 mb-2">Manifestación de Recepción</p>
                              <p className="text-sm font-black leading-relaxed text-justify uppercase tracking-tighter" style={{ fontFamily: "'Inter', sans-serif" }}>
                                RECIBÍ LA CANTIDAD DE : <span className="text-black bg-gray-50 px-2 rounded-md">$ {stats.totalPayment.toFixed(2)} USD</span> POR CONCEPTO DE PAGO DE SERVICIOS OFRECIDOS A AGENCIA MOON EN EL PUESTO DE RECLUTADOR. LA PRESENTE LIQUIDACIÓN SE EFECTÚA DE MANERA EXITOSA Y DE PLENA CONFORMIDAD CON LOS ACUERDOS ESTABLECIDOS.
                              </p>
                          </div>
                          
                          <div className="pt-12 flex flex-col items-center md:items-end">
                              <div className="w-56 h-[4px] bg-black mb-4"></div>
                              <p className="text-[11px] font-black text-black uppercase tracking-[0.6em]">Firma de Conformidad</p>
                              <p className="text-[9px] text-gray-400 font-mono mt-2 uppercase tracking-widest">Hash de Seguridad: {selectedRecruiter?.id.slice(0,12).toUpperCase()}</p>
                          </div>
                      </div>
                  </div>

              </div>

              <div className="bg-gray-50 py-12 text-center border-t-2 border-gray-100">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.8em]">DOCUMENTO OFICIAL DE CONTROL INTERNO - AGENCIA MOON</p>
              </div>
          </div>
      )}

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
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Factura;