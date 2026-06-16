/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Expense, Friend, Debt } from '../types';

/**
 * Calculates the net balance of every friend based on the given group expenses.
 * Net balance = (total credited/paid) - (total debited/shares)
 * Positive balance = They are owed money
 * Negative balance = They owe money
 */
export function calculateBalances(expenses: Expense[], friends: Friend[]): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize all friends with 0 balance
  friends.forEach((friend) => {
    balances[friend.id] = 0;
  });

  expenses.forEach((expense) => {
    const payerId = expense.payerId;
    const amount = expense.amount;

    // Credit the payer
    if (balances[payerId] !== undefined) {
      balances[payerId] += amount;
    }

    // Debit each person who has a split share
    expense.splits.forEach((split) => {
      if (balances[split.friendId] !== undefined) {
        balances[split.friendId] -= split.amount;
      }
    });
  });

  // Round values to 2 decimal places to avoid floating point precision issues
  Object.keys(balances).forEach((key) => {
    balances[key] = Math.round(balances[key] * 100) / 100;
  });

  return balances;
}

/**
 * Simplifies a set of net balances into the minimum list of direct transactions (debts)
 * required to settle all debts. This uses a greedy match-payer-with-receiver algorithm.
 */
export function simplifyDebts(balances: Record<string, number>): Debt[] {
  const debts: Debt[] = [];

  // Create workspace balances without mutating original
  const workBalances = { ...balances };

  // Separate friends into debtors (negative balance) and creditors (positive balance)
  let debtors = Object.keys(workBalances)
    .map((id) => ({ id, balance: workBalances[id] }))
    .filter((u) => u.balance < -0.01);

  let creditors = Object.keys(workBalances)
    .map((id) => ({ id, balance: workBalances[id] }))
    .filter((u) => u.balance > 0.01);

  // Greedy match
  let safetyLoopLimit = 1000;
  while (debtors.length > 0 && creditors.length > 0 && safetyLoopLimit-- > 0) {
    // Sort so we deal with the largest values first
    debtors.sort((a, b) => a.balance - b.balance); // Most negative debtor first
    creditors.sort((a, b) => b.balance - a.balance); // Most positive creditor first

    const debtor = debtors[0];
    const creditor = creditors[0];

    // Amount to settle is the minimum of debtor's debt and creditor's credit
    // debtor.balance is negative, creditor.balance is positive
    const settleAmount = Math.min(Math.abs(debtor.balance), creditor.balance);

    if (settleAmount > 0.01) {
      debts.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    // Update balances
    debtor.balance += settleAmount;
    creditor.balance -= settleAmount;

    // Filter out settled participants
    debtors = debtors.filter((d) => d.balance < -0.01);
    creditors = creditors.filter((c) => c.balance > 0.01);
  }

  return debts;
}
