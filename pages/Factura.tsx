
import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor, InvoiceConfig } from '../types';
import { dataService } from '../services/db';
import { Download, Edit3, Save, X, ChevronDown, Eye, EyeOff, AlertCircle, Settings2, Users, DollarSign, PenTool } from 'lucide-react';

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

  const handleUpdateGlobalAdjustment = (val: string) => {
      if (!invoiceConfig) return;
      const amount = Number(val) || 0;
      setInvoiceConfig({ ...invoiceConfig, pagoAjustes: { ...(invoiceConfig.pagoAjustes || {}), [invoiceKey]: amount } });
  };

  const handleUpdateTotalEmisoresAdjustment = (val: string) => {
      if (!invoiceConfig) return;
      const total = parseInt(val) || 0;
      setInvoiceConfig({ ...invoiceConfig, totalEmisoresAjustes: { ...(invoiceConfig.totalEmisoresAjustes || {}), [invoiceKey]: total } });
  };

  const handleSaveConfig = async () => {
      if (invoiceConfig) {
          await dataService.updateInvoiceConfig(invoiceConfig);
          setEditMode(false);
      }
  };

  const toggleInvoicePublication = async () => {
      if (!invoiceConfig) return;
      const newMap = { ...(invoiceConfig.publishedInvoices || {}), [invoiceKey]: !invoiceConfig.publishedInvoices?.[invoiceKey] };
      const updatedConfig = { ...invoiceConfig, publishedInvoices: newMap };
      setInvoiceConfig(updatedConfig);
      await dataService.updateInvoiceConfig(updatedConfig);
  };

  const handlePrint = () => { window.print(); };

  if (loading || !invoiceConfig) return <div className="p-10 text-center text-gray-400 font-brand uppercase tracking-widest text-xs font-black">Sincronizando factura...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-slide-up print:m-0 print:p-0 print:max-w-none">
      
      {/* PANEL ADMINISTRATIVO (NO IMPRIMIBLE) */}
      {user.rol === 'admin' && (
          <div className="space-y-4 print:hidden">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="bg-black p-2 rounded-xl text-white shadow-lg">
                          <Settings2 size={20} />
                      </div>
                      <div>
                          <h3 className="font-black text-sm uppercase tracking-tight">Administración de Liquidación</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Controles de publicación y montos</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={toggleInvoicePublication} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border shadow-sm ${invoiceConfig?.publishedInvoices?.[invoiceKey] ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                        {invoiceConfig?.publishedInvoices?.[invoiceKey] ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Oculta</>}
                    </button>
                    <button onClick={() => setEditMode(!editMode)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 ${editMode ? 'bg-orange-50 text-accent' : 'bg-gray-100 text-gray-600'}`}>
                        {editMode ? <><X size={14} /> Cerrar</> : <><Edit3 size={14} /> Editar</>}
                    </button>
                  </div>
              </div>

              {editMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pop-in">
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><PenTool size={14} /> Firma y Datos</h4>
                          <input className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold outline-none" placeholder="Nombre Agencia" value={invoiceConfig.agenciaNombre} onChange={e => setInvoiceConfig({...invoiceConfig, agenciaNombre: e.target.value})} />
                          <input className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold outline-none" placeholder="Nombre Firma Formal" value={invoiceConfig.signatureName} onChange={e => setInvoiceConfig({...invoiceConfig, signatureName: e.target.value})} />
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><DollarSign size={14} /> Ajustes de Pago</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" className="w-full bg-gray-50 p-3 rounded-xl text-xs font-black outline-none" placeholder="Total USD" value={invoiceConfig.pagoAjustes?.[invoiceKey] || ''} onChange={(e) => handleUpdateGlobalAdjustment(e.target.value)} />
                            <input type="number" className="w-full bg-gray-50 p-3 rounded-xl text-xs font-black outline-none" placeholder="Cant. Emisores" value={invoiceConfig.totalEmisoresAjustes?.[invoiceKey] || ''} onChange={(e) => handleUpdateTotalEmisoresAdjustment(e.target.value)} />
                          </div>
                          <button onClick={handleSaveConfig} className="w-full py-3 bg-black text-white rounded-xl font-black text-xs uppercase shadow-lg">Guardar Ajustes</button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* FILTROS (NO IMPRIMIBLE) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-primary uppercase ml-1 tracking-widest">Mes de Facturación:</label>
                  <input type="month" className="w-full bg-gray-50 border-none p-3.5 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-primary shadow-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
              {user.rol === 'admin' && (
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-primary uppercase ml-1 tracking-widest">Reclutador:</label>
                      <select className="w-full bg-gray-50 border-none p-3.5 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-primary shadow-sm" value={targetRecruiterId} onChange={(e) => setTargetRecruiterId(e.target.value)}>
                        {reclutadores.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                  </div>
              )}
          </div>
          {isAvailableForDownload && (
            <button onClick={handlePrint} className="w-full bg-black text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl transition-all hover:bg-gray-900 active:scale-95">
                <Download size={18} /> Descargar Factura Formal (PDF)
            </button>
          )}
      </div>

      {/* VISTA DE DOCUMENTO */}
      {!isAvailableForDownload ? (
          <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-gray-200 shadow-sm animate-pop-in print:hidden">
              <AlertCircle className="text-accent mx-auto mb-6" size={48} />
              <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Consulta No Disponible</h3>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                  Lo sentimos tu consulta no está dentro de el período de pago
              </p>
          </div>
      ) : (
          <div id="invoice-render" className="bg-white border border-gray-100 shadow-2xl rounded-[3rem] overflow-hidden print:rounded-none print:shadow-none print:border-none print:m-0">
              
              {/* HEADER DISEÑO APP */}
              <div className="bg-black text-white p-12 flex justify-between items-start print:bg-black print:p-10">
                  <div className="space-y-6">
                      <h1 className="text-4xl font-black tracking-tighter uppercase leading-none font-brand border-b-4 border-white pb-2 inline-block print:text-5xl">{invoiceConfig.agenciaNombre}</h1>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed max-w-sm">{invoiceConfig.agenciaInfo}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                      <div className="bg-white p-2 rounded-2xl mb-4 shadow-xl print:bg-white print:p-2">
                        <img src="/icon.svg" className="w-16 h-16 object-contain" alt="Logo" />
                      </div>
                      <div className="bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                          <p className="text-[9px] font-black text-gray-500 uppercase mb-0.5 tracking-widest">Folio de Liquidación</p>
                          <p className="text-sm font-black tracking-[0.2em]">#MOON-{selectedMonth.replace('-','')}</p>
                      </div>
                  </div>
              </div>

              <div className="p-12 space-y-12 bg-white print:p-10 print:space-y-14">
                  
                  {/* METADATOS */}
                  <div className="grid grid-cols-2 gap-12 border-b-2 border-gray-100 pb-12 print:pb-10">
                      <div className="space-y-8">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reclutador Beneficiario :</p>
                              <p className="text-2xl font-black text-gray-900 border-l-8 border-black pl-4 uppercase tracking-tighter print:text-3xl">{selectedRecruiter?.nombre || '...'}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Emisores en Periodo :</p>
                              <div className="flex items-center gap-3">
                                  <Users size={16} className="text-black" />
                                  <p className="text-lg font-black text-black">{stats.totalEmisores} Personas</p>
                              </div>
                          </div>
                      </div>
                      <div className="space-y-8 flex flex-col items-end text-right">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Periodo Correspondiente :</p>
                              <p className="text-lg font-black text-black uppercase tracking-widest print:text-xl">{selectedMonth}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fecha de Emisión :</p>
                              <p className="text-sm font-bold text-gray-500 uppercase">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                      </div>
                  </div>

                  {/* TABLA DE DETALLES */}
                  <div className="space-y-6">
                      <h3 className="text-[11px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-4">
                        <span className="w-16 h-[4px] bg-black"></span> 
                        RELACIÓN DETALLADA DE PRODUCTIVIDAD
                      </h3>
                      <div className="overflow-hidden border-2 border-black rounded-3xl print:rounded-none">
                          <table className="w-full text-left text-[11px] border-collapse">
                              <thead className="bg-black text-white font-black uppercase tracking-widest">
                                  <tr>
                                      <th className="py-5 px-6 border-r border-white/10 w-[25%] print:py-4">Bigo ID</th>
                                      <th className="py-5 px-4 text-center border-r border-white/10 w-[20%] print:py-4">Horas</th>
                                      <th className="py-5 px-4 text-center border-r border-white/10 w-[25%] print:py-4">Semillas</th>
                                      <th className="py-5 px-6 text-right w-[30%] print:py-4">Bonificación USD</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                  {filteredData.length > 0 ? filteredData.map(e => (
                                    <tr key={e.id} className="print:break-inside-avoid">
                                        <td className="py-5 px-6 font-black text-gray-900 border-r border-gray-100 uppercase print:py-4">ID: {e.bigo_id}</td>
                                        <td className="py-5 px-4 text-center border-r border-gray-100 font-bold print:py-4">{e.horas_mes || 0}H</td>
                                        <td className="py-5 px-4 text-center border-r border-gray-100 font-bold print:py-4">{(e.semillas_mes || 0).toLocaleString()}</td>
                                        <td className="py-5 px-6 text-right font-black text-black print:py-4">
                                            ${((e.pago_meta || 0) + (e.pago_horas || 0)).toFixed(2)}
                                        </td>
                                    </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="py-20 text-center text-gray-300 font-black uppercase tracking-widest">Sin registros detallados en este periodo.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>

                  {/* COMPROBANTE FINAL */}
                  <div className="bg-black text-white p-12 rounded-[3rem] border-l-[16px] border-primary flex justify-between items-center relative overflow-hidden print:rounded-none print:border-l-[12px] print:p-10">
                      <div className="space-y-10 flex-1 relative z-10">
                          <div className="space-y-4">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 border-b border-white/10 pb-2">Comprobante de Liquidación</p>
                            <div className="flex items-baseline gap-4">
                                <span className="text-[12px] font-black text-gray-400 uppercase">Total Recibido:</span>
                                <p className="text-6xl font-black tracking-tighter leading-none font-brand print:text-7xl">$ {stats.totalPayment.toFixed(2)} <span className="text-2xl font-bold">USD</span></p>
                            </div>
                            <div className="pt-6 space-y-1">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    Correspondiente a liquidación del periodo <span className="text-white">{selectedMonth}</span>
                                </p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                    Servicios profesionales de reclutamiento y gestión operativa para Agencia Moon.
                                </p>
                            </div>
                          </div>
                      </div>
                      
                      {/* FIRMA (MODO FORMAL) */}
                      <div className="text-right flex flex-col items-end min-w-[300px] relative z-10 print:min-w-[250px]">
                          <div className="pt-10 flex flex-col items-center md:items-end">
                              <p className="text-3xl font-brand font-black text-white px-8 py-2 mb-2 tracking-tighter uppercase print:text-4xl">
                                  {invoiceConfig.signatureName || 'AUTORIZADO'}
                              </p>
                              <div className="w-64 h-1 bg-white mb-3 print:w-56"></div>
                              <p className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-1">Firma Autorizada</p>
                              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">{invoiceConfig.agenciaNombre} Management</p>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-gray-50 py-12 text-center border-t border-gray-100 print:bg-white print:py-8">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.6em]">
                    {invoiceConfig.agenciaNombre} — {new Date().getFullYear()} — DOCUMENTO OFICIAL PRIVADO
                  </p>
              </div>
          </div>
      )}

      <style>{`
        @media print {
          /* 1. RESET GLOBAL DE IMPRESIÓN */
          @page {
            size: A4;
            margin: 0;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* 2. OCULTAR UI NO DESEADA */
          .no-print,
          aside,
          header.md\\:hidden,
          div.fixed.bottom-0,
          div.print\\:hidden,
          .print\\:hidden {
            display: none !important;
          }

          /* 3. AJUSTE DE CONTENEDOR PRINCIPAL */
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }

          #root > div { display: block !important; }
          .max-w-4xl { max-width: none !important; width: 100% !important; margin: 0 !important; }

          /* 4. FORMATEO DEL DOCUMENTO RENDERIZADO */
          #invoice-render {
            display: block !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          /* Forzar fondos en Chrome/Safari */
          .bg-black { background-color: #000000 !important; }
          .bg-white { background-color: #FFFFFF !important; }
          .bg-gray-50 { background-color: #F9FAFB !important; }
          .text-white { color: #FFFFFF !important; }
          .text-black { color: #000000 !important; }
          .bg-primary { background-color: #7C3AED !important; }

          /* 5. TABLA FORMAL SIN CORTES */
          table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            border: 2px solid #000 !important; 
            table-layout: fixed !important;
          }
          th, td { 
            border: 1px solid #000 !important; 
            padding: 12px !important;
            word-wrap: break-word !important;
          }
          thead { display: table-header-group !important; }
          tr { page-break-inside: avoid !important; }

          /* 6. LOGO Y FIRMA */
          img { max-width: 70px !important; height: auto !important; }
          .font-brand { font-family: 'Outfit', sans-serif !important; }
        }
      `}</style>
    </div>
  );
};

export default Factura;
