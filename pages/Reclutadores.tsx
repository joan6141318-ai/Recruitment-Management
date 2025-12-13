import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { Plus, Mail, User as UserIcon, TrendingUp, Calendar, ArrowRight, Award } from 'lucide-react';

interface ReclutadoresProps {
  user: User;
}

interface RecruiterStats extends User {
  totalEmisores: number;
  monthlyEmisores: number;
  lastActivity?: string;
}

const Reclutadores: React.FC<ReclutadoresProps> = ({ user }) => {
  const [recruiters, setRecruiters] = useState<RecruiterStats[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form States
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
        const lastEntry = recruiterEmisores
            .map(e => new Date(e.fecha_registro).getTime())
            .sort((a,b) => b - a)[0];

        return {
          ...recruiter,
          totalEmisores: total,
          monthlyEmisores: monthly,
          lastActivity: lastEntry ? new Date(lastEntry).toLocaleDateString() : '—'
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
       
       {/* Header Minimalista */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-up">
        <div>
          <h1 className="text-4xl font-extrabold text-black tracking-tight mb-2">Equipo</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest">
            <Calendar size={12} />
            <span>Rendimiento {monthName}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group bg-primary hover:bg-black text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/10 transition-colors">
             <Plus size={18} />
          </div>
          <span className="font-bold">Nuevo Reclutador</span>
        </button>
      </div>

      {loading && recruiters.length === 0 ? (
         <div className="flex justify-center py-20 animate-pulse">
            <div className="h-8 w-8 bg-black rounded-full"></div>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recruiters.map((rec, index) => {
            const isTopPerformer = index === 0 && rec.monthlyEmisores > 0;

            return (
                <div 
                  key={rec.id} 
                  className={`relative bg-surface rounded-[2rem] p-8 transition-all duration-500 hover:-translate-y-2 group animate-fade-up border border-transparent hover:border-black/5 ${isTopPerformer ? 'shadow-float ring-1 ring-primary/20' : 'shadow-card'}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                    {/* Badge Top Performer */}
                    {isTopPerformer && (
                        <div className="absolute -top-3 -right-3 bg-black text-white p-3 rounded-2xl shadow-xl rotate-12 z-10 animate-pulse-soft">
                            <Award size={24} className="text-primary" fill="currentColor"/>
                        </div>
                    )}

                    {/* Nombre Principal (Hero) */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-black leading-tight mb-1 group-hover:text-primary transition-colors">
                            {rec.nombre}
                        </h2>
                        {/* Correo discreto */}
                        <div className="flex items-center gap-2 text-subtle text-xs font-medium">
                            <Mail size={12} />
                            <span className="truncate max-w-[200px]">{rec.correo}</span>
                        </div>
                    </div>

                    {/* Métricas Grandes */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background rounded-2xl p-4 flex flex-col justify-between h-28 border border-transparent group-hover:border-primary/10 transition-colors">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <TrendingUp size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Este Mes</span>
                            </div>
                            <span className="text-5xl font-black text-black tracking-tighter">
                                {rec.monthlyEmisores}
                            </span>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col justify-between h-28">
                            <div className="text-subtle text-[10px] font-bold uppercase tracking-widest mb-2">Total Histórico</div>
                            <span className="text-3xl font-bold text-gray-400 group-hover:text-black transition-colors">
                                {rec.totalEmisores}
                            </span>
                        </div>
                    </div>

                    {/* Barra Decorativa */}
                    <div className="mt-6 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full bg-primary transition-all duration-1000 ${isTopPerformer ? 'w-full' : 'w-1/3 opacity-30'}`}></div>
                    </div>
                </div>
            );
            })}
        </div>
      )}

       {/* Modal Minimalista */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/80 backdrop-blur-xl animate-enter">
          <div className="bg-white w-full max-w-md p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 relative">
            <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-colors"
            >
                <Plus size={20} className="rotate-45" />
            </button>

            <h3 className="text-3xl font-black text-black mb-2">Nuevo Miembro</h3>
            <p className="text-gray-400 mb-8 font-medium">Invita a un reclutador al equipo.</p>
            
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-black uppercase tracking-widest">Nombre Completo</label>
                <input 
                    required 
                    className="w-full bg-background border-2 border-transparent focus:border-black focus:bg-white px-5 py-4 rounded-2xl font-bold text-black outline-none transition-all" 
                    placeholder="Ej. Ana García"
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-black uppercase tracking-widest">Correo Electrónico</label>
                <input 
                    type="email"
                    required 
                    className="w-full bg-background border-2 border-transparent focus:border-black focus:bg-white px-5 py-4 rounded-2xl font-bold text-black outline-none transition-all" 
                    placeholder="correo@moon.com"
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl">{error}</p>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-xl"
              >
                {loading ? 'Procesando...' : (
                    <>
                        Crear Perfil <ArrowRight size={20} />
                    </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reclutadores;