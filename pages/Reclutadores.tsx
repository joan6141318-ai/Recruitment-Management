import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { Plus, TrendingUp, Calendar, ArrowRight, Award, UserPlus, X } from 'lucide-react';

interface ReclutadoresProps {
  user: User;
}

interface RecruiterStats extends User {
  totalEmisores: number;
  monthlyEmisores: number;
}

const Reclutadores: React.FC<ReclutadoresProps> = ({ user }) => {
  const [recruiters, setRecruiters] = useState<RecruiterStats[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const currentMonthISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthName = now.toLocaleString('es-ES', { month: 'long' });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const usersData = await dataService.getRecruiters();
      const emisoresData = await dataService.getEmisores(user);

      const stats = usersData.map(recruiter => {
        const recruiterEmisores = emisoresData.filter(e => e.reclutador_id === recruiter.id);
        const monthly = recruiterEmisores.filter(e => e.mes_entrada === currentMonthISO).length;
        const total = recruiterEmisores.length;
        return {
          ...recruiter,
          totalEmisores: total,
          monthlyEmisores: monthly,
        };
      });

      setRecruiters(stats.sort((a, b) => b.monthlyEmisores - a.monthlyEmisores));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await authService.createRecruiterInvite(newName, newEmail);
      setIsModalOpen(false);
      setNewName('');
      setNewEmail('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error al registrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
       
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-black tracking-tight uppercase">Equipo</h1>
          <div className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Calendar size={10} />
            <span>{monthName}</span>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <UserPlus size={16} />
          <span className="font-bold text-xs uppercase tracking-wide">Nuevo Miembro</span>
        </button>
      </div>

      {loading && recruiters.length === 0 ? (
         <div className="flex justify-center py-10"><div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recruiters.map((rec, index) => {
            const isTopPerformer = index === 0 && rec.monthlyEmisores > 0;

            return (
                <div 
                  key={rec.id} 
                  className={`relative bg-white rounded-2xl p-5 transition-all duration-300 hover:shadow-md border ${isTopPerformer ? 'border-primary/40 ring-1 ring-primary/20' : 'border-gray-100'}`}
                >
                    {isTopPerformer && (
                        <div className="absolute -top-3 -right-3 bg-primary text-white p-1.5 rounded-lg shadow-sm z-10">
                            <Award size={16} fill="currentColor"/>
                        </div>
                    )}

                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-black leading-tight capitalize truncate">
                            {rec.nombre.toLowerCase()}
                        </h2>
                        {isTopPerformer && <p className="text-primary font-bold text-[10px] uppercase tracking-wider mt-1">Top Reclutador</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3 flex flex-col justify-between h-20">
                            <div className="flex items-center gap-1 text-accent mb-1">
                                <TrendingUp size={12} />
                                <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Mes</span>
                            </div>
                            <span className="text-2xl font-black text-black tracking-tight">
                                {rec.monthlyEmisores}
                            </span>
                        </div>

                        <div className="border border-gray-100 rounded-xl p-3 flex flex-col justify-between h-20">
                            <div className="text-gray-400 text-[9px] font-bold uppercase tracking-wide mb-1">Total</div>
                            <span className="text-2xl font-black text-gray-400">
                                {rec.totalEmisores}
                            </span>
                        </div>
                    </div>
                </div>
            );
            })}
        </div>
      )}

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl relative animate-pop-in">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-1.5 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-colors"><X size={16}/></button>

            <h3 className="text-xl font-bold text-black mb-1">Invitar</h3>
            <p className="text-gray-400 mb-6 font-medium text-xs">Crear cuenta para reclutador</p>
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre</label>
                <input 
                    required 
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl font-medium text-sm text-black outline-none focus:border-black focus:bg-white transition-all" 
                    placeholder="Nombre completo"
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Correo</label>
                <input 
                    type="email"
                    required 
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl font-medium text-sm text-black outline-none focus:border-black focus:bg-white transition-all" 
                    placeholder="correo@ejemplo.com"
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-xs font-bold bg-red-50 p-2 rounded-lg">{error}</p>
              )}

              <div className="pt-2">
                 <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-black text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-accent transition-colors flex justify-center items-center gap-2"
                 >
                    {loading ? '...' : 'Invitar'} <ArrowRight size={14} />
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