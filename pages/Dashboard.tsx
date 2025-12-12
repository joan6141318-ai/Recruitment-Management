import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Users, Clock, TrendingUp, Briefcase, AlertTriangle, CheckCircle, Target, Calendar, Info, Save, Award, UserPlus, Zap } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const TARGET_HOURS = 44;
const MIN_HOURS = 20;

// Recruitment Targets
const RECRUITMENT_TARGET_COUNT = 15;
const RECRUITMENT_BASE_HOURS = 20;

const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${color} text-white`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [recruiterCount, setRecruiterCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  // Admin Editing State
  const [editingDate, setEditingDate] = useState<string>('');
  const [isSavingDate, setIsSavingDate] = useState(false);

  // Time metrics for calculations
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = currentDay / daysInMonth; // 0 to 1
  const currentMonthISO = now.toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    const fetchData = async () => {
      const emisoresData = await dataService.getEmisores(user);
      const metadata = await dataService.getMetadata();
      setEmisores(emisoresData);
      setLastUpdated(metadata.lastUpdated);
      setEditingDate(metadata.lastUpdated);

      if (user.rol === 'admin') {
        const recruiters = await dataService.getRecruiters();
        setRecruiterCount(recruiters.length);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleUpdateDate = async () => {
    setIsSavingDate(true);
    await dataService.updateMetadata(editingDate);
    setLastUpdated(editingDate);
    setIsSavingDate(false);
  };

  // Calculations
  const totalEmisores = emisores.length;
  const activeEmisores = emisores.filter(e => e.estado === 'activo').length;
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);
  
  // Recruitment Metrics (New Recruits this month)
  const newRecruits = emisores.filter(e => e.mes_entrada === currentMonthISO);
  const newRecruitsCount = newRecruits.length;
  const recruitmentProgress = Math.min((newRecruitsCount / RECRUITMENT_TARGET_COUNT) * 100, 100);
  const validRecruitsCount = newRecruits.filter(e => e.horas_mes >= RECRUITMENT_BASE_HOURS).length;

  // Data for chart: Top 5 emisores by hours
  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 5)
    .map(e => ({ name: e.nombre, hours: e.horas_mes }));

  // Metric Helper for General Performance
  const getEmisorStatus = (hours: number) => {
    // Regla de Oro: >= 44 Horas
    if (hours >= TARGET_HOURS) return { label: 'Meta Cumplida', color: 'bg-purple-100 text-purple-700', icon: CheckCircle };
    
    // Regla Interna: >= 20 Horas = Productivo
    if (hours >= MIN_HOURS) return { label: 'Productivo', color: 'bg-green-100 text-green-700', icon: Award };

    // Analisis de riesgo para < 20 Horas
    if (monthProgress > 0.8) return { label: 'Crítico', color: 'bg-red-100 text-red-700', icon: AlertTriangle };
    
    // Expected hours based on day of month (linear projection)
    const expectedHours = TARGET_HOURS * monthProgress;
    
    // If they are more than 20% behind schedule
    if (hours < expectedHours * 0.8) return { label: 'En Riesgo', color: 'bg-gray-100 text-gray-600', icon: TrendingUp };
    
    return { label: 'En Proceso', color: 'bg-gray-50 text-gray-500', icon: Activity };
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6">
      
      {/* Top Section: User Greeting & System Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hola, {user.nombre} 👋</h2>
          
          {/* Last Update Info */}
          <div className="flex items-center space-x-2 mt-2 text-gray-500 text-sm">
            <Calendar size={14} className="text-primary"/>
            <span className="font-medium">Datos al: {lastUpdated}</span>
          </div>
        </div>

        {/* Admin Date Control */}
        {user.rol === 'admin' && (
           <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
              <label className="block text-xs font-bold text-purple-900 uppercase mb-2">Fecha de Actualización</label>
              <div className="flex gap-2">
                 <input 
                   type="date" 
                   className="bg-white border border-purple-200 text-gray-900 rounded-lg px-3 py-1.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-medium transition-all shadow-sm"
                   value={editingDate}
                   onChange={(e) => setEditingDate(e.target.value)}
                 />
                 <button 
                  onClick={handleUpdateDate}
                  disabled={isSavingDate}
                  className="bg-primary hover:bg-purple-800 text-white px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors disabled:opacity-70 shadow-sm"
                 >
                   {isSavingDate ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save size={16} />}
                 </button>
              </div>
           </div>
        )}
      </div>

      {/* Recruitment Targets Module (For Recruiters) */}
      {user.rol === 'reclutador' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
               <Target size={100} className="text-primary" />
           </div>
           
           <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                  <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          <UserPlus className="mr-2 text-primary" size={20} />
                          Gestión de Reclutamiento - Mes Actual
                      </h3>
                      <p className="text-sm text-gray-500">Objetivo: <span className="font-bold text-gray-800">{RECRUITMENT_TARGET_COUNT} Emisores</span></p>
                  </div>
                  <div className="text-right">
                       <span className="text-3xl font-bold text-primary">{newRecruitsCount}</span>
                       <span className="text-gray-400 text-lg">/{RECRUITMENT_TARGET_COUNT}</span>
                  </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-4 mb-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-purple-900 h-4 rounded-full transition-all duration-1000" 
                    style={{ width: `${recruitmentProgress}%` }}
                  ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-6">
                  <span>Inicio</span>
                  <span>{Math.round(recruitmentProgress)}% Completado</span>
              </div>

              {/* Quality Metric */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-center justify-between">
                      <div>
                          <p className="text-xs font-bold text-purple-700 uppercase">Emisores Ingresados</p>
                          <p className="text-xs text-purple-600">Total registrados este mes</p>
                      </div>
                      <span className="text-2xl font-bold text-purple-800">{newRecruitsCount}</span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                      <div>
                           <p className="text-xs font-bold text-gray-700 uppercase">Productivos ({RECRUITMENT_BASE_HOURS}h+)</p>
                           <p className="text-xs text-gray-600">Emisores válidos para meta</p>
                      </div>
                      <div className="text-right">
                          <span className="text-2xl font-bold text-gray-800">{validRecruitsCount}</span>
                          <span className="text-xs text-gray-400 block">/ {newRecruitsCount}</span>
                      </div>
                  </div>
              </div>

              {/* List of New Recruits */}
              <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                      <Clock size={14} className="mr-2"/> Desglose de Emisores Nuevos
                  </h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                      {newRecruits.length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-sm">No has ingresado emisores este mes aún.</div>
                      ) : (
                          <table className="w-full text-sm">
                              <thead className="bg-gray-100 text-gray-500 text-xs text-left">
                                  <tr>
                                      <th className="p-3 font-medium">Nombre</th>
                                      <th className="p-3 font-medium text-center">Horas</th>
                                      <th className="p-3 font-medium text-center">Estado</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                  {newRecruits.map(e => (
                                      <tr key={e.id}>
                                          <td className="p-3">
                                              <span className="font-medium text-gray-800">{e.nombre}</span>
                                              <span className="block text-xs text-gray-400">{e.bigo_id}</span>
                                          </td>
                                          <td className="p-3 text-center font-bold">{e.horas_mes}h</td>
                                          <td className="p-3 text-center">
                                              {e.horas_mes >= RECRUITMENT_BASE_HOURS ? (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                      <Award size={10} className="mr-1"/> Productivo
                                                  </span>
                                              ) : (
                                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                                      <Clock size={10} className="mr-1"/> En proceso
                                                  </span>
                                              )}
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      )}
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Emisores" 
          value={totalEmisores} 
          icon={Users} 
          color="bg-primary" 
        />
        <StatCard 
          title="Emisores Activos" 
          value={activeEmisores} 
          icon={Activity} 
          color="bg-gray-800" 
        />
        <StatCard 
          title="Horas Totales (Mes)" 
          value={totalHours} 
          icon={Clock} 
          color="bg-secondary" 
        />
        {user.rol === 'admin' ? (
           <StatCard 
           title="Total Reclutadores" 
           value={recruiterCount} 
           icon={Briefcase} 
           color="bg-gray-700" 
         />
        ) : (
            <StatCard 
            title="Meta Promedio" 
            value={`${Math.round(totalHours / (totalEmisores || 1))}h`} 
            icon={Target} 
            color="bg-gray-700" 
          />
        )}
      </div>

      {/* Performance Database Table (For Recruiters mostly, but visible to Admin) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
             <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center">
                    <Activity className="mr-2 text-primary" size={20}/> 
                    Rendimiento Mensual
                </h3>
             </div>
             {/* Legend for large screens */}
             <div className="hidden lg:flex gap-3 text-xs">
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div>Meta (44h)</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Productivo (20h+)</div>
                 <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Crítico</div>
             </div>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                    <tr>
                        <th className="px-6 py-4">Emisor</th>
                        <th className="px-6 py-4 text-center">Horas Actuales</th>
                        <th className="px-6 py-4 w-1/3">Progreso vs Meta (44h)</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {emisores.sort((a,b) => b.horas_mes - a.horas_mes).map(emisor => {
                        const percent = Math.min((emisor.horas_mes / TARGET_HOURS) * 100, 100);
                        const status = getEmisorStatus(emisor.horas_mes);
                        const StatusIcon = status.icon;

                        return (
                            <tr key={emisor.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900">{emisor.nombre}</span>
                                        <span className="text-xs text-gray-400">ID: {emisor.bigo_id}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-lg font-bold text-gray-800">{emisor.horas_mes}</span>
                                    <span className="text-xs text-gray-400 block">hrs</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${percent >= 100 ? 'bg-purple-600' : emisor.horas_mes >= MIN_HOURS ? 'bg-green-500' : 'bg-primary'}`} 
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-bold w-8 text-right">{Math.round(percent)}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                        <StatusIcon size={12} />
                                        {status.label}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

        {/* Keeping the Chart for visual summary */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="mr-2 text-primary" size={20}/> 
            Ranking de Horas
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 12}} />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                cursor={{fill: '#f3f4f6'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#7e22ce' : '#111827'} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
    </div>
  );
};

export default Dashboard;