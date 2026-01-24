
import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, MapPin, Calendar, Clock, Edit3, X, User as UserIcon, AlertTriangle, CheckCircle, Trophy, FilterX, Trash2, Globe, Shield, Lock, Activity, Coins, Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface EmisoresProps {
  user: User;
}

const Emisores: React.FC<EmisoresProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [filtered, setFiltered] = useState<Emisor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // URL Params para filtros de Admin
  const [searchParams, setSearchParams] = useSearchParams();
  const filterRecruiterId = searchParams.get('reclutador');
  const filterRecruiterName = searchParams.get('nombre');

  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWarning, setShowWarning] = useState(false); 
  const [showDetailModal, setShowDetailModal] = useState(false); 
  const [isEditingMode, setIsEditingMode] = useState(false); 
  
  // Validation States
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);

  const [selectedEmisor, setSelectedEmisor] = useState<Emisor | null>(null);
  
  // Forms Data - ADD
  const [newEmisorName, setNewEmisorName] = useState('');
  const [newEmisorBigo, setNewEmisorBigo] = useState('');
  const [newEmisorCountry, setNewEmisorCountry] = useState('');
  const [newEmisorMonth, setNewEmisorMonth] = useState('');
  const [isShared, setIsShared] = useState(false); 

  // Forms Data - EDIT
  const [editName, setEditName] = useState('');
  const [editBigo, setEditBigo] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editMonth, setEditMonth] = useState('');
  const [editHours, setEditHours] = useState<string | number>('');
  const [editSeeds, setEditSeeds] = useState<string | number>('');

  const isAdmin = user.rol === 'admin';

  useEffect(() => { loadData(); }, [user, filterRecruiterId]);

  useEffect(() => {
    let result = emisores;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(e => e.nombre.toLowerCase().includes(lower) || e.bigo_id.toLowerCase().includes(lower));
    }
    setFiltered(result);
  }, [searchTerm, emisores]);

  const loadData = async () => {
    setLoading(true);
    const targetId = (isAdmin && filterRecruiterId) ? filterRecruiterId : undefined;
    const data = await dataService.getEmisores(user, targetId);
    setEmisores(data);
    setLoading(false);
  };

  // Función que inicia el proceso de guardado validando duplicados
  const handleAddInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateError(false);
    setIsChecking(true);

    try {
        const exists = await dataService.checkEmisorExists(newEmisorBigo);
        if (exists) {
            setDuplicateError(true);
            setIsChecking(false);
            return;
        }
        setShowWarning(true);
    } catch (err) {
        console.error("Error validando ID:", err);
    } finally {
        setIsChecking(false);
    }
  };

  // Función que ejecuta el guardado final tras la confirmación
  const handleAddFinal = async () => {
    setShowWarning(false);
    await dataService.addEmisor({
      nombre: newEmisorName, 
      bigo_id: newEmisorBigo, 
      pais: newEmisorCountry, 
      mes_entrada: newEmisorMonth, 
      reclutador_id: user.id,
      es_compartido: isAdmin ? isShared : false,
      semillas_mes: 0 
    } as any, user);
    setShowAddModal(false); loadData();
    
    setNewEmisorName(''); setNewEmisorBigo(''); setNewEmisorCountry(''); setIsShared(false);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmisor) return;
    
    const updatePayload: Partial<Emisor> = {
        nombre: editName,
        bigo_id: editBigo,
        pais: editCountry,
        mes_entrada: editMonth,
        semillas_mes: Number(editSeeds || 0)
    };

    if (isAdmin) {
        updatePayload.horas_mes = Number(editHours);
    }

    await dataService.updateEmisorData(selectedEmisor.id, updatePayload, user.id);

    setIsEditingMode(false); 
    setShowDetailModal(false);
    loadData();
  };

  const handleDelete = async (emisorId: string) => {
      if (!confirm("¿Estás seguro de ELIMINAR este emisor permanentemente?")) return;
      await dataService.deleteEmisor(emisorId);
      setShowDetailModal(false);
      loadData();
  };

  const openEmisorDetail = (emisor: Emisor) => {
      setSelectedEmisor(emisor);
      setEditName(emisor.nombre);
      setEditBigo(emisor.bigo_id);
      setEditCountry(emisor.pais);
      setEditMonth(emisor.mes_entrada);
      setEditHours(emisor.horas_mes || 0);
      setEditSeeds(emisor.semillas_mes || 0);
      
      setIsEditingMode(false); 
      setShowDetailModal(true);
  };

  const clearFilter = () => {
      setSearchParams({});
  };

  const getStatusInfo = (hours: number, state?: string) => {
      if (state === 'pausado') return { label: 'Inactivo', color: 'text-gray-400', bg: 'bg-gray-100', icon: X, barColor: 'bg-gray-300' };
      if (hours >= 44) return { label: 'Meta Cumplida', color: 'text-green-600', bg: 'bg-green-100', icon: Trophy, barColor: 'bg-green-500' };
      if (hours >= 20) return { label: 'Productivo', color: 'text-primary', bg: 'bg-purple-100', icon: CheckCircle, barColor: 'bg-primary' };
      return { label: 'Riesgo', color: 'text-accent', bg: 'bg-orange-100', icon: AlertTriangle, barColor: 'bg-accent' };
  };

  const getProductivityStats = () => {
      if (!filterRecruiterId) return null;
      const targetEmisores = emisores.filter(e => e.reclutador_id === filterRecruiterId);
      const total = targetEmisores.length;
      if (total === 0) return { count: 0, status: 'Sin Datos', color: 'text-gray-400' };

      const productiveCount = targetEmisores.filter(e => (e.horas_mes || 0) >= 20).length;
      const percentage = (productiveCount / total) * 100;

      let status = 'Mala';
      let color = 'text-accent'; 
      
      if (percentage >= 50) {
          status = 'Buena';
          color = 'text-green-600';
      } else if (percentage >= 25) {
          status = 'Regular';
          color = 'text-yellow-600';
      }

      return { count: productiveCount, status, color };
  };

  const stats = getProductivityStats();

  const CircularProgress = ({ value, max = 44, size = 120, strokeWidth = 8, state }: any) => {
      const radius = (size - strokeWidth) / 2;
      const circumference = radius * 2 * Math.PI;
      const progress = Math.min(value / max, 1);
      const dash = circumference * progress;
      
      let strokeColor = "#F97316"; 
      if(value >= 20) strokeColor = "#7C3AED"; 
      if(value >= 44) strokeColor = "#16A34A"; 
      if(state === 'pausado') strokeColor = "#9CA3AF";

      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size/2} cy={size/2} r={radius} stroke="#F3F4F6" strokeWidth={strokeWidth} fill="none" />
            <circle 
                cx={size/2} cy={size/2} r={radius} 
                stroke={strokeColor} strokeWidth={strokeWidth} fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - dash}
                strokeLinecap="round"
                transform={`rotate(-90 ${size/2} ${size/2})`}
            />
            <text x="50%" y="50%" dy=".3em" textAnchor="middle" className={`text-3xl font-black ${state === 'pausado' ? 'fill-gray-400' : 'fill-gray-900'}`}>{value}</text>
        </svg>
      );
  };

  return (
    <div className="pb-20 space-y-6">
      
      {filterRecruiterId && isAdmin && (
          <div className="space-y-4">
              <div className="bg-black text-white p-4 rounded-xl flex justify-between items-center shadow-lg">
                  <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Viendo Base de Datos de</p>
                      <p className="font-bold text-lg">{filterRecruiterName || 'Reclutador'}</p>
                  </div>
                  <button onClick={clearFilter} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                      <FilterX size={16} /> Ver Todo
                  </button>
              </div>

              <div className="bg-gray-100 rounded-2xl p-5 border-[4px] border-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-center gap-4">
                     <div className="p-3 bg-white rounded-full shadow-sm text-gray-500">
                        <Activity size={24} />
                     </div>
                     <div>
                         <h3 className="font-bold text-gray-900 text-lg">Informe de Productividad</h3>
                         <p className="text-xs text-gray-500">Análisis global de este reclutador.</p>
                     </div>
                 </div>
                 
                 <div className="flex gap-6 text-center">
                     <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lograron +20H</p>
                         <p className="text-2xl font-black text-gray-900">{stats?.count || 0}</p>
                     </div>
                     <div className="w-px bg-gray-300 h-10"></div>
                     <div>
                         <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Estatus</p>
                         <p className={`text-2xl font-black ${stats?.color}`}>{stats?.status}</p>
                     </div>
                 </div>
              </div>
          </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 md:p-4 rounded-2xl border border-gray-100 shadow-sm sticky top-20 md:top-5 z-30 mx-1">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar por Nombre o ID..." 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5 transition-all placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <button onClick={() => { setShowAddModal(true); setDuplicateError(false); }} className="w-full md:w-auto bg-black text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-gray-200 active:scale-95 transition-transform">
            <Plus size={18} /> Nuevo Emisor
        </button>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? <div className="col-span-full text-center py-20 text-gray-400">Cargando base de datos...</div> : 
         filtered.length === 0 ? <div className="col-span-full text-center py-20 text-gray-400">No se encontraron emisores.</div> :
         filtered.map((emisor) => {
            const status = getStatusInfo(emisor.horas_mes, emisor.estado);
            const isSharedItem = emisor.es_compartido;

            return (
                <div 
                    key={emisor.id} 
                    onClick={() => openEmisorDetail(emisor)}
                    className={`bg-white rounded-2xl p-5 border shadow-sm transition-all cursor-pointer relative group 
                    ${emisor.estado === 'pausado' ? 'border-gray-200 opacity-60 hover:opacity-100' : 'border-gray-100 hover:shadow-md hover:border-gray-200'}
                    ${isSharedItem ? 'ring-1 ring-purple-100' : ''}
                    `}
                >
                    {isSharedItem && (
                        <div className="absolute top-3 right-3 flex gap-1">
                            <div className="bg-purple-100 text-primary p-1 rounded-md" title="Emisor Oficial / Compartido">
                                <Globe size={12} />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-start mb-4 pr-6">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${emisor.estado === 'pausado' ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>
                                {emisor.nombre.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <h3 className={`font-bold text-sm truncate ${emisor.estado === 'pausado' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{emisor.nombre}</h3>
                                <p className="text-xs text-gray-400 font-mono">ID: {emisor.bigo_id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1.5 font-bold">
                            <span className={status.color}>{status.label}</span>
                            <span className="text-gray-900">{emisor.horas_mes || 0} / 44h</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${status.barColor}`} 
                                style={{width: `${Math.min(((emisor.horas_mes || 0)/44)*100, 100)}%`}}
                            ></div>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase">
                            <Coins size={10} className="text-primary"/>
                            <span>Semillas: {(emisor.semillas_mes || 0).toLocaleString()}</span>
                        </div>
                    </div>
                    
                    {isAdmin && emisor.estado === 'pausado' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(emisor.id); }}
                            className="absolute -top-2 -right-2 bg-white text-red-500 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity border border-red-100 hover:bg-red-50 hover:text-red-600 z-10"
                            title="Eliminar permanentemente"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            );
         })
        }
      </div>

      {/* --- MODAL FICHA INFORMATIVA (DETAILS) --- */}
      {showDetailModal && selectedEmisor && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div 
                  className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-sm" 
                  onClick={() => setShowDetailModal(false)}
              ></div>
              
              <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 animate-pop-in">
                  
                  {/* Header de la ficha */}
                  <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-start">
                      <div>
                          <div className="flex items-center gap-2">
                             <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedEmisor.nombre}</h2>
                             {selectedEmisor.es_compartido && <Globe size={16} className="text-primary" />}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 text-gray-500">
                             <UserIcon size={12} />
                             <span className="text-xs font-mono font-medium">{selectedEmisor.bigo_id}</span>
                             {selectedEmisor.estado === 'pausado' && <span className="text-[10px] bg-gray-200 px-2 rounded-full font-bold">INACTIVO</span>}
                          </div>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} className="bg-white p-2 rounded-full shadow-sm text-gray-400 hover:text-black">
                          <X size={18} />
                      </button>
                  </div>

                  <div className="p-8 flex flex-col items-center">
                      {!isEditingMode ? (
                          <>
                            {/* VISTA NORMAL */}
                            <div className="mb-6 scale-110">
                                <CircularProgress value={selectedEmisor.horas_mes || 0} state={selectedEmisor.estado} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                <div className="bg-gray-50 p-3 rounded-2xl text-center">
                                    <MapPin size={16} className="mx-auto mb-1 text-primary"/>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">País</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedEmisor.pais}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-2xl text-center">
                                    <Coins size={16} className="mx-auto mb-1 text-accent"/>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Semillas</p>
                                    <p className="text-sm font-bold text-gray-900">{(selectedEmisor.semillas_mes || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            {(isAdmin || (user.id === selectedEmisor.reclutador_id && !selectedEmisor.es_compartido)) ? (
                                <div className="w-full space-y-3">
                                    <button 
                                        onClick={() => setIsEditingMode(true)}
                                        className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-gray-900 transition-colors"
                                    >
                                        <Edit3 size={16} /> Modificar Datos
                                    </button>

                                    {isAdmin && (
                                        <>
                                            <button 
                                                onClick={async () => {
                                                    await dataService.toggleShared(selectedEmisor.id, selectedEmisor.es_compartido);
                                                    setShowDetailModal(false);
                                                    loadData();
                                                }}
                                                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-colors ${
                                                    selectedEmisor.es_compartido 
                                                    ? 'border-purple-200 text-primary bg-purple-50 hover:bg-purple-100' 
                                                    : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                                                }`}
                                            >
                                                {selectedEmisor.es_compartido ? <Globe size={16} /> : <Lock size={16} />}
                                                {selectedEmisor.es_compartido ? 'Público (Visible Todos)' : 'Privado (Solo Admin)'}
                                            </button>

                                            <button 
                                                onClick={async () => {
                                                    await dataService.toggleStatus(selectedEmisor.id);
                                                    setShowDetailModal(false);
                                                    loadData();
                                                }}
                                                className="w-full py-2 text-xs font-bold text-gray-400 hover:text-black underline"
                                            >
                                                {selectedEmisor.estado === 'activo' ? 'Marcar como Inactivo (Pausar)' : 'Reactivar Emisor'}
                                            </button>
                                            
                                            {selectedEmisor.estado === 'pausado' && (
                                                <button 
                                                    onClick={() => handleDelete(selectedEmisor.id)}
                                                    className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                                                >
                                                    <Trash2 size={16} /> Eliminar Definitivamente
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-purple-50 p-3 rounded-xl flex items-center gap-3 text-primary text-xs font-bold w-full justify-center">
                                    <Shield size={16} />
                                    <span>Emisor Oficial (Solo Lectura)</span>
                                </div>
                            )}
                          </>
                      ) : (
                          // MODO EDICIÓN COMPLETO
                          <form onSubmit={handleSaveChanges} className="w-full animate-slide-up space-y-4">
                              <div className="text-center mb-4">
                                  <h3 className="font-bold text-lg">Modificar Emisor</h3>
                                  <p className="text-xs text-gray-400">
                                    Edita la información de rendimiento.
                                  </p>
                              </div>

                              <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Nombre</label>
                                  <input 
                                    className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-1 focus:ring-black"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">ID Bigo</label>
                                      <input 
                                        className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-1 focus:ring-black"
                                        value={editBigo}
                                        onChange={e => setEditBigo(e.target.value)}
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Mes</label>
                                      <input 
                                        type="month"
                                        className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-1 focus:ring-black"
                                        value={editMonth}
                                        onChange={e => setEditMonth(e.target.value)}
                                      />
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                  <div className="col-span-2">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">País</label>
                                      <input 
                                        className="w-full bg-gray-50 p-3 rounded-xl text-sm font-medium outline-none focus:ring-1 focus:ring-black"
                                        value={editCountry}
                                        onChange={e => setEditCountry(e.target.value)}
                                      />
                                  </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                                          Semillas
                                      </label>
                                      <input 
                                          type="number"
                                          className={`w-full p-3 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-black ${!isAdmin ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-black'}`}
                                          value={editSeeds}
                                          onChange={e => setEditSeeds(e.target.value)}
                                          readOnly={!isAdmin}
                                      />
                                  </div>
                                  
                                  {isAdmin && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                                            Horas
                                        </label>
                                        <input 
                                            type="number" step="0.1"
                                            className="w-full p-3 rounded-xl text-sm font-bold outline-none text-center transition-colors bg-gray-100 text-black focus:ring-1 focus:ring-black"
                                            value={editHours}
                                            onChange={e => setEditHours(e.target.value)}
                                        />
                                    </div>
                                  )}
                              </div>

                              <div className="flex gap-3 pt-2">
                                  <button type="button" onClick={() => setIsEditingMode(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm">Cancelar</button>
                                  <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg">Guardar</button>
                              </div>
                          </form>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Modal Agregar */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-pop-in relative z-10">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Nuevo Registro</h3>
                <button onClick={() => setShowAddModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddInitiate} className="space-y-4">
               <div>
                   <label className="text-xs font-bold text-gray-500 block mb-1.5 ml-1">Nombre Completo</label>
                   <input required className="w-full bg-gray-50 border-none p-3.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5" value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div className="relative">
                       <label className="text-xs font-bold text-gray-500 block mb-1.5 ml-1">ID Bigo</label>
                       <input 
                        required 
                        className={`w-full border-none p-3.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5 transition-colors ${duplicateError ? 'bg-orange-50 ring-2 ring-accent/20' : 'bg-gray-50'}`} 
                        value={newEmisorBigo} 
                        onChange={e => { setNewEmisorBigo(e.target.value); setDuplicateError(false); }} 
                       />
                       {isChecking && <Loader2 className="absolute right-3 bottom-3.5 animate-spin text-gray-300" size={16} />}
                   </div>
                   <div>
                       <label className="text-xs font-bold text-gray-500 block mb-1.5 ml-1">Mes Ingreso</label>
                       <input required type="month" className="w-full bg-gray-50 border-none p-3.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5" value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                   </div>
               </div>

               {duplicateError && (
                   <div className="bg-accent/10 p-3 rounded-xl border border-accent/20 animate-pop-in flex items-start gap-3">
                       <AlertTriangle size={16} className="text-accent shrink-0 mt-0.5" />
                       <p className="text-[11px] font-bold text-accent uppercase leading-relaxed tracking-wider">
                           Este emisor ya ha sido registrado en la base de datos de la agencia.
                       </p>
                   </div>
               )}

               <div>
                   <label className="text-xs font-bold text-gray-500 block mb-1.5 ml-1">País</label>
                   <input required className="w-full bg-gray-50 border-none p-3.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5" value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} />
               </div>
               
               {isAdmin && (
                   <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-xl cursor-pointer" onClick={() => setIsShared(!isShared)}>
                       <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isShared ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300'}`}>
                           {isShared && <CheckCircle size={14} />}
                       </div>
                       <label className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                           Compartir con todos los reclutadores
                       </label>
                   </div>
               )}

               <button 
                type="submit" 
                disabled={isChecking}
                className={`w-full py-4 rounded-xl font-bold text-sm mt-2 shadow-lg transition-all flex items-center justify-center gap-2 ${isChecking ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-900 active:scale-95'}`}
               >
                {isChecking ? 'Verificando...' : 'Guardar Emisor'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ADVERTENCIA PREVIA AL REGISTRO */}
      {showWarning && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="fixed inset-0 w-screen h-screen bg-black/60 backdrop-blur-sm" onClick={() => setShowWarning(false)}></div>
          <div className="bg-white rounded-[2.5rem] w-full max-w-xs p-8 shadow-2xl animate-pop-in relative z-10 text-center border-[6px] border-white">
            <div className="bg-orange-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 shadow-sm">
              <AlertTriangle size={40} className="text-accent -rotate-12" />
            </div>
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Verificación de Cuenta</h3>
            <p className="text-xs font-bold text-gray-900 leading-relaxed uppercase mb-10">
              "Antes de ingresar un emisor revisa que está cuenta sea nueva y no haya sido vinculada anteriormente con otra agencia"
            </p>
            <div className="space-y-3">
              <button 
                onClick={handleAddFinal}
                className="w-full py-4 bg-black text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-gray-900 active:scale-95 transition-all"
              >
                Deseo continuar / Aceptar
              </button>
              <button 
                onClick={() => setShowWarning(false)}
                className="w-full py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
              >
                Cancelar y Revisar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emisores;
