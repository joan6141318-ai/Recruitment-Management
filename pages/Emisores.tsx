import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, MoreVertical, X, Clock, MapPin, Calendar } from 'lucide-react';

interface EmisoresProps {
  user: User;
}

const Emisores: React.FC<EmisoresProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [filtered, setFiltered] = useState<Emisor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'pausado'>('all');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmisor, setSelectedEmisor] = useState<Emisor | null>(null);
  
  // Forms
  const [newEmisorName, setNewEmisorName] = useState('');
  const [newEmisorBigo, setNewEmisorBigo] = useState('');
  const [newEmisorCountry, setNewEmisorCountry] = useState('');
  const [newEmisorMonth, setNewEmisorMonth] = useState('');
  const [editHours, setEditHours] = useState<string | number>('');

  useEffect(() => { loadData(); }, [user]);

  useEffect(() => {
    let result = emisores;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(e => e.nombre.toLowerCase().includes(lower) || e.bigo_id.toLowerCase().includes(lower));
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
      nombre: newEmisorName, bigo_id: newEmisorBigo, pais: newEmisorCountry, mes_entrada: newEmisorMonth, reclutador_id: user.id
    }, user);
    setIsAddModalOpen(false); loadData();
    setNewEmisorName(''); setNewEmisorBigo(''); setNewEmisorCountry(''); setNewEmisorMonth('');
  };

  const handleEditHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmisor) return;
    await dataService.updateHours(selectedEmisor.id, Number(editHours), user.id);
    setIsEditModalOpen(false); loadData();
  };

  const toggleStatus = async (emisor: Emisor, e: React.MouseEvent) => {
     e.stopPropagation();
     if(user.rol !== 'admin') return;
     await dataService.toggleStatus(emisor.id);
     loadData();
  }

  return (
    <div className="pb-10 space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 sticky top-0 z-20">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar por Nombre o ID..." 
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-black outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex gap-2 w-full md:w-auto">
             <div className="flex bg-gray-100 p-1 rounded-xl">
                 <button onClick={() => setStatusFilter('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>Todos</button>
                 <button onClick={() => setStatusFilter('activo')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFilter === 'activo' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>Activos</button>
             </div>
             <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-black text-white px-5 py-2 rounded-xl flex items-center gap-2 font-bold text-sm shadow-lg hover:bg-gray-900 transition-colors ml-auto"
            >
                <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
            </button>
         </div>
      </div>

      {/* Modern Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {loading ? <div className="col-span-full text-center py-20 text-gray-400">Cargando emisores...</div> : 
         filtered.map((emisor) => {
            const hours = emisor.horas_mes;
            const progress = Math.min((hours/44)*100, 100);
            
            // Modern Status Logic
            let progressColor = 'bg-gray-900';
            if (emisor.estado === 'activo') {
                if (hours >= 44) progressColor = 'bg-green-500';
                else if (hours >= 20) progressColor = 'bg-blue-500';
                else progressColor = 'bg-orange-500';
            }

            return (
              <div 
                  key={emisor.id} 
                  onClick={() => { setSelectedEmisor(emisor); setEditHours(emisor.horas_mes); setIsEditModalOpen(true); }}
                  className={`bg-white rounded-2xl p-5 relative cursor-pointer group hover:-translate-y-1 transition-all duration-300 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-100 ${emisor.estado === 'pausado' ? 'opacity-60 grayscale' : ''}`}
              >
                  <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-sm font-bold text-gray-500 border border-gray-100">
                          {emisor.nombre.charAt(0).toUpperCase()}
                      </div>
                      {user.rol === 'admin' && (
                          <button 
                            onClick={(e) => toggleStatus(emisor, e)}
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                          >
                              <MoreVertical size={16} />
                          </button>
                      )}
                  </div>

                  <div>
                      <h3 className="font-bold text-gray-900 text-base capitalize truncate pr-4">{emisor.nombre.toLowerCase()}</h3>
                      <p className="text-xs text-gray-400 font-medium font-mono mt-0.5 flex items-center gap-1">
                        ID: {emisor.bigo_id}
                      </p>
                  </div>

                  <div className="mt-5 mb-2 flex items-end gap-1">
                      <span className="text-3xl font-black text-gray-900 leading-none">{hours}</span>
                      <span className="text-xs font-bold text-gray-400 mb-1">/ 44h</span>
                  </div>
                  
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${progressColor} transition-all duration-500`} style={{width: `${progress}%`}}></div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                      <span className="flex items-center gap-1"><MapPin size={10}/> {emisor.pais || 'N/A'}</span>
                      <span className="flex items-center gap-1"><Calendar size={10}/> {emisor.mes_entrada || 'N/A'}</span>
                  </div>
              </div>
            );
          })
        }
      </div>

      {/* Modal Agregar - Clean Design */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-pop-in">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Registrar Emisor</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
               <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Nombre Completo</label>
                   <input required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors font-medium" value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} placeholder="Ej. Ana García" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">ID Bigo</label>
                       <input required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors font-medium" value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} />
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Ingreso</label>
                       <input required type="month" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors font-medium" value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                   </div>
               </div>
               <div>
                   <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">País</label>
                   <input required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-primary focus:bg-white transition-colors font-medium" value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} placeholder="Ej. Colombia" />
               </div>
               <button type="submit" className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-transform active:scale-95 mt-4">Guardar Registro</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Horas - Clean Typography */}
      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-[300px] p-8 shadow-2xl text-center animate-pop-in">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <Clock size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 truncate mb-1">{selectedEmisor.nombre}</h3>
                <p className="text-xs text-gray-400 font-medium mb-6">Actualizar horas del mes</p>
                <form onSubmit={handleEditHours}>
                    <div className="relative w-full mb-6">
                        <input 
                            type="number" step="0.1" autoFocus
                            className="w-full text-center text-5xl font-black text-gray-900 border-none outline-none bg-transparent placeholder-gray-200"
                            placeholder="0"
                            value={editHours} onChange={e => setEditHours(e.target.value)}
                        />
                        <span className="block text-xs font-bold text-gray-400 uppercase mt-2">Horas</span>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-purple-500/20">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Emisores;