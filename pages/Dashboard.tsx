import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const GOAL_HOURS_MIN = 20;

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const data = await dataService.getEmisores(user);
      setEmisores(data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const activeEmisores = emisores.filter(e => e.estado === 'activo');
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);
  const avgHours = activeEmisores.length > 0 ? totalHours / activeEmisores.length : 0;
  
  // Chart Data: Top 5 Emisores
  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 5)
    .map(e => ({ name: e.nombre.split(' ')[0], hours: e.horas_mes }));

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Cargando métricas...</div>;

  const StatCard = ({ title, value, sub, icon: Icon, color, iconColor }: any) => (
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
              <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">{value}</h3>
              </div>
              <div className={`p-2 rounded-xl ${color}`}>
                  <Icon size={20} className={iconColor} />
              </div>
          </div>
          <p className="text-xs text-gray-500 font-medium">{sub}</p>
      </div>
  );

  return (
    <div className="space-y-6 animate-slide-up">
      
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Resumen General</h2>
        <p className="text-gray-500 text-sm mt-1">Métricas clave de rendimiento en tiempo real.</p>
      </div>

      {/* KPI Grid - Iconos Morados/Naranjas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Emisores Activos" 
            value={activeEmisores.length} 
            sub="Total en plataforma" 
            icon={Users} 
            color="bg-purple-50" 
            iconColor="text-primary"
          />
          <StatCard 
            title="Horas Totales" 
            value={totalHours.toFixed(0)} 
            sub="Acumulado del mes" 
            icon={Clock} 
            color="bg-orange-50" 
            iconColor="text-accent"
          />
          <StatCard 
            title="Promedio / Emisor" 
            value={avgHours.toFixed(1)} 
            sub="Horas por persona" 
            icon={TrendingUp} 
            color="bg-purple-50" 
            iconColor="text-primary"
          />
          <StatCard 
            title="Cumplimiento" 
            value={`${Math.round((activeEmisores.filter(e => e.horas_mes >= GOAL_HOURS_MIN).length / (activeEmisores.length || 1)) * 100)}%`} 
            sub="Meta > 20 Horas" 
            icon={CheckCircle2} 
            color="bg-green-50" 
            iconColor="text-green-600"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wide">Top Rendimiento</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 600}} 
                            dy={10} 
                        />
                        <Tooltip 
                            cursor={{fill: '#F3F4F6'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                        />
                        <Bar dataKey="hours" radius={[6, 6, 6, 6]} barSize={40}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#7C3AED' : '#E5E7EB'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Alert List */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
             <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                <AlertCircle size={16} className="text-accent"/> Atención Requerida
             </h3>
             <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[250px]">
                {activeEmisores
                    .filter(e => e.horas_mes < 10)
                    .sort((a,b) => a.horas_mes - b.horas_mes)
                    .map(emisor => (
                    <div key={emisor.id} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                        <div>
                            <p className="font-bold text-xs text-gray-900">{emisor.nombre}</p>
                            <p className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {emisor.bigo_id}</p>
                        </div>
                        <span className="text-xs font-black text-accent">{emisor.horas_mes}h</span>
                    </div>
                ))}
                {activeEmisores.filter(e => e.horas_mes < 10).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-10">Todo bajo control.</p>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;