/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Friend, Expense, Currency, CURRENCY_SYMBOLS, SyncStatus } from '../types';
import { Compass, Users, Plane, Calendar, Wallet, UserPlus, Trash2, X, Plus, Sparkles, Check, Music, Pencil, CloudCheck, CloudOff, RefreshCw, AlertCircle, LogOut, Pause } from 'lucide-react';
import Avatar from './Avatar';
import christRedeemerImg from '../assets/images/christ_the_redeemer_1781656383349.jpg';
import { playRingtone, isRingtonePlaying, toggleRingtone, pauseRingtone } from '../utils/audioSynth';

interface TravelHeaderProps {
  friends: Friend[];
  currentUserId: string;
  onUserChange: (id: string) => void;
  expenses: Expense[];
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  budgetLimit: number;
  onBudgetLimitChange: (limit: number) => void;
  isOffline: boolean;
  syncStatus?: SyncStatus;
  onAddFriend?: (name: string, emoji: string, color?: string) => void;
  onDeleteFriend?: (id: string) => void;
  onLogout?: () => void;
}

export default function TravelHeader({
  friends,
  currentUserId,
  onUserChange,
  expenses,
  currency,
  onCurrencyChange,
  budgetLimit,
  onBudgetLimitChange,
  isOffline,
  syncStatus = 'local',
  onAddFriend,
  onDeleteFriend,
  onLogout,
}: TravelHeaderProps) {
  const currentUserObj = friends.find((f) => f.id === currentUserId) || friends[0];

  // Calculated high-level metrics
  const nonSettlementExpenses = expenses.filter((e) => !e.isSettlement);
  const totalTripCost = nonSettlementExpenses.reduce((sum, e) => sum + e.amount, 0);

  const foodCost = nonSettlementExpenses
    .filter((e) => e.category === 'alimentacion')
    .reduce((sum, e) => sum + e.amount, 0);

  const lodgingCost = nonSettlementExpenses
    .filter((e) => e.category === 'hospedaje')
    .reduce((sum, e) => sum + e.amount, 0);

  const [isManaging, setIsManaging] = useState(false);
  const [newFriendName, setNewFriendName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-teal-500');
  const [showSpotify, setShowSpotify] = useState(false);

  const handleCreateFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendName.trim()) return;
    if (onAddFriend) {
      onAddFriend(newFriendName.trim(), '👤', selectedColor);
      setNewFriendName('');
    }
  };

  return (
    <header 
      className="text-white min-h-[100px] py-4 px-6 sticky top-0 z-40 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-visible"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.8), rgba(15, 118, 110, 0.75)), url(${christRedeemerImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 35%',
      }}
    >
      {/* Semi-transparent blur overlay for excellent text contrast */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] z-0 pointer-events-none" />

      {/* Global Spotify Control - Absolute Corner */}
      <div className="absolute top-2 right-2 md:top-4 md:right-4 z-[100] flex gap-2.5">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center bg-rose-600/20 border-2 border-rose-500/30 text-rose-100 hover:bg-rose-600/80 hover:border-white hover:scale-110 transition-all shadow-lg backdrop-blur-xl group cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5 md:w-6 h-6 group-hover:rotate-12 transition-transform" />
          </button>
        )}
        <div className="relative group">
          <button
            onClick={() => setShowSpotify(!showSpotify)}
            className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all shadow-[0_8px_32px_rgba(29,185,84,0.3)] cursor-pointer border-2 backdrop-blur-2xl ${
              showSpotify 
                ? 'bg-[#1DB954]/90 border-white scale-105 shadow-[#1DB954]/50' 
                : 'bg-black/60 border-[#1DB954]/50 hover:bg-black/80 hover:border-[#1DB954] hover:scale-110'
            }`}
            title="Music Hub — Spotify 🟢"
          >
            <SpotifyIcon className={`w-6 h-6 md:w-8 md:h-8 transition-all duration-500 ${showSpotify ? 'text-white rotate-[360deg]' : 'text-[#1DB954]'}`} />
            {showSpotify && <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />}
          </button>

          <div className={`absolute right-0 top-full mt-4 w-72 md:w-80 bg-[#121212]/95 backdrop-blur-3xl border border-[#1DB954]/30 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-4 z-50 transition-all duration-300 origin-top-right ${
            showSpotify 
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 scale-90 -translate-y-2 pointer-events-none absolute w-[1px] h-[1px] overflow-hidden'
          }`}>
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 md:w-8 md:h-8 bg-[#1DB954] rounded-full flex items-center justify-center">
                  <SpotifyIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <span className="text-[10px] md:text-[11px] font-black text-white uppercase tracking-widest font-sans">
                  Vibra Brasil 🇧🇷
                </span>
              </div>
              <button onClick={() => setShowSpotify(false)} className="bg-white/10 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-all">
                <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
            <div className="bg-black/40 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
              <iframe 
                style={{ borderRadius: '16px' }} 
                src="https://open.spotify.com/embed/album/0s0ROJiaa9cdvK3llVrRus?utm_source=generator&theme=0&autoplay=1" 
                width="100%" 
                height="160" 
                frameBorder="0" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              ></iframe>
            </div>
            <div className="mt-4 flex flex-col items-center gap-1">
              <p className="text-[9px] text-[#1DB954] font-black italic tracking-tight">
                "Onde as palavras falham, a música fala"
              </p>
              <div className="w-12 h-1 bg-[#1DB954]/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Brand & Concept with Brasil SVG Logo */}
      <div className="flex items-center gap-3 select-none relative z-10">
        <div className="w-12 h-12 bg-[#009c3b] rounded-2xl flex items-center justify-center border border-white/40 shadow-md transform hover:scale-110 transition-transform relative overflow-hidden" title="Brasil">
          <div className="absolute inset-x-0 bottom-0 top-[60%] bg-yellow-400/10 blur-[2px]" />
          <svg viewBox="0 0 100 70" className="w-9 h-6 relative z-10 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] rounded-md">
            <rect width="100" height="70" fill="#009c3b" />
            <polygon points="50,6 92,35 50,64 8,35" fill="#ffdf00" />
            <circle cx="50" cy="35" r="15" fill="#002776" />
            <path d="M 35,37 Q 50,29 65,37" stroke="#ffffff" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold font-display tracking-tight text-lg text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              Viaje Familiar
            </span>
            {syncStatus === 'synced' && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 rounded-md text-[8px] font-black uppercase text-emerald-300">
                <Check className="w-2.5 h-2.5" />
                Nube Sincronizada
              </div>
            )}
            {syncStatus === 'syncing' && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-sky-500/20 border border-sky-400/30 rounded-md text-[8px] font-black uppercase text-sky-300 animate-pulse">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                Sincronizando...
              </div>
            )}
            {syncStatus === 'error' && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-500/20 border border-rose-400/30 rounded-md text-[8px] font-black uppercase text-rose-300">
                <AlertCircle className="w-2.5 h-2.5" />
                Error de Red
              </div>
            )}
            {syncStatus === 'local' && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-500/20 border border-slate-400/30 rounded-md text-[8px] font-black uppercase text-slate-300">
                <CloudOff className="w-2.5 h-2.5" />
                Solo Local
              </div>
            )}
          </div>
          <span className="text-[10px] text-emerald-100/90 block drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] max-w-xs md:max-w-md lg:max-w-xl leading-relaxed whitespace-normal italic">
            "Dentro de veinte años estarás más decepcionado por las cosas que no hiciste que por las que hiciste"
          </span>
        </div>
      </div>

      {/* Global quick glance indicators */}
      <div className="hidden lg:flex items-center gap-4 text-[10px] text-emerald-100 bg-black/30 backdrop-blur-md py-1.5 px-3 rounded-lg border border-white/10 font-bold select-none relative z-10">
        <div className="flex items-center gap-1.5 border-r border-white/15 pr-3">
          <Plane className="w-3 h-3 text-emerald-300" />
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-300 uppercase">Gasto Total</span>
            <span className="font-mono text-white text-[11px]">{CURRENCY_SYMBOLS[currency]} {totalTripCost.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 border-r border-white/15 pr-3">
          <span className="text-xs">🍔</span>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-350 uppercase">Comida</span>
            <span className="font-mono text-white text-[11px]">{CURRENCY_SYMBOLS[currency]} {foodCost.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs">🏨</span>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-350 uppercase">Hotel</span>
            <span className="font-mono text-white text-[11px]">{CURRENCY_SYMBOLS[currency]} {lodgingCost.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Traveler Simulator dropdown & Budget Control - Centered Section */}
      <div className="flex-1 flex flex-wrap items-center justify-center gap-6 relative animate-fade-in z-10 px-4">
        
        {/* Unificado: Selector de Amigos y botón de administración del grupo */}
          <div className="flex flex-col items-center gap-1.5 min-w-[140px] group">
             <span className="text-[10px] font-black font-sans text-emerald-300 uppercase tracking-[0.2em] drop-shadow-md group-hover:text-white transition-colors">
               {currentUserObj?.name || 'Viajero'}
             </span>
             <div className="relative">
              <select
                id="select-simulated-user"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                value={currentUserId}
                onChange={(e) => onUserChange(e.target.value)}
              >
                {friends.map((f) => (
                  <option key={f.id} value={f.id} className="text-slate-800 font-medium">
                    {f.name}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setIsManaging(!isManaging)}
                className="p-1 rounded-full border-2 border-emerald-400/30 hover:border-emerald-400 group-hover:scale-110 transition-all active:scale-95 cursor-pointer relative z-10 shadow-lg bg-black/20 backdrop-blur-md"
                title="Administrar Grupo de Viajeros (Simulador)"
              >
                {currentUserObj ? <Avatar friend={currentUserObj} size="lg" /> : '👥'}
              </button>
            </div>
          </div>

        {/* POPUP FLOTANTE DE GESTIÓN DE AMIGOS */}
        {isManaging && (
          <div className="absolute right-0 top-full mt-2.5 w-76 bg-white rounded-2xl border border-slate-200 shadow-xl text-slate-800 p-4.5 z-55 animate-fade-in space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-1.5 text-indigo-900">
                <Users className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wide font-sans">Gestionar Viajeros</span>
              </div>
              <button 
                onClick={() => setIsManaging(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List members */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block font-sans">Integrantes ({friends.length}):</span>
              {friends.map((friend) => {
                const isPayerActive = friend.id === currentUserId;
                return (
                  <div key={friend.id} className="flex items-center justify-between p-1.5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-indigo-50/20 transition-all">
                    <div className="flex items-center gap-2">
                      <Avatar friend={friend} size="md" />
                      <span className={`text-[11px] font-bold ${isPayerActive ? 'text-indigo-600 font-extrabold' : 'text-slate-700'}`}>
                        {friend.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isPayerActive && (
                        <span className="text-[8px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-1 py-0.2 rounded-md font-bold uppercase tracking-wider font-sans">
                          Activo
                        </span>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newName = window.prompt("Editar nombre del viajero:", friend.name);
                          if (newName) {
                             // Assuming direct edit via prompt works if onUpdateFriend was wired, 
                             // but for now redirecting to sidebar as designed.
                             alert("Para una edición completa, utiliza el panel lateral izquierdo.");
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      
                      {friends.length > 1 && onDeleteFriend && (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${friend.name}?`)) {
                              onDeleteFriend(friend.id);
                              if (isPayerActive) {
                                const nextLeftover = friends.find(f => f.id !== friend.id);
                                if (nextLeftover) onUserChange(nextLeftover.id);
                              }
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form travelers */}
            {onAddFriend && (
              <form onSubmit={handleCreateFriend} className="border-t border-slate-100 pt-3 space-y-2.5">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block font-sans">Agregar viajero:</span>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Nombre viajero..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={newFriendName}
                      onChange={(e) => setNewFriendName(e.target.value)}
                      maxLength={18}
                    />
                  </div>
                  <button
                    type="submit"
                    className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="currentColor"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.508 17.302c-.216.354-.68.467-1.033.251-2.857-1.745-6.453-2.139-10.686-1.173-.406.092-.814-.16-.906-.566-.092-.406.16-.814.566-.906 4.636-1.06 8.599-.613 11.808 1.346.354.216.467.68.251 1.048zm1.472-3.258c-.272.443-.848.583-1.291.311-3.267-2.008-8.248-2.593-12.112-1.42-.5-.152-.779-.684-.627-1.184.152-.5.684-.779 1.184-.627 4.417 1.34 9.914 1.83 13.535 4.053.443.272.583.848.311 1.267zm.126-3.418c-3.916-2.325-10.374-2.54-14.131-1.399-.6.183-1.238-.163-1.421-.763-.183-.6.163-1.238.763-1.421 4.316-1.31 11.442-1.054 15.962 1.628.539.32 0.716 1.014 0.395 1.554-.321.539-1.015 0.717-1.554 0.396z" />
    </svg>
  );
}
