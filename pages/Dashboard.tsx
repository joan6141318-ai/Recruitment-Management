import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Users, Clock, Briefcase, Zap, Save, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const TARGET_HOURS = 44;

const StatCard = ({ title, value, icon: Icon, delay, colorClass, iconColorClass }: { title: string, value: string | number, icon: any, delay: string, colorClass: string, iconColorClass: string }) => (
  <div 
    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between animate-pop-in hover:shadow-md transition-all"
    style={{ animationDelay: delay }}
  >
    <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
            <Icon size={20} strokeWidth={2.5} className={iconColorClass} />
        </div>
        {typeof value === 'number' && (
             <div className="flex items-center gap-1 text-[10px] font-bold bg-gray-50 px-2 py-0.5 rounded-full text-green-600">
                 <TrendingUp size={10} /> +4%
             </div>
        )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-black tracking-tight">{value}</h3>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{title}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [recruiterCount, setRecruiterCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [editingDate, setEditingDate] = useState<string>('');

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
    await dataService.updateMetadata(editingDate);
    setLastUpdated(editingDate);
  };

  const totalEmisores = emisores.length;
  const activeEmisores = emisores.filter(e => e.estado === 'activo').length;
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);
  
  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 5)
    .map(e => ({ name: e.nombre, hours: e.horas_mes }));

  if (loading) return <div className="flex justify-center p-20"><div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bienvenido</p>
           <h1 className="text-2xl font-black text-black tracking-tight uppercase">
            {user.nombre}
           </h1>
        </div>

        {user.rol === 'admin' && (
           <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-gray-200">
                 <input 
                   type="date" 
                   className="bg-transparent text-black font-medium text-xs outline-none px-2"
                   value={editingDate}
                   onChange={(e) => setEditingDate(e.target.value)}
                 />
                 <button onClick={handleUpdateDate} className="bg-black hover:bg-gray-800 text-white p-2 rounded-lg transition-colors">
                   <Save size={14} />
                 </button>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title="Total Emisores" 
            value={totalEmisores} 
            icon={Users} 
            delay="0ms" 
            colorClass="bg-purple-50" 
            iconColorClass="text-primary" 
        />
        <StatCard 
            title="Activos" 
            value={activeEmisores} 
            icon={Activity} 
            delay="50ms" 
            colorClass="bg-orange-50" 
            iconColorClass="text-accent" 
        />
        <StatCard 
            title="Horas Totales" 
            value={totalHours} 
            icon={Clock} 
            delay="100ms" 
            colorClass="bg-gray-100" 
            iconColorClass="text-black" 
        />
        {user.rol === 'admin' ? (
           <Link to="/reclutadores" className="block hover:scale-[1.02] transition-transform">
             <StatCard 
                title="Equipo" 
                value={recruiterCount} 
                icon={Briefcase} 
                delay="150ms" 
                colorClass="bg-black" 
                iconColorClass="text-white"
             />
           </Link>
        ) : (
            <StatCard 
                title="Promedio" 
                value={`${Math.round(totalHours / (totalEmisores || 1))}h`} 
                icon={Zap} 
                delay="150ms" 
                colorClass="bg-yellow-50" 
                iconColorClass="text-yellow-600"
            />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-black mb-4">Top Rendimiento</h3>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-gray-50">
                        {emisores.sort((a,b) => b.horas_mes - a.horas_mes).slice(0, 6).map((emisor) => {
                            const percent = Math.min((emisor.horas_mes / TARGET_HOURS) * 100, 100);
                            return (
                                <tr key={emisor.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-3 pl-2">
                                        <div className="text-sm font-semibold text-gray-800 capitalize">
                                            {emisor.nombre.toLowerCase()}
                                        </div>
                                    </td>
                                    <td className="py-3 text-right font-bold text-sm text-black">
                                        {emisor.horas_mes} h
                                    </td>
                                    <td className="py-3 px-4 w-24">
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${percent >= 100 ? 'bg-primary' : 'bg-accent'}`} 
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
        <div className="bg-black text-white p-6 rounded-2xl shadow-lg flex flex-col">
            <h3 className="text-lg font-bold mb-4">Estadísticas</h3>
            <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={70} tick={{fontSize: 9, fill: '#A1A1AA', fontWeight: 500}} tickLine={false} axisLine={false} />
                    <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.1)', radius: 4}}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', color: '#000', fontSize: '12px' }}
                    />
                    <Bar dataKey="hours" barSize={8} radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#F97316' : index === 1 ? '#7C3AED' : '#FFFFFF'} />
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