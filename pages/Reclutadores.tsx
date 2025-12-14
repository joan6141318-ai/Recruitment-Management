import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { UserPlus, Calendar, Trophy, Mail, X } from 'lucide-react';

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
  const currentMonthISO = `${currentYear}-${currentMonth}`;

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
    <div className="space-y-8 animate-slide-up">
       
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Equipo</h2>
            <p className="text-gray-500 mt-1 text-sm font-medium">Gestión de reclutadores y metas</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-black text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-gray-200 hover:bg-gray-800 transition-all active:scale-95"
          >
             <UserPlus size={18} /> Invitar Miembro
          </button>
       </div>

       {/* Meta Card */}
       <div className="bg-gradient-to-r from-purple-900 to-black rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 p-4">
                <Trophy size={120} />
            </div>
            <div className="relative z-10">
                <h3 className="text-purple-200 font-bold text-xs uppercase tracking-widest mb-2">Meta Mensual</h3>
                <div className="flex items-end gap-2">
                    <span className="text-4xl font-black">{GOAL_RECRUITMENT}</span>
                    <span className="text-sm font-medium opacity-60 mb-1">Nuevos Emisores / Reclutador</span>
                </div>
            </div>
       </div>

       {/* Clean List */}
       <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
              <h3 className="font-bold text-gray-900">Ranking de Rendimiento</h3>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-xs text-gray-400 font-bold uppercase border-b border-gray-50">
                <tr>
                    <th className="px-6 py-4 w-16">#</th>
                    <th className="px-6 py-4">Reclutador</th>
                    <th className="px-6 py-4 w-1/3">Progreso Meta</th>
                    <th className="px-6 py-4 text-center">Nuevos</th>
                    <th className="px-6 py-4 text-right">Total Histórico</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                {recruiters.map((rec, index) => {
                    const progress = Math.min((rec.monthlyEmisores / GOAL_RECRUITMENT) * 100, 100);
                    const isTop = index === 0 && rec.monthlyEmisores > 0;
                    
                    return (
                        <tr key={rec.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${isTop ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {isTop ? <Trophy size={14} /> : index + 1}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div>
                                    <p className="font-bold text-sm text-gray-900 capitalize">{rec.nombre.toLowerCase()}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Mail size={10}/> {rec.correo}</p>
                                </div>
                            </td>
                            <td className="px-6 py-4 align-middle">
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : 'bg-purple-600'}`} 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className={`text-sm font-bold ${rec.monthlyEmisores >= GOAL_RECRUITMENT ? 'text-green-600' : 'text-gray-900'}`}>
                                    {rec.monthlyEmisores}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className="text-sm font-medium text-gray-500">{rec.totalEmisores}</span>
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
          </div>
       </div>

       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-pop-in">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Invitar Reclutador</h3>
                  <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400"/></button>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1.5 ml-1">Nombre Completo</label>
                    <input required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-black focus:bg-white transition-colors" placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1.5 ml-1">Correo Electrónico</label>
                    <input required type="email" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:border-black focus:bg-white transition-colors" placeholder="correo@ejemplo.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                 </div>
                 <button className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-lg mt-2">Enviar Invitación</button>
              </form>
           </div>
        </div>
       )}
    </div>
  );
};

export default Reclutadores;