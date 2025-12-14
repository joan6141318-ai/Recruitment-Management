import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, MoreVertical, X } from 'lucide-react';

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
    <div className="pb-10">
      {/* Header Tools - Compact */}
      <div className="flex gap-2 mb-3 sticky top-0 bg-gray-50 py-2 z-10">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" 
                placeholder="Buscar (Nombre o ID)..." 
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-black shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-black text-white px-4 rounded-lg flex items-center justify-center shadow-sm active:bg-gray-800"
        >
            <Plus size={18} />
        </button>
      </div>

      {/* Grid Denso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {loading ? <p className="text-center text-xs text-gray-400 mt-10">Cargando...</p> : 
         filtered.map((emisor) => {
            const hours = emisor.horas_mes;
            let borderClass = 'border-l-4 border-l-gray-300';
            
            // Visual Color Indicator (Left Border)
            if (emisor.estado === 'activo') {
                if (hours >= 44) borderClass = 'border-l-4 border-l-green-500';
                else if (hours >= 20) borderClass = 'border-l-4 border-l-blue-500';
                else borderClass = 'border-l-4 border-l-orange-500';
            }

            return (
              <div 
                  key={emisor.id} 
                  onClick={() => { setSelectedEmisor(emisor); setEditHours(emisor.horas_mes); setIsEditModalOpen(true); }}
                  className={`bg-white border border-gray-200 rounded-md p-3 relative cursor-pointer active:bg-gray-50 ${borderClass} shadow-sm`}
              >
                  <div className="flex justify-between items-start">
                      <div className="overflow-hidden">
                          <h3 className="font-bold text-gray-900 text-xs uppercase truncate w-40">{emisor.nombre}</h3>
                          <p className="text-[10px] text-gray-500 font-mono">ID: {emisor.bigo_id}</p>
                      </div>
                      <div className="text-right">
                          <span className="block text-lg font-bold text-gray-900 leading-none">{hours}</span>
                          <span className="text-[9px] text-gray-400">horas</span>
                      </div>
                  </div>
                  
                  {/* Progress Bar Simple */}
                  <div className="mt-2 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${hours >= 44 ? 'bg-green-500' : 'bg-gray-800'}`} style={{width: `${Math.min((hours/44)*100, 100)}%`}}></div>
                  </div>

                  {user.rol === 'admin' && (
                      <button 
                        onClick={(e) => toggleStatus(emisor, e)}
                        className="absolute bottom-2 right-2 text-gray-300 hover:text-black p-1"
                      >
                          <MoreVertical size={14} />
                      </button>
                  )}
              </div>
            );
          })
        }
      </div>

      {/* MODAL AGREGAR - Standard Utility */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-sm p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase">Nuevo Emisor</h3>
                <button onClick={() => setIsAddModalOpen(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
               <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                   <input required className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-black" value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-3">
                   <div>
                       <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">ID Bigo</label>
                       <input required className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-black" value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} />
                   </div>
                   <div>
                       <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mes Ingreso</label>
                       <input required type="month" className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-black" value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                   </div>
               </div>
               <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">País</label>
                   <input required className="w-full border border-gray-300 p-2 rounded text-sm outline-none focus:border-black" value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} />
               </div>
               <button type="submit" className="w-full py-2.5 bg-black text-white rounded font-bold text-xs uppercase mt-2">Guardar Registro</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR HORAS - Standard Utility */}
      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg w-full max-w-[260px] p-5 shadow-2xl text-center">
                <h3 className="text-sm font-bold text-gray-900 truncate mb-1">{selectedEmisor.nombre}</h3>
                <p className="text-[10px] text-gray-400 uppercase mb-4">Editar Horas</p>
                <form onSubmit={handleEditHours}>
                    <div className="relative w-32 mx-auto">
                        <input 
                            type="number" step="0.1" autoFocus
                            className="w-full text-center text-3xl font-bold text-black border-b border-gray-300 focus:border-black outline-none pb-1 bg-transparent"
                            value={editHours} onChange={e => setEditHours(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-5">
                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="py-2 bg-gray-100 text-gray-600 rounded text-xs font-bold">Cancelar</button>
                        <button type="submit" className="py-2 bg-black text-white rounded text-xs font-bold">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default Emisores;