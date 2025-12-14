import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, Users, Clock, Target, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  user: User;
}

const GOAL_RECRUITMENT = 15;
const GOAL_HOURS_MIN = 20;
const GOAL_HOURS_MAX = 44;

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

  // Cálculos
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const currentDay = currentDate.getDate();
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentMonthISO = `${currentYear}-${currentMonth}`;
  
  const newEmisores = emisores.filter(e => e.mes_entrada === currentMonthISO);
  const recruitmentCount = newEmisores.length;
  
  const activeEmisores = emisores.filter(e => e.estado === 'activo');
  const totalHours = emisores.reduce((acc, curr) => acc + curr.horas_mes, 0);
  const paceMin = (GOAL_HOURS_MIN / daysInMonth) * currentDay; 
  let countRiesgo = 0;

  activeEmisores.forEach(e => {
    if (e.horas_mes < paceMin && e.horas_mes < GOAL_HOURS_MIN) countRiesgo++;
  });

  const chartData = [...emisores]
    .sort((a, b) => b.horas_mes - a.horas_mes)
    .slice(0, 7) // Top 7 para que quepa bien en movil
    .map(e => ({ name: e.nombre.split(' ')[0], hours: e.horas_mes }));

  if (loading) return <div className="p-10 text-center text-sm text-gray-500">Cargando datos...</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      
      {/* 1. Tarjetas Superiores Compactas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Users size={16} />
              <span className="text-xs font-bold uppercase">Activos</span>
           </div>
           <p className="text-2xl font-bold text-gray-900">{activeEmisores.length}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Target size={16} />
              <span className="text-xs font-bold uppercase">Ingresos</span>
           </div>
           <div className="flex items-end gap-1">
             <p className={`text-2xl font-bold ${recruitmentCount >= GOAL_RECRUITMENT ? 'text-green-600' : 'text-gray-900'}`}>{recruitmentCount}</p>
             <span className="text-xs text-gray-400 mb-1">/ {GOAL_RECRUITMENT}</span>
           </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock size={16} />
              <span className="text-xs font-bold uppercase">Horas Totales</span>
           </div>
           <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
           <div className="flex items-center gap-2 text-orange-500 mb-2">
              <AlertTriangle size={16} />
              <span className="text-xs font-bold uppercase">Riesgo</span>
           </div>
           <p className="text-2xl font-bold text-orange-500">{countRiesgo}</p>
        </div>
      </div>

      {/* 2. Gráfica Principal (Restaurada) */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-primary"/>
            Top Rendimiento (Horas)
        </h3>
        <div className="h-52 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{top: 5, right: 5, left: -20, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                    <Tooltip 
                        cursor={{fill: '#f3f4f6'}}
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} 
                    />
                    <Bar dataKey="hours" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Lista Detallada Compacta */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase">Detalle de Emisores</h3>
         </div>
         <table className="w-full text-left">
            <tbody className="divide-y divide-gray-100">
                {emisores.sort((a,b) => b.horas_mes - a.horas_mes).map((emisor) => {
                    const progress = Math.min((emisor.horas_mes / GOAL_HOURS_MAX) * 100, 100);
                    let barColor = 'bg-gray-300';
                    if (emisor.horas_mes >= GOAL_HOURS_MAX) barColor = 'bg-green-500';
                    else if (emisor.horas_mes >= GOAL_HOURS_MIN) barColor = 'bg-blue-500';
                    else if (emisor.horas_mes >= paceMin) barColor = 'bg-yellow-400';
                    else barColor = 'bg-red-400';

                    return (
                        <tr key={emisor.id}>
                            <td className="px-4 py-3">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-gray-800 capitalize">{emisor.nombre.toLowerCase()}</span>
                                    <span className="font-bold text-sm text-gray-900">{emisor.horas_mes.toFixed(1)} h</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${barColor}`} style={{width: `${progress}%`}}></div>
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-gray-400">{emisor.bigo_id}</span>
                                    <span className="text-[10px] text-gray-400 font-medium">Meta: 44h</span>
                                </div>
                            </td>
                        </tr>
                    )
                })}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default Dashboard;