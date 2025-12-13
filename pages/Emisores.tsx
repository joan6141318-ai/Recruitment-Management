import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, MoreVertical, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EmisoresProps {
  user: User;
}

const GOAL_MIN = 20;
const GOAL_MAX = 44;

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

  // Form Data
  const [newEmisorName, setNewEmisorName] = useState('');
  const [newEmisorBigo, setNewEmisorBigo] = useState('');
  const [newEmisorCountry, setNewEmisorCountry] = useState('');
  const [newEmisorMonth, setNewEmisorMonth] = useState('');
  const [newEmisorRecruiterId, setNewEmisorRecruiterId] = useState(user.id);
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
      nombre: newEmisorName, bigo_id: newEmisorBigo, pais: newEmisorCountry, mes_entrada: newEmisorMonth, reclutador_id: newEmisorRecruiterId
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
    <div className="pb-20">
      {/* Header & Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Mis Emisores</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span className="font-bold text-black">{filtered.length}</span>
                <span>Registros</span>
                <span className="text-gray-300">|</span>
                <span>Meta: 20h - 44h</span>
            </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:border-black outline-none transition-colors shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-black text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-gray-800 shadow-sm whitespace-nowrap"
            >
                <Plus size={14} /> Nuevo
            </button>
        </div>
      </div>

      {/* Dense Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {loading ? (
           <div className="col-span-full text-center py-12 text-xs text-gray-400">Cargando emisores...</div>
        ) : filtered.length === 0 ? (
           <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
             <p className="text-gray-400 font-medium text-xs uppercase">No hay emisores registrados</p>
           </div>
        ) : (
          filtered.map((emisor) => {
            const hours = emisor.horas_mes;
            let statusColor = 'bg-gray-200'; 
            let statusText = '';
            
            if (emisor.estado === 'activo') {
                if (hours >= GOAL_MAX) {
                    statusColor = 'bg-green-500';
                    statusText = 'Meta Cumplida';
                } else if (hours >= GOAL_MIN) {
                    statusColor = 'bg-yellow-400';
                    statusText = 'Buen Rendimiento';
                } else if (hours >= paceMin) {
                    statusColor = 'bg-blue-400';
                    statusText = 'En Camino';
                } else {
                    statusColor = 'bg-red-500';
                    statusText = 'Riesgo';
                }
            } else {
                statusText = 'Pausado';
            }

            const percentMax = Math.min((hours / GOAL_MAX) * 100, 100);

            return (
              <div 
                  key={emisor.id} 
                  onClick={() => openEdit(emisor)}
                  className={`bg-white border rounded-lg p-4 cursor-pointer relative group transition-all duration-200 hover:shadow-md hover:border-gray-400 ${emisor.estado === 'pausado' ? 'opacity-60 bg-gray-50' : 'border-gray-200'}`}
              >
                  <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col overflow-hidden">
                          <span className="font-bold text-gray-900 text-sm capitalize truncate" title={emisor.nombre}>
                              {emisor.nombre.toLowerCase()}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400 mt-0.5">{emisor.bigo_id}</span>
                      </div>
                      
                      <div className={`shrink-0 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wide text-white ${statusColor} ${emisor.estado === 'pausado' ? 'text-gray-500 bg-gray-200' : ''}`}>
                          {statusText}
                      </div>
                  </div>

                  <div className="mt-2">
                      <div className="flex items-baseline gap-1 mb-1.5">
                         <span className="text-2xl font-bold text-gray-900 leading-none">{hours}</span>
                         <span className="text-[10px] text-gray-400 font-medium">hrs</span>
                      </div>
                      
                      {/* Segmented Progress Bar */}
                      <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          {/* Markers for 20h (~45%) */}
                          <div className="absolute left-[45%] top-0 bottom-0 w-0.5 bg-white z-10 opacity-70"></div>
                          <div 
                             className={`h-full rounded-full transition-all duration-500 ${statusColor}`} 
                             style={{ width: `${percentMax}%` }}
                          ></div>
                      </div>
                      
                      <div className="flex justify-between text-[9px] text-gray-400 mt-1 font-semibold">
                          <span>0h</span>
                          <span>20h</span>
                          <span>44h</span>
                      </div>
                  </div>

                  {user.rol === 'admin' && (
                      <button 
                        onClick={(e) => toggleStatus(emisor, e)}
                        className="absolute bottom-3 right-3 text-gray-300 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                          <MoreVertical size={14} />
                      </button>
                  )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-5">Registrar Nuevo Emisor</h3>
            <form onSubmit={handleAdd} className="space-y-4">
               <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Nombre Completo</label>
                  <input required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-black outline-none transition-colors" value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">ID Bigo</label>
                        <input required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-black outline-none transition-colors" value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} />
                   </div>
                   <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">Mes Ingreso</label>
                        <input required type="month" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-black outline-none transition-colors" value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                   </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5">País</label>
                  <input required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:border-black outline-none transition-colors" value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} />
               </div>
               <div className="flex gap-3 pt-4">
                   <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 bg-gray-50 text-gray-600 text-xs font-bold uppercase rounded-lg hover:bg-gray-100 transition-colors">Cancelar</button>
                   <button type="submit" className="flex-1 py-3 bg-black text-white text-xs font-bold uppercase rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/20">Guardar</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-[300px] p-6 shadow-2xl border border-gray-100 text-center">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1 truncate">{selectedEmisor.nombre}</h3>
                <p className="text-[10px] text-gray-400 mb-8 font-medium">Actualizar Horas Transmisión</p>
                <form onSubmit={handleEditHours}>
                    <div className="relative mb-8">
                        <input 
                            type="number" step="0.1" autoFocus
                            className="w-full text-center text-4xl font-bold text-gray-900 border-b-2 border-gray-100 focus:border-black outline-none pb-2 transition-colors bg-transparent"
                            value={editHours} onChange={e => setEditHours(e.target.value)}
                        />
                        <span className="text-[10px] font-bold text-gray-400 absolute bottom-3 right-2 uppercase">hrs</span>
                    </div>
                    <button type="submit" className="w-full py-3 bg-black text-white text-xs font-bold uppercase rounded-lg hover:bg-gray-800 transition-colors shadow-lg shadow-black/20">Confirmar</button>
                </form>
                <button onClick={() => setIsEditModalOpen(false)} className="mt-4 text-[10px] text-gray-400 font-bold hover:text-gray-600 uppercase tracking-wide">Cancelar</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Emisores;