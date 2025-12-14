import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Users, Clock, TrendingUp, AlertCircle, CheckCircle2, Target } from 'lucide-react';

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

  // CORRECCIÓN: Filtrado case-insensitive para asegurar que no salga 0 si dice 'Activo' o 'activo'
  const activeEmisores = emisores.filter(e => 
    e.estado && e.estado.toLowerCase() === 'activo'
  );
  
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);
  const avgHours = activeEmisores.length > 0 ? totalHours / activeEmisores.length : 0;
  
  // Lógica de Meta Mensual
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const newEmisoresThisMonth = emisores.filter(e => 
    // Usamos mes_entrada (input manual) o fecha_registro como fallback
    (e.mes_entrada && e.mes_entrada === currentMonth) || 
    (e.fecha_registro && e.fecha_registro.startsWith(currentMonth))
  );
  const monthlyProgress = Math.min((newEmisoresThisMonth.length / MONTHLY_EMISOR_GOAL) * 100, 100);
  
  // Chart Data: Top 5 Emisores
  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 5)
    .map(e => ({ name: e.nombre.split(' ')[0], hours: e.horas_mes }));

  if (loading) return <div className="p-10 text-center text-sm text-gray-400">Sincronizando métricas...</div>;

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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Rendimiento en Vivo</h2>
            <p className="text-gray-500 text-sm mt-1">Resumen general y metas del mes.</p>
          </div>
          <div className="text-right">
              <span className="text-xs font-bold text-primary bg-purple-50 px-3 py-1 rounded-full uppercase tracking-wide">
                  {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
          </div>
      </div>

      {/* --- SECCIÓN META MENSUAL (RECLUTADOR/ADMIN) --- */}
      {/* DISEÑO CAMBIADO: Gris Claro con Margen Blanco */}
      <div className="bg-gray-100 text-gray-900 p-6 rounded-3xl shadow-xl shadow-gray-200/50 border-[6px] border-white relative overflow-hidden">
          
          <div className="relative z-10">
              <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Target size={24} className="text-primary" />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-black">Meta de Reclutamiento</h3>
                          <p className="text-xs text-gray-500 font-medium">Objetivo: {MONTHLY_EMISOR_GOAL} Nuevos Emisores</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-3xl font-black text-primary">{newEmisoresThisMonth.length}</span>
                      <span className="text-sm text-gray-400 font-bold"> / {MONTHLY_EMISOR_GOAL}</span>
                  </div>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full bg-white h-4 rounded-full overflow-hidden mb-2 border border-gray-200 shadow-inner">
                  <div 
                      className="h-full rounded-full bg-gradient-to-r from-primary to-purple-400 transition-all duration-700 ease-out relative"
                      style={{width: `${monthlyProgress}%`}}
                  >
                  </div>
              </div>
              
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span>Progreso Actual</span>
                  <span>{Math.round(monthlyProgress)}% Completado</span>
              </div>
          </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Emisores Activos" 
            value={activeEmisores.length} 
            sub="Cartera Total" 
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
            title="Productivos" 
            value={`${Math.round((activeEmisores.filter(e => e.horas_mes >= PRODUCTIVITY_HOURS_GOAL).length / (activeEmisores.length || 1)) * 100)}%`} 
            sub="Emisores > 20 Horas" 
            icon={CheckCircle2} 
            color="bg-green-50" 
            iconColor="text-green-600"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
             <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wide">Top Productividad</h3>
             {chartData.length > 0 ? (
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
             ) : (
                 <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                     Sin datos suficientes
                 </div>
             )}
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
                    <div className="flex flex-col items-center justify-center h-full py-10 text-gray-400">
                        <CheckCircle2 size={30} className="mb-2 text-green-500 opacity-50" />
                        <p className="text-xs">Todo bajo control.</p>
                    </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;