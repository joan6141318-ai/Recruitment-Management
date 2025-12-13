import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Activity, Users, Clock, Zap, Save, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const TARGET_HOURS = 44; // Meta por emisor

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, iconColor }: { title: string, value: string | number, subtext?: string, icon: any, colorClass: string, iconColor: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full relative overflow-hidden group hover:shadow-md transition-all">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colorClass} opacity-10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
    
    <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
            <Icon size={24} className={iconColor} strokeWidth={2} />
        </div>
        {subtext && (
             <div className="flex items-center gap-1 text-[10px] font-bold bg-gray-50 px-2 py-1 rounded-full text-gray-500">
                 {subtext}
             </div>
        )}
    </div>
    <div className="relative z-10">
      <h3 className="text-3xl font-black text-black tracking-tight mb-1">{value}</h3>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [recruiterCount, setRecruiterCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [editingDate, setEditingDate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const emisoresData = await dataService.getEmisores(user);
      const metadata = await dataService.getMetadata();
      setEmisores(emisoresData);
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
  };

  // Cálculos de Estadísticas
  const totalEmisores = emisores.length;
  const activeEmisores = emisores.filter(e => e.estado === 'activo');
  const activeCount = activeEmisores.length;
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);
  
  // Cálculo de Objetivo (Solo cuentan emisores activos para la meta)
  const globalTarget = activeCount * TARGET_HOURS;
  const globalProgressPercent = globalTarget > 0 ? Math.min((totalHours / globalTarget) * 100, 100) : 0;
  
  // Datos para el gráfico (Top 10)
  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 8)
    .map(e => ({ name: e.nombre.split(' ')[0], hours: e.horas_mes }));

  if (loading) return (
    <div className="flex justify-center p-20">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Panel de Control</p>
           </div>
           <h1 className="text-3xl font-black text-black tracking-tight uppercase">
            Hola, {user.nombre.split(' ')[0]}
           </h1>
        </div>

        {user.rol === 'admin' && (
           <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                 <input 
                   type="date" 
                   className="bg-transparent text-black font-bold text-xs outline-none px-2 uppercase"
                   value={editingDate}
                   onChange={(e) => setEditingDate(e.target.value)}
                 />
                 <button onClick={handleUpdateDate} className="bg-black hover:bg-gray-800 text-white p-2 rounded-lg transition-colors">
                   <Save size={16} />
                 </button>
           </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title="Total Emisores" 
            value={totalEmisores} 
            icon={Users} 
            colorClass="bg-blue-500" 
            iconColor="text-blue-600" 
        />
        <StatCard 
            title="Emisores Activos" 
            value={activeCount} 
            subtext={`${Math.round((activeCount/totalEmisores)*100 || 0)}% del total`}
            icon={Activity} 
            colorClass="bg-green-500" 
            iconColor="text-green-600" 
        />
        <StatCard 
            title="Horas Totales" 
            value={totalHours.toFixed(1)} 
            icon={Clock} 
            colorClass="bg-purple-500" 
            iconColor="text-purple-600" 
        />
        
        {user.rol === 'admin' ? (
           <Link to="/reclutadores" className="block h-full">
                <StatCard 
                    title="Reclutadores" 
                    value={recruiterCount} 
                    icon={Target} 
                    colorClass="bg-orange-500" 
                    iconColor="text-orange-600"
                />
           </Link>
        ) : (
            // Tarjeta de Meta Mensual para Reclutadores
            <div className="bg-black text-white p-6 rounded-2xl shadow-lg flex flex-col justify-between h-full relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-white/10 rounded-lg"><Target size={20} /></div>
                        <span className="text-2xl font-black">{Math.round(globalProgressPercent)}%</span>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Meta Mensual</p>
                    
                    <div className="w-full bg-gray-800 rounded-full h-2 mb-2 overflow-hidden">
                        <div 
                            className="bg-white h-full rounded-full transition-all duration-1000 ease-out" 
                            style={{ width: `${globalProgressPercent}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-right">
                        {totalHours.toFixed(0)} / {globalTarget} hrs
                    </p>
                </div>
            </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tabla de Rendimiento */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-black flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    Rendimiento por Emisor
                </h3>
                <span className="text-xs font-medium text-gray-400">Meta: {TARGET_HOURS}h</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Emisor</th>
                            <th className="px-6 py-4 text-center">Estado</th>
                            <th className="px-6 py-4 text-right">Horas</th>
                            <th className="px-6 py-4 w-1/3">Progreso</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {emisores.sort((a,b) => b.horas_mes - a.horas_mes).map((emisor) => {
                            const percent = Math.min((emisor.horas_mes / TARGET_HOURS) * 100, 100);
                            const isLow = emisor.estado === 'activo' && percent < 50;
                            const isSuccess = percent >= 100;
                            
                            return (
                                <tr key={emisor.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-gray-900 capitalize">{emisor.nombre.toLowerCase()}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">ID: {emisor.bigo_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                            emisor.estado === 'activo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {emisor.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-sm text-black tabular-nums">
                                        {emisor.horas_mes}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        isSuccess ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 
                                                        emisor.estado === 'pausado' ? 'bg-gray-300' :
                                                        percent < 30 ? 'bg-red-400' : 'bg-orange-400'
                                                    }`} 
                                                    style={{ width: `${percent}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold w-9 text-right">{Math.round(percent)}%</span>
                                        </div>
                                        {isLow && (
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-red-500 font-medium">
                                                <AlertCircle size={10} /> Bajo rendimiento
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Gráfico */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-[400px] lg:h-auto">
            <h3 className="text-lg font-black text-black mb-6 flex items-center gap-2">
                <Zap size={20} className="text-yellow-500" />
                Top Productividad
            </h3>
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="name" 
                            tick={{fontSize: 10, fill: '#71717a', fontWeight: 600}} 
                            axisLine={false} 
                            tickLine={false} 
                            interval={0}
                        />
                        <YAxis 
                            tick={{fontSize: 10, fill: '#71717a'}} 
                            axisLine={false} 
                            tickLine={false}
                        />
                        <Tooltip 
                            cursor={{fill: '#f3f4f6'}}
                            contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                        />
                        <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index < 3 ? '#7C3AED' : '#E4E4E7'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-50">
                 <p className="text-xs text-center text-gray-400">
                    Mostrando los {chartData.length} mejores emisores del mes.
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;