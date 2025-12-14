import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, X, Globe, Calendar, Hash, TrendingUp, Save, BarChart2 } from 'lucide-react';

interface EmisoresProps {
  user: User;
}

const GOAL_HOURS = 44;

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
      if (hours >= GOAL_HOURS) {
          return { 
              bg: 'bg-green-100', text: 'text-green-800', 
              label: 'PRODUCTIVO', 
              bar: 'bg-green-500',
              icon: '🚀'
          };
      }
      if (hours >= 20) {
          return { 
              bg: 'bg-purple-100', text: 'text-purple-800', 
              label: 'REGULAR', 
              bar: 'bg-primary',
              icon: '⚡'
          };
      }
      return { 
          bg: 'bg-orange-100', text: 'text-orange-800', 
          label: 'BAJO / RIESGO', 
          bar: 'bg-accent',
          icon: '⚠️'
      };
  };

  return (
    <div className="pb-8">
      {/* HEADER TOOLS */}
      <div className="sticky top-0 bg-background z-20 py-4 space-y-4">
          <div className="flex justify-between items-center">
              <div>
                  <h2 className="text-2xl font-black text-black tracking-tight">Emisores</h2>
                  <p className="text-xs text-gray-500 font-medium">Gestión de Talento</p>
              </div>
              <button 
                 onClick={() => setIsAddOpen(true)}
                 className="bg-black text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                  <Plus size={24} />
              </button>
          </div>
          
          <div className="relative group">
              <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
              <input 
                 className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primaryLight outline-none shadow-sm transition-all text-black placeholder-gray-400"
                 placeholder="Buscar emisor..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
      </div>

      {/* LISTA DE EMISORES */}
      <div className="space-y-4">
          {filtered.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 opacity-60">
                  <p className="text-gray-400 text-sm font-bold">Sin resultados</p>
              </div>
          )}
          
          {filtered.map(emisor => {
              const badge = getStatusBadge(emisor.horas_mes);
              const progress = Math.min((emisor.horas_mes / GOAL_HOURS) * 100, 100);
              
              return (
                  <div 
                    key={emisor.id} 
                    onClick={() => { setSelected(emisor); setEditHours(emisor.horas_mes.toString()); setIsDetailOpen(true); }}
                    className="group bg-white p-5 rounded-3xl border border-gray-100 shadow-card active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden hover:border-gray-200 hover:shadow-lg"
                  >
                      {/* Borde izquierdo */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${badge.bar}`}></div>

                      <div className="flex justify-between items-start pl-3 mb-4">
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-black text-black text-lg capitalize">{emisor.nombre}</h3>
                              </div>
                              <span className="text-xs text-gray-400 font-mono font-bold">ID: {emisor.bigo_id}</span>
                          </div>
                          
                          <div className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${badge.bg}`}>
                              <span className="text-xs">{badge.icon}</span>
                              <span className={`text-[10px] font-black uppercase tracking-wide ${badge.text}`}>
                                  {badge.label}
                              </span>
                          </div>
                      </div>

                      <div className="pl-3">
                           <div className="flex justify-between items-end mb-2">
                               <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avance</span>
                               <div className="text-right">
                                  <span className="text-xl font-black text-black tracking-tight">{emisor.horas_mes}</span>
                                  <span className="text-xs text-gray-400 font-bold ml-1">/ {GOAL_HOURS}h</span>
                               </div>
                           </div>
                           
                           <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                               <div 
                                  className={`h-full rounded-full transition-all duration-700 ease-out ${badge.bar}`} 
                                  style={{ width: `${progress}%` }}
                               ></div>
                           </div>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* MODAL DETALLE / EDICIÓN - CENTRADO Y PROFESIONAL */}
      {isDetailOpen && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-pop-in">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative transform transition-all">
                  
                  {/* Decorative Header Background */}
                  <div className="h-24 bg-black relative overflow-hidden flex items-center justify-center">
                       <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-black to-black"></div>
                       <BarChart2 className="text-white opacity-10 absolute -right-4 -bottom-4" size={120} />
                       
                       <button 
                         onClick={() => setIsDetailOpen(false)} 
                         className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                       >
                          <X size={18}/>
                       </button>
                  </div>

                  <div className="px-6 pb-6 -mt-10 relative">
                      {/* Avatar / Icon Placeholder */}
                      <div className="w-20 h-20 bg-white rounded-3xl p-1.5 shadow-lg mx-auto mb-4">
                          <div className="w-full h-full bg-gray-50 rounded-2xl flex items-center justify-center text-3xl font-black text-black border border-gray-100">
                              {selected.nombre.charAt(0).toUpperCase()}
                          </div>
                      </div>

                      <div className="text-center mb-6">
                          <h2 className="text-2xl font-black text-black capitalize leading-none mb-1">{selected.nombre}</h2>
                          <p className="font-mono text-sm font-bold text-gray-400 tracking-wider">ID: {selected.bigo_id}</p>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-6">
                          <div className="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
                              <Globe size={16} className="text-gray-400 mx-auto mb-1" />
                              <p className="text-[10px] font-bold text-gray-400 uppercase">País</p>
                              <p className="font-bold text-black text-sm">{selected.pais}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100">
                              <Calendar size={16} className="text-gray-400 mx-auto mb-1" />
                              <p className="text-[10px] font-bold text-gray-400 uppercase">Inicio</p>
                              <p className="font-bold text-black text-sm">{selected.mes_entrada}</p>
                          </div>
                      </div>

                      {/* EDICIÓN DE HORAS */}
                      <div className="bg-white border-2 border-gray-100 rounded-3xl p-5 shadow-sm relative overflow-hidden group hover:border-gray-200 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-black uppercase flex items-center gap-2">
                                  <TrendingUp size={14} className="text-primary" /> Transmisión
                              </span>
                              {user.rol !== 'admin' && (
                                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Solo lectura</span>
                              )}
                          </div>

                          {user.rol === 'admin' ? (
                              <div className="space-y-3">
                                  <div className="relative">
                                      <input 
                                        type="number" 
                                        inputMode="decimal"
                                        value={editHours} 
                                        onChange={e => setEditHours(e.target.value)} 
                                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 text-center font-black text-5xl text-black focus:bg-white focus:border-black focus:ring-0 outline-none transition-all"
                                        placeholder="0"
                                      />
                                      <span className="absolute right-4 bottom-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hrs</span>
                                  </div>
                                  
                                  <button 
                                    onClick={handleUpdateHours} 
                                    className="w-full bg-black text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-black/10"
                                  >
                                      <Save size={16} /> Guardar Progreso
                                  </button>
                              </div>
                          ) : (
                              <div className="text-center py-2">
                                  <span className="text-5xl font-black tracking-tighter text-black">{selected.horas_mes}</span>
                                  <span className="text-xs font-bold text-gray-400 block mt-1 uppercase tracking-widest">Horas Totales</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL AGREGAR */}
      {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
               <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-pop-in">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-black text-black tracking-tight">Nuevo Emisor</h3>
                       <button onClick={() => setIsAddOpen(false)}><X size={24} className="text-gray-400 hover:text-black" /></button>
                   </div>
                   
                   <form onSubmit={handleAdd} className="space-y-4">
                       <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nombre Completo</label>
                           <input required value={newNombre} onChange={e => setNewNombre(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-black focus:ring-0 outline-none transition-all" />
                       </div>
                       <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Bigo ID</label>
                           <input required value={newBigo} onChange={e => setNewBigo(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-black focus:ring-0 outline-none transition-all" />
                       </div>
                       <div className="grid grid-cols-2 gap-3">
                           <div>
                               <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">País</label>
                               <input required value={newPais} onChange={e => setNewPais(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none" placeholder="MX" />
                           </div>
                           <div>
                               <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Ingreso</label>
                               <input required type="month" value={newMes} onChange={e => setNewMes(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2 py-3 text-sm font-bold focus:border-black outline-none" />
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