
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
      const newConfig = { ...invoiceConfig, pagoAjustes: { ...(invoiceConfig.pagoAjustes || {}), [invoiceKey]: amount } };
      setInvoiceConfig(newConfig);
  };

  const handleUpdateTotalEmisoresAdjustment = (val: string) => {
      if (!invoiceConfig) return;
      const total = parseInt(val) || 0;
      const newConfig = { ...invoiceConfig, totalEmisoresAjustes: { ...(invoiceConfig.totalEmisoresAjustes || {}), [invoiceKey]: total } };
      setInvoiceConfig(newConfig);
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

  if (loading || !invoiceConfig) return <div className="p-10 text-center text-gray-400 font-brand uppercase tracking-widest text-xs font-black">Sincronizando documento...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-slide-up print:m-0 print:p-0 print:max-w-none">
      
      {/* PANEL DE CONTROL (SOLO WEB) */}
      <div className="space-y-4 no-print">
          {user.rol === 'admin' && (
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="bg-black p-2 rounded-xl text-white">
                          <Settings2 size={20} />
                      </div>
                      <div>
                          <h3 className="font-black text-sm uppercase tracking-tight">Administración de Factura</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Configura montos y visibilidad</p>
                      </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={toggleInvoicePublication} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border shadow-sm ${invoiceConfig?.publishedInvoices?.[invoiceKey] ? 'bg-purple-600 border-purple-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                        {invoiceConfig?.publishedInvoices?.[invoiceKey] ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Privada</>}
                    </button>
                    <button onClick={() => setEditMode(!editMode)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center gap-2 ${editMode ? 'bg-orange-50 text-accent' : 'bg-gray-100 text-gray-600'}`}>
                        {editMode ? <><X size={14} /> Cerrar</> : <><Edit3 size={14} /> Editar</>}
                    </button>
                  </div>
              </div>
          )}

          {editMode && user.rol === 'admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pop-in">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><PenTool size={14}/> Identidad y Firma</h4>
                      <input className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold outline-none" placeholder="Nombre Agencia" value={invoiceConfig.agenciaNombre} onChange={e => setInvoiceConfig({...invoiceConfig, agenciaNombre: e.target.value})} />
                      <input className="w-full bg-gray-50 p-3 rounded-xl text-xs font-bold outline-none" placeholder="Nombre Autorizador" value={invoiceConfig.signatureName} onChange={e => setInvoiceConfig({...invoiceConfig, signatureName: e.target.value})} />
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><DollarSign size={14}/> Montos del Periodo</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" className="w-full bg-gray-50 p-3 rounded-xl text-xs font-black outline-none" placeholder="Pago Total $" value={invoiceConfig.pagoAjustes?.[invoiceKey] || ''} onChange={(e) => handleUpdateGlobalAdjustment(e.target.value)} />
                        <input type="number" className="w-full bg-gray-50 p-3 rounded-xl text-xs font-black outline-none" placeholder="Total Emisores" value={invoiceConfig.totalEmisoresAjustes?.[invoiceKey] || ''} onChange={(e) => handleUpdateTotalEmisoresAdjustment(e.target.value)} />
                      </div>
                      <button onClick={handleSaveConfig} className="w-full py-3 bg-black text-white rounded-xl font-black text-xs uppercase shadow-lg">Aplicar Ajustes</button>
                  </div>
              </div>
          )}

          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-primary uppercase ml-1 tracking-widest">Periodo:</label>
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
                <button onClick={handlePrint} className="w-full bg-black text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-sm shadow-xl active:scale-95 transition-all">
                    <Download size={18} /> Generar Documento PDF
                </button>
              )}
          </div>
      </div>

      {/* DOCUMENTO DE FACTURA */}
      {!isAvailableForDownload ? (
          <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-gray-200 shadow-sm animate-pop-in no-print">
              <AlertCircle className="text-accent mx-auto mb-6" size={48} />
              <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Acceso Restringido</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                  Lo sentimos tu consulta no está dentro de el período de pago
              </p>
          </div>
      ) : (
          <div id="invoice-sheet" className="invoice-sheet bg-white text-black overflow-visible font-sans">
              
              {/* HEADER FORMAL */}
              <header className="header-official bg-black text-white p-12 flex justify-between items-start">
                  <div className="space-y-4">
                      <h1 className="text-5xl font-black tracking-tighter uppercase leading-none font-brand">{invoiceConfig.agenciaNombre}</h1>
                      <div className="w-20 h-2 bg-white rounded-full"></div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] leading-relaxed max-w-sm">{invoiceConfig.agenciaInfo}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                      <div className="bg-white p-3 rounded-2xl mb-6 shadow-xl">
                        <img src="/icon.svg" className="w-16 h-16 object-contain" alt="Logo" />
                      </div>
                      <div className="border border-white/20 px-6 py-3 rounded-xl bg-white/5">
                          <p className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">Folio de Liquidación</p>
                          <p className="text-lg font-black tracking-[0.2em] font-brand">#MOON-{selectedMonth.replace('-','')}</p>
                      </div>
                  </div>
              </header>

              <main className="p-12 space-y-16">
                  
                  {/* METADATOS */}
                  <section className="grid grid-cols-2 gap-16 border-b-4 border-black pb-12">
                      <div className="space-y-8">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Reclutador Beneficiario</p>
                              <p className="text-3xl font-black text-black uppercase tracking-tighter border-l-8 border-black pl-6">{selectedRecruiter?.nombre || '...'}</p>
                          </div>
                          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                              <Users size={20} className="text-black" />
                              <div>
                                  <p className="text-[9px] font-black text-gray-400 uppercase">Emisores Impactados</p>
                                  <p className="text-lg font-black text-black">{stats.totalEmisores} PERSONAS</p>
                              </div>
                          </div>
                      </div>
                      <div className="space-y-8 text-right flex flex-col items-end">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Periodo de Servicios</p>
                              <p className="text-2xl font-black text-black uppercase tracking-widest font-brand">{selectedMonth}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha de Expedición</p>
                              <p className="text-sm font-bold text-gray-600 uppercase">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                      </div>
                  </section>

                  {/* TABLA DE DETALLES */}
                  <section className="space-y-8">
                      <div className="flex items-center gap-6">
                        <h3 className="text-[12px] font-black text-black uppercase tracking-[0.4em]">Relación Detallada de Actividades</h3>
                        <div className="h-1 flex-1 bg-black"></div>
                      </div>
                      
                      <div className="border-4 border-black overflow-hidden">
                          <table className="w-full text-left text-[12px] border-collapse">
                              <thead className="bg-black text-white font-black uppercase tracking-widest">
                                  <tr>
                                      <th className="py-5 px-6 border-r border-white/20">Identificador Bigo</th>
                                      <th className="py-5 px-4 text-center border-r border-white/20">Horas Mes</th>
                                      <th className="py-5 px-4 text-center border-r border-white/20">Semillas Mes</th>
                                      <th className="py-5 px-6 text-right">Bonificación USD</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y-2 divide-gray-100">
                                  {filteredData.length > 0 ? filteredData.map(e => (
                                    <tr key={e.id} className="page-break-avoid">
                                        <td className="py-5 px-6 font-black text-gray-900 border-r border-gray-100 uppercase tracking-tight">ID: {e.bigo_id}</td>
                                        <td className="py-5 px-4 text-center border-r border-gray-100 font-bold">{e.horas_mes || 0}H</td>
                                        <td className="py-5 px-4 text-center border-r border-gray-100 font-bold">{(e.semillas_mes || 0).toLocaleString()}</td>
                                        <td className="py-5 px-6 text-right font-black text-black">
                                            ${((e.pago_meta || 0) + (e.pago_horas || 0)).toFixed(2)}
                                        </td>
                                    </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="py-16 text-center text-gray-300 font-black uppercase tracking-widest">No se registran actividades para este periodo.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </section>

                  {/* COMPROBANTE DE PAGO */}
                  <section className="bg-black text-white p-12 border-l-[16px] border-primary flex justify-between items-center relative overflow-hidden page-break-avoid">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                      <div className="space-y-10 flex-1 relative z-10">
                          <div className="space-y-4">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 border-b border-white/10 pb-2">Resumen Final de Liquidación</p>
                            <div className="flex items-baseline gap-4">
                                <span className="text-[12px] font-black text-gray-400 uppercase">RECIBÍ:</span>
                                <p className="text-7xl font-black tracking-tighter leading-none font-brand">$ {stats.totalPayment.toFixed(2)} <span className="text-2xl font-bold">USD</span></p>
                            </div>
                            <div className="pt-6 space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Corresponde a la liquidación del periodo <span className="text-white font-black">{selectedMonth}</span>
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                                    Liquidación por servicios profesionales de reclutamiento y gestión operativa.
                                </p>
                            </div>
                          </div>
                          <div>
                              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Método de Dispersión</p>
                              <p className="text-xl font-black text-white uppercase border-b-2 border-primary inline-block tracking-[0.2em]">{invoiceConfig.institucionPago || "PENDIENTE"}</p>
                          </div>
                      </div>
                      
                      {/* FIRMA */}
                      <div className="text-right flex flex-col items-end min-w-[300px] relative z-10">
                          <div className="pt-10 flex flex-col items-center md:items-end">
                              <p className="text-6xl font-signature font-normal text-white px-8 py-2 mb-2 animate-pop-in">
                                  {invoiceConfig.signatureName || ''}
                              </p>
                              <div className="w-64 h-1 bg-white mb-3"></div>
                              <p className="text-[10px] font-black text-white uppercase tracking-[0.5em] mb-1">Firma Autorizada</p>
                              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em]">{invoiceConfig.agenciaNombre} Management</p>
                          </div>
                      </div>
                  </section>

              </main>

              <footer className="py-12 text-center border-t-2 border-gray-100 bg-gray-50/50">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.6em]">
                    {invoiceConfig.agenciaNombre} — {new Date().getFullYear()} — DOCUMENTO OFICIAL PRIVADO
                  </p>
              </footer>
          </div>
      )}

      <style>{`
        /* --- ESTILOS DE IMPRESIÓN MAESTROS --- */
        @media print {
          /* 1. Limpieza absoluta de la interfaz */
          html, body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Ocultar elementos de UI */
          #root > div > aside, 
          #root > div > div.fixed, 
          #root > div > div.md\\:hidden, 
          .no-print,
          .print\\:hidden { display: none !important; }

          /* 2. Ajuste del lienzo de impresión */
          #root > main { padding: 0 !important; margin: 0 !important; max-width: none !important; width: 100% !important; }
          .max-w-4xl { max-width: none !important; margin: 0 !important; }
          
          /* 3. Estilo de Hoja A4 Rigurosa */
          #invoice-sheet {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }

          /* 4. Forzar colores y fondos */
          .bg-black { background-color: #000000 !important; color: #FFFFFF !important; }
          .bg-primary { background-color: #7C3AED !important; }
          .text-white { color: #FFFFFF !important; }
          .text-gray-400 { color: #9CA3AF !important; }
          .text-gray-500 { color: #6B7280 !important; }
          .border-black { border-color: #000000 !important; }
          
          /* 5. Estructura de Tabla Formal */
          table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            table-layout: fixed !important;
            border: 2px solid #000000 !important;
          }
          th, td { 
            border: 1px solid #EEEEEE !important; 
            padding: 12px 15px !important;
            word-wrap: break-word !important;
          }
          thead { display: table-header-group !important; background-color: #000000 !important; }
          tr { page-break-inside: avoid !important; }
          
          /* 6. Bloques Inquebrantables */
          .page-break-avoid { page-break-inside: avoid !important; }
          
          /* Proporción Logo */
          img { max-width: 80px !important; height: auto !important; }

          @page {
            size: A4;
            margin: 0;
          }
        }
        
        .invoice-sheet { transition: opacity 0.3s ease; }
      `}</style>
    </div>
  );
};

export default Factura;
