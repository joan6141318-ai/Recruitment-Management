import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { UserPlus, Mail, X, Power, Target, Database, ArrowRight } from 'lucide-react';
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

  const INDIVIDUAL_GOAL = 15;

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const usersData = await dataService.getRecruiters();
    const allEmisores = await dataService.getEmisores({ ...user, rol: 'admin' });

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
        alert('Error al invitar al reclutador.'); 
    }
  };

  const toggleAccess = async (recruiter: User) => {
      if(!confirm(`¿Cambiar acceso de ${recruiter.nombre}?`)) return;
      await dataService.toggleUserAccess(recruiter.id, recruiter.activo);
      loadData();
  };

  const viewDatabase = (recruiterId: string, recruiterName: string) => {
    navigate(`/emisores?reclutador=${recruiterId}&nombre=${encodeURIComponent(recruiterName)}`);
  };

  return (
    <div className="space-y-6 pb-20">
       
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight">Equipo</h2>
            <p className="text-gray-500 text-sm mt-1">Gestión de accesos y métricas.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-gray-200 active:scale-95 transition-all"
          >
             <UserPlus size={18} /> Nuevo Reclutador
          </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? <div className="col-span-full text-center py-10 text-gray-400">Calculando...</div> : 
           recruiters.map((rec) => {
               const progress = Math.min((rec.emisoresCount / INDIVIDUAL_GOAL) * 100, 100);
               const isGoalMet = rec.emisoresCount >= INDIVIDUAL_GOAL;

               return (
               <div key={rec.id} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-black/10 transition-colors">
                   
                   <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold border ${rec.activo ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                               {rec.nombre.charAt(0).toUpperCase()}
                           </div>
                           <div>
                               {/* NOMBRE: Grande y Negrita */}
                               <h3 className={`font-bold text-lg leading-tight capitalize ${rec.activo ? 'text-black' : 'text-gray-400 line-through'}`}>{rec.nombre}</h3>
                               {/* CORREO: Pequeño y Gris */}
                               <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1 font-medium">
                                   <Mail size={12} /> {rec.correo}
                               </div>
                           </div>
                       </div>
                       
                       <button 
                           onClick={() => toggleAccess(rec)}
                           className={`p-2 rounded-full transition-colors ${rec.activo ? 'text-gray-300 hover:text-red-500 hover:bg-red-50' : 'text-green-500 bg-green-50'}`}
                           title={rec.activo ? "Revocar Acceso" : "Activar Acceso"}
                       >
                           <Power size={18} />
                       </button>
                   </div>

                   {rec.activo ? (
                       <div className="space-y-4">
                           <div className="bg-gray-50 rounded-2xl p-4">
                               <div className="flex justify-between items-center mb-2">
                                   <div className="flex items-center gap-2">
                                       <Target size={16} className={isGoalMet ? 'text-green-600' : 'text-black'} />
                                       <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Productividad</span>
                                   </div>
                                   <span className="text-sm font-black text-black">{rec.emisoresCount} <span className="text-gray-400 font-medium text-xs">/ {INDIVIDUAL_GOAL}</span></span>
                               </div>
                               <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                   <div 
                                       className={`h-full rounded-full transition-all duration-500 ${isGoalMet ? 'bg-green-500' : 'bg-black'}`}
                                       style={{width: `${progress}%`}}
                                   ></div>
                               </div>
                           </div>

                           <button 
                               onClick={() => viewDatabase(rec.id, rec.nombre)}
                               className="w-full py-3 border border-gray-200 text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors"
                           >
                               <Database size={16} />
                               <span>Ver Base</span>
                               <ArrowRight size={16} className="opacity-50" />
                           </button>
                       </div>
                   ) : (
                       <div className="flex-1 flex items-center justify-center text-xs font-bold text-red-400 bg-red-50 rounded-2xl p-4">
                           ACCESO REVOCADO
                       </div>
                   )}
               </div>
           )})
          }
       </div>

       {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl relative z-10 animate-pop-in">
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-black tracking-tight">Invitar Reclutador</h3>
                  <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-300 hover:text-black transition-colors"/></button>
              </div>
              <form onSubmit={handleRegister} className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-black uppercase tracking-wide ml-1">Nombre Completo</label>
                    <input 
                        required 
                        className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black" 
                        placeholder="Ej. Juan Pérez"
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-black uppercase tracking-wide ml-1">Correo Electrónico</label>
                    <input 
                        required 
                        type="email" 
                        className="w-full bg-gray-50 border-none p-4 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-black" 
                        placeholder="ejemplo@moon.com"
                        value={newEmail} 
                        onChange={e => setNewEmail(e.target.value)} 
                    />
                 </div>
                 <button className="w-full bg-black text-white py-4 rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl">
                     Enviar Invitación
                 </button>
              </form>
           </div>
        </div>
       )}
    </div>
  );
};

export default Reclutadores;