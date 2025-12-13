import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { UserPlus, Star, AlertCircle } from 'lucide-react';

interface ReclutadoresProps {
  user: User;
}

interface RecruiterStats extends User {
  totalEmisores: number;
  monthlyEmisores: number;
}

const RECRUITMENT_GOAL = 15;

const Reclutadores: React.FC<ReclutadoresProps> = ({ user }) => {
  const [recruiters, setRecruiters] = useState<RecruiterStats[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  
  const now = new Date();
  const currentMonthISO = now.toISOString().slice(0, 7);

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
    <div className="max-w-4xl mx-auto">
       <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
          <h2 className="text-lg font-bold text-black uppercase">Equipo <span className="text-xs text-gray-400 ml-2">Meta: {RECRUITMENT_GOAL}/mes</span></h2>
          <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-1 hover:bg-gray-800">
             <UserPlus size={14} /> Invitar
          </button>
       </div>

       <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-bold border-b border-gray-100">
               <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3 text-center">Nuevos (Mes)</th>
                  <th className="px-4 py-3 w-1/3">Progreso Meta ({RECRUITMENT_GOAL})</th>
                  <th className="px-4 py-3 text-right">Total Histórico</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
               {recruiters.map((rec, index) => {
                  const progress = (rec.monthlyEmisores / RECRUITMENT_GOAL) * 100;
                  const isTop = index === 0 && rec.monthlyEmisores > 0;
                  return (
                     <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-gray-400">{index + 1}</td>
                        <td className="px-4 py-3 font-bold text-black capitalize flex items-center gap-2">
                           {rec.nombre.toLowerCase()}
                           {isTop && <Star size={12} className="text-yellow-500 fill-current" />}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-sm">{rec.monthlyEmisores}</td>
                        <td className="px-4 py-3 align-middle">
                           <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                                 <div className={`h-full ${progress >= 100 ? 'bg-green-500' : 'bg-black'} rounded-full`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                              </div>
                              <span className="text-[9px] font-bold text-gray-500 w-8">{Math.round(progress)}%</span>
                           </div>
                           {progress < 30 && <div className="text-[9px] text-red-400 flex items-center gap-1 mt-0.5"><AlertCircle size={8}/> Bajo</div>}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 font-medium">{rec.totalEmisores}</td>
                     </tr>
                  );
               })}
            </tbody>
          </table>
       </div>

       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded w-full max-w-xs p-5 shadow-xl">
              <h3 className="text-sm font-bold uppercase mb-4">Invitar Reclutador</h3>
              <form onSubmit={handleRegister} className="space-y-3">
                 <input required className="w-full border border-gray-300 p-2 rounded text-xs" placeholder="Nombre" value={newName} onChange={e => setNewName(e.target.value)} />
                 <input required type="email" className="w-full border border-gray-300 p-2 rounded text-xs" placeholder="Correo" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                 <button className="w-full bg-black text-white py-2 rounded text-xs font-bold uppercase">Enviar</button>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-[10px] text-gray-500 underline mt-2">Cancelar</button>
              </form>
           </div>
        </div>
       )}
    </div>
  );
};

export default Reclutadores;