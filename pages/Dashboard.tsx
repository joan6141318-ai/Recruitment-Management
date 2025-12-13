import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Activity, Users, Clock, Target, TrendingUp, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const GOAL_RECRUITMENT = 15;
const GOAL_HOURS_MIN = 20;
const GOAL_HOURS_MAX = 44;

const KPICard = ({ title, value, subtext, icon: Icon, color, progress }: { title: string, value: string | number, subtext: string, icon: any, color: string, progress?: number }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-2 rounded-md ${color} bg-opacity-10`}>
        <Icon size={20} className={color.replace('bg-', 'text-')} />
      </div>
      {progress !== undefined && (
         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${progress >= 100 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            {Math.round(progress)}%
         </span>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{title}</p>
    <p className="text-[10px] text-gray-400 font-medium">{subtext}</p>
    {progress !== undefined && (
        <div className="w-full bg-gray-100 h-1 rounded-full mt-3 overflow-hidden">
            <div className={`h-full rounded-full ${color.replace('bg-', 'bg-')}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
    )}
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      const data = await dataService.getEmisores(user);
      setEmisores(data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // --- LÓGICA DE NEGOCIO ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  const monthProgress = currentDay / daysInMonth;

  // 1. Meta Reclutamiento (15)
  const currentMonthISO = currentDate.toISOString().slice(0, 7);
  const newEmisores = emisores.filter(e => e.mes_entrada === currentMonthISO);
  const recruitmentCount = newEmisores.length;
  const recruitmentProgress = (recruitmentCount / GOAL_RECRUITMENT) * 100;

  // 2. Totales y Activos
  const activeEmisores = emisores.filter(e => e.estado === 'activo');
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);

  // 3. Clasificación por Rendimiento (Lógica de Proyección)
  // Ritmo ideal mínimo para llegar a 20h hoy: (20 / dias_mes) * dia_actual
  const paceMin = (GOAL_HOURS_MIN / daysInMonth) * currentDay;
  const paceMax = (GOAL_HOURS_MAX / daysInMonth) * currentDay;

  let countGood = 0; // > 44h o en buen ritmo
  let countRegular = 0; // Entre 20 y 44
  let countBad = 0; // < 20h ritmo

  activeEmisores.forEach(e => {
    if (e.horas_mes >= GOAL_HOURS_MAX) {
        countGood++;
    } else if (e.horas_mes >= paceMax) {
        countGood++;
    } else if (e.horas_mes >= paceMin) {
        countRegular++;
    } else {
        countBad++;
    }
  });

  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 10)
    .map(e => ({ name: e.nombre.split(' ')[0], hours: e.horas_mes }));

  if (loading) return <div className="p-8 text-xs font-medium text-gray-500">Cargando métricas...</div>;

  return (
    <div className="space-y-6 animate-slide-up max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
           <div className="flex items-center gap-2 mb-1">
             <Calendar size={14} className="text-gray-400"/>
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
             </span>
           </div>
           <h1 className="text-xl font-bold text-gray-900">Panel de Control</h1>
        </div>
        
        {/* Resumen Rápido de Metas */}
        <div className="flex gap-4">
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Meta Reclutamiento</p>
                <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${recruitmentCount >= GOAL_RECRUITMENT ? 'text-green-600' : 'text-black'}`}>
                        {recruitmentCount}
                    </span>
                    <span className="text-xs text-gray-400">/ {GOAL_RECRUITMENT}</span>
                </div>
            </div>
            <div className="px-4 py-2 bg-black text-white rounded-lg shadow-md">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Meta Transmisión</p>
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">20h - 44h</span>
                </div>
            </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
            title="Nuevos Emisores" 
            value={recruitmentCount} 
            subtext={`Objetivo: ${GOAL_RECRUITMENT} este mes`}
            icon={Target} 
            color="bg-purple-600" 
            progress={recruitmentProgress}
        />
        <KPICard 
            title="Emisores Activos" 
            value={activeEmisores.length} 
            subtext={`${countBad} en riesgo de < 20h`}
            icon={Activity} 
            color="bg-blue-600" 
        />
        <KPICard 
            title="Horas Totales" 
            value={totalHours.toFixed(1)} 
            subtext="Acumulado global"
            icon={Clock} 
            color="bg-gray-800" 
        />
        <KPICard 
            title="Rendimiento > 44h" 
            value={countGood} 
            subtext="Emisores en ritmo excelente"
            icon={TrendingUp} 
            color="bg-green-600" 
            progress={(countGood / (activeEmisores.length || 1)) * 100}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabla Detallada con Lógica de Semáforo */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Desempeño Individual</h3>
                <div className="flex items-center gap-3 text-[10px] font-medium text-gray-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400"></div>Riesgo (&lt;20h)</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div>Regular (20-44h)</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Meta (&gt;44h)</span>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white text-[10px] uppercase text-gray-400 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-5 py-3">Emisor</th>
                            <th className="px-5 py-3 text-center">Estado</th>
                            <th className="px-5 py-3 text-right">Horas</th>
                            <th className="px-5 py-3">Progreso (Base 44h)</th>
                            <th className="px-5 py-3 text-center">Proyección</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                        {emisores.sort((a,b) => b.horas_mes - a.horas_mes).map((emisor) => {
                            // Cálculo de estado visual
                            let statusColor = 'bg-gray-200';
                            let projectionText = '—';
                            let projectionTextColor = 'text-gray-400';

                            if (emisor.estado === 'activo') {
                                if (emisor.horas_mes >= GOAL_HOURS_MAX) {
                                    statusColor = 'bg-green-500';
                                    projectionText = 'Completado';
                                    projectionTextColor = 'text-green-600';
                                } else if (emisor.horas_mes >= paceMax) {
                                    statusColor = 'bg-green-400';
                                    projectionText = 'Excelente';
                                    projectionTextColor = 'text-green-600';
                                } else if (emisor.horas_mes >= paceMin) {
                                    statusColor = 'bg-yellow-400';
                                    projectionText = 'Regular';
                                    projectionTextColor = 'text-yellow-600';
                                } else {
                                    statusColor = 'bg-red-400';
                                    projectionText = 'Bajo';
                                    projectionTextColor = 'text-red-500';
                                }
                            }

                            const percent44 = Math.min((emisor.horas_mes / GOAL_HOURS_MAX) * 100, 100);

                            return (
                                <tr key={emisor.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-gray-900 capitalize">{emisor.nombre.toLowerCase()}</div>
                                        <div className="font-mono text-[10px] text-gray-400">{emisor.bigo_id}</div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            emisor.estado === 'activo' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {emisor.estado}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold text-gray-900">
                                        {emisor.horas_mes}
                                    </td>
                                    <td className="px-5 py-3 align-middle w-48">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${statusColor}`} 
                                                    style={{ width: `${percent44}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-500 w-8 text-right">{Math.round(percent44)}%</span>
                                        </div>
                                    </td>
                                    <td className={`px-5 py-3 text-center font-bold text-[10px] uppercase ${projectionTextColor}`}>
                                        {projectionText}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Gráfico y Resumen */}
        <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col h-64">
                <h3 className="text-xs font-bold text-gray-800 uppercase mb-4">Top 10 Productividad</h3>
                <div className="flex-1 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={60} 
                                tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}} 
                                axisLine={false} 
                                tickLine={false}
                            />
                            <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '4px', border: 'none', color: '#fff', fontSize: '11px', padding: '6px 10px' }}
                            />
                            <Bar dataKey="hours" barSize={16} radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index < 3 ? '#7C3AED' : '#cbd5e1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Ficha Informativa General */}
            <div className="bg-black text-white rounded-lg p-5 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 size={16} className="text-green-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">Estado del Mes</h3>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                        <span className="text-gray-400">Progreso Mes (Días)</span>
                        <span className="font-bold">{Math.round(monthProgress * 100)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2">
                        <span className="text-gray-400">Meta Reclutamiento</span>
                        <span className={`font-bold ${recruitmentCount >= GOAL_RECRUITMENT ? 'text-green-400' : 'text-orange-400'}`}>
                            {recruitmentCount} / {GOAL_RECRUITMENT}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pb-1">
                        <span className="text-gray-400">Emisores > 20h</span>
                        <span className="font-bold">{countRegular + countGood}</span>
                    </div>
                    
                    {countBad > 0 && (
                        <div className="mt-2 bg-red-500/20 border border-red-500/30 p-2 rounded text-[10px] text-red-200 flex items-start gap-2">
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                            <p>{countBad} emisores requieren atención urgente (Ritmo &lt; 20h).</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;