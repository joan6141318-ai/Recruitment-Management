import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { UserPlus, Mail, X, Power, ShieldCheck, ShieldAlert, Target, Users, Database, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReclutadoresProps {
  user: User;
}

interface RecruiterStats extends User {
  emisoresCount: number;
}

const Reclutadores: React.FC<ReclutadoresProps> = ({ user }) => {
  const [recruiters, setRecruiters] = useState<RecruiterStats[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Meta Mensual (Para Admin, la meta global es 30, pero individualmente cada reclutador debe hacer 15)
  const INDIVIDUAL_GOAL = 15;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    // 1. Obtener reclutadores
    const usersData = await dataService.getRecruiters();
    // 2. Obtener TODOS los emisores (como admin) para contar
    const allEmisores = await dataService.getEmisores({ ...user, rol: 'admin' });

    // 3. Mapear conteo
    const statsData = usersData.map(rec => ({
        ...rec,
        emisoresCount: allEmisores.filter(e => e.reclutador_id === rec.id).length
    }));

    setRecruiters(statsData);
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.createRecruiterInvite(newName, newEmail);
      setIsModalOpen(false); 
      setNewName(''); 
      setNewEmail(''); 
      loadData();
    } catch (err) { 
        alert('Error al invitar al reclutador. Verifica si el correo ya existe.'); 
    }
  };

  const toggleAccess = async (recruiter: User) => {
      if(!confirm(`¿Estás seguro que deseas ${recruiter.activo ? 'REVOCAR' : 'ACTIVAR'} el acceso a ${recruiter.nombre}?`)) return;
      await dataService.toggleUserAccess(recruiter.id, recruiter.activo);
      loadData();
  };

  const viewDatabase = (recruiterId: string, recruiterName: string) => {
    navigate(`/emisores?reclutador=${recruiterId}&nombre=${encodeURIComponent(recruiterName)}`);
  };

  return (
    <div className="space-y-6 pb-20">
       
       {/* Header */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Equipo de Reclutamiento</h2>
            <p className="text-gray-500 mt-1 text-sm">Meta mensual Individual: <span className="font-bold text-black">{INDIVIDUAL_GOAL} Emisores</span></p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-black text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-gray-800 transition-all"
          >
             <UserPlus size={18} /> Nuevo Reclutador
          </button>
       </div>

       {/* Lista de Reclutadores con Métricas */}
       <div className="grid grid-cols-1 gap-4">
          {loading ? <div className="text-center py-10 text-gray-400">Calculando productividad...</div> : 
           recruiters.map((rec) => {
               const progress = Math.min((rec.emisoresCount / INDIVIDUAL_GOAL) * 100, 100);
               const isGoalMet = rec.emisoresCount >= INDIVIDUAL_GOAL;

               return (
               <div key={rec.id} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex flex-col gap-6 relative overflow-hidden group">
                   
                   {/* Top Section: Info & Access */}
                   <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                       <div className="flex items-center gap-4">
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border ${rec.activo ? 'bg-gray-50 border-gray-200 text-gray-700' : 'bg-red-50 border-red-100 text-red-500'}`}>
                               {rec.nombre.charAt(0).toUpperCase()}
                           </div>
                           <div>
                               <h3 className={`font-bold text-base ${rec.activo ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{rec.nombre}</h3>
                               <div className="flex items-center gap-2 text-sm text-gray-500">
                                   <Mail size={14} /> {rec.correo}
                               </div>
                           </div>
                       </div>
                       
                       {/* Control Buttons */}
                       <div className="flex items-center gap-3">
                           <button 
                               onClick={() => toggleAccess(rec)}
                               className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-2
                               ${rec.activo 
                                   ? 'border-gray-200 text-gray-500 hover:bg-gray-50' 
                                   : 'border-green-200 text-green-600 hover:bg-green-50'
                               }`}
                           >
                               <Power size={14} />
                               {rec.activo ? 'Revocar' : 'Activar'}
                           </button>
                       </div>
                   </div>

                   {/* Productivity Bar & Database Action */}
                   {rec.activo && (
                       <div className="flex flex-col md:flex-row gap-4">
                           {/* Stats */}
                           <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                               <div className="flex justify-between items-end mb-2">
                                   <div className="flex items-center gap-2">
                                       <Target size={16} className={isGoalMet ? 'text-green-600' : 'text-accent'} />
                                       <span className="text-xs font-bold text-gray-500 uppercase">Productividad Mes</span>
                                   </div>
                                   <div className="text-right">
                                       <span className="text-lg font-black text-gray-900">{rec.emisoresCount}</span>
                                       <span className="text-xs text-gray-400 font-bold"> / {INDIVIDUAL_GOAL}</span>
                                   </div>
                               </div>
                               <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                   <div 
                                       className={`h-full rounded-full transition-all duration-500 ${isGoalMet ? 'bg-green-500' : 'bg-primary'}`}
                                       style={{width: `${progress}%`}}
                                   ></div>
                               </div>
                           </div>

                           {/* View DB Button */}
                           <button 
                               onClick={() => viewDatabase(rec.id, rec.nombre)}
                               className="bg-black text-white px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-gray-800 transition-colors md:w-auto w-full py-4 md:py-0"
                           >
                               <Database size={16} />
                               <span>Ver lista de Emisores</span>
                               <ArrowRight size={16} className="opacity-50" />
                           </button>
                       </div>
                   )}
               </div>
           )})
          }
       </div>

       {/* Modal Invitación */}
       {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative z-10 animate-pop-in">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900">Registrar Reclutador</h3>
                  <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-black"/></button>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1 uppercase">Nombre Completo</label>
                    <input 
                        required 
                        className="w-full bg-white border border-gray-300 p-3 rounded-lg text-sm outline-none focus:border-black transition-colors" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1 uppercase">Correo Electrónico</label>
                    <input 
                        required 
                        type="email" 
                        className="w-full bg-white border border-gray-300 p-3 rounded-lg text-sm outline-none focus:border-black transition-colors" 
                        value={newEmail} 
                        onChange={e => setNewEmail(e.target.value)} 
                    />
                 </div>
                 <div className="pt-2">
                    <button className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-bold hover:bg-gray-900 transition-colors">
                        Dar de Alta
                    </button>
                 </div>
              </form>
           </div>
        </div>
       )}
    </div>
  );
};

export default Reclutadores;