import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, MoreVertical } from 'lucide-react';

interface EmisoresProps {
  user: User;
}

const GOAL_MIN = 20;

const Emisores: React.FC<EmisoresProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [filtered, setFiltered] = useState<Emisor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'pausado'>('all');
  const [loading, setLoading] = useState(true);

  // Modals & Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmisor, setSelectedEmisor] = useState<Emisor | null>(null);
  
  const [newEmisorName, setNewEmisorName] = useState('');
  const [newEmisorBigo, setNewEmisorBigo] = useState('');
  const [newEmisorCountry, setNewEmisorCountry] = useState('');
  const [newEmisorMonth, setNewEmisorMonth] = useState('');
  const [editHours, setEditHours] = useState<string | number>('');

  const [currentDate] = useState(new Date());

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

  const openEdit = (emisor: Emisor) => {
    setSelectedEmisor(emisor);
    setEditHours(emisor.horas_mes);
    setIsEditModalOpen(true);
  };

  // Pace Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  const paceMin = (GOAL_MIN / daysInMonth) * currentDay;

  return (
    <div>
      {/* Header Tools */}
      <div className="flex gap-2 mb-4 sticky top-0 bg-gray-50 pt-2 pb-2 z-10">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" 
                placeholder="Buscar emisor..." 
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-black shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-black text-white px-4 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
            <Plus size={20} />
        </button>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? <p className="text-center text-sm text-gray-400 mt-10">Cargando...</p> : 
         filtered.map((emisor) => {
            const hours = emisor.horas_mes;
            let statusColor = 'bg-gray-100 text-gray-500';
            
            // Logic Colors
            if (emisor.estado === 'activo') {
                if (hours >= GOAL_MIN && hours < 44) statusColor = 'bg-blue-100 text-blue-700';
                else if (hours >= 44) statusColor = 'bg-green-100 text-green-700';
                else if (hours < paceMin) statusColor = 'bg-red-100 text-red-700';
                else statusColor = 'bg-yellow-100 text-yellow-700';
            }

            return (
              <div 
                  key={emisor.id} 
                  onClick={() => openEdit(emisor)}
                  className={`bg-white border border-gray-200 rounded-xl p-4 relative active:scale-[0.99] transition-transform ${emisor.estado === 'pausado' ? 'opacity-60' : ''}`}
              >
                  <div className="flex justify-between items-start">
                      <div>
                          <h3 className="font-bold text-gray-900 capitalize text-sm">{emisor.nombre.toLowerCase()}</h3>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">{emisor.bigo_id}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColor}`}>
                          {hours.toFixed(1)} h
                      </span>
                  </div>

                  {user.rol === 'admin' && (
                      <button 
                        onClick={(e) => toggleStatus(emisor, e)}
                        className="absolute bottom-3 right-3 text-gray-300 p-2 -mr-2 -mb-2"
                      >
                          <MoreVertical size={16} />
                      </button>
                  )}
              </div>
            );
          })
        }
      </div>

      {/* Modals (Manteniendo funcionalidad) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Nuevo Emisor</h3>
            <form onSubmit={handleAdd} className="space-y-3">
               <input required placeholder="Nombre Completo" className="w-full border border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-black" value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} />
               <div className="flex gap-3">
                   <input required placeholder="ID Bigo" className="w-full border border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-black" value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} />
                   <input required type="month" className="w-full border border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-black" value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
               </div>
               <input required placeholder="País" className="w-full border border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-black" value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} />
               
               <div className="flex gap-3 pt-2">
                   <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-sm">Cancelar</button>
                   <button type="submit" className="flex-1 py-3 bg-black text-white rounded-xl font-bold text-sm">Guardar</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-[280px] p-6 shadow-2xl text-center">
                <p className="text-xs text-gray-400 mb-2 font-bold uppercase">Actualizar Horas</p>
                <h3 className="text-base font-bold text-gray-900 mb-6 truncate">{selectedEmisor.nombre}</h3>
                <form onSubmit={handleEditHours}>
                    <input 
                        type="number" step="0.1" autoFocus
                        className="w-full text-center text-5xl font-black text-black border-b-2 border-gray-100 focus:border-black outline-none pb-2 mb-6 bg-transparent"
                        value={editHours} onChange={e => setEditHours(e.target.value)}
                    />
                    <button type="submit" className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm">Confirmar</button>
                </form>
                <button onClick={() => setIsEditModalOpen(false)} className="mt-4 text-xs text-gray-400 font-bold px-4 py-2">Cancelar</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Emisores;