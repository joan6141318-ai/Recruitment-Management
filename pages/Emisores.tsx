
import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, X, Globe, Calendar, Hash, Clock, Save } from 'lucide-react';

interface EmisoresProps {
  user: User;
}

const Emisores: React.FC<EmisoresProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [filtered, setFiltered] = useState<Emisor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selected, setSelected] = useState<Emisor | null>(null);

  // Forms
  const [newNombre, setNewNombre] = useState('');
  const [newBigo, setNewBigo] = useState('');
  const [newPais, setNewPais] = useState('');
  const [newMes, setNewMes] = useState('');
  
  // Edit State
  const [editHours, setEditHours] = useState<string>('');

  useEffect(() => { loadData(); }, [user]);
  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFiltered(emisores.filter(e => e.nombre.toLowerCase().includes(lower) || e.bigo_id.includes(lower)));
  }, [searchTerm, emisores]);

  const loadData = async () => {
    const data = await dataService.getEmisores(user);
    setEmisores(data);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataService.addEmisor({
        nombre: newNombre, bigo_id: newBigo, pais: newPais, mes_entrada: newMes, reclutador_id: user.id
    }, user);
    setIsAddOpen(false);
    setNewNombre(''); setNewBigo(''); setNewPais(''); setNewMes('');
    loadData();
  };

  const handleUpdateHours = async () => {
      if (!selected || user.rol !== 'admin') return;
      const hoursNum = parseFloat(editHours);
      if (isNaN(hoursNum) || hoursNum < 0) {
          alert("Por favor ingresa un número válido de horas.");
          return;
      }
      await dataService.updateHours(selected.id, hoursNum, user.id);
      setIsDetailOpen(false);
      loadData();
  };

  const getStatusBadge = (hours: number) => {
      if (hours >= 44) return { bg: 'bg-black', text: 'text-white', label: 'Meta 44h', border: 'border-black' };
      if (hours >= 20) return { bg: 'bg-primaryLight', text: 'text-primary', label: 'Activo >20h', border: 'border-primaryLight' };
      return { bg: 'bg-accentLight', text: 'text-accent', label: 'Riesgo', border: 'border-accentLight' };
  };

  return (
    <div className="pb-8">
      {/* TOOLS */}
      <div className="sticky top-0 bg-background z-20 py-4 space-y-4">
          <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-black text-black tracking-tight">Emisores</h2>
                  <p className="text-xs text-gray-500 font-medium">Gestión de talento y horas</p>
              </div>
              <button 
                 onClick={() => setIsAddOpen(true)}
                 className="bg-black text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all"
              >
                  <Plus size={24} />
              </button>
          </div>
          
          <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input 
                 className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primaryLight outline-none shadow-sm transition-all text-black placeholder-gray-400"
                 placeholder="Buscar nombre o ID..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
      </div>

      {/* LISTA */}
      <div className="space-y-4">
          {filtered.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm font-medium">No se encontraron emisores</p>
              </div>
          )}
          {filtered.map(emisor => {
              const badge = getStatusBadge(emisor.horas_mes);
              return (
                  <div 
                    key={emisor.id} 
                    onClick={() => { setSelected(emisor); setEditHours(emisor.horas_mes.toString()); setIsDetailOpen(true); }}
                    className="group bg-white p-5 rounded-3xl border border-gray-100 shadow-card active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
                  >
                      {/* Accent Bar */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${emisor.horas_mes >= 44 ? 'bg-black' : (emisor.horas_mes >= 20 ? 'bg-primary' : 'bg-accent')}`}></div>

                      <div className="flex justify-between items-start pl-3">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-black text-black text-base capitalize">{emisor.nombre}</h3>
                                  {emisor.horas_mes >= 44 && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                              </div>
                              <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide ${badge.bg} ${badge.text}`}>
                                      {badge.label}
                                  </span>
                                  <span className="text-xs text-gray-400 font-mono font-medium">#{emisor.bigo_id}</span>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="text-2xl font-black text-black tracking-tight">{emisor.horas_mes}</span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase block">Horas</span>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* MODAL DETALLE / EDICIÓN */}
      {isDetailOpen && selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4">
              <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
                  
                  {/* Header Modal */}
                  <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                      <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Ficha Técnica</p>
                          <h2 className="text-2xl font-black text-black capitalize leading-none">{selected.nombre}</h2>
                      </div>
                      <button onClick={() => setIsDetailOpen(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 text-black transition-colors">
                          <X size={20}/>
                      </button>
                  </div>

                  {/* Info Cards */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-gray-50 p-4 rounded-2xl">
                          <div className="flex items-center gap-2 mb-1 text-gray-400"><Globe size={14} /><span className="text-[10px] font-bold uppercase">País</span></div>
                          <p className="font-bold text-black text-sm">{selected.pais}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl">
                          <div className="flex items-center gap-2 mb-1 text-gray-400"><Calendar size={14} /><span className="text-[10px] font-bold uppercase">Registro</span></div>
                          <p className="font-bold text-black text-sm">{selected.mes_entrada}</p>
                      </div>
                      <div className="col-span-2 bg-gray-50 p-4 rounded-2xl flex justify-between items-center">
                          <div className="flex items-center gap-2 text-gray-400"><Hash size={14} /><span className="text-[10px] font-bold uppercase">Bigo ID</span></div>
                          <p className="font-mono font-black text-black text-lg">{selected.bigo_id}</p>
                      </div>
                  </div>

                  {/* SECCION CRITICA: EDICIÓN DE HORAS */}
                  <div className="bg-white border-2 border-gray-100 rounded-3xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-black text-black uppercase flex items-center gap-2">
                              <Clock size={16} className="text-primary" /> Horas Transmisión
                          </span>
                          {user.rol !== 'admin' && (
                              <span className="text-xs font-bold text-gray-400">Solo lectura</span>
                          )}
                      </div>

                      {user.rol === 'admin' ? (
                          <div className="space-y-4">
                              {/* INPUT GIGANTE */}
                              <div className="relative">
                                  <input 
                                    type="number" 
                                    inputMode="decimal"
                                    value={editHours} 
                                    onChange={e => setEditHours(e.target.value)} 
                                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-2xl py-6 text-center font-black text-5xl text-black focus:bg-white focus:border-primary focus:ring-4 focus:ring-primaryLight outline-none transition-all placeholder-gray-300"
                                    placeholder="0"
                                  />
                                  <span className="absolute right-6 bottom-6 text-sm font-bold text-gray-400">HRS</span>
                              </div>
                              
                              {/* BOTON GUARDAR CLARO Y SEPARADO */}
                              <button 
                                onClick={handleUpdateHours} 
                                className="w-full bg-black text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
                              >
                                  <Save size={18} /> Guardar Cambios
                              </button>
                          </div>
                      ) : (
                          <div className="bg-black text-white py-8 rounded-2xl text-center">
                              <span className="text-5xl font-black tracking-tighter">{selected.horas_mes}</span>
                              <span className="text-sm font-bold text-gray-400 ml-2">HRS</span>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* MODAL AGREGAR */}
      {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-pop-in">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-black text-black tracking-tight">Nuevo Emisor</h3>
                       <button onClick={() => setIsAddOpen(false)}><X size={24} className="text-gray-400 hover:text-black" /></button>
                   </div>
                   
                   <form onSubmit={handleAdd} className="space-y-4">
                       <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nombre</label>
                           <input required value={newNombre} onChange={e => setNewNombre(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primaryLight outline-none transition-all" />
                       </div>
                       <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Bigo ID</label>
                           <input required value={newBigo} onChange={e => setNewBigo(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primaryLight outline-none transition-all" />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                           <div>
                               <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">País</label>
                               <input required value={newPais} onChange={e => setNewPais(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none" />
                           </div>
                           <div>
                               <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Ingreso</label>
                               <input required type="month" value={newMes} onChange={e => setNewMes(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 text-sm font-bold focus:border-primary outline-none" />
                           </div>
                       </div>
                       
                       <button className="w-full bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest mt-6 hover:bg-purple-700 shadow-lg shadow-purple-500/30 active:scale-95 transition-all">
                           Registrar Emisor
                       </button>
                   </form>
               </div>
          </div>
      )}
    </div>
  );
};

export default Emisores;
