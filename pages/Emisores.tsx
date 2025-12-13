import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, Filter, Edit2, PlayCircle, PauseCircle, Clock, Eye, Calendar, Globe, User as UserIcon, Activity, Zap } from 'lucide-react';

interface EmisoresProps {
  user: User;
}

const Emisores: React.FC<EmisoresProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [filtered, setFiltered] = useState<Emisor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'pausado'>('all');
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEmisor, setSelectedEmisor] = useState<Emisor | null>(null);

  // Form States
  const [newEmisorName, setNewEmisorName] = useState('');
  const [newEmisorBigo, setNewEmisorBigo] = useState('');
  const [newEmisorCountry, setNewEmisorCountry] = useState('');
  const [newEmisorMonth, setNewEmisorMonth] = useState('');
  const [newEmisorRecruiterId, setNewEmisorRecruiterId] = useState(user.id);
  const [editHours, setEditHours] = useState<string | number>('');

  const [recruiters, setRecruiters] = useState<User[]>([]);

  useEffect(() => {
    loadData();
    if (user.rol === 'admin') {
      dataService.getRecruiters().then(setRecruiters);
    }
  }, [user]);

  useEffect(() => {
    let result = emisores;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(e => 
        e.nombre.toLowerCase().includes(lower) || 
        e.bigo_id.toLowerCase().includes(lower)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(e => e.estado === statusFilter);
    }
    setFiltered(result);
  }, [searchTerm, statusFilter, emisores]);

  const loadData = async () => {
    setLoading(true);
    const data = await dataService.getEmisores(user);
    setEmisores(data);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataService.addEmisor({
      nombre: newEmisorName,
      bigo_id: newEmisorBigo,
      pais: newEmisorCountry,
      mes_entrada: newEmisorMonth,
      reclutador_id: newEmisorRecruiterId
    }, user);
    
    setIsAddModalOpen(false);
    setNewEmisorName('');
    setNewEmisorBigo('');
    setNewEmisorCountry('');
    setNewEmisorMonth('');
    loadData();
  };

  const handleEditHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmisor) return;
    await dataService.updateHours(selectedEmisor.id, Number(editHours), user.id);
    setIsEditModalOpen(false);
    loadData();
  };

  const toggleStatus = async (emisor: Emisor) => {
    if (user.rol !== 'admin') return;
    await dataService.toggleStatus(emisor.id);
    loadData();
  };

  const openEdit = (emisor: Emisor) => {
    setSelectedEmisor(emisor);
    setEditHours(emisor.horas_mes);
    setIsEditModalOpen(true);
  };

  const openDetails = (emisor: Emisor) => {
    setSelectedEmisor(emisor);
    setIsDetailsModalOpen(true);
  };

  const inputClass = "w-full bg-background border-2 border-transparent p-4 rounded-2xl text-black font-bold focus:outline-none focus:bg-white focus:border-black transition-all";

  return (
    <div className="space-y-8 animate-slide-up pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-black tracking-tighter uppercase">Emisores</h2>
          <div className="h-1 w-12 bg-black mt-2 rounded-full"></div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-black hover:bg-primary text-white px-8 py-4 rounded-[1.5rem] flex items-center justify-center space-x-3 shadow-xl transition-all active:scale-95 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" />
          <span className="font-bold uppercase tracking-wide text-sm">Crear Nuevo</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-3 rounded-[2rem] shadow-card border border-gray-100">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="BUSCAR EMISOR..." 
            className="w-full pl-14 pr-6 py-4 bg-transparent rounded-xl focus:outline-none text-black font-bold placeholder-gray-300 uppercase"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-4">
          <select 
            className="w-full sm:w-48 h-full px-6 py-4 bg-gray-50 hover:bg-black hover:text-white rounded-[1.5rem] focus:outline-none appearance-none cursor-pointer font-bold text-sm uppercase tracking-wide transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="activo">Activos</option>
            <option value="pausado">Pausados</option>
          </select>
          <Filter className="absolute right-8 top-1/2 transform -translate-y-1/2 pointer-events-none opacity-50" size={16} />
        </div>
      </div>

      {/* List - CARDS PROTAGONISTAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
           <p className="text-center text-gray-400 font-bold uppercase tracking-widest col-span-full py-20">Cargando...</p>
        ) : filtered.length === 0 ? (
           <div className="col-span-full text-center py-24">
             <p className="text-gray-300 font-black text-4xl uppercase">Sin Resultados</p>
           </div>
        ) : (
          filtered.map((emisor, index) => (
            <div 
                key={emisor.id} 
                className="bg-white rounded-[2.5rem] p-8 shadow-card border border-transparent hover:border-black/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden animate-fade-up"
                style={{ animationDelay: `${index * 50}ms` }}
            >
                {/* Status Dot Minimalist */}
                <div className={`absolute top-8 right-8 w-3 h-3 rounded-full ${emisor.estado === 'activo' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>

               <div className="mb-8 relative z-10">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">ID: {emisor.bigo_id}</div>
                  {/* NOMBRE MASIVO */}
                  <h3 className="font-black text-black text-2xl leading-none uppercase tracking-tight group-hover:text-primary transition-colors">
                    {emisor.nombre}
                  </h3>
               </div>
                
                <div className="flex items-end justify-between relative z-10">
                    <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Horas</p>
                        <p className="text-4xl font-black text-black">{emisor.horas_mes}</p>
                    </div>
                    
                    <button 
                        onClick={() => openDetails(emisor)}
                        className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors"
                    >
                        <Eye size={20} />
                    </button>
                </div>

                {user.rol === 'admin' && (
                  <div className="grid grid-cols-2 gap-3 mt-8 pt-6 border-t border-gray-100">
                    <button 
                      onClick={() => openEdit(emisor)}
                      className="py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-black text-white hover:bg-primary transition-colors flex justify-center items-center gap-2"
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                    <button 
                      onClick={() => toggleStatus(emisor)}
                      className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-colors ${
                        emisor.estado === 'activo' 
                          ? 'border-transparent bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'border-transparent bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {emisor.estado === 'activo' ? 'Pausar' : 'Activar'}
                    </button>
                  </div>
                )}
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl border border-gray-100 animate-scale-in">
            <h3 className="text-3xl font-black mb-8 text-black uppercase tracking-tight">Nuevo Emisor</h3>
            <form onSubmit={handleAdd} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">Nombre</label>
                <input required className={inputClass} value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} placeholder="NOMBRE COMPLETO" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">BIGO ID</label>
                    <input required className={inputClass} value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} placeholder="00000" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">Ingreso</label>
                    <input required type="month" className={inputClass} value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">País</label>
                <input required className={inputClass} value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} placeholder="PAÍS" />
              </div>
              
              {user.rol === 'admin' && (
                <div>
                   <label className="block text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">Reclutador</label>
                   <div className="relative">
                       <select 
                        className={`${inputClass} appearance-none cursor-pointer`}
                        value={newEmisorRecruiterId} 
                        onChange={e => setNewEmisorRecruiterId(e.target.value)}
                       >
                         <option value={user.id}>ASIGNAR A MÍ</option>
                         {recruiters.map(r => (
                           <option key={r.id} value={r.id}>{r.nombre.toUpperCase()}</option>
                         ))}
                       </select>
                   </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-gray-400 hover:text-black font-bold text-sm uppercase tracking-widest transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hours Modal */}
      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl animate-scale-in border border-gray-100">
            <h3 className="text-xl font-black mb-1 uppercase">Actualizar Horas</h3>
            <p className="text-sm text-gray-400 mb-8 font-bold uppercase tracking-wide">{selectedEmisor.nombre}</p>
            
            <form onSubmit={handleEditHours} className="space-y-8">
              <div className="relative">
                 <input 
                    type="number" 
                    step="0.1"
                    required 
                    className="w-full py-6 bg-transparent border-b-4 border-black text-6xl font-black text-black outline-none text-center focus:border-primary transition-colors placeholder-gray-200" 
                    value={editHours} 
                    onChange={e => setEditHours(e.target.value)} 
                    autoFocus
                    placeholder="0"
                  />
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 text-gray-400 hover:text-black font-bold text-xs uppercase tracking-widest">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-glow hover:scale-105 transition-all">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedEmisor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                <div className="bg-black p-10">
                    <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight leading-none">{selectedEmisor.nombre}</h3>
                    <p className="text-gray-500 font-bold text-xs tracking-[0.2em] uppercase">ID: {selectedEmisor.bigo_id}</p>
                </div>
                
                <div className="p-10 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                         <div className="bg-background p-6 rounded-[1.5rem] text-center">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Horas</p>
                             <p className="text-4xl font-black text-black">{selectedEmisor.horas_mes}</p>
                         </div>
                         <div className="bg-background p-6 rounded-[1.5rem] text-center flex flex-col items-center justify-center">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Estado</p>
                             <div className={`w-4 h-4 rounded-full ${selectedEmisor.estado === 'activo' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
                         </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">País</span>
                            <span className="font-black text-black uppercase">{selectedEmisor.pais}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">Ingreso</span>
                            <span className="font-black text-black uppercase">{selectedEmisor.mes_entrada || '—'}</span>
                        </div>
                    </div>
                    
                    <button onClick={() => setIsDetailsModalOpen(false)} className="w-full py-4 bg-gray-100 hover:bg-black hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Emisores;