import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { Plus, Mail, User as UserIcon, TrendingUp, Calendar, Target, Award } from 'lucide-react';

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

  // Date constants
  const now = new Date();
  const currentMonthISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthName = now.toLocaleString('es-ES', { month: 'long' });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Obtener todos los reclutadores
      const usersData = await dataService.getRecruiters();
      
      // 2. Obtener todos los emisores (como admin)
      const emisoresData = await dataService.getEmisores(user);

      // 3. Procesar estadísticas
      const stats = usersData.map(recruiter => {
        const recruiterEmisores = emisoresData.filter(e => e.reclutador_id === recruiter.id);
        
        const monthly = recruiterEmisores.filter(e => e.mes_entrada === currentMonthISO).length;
        const total = recruiterEmisores.length;

        // Encontrar fecha más reciente de registro
        const lastEntry = recruiterEmisores
            .map(e => new Date(e.fecha_registro).getTime())
            .sort((a,b) => b - a)[0];

        return {
          ...recruiter,
          totalEmisores: total,
          monthlyEmisores: monthly,
          lastActivity: lastEntry ? new Date(lastEntry).toLocaleDateString() : 'Sin actividad'
        };
      });

      // Ordenar por desempeño mensual (mayor a menor)
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

  const inputClass = "w-full bg-white border border-gray-200 pl-10 p-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all shadow-sm";

  return (
    <div className="space-y-8 animate-slide-up">
       
       {/* Header Section */}
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Rendimiento del Equipo</h2>
          <div className="flex items-center space-x-2 mt-1 text-gray-400 text-sm font-medium uppercase tracking-wider">
            <Calendar size={14} className="text-accent" />
            <span>Mes de {monthName}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black hover:bg-gray-800 text-white px-5 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-black/10 transition-all active:scale-95"
        >
          <Plus size={18} />
          <span className="font-bold text-sm">Invitar Reclutador</span>
        </button>
      </div>

      {/* Leaderboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recruiters.map((rec, index) => {
          const isTopPerformer = index === 0 && rec.monthlyEmisores > 0;

          return (
            <div key={rec.id} className="relative bg-white rounded-2xl shadow-card border border-gray-100 p-6 transition-all hover:shadow-lg hover:-translate-y-1 group overflow-hidden">
              
              {/* Top Performer Badge */}
              {isTopPerformer && (
                 <div className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1 z-10">
                    <Award size={12} /> TOP MES
                 </div>
              )}

              {/* Header Profile */}
              <div className="flex items-center space-x-4 mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm transition-colors ${isTopPerformer ? 'bg-gradient-to-br from-primary to-purple-600 text-white' : 'bg-gray-50 text-gray-500 group-hover:bg-primary group-hover:text-white'}`}>
                  {rec.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-gray-900 truncate text-lg">{rec.nombre}</h4>
                  <div className="flex items-center text-gray-400 text-xs truncate">
                    <Mail size={12} className="mr-1.5" />
                    <span className="truncate">{rec.correo}</span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3">
                 {/* Monthly Metric (Highlighted) */}
                 <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100 flex flex-col justify-between h-24 relative overflow-hidden">
                     <div className="absolute -right-2 -top-2 text-accent/10 transform rotate-12">
                        <TrendingUp size={60} />
                     </div>
                     <span className="text-[10px] font-bold text-accent uppercase tracking-wider relative z-10">Nuevo ({monthName})</span>
                     <div className="flex items-end gap-1 relative z-10">
                        <span className="text-4xl font-bold text-gray-900">{rec.monthlyEmisores}</span>
                        <span className="text-xs font-medium text-gray-400 mb-1.5">emisores</span>
                     </div>
                 </div>

                 {/* Total Metric */}
                 <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col justify-between h-24">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Histórico</span>
                     <div className="flex items-end gap-1">
                        <span className="text-2xl font-bold text-gray-900">{rec.totalEmisores}</span>
                        <span className="text-xs font-medium text-gray-400 mb-1">total</span>
                     </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-medium">Último registro</span>
                  <span className="text-xs font-bold text-gray-600">{rec.lastActivity}</span>
              </div>
            </div>
          );
        })}
      </div>

       {/* Modal de Invitación */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Invitar Reclutador</h3>
            <p className="text-sm text-gray-500 mb-6">Crea un perfil para que el reclutador pueda registrarse.</p>
            
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre Completo</label>
                <div className="relative group">
                  <UserIcon size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                  <input required className={inputClass} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Juan Pérez" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-black transition-colors" />
                  <input type="email" required className={inputClass} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                </div>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
                    {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 hover:text-black font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-70 flex justify-center">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Guardar Perfil'}
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