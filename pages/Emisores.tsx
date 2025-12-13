import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, Filter, Edit2, MoreHorizontal, AlertCircle, CheckCircle } from 'lucide-react';

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
    resetForm();
  };

  const handleEditHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmisor) return;
    await dataService.updateHours(selectedEmisor.id, Number(editHours), user.id);
    setIsEditModalOpen(false); loadData();
  };

  const resetForm = () => {
     setNewEmisorName(''); setNewEmisorBigo(''); setNewEmisorCountry(''); setNewEmisorMonth('');
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
    <div className="pb-20 max-w-7xl mx-auto">
      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Gestión de Emisores</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>Total: {filtered.length}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>Meta Base: 20h - 44h</span>
            </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre o ID..." 
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-black outline-none transition-colors shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-gray-800 shadow-sm whitespace-nowrap"
            >
                <Plus size={16} /> Nuevo
            </button>
        </div>
      </div>

      {/* Grid de Alta Densidad */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
           <div className="col-span-full text-center py-12 text-sm text-gray-500">Cargando emisores...</div>
        ) : filtered.length === 0 ? (
           <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200 border-dashed">
             <p className="text-gray-400 font-medium">No se encontraron resultados</p>
           </div>
        ) : (
          filtered.map((emisor) => {
            // Lógica de color de barra y estado
            const hours = emisor.horas_mes;
            let statusColor = 'bg-gray-200'; // Default
            let statusIcon = null;

            if (emisor.estado === 'activo') {
                if (hours >= GOAL_MAX) {
                    statusColor = 'bg-green-500';
                    statusIcon = <CheckCircle size={14} className="text-green-600" />;
                } else if (hours < paceMin) {
                    statusColor = 'bg-red-500'; // Riesgo
                    statusIcon = <AlertCircle size={14} className="text-red-500" />;
                } else if (hours >= GOAL_MIN) {
                    statusColor = 'bg-yellow-400'; // En rango
                } else {
                    statusColor = 'bg-blue-400'; // En camino
                }
            }

            const percentMax = Math.min((hours / GOAL_MAX) * 100, 100);

            return (
              <div 
                  key={emisor.id} 
                  onClick={() => openEdit(emisor)}
                  className={`bg-white border rounded-lg p-4 cursor-pointer relative group transition-all duration-200 hover:shadow-md hover:border-gray-300 ${emisor.estado === 'pausado' ? 'opacity-60 bg-gray-50' : 'border-gray-200'}`}
              >
                  <div className="flex justify-between items-start mb-2">
                      <div>
                          <h3 className="font-bold text-gray-900 text-sm truncate w-40 capitalize" title={emisor.nombre}>
                              {emisor.nombre.toLowerCase()}
                          </h3>
                          <p className="font-mono text-[10px] text-gray-400">ID: {emisor.bigo_id}</p>
                      </div>
                      <div className="flex items-center gap-1">
                          {statusIcon}
                          <div className={`w-2 h-2 rounded-full ${emisor.estado === 'activo' ? 'bg-green-500' : 'bg-red-400'}`}></div>
                      </div>
                  </div>

                  <div className="mt-4">
                      <div className="flex justify-between items-end mb-1">
                          <span className="text-2xl font-bold text-gray-900 tracking-tight">{hours} <span className="text-xs text-gray-400 font-medium">hrs</span></span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Meta: 44h</span>
                      </div>
                      
                      {/* Barra de Progreso segmentada */}
                      <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          {/* Marca de 20h */}
                          <div className="absolute left-[45%] top-0 bottom-0 w-0.5 bg-white z-10 opacity-50"></div>
                          <div 
                             className={`h-full rounded-full transition-all duration-500 ${statusColor}`} 
                             style={{ width: `${percentMax}%` }}
                          ></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-400 mt-1 font-medium">
                          <span>0h</span>
                          <span>20h</span>
                          <span>44h</span>
                      </div>
                  </div>

                  {user.rol === 'admin' && (
                      <button 
                        onClick={(e) => toggleStatus(emisor, e)}
                        className="absolute top-2 right-2 p-1 text-gray-300 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          <MoreHorizontal size={16} />
                      </button>
                  )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals simplificados para mantener el estilo profesional */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Emisor</h3>
            <form onSubmit={handleAdd} className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre</label>
                  <input required className="w-full border border-gray-300 rounded p-2 text-sm focus:border-black outline-none" value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-3">
                   <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">ID Bigo</label>
                        <input required className="w-full border border-gray-300 rounded p-2 text-sm focus:border-black outline-none" value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} />
                   </div>
                   <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Ingreso</label>
                        <input required type="month" className="w-full border border-gray-300 rounded p-2 text-sm focus:border-black outline-none" value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
                   </div>
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">País</label>
                  <input required className="w-full border border-gray-300 rounded p-2 text-sm focus:border-black outline-none" value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} />
               </div>
               <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded hover:bg-gray-200">Cancelar</button>
                   <button type="submit" className="flex-1 py-2.5 bg-black text-white text-xs font-bold uppercase rounded hover:bg-gray-800">Guardar</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-lg w-full max-w-[280px] p-6 shadow-xl text-center">
                <h3 className="text-sm font-bold text-gray-900 capitalize mb-1">{selectedEmisor.nombre.toLowerCase()}</h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wide mb-6">Actualizar Horas</p>
                <form onSubmit={handleEditHours}>
                    <div className="relative mb-6">
                        <input 
                            type="number" step="0.1" autoFocus
                            className="w-full text-center text-4xl font-bold text-gray-900 border-b-2 border-gray-200 focus:border-black outline-none pb-2 transition-colors"
                            value={editHours} onChange={e => setEditHours(e.target.value)}
                        />
                        <span className="text-xs text-gray-400 absolute bottom-3 right-0">h</span>
                    </div>
                    <button type="submit" className="w-full py-2.5 bg-black text-white text-xs font-bold uppercase rounded hover:bg-gray-800">Actualizar</button>
                </form>
                <button onClick={() => setIsEditModalOpen(false)} className="mt-4 text-[10px] text-gray-400 font-medium underline">Cancelar</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Emisores;