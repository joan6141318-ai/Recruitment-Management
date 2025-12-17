
import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor, InvoiceConfig } from '../types';
import { dataService } from '../services/db';
import { Edit3, Save, X, ChevronDown, Eye, EyeOff, AlertCircle, PlusCircle, DollarSign, Settings2, Users, Trash2, FileText, ChevronUp } from 'lucide-react';

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

  const handleUpdateEmisorDirect = async (id: string, field: string, value: string) => {
      if (user.rol !== 'admin') return;
      const numValue = Number(value);
      await dataService.updateEmisorData(id, { [field]: numValue }, user.id);
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
      const newMap = { ...(invoiceConfig.publishedInvoices || {}), [invoiceKey]: !invoiceConfig.publishedInvoices?.[invoiceKey] };
      const updatedConfig = { ...invoiceConfig, publishedInvoices: newMap };
      setInvoiceConfig(updatedConfig);
      await dataService.updateInvoiceConfig(updatedConfig);
  };

  if (loading || !invoiceConfig) return <div className="p-10 text-center text-gray-400 font-brand uppercase tracking-widest text-xs font-black">Sincronizando información...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-slide-up">
      
      {/* PANEL DE CONTROL ADMINISTRATIVO */}
      {user.rol === 'admin' && (
          <div className="space-y-4 no-print">
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="bg-black p-2 rounded-xl text-white shadow-lg">
                          <Settings2 size={20} />
                      </div>
                      <div>
                          <h3 className="font-black text-sm uppercase tracking-tight">Administración de Factura</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Ajustes y Visibilidad</p>
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
                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-4">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">Datos de Agencia</h4>
                          <input className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black outline-none shadow-sm" value={invoiceConfig.agenciaNombre} onChange={e => setInvoiceConfig({...invoiceConfig, agenciaNombre: e.target.value})} />
                          <textarea className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-medium h-20 outline-none shadow-sm" value={invoiceConfig.agenciaInfo} onChange={e => setInvoiceConfig({...invoiceConfig, agenciaInfo: e.target.value})} />
                      </div>

                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-4">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">Institución de Pago</h4>
                          <select className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black outline-none shadow-sm" value={invoiceConfig.institucionPago} onChange={e => setInvoiceConfig({...invoiceConfig, institucionPago: e.target.value})}>
                              {instituciones.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                          </select>
                      </div>

                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-4 md:col-span-2">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                             <DollarSign size={14} /> Ajustes Globales de Monto
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <input type="number" step="0.01" className="bg-white p-4 rounded-xl text-sm font-black outline-none" placeholder="Pago Total $" value={invoiceConfig.pagoAjustes?.[invoiceKey] || ''} onChange={(e) => handleUpdateGlobalAdjustment(e.target.value)} />
                            <input type="number" className="bg-white p-4 rounded-xl text-sm font-black outline-none" placeholder="Total Emisores" value={invoiceConfig.totalEmisoresAjustes?.[invoiceKey] || ''} onChange={(e) => handleUpdateTotalEmisoresAdjustment(e.target.value)} />
                          </div>
                          <button onClick={handleSaveConfig} className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm uppercase shadow-xl">Guardar Cambios</button>
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* FILTROS DE CONSULTA */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-primary uppercase ml-1 tracking-widest">Mes Facturado:</label>
                  <input type="month" className="w-full bg-gray-50 border-none p-4 rounded-2xl text-sm font-black outline-none shadow-sm" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
              </div>
              {user.rol === 'admin' && (
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-primary uppercase ml-1 tracking-widest">Reclutador:</label>
                      <select className="w-full bg-gray-50 border-none p-4 rounded-2xl text-sm font-black outline-none shadow-sm" value={targetRecruiterId} onChange={(e) => setTargetRecruiterId(e.target.value)}>
                        {reclutadores.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                  </div>
              )}
          </div>
      </div>

      {/* RENDERIZADO DE FACTURA */}
      {!isAvailableForView ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-200 shadow-sm animate-pop-in">
              <AlertCircle className="text-accent mx-auto mb-6" size={48} />
              <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Consulta No Disponible</h3>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                  Lo sentimos tu consulta no está dentro de el período de pago
              </p>
          </div>
      ) : (
          <div id="invoice-sheet" className="bg-white shadow-2xl overflow-hidden font-sans border border-gray-50">
              
              {/* ENCABEZADO FORMAL JERARQUIZADO */}
              <header className="bg-white border-b-8 border-black p-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-6">
                      <div className="bg-black p-4 rounded-3xl shadow-xl flex items-center justify-center shrink-0">
                        <img src="/icon.svg" className="w-14 h-14 object-contain grayscale brightness-200" alt="Moon" />
                      </div>
                      <div className="space-y-1">
                          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none font-brand text-black">{invoiceConfig.agenciaNombre}</h1>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] leading-tight max-w-sm">{invoiceConfig.agenciaInfo}</p>
                      </div>
                  </div>
                  
                  <div className="flex flex-col items-center md:items-end">
                      <div className="bg-black text-white px-8 py-3 rounded-2xl shadow-lg flex flex-col items-center md:items-end">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] mb-0.5">Folio Liquidación</p>
                          <p className="text-xl font-black tracking-[0.2em] font-brand">MOON-{selectedMonth.replace('-','')}</p>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Documento Certificado</span>
                      </div>
                  </div>
              </header>

              <main className="p-10 space-y-12">
                  
                  {/* METADATOS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 border-b border-gray-100 pb-10">
                      <div className="space-y-6">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Beneficiario Titular :</p>
                              <p className="text-3xl font-black text-black uppercase tracking-tighter border-l-8 border-black pl-5 leading-none">{selectedRecruiter?.nombre || '...'}</p>
                          </div>
                          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 inline-flex">
                              <Users size={18} className="text-black" />
                              <div className="pr-4">
                                  <p className="text-[9px] font-black text-gray-400 uppercase leading-none mb-1">Impacto Total</p>
                                  <p className="text-base font-black text-black leading-none">{stats.totalEmisores} Emisores</p>
                              </div>
                          </div>
                      </div>
                      <div className="flex flex-col items-center md:items-end text-center md:text-right space-y-8">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Periodo Correspondiente :</p>
                              <p className="text-xl font-black text-black uppercase tracking-[0.2em] bg-gray-100 px-6 py-1.5 rounded-full inline-block">{selectedMonth}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha Expedición :</p>
                              <p className="text-sm font-bold text-gray-500 uppercase">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                      </div>
                  </div>

                  {/* TABLA DE RELACIÓN DETALLADA (TARJETA GRIS COLAPSABLE) */}
                  <div className="bg-gray-100 border-[6px] border-white rounded-[2.5rem] shadow-xl overflow-hidden">
                      <div 
                          className="px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-gray-200/50 transition-colors"
                          onClick={() => setShowTableDetails(!showTableDetails)}
                      >
                          <div className="flex items-center gap-4">
                              <div className="bg-black text-white p-2 rounded-xl">
                                  <FileText size={18} />
                              </div>
                              <div>
                                  <h3 className="text-xs font-black text-black uppercase tracking-[0.3em]">Relación Detallada</h3>
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Historial de Productividad</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-primary uppercase bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm">
                                {showTableDetails ? 'Ocultar Detalles' : 'Ver Detalle'}
                              </span>
                              {showTableDetails ? <ChevronUp size={20} className="text-black" /> : <ChevronDown size={20} className="text-black" />}
                          </div>
                      </div>
                      
                      {showTableDetails && (
                          <div className="p-4 animate-slide-up">
                              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
                                  <table className="w-full text-left text-[11px] border-collapse">
                                      <thead className="bg-black text-white font-black uppercase tracking-widest">
                                          <tr>
                                              <th className="py-4 px-6 border-r border-white/10">Bigo ID</th>
                                              <th className="py-4 px-4 text-center border-r border-white/10">Horas</th>
                                              <th className="py-4 px-4 text-center border-r border-white/10">Semillas</th>
                                              <th className="py-4 px-6 text-right">Bono USD</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                          {filteredData.length > 0 ? filteredData.map(e => (
                                            <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 px-6 font-black text-gray-900 border-r border-gray-100 uppercase">ID: {e.bigo_id}</td>
                                                <td className="py-4 px-4 text-center border-r border-gray-100 font-bold">{e.horas_mes || 0}H</td>
                                                <td className="py-4 px-4 text-center border-r border-gray-100 font-bold">{(e.semillas_mes || 0).toLocaleString()}</td>
                                                <td className="py-4 px-6 text-right font-black text-black">
                                                    ${((e.pago_meta || 0) + (e.pago_horas || 0)).toFixed(2)}
                                                </td>
                                            </tr>
                                          )) : (
                                              <tr><td colSpan={4} className="py-12 text-center text-gray-300 font-black uppercase tracking-widest">No hay registros disponibles.</td></tr>
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* TARJETA DE PAGO FINAL (FONDO GRIS) */}
                  <div className="bg-gray-100 border-[6px] border-white rounded-[3rem] p-12 shadow-2xl flex flex-col items-center text-center gap-10 relative overflow-hidden">
                      <div className="space-y-6 max-w-2xl relative z-10">
                          <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.5em] border-b border-gray-200 pb-4 inline-block">Liquidación Total Recibida</p>
                          <div className="flex flex-col items-center">
                              <div className="flex items-baseline gap-3 whitespace-nowrap">
                                <span className="text-7xl font-black text-black tracking-tighter leading-none font-brand">$ {stats.totalPayment.toFixed(2)}</span>
                                <span className="text-3xl font-black text-primary tracking-widest">USD</span>
                              </div>
                              <div className="mt-8 space-y-3">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                                    Esta cantidad certifica la transferencia total por concepto de reclutamiento correspondiente al mes de <span className="text-black font-black">{selectedMonth}</span>.
                                </p>
                                <div className="pt-6 flex flex-col md:flex-row items-center justify-center gap-8 border-t border-gray-200">
                                    <div className="text-center md:text-left">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Medio de Pago</p>
                                        <p className="text-base font-black text-black uppercase tracking-[0.2em]">{invoiceConfig.institucionPago || "PENDIENTE"}</p>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200 hidden md:block"></div>
                                    <div className="text-center md:text-right">
                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Estado Transacción</p>
                                        <p className="text-base font-black text-green-600 uppercase tracking-[0.2em]">LIQUIDADO</p>
                                    </div>
                                </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </main>

              <footer className="py-12 text-center bg-white border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.6em]">
                    {invoiceConfig.agenciaNombre} — DOCUMENTO PRIVADO E INDEPENDIENTE
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
          .bg-black { background-color: #000 !important; -webkit-print-color-adjust: exact; }
          .border-white { border-color: #fff !important; }
          .font-brand { font-family: 'Outfit', sans-serif !important; }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default Factura;
