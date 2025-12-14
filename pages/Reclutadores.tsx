import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService } from '../services/db';
import { authService } from '../services/auth';
import { UserPlus, Mail, X, Power, ShieldCheck, ShieldAlert } from 'lucide-react';

interface ReclutadoresProps {
  user: User;
}

const Reclutadores: React.FC<ReclutadoresProps> = ({ user }) => {
  const [recruiters, setRecruiters] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const usersData = await dataService.getRecruiters();
    setRecruiters(usersData);
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

  return (
    <div className="space-y-6 pb-20">
       
       {/* Header Administrativo */}
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Equipo de Reclutamiento</h2>
            <p className="text-gray-500 mt-1 text-sm">Administración de accesos y usuarios.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-black text-white px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-gray-800 transition-all"
          >
             <UserPlus size={18} /> Nuevo Reclutador
          </button>
       </div>

       {/* Lista Simple de Usuarios */}
       <div className="grid grid-cols-1 gap-4">
          {loading ? <div className="text-center py-10 text-gray-400">Cargando equipo...</div> : 
           recruiters.map((rec) => (
               <div key={rec.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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

                   <div className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
                       <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${rec.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {rec.activo ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                           {rec.activo ? 'ACCESO ACTIVO' : 'REVOCADO'}
                       </div>
                       
                       <button 
                           onClick={() => toggleAccess(rec)}
                           className={`ml-auto px-4 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center gap-2
                           ${rec.activo 
                               ? 'border-red-200 text-red-600 hover:bg-red-50' 
                               : 'border-green-200 text-green-600 hover:bg-green-50'
                           }`}
                       >
                           <Power size={14} />
                           {rec.activo ? 'Revocar Acceso' : 'Reactivar Acceso'}
                       </button>
                   </div>
               </div>
           ))
          }
          {recruiters.length === 0 && !loading && (
              <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                  No hay reclutadores registrados.
              </div>
          )}
       </div>

       {/* Modal Simple de Invitación */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900">Registrar Reclutador</h3>
                  <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-black"/></button>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1 uppercase">Nombre Completo</label>
                    <input 
                        required 
                        className="w-full bg-white border border-gray-300 p-3 rounded-lg text-sm outline-none focus:border-black transition-colors placeholder-gray-300" 
                        placeholder="Ej. Juan Pérez" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)} 
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1 uppercase">Correo Electrónico</label>
                    <input 
                        required 
                        type="email" 
                        className="w-full bg-white border border-gray-300 p-3 rounded-lg text-sm outline-none focus:border-black transition-colors placeholder-gray-300" 
                        placeholder="correo@ejemplo.com" 
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