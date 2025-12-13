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
  const [newEmisorMonth, setNewEmisorMonth] = useState(''); // YYYY-MM
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

  const inputClass = "w-full bg-white border border-gray-200 p-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all shadow-sm";

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Gestión de Emisores</h2>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-black/10 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span className="font-medium">Nuevo Emisor</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl shadow-card border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-11 pr-4 py-2.5 bg-transparent rounded-xl focus:outline-none focus:bg-gray-50 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative border-t sm:border-t-0 sm:border-l border-gray-100">
          <select 
            className="w-full sm:w-40 pl-4 pr-10 py-2.5 bg-transparent rounded-xl focus:outline-none focus:bg-gray-50 appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="activo">Activos</option>
            <option value="pausado">Pausados</option>
          </select>
          <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
           <p className="text-center text-gray-400 col-span-full py-10">Cargando...</p>
        ) : filtered.length === 0 ? (
           <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
             <p className="text-gray-400 font-medium">No se encontraron resultados</p>
           </div>
        ) : (
          filtered.map(emisor => (
            <div key={emisor.id} className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
               <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">{emisor.nombre}</h3>
                  <button 
                     onClick={() => openDetails(emisor)}
                     className="text-gray-300 hover:text-black transition-colors"
                  >
                    <Eye size={20} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                     <span className="text-xs font-mono bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-100">ID: {emisor.bigo_id}</span>
                     {emisor.horas_mes >= 20 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Zap size={10} fill="currentColor" /> Pro
                        </span>
                    )}
                </div>
                
                <div className="flex items-end justify-between mt-4">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase">Horas Mes</p>
                        <p className="text-2xl font-bold text-black">{emisor.horas_mes}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full mb-2 ${emisor.estado === 'activo' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-400'}`}></div>
                </div>

                {user.rol === 'admin' && (
                  <div className="flex gap-2 pt-4 mt-4 border-t border-gray-50">
                    <button 
                      onClick={() => openEdit(emisor)}
                      className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-medium transition-transform active:scale-95 flex justify-center items-center gap-2"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button 
                      onClick={() => toggleStatus(emisor)}
                      className={`w-10 flex items-center justify-center rounded-lg transition-colors border ${
                        emisor.estado === 'activo' 
                          ? 'border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50' 
                          : 'border-green-200 text-green-600 bg-green-50'
                      }`}
                    >
                      {emisor.estado === 'activo' ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold mb-6 text-gray-900">Nuevo Emisor</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre</label>
                <input required className={inputClass} value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">BIGO ID</label>
                    <input required className={inputClass} value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ingreso</label>
                    <input required type="month" className={inputClass} value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">País</label>
                <input required className={inputClass} value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} />
              </div>
              
              {user.rol === 'admin' && (
                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reclutador</label>
                   <div className="relative">
                       <select 
                        className={`${inputClass} appearance-none`}
                        value={newEmisorRecruiterId} 
                        onChange={e => setNewEmisorRecruiterId(e.target.value)}
                       >
                         <option value={user.id}>Asignar a mí</option>
                         {recruiters.map(r => (
                           <option key={r.id} value={r.id}>{r.nombre}</option>
                         ))}
                       </select>
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                   </div>
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 text-gray-500 hover:text-black font-medium transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold shadow-lg shadow-black/20 hover:bg-gray-800 transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hours Modal */}
      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl animate-scale-in">
            <h3 className="text-xl font-bold mb-1">Actualizar Horas</h3>
            <p className="text-sm text-gray-400 mb-6 font-medium">{selectedEmisor.nombre}</p>
            
            <form onSubmit={handleEditHours} className="space-y-6">
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Clock size={20} className="text-accent" />
                 </div>
                 <input 
                    type="number" 
                    step="0.1"
                    required 
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-accent rounded-2xl text-3xl font-bold text-gray-900 outline-none transition-all text-center" 
                    value={editHours} 
                    onChange={e => setEditHours(e.target.value)} 
                    autoFocus
                  />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-gray-500 hover:text-black font-medium transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-accent text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedEmisor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                <div className="bg-black p-8 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-white mb-1">{selectedEmisor.nombre}</h3>
                        <p className="text-gray-400 font-mono text-sm tracking-wider">ID: {selectedEmisor.bigo_id}</p>
                    </div>
                    <button onClick={() => setIsDetailsModalOpen(false)} className="text-white/50 hover:text-white transition-colors bg-white/10 rounded-full p-2">
                        <Activity size={20} />
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                             <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Horas</p>
                             <p className="text-3xl font-bold text-black">{selectedEmisor.horas_mes}</p>
                         </div>
                         <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center flex flex-col items-center justify-center">
                             <p className="text-xs font-bold text-gray-400 uppercase mb-2">Estado</p>
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedEmisor.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {selectedEmisor.estado}
                             </span>
                         </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                            <div className="flex items-center text-gray-500 gap-3">
                                <Globe size={20} className="text-black" />
                                <span className="font-medium">País</span>
                            </div>
                            <span className="font-semibold text-gray-900">{selectedEmisor.pais}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                             <div className="flex items-center text-gray-500 gap-3">
                                <Calendar size={20} className="text-primary" />
                                <span className="font-medium">Ingreso</span>
                            </div>
                            <span className="font-semibold text-gray-900">{selectedEmisor.mes_entrada || 'N/A'}</span>
                        </div>
                        {user.rol === 'admin' && (
                             <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                <div className="flex items-center text-gray-500 gap-3">
                                    <UserIcon size={20} className="text-accent" />
                                    <span className="font-medium">Reclutador</span>
                                </div>
                                <span className="font-semibold text-gray-900 text-xs font-mono bg-gray-100 px-2 py-1 rounded">{selectedEmisor.reclutador_id}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Emisores;