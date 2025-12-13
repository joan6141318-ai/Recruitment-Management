import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Activity, Users, Clock, Target, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const RECRUITMENT_GOAL = 15; // META DE 15 EMISORES
const HOURS_GOAL = 44;

const CompactStat = ({ label, value, sub, icon: Icon, progress }: { label: string, value: string | number, sub?: string, icon: any, progress?: number }) => (
  <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm flex flex-col justify-between h-24 relative overflow-hidden">
    <div className="flex justify-between items-start z-10">
      <div>
        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-0.5">{label}</p>
        <h3 className="text-2xl font-black text-black leading-none">{value}</h3>
      </div>
      <Icon size={16} className="text-gray-400" />
    </div>
    
    <div className="z-10 mt-2">
      {progress !== undefined ? (
        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
          <div className={`h-full ${progress >= 100 ? 'bg-green-500' : 'bg-black'} rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
      ) : (
        <p className="text-[10px] font-medium text-gray-400">{sub}</p>
      )}
      {progress !== undefined && (
        <p className="text-[9px] font-bold text-gray-400 mt-1 text-right">{Math.round(progress)}% Completado</p>
      )}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      const data = await dataService.getEmisores(user);
      setEmisores(data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  // Lógica de Negocio
  const currentMonthISO = currentDate.toISOString().slice(0, 7); // YYYY-MM
  
  // KPI 1: Reclutamiento Mensual (Meta 15)
  const newEmisores = emisores.filter(e => e.mes_entrada === currentMonthISO);
  const newCount = newEmisores.length;
  const recruitmentProgress = (newCount / RECRUITMENT_GOAL) * 100;

  // KPI 2: Totales
  const activeEmisores = emisores.filter(e => e.estado === 'activo');
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);
  
  // KPI 3: Cumplimiento de Horas (Meta 44h)
  const emisoresCumpliendo = activeEmisores.filter(e => e.horas_mes >= HOURS_GOAL).length;
  const porcentajeCumplimiento = activeEmisores.length > 0 ? (emisoresCumpliendo / activeEmisores.length) * 100 : 0;

  // Gráfico
  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 10)
    .map(e => ({ name: e.nombre.split(' ')[0], hours: e.horas_mes }));

  if (loading) return <div className="p-10 text-xs font-mono">Cargando datos...</div>;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      
      {/* Header Compacto */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
           <h1 className="text-xl font-bold text-black uppercase tracking-tight">Dashboard General</h1>
           <p className="text-[10px] font-mono text-gray-500 flex items-center gap-1">
             <Calendar size={10} /> {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
           </p>
        </div>
        <div className="flex gap-2">
            <div className="bg-black text-white px-3 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-2">
                <span>Meta Mes: {RECRUITMENT_GOAL} Emisores</span>
            </div>
        </div>
      </div>

      {/* Grid de KPIs - Alta densidad */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CompactStat 
            label="Nuevos (Mes)" 
            value={`${newCount} / ${RECRUITMENT_GOAL}`} 
            icon={Target} 
            progress={recruitmentProgress}
        />
        <CompactStat 
            label="Emisores Activos" 
            value={activeEmisores.length} 
            sub={`Total: ${emisores.length}`} 
            icon={Users} 
        />
        <CompactStat 
            label="Horas Totales" 
            value={totalHours.toFixed(1)} 
            sub={`Promedio: ${(totalHours / (activeEmisores.length || 1)).toFixed(1)}h`} 
            icon={Clock} 
        />
        <CompactStat 
            label="Meta Horas (44h)" 
            value={`${emisoresCumpliendo}`} 
            icon={Activity} 
            progress={porcentajeCumplimiento}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tabla Compacta */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-700 uppercase">Detalle Emisores</h3>
                <span className="text-[10px] text-gray-400">Ordenado por horas</span>
            </div>
            
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white text-[9px] uppercase text-gray-400 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-2">Nombre / ID</th>
                            <th className="px-4 py-2">Ingreso</th>
                            <th className="px-4 py-2 text-center">Estado</th>
                            <th className="px-4 py-2 text-right">Horas</th>
                            <th className="px-4 py-2 w-24">Meta 44h</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-[11px]">
                        {emisores.sort((a,b) => b.horas_mes - a.horas_mes).map((emisor) => {
                            const percent = Math.min((emisor.horas_mes / HOURS_GOAL) * 100, 100);
                            return (
                                <tr key={emisor.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-2">
                                        <div className="font-bold text-black capitalize truncate max-w-[120px]">{emisor.nombre.toLowerCase()}</div>
                                        <div className="font-mono text-gray-400 text-[9px]">{emisor.bigo_id}</div>
                                    </td>
                                    <td className="px-4 py-2 text-gray-600 font-medium">
                                        {emisor.mes_entrada}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${emisor.estado === 'activo' ? 'bg-green-500' : 'bg-red-300'}`}></span>
                                    </td>
                                    <td className="px-4 py-2 text-right font-bold text-black">
                                        {emisor.horas_mes}
                                    </td>
                                    <td className="px-4 py-2 align-middle">
                                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${percent >= 100 ? 'bg-purple-600' : percent > 50 ? 'bg-blue-400' : 'bg-orange-400'}`} 
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

        {/* Gráfico Compacto */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col h-64 lg:h-auto">
            <h3 className="text-xs font-bold text-gray-700 uppercase mb-4">Top Rendimiento</h3>
            <div className="flex-1 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={60} 
                            tick={{fontSize: 9, fill: '#64748b'}} 
                            axisLine={false} 
                            tickLine={false}
                        />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{ backgroundColor: '#000', borderRadius: '4px', border: 'none', color: '#fff', fontSize: '10px', padding: '4px 8px' }}
                        />
                        <Bar dataKey="hours" barSize={12} radius={[0, 3, 3, 0]}>
                             {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#000' : '#94a3b8'} />
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