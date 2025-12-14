import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Clock, TrendingUp, AlertCircle, CheckCircle2, Target, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [loading, setLoading] = useState(true);

  // Objetivos Dinámicos: 30 para Admin (Equipo), 15 para Reclutador individual
  const MONTHLY_EMISOR_GOAL = user.rol === 'admin' ? 30 : 15;
  const PRODUCTIVITY_HOURS_GOAL = 20;

  useEffect(() => {
    // Usar suscripción en tiempo real en lugar de getEmisores
    const unsubscribe = dataService.subscribeToEmisores(user, (data) => {
      setEmisores(data);
      setLoading(false);
    });

    // Limpiar suscripción al desmontar
    return () => unsubscribe();
  }, [user]);

  // CORRECCIÓN: Filtrado case-insensitive
  const activeEmisores = emisores.filter(e => 
    e.estado && e.estado.toLowerCase() === 'activo'
  );
  
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);
  const avgHours = activeEmisores.length > 0 ? totalHours / activeEmisores.length : 0;
  
  // Lógica de Meta Mensual
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const newEmisoresThisMonth = emisores.filter(e => 
    (e.mes_entrada && e.mes_entrada === currentMonth) || 
    (e.fecha_registro && e.fecha_registro.startsWith(currentMonth))
  );
  const monthlyProgress = Math.min((newEmisoresThisMonth.length / MONTHLY_EMISOR_GOAL) * 100, 100);
  
  // Chart Data: Top 5 Emisores
  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 5)
    .map(e => ({ name: e.nombre.split(' ')[0], hours: e.horas_mes }));

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Sincronizando...</div>;

  const StatCard = ({ title, value, sub, icon: Icon }: any) => (
      <div className="bg-white p-6 rounded-2xl border border-gray-100/50 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-full bg-gray-50 text-black group-hover:bg-black group-hover:text-white transition-colors">
                  <Icon size={18} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold bg-gray-50 text-gray-400 px-2 py-1 rounded-full uppercase">{sub}</span>
          </div>
          <div>
              <h3 className="text-3xl font-black text-black tracking-tight mt-2">{value}</h3>
              <p className="text-xs font-medium text-gray-500 mt-1">{title}</p>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 animate-slide-up">
      
      {/* Header: Saludo Personalizado */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-black tracking-tight">
                Hola, <span className="text-primary capitalize">{user.nombre.split(' ')[0]}</span>
            </h2>
            <p className="text-gray-400 text-sm mt-1 font-medium">Aquí está el resumen de tu rendimiento hoy.</p>
          </div>
          <div className="text-right">
              <span className="text-xs font-bold text-black border border-gray-200 bg-white px-4 py-2 rounded-full uppercase tracking-wide shadow-sm">
                  {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
          </div>
      </div>

      {/* --- SECCIÓN META MENSUAL --- */}
      <div className="bg-black text-white p-8 rounded-3xl shadow-2xl shadow-gray-200 relative overflow-hidden">
          {/* Fondo Decorativo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <Target size={20} className="text-white" />
                      </div>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Meta Mensual</span>
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter mb-1">
                      {newEmisoresThisMonth.length} <span className="text-2xl text-gray-500 font-medium">/ {MONTHLY_EMISOR_GOAL}</span>
                  </h3>
                  <p className="text-sm text-gray-400 font-medium">Nuevos emisores registrados este mes</p>
              </div>

              <div className="w-full md:w-1/2">
                  <div className="flex justify-between text-xs font-bold mb-2">
                      <span className="text-gray-400">Progreso</span>
                      <span className="text-primary">{Math.round(monthlyProgress)}%</span>
                  </div>
                  <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <div 
                          className="h-full rounded-full bg-primary transition-all duration-700 ease-out relative shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                          style={{width: `${monthlyProgress}%`}}
                      ></div>
                  </div>
              </div>
          </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Cartera Activa" 
            value={activeEmisores.length} 
            sub="Total" 
            icon={Users} 
          />
          <StatCard 
            title="Horas Acumuladas" 
            value={totalHours.toFixed(0)} 
            sub="Horas" 
            icon={Clock} 
          />
          <StatCard 
            title="Promedio / Emisor" 
            value={avgHours.toFixed(1)} 
            sub="Avg" 
            icon={TrendingUp} 
          />
          <StatCard 
            title="Productivos (>20h)" 
            value={`${Math.round((activeEmisores.filter(e => e.horas_mes >= PRODUCTIVITY_HOURS_GOAL).length / (activeEmisores.length || 1)) * 100)}%`} 
            sub="Tasa" 
            icon={CheckCircle2} 
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-8">
                 <h3 className="text-sm font-bold text-black uppercase tracking-wide">Top Productividad</h3>
                 <ArrowUpRight size={18} className="text-gray-300" />
             </div>
             {chartData.length > 0 ? (
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 500}} 
                                dy={10} 
                            />
                            <Tooltip 
                                cursor={{fill: '#F9FAFB'}}
                                contentStyle={{
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)',
                                    padding: '12px 16px',
                                    backgroundColor: '#000',
                                    color: '#fff'
                                }}
                                itemStyle={{color: '#fff'}}
                            />
                            <Bar dataKey="hours" radius={[6, 6, 6, 6]} barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#000000' : '#E5E7EB'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
             ) : (
                 <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                     Sin datos suficientes
                 </div>
             )}
          </div>

          {/* Alert List */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
             <h3 className="text-sm font-bold text-black mb-6 uppercase tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Riesgo de Meta
             </h3>
             <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px]">
                {activeEmisores
                    .filter(e => e.horas_mes < 10)
                    .sort((a,b) => a.horas_mes - b.horas_mes)
                    .map(emisor => (
                    <div key={emisor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                        <div>
                            <p className="font-bold text-sm text-black truncate w-24">{emisor.nombre}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {emisor.bigo_id}</p>
                        </div>
                        <div className="text-right">
                             <span className="block text-sm font-black text-red-500">{emisor.horas_mes}h</span>
                             <span className="text-[10px] text-gray-400">de 44h</span>
                        </div>
                    </div>
                ))}
                {activeEmisores.filter(e => e.horas_mes < 10).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-300">
                        <CheckCircle2 size={40} className="mb-4 text-green-500 opacity-20" />
                        <p className="text-xs font-medium">Todo el equipo va bien.</p>
                    </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;