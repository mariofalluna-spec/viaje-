/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Friend, TripDay, Expense, Currency } from './types';
import peleImg from './assets/images/pele_avatar_1781135946987.png';
import ronaldoImg from './assets/images/ronaldo_avatar_1781135961167.png';
import ronaldinhoImg from './assets/images/ronaldinho_avatar_1781135971593.png';
import kakaImg from './assets/images/kaka_avatar_1781135981414.png';
import rivaldoImg from './assets/images/rivaldo_avatar_1781135994404.png';
import neymarImg from './assets/images/neymar_avatar_1781138485257.png';
import ronaldoCascaoImg from './assets/images/ronaldo_cascao_avatar_1781138905086.png';


export const BRAZIL_PLAYERS = [
  { name: 'Pelé', url: peleImg },
  { name: 'Ronaldo', url: ronaldoImg },
  { name: 'Ronaldo Cascão', url: ronaldoCascaoImg },
  { name: 'Ronaldinho', url: ronaldinhoImg },
  { name: 'Kaká', url: kakaImg },
  { name: 'Rivaldo', url: rivaldoImg },
  { name: 'Neymar', url: neymarImg },
];

export const INITIAL_FRIENDS: Friend[] = [
  { id: 'u_1', name: 'Pelé', avatarColor: 'bg-teal-500', avatarUrl: peleImg },
  { id: 'u_2', name: 'Ronaldo', avatarColor: 'bg-rose-500', avatarUrl: ronaldoCascaoImg },
  { id: 'u_3', name: 'Ronaldinho', avatarColor: 'bg-indigo-500', avatarUrl: ronaldinhoImg },
  { id: 'u_4', name: 'Kaká', avatarColor: 'bg-amber-500', avatarUrl: kakaImg },
  { id: 'u_5', name: 'Rivaldo', avatarColor: 'bg-blue-500', avatarUrl: rivaldoImg },
];

export const INITIAL_DAYS: TripDay[] = [
  {
    id: 'day_1',
    dayNumber: 1,
    date: '2026-06-12',
    touristPlaces: [
      {
        id: 'place_1',
        name: 'Exploración de la Ciudad Vieja 🏛️',
        description: 'Recorrido por templos antiguos, plazas centrales y mercados locales.',
        timeOfDay: '09:30',
        estimatedCost: 15,
        isVisited: true,
      },
      {
        id: 'place_2',
        name: 'Mirador del Atardecer en los Acantilados 🌅',
        description: 'Vistas panorámicas increíbles del mar y sesión fotográfica.',
        timeOfDay: '17:00',
        estimatedCost: 5,
        isVisited: true,
      }
    ]
  },
  {
    id: 'day_2',
    dayNumber: 2,
    date: '2026-06-13',
    touristPlaces: [
      {
        id: 'place_3',
        name: 'Excursión a la Playa de Coral 🏖️',
        description: 'Día de snorkel en arrecife, natación guiada y relajación.',
        timeOfDay: '10:00',
        estimatedCost: 35,
        isVisited: false,
      },
      {
        id: 'place_4',
        name: 'Show Nocturno de Luces y Danza Maya 🎭',
        description: 'Espectáculo cultural tradicional con música en vivo e interpretativa.',
        timeOfDay: '20:30',
        estimatedCost: 45,
        isVisited: false,
      }
    ]
  },
  {
    id: 'day_3',
    dayNumber: 3,
    date: '2026-06-14',
    touristPlaces: [
      {
        id: 'place_5',
        name: 'Reserva Natural Botánica 🌴',
        description: 'Avistamiento de aves, puentes colgantes sobre el dosel de la jungla.',
        timeOfDay: '09:00',
        estimatedCost: 20,
        isVisited: false,
      }
    ]
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_hotel',
    tripDayId: 'general', // General trip expense
    description: 'Reserva del Hotel Central (3 Noches)',
    amount: 360,
    payerId: 'u_2', // Paid by Sofía
    category: 'hospedaje',
    splits: [
      { friendId: 'u_1', amount: 90 },
      { friendId: 'u_2', amount: 90 },
      { friendId: 'u_3', amount: 90 },
      { friendId: 'u_4', amount: 90 },
      { friendId: 'u_5', amount: 90 },
    ],
    isSettlement: false,
    notes: 'Alojamiento compartido con habitaciones dobles.',
  },
  {
    id: 'exp_dinner_d1',
    tripDayId: 'day_1',
    description: 'Cena Tradicional - Tortillas & Parrilla',
    amount: 110,
    payerId: 'u_1', // Manuel (You) paid
    category: 'alimentacion',
    splits: [
      { friendId: 'u_1', amount: 22 },
      { friendId: 'u_2', amount: 22 },
      { friendId: 'u_3', amount: 22 },
      { friendId: 'u_4', amount: 22 },
      { friendId: 'u_5', amount: 22 },
    ],
    isSettlement: false,
    notes: 'Cena deliciosa el primer día de viaje.',
  },
  {
    id: 'exp_tickets_d1',
    tripDayId: 'day_1',
    description: 'Entradas Ciudad Antigua (Lugar Turístico)',
    amount: 75,
    payerId: 'u_3', // Lucas pagó
    category: 'lugares',
    splits: [
      { friendId: 'u_1', amount: 15 },
      { friendId: 'u_2', amount: 15 },
      { friendId: 'u_3', amount: 15 },
      { friendId: 'u_4', amount: 15 },
      { friendId: 'u_5', amount: 15 },
    ],
    isSettlement: false,
    notes: 'Guiado oficial incluido por las ruinas.',
  },
  {
    id: 'exp_taxi_d2',
    tripDayId: 'day_2',
    description: 'Transporte de Ida y Vuelta Playa Coral',
    amount: 50,
    payerId: 'u_4', // Camila pagó
    category: 'transporte',
    splits: [
      { friendId: 'u_1', amount: 10 },
      { friendId: 'u_2', amount: 10 },
      { friendId: 'u_3', amount: 10 },
      { friendId: 'u_4', amount: 10 },
      { friendId: 'u_5', amount: 10 },
    ],
    isSettlement: false,
    notes: 'Minivan privada para el traslado del grupo.',
  },
];

export interface SavedState {
  friends: Friend[];
  days: TripDay[];
  expenses: Expense[];
  currentUserId: string;
  currency: Currency;
  budgetLimit: number;
}

export async function fetchServerState(): Promise<SavedState | null> {
  try {
    const response = await fetch('/api/state');
    if (!response.ok) return null;
    const data = await response.json();
    
    // Convert string keys from config if needed
    return {
      friends: data.friends,
      days: data.days,
      expenses: data.expenses,
      currentUserId: data.config.currentUserId || 'u_1',
      currency: (data.config.currency as Currency) || 'BRL',
      budgetLimit: data.config.budgetLimit ? parseFloat(data.config.budgetLimit) : 1200,
    };
  } catch (e) {
    console.error('Error fetching server state:', e);
    return null;
  }
}

export async function syncWithServer(state: SavedState) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      friends: state.friends,
      days: state.days,
      expenses: state.expenses,
      config: {
        currentUserId: state.currentUserId,
        currency: state.currency,
        budgetLimit: state.budgetLimit
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Error syncing with server:', errorData);
    throw new Error(errorData.error || 'Failed to sync with server');
  }
}

export function getLocalSavedState() {
  try {
    const savedFriends = localStorage.getItem('travel_friends');
    const savedDays = localStorage.getItem('travel_days');
    const savedExpenses = localStorage.getItem('travel_expenses');
    const cachedUser = localStorage.getItem('travel_user_id');
    const savedCurrency = localStorage.getItem('travel_currency') as Currency | null;
    const savedBudgetLimit = localStorage.getItem('travel_budget_limit');

    let friends: Friend[] = savedFriends ? JSON.parse(savedFriends) : INITIAL_FRIENDS;

    // Deduplicate by ID
    friends = Array.from(new Map(friends.map(f => [f.id, f])).values());

    // Migrate: Ensure friends have correct avatars from INITIAL_FRIENDS and assign player avatars if needed
    friends = friends.map((f: Friend, index: number) => {
      const initial = INITIAL_FRIENDS.find(i => i.id === f.id);
      
      // If friend is one of the initial players, force the initial avatar
      if (initial) {
        return { ...f, avatarUrl: initial.avatarUrl };
      }
      
      // If friend is not initial, ensure they have one of the Brazil player avatars
      // Use index to cycle through them
      return { ...f, avatarUrl: BRAZIL_PLAYERS[index % BRAZIL_PLAYERS.length].url };
    });

    const parsedDays: TripDay[] = savedDays ? JSON.parse(savedDays) : INITIAL_DAYS;
    const parsedExpenses: Expense[] = savedExpenses ? JSON.parse(savedExpenses) : INITIAL_EXPENSES;

    const uniqueDays = Array.from(new Map(parsedDays.map(d => [d.id, d])).values());
    const uniqueExpenses = Array.from(new Map(parsedExpenses.map(e => [e.id, e])).values());

    return {
      friends: friends,
      days: uniqueDays,
      expenses: uniqueExpenses,
      currentUserId: cachedUser || 'u_1',
      currency: savedCurrency || 'BRL',
      budgetLimit: savedBudgetLimit ? parseFloat(savedBudgetLimit) : 1200,
    };
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return {
      friends: INITIAL_FRIENDS,
      days: INITIAL_DAYS,
      expenses: INITIAL_EXPENSES,
      currentUserId: 'u_1',
      currency: 'BRL' as Currency,
      budgetLimit: 1200,
    };
  }
}

export function saveLocalState(friends: Friend[], days: TripDay[], expenses: Expense[], currentUserId: string, currency: Currency, budgetLimit?: number) {
  try {
    localStorage.setItem('travel_friends', JSON.stringify(friends));
    localStorage.setItem('travel_days', JSON.stringify(days));
    localStorage.setItem('travel_expenses', JSON.stringify(expenses));
    localStorage.setItem('travel_user_id', currentUserId);
    localStorage.setItem('travel_currency', currency);
    if (budgetLimit !== undefined) {
      localStorage.setItem('travel_budget_limit', budgetLimit.toString());
    }
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}
