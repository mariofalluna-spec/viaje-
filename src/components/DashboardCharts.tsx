/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { Expense, Friend, Currency, CURRENCY_SYMBOLS } from '../types';
import { Tag, TrendingUp, Compass, Landmark } from 'lucide-react';

interface DashboardChartsProps {
  expenses: Expense[];
  friends: Friend[];
  currency: Currency;
}

const CATEGORY_COLORS: Record<string, string> = {
  alimentacion: 'bg-amber-500 text-amber-800 border-amber-100',
  hospedaje: 'bg-violet-500 text-violet-800 border-violet-100',
  transporte: 'bg-cyan-500 text-cyan-800 border-cyan-100',
  lugares: 'bg-rose-500 text-rose-800 border-rose-100',
  otros: 'bg-slate-500 text-slate-800 border-slate-100',
};

const CATEGORY_LABELS: Record<string, string> = {
  alimentacion: 'Alimentación 🍔',
  hospedaje: 'Hospedaje 🏨',
  transporte: 'Transporte 🚗',
  lugares: 'Visitas y Atracciones 🎟️',
  otros: 'Recuerdos y Compras 📦',
};

export default function DashboardCharts({ expenses, friends, currency }: DashboardChartsProps) {
  // Filter out payments
  const nonSettlementExpenses = expenses.filter((e) => !e.isSettlement);
  const totalSpent = nonSettlementExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by category
  const categoryTotals: Record<string, number> = {};
  nonSettlementExpenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const categoryList = Object.keys(CATEGORY_LABELS)
    .map((catKey) => {
      const amount = categoryTotals[catKey] || 0;
      const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
      return {
        key: catKey,
        label: CATEGORY_LABELS[catKey],
        amount,
        pct,
        bgColor: CATEGORY_COLORS[catKey]?.split(' ')[0] || 'bg-slate-400',
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Group by traveler contribution
  const friendContributions: Record<string, number> = {};
  friends.forEach((f) => {
    friendContributions[f.id] = 0;
  });
  nonSettlementExpenses.forEach((exp) => {
    if (friendContributions[exp.payerId] !== undefined) {
      friendContributions[exp.payerId] += exp.amount;
    }
  });

  const participantContributions = friends
    .map((f) => ({
      ...f,
      amount: friendContributions[f.id] || 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const maxContribution = Math.max(...participantContributions.map((p) => p.amount), 1);

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Box 1: Expenses by category */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
          <Tag className="w-5 h-5 text-teal-650" />
          <div>
            <h4 className="font-semibold text-slate-800 text-sm font-display">Gastos de Viaje por Categoría</h4>
            <p className="text-xs text-slate-400">Distribución del presupuesto (Suma: {CURRENCY_SYMBOLS[currency]} {totalSpent.toFixed(2)})</p>
          </div>
        </div>

        <div className="space-y-3.5">
          {totalSpent === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              Ingresa compras de viaje para representarlas por sector.
            </div>
          ) : (
            categoryList.map((cat) => {
              if (cat.amount === 0) return null; // Only show active categories
              return (
                <div key={cat.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-650">
                    <span className="text-slate-700 font-semibold">{cat.label}</span>
                    <span className="font-mono text-slate-600 font-bold">
                      {CURRENCY_SYMBOLS[currency]} {cat.amount.toFixed(2)} ({cat.pct.toFixed(0)}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.bgColor} rounded-full transition-all duration-500`}
                      style={{ width: `${cat.pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
