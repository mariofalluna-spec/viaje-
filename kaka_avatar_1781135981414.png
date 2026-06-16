/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Expense, Friend, Debt, Currency, CURRENCY_SYMBOLS } from '../types';
import { calculateBalances, simplifyDebts } from '../utils/debts';
import { 
  DollarSign, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Activity, 
  HelpCircle,
  PiggyBank,
  CheckCircle2,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettleUpPanelProps {
  expenses: Expense[];
  friends: Friend[];
  onSettleDebt: (fromId: string, toId: string, amount: number) => void;
  currentUserId: string;
  currency: Currency;
}

export default function SettleUpPanel({
  expenses,
  friends,
  onSettleDebt,
  currentUserId,
  currency,
}: SettleUpPanelProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showLiquidation, setShowLiquidation] = useState(false);

  // Compute total balances & peer debts in real-time with our utilities
  const balances = calculateBalances(expenses, friends);
  const simplifiedDebts = simplifyDebts(balances);

  const getFriendObj = (id: string) => friends.find((f) => f.id === id);

  const triggerSettleDebt = (fromId: string, toId: string, amount: number) => {
    onSettleDebt(fromId, toId, amount);
    const fromName = getFriendObj(fromId)?.name || 'Viajero';
    const toName = getFriendObj(toId)?.name || 'Viajero';
    setSuccessMsg(`¡Pago registrado! ${fromName} saldó ${CURRENCY_SYMBOLS[currency]} ${amount.toFixed(2)} con ${toName}`);
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  const hasDebts = simplifiedDebts.length > 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-2">
            🤝 Liquidación de Deudas
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Estado de cuentas de los viajeros.
          </p>
        </div>
        <button
          onClick={() => setShowLiquidation(!showLiquidation)}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
            showLiquidation 
              ? 'bg-slate-100 text-slate-600 border-slate-200' 
              : 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
          }`}
        >
          {showLiquidation ? 'Ocultar' : 'Ver Liquidación'}
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        {!showLiquidation ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <PiggyBank className="w-10 h-10 text-slate-200 mb-2 stroke-1" />
            <p className="text-xs text-slate-400 font-medium">Información de deudas guardada</p>
            <p className="text-[10px] text-slate-300 mt-1">Haz clic en el botón superior para visualizar los saldos pendientes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Notice overlay */}
            {successMsg && (
              <div className="bg-emerald-55 border border-emerald-150 p-3 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* DIRECT DEBTS SIMPLIFICATION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  Pagos Directos
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-150">
                  Resumen Activo
                </span>
              </div>

              {!hasDebts ? (
                <div className="bg-emerald-50/30 rounded-2xl p-6 border border-emerald-100/60 text-center flex flex-col items-center justify-center">
                  <PiggyBank className="w-10 h-10 text-emerald-600/80 mb-2 stroke-1" />
                  <p className="text-xs text-emerald-800 font-bold">¡Cuentas al día! 🎉</p>
                  <p className="text-[10px] text-emerald-750/80 max-w-xs mt-1">
                    Las aportaciones cubren equitativamente la totalidad de los gastos.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {simplifiedDebts.map((debt, index) => {
                    const debtor = getFriendObj(debt.fromId);
                    const creditor = getFriendObj(debt.toId);

                    if (!debtor || !creditor) return null;

                    const isDebtorMe = debt.fromId === currentUserId;
                    const isCreditorMe = debt.toId === currentUserId;

                    return (
                      <div
                        key={`${debt.fromId}-${debt.toId}-${index}`}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isDebtorMe 
                            ? 'border-indigo-200 bg-indigo-50/20' 
                            : isCreditorMe 
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : 'border-slate-105 bg-white'
                        } flex flex-col items-stretch gap-3 text-xs`}
                      >
                        {/* Visual debt route */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/50 py-1 px-2 rounded-lg font-medium text-slate-700">
                            <span className="font-bold">{debtor.name}</span>
                          </div>
                          
                          <ArrowRight className="w-3 h-3 text-slate-400" />

                          <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200/50 py-1 px-2 rounded-lg font-medium text-slate-700">
                            <span className="font-bold">{creditor.name}</span>
                          </div>
                        </div>

                        {/* Settle button */}
                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 font-mono">
                          <div className="text-left font-mono">
                            <span className="text-sm font-black text-slate-800">{CURRENCY_SYMBOLS[currency]} {debt.amount.toFixed(2)}</span>
                          </div>

                          <button
                            id={`btn-settle-direct-${debt.fromId}-${debt.toId}`}
                            onClick={() => triggerSettleDebt(debt.fromId, debt.toId, debt.amount)}
                            className={`text-[9px] font-black uppercase tracking-tight px-3 py-1.5 rounded-xl border shadow-3xs cursor-pointer transition-all ${
                              isDebtorMe 
                                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500' 
                                : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-750'
                            }`}
                          >
                            {isDebtorMe ? 'Pagar Mi Deuda' : 'Liquidar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
