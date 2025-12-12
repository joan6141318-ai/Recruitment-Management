import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { dataService, authService } from '../services/db';
import { Plus, Mail, User as UserIcon } from 'lucide-react';

const Reclutadores: React.FC = () => {
  const [recruiters, setRecruiters] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await dataService.getRecruiters();
    setRecruiters(data);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await authService.registerUser(newName, newEmail, 'reclutador');
    setIsModalOpen(false);
    setNewName('');
    setNewEmail('');
    loadData();
  };

  const inputClass = "w-full bg-white border border-gray-200 pl-10 p-2.5 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm";

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reclutadores</h2>
          <p className="text-gray-500 text-sm">Administra el equipo de tu agencia</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-purple-800 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 shadow-md transition-colors"
        >
          <Plus size={18} />
          <span>Nuevo Reclutador</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recruiters.map(rec => (
          <div key={rec.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-primary font-bold text-xl">
              {rec.nombre.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-gray-900 truncate">{rec.nombre}</h4>
              <div className="flex items-center text-gray-500 text-sm">
                <Mail size={12} className="mr-1" />
                <span className="truncate">{rec.correo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

       {/* Modal */}
       {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Registrar Reclutador</h3>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nombre Completo</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input required className={inputClass} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej. Juan Pérez" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-gray-400" />
                  <input type="email" required className={inputClass} value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="correo@ejemplo.com" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-purple-800 transition-colors shadow-md">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reclutadores;