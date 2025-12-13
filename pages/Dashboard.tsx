import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Activity, Users, Clock, Target, AlertTriangle, Calendar, Info, User as UserIcon } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const GOAL_RECRUITMENT = 15;
const GOAL_HOURS_MIN = 20;
const GOAL_HOURS_MAX = 44;

// Tarjeta KPI con diseño minimalista
const KPICard = ({ title, value, subtext, icon: Icon, colorClass }: { title: string, value: string | number, subtext: string, icon: any, colorClass: string }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform rotate-12 ${colorClass.replace('bg-', 'text-')}`}>
        <Icon size={80} />
    </div>
    <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
            <div className={`p-1.5 rounded-md ${colorClass} bg-opacity-10 text-opacity-100`}>
                <Icon size={16} className={colorClass.replace('bg-', 'text-')} />
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-end gap-2 mb-1">
            <h3 className="text-3xl font-bold text-gray-900 leading-none tracking-tight">{value}</h3>
        </div>
        <p className="text-[10px] font-medium text-gray-400">{subtext}</p>
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

  // --- LÓGICA DE NEGOCIO ---
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

  // 3. Ritmo (Pace)
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

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-slide-up">
      
      {/* Header Compacto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
           <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard General</h1>
           <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-1">
             <Calendar size={12} className="text-gray-400"/>
             <span className="capitalize">
                {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
             </span>
             <span className="text-gray-300">|</span>
             <span>Día {currentDay} / {daysInMonth}</span>
           </div>
        </div>

        <div className="flex gap-3">
             <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg flex items-center gap-3 shadow-sm">
                <div className="bg-purple-50 p-1.5 rounded">
                    <Target size={14} className="text-purple-600" />
                </div>
                <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Meta Ingresos</p>
                    <p className="text-xs font-bold text-gray-900">{GOAL_RECRUITMENT} Nuevos</p>
                </div>
             </div>
             <div className="bg-black text-white px-3 py-2 rounded-lg flex items-center gap-3 shadow-lg">
                <div className="bg-gray-800 p-1.5 rounded">
                    <Clock size={14} className="text-white" />
                </div>
                <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Meta Horas</p>
                    <p className="text-xs font-bold text-white">20h - 44h</p>
                </div>
             </div>
        </div>
      </div>

      {/* Grid KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
            title="Emisores Activos" 
            value={activeEmisores.length} 
            subtext={`${emisores.length} Total registrados`}
            icon={Users} 
            colorClass="bg-blue-600"
        />
        <KPICard 
            title="Horas Totales" 
            value={totalHours.toFixed(1)} 
            subtext="Acumulado del equipo"
            icon={Clock} 
            colorClass="bg-gray-800"
        />
        <KPICard 
            title="Ingresos Mes" 
            value={recruitmentCount} 
            subtext={`${Math.round(recruitmentPercent)}% de la Meta (${GOAL_RECRUITMENT})`}
            icon={UserIcon} 
            colorClass="bg-purple-600"
        />
        <KPICard 
            title="Atención Requerida" 
            value={countRiesgo} 
            subtext="Ritmo bajo (< 20h)"
            icon={AlertTriangle} 
            colorClass="bg-red-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabla de Rendimiento */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                    <Activity size={14} className="text-gray-400"/>
                    Productividad Emisores
                </h3>
                <div className="flex gap-2 text-[9px] font-medium text-gray-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>Riesgo</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>En Proceso</span>
                    <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Meta</span>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white text-[10px] uppercase text-gray-400 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-5 py-3">Emisor</th>
                            <th className="px-5 py-3 text-right">Horas</th>
                            <th className="px-5 py-3 w-32">Progreso (44h)</th>
                            <th className="px-5 py-3 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                        {emisores.sort((a,b) => b.horas_mes - a.horas_mes).map((emisor) => {
                            let statusLabel = '—';
                            let statusColor = 'text-gray-400';
                            let barColor = 'bg-gray-200';

                            if (emisor.estado === 'activo') {
                                if (emisor.horas_mes >= GOAL_HOURS_MAX) {
                                    statusLabel = 'Meta Lograda';
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
                                    statusLabel = 'Riesgo';
                                    statusColor = 'text-red-600 bg-red-50';
                                    barColor = 'bg-red-500';
                                }
                            } else {
                                statusLabel = 'Pausado';
                                statusColor = 'text-gray-500 bg-gray-100';
                            }

                            const percentMax = Math.min((emisor.horas_mes / GOAL_HOURS_MAX) * 100, 100);

                            return (
                                <tr key={emisor.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-3">
                                        <div className="font-bold text-gray-900 capitalize text-xs">{emisor.nombre.toLowerCase()}</div>
                                        <div className="text-[10px] text-gray-400">{emisor.bigo_id}</div>
                                    </td>
                                    <td className="px-5 py-3 text-right font-bold text-gray-900">
                                        {emisor.horas_mes.toFixed(1)}
                                    </td>
                                    <td className="px-5 py-3 align-middle">
                                        <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="absolute left-[45%] top-0 bottom-0 w-px bg-white z-10"></div>
                                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percentMax}%` }}></div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                        <span className={`inline-block px-2 py-1 rounded-[4px] text-[9px] font-bold uppercase tracking-wide ${statusColor}`}>
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

        {/* Panel Lateral: Gráfica y Ficha Informativa */}
        <div className="space-y-6">
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 flex flex-col h-64">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4">Top 10 Productividad</h3>
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
                            <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ backgroundColor: '#09090b', border: 'none', color: '#fff', fontSize: '11px', borderRadius: '4px' }}/>
                            <Bar dataKey="hours" barSize={12} radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index < 3 ? '#7C3AED' : '#e2e8f0'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Ficha Informativa SaaS */}
            <div className="bg-black text-white rounded-lg p-6 shadow-xl relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Target size={100} />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-6">
                        <Info size={16} className="text-blue-400" />
                        <h3 className="text-xs font-bold uppercase tracking-widest">Resumen Mensual</h3>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs text-gray-400 font-medium">Meta Ingresos ({GOAL_RECRUITMENT})</span>
                            <span className={`text-sm font-bold ${recruitmentCount >= GOAL_RECRUITMENT ? 'text-green-400' : 'text-blue-400'}`}>
                                {recruitmentCount} / {GOAL_RECRUITMENT}
                            </span>
                        </div>
                        <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full ${recruitmentCount >= GOAL_RECRUITMENT ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${recruitmentPercent}%` }}></div>
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-800">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Progreso Temporal</span>
                            <span className="font-bold">{Math.round(monthProgress * 100)}%</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">Emisores &gt; 20h</span>
                            <span className="font-bold text-green-400">{countRegular + countExcelente}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                             <span className="text-gray-400">Atención Requerida</span>
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