import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, Filter, Edit2, Eye, X } from 'lucide-react';

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

  const inputClass = "w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-black font-medium text-sm focus:outline-none focus:bg-white focus:border-black transition-all";

  return (
    <div className="space-y-6 animate-slide-up pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-black tracking-tight">Emisores</h2>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
        >
          <Plus size={18} />
          <span className="font-bold text-xs uppercase tracking-wide">Nuevo Emisor</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por ID o nombre..." 
            className="w-full pl-11 pr-4 py-2.5 bg-transparent rounded-xl focus:outline-none text-black font-medium text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-2">
          <select 
            className="w-full sm:w-auto h-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl focus:outline-none appearance-none cursor-pointer font-bold text-xs uppercase text-gray-600 transition-colors"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="activo">Activos</option>
            <option value="pausado">Pausados</option>
          </select>
          <Filter className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none opacity-50" size={14} />
        </div>
      </div>

      {/* List - Compact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
           <div className="col-span-full flex justify-center py-10"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : filtered.length === 0 ? (
           <div className="col-span-full text-center py-16">
             <p className="text-gray-400 font-medium text-sm">No se encontraron emisores</p>
           </div>
        ) : (
          filtered.map((emisor) => (
            <div 
                key={emisor.id} 
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all duration-200 group relative"
            >
                <div className={`absolute top-5 right-5 w-2 h-2 rounded-full ${emisor.estado === 'activo' ? 'bg-green-500' : 'bg-red-400'}`}></div>

               <div className="mb-4 pr-4">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">ID: {emisor.bigo_id}</div>
                  <h3 className="font-bold text-black text-lg leading-tight capitalize truncate">
                    {emisor.nombre.toLowerCase()}
                  </h3>
               </div>
                
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase">Horas</p>
                        <p className="text-2xl font-black text-black">{emisor.horas_mes}</p>
                    </div>
                    
                    <button 
                        onClick={() => openDetails(emisor)}
                        className="p-2 rounded-full bg-gray-50 text-gray-600 hover:bg-black hover:text-white transition-colors"
                    >
                        <Eye size={18} />
                    </button>
                </div>

                {user.rol === 'admin' && (
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-50">
                    <button 
                      onClick={() => openEdit(emisor)}
                      className="py-2 rounded-lg text-[10px] font-bold uppercase bg-gray-50 text-black hover:bg-gray-100 transition-colors flex justify-center items-center gap-1"
                    >
                      <Edit2 size={12} /> Editar
                    </button>
                    <button 
                      onClick={() => toggleStatus(emisor)}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                        emisor.estado === 'activo' 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-pop-in">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 p-1.5 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-colors"><X size={16}/></button>
            
            <h3 className="text-xl font-bold mb-6 text-black">Nuevo Emisor</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Nombre</label>
                <input required className={inputClass} value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} placeholder="Nombre Completo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">BIGO ID</label>
                    <input required className={inputClass} value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} placeholder="00000" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Ingreso</label>
                    <input required type="month" className={inputClass} value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">País</label>
                <input required className={inputClass} value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} placeholder="País" />
              </div>
              
              {user.rol === 'admin' && (
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5">Reclutador</label>
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
                </div>
              )}

              <div className="pt-4">
                <button type="submit" className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm uppercase hover:bg-gray-800 transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hours Modal */}
      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 shadow-2xl relative animate-pop-in">
             <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 p-1.5 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-colors"><X size={16}/></button>

            <h3 className="text-lg font-bold mb-1">Horas</h3>
            <p className="text-xs text-gray-400 mb-6 font-medium capitalize">{selectedEmisor.nombre.toLowerCase()}</p>
            
            <form onSubmit={handleEditHours} className="space-y-6">
              <div className="relative">
                 <input 
                    type="number" 
                    step="0.1"
                    required 
                    className="w-full py-2 bg-transparent border-b-2 border-black text-4xl font-black text-black outline-none text-center focus:border-primary transition-colors" 
                    value={editHours} 
                    onChange={e => setEditHours(e.target.value)} 
                    autoFocus
                    placeholder="0"
                  />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3 bg-black text-white rounded-xl font-bold text-xs uppercase hover:bg-gray-800 transition-all">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedEmisor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative animate-pop-in">
                <button onClick={() => setIsDetailsModalOpen(false)} className="absolute top-4 right-4 p-1.5 bg-white/10 text-white rounded-full hover:bg-white hover:text-black transition-colors z-10"><X size={16}/></button>

                <div className="bg-black p-6 relative overflow-hidden">
                    <h3 className="text-xl font-bold text-white mb-1 capitalize relative z-10">{selectedEmisor.nombre.toLowerCase()}</h3>
                    <p className="text-gray-400 font-medium text-xs tracking-wider uppercase relative z-10">ID: {selectedEmisor.bigo_id}</p>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100">
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total Horas</p>
                             <p className="text-2xl font-black text-black">{selectedEmisor.horas_mes}</p>
                         </div>
                         <div className="bg-gray-50 p-4 rounded-xl text-center flex flex-col items-center justify-center border border-gray-100">
                             <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Estado</p>
                             <div className={`w-3 h-3 rounded-full ${selectedEmisor.estado === 'activo' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                         </div>
                    </div>

                    <div className="space-y-0 text-sm">
                        <div className="flex items-center justify-between py-3 border-b border-gray-50">
                            <span className="font-medium text-gray-500">País</span>
                            <span className="font-bold text-black">{selectedEmisor.pais}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-b border-gray-50">
                            <span className="font-medium text-gray-500">Fecha Ingreso</span>
                            <span className="font-bold text-black">{selectedEmisor.mes_entrada || '—'}</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Emisores;