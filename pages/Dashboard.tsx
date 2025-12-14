import React, { useEffect, useState } from 'react';
import { User, Emisor, SystemMetadata } from '../types';
import { dataService } from '../services/db';
import { TrendingUp, Users, Clock, AlertCircle, Calendar } from 'lucide-react';

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
  const [isEditingDate, setIsEditingDate] = useState(false);

  useEffect(() => { loadData(); }, [user]);

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
      setIsEditingDate(false);
  };

  // --- CALCULOS ---
  const currentMonthISO = new Date().toISOString().slice(0, 7);
  const myMonthlyEmitters = emisores.filter(e => e.mes_entrada === currentMonthISO);
  const totalRecruits = myMonthlyEmitters.length;
  const efficiencyPercent = Math.min((totalRecruits / GOAL_RECRUITMENT) * 100, 100);
  const effectiveEmitters = emisores.filter(e => e.horas_mes >= 20).length;
  const effectivePercent = emisores.length > 0 ? (effectiveEmitters / emisores.length) * 100 : 0;

  if (loading) return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8 animate-pop-in">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
          <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Panel Principal</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                  Resumen de actividad y métricas
              </p>
          </div>
          <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Actualizado</p>
              {user.rol === 'admin' && isEditingDate ? (
                  <div className="flex items-center gap-2 bg-white p-1 rounded border border-gray-200 shadow-sm">
                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="text-xs outline-none" />
                      <button onClick={handleUpdateDate} className="text-[10px] font-bold bg-black text-white px-2 py-1 rounded">OK</button>
                  </div>
              ) : (
                  <div className="flex items-center justify-end gap-1 cursor-pointer" onClick={() => user.rol === 'admin' && setIsEditingDate(true)}>
                      <span className="text-sm font-bold text-gray-900">{metadata.lastUpdated || '-'}</span>
                      {user.rol === 'admin' && <Calendar size={12} className="text-gray-400" />}
                  </div>
              )}
          </div>
      </div>

      {/* VISTA RECLUTADOR - Clean Cards */}
      {user.rol === 'reclutador' && (
          <div className="grid gap-5">
              
              {/* TARJETA 1: META MENSUAL */}
              <div className="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100">
                  <div className="flex justify-between items-start mb-6">
                      <div className="bg-purple-50 p-3 rounded-xl">
                          <TrendingUp className="text-primary" size={20} />
                      </div>
                      <span className="text-xs font-bold bg-gray-50 text-gray-600 px-2 py-1 rounded-md">
                          Meta: {GOAL_RECRUITMENT}
                      </span>
                  </div>
                  
                  <div className="flex items-baseline gap-1">
                      <h2 className="text-4xl font-bold text-gray-900 tracking-tight">{totalRecruits}</h2>
                      <span className="text-sm text-gray-500 font-medium">ingresos este mes</span>
                  </div>

                  <div className="mt-4 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${efficiencyPercent}%` }}></div>
                  </div>
                  <p className="mt-2 text-right text-xs font-semibold text-primary">
                      {Math.round(efficiencyPercent)}% Completado
                  </p>
              </div>

              {/* TARJETA 2: EFECTIVIDAD */}
              <div className="bg-white p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                      <div className="bg-orange-50 p-3 rounded-xl">
                          <Clock className="text-accent" size={20} />
                      </div>
                  </div>
                  
                  <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Efectividad de Cartera</p>
                  <div className="flex items-baseline gap-2">
                       <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{Math.round(effectivePercent)}%</h2>
                       <span className="text-sm font-medium text-gray-500">activos {'>'} 20h</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                      {effectiveEmitters} de {emisores.length} emisores cumplen el mínimo.
                  </p>
              </div>
          </div>
      )}

      {/* VISTA ADMIN - Tablas limpias */}
      {user.rol === 'admin' && (
          <>
            {/* KPI GRID */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Emisores</p>
                    <p className="text-2xl font-bold text-gray-900">{emisores.length}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <p className="text-xs text-gray-500 font-medium mb-1">Total Reclutadores</p>
                    <p className="text-2xl font-bold text-gray-900">{recruiters.filter(r => r.rol === 'reclutador').length}</p>
                </div>
            </div>

            {/* TABLA DE RENDIMIENTO */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-900">Rendimiento por Reclutador</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {recruiters.filter(r => r.rol === 'reclutador').map(rec => {
                        const count = emisores.filter(e => e.reclutador_id === rec.id).length;
                        return (
                            <div key={rec.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                                        {rec.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{rec.nombre}</p>
                                        <p className="text-[10px] text-gray-400">{rec.correo}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-bold text-gray-900">{count}</span>
                                    <span className="text-xs text-gray-400 ml-1">emisores</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
          </>
      )}
    </div>
  );
};

export default Dashboard;