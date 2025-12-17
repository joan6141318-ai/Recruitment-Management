
import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor, InvoiceConfig } from '../types';
import { dataService } from '../services/db';
import { Download, Edit3, Save, X, ChevronDown, Eye, EyeOff, AlertCircle, PlusCircle, DollarSign, Settings2, Users, Trash2, PenTool } from 'lucide-react';

interface FacturaProps {
  user: User;
}

const Factura: React.FC<FacturaProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [reclutadores, setReclutadores] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [targetRecruiterId, setTargetRecruiterId] = useState(user.rol === 'admin' ? '' : user.id);
  
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
    if (!invoiceConfig) return { totalEmisores: 0, totalPayment: 0 };
    
    const totalPayment = Number(invoiceConfig.pagoAjustes?.[invoiceKey]) || 0;
    const manualTotal = invoiceConfig.totalEmisoresAjustes?.[invoiceKey];
    const totalEmisores = manualTotal !== undefined ? manualTotal : filteredData.length;
    
    return { totalEmisores, totalPayment };
  }, [filteredData, invoiceConfig, invoiceKey]);

  const handleUpdateEmisorDirect = async (id: string, field: string, value: string) => {
      if (user.rol !== 'admin') return;
      const numValue = Number(value);
      await dataService.updateEmisorData(id, { [field]: numValue }, user.id);
  };

  const handleUpdateGlobalAdjustment = (val: string) => {
      if (!invoiceConfig) return;
      const amount = Number(val) || 0;
      const currentAjustes = invoiceConfig.pagoAjustes || {};
      const newAjustes = { ...currentAjustes, [invoiceKey]: amount };
      setInvoiceConfig({ ...invoiceConfig, pagoAjustes: newAjustes });
  };

  const handleUpdateTotalEmisoresAdjustment = (val: string) => {
      if (!invoiceConfig) return;
      const total = parseInt(val);
      const currentAjustes = invoiceConfig.totalEmisoresAjustes || {};
      const newAjustes = { ...currentAjustes, [invoiceKey]: isNaN(total) ? 0 : total };
      setInvoiceConfig({ ...invoiceConfig, totalEmisoresAjustes: newAjustes });
  };

  const handleSaveConfig = async () => {
      if (invoiceConfig) {
          await dataService.updateInvoiceConfig(invoiceConfig);
          setEditMode(false);
      }
  };

  const handleRemoveEmisorDirect = (id: string) => {
      if (!excludedEmisores.includes(id)) {
          setExcludedEmisores([...excludedEmisores, id]);
      }
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
      const currentMap = invoiceConfig.publishedInvoices || {};
      const newMap = { ...currentMap, [invoiceKey]: !currentMap[invoiceKey] };
      const updatedConfig = { ...invoiceConfig, publishedInvoices: newMap };
      setInvoiceConfig(updatedConfig);
      await dataService.updateInvoiceConfig(updatedConfig);
  };

  const handlePrint = () => { 
    if (!isAvailableForDownload) return;
    window.print(); 
  };

  if (loading || !invoiceConfig) return <div className="p-10 text-center text-gray-400 font-brand uppercase tracking-widest text-xs font-black">Sincronizando factura...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-slide-up">
      
      {/* SECCIÓN ADMINISTRATIVA (NO IMPRIMIBLE) */}
      {user.rol === 'admin' && (
          <div className="space-y-4 print:hidden">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="bg-black p-2 rounded-xl text-white shadow-lg">
                          <Edit3 size={20} />
                      </div>
                      <div>
                          <h3 className="font-black text-sm uppercase tracking-tight">Panel Administrativo</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ajustes de Liquidación</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={toggleInvoicePublication} 
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border shadow-sm ${invoiceConfig?.publishedInvoices?.[invoiceKey] ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
                    >
                        {invoiceConfig?.publishedInvoices?.[invoiceKey] ? <><Eye size={14} /> Visible para Reclutador</> : <><EyeOff size={14} /> Privada (Oculta)</>}
                    </button>
                    <button onClick={() => setEditMode(!editMode)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 ${editMode ? 'bg-orange-50 text-accent' : 'bg-gray-100 text-gray-600'}`}>
                        {editMode ? <><X size={14} /> Cerrar</> : <><Edit3 size={14} /> Editar</>}
                    </button>
                  </div>
              </div>

              {editMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up">
                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-4">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">Configuración de Agencia</h4>
                          <div className="space-y-3">
                            <input className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary shadow-sm" value={invoiceConfig.agenciaNombre} onChange={e => setInvoiceConfig({...invoiceConfig, agenciaNombre: e.target.value})} />
                            <textarea className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-medium h-20 outline-none focus:ring-2 focus:ring-primary shadow-sm" value={invoiceConfig.agenciaInfo} onChange={e => setInvoiceConfig({...invoiceConfig, agenciaInfo: e.target.value})} />
                          </div>
                      </div>

                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-4">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">Información de Pago y Firma</h4>
                          <div className="space-y-4">
                            <div className="relative">
                                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Canal de Pago:</label>
                                <select className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary shadow-sm" value={invoiceConfig.institucionPago} onChange={e => setInvoiceConfig({...invoiceConfig, institucionPago: e.target.value})}>
                                    {instituciones.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none mt-2" size={16} />
                            </div>
                            <div className="relative">
                                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Nombre para Firma:</label>
                                <div className="relative">
                                    <PenTool size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                                    <input 
                                        type="text" 
                                        className="w-full bg-white border border-gray-200 pl-10 pr-4 py-3 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-primary shadow-sm"
                                        placeholder="Nombre autorizador..."
                                        value={invoiceConfig.signatureName || ''}
                                        onChange={e => setInvoiceConfig({...invoiceConfig, signatureName: e.target.value})}
                                    />
                                </div>
                            </div>
                          </div>
                      </div>

                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-4 md:col-span-2">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                             <Settings2 size={14} /> Ajustes Globales de Factura
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                  <label className="text-[9px] font-bold text-primary uppercase tracking-tighter block mb-1">PAGO TOTAL ($ USD):</label>
                                  <div className="relative">
                                      <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                                      <input 
                                          type="number" 
                                          step="0.01"
                                          className="w-full bg-gray-50 border border-gray-100 pl-10 pr-4 py-4 rounded-xl text-base font-black text-black outline-none focus:ring-2 focus:ring-primary shadow-inner"
                                          placeholder="Escribe el monto..."
                                          value={invoiceConfig.pagoAjustes?.[invoiceKey] || ''}
                                          onChange={(e) => handleUpdateGlobalAdjustment(e.target.value)}
                                      />
                                  </div>
                              </div>
                              <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                  <label className="text-[9px] font-bold text-primary uppercase tracking-tighter block mb-1">TOTAL EMISORES INGRESADOS:</label>
                                  <div className="relative">
                                      <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
                                      <input 
                                          type="number" 
                                          className="w-full bg-gray-50 border border-gray-100 pl-10 pr-4 py-4 rounded-xl text-base font-black text-black outline-none focus:ring-2 focus:ring-primary shadow-inner"
                                          placeholder="Cantidad de emisores..."
                                          value={invoiceConfig.totalEmisoresAjustes?.[invoiceKey] || ''}
                                          onChange={(e) => handleUpdateTotalEmisoresAdjustment(e.target.value)}
                                      />
                                  </div>
                              </div>
                          </div>
                      </div>

                      <button onClick={handleSaveConfig} className="md:col-span-2 py-4 bg-black text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-all">
                          <Save size={18} /> Aplicar Cambios Finales
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* FILTROS DE PERIODO (NO IMPRIMIBLE) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-primary uppercase ml-1 tracking-widest">Mes de Facturación:</label>
                  <input type="month" className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-primary shadow-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
              {user.rol === 'admin' && (
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-primary uppercase ml-1 tracking-widest">Reclutador Beneficiario:</label>
                      <select className="w-full bg-gray-50 border border-gray-100 p-3.5 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-primary shadow-sm" value={targetRecruiterId} onChange={(e) => setTargetRecruiterId(e.target.value)}>
                        {reclutadores.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                  </div>
              )}
          </div>
          {isAvailableForDownload && (
            <button onClick={handlePrint} className="w-full bg-black text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl transition-colors">
                <Download size={18} /> Descargar Liquidación PDF
            </button>
          )}
      </div>

      {!isAvailableForDownload ? (
          <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-gray-200 shadow-sm animate-pop-in print:hidden">
              <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertCircle className="text-accent" size={40} />
              </div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight mb-3">Consulta de Factura</h3>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                  Lo sentimos tu consulta no está dentro de el período de pago
              </p>
          </div>
      ) : (
          <div id="invoice-document" className="invoice-container bg-white border border-gray-100 shadow-2xl overflow-visible font-sans">
              
              {/* CABECERA FORMAL */}
              <div className="bg-black text-white p-12 flex justify-between items-start header-print">
                  <div className="space-y-6">
                      <h1 className="text-4xl font-black tracking-tighter uppercase leading-none font-brand border-b-4 border-white pb-2 inline-block">{invoiceConfig.agenciaNombre}</h1>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed max-w-sm">{invoiceConfig.agenciaInfo}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                      <img src="/icon.svg" className="w-16 h-16 mb-4 grayscale brightness-200" alt="Moon" />
                      <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                          <p className="text-[9px] font-black text-gray-500 uppercase mb-0.5 tracking-widest">Folio de Liquidación</p>
                          <p className="text-sm font-black tracking-[0.2em]">#MOON-{selectedMonth.replace('-','')}</p>
                      </div>
                  </div>
              </div>

              <div className="p-12 space-y-12 bg-white main-content-print">
                  
                  {/* INFORMACIÓN DE LA FACTURA */}
                  <div className="grid grid-cols-2 gap-12 border-b-2 border-gray-100 pb-12">
                      <div className="space-y-8">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reclutador Beneficiario :</p>
                              <p className="text-2xl font-black text-gray-900 border-l-8 border-black pl-4 uppercase tracking-tighter">{selectedRecruiter?.nombre || '...'}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total de Emisores Ingresados :</p>
                              <div className="flex items-center gap-3">
                                  <Users size={16} className="text-black" />
                                  <p className="text-lg font-black text-black">{stats.totalEmisores} Personas</p>
                              </div>
                          </div>
                      </div>
                      <div className="space-y-8 flex flex-col items-end text-right">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Periodo Correspondiente :</p>
                              <p className="text-lg font-black text-black uppercase tracking-widest">{selectedMonth}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fecha de Emisión :</p>
                              <p className="text-sm font-bold text-gray-500 uppercase">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                      </div>
                  </div>

                  {/* TABLA RELACIÓN DETALLADA (MODO FORMAL, SIN SCROLL) */}
                  <div className="space-y-6">
                      <h3 className="text-[11px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-4">
                        <span className="w-16 h-[4px] bg-black"></span> 
                        RELACIÓN DETALLADA DE PRODUCTIVIDAD (INFORMATIVO)
                      </h3>
                      <div className="table-wrapper-print border-2 border-black">
                          <table className="w-full text-left text-[11px] border-collapse">
                              <thead className="bg-black text-white font-black uppercase tracking-widest">
                                  <tr>
                                      <th className="py-4 px-4 border-r border-white/10 w-[20%]">Bigo ID</th>
                                      <th className="py-4 px-2 text-center border-r border-white/10 w-[15%]">Horas</th>
                                      <th className="py-4 px-2 text-center border-r border-white/10 w-[15%]">Semillas</th>
                                      <th className="py-4 px-4 text-center border-r border-white/10 w-[25%]">Bono Meta ($)</th>
                                      <th className="py-4 px-4 text-right w-[25%]">Bono Horas ($)</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                  {filteredData.length > 0 ? filteredData.map(e => (
                                    <tr key={e.id} className="page-break-inside-avoid">
                                        <td className="py-4 px-4 font-black text-gray-900 border-r border-gray-100">
                                            <span className="uppercase tracking-tight">ID: {e.bigo_id}</span>
                                        </td>
                                        <td className="py-4 px-2 text-center border-r border-gray-100">
                                            <span className="font-black text-xs">{e.horas_mes || 0}</span>
                                        </td>
                                        <td className="py-4 px-2 text-center border-r border-gray-100">
                                            <span className="font-black text-xs">{(e.semillas_mes || 0).toLocaleString()}</span>
                                        </td>
                                        <td className="py-4 px-4 text-center border-r border-gray-100">
                                            <span className="font-black text-primary text-xs">${(e.pago_meta || 0).toFixed(2)}</span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <span className="font-black text-primary text-xs">${(e.pago_horas || 0).toFixed(2)}</span>
                                        </td>
                                    </tr>
                                  )) : (
                                      <tr><td colSpan={5} className="py-24 text-center text-gray-300 font-black uppercase tracking-[0.4em]">Sin registros detallados para este periodo.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  {/* FICHA INFORMATIVA DE RECIBO */}
                  <div className="receipt-box rounded-none border-[4px] border-black p-10 flex flex-row justify-between items-center gap-8 relative overflow-hidden page-break-inside-avoid">
                      <div className="space-y-8 flex-1">
                          <div className="space-y-2">
                            <p className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-4 border-b border-gray-100 pb-2">Recibí la cantidad de :</p>
                            <p className="text-5xl font-black text-black tracking-tighter leading-none">$ {stats.totalPayment.toFixed(2)} <span className="text-xl">USD</span></p>
                            <div className="pt-4 space-y-1">
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                    A fecha corte en el mes de : <span className="text-black">{selectedMonth}</span>
                                </p>
                                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                                    Por prestación de mis servicios como reclutador de agencia moon 
                                </p>
                            </div>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Transferencia vía canal de pago :</p>
                              <p className="text-lg font-black text-black uppercase border-b-4 border-black inline-block tracking-widest">{invoiceConfig.institucionPago || "PENDIENTE"}</p>
                          </div>
                      </div>
                      
                      {/* ÁREA DE FIRMA */}
                      <div className="text-right flex flex-col items-end min-w-[200px] border-l border-gray-100 pl-8">
                          <div className="pt-4 flex flex-col items-end">
                              <div className="mb-2">
                                  <p className="text-5xl font-signature font-normal text-black px-4 py-2">
                                      {invoiceConfig.signatureName || ''}
                                  </p>
                              </div>
                              <div className="w-48 h-[2px] bg-black mb-2"></div>
                              <p className="text-[9px] font-black text-black uppercase tracking-[0.4em] mb-1">Firma Autorizada</p>
                              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">{invoiceConfig.agenciaNombre}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* PIE DE PÁGINA */}
              <div className="bg-gray-50 py-10 text-center border-t border-gray-100 footer-print">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">
                    {invoiceConfig.agenciaNombre} — {new Date().getFullYear()} — DOCUMENTO DE LIQUIDACIÓN PRIVADO
                  </p>
              </div>
          </div>
      )}

      <style>{`
        /* --- ESTILOS DE IMPRESIÓN EXTREMOS --- */
        @media print {
          /* 1. Ocultar absolutamente todo lo que no sea la factura */
          html, body { height: auto !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; background: white !important; }
          #root > div > aside, 
          #root > div > div.fixed, 
          #root > div > div.md\\:hidden, 
          .print\\:hidden,
          .no-print { display: none !important; }

          /* 2. Ajustar el contenedor principal */
          #root > main { padding: 0 !important; margin: 0 !important; max-width: none !important; width: 100% !important; }
          .max-w-4xl { max-width: none !important; margin: 0 !important; }
          
          /* 3. Estilo de hoja A4 formal */
          #invoice-document {
            display: block !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            margin: 0 !important;
            border-radius: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }

          /* 4. Forzar fondos negros y colores */
          .bg-black { background-color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .text-white { color: white !important; -webkit-print-color-adjust: exact; }
          .text-primary { color: #7C3AED !important; -webkit-print-color-adjust: exact; }
          
          /* 5. Tabla formal (sin truncamientos) */
          table { width: 100% !important; border-collapse: collapse !important; border: 2px solid black !important; }
          th, td { border: 1px solid #ddd !important; }
          thead { display: table-header-group !important; }
          
          /* Evitar saltos de página a mitad de un bloque importante */
          .page-break-inside-avoid { page-break-inside: avoid !important; }
          
          @page {
            size: A4;
            margin: 0.5cm;
          }
        }
        
        /* Estilos UI para web */
        .invoice-container { transition: all 0.3s ease; }
      `}</style>
    </div>
  );
};

export default Factura;
