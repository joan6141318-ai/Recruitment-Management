import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Activity, Users, Clock, Target, AlertTriangle, ArrowUpRight } from 'lucide-react';

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

  // Calculations
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
    .slice(0, 10)
    .map(e => ({ name: e.nombre.split(' ')[0], hours: e.horas_mes }));

  if (loading) return <div className="flex justify-center p-10"><div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-4">
      
      {/* 1. KPIs de Alta Densidad */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1 */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Activos</p>
                  <h3 className="text-xl font-bold text-gray-900 mt-1">{activeEmisores.length}</h3>
              </div>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded">
                  <Users size={14} />
              </div>
           </div>
           <p className="text-[10px] text-gray-400 mt-1">De {emisores.length} totales</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Ingresos Mes</p>
                  <div className="flex items-baseline gap-1 mt-1">
                      <h3 className="text-xl font-bold text-gray-900">{recruitmentCount}</h3>
                      <span className="text-[10px] text-gray-400">/ {GOAL_RECRUITMENT}</span>
                  </div>
              </div>
              <div className={`p-1.5 rounded ${recruitmentCount >= GOAL_RECRUITMENT ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                  <Target size={14} />
              </div>
           </div>
           <div className="w-full bg-gray-100 h-1 mt-2 rounded-full overflow-hidden">
               <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min((recruitmentCount/GOAL_RECRUITMENT)*100, 100)}%` }}></div>
           </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Horas Totales</p>
                  <h3 className="text-xl font-bold text-gray-900 mt-1">{totalHours.toFixed(1)}</h3>
              </div>
              <div className="p-1.5 bg-gray-100 text-gray-600 rounded">
                  <Clock size={14} />
              </div>
           </div>
           <p className="text-[10px] text-gray-400 mt-1">Acumulado global</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Riesgo Bajo</p>
                  <h3 className="text-xl font-bold text-orange-500 mt-1">{countRiesgo}</h3>
              </div>
              <div className="p-1.5 bg-orange-50 text-orange-600 rounded">
                  <AlertTriangle size={14} />
              </div>
           </div>
           <p className="text-[10px] text-gray-400 mt-1">Emisores bajo ritmo</p>
        </div>
      </div>

      {/* 2. Gráfica (Restaurada grande) */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-gray-800 uppercase flex items-center gap-2">
                <Activity size={14} className="text-primary"/>
                Ranking de Horas
            </h3>
        </div>
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10, fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                    <Tooltip 
                        cursor={{fill: '#f9fafb'}}
                        contentStyle={{borderRadius: '4px', border: '1px solid #e5e7eb', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: '11px', padding: '4px 8px'}} 
                        itemStyle={{color: '#111827', fontWeight: 'bold'}}
                    />
                    <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index < 3 ? '#7C3AED' : '#d1d5db'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Tabla Compacta */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
         <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase">Listado de Rendimiento</h3>
            <span className="text-[10px] font-medium text-gray-400">{emisores.length} Emisores</span>
         </div>
         <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead className="bg-white text-[9px] uppercase text-gray-400 font-bold border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-2">Emisor</th>
                        <th className="px-4 py-2 text-right">Horas</th>
                        <th className="px-4 py-2 w-24">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {emisores.sort((a,b) => b.horas_mes - a.horas_mes).map((emisor) => {
                        let statusColor = 'bg-gray-100 text-gray-500';
                        let statusText = 'Pausado';
                        
                        if (emisor.estado === 'activo') {
                            if (emisor.horas_mes >= GOAL_HOURS_MAX) { statusColor = 'bg-green-100 text-green-700'; statusText = 'Meta'; }
                            else if (emisor.horas_mes >= GOAL_HOURS_MIN) { statusColor = 'bg-blue-100 text-blue-700'; statusText = 'OK'; }
                            else if (emisor.horas_mes >= paceMin) { statusColor = 'bg-yellow-100 text-yellow-700'; statusText = 'Proceso'; }
                            else { statusColor = 'bg-red-100 text-red-700'; statusText = 'Riesgo'; }
                        }

                        return (
                            <tr key={emisor.id} className="hover:bg-gray-50">
                                <td className="px-4 py-2">
                                    <div className="font-bold text-xs text-gray-900 capitalize truncate max-w-[140px]">{emisor.nombre.toLowerCase()}</div>
                                    <div className="text-[9px] text-gray-400 font-mono">{emisor.bigo_id}</div>
                                </td>
                                <td className="px-4 py-2 text-right">
                                    <span className="font-bold text-xs text-gray-900">{emisor.horas_mes.toFixed(1)}</span>
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;