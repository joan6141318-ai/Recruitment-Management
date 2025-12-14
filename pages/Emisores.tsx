
import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, X, Clock, Globe, Calendar, User as UserIcon } from 'lucide-react';

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
        nombre: newNombre,
        bigo_id: newBigo,
        pais: newPais,
        mes_entrada: newMes,
        reclutador_id: user.id
    }, user);
    setIsAddOpen(false);
    setNewNombre(''); setNewBigo(''); setNewPais(''); setNewMes('');
    loadData();
  };

  const handleUpdateHours = async () => {
      if (!selected || user.rol !== 'admin') return;
      await dataService.updateHours(selected.id, Number(editHours), user.id);
      setIsDetailOpen(false);
      loadData();
  };

  // Helper de colores y efectividad
  const getEfficiency = (hours: number) => {
      if (hours >= 44) return { color: 'bg-green-500', text: 'text-green-600', label: 'Meta Cumplida', percent: 100 };
      if (hours >= 20) return { color: 'bg-blue-500', text: 'text-blue-600', label: 'Efectivo', percent: (hours/44)*100 };
      return { color: 'bg-orange-500', text: 'text-orange-600', label: 'En Riesgo', percent: (hours/44)*100 };
  };

  return (
    <div className="pb-20">
      {/* Header Search & Add */}
      <div className="flex gap-2 mb-4 sticky top-0 bg-gray-50 z-10 py-2">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              <input 
                 className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:border-black outline-none shadow-sm"
                 placeholder="Buscar emisor..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
          <button 
             onClick={() => setIsAddOpen(true)}
             className="bg-black text-white px-4 rounded-xl shadow-lg shadow-gray-400/20 active:scale-95 transition-transform"
          >
              <Plus size={20} />
          </button>
      </div>

      {/* List */}
      <div className="space-y-3">
          {filtered.map(emisor => {
              const eff = getEfficiency(emisor.horas_mes);
              return (
                  <div 
                    key={emisor.id} 
                    onClick={() => { setSelected(emisor); setEditHours(emisor.horas_mes.toString()); setIsDetailOpen(true); }}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden"
                  >
                      {/* Borde indicador izquierdo */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${eff.color}`}></div>
                      
                      <div className="flex justify-between items-start pl-3">
                          <div>
                              <h3 className="font-bold text-gray-900 text-sm capitalize">{emisor.nombre}</h3>
                              <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {emisor.bigo_id}</p>
                          </div>
                          <div className="text-right">
                              <span className="text-xl font-black text-black block leading-none">{emisor.horas_mes}h</span>
                              <span className={`text-[9px] font-bold uppercase ${eff.text}`}>{eff.label}</span>
                          </div>
                      </div>
                      
                      {/* Barra Progreso Mini */}
                      <div className="mt-3 pl-3 w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div className={`h-full ${eff.color}`} style={{ width: `${Math.min(eff.percent, 100)}%` }}></div>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* MODAL DETALLE */}
      {isDetailOpen && selected && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
              <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ficha Informativa</p>
                          <h2 className="text-xl font-black text-black capitalize mt-1">{selected.nombre}</h2>
                      </div>
                      <button onClick={() => setIsDetailOpen(false)} className="bg-gray-100 p-2 rounded-full"><X size={18}/></button>
                  </div>

                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <div className="flex items-center gap-2 mb-1 text-gray-400"><Globe size={14} /><span className="text-[10px] font-bold uppercase">País</span></div>
                              <p className="font-bold text-gray-900">{selected.pais}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <div className="flex items-center gap-2 mb-1 text-gray-400"><Calendar size={14} /><span className="text-[10px] font-bold uppercase">Ingreso</span></div>
                              <p className="font-bold text-gray-900">{selected.mes_entrada}</p>
                          </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                           <div className="flex items-center gap-2 mb-1 text-gray-400"><UserIcon size={14} /><span className="text-[10px] font-bold uppercase">ID Bigo</span></div>
                           <p className="font-mono text-lg font-black text-black">{selected.bigo_id}</p>
                      </div>

                      <div className="pt-4 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold uppercase text-gray-500">Horas Transmisión</span>
                              <span className="text-xs font-bold text-black">Meta: 44h</span>
                          </div>
                          
                          {user.rol === 'admin' ? (
                              <div className="flex gap-2">
                                  <input 
                                    type="number" 
                                    value={editHours} 
                                    onChange={e => setEditHours(e.target.value)} 
                                    className="flex-1 border-2 border-black rounded-xl px-4 py-2 font-black text-lg text-center"
                                  />
                                  <button onClick={handleUpdateHours} className="bg-black text-white px-6 rounded-xl font-bold uppercase text-xs">Guardar</button>
                              </div>
                          ) : (
                              <div className="bg-black text-white p-4 rounded-xl text-center">
                                  <span className="text-3xl font-black">{selected.horas_mes}</span>
                                  <span className="text-sm font-medium text-gray-400 ml-1">Horas</span>
                              </div>
                          )}
                          
                          {/* Info Efectividad */}
                          <div className="mt-3 flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                              <span>Mínimo: 20h</span>
                              <span className={selected.horas_mes >= 20 ? 'text-green-500' : 'text-orange-500'}>
                                  {selected.horas_mes >= 20 ? 'Efectivo' : 'Baja Productividad'}
                              </span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL AGREGAR */}
      {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <div className="bg-white w-full max-w-sm rounded-2xl p-6">
                   <h3 className="text-lg font-black text-black uppercase mb-4">Registrar Emisor</h3>
                   <form onSubmit={handleAdd} className="space-y-3">
                       <div>
                           <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre</label>
                           <input required value={newNombre} onChange={e => setNewNombre(e.target.value)} className="w-full border-b border-gray-300 py-2 font-bold text-sm outline-none focus:border-black" />
                       </div>
                       <div>
                           <label className="text-[10px] font-bold text-gray-500 uppercase">ID Bigo</label>
                           <input required value={newBigo} onChange={e => setNewBigo(e.target.value)} className="w-full border-b border-gray-300 py-2 font-bold text-sm outline-none focus:border-black" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="text-[10px] font-bold text-gray-500 uppercase">País</label>
                               <input required value={newPais} onChange={e => setNewPais(e.target.value)} className="w-full border-b border-gray-300 py-2 font-bold text-sm outline-none focus:border-black" />
                           </div>
                           <div>
                               <label className="text-[10px] font-bold text-gray-500 uppercase">Ingreso</label>
                               <input required type="month" value={newMes} onChange={e => setNewMes(e.target.value)} className="w-full border-b border-gray-300 py-2 font-bold text-sm outline-none focus:border-black" />
                           </div>
                       </div>
                       <button className="w-full bg-primary text-white py-3 rounded-xl font-bold uppercase text-xs mt-4">Guardar Emisor</button>
                       <button type="button" onClick={() => setIsAddOpen(false)} className="w-full py-3 text-gray-400 font-bold uppercase text-[10px]">Cancelar</button>
                   </form>
               </div>
          </div>
      )}
    </div>
  );
};

export default Emisores;
