import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { UserPlus, X, Mail, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

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
    // Confirmación descriptiva
    const action = rec.rol === 'banned' ? 'REACTIVAR' : 'REVOCAR';
    if (confirm(`⚠️ ¿Estás seguro de que deseas ${action} el acceso a ${rec.nombre}?`)) {
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
            <h2 className="text-2xl font-black text-black tracking-tight">Equipo</h2>
            <p className="text-xs text-gray-500 font-medium">Gestión de accesos y roles</p>
          </div>
          <button onClick={() => setIsInviteOpen(true)} className="bg-black text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-lg active:scale-95">
              <UserPlus size={16}/> <span>INVITAR</span>
          </button>
      </div>

      <div className="grid gap-4">
          {recruiters.length === 0 && <p className="text-gray-400 text-sm text-center py-10">No hay reclutadores aún.</p>}
          
          {recruiters.map(rec => {
              const isBanned = rec.rol === 'banned';
              return (
                  <div key={rec.id} className={`bg-white p-5 rounded-3xl border transition-all ${isBanned ? 'border-accent/30 bg-orange-50/10' : 'border-gray-100 shadow-card'}`}>
                      <div className="flex justify-between items-start mb-5">
                          <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-sm ${isBanned ? 'bg-accent grayscale' : 'bg-black'}`}>
                                  {rec.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                  <p className={`text-base font-bold ${isBanned ? 'text-gray-400 line-through' : 'text-black'}`}>{rec.nombre}</p>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5 font-medium">
                                      <Mail size={12} />
                                      <span>{rec.correo}</span>
                                  </div>
                              </div>
                          </div>
                          
                          {/* STATUS BADGE */}
                          <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-1 ${isBanned ? 'bg-accent/10 text-accent' : 'bg-green-100 text-green-700'}`}>
                              {isBanned ? (
                                  <><AlertTriangle size={10} /> Sin Acceso</>
                              ) : (
                                  <><ShieldCheck size={10} /> Activo</>
                              )}
                          </div>
                      </div>
                      
                      {/* BOTÓN DE ACCIÓN ESPECÍFICO */}
                      <button 
                        onClick={() => handleToggleAccess(rec)}
                        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                            isBanned 
                            ? 'bg-black text-white hover:bg-gray-800 shadow-lg' 
                            : 'bg-white border-2 border-accent text-accent hover:bg-accent hover:text-white'
                        }`}
                      >
                          {isBanned ? (
                              <>Reactivar Acceso <ShieldCheck size={14}/></>
                          ) : (
                              <>Revocar Permisos <ShieldAlert size={14}/></>
                          )}
                      </button>
                  </div>
              );
          })}
      </div>

      {isInviteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
               <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl">
                   <div className="flex justify-between mb-6">
                       <h3 className="text-xl font-black text-black">Invitar Reclutador</h3>
                       <button onClick={() => setIsInviteOpen(false)}><X size={24} className="text-gray-400 hover:text-black"/></button>
                   </div>
                   <form onSubmit={handleInvite} className="space-y-4">
                       <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Nombre</label>
                           <input required value={inviteName} onChange={e => setInviteName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none" placeholder="Nombre completo"/>
                       </div>
                       <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Correo</label>
                           <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-black outline-none" placeholder="correo@ejemplo.com"/>
                       </div>
                       <button className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest mt-4 hover:bg-gray-800 transition-colors shadow-lg">
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