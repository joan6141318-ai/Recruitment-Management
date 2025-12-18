
import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor, InvoiceConfig } from '../types';
import { dataService } from '../services/db';
import { Edit3, Save, X, ChevronDown, Eye, EyeOff, AlertCircle, PlusCircle, DollarSign, Settings2, Users, FileText, ChevronUp, Trash2, Calendar, Target } from 'lucide-react';

interface FacturaProps {
  user: User;
}

const Factura: React.FC<FacturaProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [reclutadores, setReclutadores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [targetRecruiterId, setTargetRecruiterId] = useState(user.rol === 'admin' ? '' : user.id);
  const [showTableDetails, setShowTableDetails] = useState(false);
  
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [excludedEmisores, setExcludedEmisores] = useState<string[]>([]);

  // Estados para Registro Manual
  const [manualId, setManualId] = useState('');
  const [manualHours, setManualHours] = useState('');
  const [manualSeeds, setManualSeeds] = useState('');
  const [manualPagoMeta, setManualPagoMeta] = useState('');
  const [manualPagoHoras, setManualPagoHoras] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  const instituciones = ["Paypal", "Payonner", "Western union", "Zelle", "Mercado pago", "Remitly", "Otros"];

  useEffect(() => {
    const unsubscribeConfig = dataService.subscribeToInvoiceConfig((config) => {
        setInvoiceConfig(config);
    });

    const loadInitialData = async () => {
        if (user.rol === 'admin') {
            const data = await dataService.getRecruiters();
            setReclutadores(data);
            if (data.length > 0 && !targetRecruiterId) {
                setTargetRecruiterId(data[0].id);
            }
        }
    };
    loadInitialData();

    const unsubscribeEmisores = dataService.subscribeToEmisores(user, (data) => {
      setEmisores(data);
      setLoading(false);
    });

    return () => {
        unsubscribeConfig();
        unsubscribeEmisores();
    };
  }, [user]);

  const selectedRecruiter = useMemo(() => {
      if (user.rol === 'reclutador') return user;
      return reclutadores.find(r => r.id === targetRecruiterId) || null;
  }, [reclutadores, targetRecruiterId, user]);

  const invoiceKey = useMemo(() => `${selectedMonth}_${targetRecruiterId}`, [selectedMonth, targetRecruiterId]);
  
  const isAvailableForView = useMemo(() => {
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
    if (!invoiceConfig) return { totalEmisores: 0, totalPayment: 0 };
    const totalPayment = Number(invoiceConfig.pagoAjustes?.[invoiceKey]) || 0;
    const manualTotal = invoiceConfig.totalEmisoresAjustes?.[invoiceKey];
    const totalEmisores = manualTotal !== undefined ? manualTotal : filteredData.length;
    return { totalEmisores, totalPayment };
  }, [filteredData, invoiceConfig, invoiceKey]);

  const handleSaveConfig = async () => {
      if (invoiceConfig) {
          await dataService.updateInvoiceConfig(invoiceConfig);
          setEditMode(false);
      }
  };

  const handleUpdateGlobalAdjustment = (val: string) => {
      if (!invoiceConfig) return;
      const amount = Number(val) || 0;
      const newAjustes = { ...(invoiceConfig.pagoAjustes || {}), [invoiceKey]: amount };
      setInvoiceConfig({ ...invoiceConfig, pagoAjustes: newAjustes });
  };

  const handleUpdateTotalEmisoresAdjustment = (val: string) => {
      if (!invoiceConfig) return;
      const total = parseInt(val);
      const newAjustes = { ...(invoiceConfig.totalEmisoresAjustes || {}), [invoiceKey]: isNaN(total) ? 0 : total };
      setInvoiceConfig({ ...invoiceConfig, totalEmisoresAjustes: newAjustes });
  };

  const handleSaveManualEntry = async () => {
      if (!manualId || !targetRecruiterId || isSavingManual) return;
      setIsSavingManual(true);
      try {
          await dataService.addEmisor({
              nombre: `Manual ${manualId}`,
              bigo_id: manualId,
              pais: "Definido",
              reclutador_id: targetRecruiterId,
              horas_mes: Number(manualHours) || 0,
              semillas_mes: Number(manualSeeds) || 0,
              mes_entrada: selectedMonth,
              es_compartido: false,
              isManualEntry: true,
              pago_meta: Number(manualPagoMeta) || 0,
              pago_horas: Number(manualPagoHoras) || 0
          }, user);
          setManualId(''); setManualHours(''); setManualSeeds(''); setManualPagoMeta(''); setManualPagoHoras('');
      } catch (e) {
          console.error(e);
      } finally {
          setIsSavingManual(false);
      }
  };

  const toggleInvoicePublication = async () => {
      if (!invoiceConfig) return;
      const newMap = { ...(invoiceConfig.publishedInvoices || {}), [invoiceKey]: !invoiceConfig.publishedInvoices?.[invoiceKey] };
      const updatedConfig = { ...invoiceConfig, publishedInvoices: newMap };
      setInvoiceConfig(updatedConfig);
      await dataService.updateInvoiceConfig(updatedConfig);
  };

  if (loading || !invoiceConfig) return <div className="p-10 text-center text-gray-400 font-brand uppercase tracking-widest text-xs font-black">Sincronizando información...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-slide-up">
      
      {/* PANEL ADMINISTRATIVO (NO PRINT) */}
      {user.rol === 'admin' && (
          <div className="space-y-4 no-print">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="bg-black p-2 rounded-xl text-white shadow-lg">
                          <Settings2 size={20} />
                      </div>
                      <div>
                          <h3 className="font-black text-sm uppercase tracking-tight">Panel de Gestión</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ajustes de Liquidación</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={toggleInvoicePublication} 
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border shadow-sm ${invoiceConfig?.publishedInvoices?.[invoiceKey] ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                    >
                        {invoiceConfig?.publishedInvoices?.[invoiceKey] ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Oculta</>}
                    </button>
                    <button onClick={() => setEditMode(!editMode)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 ${editMode ? 'bg-orange-50 text-accent' : 'bg-gray-100 text-gray-600'}`}>
                        {editMode ? <><X size={14} /> Cerrar</> : <><Edit3 size={14} /> Editar</>}
                    </button>
                  </div>
              </div>

              {editMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                      {/* MODULO: FILTRO GLOBAL (MES Y RECLUTADOR) */}
                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-3">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">Módulo de Consulta</h4>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Define el periodo y el beneficiario de la factura</p>
                          <div className="space-y-3">
                              <div>
                                  <label className="text-[9px] text-gray-500 uppercase font-black mb-1 block">Mes de Liquidación</label>
                                  <input type="month" className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black outline-none" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                              </div>
                              <div>
                                  <label className="text-[9px] text-gray-500 uppercase font-black mb-1 block">Reclutador Beneficiario</label>
                                  <select className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black outline-none" value={targetRecruiterId} onChange={(e) => setTargetRecruiterId(e.target.value)}>
                                    {reclutadores.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                                  </select>
                              </div>
                          </div>
                      </div>

                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-3">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">Configuración de Pago</h4>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Canal de pago y monto total de liquidación</p>
                          <select className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black outline-none" value={invoiceConfig.institucionPago} onChange={e => setInvoiceConfig({...invoiceConfig, institucionPago: e.target.value})}>
                              {instituciones.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                          </select>
                          <input type="number" step="0.01" className="w-full bg-white p-3 rounded-xl text-xs font-black outline-none" placeholder="Monto total USD $" value={invoiceConfig.pagoAjustes?.[invoiceKey] || ''} onChange={(e) => handleUpdateGlobalAdjustment(e.target.value)} />
                      </div>

                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-3">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">Identidad de Agencia</h4>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Nombre y descripción legal del encabezado</p>
                          <input className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black outline-none" value={invoiceConfig.agenciaNombre} onChange={e => setInvoiceConfig({...invoiceConfig, agenciaNombre: e.target.value})} />
                          <textarea className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-medium h-20 outline-none" value={invoiceConfig.agenciaInfo} onChange={e => setInvoiceConfig({...invoiceConfig, agenciaInfo: e.target.value})} />
                      </div>

                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-3">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">Registro Manual</h4>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Añadir emisor directamente a la tabla</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input className="bg-white p-2 rounded-lg text-[10px] font-bold outline-none" placeholder="Bigo ID" value={manualId} onChange={e => setManualId(e.target.value)} />
                            <input className="bg-white p-2 rounded-lg text-[10px] font-bold outline-none" placeholder="Horas" value={manualHours} onChange={e => setManualHours(e.target.value)} />
                            <input className="bg-white p-2 rounded-lg text-[10px] font-bold outline-none" placeholder="Semillas" value={manualSeeds} onChange={e => setManualSeeds(e.target.value)} />
                            <button onClick={handleSaveManualEntry} disabled={isSavingManual} className="bg-black text-white p-2 rounded-lg text-[10px] font-black uppercase">Añadir</button>
                          </div>
                      </div>

                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-3">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">Ajuste de Conteo</h4>
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Número exacto de emisores reclutados</p>
                          <input type="number" className="w-full bg-white p-3 rounded-xl text-xs font-black outline-none" placeholder="Cantidad de emisores" value={invoiceConfig.totalEmisoresAjustes?.[invoiceKey] || ''} onChange={(e) => handleUpdateTotalEmisoresAdjustment(e.target.value)} />
                      </div>

                      <button onClick={handleSaveConfig} className="md:col-span-2 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase shadow-xl transition-transform active:scale-95">Guardar Cambios de Liquidación</button>
                  </div>
              )}
          </div>
      )}

      {/* FILTROS (NO PRINT) - RECLUTADOR ONLY (Para admin ya están en el panel superior) */}
      {user.rol === 'reclutador' && (
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 no-print">
            <div className="grid grid-cols-1 gap-4">
                <input type="month" className="w-full bg-gray-50 border-none p-4 rounded-2xl text-sm font-black outline-none shadow-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
            </div>
        </div>
      )}

      {!isAvailableForView ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-200 shadow-sm animate-pop-in">
              <AlertCircle className="text-accent mx-auto mb-6" size={48} />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest max-w-sm mx-auto">
                  Lo sentimos tu consulta no está dentro de el período de pago
              </p>
          </div>
      ) : (
          <div id="invoice-sheet" className="bg-white shadow-2xl overflow-hidden font-sans border border-gray-100">
              
              {/* ENCABEZADO MINIMALISTA PROFESIONAL */}
              <header className="bg-white p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                      <div className="bg-black p-3 rounded-2xl shadow-lg flex items-center justify-center shrink-0">
                        <img src="/icon.svg" className="w-9 h-9 object-contain grayscale brightness-200" alt="Moon" />
                      </div>
                      <div className="space-y-0.5">
                          <h1 className="text-lg font-black tracking-tight uppercase leading-none font-brand text-black" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900 }}>{invoiceConfig.agenciaNombre}</h1>
                          <p className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-tight max-w-xs">{invoiceConfig.agenciaInfo}</p>
                      </div>
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end">
                      <div className="bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-100 flex flex-col items-start md:items-end">
                          <p className="text-[7px] font-black text-gray-400 uppercase mb-0.5 tracking-widest">Folio Liquidación</p>
                          <p className="text-sm font-black tracking-[0.1em] font-brand text-black">MOON-{selectedMonth.replace('-','')}</p>
                      </div>
                  </div>
              </header>

              <main className="p-10 space-y-12">
                  
                  {/* METADATOS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-gray-50 pb-10">
                      <div className="space-y-6">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reclutador Beneficiario :</p>
                              <p className="text-3xl font-black text-black uppercase tracking-tighter border-l-8 border-black pl-5 leading-none">{selectedRecruiter?.nombre || '...'}</p>
                          </div>
                          {/* CANTIDAD DE EMISORES INGRESADOS */}
                          <div className="pt-2">
                             <div className="inline-flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                                <Target size={14} className="text-primary" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emisores Ingresados:</span>
                                <span className="text-sm font-black text-black">{stats.totalEmisores}</span>
                             </div>
                          </div>
                      </div>
                      <div className="flex flex-col items-start md:items-end space-y-4">
                          <div className="text-left md:text-right">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Periodo Correspondiente :</p>
                              <p className="text-lg font-black text-black uppercase tracking-[0.15em]">{selectedMonth}</p>
                          </div>
                          <div className="text-left md:text-right">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha de Emisión :</p>
                              <p className="text-sm font-bold text-gray-500 uppercase">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                      </div>
                  </div>

                  {/* TABLA DE RELACIÓN DETALLADA (TARJETA GRIS) */}
                  <div className="bg-gray-100 border-[6px] border-white rounded-[2.5rem] shadow-lg overflow-hidden">
                      <div 
                          className="px-8 py-5 flex justify-between items-center cursor-pointer hover:bg-gray-200/50 transition-colors"
                          onClick={() => setShowTableDetails(!showTableDetails)}
                      >
                          <div className="flex items-center gap-4">
                              <div className="bg-black text-white p-1.5 rounded-lg">
                                  <FileText size={16} />
                              </div>
                              <h3 className="text-xs font-black text-black uppercase tracking-[0.2em]">Relación Detallada</h3>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-primary uppercase bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm transition-transform active:scale-95">
                                {showTableDetails ? 'Ocultar' : 'Ver Detalle'}
                              </span>
                              {showTableDetails ? <ChevronUp size={16} className="text-black" /> : <ChevronDown size={16} className="text-black" />}
                          </div>
                      </div>
                      
                      {showTableDetails && (
                          <div className="p-4 animate-slide-up">
                              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-inner">
                                  <table className="w-full text-left text-[11px] border-collapse">
                                      <thead className="bg-black text-white font-black uppercase tracking-widest">
                                          <tr>
                                              <th className="py-4 px-6">Bigo ID</th>
                                              <th className="py-4 px-4 text-center">Horas</th>
                                              <th className="py-4 px-4 text-center">Semillas</th>
                                              <th className="py-4 px-6 text-right">Bono USD</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-50">
                                          {filteredData.length > 0 ? filteredData.map(e => (
                                            <tr key={e.id}>
                                                <td className="py-4 px-6 font-black text-gray-900 uppercase">ID: {e.bigo_id}</td>
                                                <td className="py-4 px-4 text-center font-bold">{e.horas_mes || 0}H</td>
                                                <td className="py-4 px-4 text-center font-bold">{(e.semillas_mes || 0).toLocaleString()}</td>
                                                <td className="py-4 px-6 text-right font-black text-black">
                                                    ${((e.pago_meta || 0) + (e.pago_horas || 0)).toFixed(2)}
                                                </td>
                                            </tr>
                                          )) : (
                                              <tr><td colSpan={4} className="py-12 text-center text-gray-300 font-black uppercase tracking-widest">Sin registros</td></tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* TARJETA DE PAGO FINAL (ESTILO GRIS CON BORDE BLANCO) */}
                  <div className="bg-gray-100 border-[8px] border-white rounded-[3rem] p-10 md:p-14 shadow-xl flex flex-col items-center text-center gap-10 relative overflow-hidden">
                      <div className="space-y-8 w-full max-w-xl">
                          <div className="space-y-1">
                            <p className="text-[11px] font-black text-black uppercase tracking-[0.25em] mb-4">Recibí la cantidad de :</p>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-4xl md:text-5xl font-black text-black tracking-tighter leading-none font-brand">$ {stats.totalPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span className="text-lg md:text-xl font-black text-primary tracking-[0.1em] self-end pb-1">USD</span>
                            </div>
                            <div className="pt-8 space-y-3">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                                    Correspondiente a liquidación del periodo <span className="text-black font-black">{selectedMonth}</span>
                                </p>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                                    Por prestación de mis servicios como reclutador de agencia moon
                                </p>
                            </div>
                          </div>
                          
                          <div className="pt-10 border-t border-gray-200/50 flex flex-col items-center">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-2">Canal de Transferencia :</p>
                              <p className="text-base font-black text-black uppercase tracking-[0.2em] border-b-2 border-black inline-block pb-0.5">{invoiceConfig.institucionPago || "PENDIENTE"}</p>
                          </div>
                      </div>
                  </div>
              </main>

              <footer className="py-12 text-center bg-white border-t border-gray-50">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em]">
                    Agencia moon 2025
                  </p>
              </footer>
          </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          #invoice-sheet { border: none !important; box-shadow: none !important; width: 100% !important; display: block !important; }
          .bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          .border-white { border-color: #fff !important; }
          .font-brand { font-family: 'Outfit', sans-serif !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default Factura;
