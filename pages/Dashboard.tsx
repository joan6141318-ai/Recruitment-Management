import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Activity, Users, Clock, Target, TrendingUp, AlertTriangle, CheckCircle2, Calendar, MoreHorizontal, Info, User as UserIcon } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const GOAL_RECRUITMENT = 15;
const GOAL_HOURS_MIN = 20;
const GOAL_HOURS_MAX = 44;

// Componente de Tarjeta KPI Profesional
const KPICard = ({ title, value, subtext, icon: Icon, colorClass, trend }: { title: string, value: string | number, subtext: string, icon: any, colorClass: string, trend?: 'up' | 'down' | 'neutral' }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass.replace('bg-', 'text-')}`}>
        <Icon size={48} />
    </div>
    <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-md ${colorClass} bg-opacity-10 text-opacity-100`}>
                <Icon size={16} className={colorClass.replace('bg-', 'text-')} />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-end gap-2 mb-1">
            <h3 className="text-2xl font-bold text-gray-900 leading-none tracking-tight">{value}</h3>
        </div>
        <p className="text-[10px] font-medium text-gray-500">{subtext}</p>
    </div>
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

  // --- LÓGICA DE NEGOCIO AVANZADA ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  const monthProgress = currentDay / daysInMonth;

  // 1. Meta Reclutamiento (15)
  const currentMonthISO = currentDate.toISOString().slice(0, 7);
  const newEmisores = emisores.filter(e => e.mes_entrada === currentMonthISO);
  const recruitmentCount = newEmisores.length;
  const recruitmentPercent = Math.min((recruitmentCount / GOAL_RECRUITMENT) * 100, 100);

  // 2. Totales y Activos
  const activeEmisores = emisores.filter(e => e.estado === 'activo');
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);

  // 3. Clasificación por Rendimiento y Proyección (Pace)
  // El "Ritmo Mínimo" es cuántas horas debería llevar hoy para llegar a 20h a fin de mes.
  const paceMin = (GOAL_HOURS_MIN / daysInMonth) * currentDay; 

  let countExcelente = 0; // >= 44h
  let countRegular = 0;   // 20h - 44h
  let countEnCamino = 0;  // < 20h pero con buen ritmo
  let countRiesgo = 0;    // < 20h y bajo el ritmo

  activeEmisores.forEach(e => {
    if (e.horas_mes >= GOAL_HOURS_MAX) {
        countExcelente++;
    } else if (e.horas_mes >= GOAL_HOURS_MIN) {
        countRegular++;
    } else if (e.horas_mes >= paceMin) {
        countEnCamino++;
    } else {
        countRiesgo++;
    }
  });

  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 10)
    .map(e => ({ name: e.nombre.split(' ')[0], hours: e.horas_mes }));

  if (loading) return <div className="flex justify-center p-20"><div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
           <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-1">Dashboard General</h1>
           <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
             <Calendar size={14} className="text-gray-400"/>
             <span className="capitalize">
                {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
             </span>
             <span className="text-gray-300">|</span>
             <span>Día {currentDay} de {daysInMonth}</span>
           </div>
        </div>

        {/* Resumen de Metas */}
        <div className="flex items-center gap-3">
             <div className="bg-white border border-gray-200 px-3 py-1.5 rounded-md flex items-center gap-2 shadow-sm">
                <Target size={14} className="text-gray-400" />
                <div className="text-xs">
                    <span className="text-gray-500 mr-1">Meta Ingresos:</span>
                    <span className="font-bold text-gray-900">{GOAL_RECRUITMENT}</span>
                </div>
             </div>
             <div className="bg-gray-900 px-3 py-1.5 rounded-md flex items-center gap-2 shadow-sm text-white">
                <Clock size={14} className="text-gray-400" />
                <div className="text-xs">
                    <span className="text-gray-400 mr-1">Base Horas:</span>
                    <span className="font-bold">20h - 44h</span>
                </div>
             </div>
        </div>
      </div>

      {/* Grid KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
            title="Total Activos" 
            value={activeEmisores.length} 
            subtext={`${emisores.length} registrados en total`}
            icon={Users} 
            colorClass="bg-blue-600"
        />
        <KPICard 
            title="Horas Totales" 
            value={totalHours.toFixed(1)} 
            subtext="Acumulado del mes"
            icon={Clock} 
            colorClass="bg-gray-800"
        />
        <KPICard 
            title="Ingresos Mes" 
            value={recruitmentCount} 
            subtext={`${Math.round(recruitmentPercent)}% de la meta (${GOAL_RECRUITMENT})`}
            icon={UserIcon} 
            colorClass="bg-purple-600"
        />
        <KPICard 
            title="En Riesgo" 
            value={countRiesgo} 
            subtext="Bajo ritmo (< 20h)"
            icon={AlertTriangle} 
            colorClass="bg-red-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabla de Rendimiento Detallado */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-50 gap-2">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Activity size={14} className="text-gray-500"/>
                    Proyección de Emisores
                </h3>
                {/* Leyenda */}
                <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium text-gray-500">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Riesgo</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400"></div>En Camino</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-400"></div>> 20h</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Meta 44h</div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white text-[10px] uppercase text-gray-400 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-5 py-3">Emisor / ID</th>
                            <th className="px-5 py-3 text-right">Horas</th>
                            <th className="px-5 py-3 w-40">Barra Progreso</th>
                            <th className="px-5 py-3 text-center">Estado Proyección</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                        {emisores.sort((a,b) => b.horas_mes - a.horas_mes).map((emisor) => {
                            // Lógica de visualización
                            let statusLabel = '—';
                            let statusColor = 'text-gray-400';
                            let barColor = 'bg-gray-200';

                            if (emisor.estado === 'activo') {
                                if (emisor.horas_mes >= GOAL_HOURS_MAX) {
                                    statusLabel = 'Meta Cumplida';
                                    statusColor = 'text-green-600 bg-green-50';
                                    barColor = 'bg-green-500';
                                } else if (emisor.horas_mes >= GOAL_HOURS_MIN) {
                                    statusLabel = 'Buen Rendimiento';
                                    statusColor = 'text-yellow-700 bg-yellow-50';
                                    barColor = 'bg-yellow-400';
                                } else if (emisor.horas_mes >= paceMin) {
                                    statusLabel = 'En Camino';
                                    statusColor = 'text-blue-600 bg-blue-50';
                                    barColor = 'bg-blue-400';
                                } else {
                                    statusLabel = 'Riesgo / Bajo';
                                    statusColor = 'text-red-600 bg-red-50';
                                    barColor = 'bg-red-500';
                                }
                            } else {
                                statusLabel = 'Pausado';
                                statusColor = 'text-gray-500 bg-gray-100';
                            }

                            const percentMax = Math.min((emisor.horas_mes / GOAL_HOURS_MAX) * 100, 100);

                            return (
                                <tr key={emisor.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-gray-900 capitalize text-xs">{emisor.nombre.toLowerCase()}</div>
                                        <div className="font-mono text-[10px] text-gray-400 flex items-center gap-1">
                                            {emisor.bigo_id}
                                            {emisor.estado === 'pausado' && <span className="px-1 rounded bg-gray-200 text-gray-600 text-[8px] uppercase">Pausado</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold text-gray-900">
                                        {emisor.horas_mes.toFixed(1)}
                                    </td>
                                    <td className="px-5 py-3 align-middle">
                                        <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            {/* Marca de 20h */}
                                            <div className="absolute left-[45%] top-0 bottom-0 w-px bg-white z-10"></div>
                                            <div 
                                                className={`h-full rounded-full ${barColor}`} 
                                                style={{ width: `${percentMax}%` }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Sidebar Derecho: Gráfico y Ficha Informativa */}
        <div className="space-y-6">
            
            {/* Gráfico */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col h-64">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4">Top Productividad</h3>
                <div className="flex-1 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                width={60} 
                                tick={{fontSize: 10, fill: '#6b7280', fontWeight: 500}} 
                                axisLine={false} 
                                tickLine={false}
                            />
                            <Tooltip 
                                cursor={{fill: '#f9fafb'}}
                                contentStyle={{ backgroundColor: '#111827', borderRadius: '4px', border: 'none', color: '#fff', fontSize: '11px', padding: '6px 10px' }}
                            />
                            <Bar dataKey="hours" barSize={12} radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index < 3 ? '#7C3AED' : '#d1d5db'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Ficha Informativa: Meta de Reclutamiento (15) */}
            <div className="bg-gray-900 text-white rounded-lg p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Target size={80} />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Info size={16} className="text-blue-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wide">Reporte de Metas</h3>
                    </div>

                    {/* Progress Circle Visual or Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-xs text-gray-400 font-medium">Meta Ingresos (Base 15)</span>
                            <span className={`text-sm font-bold ${recruitmentCount >= GOAL_RECRUITMENT ? 'text-green-400' : 'text-orange-400'}`}>
                                {recruitmentPercent.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full ${recruitmentCount >= GOAL_RECRUITMENT ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${recruitmentPercent}%` }}></div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 text-right">{recruitmentCount} de 15 emisores ingresados</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-800">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Progreso Mes (Días)</span>
                            <span className="font-bold">{Math.round(monthProgress * 100)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Emisores > 20h</span>
                            <span className="font-bold text-white">{countRegular + countExcelente}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                             <span className="text-gray-400">En Riesgo (&lt;Ritmo)</span>
                             <span className="font-bold text-red-400">{countRiesgo}</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;