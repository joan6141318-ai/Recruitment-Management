import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Search, Plus, Filter, MoreVertical, Edit2, Play, Pause } from 'lucide-react';

interface EmisoresProps {
  user: User;
}

const HOURS_GOAL = 44;

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

  // Form
  const [newEmisorName, setNewEmisorName] = useState('');
  const [newEmisorBigo, setNewEmisorBigo] = useState('');
  const [newEmisorCountry, setNewEmisorCountry] = useState('');
  const [newEmisorMonth, setNewEmisorMonth] = useState('');
  const [newEmisorRecruiterId, setNewEmisorRecruiterId] = useState(user.id);
  const [editHours, setEditHours] = useState<string | number>('');

  useEffect(() => {
    loadData();
  }, [user]);

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
    if (user.rol !== 'admin') return;
    await dataService.toggleStatus(emisor.id);
    loadData();
  };

  const openEdit = (emisor: Emisor) => {
    setSelectedEmisor(emisor);
    setEditHours(emisor.horas_mes);
    setIsEditModalOpen(true);
  };

  const inputClass = "w-full bg-white border border-gray-300 px-3 py-2 rounded text-xs text-black focus:outline-none focus:border-black transition-colors";

  return (
    <div className="pb-20">
      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-bold text-black uppercase tracking-tight">Emisores <span className="text-gray-400 text-sm ml-2 font-medium">{filtered.length} total</span></h2>
        
        <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                    type="text" 
                    placeholder="Buscar..." 
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs focus:border-black outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-black text-white px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1 hover:bg-gray-800"
            >
                <Plus size={14} /> Nuevo
            </button>
        </div>
      </div>

      {/* Grid Denso */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {loading ? (
           <div className="col-span-full text-center text-xs text-gray-500 py-10">Cargando...</div>
        ) : filtered.map((emisor) => {
            const percent = Math.min((emisor.horas_mes / HOURS_GOAL) * 100, 100);
            return (
              <div 
                  key={emisor.id} 
                  onClick={() => openEdit(emisor)}
                  className={`bg-white border rounded hover:border-black transition-colors cursor-pointer relative overflow-hidden group ${emisor.estado === 'pausado' ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}
              >
                  <div className="p-3">
                      <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-[9px] text-gray-400">ID: {emisor.bigo_id}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${emisor.estado === 'activo' ? 'bg-green-500' : 'bg-red-400'}`}></div>
                      </div>
                      
                      <h3 className="font-bold text-black text-xs uppercase truncate mb-2" title={emisor.nombre}>
                          {emisor.nombre.toLowerCase()}
                      </h3>

                      <div className="flex items-end justify-between">
                          <div>
                             <span className="text-lg font-black text-black leading-none">{emisor.horas_mes}</span>
                             <span className="text-[9px] text-gray-400 font-medium ml-0.5">/ {HOURS_GOAL}h</span>
                          </div>
                          <span className={`text-[9px] font-bold ${percent >= 100 ? 'text-green-600' : 'text-gray-500'}`}>{Math.round(percent)}%</span>
                      </div>
                  </div>
                  
                  {/* Progress Bar Bottom */}
                  <div className="w-full bg-gray-100 h-1">
                      <div className={`h-full ${percent >= 100 ? 'bg-green-500' : 'bg-black'}`} style={{ width: `${percent}%` }}></div>
                  </div>

                  {/* Hover Actions (Desktop) */}
                  {user.rol === 'admin' && (
                     <button 
                        onClick={(e) => toggleStatus(emisor, e)}
                        className="absolute top-1 right-1 p-1 bg-gray-100 rounded text-black opacity-0 group-hover:opacity-100 transition-opacity"
                        title={emisor.estado === 'activo' ? 'Pausar' : 'Activar'}
                     >
                        {emisor.estado === 'activo' ? <Pause size={10} /> : <Play size={10} />}
                     </button>
                  )}
              </div>
            );
        })}
      </div>

      {/* Modals Simplificados */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded w-full max-w-xs p-5 shadow-xl">
            <h3 className="text-sm font-bold uppercase mb-4 text-black">Agregar Emisor</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input required className={inputClass} value={newEmisorName} onChange={e => setNewEmisorName(e.target.value)} placeholder="Nombre" />
              <div className="grid grid-cols-2 gap-2">
                 <input required className={inputClass} value={newEmisorBigo} onChange={e => setNewEmisorBigo(e.target.value)} placeholder="ID BIGO" />
                 <input required type="month" className={inputClass} value={newEmisorMonth} onChange={e => setNewEmisorMonth(e.target.value)} />
              </div>
              <input required className={inputClass} value={newEmisorCountry} onChange={e => setNewEmisorCountry(e.target.value)} placeholder="País" />
              <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-xs font-bold uppercase rounded hover:bg-gray-200">Cancelar</button>
                  <button type="submit" className="flex-1 py-2 bg-black text-white text-xs font-bold uppercase rounded hover:bg-gray-800">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedEmisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded w-full max-w-[200px] p-4 shadow-xl text-center">
            <h3 className="text-xs font-bold uppercase mb-1 truncate">{selectedEmisor.nombre}</h3>
            <p className="text-[9px] text-gray-400 uppercase mb-4">Actualizar Horas</p>
            <form onSubmit={handleEditHours}>
              <input 
                type="number" step="0.1" autoFocus
                className="w-full text-center text-2xl font-black border-b border-black outline-none mb-4 pb-1"
                value={editHours} onChange={e => setEditHours(e.target.value)}
              />
              <button type="submit" className="w-full py-2 bg-black text-white text-xs font-bold uppercase rounded">OK</button>
            </form>
            <button onClick={() => setIsEditModalOpen(false)} className="mt-2 text-[9px] text-gray-400 underline">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emisores;