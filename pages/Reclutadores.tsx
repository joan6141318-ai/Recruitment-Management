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
    <div className="space-y-10 pb-20">
       
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tighter mb-2 uppercase">Equipo</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-white rounded-full text-[10px] font-black uppercase tracking-widest">
            <Calendar size={12} />
            <span>{monthName}</span>
          </div>
        </div>
        {/* BOTÓN NARANJA (Identidad de sección Equipo) */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-accent hover:bg-black text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-glow-accent active:scale-95"
        >
          <UserPlus size={20} />
          <span className="font-bold text-sm uppercase tracking-wide">Nuevo Miembro</span>
        </button>
      </div>

      {loading && recruiters.length === 0 ? (
         <div className="flex justify-center py-20"><div className="w-10 h-10 bg-black rounded-full animate-pulse"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recruiters.map((rec, index) => {
            const isTopPerformer = index === 0 && rec.monthlyEmisores > 0;

            return (
                <div 
                  key={rec.id} 
                  className={`relative bg-white rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 animate-pop-in border border-transparent hover:border-black/5 ${isTopPerformer ? 'shadow-glow-primary ring-2 ring-primary' : 'shadow-card'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                    {isTopPerformer && (
                        <div className="absolute -top-4 -right-4 bg-primary text-white p-3 rounded-2xl shadow-lg rotate-12 z-10">
                            <Award size={28} fill="currentColor"/>
                        </div>
                    )}

                    {/* NOMBRE HEROICO (Sin correo) */}
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-black leading-none uppercase tracking-tight break-words">
                            {rec.nombre}
                        </h2>
                        {isTopPerformer && <p className="text-primary font-bold text-xs uppercase tracking-widest mt-2">Líder del mes</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background rounded-2xl p-4 flex flex-col justify-between h-28 group hover:bg-black hover:text-white transition-colors">
                            <div className="flex items-center gap-2 text-accent mb-2">
                                <TrendingUp size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-gray-400">Mes</span>
                            </div>
                            <span className="text-5xl font-black tracking-tighter">
                                {rec.monthlyEmisores}
                            </span>
                        </div>

                        <div className="border-2 border-gray-50 rounded-2xl p-4 flex flex-col justify-between h-28">
                            <div className="text-gray-300 text-[10px] font-black uppercase tracking-widest mb-2">Total</div>
                            <span className="text-3xl font-black text-gray-400">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/90 backdrop-blur-xl animate-pop-in">
          <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-colors"><X size={20}/></button>

            <h3 className="text-3xl font-black text-black mb-2 uppercase">Invitar</h3>
            <p className="text-gray-400 mb-8 font-bold text-xs uppercase tracking-widest">Añade un nuevo reclutador</p>
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Nombre</label>
                <input 
                    required 
                    className="w-full bg-background border-2 border-transparent focus:border-black focus:bg-white px-5 py-4 rounded-2xl font-bold text-black outline-none transition-all uppercase" 
                    placeholder="Nombre"
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Correo</label>
                <input 
                    type="email"
                    required 
                    className="w-full bg-background border-2 border-transparent focus:border-black focus:bg-white px-5 py-4 rounded-2xl font-bold text-black outline-none transition-all" 
                    placeholder="Correo"
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">{error}</p>
              )}

              <div className="pt-4">
                 {/* BOTÓN NEGRO PARA COMMIT */}
                 <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-accent transition-colors flex justify-center items-center gap-2 shadow-lg"
                 >
                    {loading ? '...' : 'Crear Cuenta'} <ArrowRight size={16} />
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