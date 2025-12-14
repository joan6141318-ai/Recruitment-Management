
import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { ShieldAlert, CheckCircle, Ban, UserPlus, X } from 'lucide-react';

interface ReclutadoresProps {
  user: User;
}

const Reclutadores: React.FC<ReclutadoresProps> = ({ user }) => {
  const [recruiters, setRecruiters] = useState<User[]>([]);
  
  // Invite Modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const data = await dataService.getRecruiters();
    setRecruiters(data);
  };

  const handleToggleAccess = async (rec: User) => {
    if (confirm(`¿Estás seguro de ${rec.rol === 'banned' ? 'reactivar' : 'revocar el acceso a'} ${rec.nombre}?`)) {
       await dataService.toggleUserAccess(rec.id, rec.rol);
       loadData();
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          await authService.createRecruiterInvite(inviteName, inviteEmail);
          setIsInviteOpen(false);
          setInviteName(''); setInviteEmail('');
          loadData();
      } catch (e) {
          alert('Error al invitar');
      }
  };

  return (
    <div className="pb-20">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-black uppercase tracking-tight">Gestión de Equipo</h2>
          <button onClick={() => setIsInviteOpen(true)} className="bg-black text-white p-2 rounded-lg"><UserPlus size={20}/></button>
      </div>

      <div className="space-y-3">
          {recruiters.map(rec => (
              <div key={rec.id} className={`bg-white p-4 rounded-xl border ${rec.rol === 'banned' ? 'border-red-200 bg-red-50' : 'border-gray-100'} shadow-sm flex justify-between items-center`}>
                  <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${rec.rol === 'banned' ? 'bg-red-300' : 'bg-gray-900'}`}>
                          {rec.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                          <p className={`text-sm font-bold ${rec.rol === 'banned' ? 'text-red-600 line-through' : 'text-gray-900'}`}>{rec.nombre}</p>
                          <p className="text-[10px] text-gray-400">{rec.correo}</p>
                      </div>
                  </div>
                  
                  <button 
                    onClick={() => handleToggleAccess(rec)}
                    className={`p-2 rounded-lg transition-colors ${rec.rol === 'banned' ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-500'}`}
                  >
                      {rec.rol === 'banned' ? <CheckCircle size={18} /> : <Ban size={18} />}
                  </button>
              </div>
          ))}
      </div>

      {isInviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
               <div className="bg-white w-full max-w-sm rounded-2xl p-6">
                   <div className="flex justify-between mb-4">
                       <h3 className="text-lg font-black uppercase">Nuevo Reclutador</h3>
                       <button onClick={() => setIsInviteOpen(false)}><X size={20} className="text-gray-400"/></button>
                   </div>
                   <form onSubmit={handleInvite} className="space-y-3">
                       <input required placeholder="Nombre" value={inviteName} onChange={e => setInviteName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-black"/>
                       <input required type="email" placeholder="Correo" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold outline-none focus:border-black"/>
                       <button className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase text-xs mt-2">Enviar Invitación</button>
                   </form>
               </div>
          </div>
      )}
    </div>
  );
};

export default Reclutadores;
