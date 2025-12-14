import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, MapPin, Calendar, Clock, Edit3, X, User as UserIcon } from 'lucide-react';

interface EmisoresProps {
  user: User;
}

const Emisores: React.FC<EmisoresProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [filtered, setFiltered] = useState<Emisor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); // Ficha Informativa
  const [isEditingMode, setIsEditingMode] = useState(false); // Modo Edición dentro de la ficha
  
  const [selectedEmisor, setSelectedEmisor] = useState<Emisor | null>(null);
  
  // Forms Data
  const [newEmisorName, setNewEmisorName] = useState('');
  const [newEmisorBigo, setNewEmisorBigo] = useState('');
  const [newEmisorCountry, setNewEmisorCountry] = useState('');
  const [newEmisorMonth, setNewEmisorMonth] = useState('');
  const [editHours, setEditHours] = useState<string | number>('');

  const isAdmin = user.rol === 'admin';

  useEffect(() => { loadData(); }, [user]);

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
    const data = await dataService.getEmisores(user);
    setEmisores(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataService.addEmisor({
      nombre: newEmisorName, bigo_id: newEmisorBigo, pais: newEmisorCountry, mes_entrada: newEmisorMonth, reclutador_id: user.id
    }, user);
    setShowAddModal(false); loadData();
    // Reset forms...
    setNewEmisorName(''); setNewEmisorBigo(''); setNewEmisorCountry('');
  };

  const handleSaveHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmisor || !isAdmin) return;
    await dataService.updateHours(selectedEmisor.id, Number(editHours), user.id);
    setIsEditingMode(false); // Salir de modo edicion
    setShowDetailModal(false); // Cerrar ficha
    loadData();
  };

  const openEmisorDetail = (emisor: Emisor) => {
      setSelectedEmisor(emisor);
      setEditHours(emisor.horas_mes);
      setIsEditingMode(false); // Resetear a modo lectura
      setShowDetailModal(true);
  };

  // Circular Progress Component
  const CircularProgress = ({ value, max = 44, size = 120, strokeWidth = 8 }: any) => {
      const radius = (size - strokeWidth) / 2;
      const circumference = radius * 2 * Math.PI;
      const progress = Math.min(value / max, 1);
      const dash = circumference * progress;
      
      let color = "#000000"; // Black default
      if(value >= 44) color = "#16A34A"; // Green
      else if(value < 15) color = "#EF4444"; // Red

      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size/2} cy={size/2} r={radius} stroke="#F3F4F6" strokeWidth={strokeWidth} fill="none" />
            <circle 
                cx={size/2} cy={size/2} r={radius} 
                stroke={color} strokeWidth={strokeWidth} fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - dash}
                strokeLinecap="round"
                transform={`rotate(-90 ${size/2} ${size/2})`}
            />
            <text x="50%" y="50%" dy=".3em" textAnchor="middle" className="text-2xl font-black fill-gray-900">{value}h</text>
        </svg>
      );
  };

  return (
    <div className="pb-20 space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 md:p-4 rounded-2xl border border-gray-100 shadow-sm sticky top-20 z-10 mx-1">
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
         <button 
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto bg-black text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-gray-200 active:scale-95 transition-transform"
        >
            <Plus size={18} /> Nuevo Emisor
        </button>
      </div>

      {/* Modern Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? <div className="col-span-full text-center py-20 text-gray-400">Cargando...</div> : 
         filtered.map((emisor) => (
            <div 
                key={emisor.id} 
                onClick={() => openEmisorDetail(emisor)}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer relative group"
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                            {emisor.nombre.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{emisor.nombre}</h3>
                            <p className="text-xs text-gray-400 font-mono">ID: {emisor.bigo_id}</p>
                        </div>
                    </div>
                </div>

                {/* Mini Progress */}
                <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1.5 font-bold">
                        <span className="text-gray-400">Progreso</span>
                        <span className="text-gray-900">{emisor.horas_mes} / 44h</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-black rounded-full" 
                            style={{width: `${Math.min((emisor.horas_mes/44)*100, 100)}%`}}
                        ></div>
                    </div>
                </div>
            </div>
         ))
        }
      </div>

      {/* --- MODAL FICHA INFORMATIVA (DETAILS) --- */}
      {showDetailModal && selectedEmisor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
              <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
                  {/* Header de la ficha */}
                  <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-start">
                      <div>
                          <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedEmisor.nombre}</h2>
                          <div className="flex items-center gap-2 mt-1 text-gray-500">
                             <UserIcon size={12} />
                             <span className="text-xs font-mono font-medium">{selectedEmisor.bigo_id}</span>
                          </div>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} className="bg-white p-2 rounded-full shadow-sm text-gray-400 hover:text-black">
                          <X size={18} />
                      </button>
                  </div>

                  <div className="p-8 flex flex-col items-center">
                      {/* Visualización Principal */}
                      {!isEditingMode ? (
                          <>
                            <div className="mb-6 scale-110">
                                <CircularProgress value={selectedEmisor.horas_mes} />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                <div className="bg-gray-50 p-3 rounded-2xl text-center">
                                    <MapPin size={16} className="mx-auto mb-1 text-gray-400"/>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">País</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedEmisor.pais}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-2xl text-center">
                                    <Calendar size={16} className="mx-auto mb-1 text-gray-400"/>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Ingreso</p>
                                    <p className="text-sm font-bold text-gray-900">{selectedEmisor.mes_entrada}</p>
                                </div>
                            </div>

                            {isAdmin && (
                                <button 
                                    onClick={() => setIsEditingMode(true)}
                                    className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-gray-900 transition-colors"
                                >
                                    <Edit3 size={16} /> Modificar Horas
                                </button>
                            )}
                          </>
                      ) : (
                          // MODO EDICIÓN (Solo Admin llega aquí)
                          <form onSubmit={handleSaveHours} className="w-full animate-slide-up">
                              <div className="text-center mb-6">
                                  <Clock size={32} className="mx-auto text-black mb-2" />
                                  <h3 className="font-bold text-lg">Actualizar Horas</h3>
                                  <p className="text-xs text-gray-400">Ingresa el nuevo valor acumulado del mes</p>
                              </div>

                              <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 text-center">Horas Actuales</label>
                                  <input 
                                    type="number" step="0.1" autoFocus
                                    className="w-full bg-transparent text-center text-4xl font-black text-black outline-none"
                                    value={editHours}
                                    onChange={e => setEditHours(e.target.value)}
                                  />
                              </div>

                              <div className="flex gap-3">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-pop-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Nuevo Registro</h3>
                <button onClick={() => setShowAddModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
               <div>
                   <label className="text-xs font-bold text-gray-500 block mb-1.5 ml-1">Nombre Completo</label>
                   <input required className="w-full bg-gray-50 border-none p-3.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5" value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="text-xs font-bold text-gray-500 block mb-1.5 ml-1">ID Bigo</label>
                       <input required className="w-full bg-gray-50 border-none p-3.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5" value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} />
                   </div>
                   <div>
                       <label className="text-xs font-bold text-gray-500 block mb-1.5 ml-1">Mes Ingreso</label>
                       <input required type="month" className="w-full bg-gray-50 border-none p-3.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5" value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                   </div>
               </div>
               <div>
                   <label className="text-xs font-bold text-gray-500 block mb-1.5 ml-1">País</label>
                   <input required className="w-full bg-gray-50 border-none p-3.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black/5" value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} />
               </div>
               <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold text-sm mt-2 shadow-lg hover:bg-gray-900 transition-colors">Guardar Emisor</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emisores;