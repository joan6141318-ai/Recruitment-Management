import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Activity, Users, Clock, Target, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

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
    .slice(0, 8)
    .map(e => ({ name: e.nombre.split(' ')[0], hours: e.horas_mes }));

  if (loading) return (
    <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-up">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard General</h2>
           <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm font-medium">
              <Calendar size={16} />
              {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
           </p>
        </div>
      </div>

      {/* Stats Grid - Modern Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         
         {/* Card 1: Activos */}
         <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-lg transition-shadow">
             <div className="flex justify-between items-start mb-4">
                 <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                     <Users size={20} />
                 </div>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
             </div>
             <div>
                 <h3 className="text-3xl font-black text-gray-900">{activeEmisores.length}</h3>
                 <p className="text-sm font-medium text-gray-500 mt-1">Emisores Activos</p>
             </div>
         </div>

         {/* Card 2: Meta Ingresos */}
         <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-lg transition-shadow relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                        <Target size={20} />
                    </div>
                    <span className="text-xs font-bold text-purple-200 uppercase tracking-wider bg-purple-600 px-2 py-0.5 rounded-full text-white">
                        {Math.round((recruitmentCount/GOAL_RECRUITMENT)*100)}%
                    </span>
                </div>
                <div>
                    <h3 className="text-3xl font-black text-gray-900">{recruitmentCount} <span className="text-lg text-gray-400 font-bold">/ {GOAL_RECRUITMENT}</span></h3>
                    <p className="text-sm font-medium text-gray-500 mt-1">Nuevos Ingresos</p>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.min((recruitmentCount/GOAL_RECRUITMENT)*100, 100)}%` }}></div>
                </div>
             </div>
         </div>

         {/* Card 3: Horas Totales */}
         <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-lg transition-shadow">
             <div className="flex justify-between items-start mb-4">
                 <div className="p-2.5 bg-gray-100 rounded-xl text-gray-700">
                     <Clock size={20} />
                 </div>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Global</span>
             </div>
             <div>
                 <h3 className="text-3xl font-black text-gray-900">{totalHours.toFixed(0)}<span className="text-xl">h</span></h3>
                 <p className="text-sm font-medium text-gray-500 mt-1">Horas Acumuladas</p>
             </div>
         </div>

         {/* Card 4: Riesgo */}
         <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-lg transition-shadow">
             <div className="flex justify-between items-start mb-4">
                 <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600">
                     <AlertTriangle size={20} />
                 </div>
                 <span className="text-xs font-bold text-orange-600 uppercase tracking-wider bg-orange-100 px-2 py-0.5 rounded-full">Atención</span>
             </div>
             <div>
                 <h3 className="text-3xl font-black text-gray-900">{countRiesgo}</h3>
                 <p className="text-sm font-medium text-gray-500 mt-1">Bajo Rendimiento</p>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-card border border-gray-100">
             <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-lg text-gray-900">Rendimiento Top</h3>
                    <p className="text-sm text-gray-400">Emisores con más horas este mes</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                    <Activity size={18} className="text-gray-400" />
                </div>
             </div>
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top: 0, right: 0, left: -20, bottom: 0}} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                            dy={10} 
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#94a3b8', fontSize: 11}} 
                        />
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px'}}
                            itemStyle={{color: '#0f172a', fontWeight: 'bold'}}
                        />
                        <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index < 3 ? '#7C3AED' : '#e2e8f0'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Ranking List */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden flex flex-col">
             <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                 <h3 className="font-bold text-lg text-gray-900">Listado Activo</h3>
                 <p className="text-sm text-gray-400">Estado en tiempo real</p>
             </div>
             <div className="flex-1 overflow-y-auto max-h-[340px]">
                 <table className="w-full text-left">
                    <tbody className="divide-y divide-gray-50">
                        {emisores.sort((a,b) => b.horas_mes - a.horas_mes).map((emisor) => {
                             let badgeClass = 'bg-gray-100 text-gray-600';
                             let badgeText = 'Pausado';

                             if(emisor.estado === 'activo') {
                                if(emisor.horas_mes >= GOAL_HOURS_MAX) { badgeClass = 'bg-green-100 text-green-700'; badgeText = 'Meta'; }
                                else if(emisor.horas_mes >= GOAL_HOURS_MIN) { badgeClass = 'bg-blue-100 text-blue-700'; badgeText = 'Ok'; }
                                else if(emisor.horas_mes >= paceMin) { badgeClass = 'bg-yellow-100 text-yellow-700'; badgeText = 'Proceso'; }
                                else { badgeClass = 'bg-red-50 text-red-600'; badgeText = 'Riesgo'; }
                             }

                             return (
                                 <tr key={emisor.id} className="hover:bg-gray-50 transition-colors">
                                     <td className="px-6 py-4">
                                         <div className="flex items-center justify-between">
                                             <div>
                                                 <p className="font-bold text-sm text-gray-900 capitalize">{emisor.nombre.toLowerCase()}</p>
                                                 <p className="text-xs text-gray-400 font-mono mt-0.5">{emisor.bigo_id}</p>
                                             </div>
                                             <div className="text-right">
                                                 <span className="block font-bold text-gray-900">{emisor.horas_mes.toFixed(1)} h</span>
                                                 <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1 ${badgeClass}`}>
                                                     {badgeText}
                                                 </span>
                                             </div>
                                         </div>
                                     </td>
                                 </tr>
                             );
                        })}
                    </tbody>
                 </table>
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;