import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { UserPlus, Calendar, Trophy, AlertTriangle, TrendingUp } from 'lucide-react';

interface ReclutadoresProps {
  user: User;
}

interface RecruiterStats extends User {
  totalEmisores: number;
  monthlyEmisores: number;
}

const GOAL_RECRUITMENT = 15;

const Reclutadores: React.FC<ReclutadoresProps> = ({ user }) => {
  const [recruiters, setRecruiters] = useState<RecruiterStats[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthISO = `${currentYear}-${currentMonth}`; // Fix UTC issue
  const monthName = now.toLocaleString('es-ES', { month: 'long' });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const usersData = await dataService.getRecruiters();
    const emisoresData = await dataService.getEmisores(user);

    const stats = usersData.map(recruiter => {
      const recruiterEmisores = emisoresData.filter(e => e.reclutador_id === recruiter.id);
      const monthly = recruiterEmisores.filter(e => e.mes_entrada === currentMonthISO).length;
      return { ...recruiter, totalEmisores: recruiterEmisores.length, monthlyEmisores: monthly };
    });

    setRecruiters(stats.sort((a, b) => b.monthlyEmisores - a.monthlyEmisores));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.createRecruiterInvite(newName, newEmail);
      setIsModalOpen(false); setNewName(''); setNewEmail(''); loadData();
    } catch (err) { alert('Error al invitar'); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
       
       <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Equipo de Reclutamiento</h2>
            <div className="flex items-center gap-2 mt-1">
                <Calendar size={12} className="text-gray-400"/>
                <span className="text-xs font-medium text-gray-500 capitalize">{monthName}</span>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs font-bold text-black uppercase">Meta Mensual: {GOAL_RECRUITMENT} Emisores</span>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-md text-xs font-bold uppercase flex items-center gap-2 hover:bg-gray-800 shadow-sm transition-colors">
             <UserPlus size={14} /> Agregar Miembro
          </button>
       </div>

       <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-100">
               <tr>
                  <th className="px-5 py-3 text-center w-12">#</th>
                  <th className="px-5 py-3">Reclutador</th>
                  <th className="px-5 py-3 text-center">Nuevos (Mes)</th>
                  <th className="px-5 py-3 w-1/3">Progreso Meta ({GOAL_RECRUITMENT})</th>
                  <th className="px-5 py-3 text-right">Total Histórico</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs">
               {recruiters.map((rec, index) => {
                  const progress = (rec.monthlyEmisores / GOAL_RECRUITMENT) * 100;
                  const isTop = index === 0 && rec.monthlyEmisores > 0;
                  
                  return (
                     <tr key={rec.id} className={`hover:bg-gray-50 transition-colors ${isTop ? 'bg-yellow-50/20' : ''}`}>
                        <td className="px-5 py-3 text-center font-mono text-gray-400">{index + 1}</td>
                        <td className="px-5 py-3">
                           <div className="flex items-center gap-2">
                               <span className="font-bold text-gray-900 capitalize">{rec.nombre.toLowerCase()}</span>
                               {isTop && <Trophy size={14} className="text-yellow-600" />}
                           </div>
                           <div className="text-[10px] text-gray-400">{rec.correo}</div>
                        </td>
                        <td className="px-5 py-3 text-center">
                            <span className="font-bold text-sm text-gray-900">{rec.monthlyEmisores}</span>
                        </td>
                        <td className="px-5 py-3 align-middle">
                           <div className="flex items-center gap-3">
                              <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full ${progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : 'bg-gray-800'}`} 
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                 ></div>
                              </div>
                              <span className="text-[10px] font-bold text-gray-500 w-8 text-right">{Math.round(progress)}%</span>
                           </div>
                           {progress < 30 && rec.monthlyEmisores > 0 && (
                               <div className="flex items-center gap-1 mt-1 text-[10px] text-orange-500 font-medium">
                                   <AlertTriangle size={10} /> Ritmo bajo
                               </div>
                           )}
                           {progress >= 100 && (
                               <div className="flex items-center gap-1 mt-1 text-[10px] text-green-600 font-medium">
                                   <TrendingUp size={10} /> Meta cumplida
                               </div>
                           )}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600 font-medium">{rec.totalEmisores}</td>
                     </tr>
                  );
               })}
            </tbody>
          </table>
       </div>

       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl border border-gray-100">
              <h3 className="text-sm font-bold uppercase mb-4 text-gray-900 tracking-wide">Invitar Reclutador</h3>
              <form onSubmit={handleRegister} className="space-y-3">
                 <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Nombre</label>
                    <input required className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:border-black outline-none transition-colors" placeholder="Nombre completo" value={newName} onChange={e => setNewName(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Correo</label>
                    <input required type="email" className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:border-black outline-none transition-colors" placeholder="correo@ejemplo.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                 </div>
                 <div className="pt-2">
                    <button className="w-full bg-black text-white py-2.5 rounded-md text-xs font-bold uppercase hover:bg-gray-800 transition-colors">Enviar Invitación</button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-[10px] text-gray-400 font-medium hover:text-gray-600 mt-3 text-center block">Cancelar</button>
                 </div>
              </form>
           </div>
        </div>
       )}
    </div>
  );
};

export default Reclutadores;