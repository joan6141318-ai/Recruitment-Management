import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { ShieldAlert, CheckCircle, Ban, UserPlus, X, Mail } from 'lucide-react';

interface ReclutadoresProps {
  user: User;
}

const Reclutadores: React.FC<ReclutadoresProps> = ({ user }) => {
  const [recruiters, setRecruiters] = useState<User[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    const data = await dataService.getRecruiters();
    setRecruiters(data);
  };

  const handleToggleAccess = async (rec: User) => {
    if (confirm(`¿${rec.rol === 'banned' ? 'Reactivar' : 'Revocar'} acceso a ${rec.nombre}?`)) {
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
          alert('Error: Ya existe o falló la conexión');
      }
  };

  return (
    <div className="pb-8">
      <div className="flex justify-between items-center mb-6 pt-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Equipo</h2>
            <p className="text-sm text-gray-500">Gestión de accesos</p>
          </div>
          <button onClick={() => setIsInviteOpen(true)} className="bg-black text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2">
              <UserPlus size={16}/> <span>Invitar</span>
          </button>
      </div>

      <div className="grid gap-3">
          {recruiters.length === 0 && <p className="text-gray-400 text-sm text-center py-10">No hay reclutadores aún.</p>}
          
          {recruiters.map(rec => (
              <div key={rec.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex justify-between items-center group hover:border-gray-200 transition-colors">
                  <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm ${rec.rol === 'banned' ? 'bg-red-100 text-red-400' : 'bg-gray-900'}`}>
                          {rec.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                          <p className={`text-sm font-bold ${rec.rol === 'banned' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{rec.nombre}</p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                              <Mail size={12} />
                              <span>{rec.correo}</span>
                          </div>
                      </div>
                  </div>
                  
                  <button 
                    onClick={() => handleToggleAccess(rec)}
                    className={`p-2.5 rounded-lg transition-all ${
                        rec.rol === 'banned' 
                        ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                        : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'
                    }`}
                    title={rec.rol === 'banned' ? "Reactivar Acceso" : "Revocar Acceso"}
                  >
                      {rec.rol === 'banned' ? <CheckCircle size={20} /> : <Ban size={20} />}
                  </button>
              </div>
          ))}
      </div>

      {isInviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
               <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
                   <div className="flex justify-between mb-6">
                       <h3 className="text-lg font-bold text-gray-900">Invitar Reclutador</h3>
                       <button onClick={() => setIsInviteOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                   </div>
                   <form onSubmit={handleInvite} className="space-y-4">
                       <div className="space-y-1">
                           <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre</label>
                           <input required value={inviteName} onChange={e => setInviteName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-black outline-none" placeholder="Nombre completo"/>
                       </div>
                       <div className="space-y-1">
                           <label className="text-xs font-bold text-gray-500 uppercase ml-1">Correo</label>
                           <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-black outline-none" placeholder="correo@ejemplo.com"/>
                       </div>
                       <button className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm mt-4 hover:bg-gray-800 transition-colors">
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