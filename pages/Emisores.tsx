import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, Filter, Edit2, PlayCircle, PauseCircle, Clock, Eye, Calendar, Globe, User as UserIcon, Activity, Award } from 'lucide-react';

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
  
  // Bug fix: use string | number to handle empty input correctly
  const [editHours, setEditHours] = useState<string | number>('');

  // Load Recruiters for Admin dropdown
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
    
    // Reset and reload
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

  const inputClass = "w-full bg-white border border-gray-200 p-2.5 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Emisores</h2>
          <p className="text-gray-500 text-sm">Gestiona el talento de la agencia</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary hover:bg-purple-800 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 shadow-md transition-colors"
        >
          <Plus size={18} />
          <span>Registrar Emisor</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o BIGO ID..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <select 
            className="w-full sm:w-40 pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none transition-shadow"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="activo">Activos</option>
            <option value="pausado">Pausados</option>
          </select>
          <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
           <p className="text-center text-gray-400 col-span-full py-10">Cargando datos...</p>
        ) : filtered.length === 0 ? (
           <div className="col-span-full text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
             <p className="text-gray-500">No se encontraron emisores</p>
           </div>
        ) : (
          filtered.map(emisor => (
            <div key={emisor.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative group">
               <button 
                  onClick={() => openDetails(emisor)}
                  className="absolute top-4 right-4 text-gray-300 group-hover:text-primary transition-colors"
               >
                 <Eye size={20} />
               </button>
              <div className="p-5">
                <div className="flex justify-between items-start mb-4 pr-6">
                  <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-lg">{emisor.nombre}</h3>
                        {/* PRODUCTIVE BADGE */}
                        {emisor.horas_mes >= 20 && (
                            <span title="Emisor Productivo (+20h)" className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider flex items-center">
                                <Award size={10} className="mr-1" /> Productivo
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-mono bg-gray-50 text-gray-500 px-2 py-1 rounded border border-gray-100">ID: {emisor.bigo_id}</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                   <div className="flex items-center space-x-2">
                       <span className={`w-2 h-2 rounded-full ${emisor.estado === 'activo' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                       <span className="capitalize">{emisor.estado}</span>
                   </div>
                  <div className="flex justify-between">
                    <span>Horas Mes:</span>
                    <span className="font-bold text-secondary text-base">{emisor.horas_mes} hrs</span>
                  </div>
                </div>

                {user.rol === 'admin' && (
                  <div className="flex gap-2 pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => openEdit(emisor)}
                      className="flex-1 bg-white border border-primary text-primary hover:bg-primary hover:text-white py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2"
                    >
                      <Edit2 size={14} /> Horas
                    </button>
                    <button 
                      onClick={() => toggleStatus(emisor)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex justify-center items-center gap-2 border ${
                        emisor.estado === 'activo' 
                          ? 'border-red-200 text-red-600 hover:bg-red-50' 
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {emisor.estado === 'activo' ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Registrar Nuevo Emisor</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre</label>
                <input required className={inputClass} value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">BIGO ID</label>
                    <input required className={inputClass} value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Mes de Entrada</label>
                    <input required type="month" className={inputClass} value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">País</label>
                <input required className={inputClass} value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} />
              </div>
              
              {user.rol === 'admin' && (
                <div>
                   <label className="block text-sm text-gray-600 mb-1">Asignar a Reclutador</label>
                   <select 
                    className={inputClass} 
                    value={newEmisorRecruiterId} 
                    onChange={e => setNewEmisorRecruiterId(e.target.value)}
                   >
                     <option value={user.id}>Yo (Admin)</option>
                     {recruiters.map(r => (
                       <option key={r.id} value={r.id}>{r.nombre}</option>
                     ))}
                   </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-purple-800 transition-colors shadow-md">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hours Modal */}
      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Editar Horas</h3>
            <p className="text-sm text-gray-500 mb-4">{selectedEmisor.nombre} ({selectedEmisor.bigo_id})</p>
            
            <form onSubmit={handleEditHours} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Horas Totales del Mes</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400" size={18} />
                  <input 
                    type="number" 
                    step="0.1"
                    required 
                    className="w-full pl-10 border border-gray-200 bg-white p-2.5 rounded-lg text-lg font-bold text-gray-900 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all shadow-sm" 
                    value={editHours} 
                    onChange={e => setEditHours(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-secondary text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedEmisor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-primary/5 p-6 flex justify-between items-start border-b border-gray-100">
                    <div>
                        <h3 className="text-2xl font-bold text-primary">{selectedEmisor.nombre}</h3>
                        <p className="text-gray-600 font-mono">ID: {selectedEmisor.bigo_id}</p>
                    </div>
                     <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                             <div className="flex items-center text-gray-500 mb-1 text-xs uppercase tracking-wide">
                                 <Clock size={12} className="mr-1" /> Horas Mes
                             </div>
                             <p className="text-xl font-bold text-secondary">{selectedEmisor.horas_mes} hrs</p>
                         </div>
                         <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                             <div className="flex items-center text-gray-500 mb-1 text-xs uppercase tracking-wide">
                                 <Activity size={12} className="mr-1" /> Estado
                             </div>
                             <span className={`px-2 py-0.5 rounded text-sm font-semibold ${selectedEmisor.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {selectedEmisor.estado}
                             </span>
                         </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                            <div className="flex items-center text-gray-600">
                                <Globe size={18} className="mr-3 text-gray-400" />
                                <span>País</span>
                            </div>
                            <span className="font-medium">{selectedEmisor.pais}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                             <div className="flex items-center text-gray-600">
                                <Calendar size={18} className="mr-3 text-gray-400" />
                                <span>Mes de Entrada</span>
                            </div>
                            <span className="font-medium">{selectedEmisor.mes_entrada || 'N/A'}</span>
                        </div>
                        {user.rol === 'admin' && (
                             <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                <div className="flex items-center text-gray-600">
                                    <UserIcon size={18} className="mr-3 text-gray-400" />
                                    <span>Reclutador ID</span>
                                </div>
                                <span className="font-medium text-sm text-gray-500">{selectedEmisor.reclutador_id}</span>
                            </div>
                        )}
                         <div className="flex items-center justify-between pb-2">
                             <div className="flex items-center text-gray-600">
                                <Calendar size={18} className="mr-3 text-gray-400" />
                                <span>Registrado</span>
                            </div>
                            <span className="font-medium text-sm">{new Date(selectedEmisor.fecha_registro).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                    <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-500 font-medium hover:text-gray-800 transition-colors">
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