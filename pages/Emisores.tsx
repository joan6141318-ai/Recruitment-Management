import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, X, Globe, Calendar, Hash, MoreHorizontal } from 'lucide-react';

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
    resetForm();
    loadData();
  };

  const resetForm = () => { setNewNombre(''); setNewBigo(''); setNewPais(''); setNewMes(''); };

  const handleUpdateHours = async () => {
      if (!selected || user.rol !== 'admin') return;
      await dataService.updateHours(selected.id, Number(editHours), user.id);
      setIsDetailOpen(false);
      loadData();
  };

  const getStatusBadge = (hours: number) => {
      if (hours >= 44) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Meta 44h' };
      if (hours >= 20) return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Activo >20h' };
      return { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Riesgo' };
  };

  return (
    <div className="pb-8">
      {/* HEADER & TOOLS */}
      <div className="sticky top-0 bg-[#F9FAFB] z-20 py-4 space-y-4">
          <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Emisores</h2>
              <button 
                 onClick={() => setIsAddOpen(true)}
                 className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors"
              >
                  <Plus size={20} />
              </button>
          </div>
          
          <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
              <input 
                 className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none shadow-sm transition-all"
                 placeholder="Buscar por nombre o ID..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
      </div>

      {/* LISTA DE EMISORES */}
      <div className="space-y-3">
          {filtered.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">No hay emisores registrados.</div>
          )}
          {filtered.map(emisor => {
              const badge = getStatusBadge(emisor.horas_mes);
              return (
                  <div 
                    key={emisor.id} 
                    onClick={() => { setSelected(emisor); setEditHours(emisor.horas_mes.toString()); setIsDetailOpen(true); }}
                    className="group bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] active:scale-[0.99] transition-all cursor-pointer hover:border-gray-300"
                  >
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="font-bold text-gray-900 text-base capitalize mb-1">{emisor.nombre}</h3>
                              <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${badge.bg} ${badge.text}`}>
                                      {badge.label}
                                  </span>
                                  <span className="text-xs text-gray-400 font-mono">ID: {emisor.bigo_id}</span>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="text-2xl font-bold text-gray-900">{emisor.horas_mes}</span>
                              <span className="text-[10px] text-gray-400 font-medium block">Horas</span>
                          </div>
                      </div>
                      
                      {/* Progress line subtle */}
                      <div className="mt-4 h-1 w-full bg-gray-50 rounded-full overflow-hidden">
                          <div 
                             className={`h-full rounded-full ${emisor.horas_mes >= 44 ? 'bg-green-500' : (emisor.horas_mes >= 20 ? 'bg-blue-500' : 'bg-orange-400')}`} 
                             style={{ width: `${Math.min((emisor.horas_mes/44)*100, 100)}%` }}
                          ></div>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* MODAL DETALLE */}
      {isDetailOpen && selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
              <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-slide-up">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detalle del Emisor</p>
                          <h2 className="text-2xl font-bold text-gray-900 capitalize mt-1">{selected.nombre}</h2>
                      </div>
                      <button onClick={() => setIsDetailOpen(false)} className="bg-gray-50 p-2 rounded-full hover:bg-gray-100 text-gray-500"><X size={20}/></button>
                  </div>

                  <div className="space-y-4">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                              <div className="flex items-center gap-2 mb-1 text-gray-400"><Globe size={14} /><span className="text-[10px] font-bold uppercase">País</span></div>
                              <p className="font-semibold text-gray-900">{selected.pais}</p>
                          </div>
                          <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                              <div className="flex items-center gap-2 mb-1 text-gray-400"><Calendar size={14} /><span className="text-[10px] font-bold uppercase">Desde</span></div>
                              <p className="font-semibold text-gray-900">{selected.mes_entrada}</p>
                          </div>
                      </div>
                      
                      <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex justify-between items-center">
                           <div className="flex items-center gap-2 text-gray-400"><Hash size={14} /><span className="text-[10px] font-bold uppercase">Bigo ID</span></div>
                           <p className="font-mono font-bold text-gray-900">{selected.bigo_id}</p>
                      </div>

                      {/* Edit Section */}
                      <div className="pt-6 border-t border-gray-100 mt-2">
                          <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-bold text-gray-900">Horas Acumuladas</span>
                              {user.rol === 'admin' && <span className="text-xs text-purple-600 font-medium">Modo Edición</span>}
                          </div>
                          
                          {user.rol === 'admin' ? (
                              <div className="flex gap-3">
                                  <input 
                                    type="number" 
                                    value={editHours} 
                                    onChange={e => setEditHours(e.target.value)} 
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-xl text-center focus:bg-white focus:border-black outline-none transition-all"
                                  />
                                  <button onClick={handleUpdateHours} className="bg-black text-white px-6 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">Guardar</button>
                              </div>
                          ) : (
                              <div className="bg-gray-900 text-white p-4 rounded-xl text-center shadow-lg shadow-gray-200">
                                  <span className="text-3xl font-bold">{selected.horas_mes}</span>
                                  <span className="text-sm font-medium text-gray-400 ml-1">hrs</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL AGREGAR */}
      {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
               <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-lg font-bold text-gray-900 tracking-tight">Nuevo Emisor</h3>
                       <button onClick={() => setIsAddOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                   </div>
                   
                   <form onSubmit={handleAdd} className="space-y-4">
                       <div className="space-y-1">
                           <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre</label>
                           <input required value={newNombre} onChange={e => setNewNombre(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:border-black focus:bg-white outline-none transition-all" placeholder="Nombre completo" />
                       </div>
                       <div className="space-y-1">
                           <label className="text-xs font-bold text-gray-500 uppercase ml-1">Bigo ID</label>
                           <input required value={newBigo} onChange={e => setNewBigo(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:border-black focus:bg-white outline-none transition-all" placeholder="ID numérico" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                               <label className="text-xs font-bold text-gray-500 uppercase ml-1">País</label>
                               <input required value={newPais} onChange={e => setNewPais(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm font-medium focus:border-black focus:bg-white outline-none transition-all" placeholder="Ej. MX" />
                           </div>
                           <div className="space-y-1">
                               <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ingreso</label>
                               <input required type="month" value={newMes} onChange={e => setNewMes(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-3 text-sm font-medium focus:border-black focus:bg-white outline-none transition-all" />
                           </div>
                       </div>
                       
                       <button className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm mt-6 hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">
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