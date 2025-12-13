import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, MoreVertical, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

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

  // Cálculo de ritmo
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  const paceMin = (GOAL_MIN / daysInMonth) * currentDay;

  return (
    <div className="pb-20">
      {/* Header Tools */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight uppercase">Emisores</h2>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                <span>{filtered.length} Registros</span>
                <span className="text-gray-300">|</span>
                <span>Objetivo: 20h - 44h</span>
            </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                    type="text" 
                    placeholder="Buscar nombre o ID..." 
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-xs focus:border-black outline-none transition-colors shadow-sm placeholder:text-gray-400 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-gray-800 shadow-sm whitespace-nowrap"
            >
                <Plus size={14} /> Nuevo
            </button>
        </div>
      </div>

      {/* Grid de Alta Densidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {loading ? (
           <div className="col-span-full text-center py-12 text-xs text-gray-500">Cargando datos...</div>
        ) : filtered.length === 0 ? (
           <div className="col-span-full text-center py-12 bg-white rounded-md border border-gray-200 border-dashed">
             <p className="text-gray-400 font-medium text-xs uppercase">Sin resultados</p>
           </div>
        ) : (
          filtered.map((emisor) => {
            const hours = emisor.horas_mes;
            let statusColor = 'bg-gray-200'; 
            let statusText = '';
            
            // Lógica de Estado (Riesgo, En camino, Bueno, Meta)
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
                  className={`bg-white border rounded-md p-3 cursor-pointer relative group transition-all duration-200 hover:shadow-md hover:border-gray-400 ${emisor.estado === 'pausado' ? 'opacity-60 bg-gray-50' : 'border-gray-200'}`}
              >
                  <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-xs capitalize truncate w-32" title={emisor.nombre}>
                              {emisor.nombre.toLowerCase()}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400">{emisor.bigo_id}</span>
                      </div>
                      
                      <div className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide text-white ${statusColor} ${emisor.estado === 'pausado' ? 'text-gray-500 bg-gray-200' : ''}`}>
                          {statusText}
                      </div>
                  </div>

                  <div className="mt-3">
                      <div className="flex justify-between items-end mb-1">
                          <div className="flex items-baseline gap-1">
                             <span className="text-xl font-bold text-gray-900 leading-none">{hours}</span>
                             <span className="text-[10px] text-gray-400">hrs</span>
                          </div>
                      </div>
                      
                      {/* Barra de Progreso segmentada */}
                      <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          {/* Marca de 20h (aprox 45% de 44h) */}
                          <div className="absolute left-[45%] top-0 bottom-0 w-0.5 bg-white z-10"></div>
                          <div 
                             className={`h-full rounded-full transition-all duration-500 ${statusColor}`} 
                             style={{ width: `${percentMax}%` }}
                          ></div>
                      </div>
                      
                      <div className="flex justify-between text-[8px] text-gray-400 mt-1 font-medium">
                          <span>0</span>
                          <span>20</span>
                          <span>44</span>
                      </div>
                  </div>

                  {user.rol === 'admin' && (
                      <button 
                        onClick={(e) => toggleStatus(emisor, e)}
                        className="absolute bottom-2 right-2 text-gray-300 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          <MoreVertical size={14} />
                      </button>
                  )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals con estilo profesional */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Registrar Nuevo Emisor</h3>
            <form onSubmit={handleAdd} className="space-y-3">
               <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nombre Completo</label>
                  <input required className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none transition-colors" value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-3">
                   <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">ID Bigo</label>
                        <input required className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none transition-colors" value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} />
                   </div>
                   <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Mes Ingreso</label>
                        <input required type="month" className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none transition-colors" value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                   </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">País</label>
                  <input required className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-black outline-none transition-colors" value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} />
               </div>
               <div className="flex gap-2 pt-3">
                   <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded hover:bg-gray-200 transition-colors">Cancelar</button>
                   <button type="submit" className="flex-1 py-2 bg-black text-white text-xs font-bold uppercase rounded hover:bg-gray-800 transition-colors">Guardar</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-lg w-full max-w-[280px] p-6 shadow-xl border border-gray-100 text-center">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1 truncate">{selectedEmisor.nombre}</h3>
                <p className="text-[10px] text-gray-500 mb-6">Actualizar Horas Transmisión</p>
                <form onSubmit={handleEditHours}>
                    <div className="relative mb-6">
                        <input 
                            type="number" step="0.1" autoFocus
                            className="w-full text-center text-3xl font-bold text-gray-900 border-b border-gray-200 focus:border-black outline-none pb-2 transition-colors bg-transparent"
                            value={editHours} onChange={e => setEditHours(e.target.value)}
                        />
                        <span className="text-[10px] text-gray-400 absolute bottom-3 right-4">hrs</span>
                    </div>
                    <button type="submit" className="w-full py-2 bg-black text-white text-xs font-bold uppercase rounded hover:bg-gray-800 transition-colors">Confirmar</button>
                </form>
                <button onClick={() => setIsEditModalOpen(false)} className="mt-4 text-[10px] text-gray-400 font-medium hover:text-gray-600">Cancelar</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Emisores;