import React, { useState } from 'react';
import { Plane, Lock, User, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user.username, pass);
      } else {
        setError(data.message || 'Error de acceso');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden">
      {/* Fondo de Rio de Janeiro - Cristo Redentor */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=2000&q=80")',
          filter: 'brightness(0.5) contrast(1.1)'
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/40 via-transparent to-black/80 z-1" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8 mx-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/50 mb-4">
            <Plane className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight text-center">
            VIAJE A BRASIL
          </h1>
          <p className="text-emerald-200/80 text-sm font-medium mt-1">Acceso al Itinerario Familiar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2 ml-1">Usuario</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
              <input 
                type="text" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="Ingresa tu usuario"
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-emerald-300 uppercase tracking-widest mb-2 ml-1">Clave</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
              <input 
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full ${isLoading ? 'bg-emerald-600 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400'} text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 group mt-4 active:scale-[0.98]`}
          >
            <span>{isLoading ? 'VERIFICANDO...' : 'INGRESAR AL VIAJE'}</span>
            {!isLoading && <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-tighter">
            Conectado a Autenticación Supabase
          </p>
        </div>
      </motion.div>
    </div>
  );
}
