import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Users, Clock, Briefcase, Zap, Save, Crown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const TARGET_HOURS = 44;

// Tarjeta con soporte para colores específicos
const StatCard = ({ title, value, icon: Icon, delay, colorClass, iconColorClass }: { title: string, value: string | number, icon: any, delay: string, colorClass: string, iconColorClass: string }) => (
  <div 
    className="bg-white p-8 rounded-[2rem] shadow-card hover:shadow-lg transition-all duration-500 animate-pop-in group border border-transparent hover:border-gray-100 flex flex-col justify-between h-48"
    style={{ animationDelay: delay }}
  >
    <div className="flex justify-between items-start">
        <div className={`p-4 rounded-2xl ${colorClass} transition-colors duration-500`}>
            <Icon size={28} strokeWidth={2.5} className={iconColorClass} />
        </div>
        {typeof value === 'number' && (
             <div className="flex items-center gap-1 text-[10px] font-black bg-gray-50 px-2 py-1 rounded-full text-black">
                 <TrendingUp size={12} /> +4%
             </div>
        )}
    </div>
    <div>
      <h3 className="text-5xl font-black text-black tracking-tighter mb-1">{value}</h3>
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

  if (loading) return <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
        <div>
           <p className="text-sm font-bold text-accent uppercase tracking-[0.2em] mb-2">Resumen General</p>
           {/* NOMBRE MASIVO */}
           <h1 className="text-6xl md:text-7xl font-black text-black tracking-tighter uppercase leading-[0.9]">
            {user.nombre}
           </h1>
        </div>

        {user.rol === 'admin' && (
           <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2">
                 <input 
                   type="date" 
                   className="bg-transparent text-black font-bold text-sm outline-none px-2 uppercase"
                   value={editingDate}
                   onChange={(e) => setEditingDate(e.target.value)}
                 />
                 <button onClick={handleUpdateDate} className="bg-black hover:bg-primary text-white p-3 rounded-xl transition-colors">
                   <Save size={18} />
                 </button>
           </div>
        )}
      </div>

      {/* Stats Grid - COLORES BASE APLICADOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title="Total Emisores" 
            value={totalEmisores} 
            icon={Users} 
            delay="100ms" 
            colorClass="bg-primary/10" 
            iconColorClass="text-primary" 
        />
        <StatCard 
            title="Activos Ahora" 
            value={activeEmisores} 
            icon={Activity} 
            delay="200ms" 
            colorClass="bg-accent/10" 
            iconColorClass="text-accent" 
        />
        <StatCard 
            title="Horas Totales" 
            value={totalHours} 
            icon={Clock} 
            delay="300ms" 
            colorClass="bg-gray-100" 
            iconColorClass="text-black" 
        />
        {user.rol === 'admin' ? (
           <Link to="/reclutadores" className="block hover:scale-[1.02] transition-transform duration-300">
             <StatCard 
                title="Equipo" 
                value={recruiterCount} 
                icon={Briefcase} 
                delay="400ms" 
                colorClass="bg-black" 
                iconColorClass="text-white"
             />
           </Link>
        ) : (
            <StatCard 
                title="Promedio" 
                value={`${Math.round(totalHours / (totalEmisores || 1))}h`} 
                icon={Zap} 
                delay="400ms" 
                colorClass="bg-yellow-100" 
                iconColorClass="text-yellow-600"
            />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table - Nombre Protagonista */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-card p-8 animate-slide-up" style={{animationDelay: '500ms'}}>
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-black tracking-tight uppercase">Top Rendimiento</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <tbody className="divide-y divide-gray-50">
                        {emisores.sort((a,b) => b.horas_mes - a.horas_mes).slice(0, 8).map((emisor) => {
                            const percent = Math.min((emisor.horas_mes / TARGET_HOURS) * 100, 100);
                            return (
                                <tr key={emisor.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-5 pl-2">
                                        <div className="text-lg font-black text-black group-hover:text-primary transition-colors uppercase">
                                            {emisor.nombre}
                                        </div>
                                    </td>
                                    <td className="py-5 text-right font-black text-xl text-black">
                                        {emisor.horas_mes}
                                    </td>
                                    <td className="py-5 px-4 w-32">
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            {/* Barra Naranja para activos, Morada si completa meta */}
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${percent >= 100 ? 'bg-primary' : 'bg-accent'}`} 
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
        <div className="bg-black text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col animate-slide-up relative overflow-hidden" style={{animationDelay: '600ms'}}>
            <div className="absolute -top-10 -right-10 p-10 opacity-10">
                <Crown size={200} />
            </div>
            <h3 className="text-2xl font-black mb-8 relative z-10 tracking-tight uppercase">Estadísticas</h3>
            <div className="flex-1 min-h-[300px] relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fill: '#A1A1AA', fontWeight: 800}} tickLine={false} axisLine={false} />
                    <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.1)', radius: 8}}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', color: '#000' }}
                        itemStyle={{ color: '#000', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="hours" barSize={12} radius={[0, 4, 4, 0]}>
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