import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Users, Clock, TrendingUp, Briefcase, AlertTriangle, CheckCircle, Target, Calendar, Save, Award, UserPlus, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const TARGET_HOURS = 44;
const MIN_HOURS = 20;

// Recruitment Targets
const RECRUITMENT_TARGET_COUNT = 15;
const RECRUITMENT_BASE_HOURS = 20;

const StatCard = ({ title, value, icon: Icon, colorClass, iconColor, delay }: { title: string, value: string | number, icon: any, colorClass: string, iconColor: string, delay: string }) => (
  <div 
    className="bg-white p-6 rounded-[1.25rem] shadow-card border border-gray-100 flex items-center space-x-5 hover:translate-y-[-4px] hover:shadow-soft transition-all duration-300 h-full animate-slide-up"
    style={{ animationDelay: delay }}
  >
    <div className={`p-4 rounded-2xl ${colorClass} transition-colors duration-300`}>
      <Icon size={24} className={iconColor} strokeWidth={2.5} />
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-secondary tracking-tight">{value}</h3>
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

  // Time metrics
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = currentDay / daysInMonth; 
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthISO = `${year}-${month}`;

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

  const totalEmisores = emisores.length;
  const activeEmisores = emisores.filter(e => e.estado === 'activo').length;
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);
  
  const newRecruits = emisores.filter(e => e.mes_entrada === currentMonthISO);
  const newRecruitsCount = newRecruits.length;
  const recruitmentProgress = Math.min((newRecruitsCount / RECRUITMENT_TARGET_COUNT) * 100, 100);
  const validRecruitsCount = newRecruits.filter(e => e.horas_mes >= RECRUITMENT_BASE_HOURS).length;

  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 5)
    .map(e => ({ name: e.nombre, hours: e.horas_mes }));

  const getEmisorStatus = (hours: number) => {
    if (hours >= TARGET_HOURS) return { label: 'Meta', color: 'bg-purple-100 text-primary', icon: Crown };
    if (hours >= MIN_HOURS) return { label: 'Productivo', color: 'bg-green-100 text-green-700', icon: Zap };
    if (monthProgress > 0.8) return { label: 'Crítico', color: 'bg-red-50 text-red-600', icon: AlertTriangle };
    
    const expectedHours = TARGET_HOURS * monthProgress;
    if (hours < expectedHours * 0.8) return { label: 'Riesgo', color: 'bg-orange-50 text-accent', icon: TrendingUp };
    
    return { label: 'Proceso', color: 'bg-gray-50 text-gray-500', icon: Activity };
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-8">
      
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold text-secondary tracking-tight">Hola, {user.nombre}</h2>
          <div className="flex items-center space-x-2 mt-1 text-gray-400 text-sm font-medium">
            <Calendar size={14} />
            <span>Actualizado: {lastUpdated}</span>
          </div>
        </div>

        {/* Admin Date Control */}
        {user.rol === 'admin' && (
           <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex gap-2">
                 <input 
                   type="date" 
                   className="bg-transparent text-secondary rounded-lg px-3 py-1.5 text-sm outline-none font-medium"
                   value={editingDate}
                   onChange={(e) => setEditingDate(e.target.value)}
                 />
                 <button 
                  onClick={handleUpdateDate}
                  disabled={isSavingDate}
                  className="bg-secondary hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm flex items-center transition-colors shadow-lg shadow-black/10"
                 >
                   {isSavingDate ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save size={16} />}
                 </button>
           </div>
        )}
      </div>

      {/* Recruitment Targets Module (Reclutadores) */}
      {user.rol === 'reclutador' && (
        <div className="bg-gradient-to-br from-secondary via-gray-900 to-black rounded-[2rem] shadow-2xl shadow-black/10 p-6 md:p-8 relative overflow-hidden text-white animate-scale-in">
           <div className="absolute top-0 right-0 p-8 opacity-[0.08] pointer-events-none">
               <Target size={200} />
           </div>
           
           <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                  <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                          <UserPlus className="text-accent" size={24} />
                          Reclutamiento Mensual
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">Objetivo: <span className="text-white font-bold">{RECRUITMENT_TARGET_COUNT} Emisores</span></p>
                  </div>
                  <div className="text-right">
                       <span className="text-5xl font-bold text-accent tracking-tighter">{newRecruitsCount}</span>
                       <span className="text-gray-600 text-xl font-medium">/{RECRUITMENT_TARGET_COUNT}</span>
                  </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/5 rounded-full h-4 mb-8 backdrop-blur-sm border border-white/5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-accent to-orange-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(249,115,22,0.4)] relative" 
                    style={{ width: `${recruitmentProgress}%` }}
                  >
                      <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 animate-pulse"></div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Total Ingresos</p>
                      <span className="text-2xl font-bold text-white">{newRecruitsCount}</span>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest">Productivos ({RECRUITMENT_BASE_HOURS}h+)</p>
                      <span className="text-2xl font-bold text-accent">{validRecruitsCount}</span>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Emisores" 
          value={totalEmisores} 
          icon={Users} 
          colorClass="bg-purple-50 group-hover:bg-primary/10"
          iconColor="text-primary"
          delay="100ms"
        />
        <StatCard 
          title="Emisores Activos" 
          value={activeEmisores} 
          icon={Activity} 
          colorClass="bg-orange-50 group-hover:bg-accent/10"
          iconColor="text-accent"
          delay="200ms"
        />
        <StatCard 
          title="Horas del Mes" 
          value={totalHours} 
          icon={Clock} 
          colorClass="bg-gray-100 group-hover:bg-gray-200"
          iconColor="text-secondary"
          delay="300ms"
        />
        {user.rol === 'admin' ? (
           <Link to="/reclutadores" className="block hover:no-underline cursor-pointer group">
             <StatCard 
               title="Equipo" 
               value={recruiterCount} 
               icon={Briefcase} 
               colorClass="bg-gray-50 group-hover:bg-gray-200" 
               iconColor="text-gray-600"
               delay="400ms"
             />
           </Link>
        ) : (
            <StatCard 
            title="Promedio / Emisor" 
            value={`${Math.round(totalHours / (totalEmisores || 1))}h`} 
            icon={Target} 
            colorClass="bg-gray-50" 
            iconColor="text-gray-600"
            delay="400ms"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-[1.5rem] shadow-card border border-gray-100 overflow-hidden flex flex-col animate-slide-up" style={{animationDelay: '500ms'}}>
            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <h3 className="font-bold text-secondary flex items-center gap-2">
                    <Activity size={18} className="text-secondary"/> 
                    Rendimiento
                </h3>
            </div>
            
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50 text-gray-400 text-xs uppercase font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Emisor</th>
                            <th className="px-6 py-4 text-center">Horas</th>
                            <th className="px-6 py-4 w-1/3">Progreso</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {emisores.sort((a,b) => b.horas_mes - a.horas_mes).slice(0, 10).map((emisor, index) => {
                            const percent = Math.min((emisor.horas_mes / TARGET_HOURS) * 100, 100);
                            const status = getEmisorStatus(emisor.horas_mes);
                            const StatusIcon = status.icon;

                            return (
                                <tr key={emisor.id} className="hover:bg-gray-50/80 transition-colors animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-secondary">{emisor.nombre}</span>
                                            <span className="text-[10px] text-gray-400 font-mono tracking-wide">{emisor.bigo_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-secondary">{emisor.horas_mes}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${percent >= 100 ? 'bg-primary shadow-glow' : emisor.horas_mes >= MIN_HOURS ? 'bg-accent' : 'bg-secondary'}`} 
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${status.color}`}>
                                            <StatusIcon size={10} />
                                            {status.label}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {emisores.length > 10 && (
                <div className="p-4 text-center border-t border-gray-50">
                    <button className="text-xs font-bold text-gray-400 hover:text-secondary transition-colors uppercase tracking-widest">Ver todos</button>
                </div>
            )}
        </div>

        {/* Chart */}
        <div className="bg-white p-6 rounded-[1.5rem] shadow-card border border-gray-100 flex flex-col h-80 lg:h-auto animate-slide-up" style={{animationDelay: '600ms'}}>
            <h3 className="font-bold text-secondary mb-6 flex items-center gap-2">
                <Crown size={18} className="text-accent"/> 
                Top 5
            </h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 500}} tickLine={false} axisLine={false} />
                    <Tooltip 
                        cursor={{fill: '#F8FAFC', radius: 8}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Bar dataKey="hours" barSize={16} radius={[0, 6, 6, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#F97316' : index === 1 ? '#7C3AED' : '#09090B'} />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;