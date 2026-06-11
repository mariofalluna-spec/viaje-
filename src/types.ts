/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Currency = 'BRL';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BRL: 'R$',
};

export interface TravelDocument {
  id: string;
  name: string; // e.g., "Pase de abordo", "Pasaporte", "Seguro"
  value: string; // Base64 string for photo / document data or code
  uploadedAt: string; // date string
}

export interface Friend {
  id: string;
  name: string;
  avatarColor: string; // Tailwind bg color class
  avatarUrl?: string; // URL to avatar image
  avatarEmoji?: string; // Fallback
  checkInCode?: string; // e.g. "LH783X"
  documents?: TravelDocument[];
}

export interface TouristPlace {
  id: string;
  name: string;
  description: string;
  timeOfDay: string; // e.g., "09:30" or "Morning"
  estimatedCost: number;
  isVisited: boolean;
  locationName?: string;
  locationUrl?: string;
}

export interface TripDay {
  id: string;
  dayNumber: number; // e.g., Day 1, 2, 3...
  date: string; // YYYY-MM-DD
  touristPlaces: TouristPlace[];
}

export interface ExpenseSplit {
  friendId: string;
  amount: number;
}

export interface Expense {
  id: string;
  tripDayId: string; // ID of the TripDay this expense occurred (or "general" for lodging/pre-travel)
  description: string;
  amount: number;
  payerId: string;
  category: 'alimentacion' | 'hospedaje' | 'transporte' | 'lugares' | 'otros' | 'pago';
  splits: ExpenseSplit[];
  isSettlement: boolean;
  notes?: string;
}

export interface Debt {
  fromId: string;
  toId: string;
  amount: number;
}
