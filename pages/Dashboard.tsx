
import React, { useEffect, useState } from 'react';
import { User, Emisor } from '../types';
import { dataService } from '../services/db';
import { Users, Clock, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToEmisores(user, (data) => {
      setEmisores(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const activeCount = emisores.filter(e => e.estado === 'activo').length;
  const totalHours = emisores.reduce((acc, curr) => acc + (curr.horas_mes || 0), 0);

  const StatCard = ({ label, value, icon: Icon, detail }: any) => (
    <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] group hover:border-black transition-all duration-500">
      <div className="flex items-start justify-between mb-6">
        <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{detail}</span>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{label}</p>
        <p className="text-4xl font-brand font-black text-black tracking-tighter">{value}</p>
      </div>
    </div>
  );

  if (loading) return null;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Agencia Moon / {user.rol}</h2>
          <h1 className="text-5xl font-brand font-black text-black tracking-tighter">Panel Central</h1>
        </div>
        <div className="bg-black text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
          <Calendar size={14} className="text-primary" />
          {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Gestión Activa" value={activeCount} icon={Users} detail="Emisores" />
        <StatCard label="Rendimiento" value={`${totalHours.toFixed(0)}h`} icon={Clock} detail="Mes Actual" />
        <StatCard label="Crecimiento" value={emisores.length} icon={TrendingUp} detail="Total Histórico" />
      </div>

      <div className="bg-black rounded-[3rem] p-12 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-md space-y-4">
            <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">IA Assist Activa</h3>
            <p className="text-3xl font-brand font-black text-white tracking-tight leading-tight">
              Optimiza tu reclutamiento con análisis inteligente de datos.
            </p>
          </div>
          <Link 
            to="/chatbot" 
            className="bg-white text-black px-8 py-5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all"
          >
            Hablar con agencIA <ChevronRight size={16} />
          </Link>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -mr-48 -mt-48 transition-opacity opacity-50 group-hover:opacity-100"></div>
      </div>
    </div>
  );
};

export default Dashboard;
