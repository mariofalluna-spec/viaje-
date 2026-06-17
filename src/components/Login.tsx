import React, { useState } from 'react';
import { Plane, Lock, User, Sparkles, Mail, UserPlus, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import christRedeemerImg from '../assets/images/christ_the_redeemer_1781656383349.jpg';
import { playRingtone, prepareAudio } from '../utils/audioSynth';

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Login Form States
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  
  // Sign Up Form States
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPass, setSignUpPass] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    prepareAudio();

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("[Login API Response Error]:", text);
        throw new Error(`Código ${response.status}: El servidor no devolvió JSON.`);
      }

      if (response.ok) {
        playRingtone();
        onLogin(data.user.username, pass);
      } else {
        setError(data.message || 'Error de acceso. Por favor verifica tus credenciales.');
      }
    } catch (err: any) {
      console.error("[Login Connection Error]:", err);
      setError(err?.message || 'No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (signUpPass.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signUpEmail,
          password: signUpPass,
          name: signUpName,
          username: signUpUsername.toLowerCase().trim()
        })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("[SignUp API Error]:", text);
        throw new Error("El servidor de registro no devolvió un JSON válido.");
      }

      if (response.ok) {
        setSuccess('¡Cuenta de Supabase Auth creada con éxito! Ya puedes iniciar sesión con tu correo/usuario.');
        // Autofill credentials
        setUser(signUpEmail);
        setPass(signUpPass);
        setIsSignUp(false);
      } else {
        setError(data.message || 'Fallo al registrar usuario.');
      }
    } catch (err: any) {
      console.error("[SignUp Connection Error]:", err);
      setError(err?.message || 'Fallo de red al registrarse.');
    } finally {
      setIsLoading(false);
    }
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
          <div className="flex flex-col items-center mb-6">
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

          {/* Tab Selector */}
          <div className="flex bg-black/25 p-1.5 rounded-xl border border-white/10 mb-6 font-semibold">
            <button
              onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-xs rounded-lg transition-all ${!isSignUp ? 'bg-white/15 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              INICIAR SESIÓN
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 text-xs rounded-lg transition-all ${isSignUp ? 'bg-white/15 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              CREAR CUENTA
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3 mb-4 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs font-bold text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-bold text-center">
              {success}
            </div>
          )}

          {/* FORMULARIO DE INICIO DE SESIÓN */}
          {!isSignUp ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1.5 ml-1">
                  Usuario o Correo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
                  <input 
                    type="text" 
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="correo@ejemplo.com o tu_usuario"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all font-medium"
                    required
                    disabled={isLoading}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1.5 ml-1">
                  Clave
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
                  <input 
                    type="password" 
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all font-medium"
                    required
                    disabled={isLoading}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full ${isLoading ? 'bg-emerald-600 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400'} text-white font-extrabold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group mt-6 active:scale-[0.98]`}
              >
                <span>{isLoading ? 'VERIFICANDO...' : 'INGRESAR AL VIAJE'}</span>
                {!isLoading && <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform text-yellow-300" />}
              </button>
            </form>
          ) : (
            /* FORMULARIO DE REGISTRO EN SUPABASE AUTH */
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1 ml-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
                  <input 
                    type="text" 
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all text-sm font-medium"
                    required
                    disabled={isLoading}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1 ml-1">
                  Nombre de Usuario (ID Único)
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
                  <input 
                    type="text" 
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    placeholder="tu_usuario"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all text-sm font-medium"
                    required
                    disabled={isLoading}
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1 ml-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
                  <input 
                    type="email" 
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all text-sm font-medium"
                    required
                    disabled={isLoading}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1 ml-1">
                  Nueva Clave
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200/50" />
                  <input 
                    type="password" 
                    value={signUpPass}
                    onChange={(e) => setSignUpPass(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all text-sm font-medium"
                    required
                    disabled={isLoading}
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className={`w-full ${isLoading ? 'bg-emerald-600 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-400'} text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group mt-5 active:scale-[0.98]`}
              >
                <span>{isLoading ? 'CREANDO CUENTA...' : 'REGISTRARME EN SUPABASE'}</span>
                {!isLoading && <UserPlus className="w-5 h-5 group-hover:scale-105 transition-transform text-yellow-300" />}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center select-none">
          <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
            Autenticación en Tiempo Real • Supabase Auth
          </p>
        </div>
      </motion.div>
    </div>
  );
}
