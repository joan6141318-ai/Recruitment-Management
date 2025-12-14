import React, { useEffect, useState } from 'react';
import { User, Emisor, SystemMetadata } from '../types';
import { dataService } from '../services/db';
import { TrendingUp, Users, Clock, Calendar, BarChart3, Radio } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, YAxis } from 'recharts';

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
  const effectiveEmitters = emisores.filter(e => e.horas_mes >= 20).length;
  
  // Datos para Gráfica
  const chartData = [
    { name: 'Meta', value: GOAL_RECRUITMENT, color: '#F3E8FF' }, // Morado muy claro
    { name: 'Actual', value: totalRecruits, color: '#7C3AED' }, // Morado Principal
  ];

  if (loading) return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8 animate-pop-in pb-8">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
          <div>
              <h1 className="text-3xl font-black text-black tracking-tighter">Hola, {user.nombre.split(' ')[0]}</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                  Resumen de rendimiento
              </p>
          </div>
          <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Cierre</p>
              {user.rol === 'admin' && isEditingDate ? (
                  <div className="flex items-center gap-2 bg-white p-1 rounded border border-gray-200 shadow-sm">
                      <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="text-xs outline-none" />
                      <button onClick={handleUpdateDate} className="text-[10px] font-bold bg-black text-white px-2 py-1 rounded">OK</button>
                  </div>
              ) : (
                  <div className="flex items-center justify-end gap-2 bg-gray-100 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => user.rol === 'admin' && setIsEditingDate(true)}>
                      <Calendar size={14} className="text-black" />
                      <span className="text-xs font-bold text-black">{metadata.lastUpdated || 'Sin definir'}</span>
                  </div>
              )}
          </div>
      </div>

      {/* VISTA RECLUTADOR */}
      {user.rol === 'reclutador' && (
          <div className="grid gap-6">
              
              {/* GRAFICA DE RENDIMIENTO - DISEÑO MODERNO */}
              <div className="bg-white p-6 rounded-3xl shadow-card border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-black rounded-xl text-white">
                          <BarChart3 size={20} />
                      </div>
                      <div>
                          <h3 className="text-base font-black text-black">Objetivo Mensual</h3>
                          <p className="text-xs text-gray-400 font-bold">Reclutamiento</p>
                      </div>
                  </div>

                  <div className="h-[180px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} layout="vertical" barSize={32} margin={{ left: -20, right: 30 }}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#9CA3AF' }} width={60}/>
                              <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                              />
                              <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                  {chartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 px-2">
                      <span className="text-xs font-bold text-gray-400">Progreso</span>
                      <span className="text-lg font-black text-primary">{Math.round((totalRecruits / GOAL_RECRUITMENT) * 100)}%</span>
                  </div>
              </div>

              {/* KPIS MODERNOS */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-3xl shadow-card border border-gray-100 flex flex-col justify-between h-[140px]">
                      <div className="w-10 h-10 rounded-full bg-primaryLight flex items-center justify-center text-primary mb-2">
                          <Radio size={20} />
                      </div>
                      <div>
                          <p className="text-3xl font-black text-black tracking-tight">{emisores.length}</p>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Cartera</p>
                      </div>
                  </div>

                  <div className="bg-white p-5 rounded-3xl shadow-card border border-gray-100 flex flex-col justify-between h-[140px]">
                      <div className="w-10 h-10 rounded-full bg-accentLight flex items-center justify-center text-accent mb-2">
                          <Clock size={20} />
                      </div>
                      <div>
                          <p className="text-3xl font-black text-black tracking-tight">{effectiveEmitters}</p>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Activos {'>'} 20h</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* VISTA ADMIN */}
      {user.rol === 'admin' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-black text-white p-6 rounded-3xl shadow-lg shadow-black/20">
                    <Users size={24} className="mb-4 opacity-80" />
                    <p className="text-xs font-bold opacity-60 uppercase tracking-wider mb-1">Reclutadores</p>
                    <p className="text-4xl font-black tracking-tighter">{recruiters.filter(r => r.rol === 'reclutador').length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                    <Radio size={24} className="mb-4 text-primary" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Emisores Totales</p>
                    <p className="text-4xl font-black text-black tracking-tighter">{emisores.length}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-card overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-sm font-black text-black uppercase tracking-wide">Ranking Equipo</h3>
                    <TrendingUp size={16} className="text-gray-400"/>
                </div>
                <div className="divide-y divide-gray-50">
                    {recruiters.filter(r => r.rol === 'reclutador').map((rec, i) => {
                        const count = emisores.filter(e => e.reclutador_id === rec.id).length;
                        return (
                            <div key={rec.id} className="px-6 py-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                                    <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-sm font-black text-black border border-gray-100">
                                        {rec.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-black">{rec.nombre}</p>
                                        <div className="h-1.5 w-24 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${Math.min((count/20)*100, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-black text-black">{count}</span>
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