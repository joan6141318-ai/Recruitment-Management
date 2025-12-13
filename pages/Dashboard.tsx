import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Users, Clock, Briefcase, Zap, Calendar, Save, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const TARGET_HOURS = 44;

const StatCard = ({ title, value, icon: Icon, delay }: { title: string, value: string | number, icon: any, delay: string }) => (
  <div 
    className="bg-white p-8 rounded-[2rem] shadow-card hover:shadow-glow hover:-translate-y-2 transition-all duration-500 animate-fade-up group border border-transparent hover:border-black/5"
    style={{ animationDelay: delay }}
  >
    <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-background rounded-2xl text-black group-hover:bg-black group-hover:text-white transition-colors duration-500">
            <Icon size={24} strokeWidth={2} />
        </div>
        {typeof value === 'number' && (
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">+12%</span>
        )}
    </div>
    <div>
      <h3 className="text-4xl font-black text-black tracking-tighter mb-1">{value}</h3>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [recruiterCount, setRecruiterCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  
  const [editingDate, setEditingDate] = useState<string>('');
  const [isSavingDate, setIsSavingDate] = useState(false);

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
  
  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 5)
    .map(e => ({ name: e.nombre, hours: e.horas_mes }));

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 bg-black animate-pulse rounded-full"></div></div>;

  return (
    <div className="space-y-10">
      
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-up">
        <div>
          <h1 className="text-5xl font-black text-black tracking-tighter mb-2">Hola, {user.nombre.split(' ')[0]}</h1>
          <div className="flex items-center space-x-2 text-gray-400 text-sm font-bold uppercase tracking-widest">
            <Calendar size={14} />
            <span>{lastUpdated || 'Hoy'}</span>
          </div>
        </div>

        {user.rol === 'admin' && (
           <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
                 <input 
                   type="date" 
                   className="bg-transparent text-black font-bold text-sm outline-none px-2"
                   value={editingDate}
                   onChange={(e) => setEditingDate(e.target.value)}
                 />
                 <button 
                  onClick={handleUpdateDate}
                  disabled={isSavingDate}
                  className="bg-black hover:bg-primary text-white p-2 rounded-xl transition-colors"
                 >
                   <Save size={16} />
                 </button>
           </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Emisores" value={totalEmisores} icon={Users} delay="100ms" />
        <StatCard title="Activos" value={activeEmisores} icon={Activity} delay="200ms" />
        <StatCard title="Horas Totales" value={totalHours} icon={Clock} delay="300ms" />
        {user.rol === 'admin' ? (
           <Link to="/reclutadores" className="block hover:scale-[1.02] transition-transform duration-300">
             <StatCard title="Reclutadores" value={recruiterCount} icon={Briefcase} delay="400ms" />
           </Link>
        ) : (
            <StatCard title="Promedio" value={`${Math.round(totalHours / (totalEmisores || 1))}h`} icon={Zap} delay="400ms" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-card p-8 animate-fade-up" style={{animationDelay: '500ms'}}>
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-black tracking-tight">Rendimiento</h3>
                <button className="text-xs font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors">Ver Todo</button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="text-gray-400 text-[10px] font-bold uppercase tracking-widest border-b border-gray-100">
                        <tr>
                            <th className="pb-4 pl-4">Emisor</th>
                            <th className="pb-4 text-center">Horas</th>
                            <th className="pb-4 w-1/3 text-center">Meta ({TARGET_HOURS}h)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {emisores.sort((a,b) => b.horas_mes - a.horas_mes).slice(0, 8).map((emisor) => {
                            const percent = Math.min((emisor.horas_mes / TARGET_HOURS) * 100, 100);
                            return (
                                <tr key={emisor.id} className="group hover:bg-background transition-colors">
                                    <td className="py-4 pl-4 rounded-l-xl">
                                        <div className="font-bold text-sm text-black group-hover:text-primary transition-colors">{emisor.nombre}</div>
                                        <div className="text-[10px] text-gray-400 font-mono">{emisor.bigo_id}</div>
                                    </td>
                                    <td className="py-4 text-center font-black text-black">
                                        {emisor.horas_mes}
                                    </td>
                                    <td className="py-4 pr-4 rounded-r-xl">
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden w-full max-w-[150px] mx-auto">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${percent >= 100 ? 'bg-primary' : 'bg-black'}`} 
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Chart */}
        <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col animate-fade-up relative overflow-hidden" style={{animationDelay: '600ms'}}>
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Crown size={120} />
            </div>
            <h3 className="text-2xl font-black mb-8 relative z-10">Top 5</h3>
            <div className="flex-1 min-h-[300px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: '#6B7280', fontWeight: 700}} tickLine={false} axisLine={false} />
                    <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.1)', radius: 8}}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', color: '#000' }}
                        itemStyle={{ color: '#000', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="hours" barSize={12} radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#7C3AED' : '#FFFFFF'} />
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