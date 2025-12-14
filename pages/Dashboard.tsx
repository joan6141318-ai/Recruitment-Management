
import React, { useEffect, useState } from 'react';
import { User, Emisor, SystemMetadata } from '../types';
import { dataService } from '../services/db';
import { Target, Users, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const GOAL_RECRUITMENT = 15;

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [recruiters, setRecruiters] = useState<User[]>([]);
  const [metadata, setMetadata] = useState<SystemMetadata>({ lastUpdated: '' });
  const [loading, setLoading] = useState(true);
  
  // Admin State
  const [editDate, setEditDate] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const [emisoresData, metaData] = await Promise.all([
        dataService.getEmisores(user),
        dataService.getMetadata()
    ]);
    
    if (user.rol === 'admin') {
        const users = await dataService.getRecruiters();
        setRecruiters(users);
    }

    setEmisores(emisoresData);
    setMetadata(metaData);
    setEditDate(metaData.lastUpdated);
    setLoading(false);
  };

  const handleUpdateDate = async () => {
      await dataService.updateMetadata(editDate);
      setMetadata({ ...metadata, lastUpdated: editDate });
      alert('Fecha actualizada');
  };

  // --- CALCULOS ---
  const currentMonthISO = new Date().toISOString().slice(0, 7); // YYYY-MM
  const myMonthlyEmitters = emisores.filter(e => e.mes_entrada === currentMonthISO);
  const totalRecruits = myMonthlyEmitters.length;
  const efficiencyPercent = Math.min((totalRecruits / GOAL_RECRUITMENT) * 100, 100);
  
  // Emisores Efectivos (>= 20h)
  const effectiveEmitters = emisores.filter(e => e.horas_mes >= 20).length;
  const effectivePercent = emisores.length > 0 ? (effectiveEmitters / emisores.length) * 100 : 0;

  if (loading) return <div className="p-8 text-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div></div>;

  return (
    <div className="space-y-6">
      
      {/* 1. FECHA ACTUALIZACION (Visible para todos) */}
      <div className="bg-black text-white p-4 rounded-xl flex justify-between items-center shadow-lg shadow-purple-900/20">
          <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Información Actualizada al</p>
              <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <span className="text-lg font-black">{metadata.lastUpdated || 'Pendiente'}</span>
              </div>
          </div>
          {/* Admin Date Control */}
          {user.rol === 'admin' && (
              <div className="flex gap-2">
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="text-black text-xs p-2 rounded outline-none" />
                  <button onClick={handleUpdateDate} className="bg-primary px-3 py-2 rounded text-xs font-bold uppercase">Guardar</button>
              </div>
          )}
      </div>

      {/* 2. VISTA RECLUTADOR */}
      {user.rol === 'reclutador' && (
          <div className="grid gap-4">
              {/* Card Meta Mensual */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-purple-600">
                      <Target size={100} />
                  </div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Mi Meta Mensual (15)</h3>
                  
                  <div className="flex items-end gap-2 mb-2">
                      <span className="text-5xl font-black text-black">{totalRecruits}</span>
                      <span className="text-sm font-bold text-gray-400 mb-2">/ 15 Ingresos</span>
                  </div>

                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${efficiencyPercent}%` }}></div>
                  </div>
                  <p className="text-right text-xs font-bold text-primary mt-2">{Math.round(efficiencyPercent)}% Efectividad</p>
              </div>

              {/* Card Calidad Emisores */}
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
                   <div>
                       <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Calidad de Cartera</h3>
                       <p className="text-sm font-bold text-gray-800">Emisores Efectivos ({'>'}20h)</p>
                       <p className="text-3xl font-black text-black mt-1">{effectiveEmitters} <span className="text-sm text-gray-400 font-medium">de {emisores.length}</span></p>
                   </div>
                   <div className="relative w-16 h-16 flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90">
                           <circle cx="32" cy="32" r="28" stroke="#f3f4f6" strokeWidth="6" fill="none" />
                           <circle cx="32" cy="32" r="28" stroke="#F97316" strokeWidth="6" fill="none" strokeDasharray="175" strokeDashoffset={175 - (175 * effectivePercent) / 100} />
                       </svg>
                       <span className="absolute text-xs font-bold">{Math.round(effectivePercent)}%</span>
                   </div>
              </div>
          </div>
      )}

      {/* 3. VISTA ADMIN */}
      {user.rol === 'admin' && (
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Total Emisores</p>
                  <p className="text-3xl font-black text-black">{emisores.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Reclutadores</p>
                  <p className="text-3xl font-black text-black">{recruiters.filter(r => r.rol === 'reclutador').length}</p>
              </div>
              
              <div className="col-span-2 bg-white p-5 rounded-xl border border-gray-200 mt-2">
                  <h3 className="text-xs font-bold text-black uppercase mb-4 flex items-center gap-2">
                      <Users size={14} /> Productividad por Reclutador
                  </h3>
                  <div className="space-y-4">
                      {recruiters.filter(r => r.rol === 'reclutador').map(rec => {
                          const count = emisores.filter(e => e.reclutador_id === rec.id).length;
                          return (
                              <div key={rec.id} className="flex justify-between items-center border-b border-gray-50 pb-2">
                                  <div>
                                      <p className="text-xs font-bold text-gray-900">{rec.nombre}</p>
                                      <p className="text-[10px] text-gray-400">{rec.correo}</p>
                                  </div>
                                  <div className="text-right">
                                      <span className="text-lg font-bold text-primary">{count}</span>
                                      <p className="text-[9px] text-gray-400 uppercase">Emisores</p>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
