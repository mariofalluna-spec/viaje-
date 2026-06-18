import React, { useState } from 'react';
import { Sparkles, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import rioImg from '../assets/images/rio_de_janeiro_elegant_1781704231352.jpg';
import { playRingtone, prepareAudio } from '../utils/audioSynth';

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    onLogin('viajero', '');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 overflow-y-auto py-10 select-none font-sans">
      {/* Background with Rio de Janeiro cover */}
      <motion.div 
        initial={{ scale: 1 }}
        animate={{ scale: 1.15 }}
        transition={{ duration: 30, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        className="absolute inset-0 z-0 bg-cover bg-center opacity-70"
        style={{ 
          backgroundImage: `url(${rioImg})`,
          filter: 'brightness(0.6) contrast(1.1) saturate(0.9)'
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-1" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm p-10 mx-5 my-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between"
      >
        <div>
          {/* Header section with elegant Rio vibes */}
          <div className="flex flex-col items-center mb-10">
            <div className="p-3 bg-zinc-800/50 text-emerald-400 rounded-full border border-white/10 mb-6 group">
              <MapPin className="w-6 h-6 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h1 className="text-2xl font-light text-zinc-100 tracking-[0.2em] text-center uppercase">
              Río de Janeiro
            </h1>
            <p className="text-emerald-400 text-xs font-semibold tracking-widest mt-3 uppercase">
              itinerario
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full ${isLoading ? 'bg-zinc-700 cursor-not-allowed' : 'bg-emerald-600/90 hover:bg-emerald-500 hover:shadow-emerald-500/20'} text-zinc-50 text-sm font-semibold tracking-widest py-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 group mt-8`}
            >
              <span>{isLoading ? 'ACCEDIENDO...' : 'INGRESAR'}</span>
              {!isLoading && <Sparkles className="w-4 h-4 text-emerald-200 group-hover:animate-pulse" />}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center select-none opacity-50">
          <p className="text-[9px] text-zinc-400 font-sans uppercase tracking-[0.3em]">
            Experiencia Exclusiva
          </p>
        </div>
      </motion.div>
    </div>
  );
}
