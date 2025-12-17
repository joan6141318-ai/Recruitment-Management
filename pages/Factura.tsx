
import React, { useState, useEffect, useMemo } from 'react';
import { User, Emisor, InvoiceConfig } from '../types';
import { dataService } from '../services/db';
import { Edit3, Save, X, ChevronDown, Eye, EyeOff, AlertCircle, PlusCircle, DollarSign, Settings2, Users, Trash2, ShieldCheck } from 'lucide-react';

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

  if (loading || !invoiceConfig) return <div className="p-10 text-center text-gray-400 font-brand uppercase tracking-widest text-xs font-black">Sincronizando factura...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-slide-up print:m-0 print:p-0 print:max-w-none">
      
      {/* PANEL ADMINISTRATIVO (NO PRINT) */}
      {user.rol === 'admin' && (
          <div className="space-y-4 no-print">
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
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest">Canal de Pago Oficial</h4>
                          <div className="space-y-4">
                            <div className="relative">
                                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Entidad:</label>
                                <select className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-bold outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary shadow-sm" value={invoiceConfig.institucionPago} onChange={e => setInvoiceConfig({...invoiceConfig, institucionPago: e.target.value})}>
                                    {instituciones.map(inst => <option key={inst} value={inst}>{inst}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none mt-2" size={16} />
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
                                          placeholder="Monto final..."
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

                      <div className="bg-gray-100 p-6 rounded-3xl border-2 border-white shadow-sm space-y-5 md:col-span-2">
                          <h4 className="text-[11px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                             <PlusCircle size={14} /> Agregar Registro Manual
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-primary uppercase tracking-tighter">Bigo ID:</label>
                                  <input className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary shadow-sm" value={manualId} placeholder="ID..." onChange={e => setManualId(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-primary uppercase tracking-tighter">Horas:</label>
                                  <input type="number" className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary shadow-sm" value={manualHours} placeholder="0" onChange={e => setManualHours(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-primary uppercase tracking-tighter">Semillas:</label>
                                  <input type="number" className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-primary shadow-sm" value={manualSeeds} placeholder="0" onChange={e => setManualSeeds(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-primary uppercase tracking-tighter">Bono Meta ($):</label>
                                  <input type="number" className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black text-primary outline-none focus:ring-2 focus:ring-primary shadow-sm" value={manualPagoMeta} placeholder="0.00" onChange={e => setManualPagoMeta(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-primary uppercase tracking-tighter">Bono Horas ($):</label>
                                  <input type="number" className="w-full bg-white border border-gray-200 p-3 rounded-xl text-xs font-black text-primary outline-none focus:ring-2 focus:ring-primary shadow-sm" value={manualPagoHoras} placeholder="0.00" onChange={e => setManualPagoHoras(e.target.value)} />
                              </div>
                          </div>
                          <button onClick={handleSaveManualEntry} disabled={!manualId || isSavingManual} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-purple-100 hover:bg-purple-700 disabled:bg-gray-200 transition-all flex items-center justify-center gap-2">
                              {isSavingManual ? 'Guardando...' : <><Save size={16} /> Guardar Registro</>}
                          </button>
                      </div>

                      <button onClick={handleSaveConfig} className="md:col-span-2 py-4 bg-black text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-all">
                          <Save size={18} /> Aplicar Cambios
                      </button>
                  </div>
              )}
          </div>
      )}

      {/* FILTROS (NO PRINT) */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4 no-print">
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
      </div>

      {/* RENDERIZADO DE FACTURA PROFESIONAL */}
      {!isAvailableForView ? (
          <div className="bg-white rounded-[2.5rem] p-24 text-center border-2 border-dashed border-gray-200 shadow-sm animate-pop-in no-print">
              <AlertCircle className="text-accent mx-auto mb-6" size={48} />
              <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Acceso No Autorizado</h3>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-relaxed max-w-sm mx-auto">
                  Lo sentimos tu consulta no está dentro de el período de pago
              </p>
          </div>
      ) : (
          <div id="invoice-sheet" className="bg-white shadow-2xl overflow-hidden print:shadow-none print:m-0 font-sans border border-gray-100 print:border-none">
              
              {/* ENCABEZADO OFICIAL JERARQUIZADO */}
              <header className="bg-black text-white p-12 flex justify-between items-center relative print:p-8">
                  <div className="flex items-center gap-8 relative z-10">
                      <div className="bg-white p-4 rounded-3xl shadow-2xl flex items-center justify-center">
                        <img src="/icon.svg" className="w-16 h-16 object-contain" alt="Logo Moon" />
                      </div>
                      <div className="space-y-2">
                          <h1 className="text-5xl font-black tracking-tighter uppercase leading-none font-brand print:text-4xl">{invoiceConfig.agenciaNombre}</h1>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] leading-relaxed max-w-sm">{invoiceConfig.agenciaInfo}</p>
                      </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-3 relative z-10">
                      <div className="bg-white/10 px-6 py-4 rounded-2xl border border-white/10 backdrop-blur-md">
                          <p className="text-[9px] font-black text-gray-500 uppercase mb-1 tracking-widest">Folio del Documento</p>
                          <p className="text-2xl font-black tracking-[0.2em] font-brand">#MOON-{selectedMonth.replace('-','')}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                          <ShieldCheck size={14} className="text-primary" />
                          <span>Emisión Certificada</span>
                      </div>
                  </div>
              </header>

              <main className="p-12 space-y-16 print:p-8 print:space-y-10">
                  
                  {/* METADATOS DE LIQUIDACIÓN */}
                  <section className="grid grid-cols-2 gap-16 border-b-4 border-black pb-12 print:pb-8">
                      <div className="space-y-10">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Beneficiario Titular</p>
                              <p className="text-4xl font-black text-black uppercase tracking-tighter border-l-8 border-black pl-6 print:text-3xl">{selectedRecruiter?.nombre || '...'}</p>
                          </div>
                          <div className="flex items-center gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                              <Users size={20} className="text-black" />
                              <div>
                                  <p className="text-[9px] font-black text-gray-400 uppercase">Impacto Operativo</p>
                                  <p className="text-lg font-black text-black">{stats.totalEmisores} EMISORES GESTIONADOS</p>
                              </div>
                          </div>
                      </div>
                      <div className="space-y-10 text-right flex flex-col items-end">
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Periodo Liquidado</p>
                              <p className="text-3xl font-black text-black uppercase tracking-widest font-brand print:text-2xl">{selectedMonth}</p>
                          </div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha de Expedición</p>
                              <p className="text-sm font-bold text-gray-600 uppercase">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                          </div>
                      </div>
                  </section>

                  {/* TABLA DE PRODUCTIVIDAD */}
                  <section className="space-y-8 print:space-y-6">
                      <div className="flex items-center gap-6">
                        <h3 className="text-[12px] font-black text-black uppercase tracking-[0.4em]">Detalle Global de Actividades</h3>
                        <div className="h-1 flex-1 bg-black"></div>
                      </div>
                      
                      <div className="border-4 border-black overflow-hidden rounded-[2rem] print:rounded-none">
                          <table className="w-full text-left text-[12px] border-collapse">
                              <thead className="bg-black text-white font-black uppercase tracking-widest">
                                  <tr>
                                      <th className="py-6 px-8 border-r border-white/10 print:py-4">Identificador</th>
                                      <th className="py-6 px-4 text-center border-r border-white/10 print:py-4">Horas</th>
                                      <th className="py-6 px-4 text-center border-r border-white/10 print:py-4">Semillas</th>
                                      <th className="py-6 px-8 text-right print:py-4">Bonificación USD</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {filteredData.length > 0 ? filteredData.map(e => (
                                    <tr key={e.id} className="page-break-avoid">
                                        <td className="py-5 px-8 font-black text-gray-900 border-r border-gray-100 uppercase tracking-tight print:py-3">ID: {e.bigo_id}</td>
                                        <td className="py-5 px-4 text-center border-r border-gray-100 font-bold print:py-3">{e.horas_mes || 0}H</td>
                                        <td className="py-5 px-4 text-center border-r border-gray-100 font-bold print:py-3">{(e.semillas_mes || 0).toLocaleString()}</td>
                                        <td className="py-5 px-8 text-right font-black text-black print:py-3">
                                            ${((e.pago_meta || 0) + (e.pago_horas || 0)).toFixed(2)}
                                        </td>
                                    </tr>
                                  )) : (
                                      <tr><td colSpan={4} className="py-24 text-center text-gray-300 font-black uppercase tracking-widest">Sin registros para el periodo seleccionado.</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </section>

                  {/* RESUMEN FINAL DE PAGO (SIN FIRMA) */}
                  <section className="bg-black text-white p-14 border-l-[20px] border-primary flex flex-col items-center text-center gap-10 relative overflow-hidden page-break-avoid print:p-10 print:border-l-[12px]">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40"></div>
                      <div className="space-y-8 relative z-10 max-w-2xl">
                          <div className="space-y-4">
                            <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.5em] mb-4 border-b border-white/10 pb-4">Liquidación Final Certificada</p>
                            <div className="flex flex-col items-center">
                                <p className="text-8xl font-black tracking-tighter leading-none font-brand print:text-7xl">$ {stats.totalPayment.toFixed(2)} <span className="text-3xl font-bold">USD</span></p>
                            </div>
                            <div className="pt-8 space-y-3">
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                    Monto total liquidado correspondiente al mes de <span className="text-white font-black">{selectedMonth}</span>
                                </p>
                                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest leading-relaxed">
                                    Documento privado generado automáticamente por el sistema de gestión de Agencia Moon. 
                                    Este comprobante valida la transferencia de bonificaciones por servicios profesionales de reclutamiento.
                                </p>
                            </div>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-20 w-full pt-12 border-t border-white/10 relative z-10">
                          <div className="text-left">
                              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Medio de Dispersión Oficial</p>
                              <p className="text-2xl font-black text-white uppercase border-b-4 border-primary inline-block tracking-[0.2em]">{invoiceConfig.institucionPago || "PENDIENTE"}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Estatus Administrativo</p>
                              <p className="text-2xl font-black text-green-400 uppercase tracking-[0.2em]">PROCESADO</p>
                          </div>
                      </div>
                  </section>

              </main>

              <footer className="py-12 text-center border-t border-gray-100 bg-gray-50/50 print:py-8">
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.6em]">
                    {invoiceConfig.agenciaNombre} — {new Date().getFullYear()} — DOCUMENTO OFICIAL PRIVADO
                  </p>
              </footer>
          </div>
      )}

      <style>{`
        @media print {
          html, body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .no-print { display: none !important; }

          #root > div > main { padding: 0 !important; margin: 0 !important; max-width: none !important; width: 100% !important; }
          .max-w-4xl { max-width: none !important; margin: 0 !important; }
          
          #invoice-sheet {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          table { width: 100% !important; border: 3px solid #000 !important; }
          th, td { border: 1px solid #EEE !important; }
          thead { background-color: #000 !important; color: #FFF !important; }
          
          .page-break-avoid { page-break-inside: avoid !important; }
          
          @page { size: A4 portrait; margin: 1cm; }
        }
      `}</style>
    </div>
  );
};

export default Factura;
