/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Friend, TripDay, Expense, TouristPlace, Currency, CURRENCY_SYMBOLS } from './types';
import { getLocalSavedState, saveLocalState, INITIAL_FRIENDS, INITIAL_DAYS, INITIAL_EXPENSES, fetchServerState, syncWithServer, SavedState } from './data';
import TravelHeader from './components/TravelHeader';
import Sidebar from './components/Sidebar';
import ItineraryPanel from './components/ItineraryPanel';
import ExpensesPanel from './components/ExpensesPanel';
import SettleUpPanel from './components/SettleUpPanel';
import DashboardCharts from './components/DashboardCharts';
import ExpenseModal from './components/ExpenseModal';
import EmergencyDocumentsPanel from './components/EmergencyDocumentsPanel';
import { 
  Compass, 
  Wallet, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  RefreshCw,
  Sparkles,
  Info,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PALETTE = [
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 
  'bg-indigo-500', 'bg-violet-500', 'bg-rose-500', 
  'bg-pink-500', 'bg-amber-500', 'bg-orange-500', 'bg-blue-500'
];

export default function App() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [days, setDays] = useState<TripDay[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('u_1');
  const [selectedDayId, setSelectedDayId] = useState<string>('all'); // "all" or specific day ID
  const [currency, setCurrency] = useState<Currency>('BRL');
  const [budgetLimit, setBudgetLimit] = useState<number>(1200);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'local'>('local');

  // Auto-select today's day if it exists in the itinerary
  useEffect(() => {
    if (days.length > 0 && selectedDayId === 'all') {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayDay = days.find(d => d.date === todayStr);
      if (todayDay) {
        setSelectedDayId(todayDay.id);
      }
    }
  }, [days]);

  // Active workspace tab for general viewing
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'itinerary' | 'charts' | 'documents'>('itinerary');

  // Modal controls
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Monitor connection states
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    // Initial value
    setIsOffline(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load state on mount
  useEffect(() => {
    async function loadInitialState() {
      setSyncStatus('syncing');
      // 1. Try server first
      const serverState = await fetchServerState();
      
      if (serverState && serverState.friends.length > 0) {
        setFriends(serverState.friends);
        setDays(serverState.days);
        setExpenses(serverState.expenses);
        setCurrentUserId(serverState.currentUserId);
        setCurrency(serverState.currency);
        setBudgetLimit(serverState.budgetLimit);
        
        // Update local too
        saveLocalState(serverState.friends, serverState.days, serverState.expenses, serverState.currentUserId, serverState.currency, serverState.budgetLimit);
        setSyncStatus('synced');
      } else {
        // 2. Local fallback
        const local = getLocalSavedState();
        setFriends(local.friends);
        setDays(local.days);
        setExpenses(local.expenses);
        setCurrentUserId(local.currentUserId);
        setCurrency(local.currency);
        setBudgetLimit(local.budgetLimit);
        
        // 3. If local has data but server doesn't, sync local to server (initial upload)
        if (local.friends.length > 0) {
          try {
            await syncWithServer(local as SavedState);
            setSyncStatus('synced');
          } catch (e) {
            setSyncStatus('error');
          }
        } else {
          setSyncStatus('local');
        }
      }
    }
    
    loadInitialState();
  }, []);

  // Central state update + safe localStorage & Server syncing
  const updateStateAndSave = async (
    updatedFriends: Friend[],
    updatedDays: TripDay[],
    updatedExpenses: Expense[],
    updatedUserId: string,
    updatedCurrency: Currency = currency,
    updatedBudgetLimit: number = budgetLimit
  ) => {
    setFriends(updatedFriends);
    setDays(updatedDays);
    setExpenses(updatedExpenses);
    setCurrentUserId(updatedUserId);
    setCurrency(updatedCurrency);
    setBudgetLimit(updatedBudgetLimit);
    
    // Save locally
    saveLocalState(updatedFriends, updatedDays, updatedExpenses, updatedUserId, updatedCurrency, updatedBudgetLimit);
    
    // Sync with server
    setSyncStatus('syncing');
    try {
      await syncWithServer({
        friends: updatedFriends,
        days: updatedDays,
        expenses: updatedExpenses,
        currentUserId: updatedUserId,
        currency: updatedCurrency,
        budgetLimit: updatedBudgetLimit
      });
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('error');
    }
  };

  // Add a brand new sequentially numbered day
  const handleAddDay = (dateString: string) => {
    const nextNumber = days.length + 1;
    const newDay: TripDay = {
      id: `day_${Date.now()}`,
      dayNumber: nextNumber,
      date: dateString,
      touristPlaces: [],
    };
    const nextDays = [...days, newDay];
    updateStateAndSave(friends, nextDays, expenses, currentUserId);
    setSelectedDayId(newDay.id); // Navigate to new day immediately
  };

  // Add friend/partner to the journey
  const handleAddFriend = (name: string, emoji: string, customColor?: string, avatarUrl?: string) => {
    const avatarColor = customColor || PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const newFriend: Friend = {
      id: `u_${Date.now()}`,
      name,
      avatarColor,
      avatarEmoji: emoji,
      avatarUrl,
    };
    const nextFriends = [...friends, newFriend];
    updateStateAndSave(nextFriends, days, expenses, currentUserId);
  };

  // Edit friend details
  const handleEditFriend = (id: string, name: string, emoji: string, customColor?: string, avatarUrl?: string) => {
    const nextFriends = friends.map((f) => {
      if (f.id === id) {
        return { ...f, name, avatarEmoji: emoji, avatarColor: customColor || f.avatarColor, avatarUrl };
      }
      return f;
    });
    updateStateAndSave(nextFriends, days, expenses, currentUserId);
  };

  // Update specific friend properties (airline codes, file uploads for emergency, etc)
  const handleUpdateFriend = (id: string, updatedFields: Partial<Friend>) => {
    const nextFriends = friends.map((f) => {
      if (f.id === id) {
        return { ...f, ...updatedFields };
      }
      return f;
    });
    updateStateAndSave(nextFriends, days, expenses, currentUserId);
  };

  // Delete a travel companion
  const handleDeleteFriend = (id: string) => {
    if (friends.length <= 1) return; // Cannot delete the last remaining member
    const nextFriends = friends.filter((f) => f.id !== id);
    const nextUserId = currentUserId === id ? (nextFriends[0]?.id || '') : currentUserId;

    const nextExpenses = expenses.map((exp) => {
      const nextSplits = exp.splits.filter((s) => s.friendId !== id);
      return { ...exp, splits: nextSplits };
    }).map((exp) => {
      if (exp.payerId === id) {
        return { ...exp, payerId: nextUserId };
      }
      return exp;
    });
    
    updateStateAndSave(nextFriends, days, nextExpenses, nextUserId);
  };

  // Update trip day date
  const handleUpdateDayDate = (dayId: string, newDate: string) => {
    const nextDays = days.map((d) => {
      if (d.id === dayId) {
        return { ...d, date: newDate };
      }
      return d;
    });
    updateStateAndSave(friends, nextDays, expenses, currentUserId);
  };

  // Toggle tourist spot as visited
  const handleToggleVisited = (dayId: string, placeId: string) => {
    const nextDays = days.map((day) => {
      if (day.id === dayId) {
        return {
          ...day,
          touristPlaces: day.touristPlaces.map((place) => {
            if (place.id === placeId) {
              return { ...place, isVisited: !place.isVisited };
            }
            return place;
          }),
        };
      }
      return day;
    });
    updateStateAndSave(friends, nextDays, expenses, currentUserId);
  };

  // Add dynamic tourist point to specific day
  const handleAddPlace = (dayId: string, placeData: Omit<TouristPlace, 'id' | 'isVisited'>) => {
    const newPlace: TouristPlace = {
      id: `place_${Date.now()}`,
      ...placeData,
      isVisited: false,
    };

    const nextDays = days.map((day) => {
      if (day.id === dayId) {
        return {
          ...day,
          touristPlaces: [...day.touristPlaces, newPlace],
        };
      }
      return day;
    });

    updateStateAndSave(friends, nextDays, expenses, currentUserId);
  };

  // Update existing tourist point
  const handleUpdatePlace = (dayId: string, placeId: string, updatedData: Partial<TouristPlace>) => {
    const nextDays = days.map((day) => {
      if (day.id === dayId) {
        return {
          ...day,
          touristPlaces: day.touristPlaces.map((p) => {
            if (p.id === placeId) {
              return { ...p, ...updatedData };
            }
            return p;
          }),
        };
      }
      return day;
    });
    updateStateAndSave(friends, nextDays, expenses, currentUserId);
  };

  // Remove planned tourist point
  const handleRemovePlace = (dayId: string, placeId: string) => {
    const nextDays = days.map((day) => {
      if (day.id === dayId) {
        return {
          ...day,
          touristPlaces: day.touristPlaces.filter((p) => p.id !== placeId),
        };
      }
      return day;
    });
    updateStateAndSave(friends, nextDays, expenses, currentUserId);
  };

  // Save new/edited cost item
  const handleSaveExpense = (expenseData: Omit<Expense, 'id'>, id?: string) => {
    if (id) {
      // Edit mode
      const nextExpenses = expenses.map((exp) => {
        if (exp.id === id) {
          return { ...expenseData, id } as Expense;
        }
        return exp;
      });
      updateStateAndSave(friends, days, nextExpenses, currentUserId);
    } else {
      // Creation mode
      const newExpense: Expense = {
        ...expenseData,
        id: `exp_${Date.now()}`,
      } as Expense;
      const nextExpenses = [newExpense, ...expenses];
      updateStateAndSave(friends, days, nextExpenses, currentUserId);
    }
  };

  // Delete cost item
  const handleDeleteExpense = (id: string) => {
    const nextExpenses = expenses.filter((e) => e.id !== id);
    updateStateAndSave(friends, days, nextExpenses, currentUserId);
  };

  // Settle up direct repayment
  const handleSettleDebt = (fromId: string, toId: string, amount: number) => {
    const debtorName = friends.find((f) => f.id === fromId)?.name || 'Viajero';
    const creditorName = friends.find((f) => f.id === toId)?.name || 'Viajero';

    const settlementExpense: Expense = {
      id: `settle_${Date.now()}`,
      tripDayId: 'general',
      description: `Saldado: ${debtorName} → ${creditorName} 🤝`,
      amount,
      payerId: fromId,
      category: 'pago',
      splits: [
        { friendId: toId, amount }, // Creditor gains the split credit
      ],
      isSettlement: true,
      notes: `Liquidación directa de cuentas del viaje. ${debtorName} transfirió un total de ${CURRENCY_SYMBOLS[currency]} ${amount.toFixed(2)} a ${creditorName}.`,
    };

    const nextExpenses = [settlementExpense, ...expenses];
    updateStateAndSave(friends, days, nextExpenses, currentUserId);
  };

  // Wipe states to factory demo data safely
  const handleRestoreDefaults = () => {
    if (window.confirm('Esto borrará los datos actuales y restablecerá el viaje de demostración. ¿Deseas continuar?')) {
      updateStateAndSave(INITIAL_FRIENDS, INITIAL_DAYS, INITIAL_EXPENSES, 'u_1');
      setSelectedDayId('all');
      setActiveWorkspaceTab('itinerary');
    }
  };

  // Currently selected day model (undefined if 'all')
  const activeDayObj = days.find((d) => d.id === selectedDayId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      {/* Top Travel Header with simulated agent metrics */}
      <TravelHeader
        friends={friends}
        currentUserId={currentUserId}
        onUserChange={(userId) => updateStateAndSave(friends, days, expenses, userId)}
        expenses={expenses}
        currency={currency}
        onCurrencyChange={(curr) => updateStateAndSave(friends, days, expenses, currentUserId, curr)}
        budgetLimit={budgetLimit}
        onBudgetLimitChange={(limit) => updateStateAndSave(friends, days, expenses, currentUserId, currency, limit)}
        isOffline={isOffline}
        syncStatus={syncStatus}
        onAddFriend={handleAddFriend}
        onDeleteFriend={handleDeleteFriend}
      />

      {/* Main app panel */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Sidebar Space with responsive overlay drawer behavior on mobile */}
        <div 
          className={`
            fixed inset-0 z-50 bg-slate-905/65 backdrop-blur-xs md:relative md:inset-auto md:z-0 md:bg-transparent md:backdrop-blur-none transition-opacity duration-200
            ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto md:flex'}
          `}
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className={`
              w-80 max-w-[85vw] h-full bg-white md:w-auto md:max-w-none transition-transform duration-200 ease-out md:transform-none shrink-0
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              days={days}
              friends={friends}
              selectedDayId={selectedDayId}
              onSelectDay={(id) => {
                setSelectedDayId(id);
                setActiveWorkspaceTab('itinerary');
                setIsSidebarOpen(false);
              }}
              onAddDay={handleAddDay}
              onAddFriend={handleAddFriend}
              onEditFriend={handleEditFriend}
              onDeleteFriend={handleDeleteFriend}
              onUpdateDayDate={handleUpdateDayDate}
              currentUserId={currentUserId}
              expenses={expenses}
              currency={currency}
              budgetLimit={budgetLimit}
              onBudgetLimitChange={(limit) => updateStateAndSave(friends, days, expenses, currentUserId, currency, limit)}
              isOffline={isOffline}
              onClose={() => setIsSidebarOpen(false)}
              onSetActiveTab={setActiveWorkspaceTab}
            />
          </div>
        </div>

        {/* Core Screen Space Dashboard */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 bg-slate-50/50">
          
          {/* Top row: Tab Workspace triggers & general reset button */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-3xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
              
              {/* Trigger button for mobile sidebar panel */}
              <button
                id="btn-sidebar-mobile-toggle"
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 border-2 border-emerald-600 text-emerald-900 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>Ver Todo Itinerario 📅</span>
              </button>

              <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-50 rounded-xl border border-slate-100 scrollbar-none no-scrollbar w-full">
                <button
                  id="tab-itinerary"
                  onClick={() => setActiveWorkspaceTab('itinerary')}
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap flex-1 sm:flex-initial ${
                    activeWorkspaceTab === 'itinerary'
                      ? 'bg-lime-400 text-emerald-900 shadow-sm border border-emerald-500'
                      : 'text-emerald-700/60 hover:text-emerald-700 hover:bg-emerald-50/40'
                  }`}
                >
                  <Compass className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeWorkspaceTab === 'itinerary' ? 'text-emerald-900' : 'text-emerald-600'}`} />
                  <span className="hidden sm:inline">Lugares Turísticos e Itinerario 🗺️</span>
                  <span className="inline sm:hidden">Itinerario 🗺️</span>
                </button>

                <button
                  id="tab-documents"
                  onClick={() => setActiveWorkspaceTab('documents')}
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap flex-1 sm:flex-initial ${
                    activeWorkspaceTab === 'documents'
                      ? 'bg-rose-100 text-rose-700 shadow-sm border-2 border-rose-600'
                      : 'text-rose-500/60 hover:text-rose-600 hover:bg-rose-50/40'
                  }`}
                >
                  <ShieldAlert className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeWorkspaceTab === 'documents' ? 'text-rose-700' : 'text-rose-500'}`} />
                  <span className="hidden sm:inline">Check-In y Documentos de Emergencia ✈️</span>
                  <span className="inline sm:hidden">Documentos ✈️</span>
                </button>

                <button
                  id="tab-charts"
                  onClick={() => setActiveWorkspaceTab('charts')}
                  className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap flex-1 sm:flex-initial ${
                    activeWorkspaceTab === 'charts'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xs border border-indigo-700'
                      : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/40'
                  }`}
                >
                  <TrendingUp className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeWorkspaceTab === 'charts' ? 'text-white' : 'text-indigo-600'}`} />
                  <span className="hidden sm:inline">Estadísticas y Análisis 📈</span>
                  <span className="inline sm:hidden">Estadísticas 📈</span>
                </button>
              </div>
            </div>

            <button
              id="btn-restore-defaults"
              onClick={handleRestoreDefaults}
              className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors py-1.5 px-3 rounded-xl border border-dashed border-slate-200 hover:border-rose-100 bg-transparent cursor-pointer"
              title="Restaurar viaje demo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reiniciar Datos Prueba</span>
            </button>
          </div>

          {/* Upper conditional space based on Workspace Tab Selection */}
          <div className="grid grid-cols-1 gap-6">
            <AnimatePresence mode="wait">
              {activeWorkspaceTab === 'itinerary' ? (
                <motion.div
                  key="itinerary-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <ItineraryPanel
                    days={days}
                    selectedDay={activeDayObj}
                    onToggleVisited={handleToggleVisited}
                    onAddPlace={handleAddPlace}
                    onUpdatePlace={handleUpdatePlace}
                    onRemovePlace={handleRemovePlace}
                    currency={currency}
                    onUpdateDayDate={handleUpdateDayDate}
                  />
                </motion.div>
              ) : activeWorkspaceTab === 'charts' ? (
                <motion.div
                  key="charts-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <DashboardCharts
                    expenses={expenses}
                    friends={friends}
                    currency={currency}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="documents-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  <EmergencyDocumentsPanel
                    friends={friends}
                    onUpdateFriend={handleUpdateFriend}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lower dual visual split columns: Left costs ledger, Right debts settlements direct links */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Split column left: Ledger register (spanning 2 columns on desktop) */}
            <div className="xl:col-span-2">
              <ExpensesPanel
                expenses={expenses}
                friends={friends}
                days={days}
                selectedDayId={selectedDayId}
                currentUserId={currentUserId}
                currency={currency}
                onAddExpenseClick={() => {
                  setEditingExpense(null);
                  setIsExpenseModalOpen(true);
                }}
                onEditExpense={(exp) => {
                  setEditingExpense(exp);
                  setIsExpenseModalOpen(true);
                }}
                onDeleteExpense={handleDeleteExpense}
              />
            </div>

            {/* Split column right: SettleUp live calculations (spanning 1 column) */}
            <div className="xl:col-span-1">
              <SettleUpPanel
                expenses={expenses}
                friends={friends}
                onSettleDebt={handleSettleDebt}
                currentUserId={currentUserId}
                currency={currency}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Expense Creator/Editor Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        friends={friends}
        days={days}
        currentUserId={currentUserId}
        currency={currency}
        onSaveExpense={(data, id) => {
          handleSaveExpense(data, id);
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        editingExpense={editingExpense}
        initialDayId={selectedDayId}
      />
    </div>
  );
}
