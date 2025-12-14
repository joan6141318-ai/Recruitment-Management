import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, MoreVertical, X, Lock } from 'lucide-react';

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

  const isAdmin = user.rol === 'admin';

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
    if (!selectedEmisor || !isAdmin) return; // DOBLE SEGURIDAD
    await dataService.updateHours(selectedEmisor.id, Number(editHours), user.id);
    setIsEditModalOpen(false); loadData();
  };

  const toggleStatus = async (emisor: Emisor, e: React.MouseEvent) => {
     e.stopPropagation();
     if(!isAdmin) return;
     await dataService.toggleStatus(emisor.id);
     loadData();
  }

  const openEditModal = (emisor: Emisor) => {
      if (!isAdmin) return; // Reclutador no puede abrir modal
      setSelectedEmisor(emisor);
      setEditHours(emisor.horas_mes);
      setIsEditModalOpen(true);
  };

  return (
    <div className="pb-10 space-y-6">
      
      {/* Header Tools */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Buscar emisor..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-black focus:ring-0 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex gap-2 w-full md:w-auto">
             <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none"
             >
                 <option value="all">Todos</option>
                 <option value="activo">Activos</option>
                 <option value="pausado">Pausados</option>
             </select>
             
             <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium text-sm hover:bg-gray-800 transition-colors ml-auto"
            >
                <Plus size={18} /> <span className="hidden sm:inline">Nuevo</span>
            </button>
         </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? <div className="col-span-full text-center py-10 text-gray-400 text-sm">Cargando...</div> : 
         filtered.map((emisor) => {
            const hours = emisor.horas_mes;
            
            return (
              <div 
                  key={emisor.id} 
                  onClick={() => openEditModal(emisor)}
                  className={`
                    bg-white border border-gray-200 rounded-xl p-5 relative transition-all shadow-sm
                    ${isAdmin ? 'cursor-pointer hover:border-gray-400' : 'cursor-default'}
                    ${emisor.estado === 'pausado' ? 'opacity-60 bg-gray-50' : ''}
                  `}
              >
                  <div className="flex justify-between items-start mb-3">
                      <div>
                          <h3 className="font-bold text-gray-900 text-sm uppercase truncate w-40">{emisor.nombre}</h3>
                          <p className="text-xs text-gray-500 font-mono">ID: {emisor.bigo_id}</p>
                      </div>
                      <div className="text-right">
                          <span className={`block text-xl font-bold ${hours >= 44 ? 'text-green-600' : 'text-black'}`}>{hours}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Horas</span>
                      </div>
                  </div>
                  
                  {/* Barra de progreso sobria */}
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-3">
                      <div 
                        className={`h-full ${hours >= 44 ? 'bg-green-600' : hours >= 20 ? 'bg-black' : 'bg-gray-400'}`} 
                        style={{width: `${Math.min((hours/44)*100, 100)}%`}}
                      ></div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                      <span>{emisor.pais}</span>
                      {!isAdmin && <Lock size={12} className="text-gray-300" />}
                  </div>

                  {isAdmin && (
                      <button 
                        onClick={(e) => toggleStatus(emisor, e)}
                        className="absolute top-4 right-4 text-gray-300 hover:text-black transition-colors"
                      >
                          <MoreVertical size={16} />
                      </button>
                  )}
              </div>
            );
          })
        }
      </div>

      {/* Modal Agregar */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-base font-bold text-black uppercase tracking-wide">Nuevo Emisor</h3>
                <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
               <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                   <input required className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-black" value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-3">
                   <div>
                       <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ID Bigo</label>
                       <input required className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-black" value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} />
                   </div>
                   <div>
                       <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mes</label>
                       <input required type="month" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-black" value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                   </div>
               </div>
               <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">País</label>
                   <input required className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-black" value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} />
               </div>
               <button type="submit" className="w-full py-3 bg-black text-white rounded-lg font-bold text-xs uppercase tracking-wider mt-2">Guardar</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Horas (SOLO ADMIN PUEDE VER ESTO) */}
      {isEditModalOpen && selectedEmisor && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-[280px] p-6 shadow-2xl text-center">
                <h3 className="text-sm font-bold text-gray-900 mb-1">{selectedEmisor.nombre}</h3>
                <p className="text-[10px] text-gray-500 uppercase mb-6">Modificar Horas</p>
                <form onSubmit={handleEditHours}>
                    <input 
                        type="number" step="0.1" autoFocus
                        className="w-full text-center text-4xl font-bold text-black border-b border-gray-200 focus:border-black outline-none pb-2 bg-transparent"
                        value={editHours} onChange={e => setEditHours(e.target.value)}
                    />
                    <div className="flex gap-2 mt-6">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase">Cancelar</button>
                        <button type="submit" className="flex-1 py-2.5 bg-black text-white rounded-lg text-xs font-bold uppercase">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Emisores;