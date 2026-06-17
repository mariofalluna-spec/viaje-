import React, { useState } from 'react';
import { Plane, Lock, User, Sparkles, Mail, UserPlus, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import christRedeemerImg from '../assets/images/christ_the_redeemer_1781656383349.jpg';
import { playRingtone, prepareAudio } from '../utils/audioSynth';

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    prepareAudio();
    playRingtone();
    
    // Simulate slight delay for effect
    setTimeout(() => {
      onLogin('viajero', '');
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-y-auto py-10 select-none">
      {/* Background with Rio de Janeiro Christ Redentor cover */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url(${christRedeemerImg})`,
          filter: 'brightness(0.4) contrast(1.15) saturate(1.1)'
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/35 via-transparent to-black/90 z-1" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-8 mx-4 my-auto bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl flex flex-col justify-between"
      >
        <div>
          {/* Header section with Rio vibes */}
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-yellow-400 text-emerald-950 rounded-2xl shadow-lg shadow-yellow-400/30 mb-3 relative group overflow-hidden">
              <Plane className="w-8 h-8 text-emerald-950 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight text-center">
              VIAJE A BRASIL
            </h1>
            <p className="text-emerald-300/90 text-sm font-semibold mt-1">
              Itinerario Familiar de Río 🌴
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full ${isLoading ? 'bg-emerald-600 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400'} text-white font-extrabold py-5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group mt-6 active:scale-[0.98]`}
            >
              <span className="text-lg">{isLoading ? 'INGRESANDO...' : 'INGRESAR AL VIAJE'}</span>
              {!isLoading && <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform text-yellow-300" />}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center select-none">
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
            Autenticación Simplificada
          </p>
        </div>
      </motion.div>
    </div>
  );
}
