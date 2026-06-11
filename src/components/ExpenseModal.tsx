/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Friend, Expense, TripDay, ExpenseSplit, Currency, CURRENCY_SYMBOLS } from '../types';
import { 
  X, 
  DollarSign, 
  Calendar, 
  Info, 
  Check, 
  ChevronRight,
  TrendingUp,
  Sliders,
  Percent,
  Calculator,
  Compass
} from 'lucide-react';
import { motion } from 'motion/react';

type SplitType = 'equitativo' | 'montos' | 'porcentajes' | 'partes';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  days: TripDay[];
  currentUserId: string;
  onSaveExpense: (expenseData: Omit<Expense, 'id'>, id?: string) => void;
  editingExpense?: Expense | null;
  initialDayId?: string;
  currency: Currency;
}

const CATEGORY_ICONS = {
  alimentacion: '🍔',
  hospedaje: '🏨',
  transporte: '🚗',
  lugares: '🎟️',
  otros: '📦',
  pago: '🤝',
};

const CATEGORIES = [
  { id: 'alimentacion', label: 'Alimentación (Comida)', color: 'bg-amber-500' },
  { id: 'hospedaje', label: 'Hospedaje (Hotel/Alojamiento)', color: 'bg-violet-500' },
  { id: 'transporte', label: 'Transporte (Taxi/Gasolina)', color: 'bg-cyan-500' },
  { id: 'lugares', label: 'Lugares Turísticos (Entradas)', color: 'bg-rose-500' },
  { id: 'otros', label: 'Otros (Recuerdos/Compras)', color: 'bg-slate-500' },
] as const;

export default function ExpenseModal({
  isOpen,
  onClose,
  friends,
  days,
  currentUserId,
  onSaveExpense,
  editingExpense,
  initialDayId = 'all',
  currency,
}: ExpenseModalProps) {
  // Form fields
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [selectedDayId, setSelectedDayId] = useState<'general' | string>(
    initialDayId === 'all' || initialDayId === 'general' ? 'general' : initialDayId
  );
  const [payerId, setPayerId] = useState(currentUserId);
  const [category, setCategory] = useState<Expense['category']>('alimentacion');
  const [notes, setNotes] = useState('');

  // Splits states
  const [splitType, setSplitType] = useState<SplitType>('equitativo');
  const [involvedFriendIds, setInvolvedFriendIds] = useState<string[]>([]);
  
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>({});
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingExpense) {
      setDescription(editingExpense.description);
      setAmountInput(editingExpense.amount.toString());
      setSelectedDayId(editingExpense.tripDayId);
      setPayerId(editingExpense.payerId);
      setCategory(editingExpense.category);
      setNotes(editingExpense.notes || '');
      setSplitType(getSavedSplitType(editingExpense));

      const invIds = editingExpense.splits.map((s) => s.friendId);
      setInvolvedFriendIds(invIds);

      // Restore splits inputs values
      const ams: Record<string, string> = {};
      const pct: Record<string, string> = {};
      const shs: Record<string, string> = {};

      editingExpense.splits.forEach((s) => {
        ams[s.friendId] = s.amount.toString();
        const pt = (s.amount / editingExpense.amount) * 100;
        pct[s.friendId] = Math.round(pt * 10) / 10 + '';
        shs[s.friendId] = '1'; 
      });

      setCustomAmounts(ams);
      setCustomPercentages(pct);
      setCustomShares(shs);
    } else {
      // Default clean state
      setDescription('');
      setAmountInput('');
      setSelectedDayId(initialDayId === 'all' ? 'general' : initialDayId);
      setPayerId(currentUserId);
      setCategory('alimentacion');
      setNotes('');
      setSplitType('equitativo');
      
      const defaultIds = friends.map((f) => f.id);
      setInvolvedFriendIds(defaultIds);

      const defaultCustom: Record<string, string> = {};
      const defaultPercentages: Record<string, string> = {};
      const defaultShares: Record<string, string> = {};
      
      defaultIds.forEach((id) => {
        defaultCustom[id] = '';
        defaultPercentages[id] = Math.round((100 / defaultIds.length) * 10) / 10 + '';
        defaultShares[id] = '1';
      });

      setCustomAmounts(defaultCustom);
      setCustomPercentages(defaultPercentages);
      setCustomShares(defaultShares);
    }
  }, [editingExpense, isOpen, initialDayId, friends, currentUserId]);

  function getSavedSplitType(exp: Expense): SplitType {
    if (exp.splits.length <= 1) return 'equitativo';
    const firstAmt = exp.splits[0]?.amount;
    const allEqual = exp.splits.every((s) => Math.abs(s.amount - firstAmt) < 0.1);
    return allEqual ? 'equitativo' : 'montos';
  }

  const toggleFriendInvolvement = (friendId: string) => {
    if (involvedFriendIds.includes(friendId)) {
      if (involvedFriendIds.length <= 1) return; // Need at least 1 traveler
      setInvolvedFriendIds(involvedFriendIds.filter((id) => id !== friendId));
    } else {
      setInvolvedFriendIds([...involvedFriendIds, friendId]);
      
      if (!customAmounts[friendId]) setCustomAmounts({ ...customAmounts, [friendId]: '' });
      if (!customPercentages[friendId]) setCustomPercentages({ ...customPercentages, [friendId]: '0' });
      if (!customShares[friendId]) setCustomShares({ ...customShares, [friendId]: '1' });
    }
  };

  const parsedAmount = parseFloat(amountInput) || 0;

  const calculateCalculatedSplits = (): ExpenseSplit[] => {
    if (parsedAmount <= 0 || involvedFriendIds.length === 0) return [];

    if (splitType === 'equitativo') {
      const evenShare = Math.round((parsedAmount / involvedFriendIds.length) * 100) / 100;
      const splits = involvedFriendIds.map((id) => ({ friendId: id, amount: evenShare }));
      const currentSum = splits.reduce((sum, s) => sum + s.amount, 0);
      const diff = Math.round((parsedAmount - currentSum) * 100) / 100;
      if (diff !== 0 && splits.length > 0) {
        splits[splits.length - 1].amount = Math.round((splits[splits.length - 1].amount + diff) * 100) / 100;
      }
      return splits;
    }

    if (splitType === 'montos') {
      return involvedFriendIds.map((id) => ({
        friendId: id,
        amount: parseFloat(customAmounts[id]) || 0,
      }));
    }

    if (splitType === 'porcentajes') {
      const splits = involvedFriendIds.map((id) => {
        const pct = parseFloat(customPercentages[id]) || 0;
        return {
          friendId: id,
          amount: Math.round(((pct / 100) * parsedAmount) * 100) / 100,
        };
      });
      const currentSum = splits.reduce((sum, s) => sum + s.amount, 0);
      const diff = Math.round((parsedAmount - currentSum) * 100) / 100;
      if (diff !== 0 && splits.length > 0) {
        splits[splits.length - 1].amount = Math.round((splits[splits.length - 1].amount + diff) * 100) / 100;
      }
      return splits;
    }

    if (splitType === 'partes') {
      const totalShares = involvedFriendIds.reduce((sum, id) => sum + (parseFloat(customShares[id]) || 0), 0);
      if (totalShares <= 0) return [];

      const splits = involvedFriendIds.map((id) => {
        const shareVal = parseFloat(customShares[id]) || 0;
        return {
          friendId: id,
          amount: Math.round(((shareVal / totalShares) * parsedAmount) * 100) / 100,
        };
      });
      const currentSum = splits.reduce((sum, s) => sum + s.amount, 0);
      const diff = Math.round((parsedAmount - currentSum) * 100) / 100;
      if (diff !== 0 && splits.length > 0) {
        splits[splits.length - 1].amount = Math.round((splits[splits.length - 1].amount + diff) * 100) / 100;
      }
      return splits;
    }

    return [];
  };

  const calculatedSplits = calculateCalculatedSplits();
  const splitsSum = calculatedSplits.reduce((sum, s) => sum + s.amount, 0);
  const isSplitValid = parsedAmount > 0 && Math.abs(splitsSum - parsedAmount) < 0.05 && involvedFriendIds.length > 0;

  // Split warnings logic
  let splitWarning = '';
  if (splitType === 'montos' && parsedAmount > 0) {
    const diff = Math.round((parsedAmount - splitsSum) * 100) / 100;
    if (diff > 0) splitWarning = `Aún faltan por asignar ${CURRENCY_SYMBOLS[currency]} ${diff.toFixed(2)}`;
    else if (diff < 0) splitWarning = `Has excedido el total por ${CURRENCY_SYMBOLS[currency]} ${Math.abs(diff).toFixed(2)}`;
  } else if (splitType === 'porcentajes' && parsedAmount > 0) {
    const totalPct = involvedFriendIds.reduce((sum, id) => sum + (parseFloat(customPercentages[id]) || 0), 0);
    const diff = Math.round((100 - totalPct) * 100) / 100;
    if (diff > 0) splitWarning = `Suma de porcentajes es ${totalPct}%. Falta ${diff}% para llegar a 100%`;
    else if (diff < 0) splitWarning = `Suma es ${totalPct}%. Exceso de ${Math.abs(diff)}%`;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || parsedAmount <= 0 || !isSplitValid) return;

    onSaveExpense(
      {
        tripDayId: selectedDayId,
        description: description.trim(),
        amount: parsedAmount,
        payerId,
        category,
        splits: calculatedSplits,
        isSettlement: false,
        notes: notes.trim() || undefined,
      },
      editingExpense?.id
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-xl border border-slate-100 flex flex-col my-8 overflow-hidden"
        id="modal-expense"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-55 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
              <Calculator className="w-5 h-5 text-teal-650" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 font-display leading-tight text-sm">
                {editingExpense ? 'Editar Gasto de Viaje' : 'Registrar Gasto de Viaje'}
              </h3>
              <p className="text-[11px] text-slate-400">Introduce la compra y divide la cuenta del hotel o la comida</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 hover:text-slate-700 rounded-lg text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
          <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[65vh]">
            
            {/* Day Assignment Selection & Category Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Día Asociaciado</label>
                <select
                  id="select-expense-day"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-750 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  value={selectedDayId}
                  onChange={(e) => setSelectedDayId(e.target.value)}
                >
                  <option value="general">🎒 Pre-Viaje / General</option>
                  {days.map((d) => (
                    <option key={d.id} value={d.id}>
                      📅 Día {d.dayNumber} ({d.date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Categoría de Gasto</label>
                <select
                  id="select-expense-category"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold text-slate-755 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {CATEGORY_ICONS[cat.id]} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description & Cost Amount */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-105 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Descripción del Gasto</label>
                <input
                  id="input-expense-desc"
                  type="text"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all text-slate-800"
                  placeholder="Ej: Almuerzo de Mariscos en la Playa"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Monto Total ({CURRENCY_SYMBOLS[currency]})</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">{CURRENCY_SYMBOLS[currency]}</span>
                  <input
                    id="input-expense-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full pl-8 pr-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all font-mono font-bold text-slate-800"
                    placeholder="0.00"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Who Paid & How to divide the cost */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">¿Quién pagó el saldo?</label>
                <select
                  id="select-expense-payer"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-slate-700"
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                >
                  {friends.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} {f.id === currentUserId ? '(Tú)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-display">Método de División</label>
                <div className="grid grid-cols-2 gap-1 px-0.5">
                  {[
                    { id: 'equitativo', label: 'Inmueves (=)', icon: Check },
                    { id: 'montos', label: `Montos (${CURRENCY_SYMBOLS[currency]})`, icon: DollarSign },
                  ].map((item) => {
                    const isSelected = splitType === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSplitType(item.id as SplitType)}
                        className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-teal-50 border-teal-500 text-teal-700 font-extrabold shadow-3xs'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{item.id === 'equitativo' ? 'Por Igual' : 'Manual'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Travelers Splits Details */}
            <div className="space-y-3.5 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>¿Quién participa del gasto?</span>
                <span className="text-slate-400 font-normal text-[10px] lowercase text-right">
                  {involvedFriendIds.length} viajeros implicados
                </span>
              </label>

              <div className="space-y-2 border border-slate-150 rounded-2xl p-3 bg-slate-50/50 max-h-48 overflow-y-auto">
                {friends.map((friend) => {
                  const isChecked = involvedFriendIds.includes(friend.id);
                  const isPayer = friend.id === payerId;
                  
                  const activeSplit = calculatedSplits.find((s) => s.friendId === friend.id);
                  const assignedShare = activeSplit?.amount || 0;

                  return (
                    <div
                      key={friend.id}
                      className={`flex items-center justify-between gap-3 p-2 rounded-xl transition-all ${
                        isChecked ? 'bg-white border border-slate-100/80 shadow-3xs' : 'opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleFriendInvolvement(friend.id)}
                          className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-slate-350 hover:border-slate-400 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                        </button>

                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs text-white shrink-0 ${friend.avatarColor}`}>
                          {friend.avatarEmoji}
                        </div>

                        <span className="text-xs font-semibold text-slate-700">
                          {friend.name}
                        </span>

                        {isPayer && (
                          <span className="text-[8px] font-black uppercase text-teal-700 bg-teal-50 px-1 rounded border border-teal-100 block">
                            Paga
                          </span>
                        )}
                      </div>

                      {/* Display custom inputs if splitting manually */}
                      {isChecked && (
                        <div className="flex items-center gap-2">
                          {splitType === 'montos' && (
                            <div className="relative w-20">
                              <span className="absolute left-1.5 top-1 text-[10px] text-slate-400 font-mono">{CURRENCY_SYMBOLS[currency]}</span>
                              <input
                                type="number"
                                step="0.01"
                                className="w-full pl-4 pr-1.5 py-0.5 border border-slate-200 rounded-md text-[11px] font-mono font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-50"
                                value={customAmounts[friend.id] || ''}
                                onChange={(e) => {
                                  setCustomAmounts({
                                    ...customAmounts,
                                    [friend.id]: e.target.value,
                                  });
                                }}
                              />
                            </div>
                          )}

                          <span className="text-xs font-mono font-bold text-slate-700 min-w-[50px] text-right">
                            {CURRENCY_SYMBOLS[currency]} {assignedShare.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status Banner */}
              {splitWarning ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-700 font-semibold flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{splitWarning}</span>
                </div>
              ) : parsedAmount > 0 ? (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-700 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>¡Montos validados y balanceados correctamente!</span>
                </div>
              ) : null}
            </div>

            {/* Optional notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Notas Adicionales / Comentarios</label>
              <textarea
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                placeholder="Escribe detalles adicionales (Lugar de compra, recibos, etc.)"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-5 border-t border-slate-55 bg-slate-50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isSplitValid || parsedAmount <= 0 || !description.trim()}
              className={`px-4.5 py-2.5 text-xs font-extrabold text-white rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer ${
                isSplitValid && parsedAmount > 0 && description.trim()
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-350 shadow-none cursor-not-allowed'
              }`}
            >
              <span>{editingExpense ? 'Guardar Cambios' : 'Confirmar Gasto'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
