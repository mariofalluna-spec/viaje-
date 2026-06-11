/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Expense, Friend, TripDay, Currency, CURRENCY_SYMBOLS } from '../types';
import { 
  DollarSign, 
  Search, 
  Trash2, 
  Edit3, 
  Eye, 
  Check, 
  Filter, 
  Plus, 
  Grid,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExpensesPanelProps {
  expenses: Expense[];
  friends: Friend[];
  days: TripDay[];
  selectedDayId: string; // "all" or specific day ID
  currentUserId: string;
  onAddExpenseClick: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  currency: Currency;
}

export default function ExpensesPanel({
  expenses,
  friends,
  days,
  selectedDayId,
  currentUserId,
  onAddExpenseClick,
  onEditExpense,
  onDeleteExpense,
  currency,
}: ExpensesPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Reset page when dynamic filters update
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedDayId]);

  const getFriendName = (id: string) => {
    const friend = friends.find((f) => f.id === id);
    return friend ? friend.name : 'Desconocido';
  };

  const getFriendObj = (id: string) => {
    return friends.find((f) => f.id === id);
  };

  const getDayLabel = (dayId: string) => {
    if (dayId === 'general') return '🎒 Pre-Viaje / General';
    const day = days.find((d) => d.id === dayId);
    return day ? `📅 Día ${day.dayNumber} (${day.date})` : 'General';
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'alimentacion':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'hospedaje':
        return 'bg-violet-50 text-violet-600 border border-violet-100';
      case 'transporte':
        return 'bg-cyan-50 text-cyan-600 border border-cyan-100';
      case 'lugares':
        return 'bg-rose-50 text-rose-600 border border-rose-100';
      case 'pago':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-100';
    }
  };

  const getCategoryEmojiAndLabel = (category: string) => {
    switch (category) {
      case 'alimentacion':
        return { emoji: '🍔', label: 'Alimentación' };
      case 'hospedaje':
        return { emoji: '🏨', label: 'Hospedaje' };
      case 'transporte':
        return { emoji: '🚗', label: 'Transporte' };
      case 'lugares':
        return { emoji: '🎟️', label: 'Atracción' };
      case 'pago':
        return { emoji: '🤝', label: 'Pago Deuda' };
      default:
        return { emoji: '📦', label: 'Otros' };
    }
  };

  // Filter based on: search term, selected day filter in sidebar, and category filter
  const filteredExpenses = expenses.filter((exp) => {
    // 1. Sidebar Day filter
    if (selectedDayId !== 'all') {
      if (exp.tripDayId !== selectedDayId) return false;
    }

    // 2. Local category filter
    if (selectedCategory !== 'all') {
      if (exp.category !== selectedCategory) return false;
    }

    // 3. Search query
    const matchSearch = 
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchSearch;
  });

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Search Header */}
      <div className="p-5 border-b border-slate-50 space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2">
              📋 Control de Gastos del Viaje
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDayId === 'all' 
                ? 'Visualizando transacciones globales de todo el viaje'
                : `Visualizando gastos registrados únicamente para el Día ${days.find(d => d.id === selectedDayId)?.dayNumber}`
              }
            </p>
          </div>

          <button
            id="btn-add-expense-trigger"
            onClick={onAddExpenseClick}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Registrar Gasto</span>
          </button>
        </div>

        {/* Inputs row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="input-expense-search"
              type="text"
              placeholder="Buscar gasto (Ej: Cena, Taxi, Entradas...)"
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-teal-500 focus:outline-none bg-slate-50/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category tabs/filter wrapper */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'Todos', icon: '🌍' },
              { id: 'alimentacion', label: 'Comida', icon: '🍔' },
              { id: 'hospedaje', label: 'Hotel', icon: '🏨' },
              { id: 'transporte', label: 'Transp.', icon: '🚗' },
              { id: 'lugares', label: 'Atrac.', icon: '🎟️' },
              { id: 'pago', label: 'Pagos', icon: '🤝' },
            ].map((cat) => (
              <button
                key={cat.id}
                id={`filter-cat-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer border ${
                  selectedCategory === cat.id
                    ? 'bg-slate-800 text-white border-slate-800 shadow-3xs'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Expenses Table/List Container */}
      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="popLayout text-xs">
          {filteredExpenses.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center">
              <Grid className="w-12 h-12 text-slate-200 stroke-1 mb-3" />
              <p className="text-xs text-slate-400 font-medium">No se encontraron gastos con estos filtros</p>
              <p className="text-[10px] text-slate-300 max-w-xs mt-1">
                Presiona "Registrar Gasto" arriba para ingresar un nuevo gasto dividido entre tus compañeros por fecha.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedExpenses.map((exp) => {
                const payer = getFriendObj(exp.payerId);
                const { emoji, label } = getCategoryEmojiAndLabel(exp.category);
                
                return (
                  <motion.div
                    key={exp.id}
                    layoutId={`expense-item-${exp.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-4 bg-white hover:bg-slate-50/50 rounded-2xl border border-slate-105 transition-all shadow-3xs hover:shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left: General Info */}
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Payer Icon */}
                      <div className="relative shrink-0 mt-0.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-2xs ${payer?.avatarColor || 'bg-slate-200'}`}>
                          {payer?.avatarEmoji || '👤'}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-2xs border border-slate-100 text-xs">
                          {emoji}
                        </div>
                      </div>

                      {/* Decriptive Data */}
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm leading-tight truncate max-w-sm">
                            {exp.description}
                          </span>
                          
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getCategoryBadgeClass(exp.category)}`}>
                            {label}
                          </span>

                          <span className="text-[10px] font-semibold text-slate-400">
                            {getDayLabel(exp.tripDayId)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 font-medium">
                          Pagado por <b className="text-slate-750 font-bold">{payer?.name || 'Compañero'}</b>
                        </p>

                        {/* Splitting overview */}
                        <div className="flex items-center flex-wrap gap-1.5 pt-1.5 text-[10px] text-slate-400">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">
                            Cargos:
                          </span>
                          {exp.splits.map((split) => {
                            const splitFriend = getFriendObj(split.friendId);
                            return (
                              <span
                                key={split.friendId}
                                className="bg-slate-50 border border-slate-200/50 px-1.5 py-0.5 rounded-md text-[9.5px] font-mono text-slate-600 inline-flex items-center gap-0.5"
                               title={`${splitFriend?.name}: ${CURRENCY_SYMBOLS[currency]} ${split.amount.toFixed(2)}`}
                              >
                                <span>{splitFriend?.avatarEmoji || '👤'}</span>
                                <span className="font-bold">{CURRENCY_SYMBOLS[currency]} {split.amount.toFixed(2)}</span>
                              </span>
                            );
                          })}
                        </div>

                        {exp.notes && (
                          <div className="mt-1 flex items-start gap-1 p-1.5 bg-slate-50 text-[10px] text-slate-500 rounded-lg max-w-md">
                            <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            <span className="italic">{exp.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Currency & Interactive Buttons */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0 shrink-0">
                      <div className="font-mono text-right">
                        <span className="text-xs text-slate-400 font-medium block">Total</span>
                        <span className="text-base font-black text-slate-800">
                          {CURRENCY_SYMBOLS[currency]} {exp.amount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Only allow edit/delete for non-settlements to avoid corrupting flow */}
                        {!exp.isSettlement ? (
                          <>
                            {confirmDeleteId === exp.id ? (
                               <motion.div 
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className="flex items-center gap-1.5"
                               >
                                 <span className="text-[10px] font-black text-rose-600 mr-0.5 whitespace-nowrap">¿Seguro de borrar?</span>
                                 <button
                                   onClick={() => {
                                     onDeleteExpense(exp.id);
                                     setConfirmDeleteId(null);
                                   }}
                                   className="bg-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm active:scale-95 cursor-pointer"
                                 >
                                   SÍ
                                 </button>
                                 <button
                                   onClick={() => setConfirmDeleteId(null)}
                                   className="bg-slate-200 text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-lg active:scale-95 cursor-pointer"
                                 >
                                   NO
                                 </button>
                               </motion.div>
                            ) : (
                               <>
                                <button
                                  id={`btn-edit-expense-${exp.id}`}
                                  onClick={() => onEditExpense(exp)}
                                  className="p-2 md:p-1.5 bg-indigo-50 md:bg-transparent hover:bg-indigo-100 border border-indigo-100 md:border-transparent text-indigo-600 md:text-slate-500 md:hover:text-slate-800 rounded-xl transition-all cursor-pointer shadow-3xs md:shadow-none"
                                  title="Editar gasto"
                                >
                                  <Edit3 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                </button>
                                <button
                                  id={`btn-delete-expense-${exp.id}`}
                                  onClick={() => setConfirmDeleteId(exp.id)}
                                  className="p-2 md:p-1.5 bg-rose-50 md:bg-transparent hover:bg-rose-100 border border-rose-100 md:border-transparent text-rose-500 md:text-slate-400 md:hover:text-rose-600 rounded-xl transition-all cursor-pointer shadow-3xs md:shadow-none"
                                  title="Eliminar gasto"
                                >
                                  <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                                </button>
                               </>
                            )}
                          </>
                        ) : (
                          <span className="text-[9px] bg-emerald-100/40 text-emerald-700 font-bold px-2 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1 select-none">
                            <Check className="w-3 h-3" /> Liquidado
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination controls footer for "Hojas de 5 en 5" */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <div className="text-[11px] font-bold text-slate-505 tracking-wide">
            Mostrando <span className="text-slate-800">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredExpenses.length)}</span> de <span className="text-slate-800">{filteredExpenses.length}</span> registros
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer ${
                currentPage === 1
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              ◀ Ant.
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`w-6 h-6 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                  currentPage === pg
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer ${
                currentPage === totalPages
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              Sig. ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
