/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TripDay, TouristPlace, Currency, CURRENCY_SYMBOLS } from '../types';
import { 
  MapPin, 
  Map, 
  Clock, 
  CheckCircle, 
  Circle, 
  Plus, 
  Trash2, 
  DollarSign, 
  Smile,
  Compass,
  Sparkles,
  Calendar,
  X,
  ShieldAlert,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ItineraryPanelProps {
  days: TripDay[];
  selectedDay: TripDay | undefined;
  onToggleVisited: (dayId: string, placeId: string) => void;
  onAddPlace: (dayId: string, place: Omit<TouristPlace, 'id' | 'isVisited'>) => void;
  onUpdatePlace: (dayId: string, placeId: string, updatedData: Partial<TouristPlace>) => void;
  onRemovePlace: (dayId: string, placeId: string) => void;
  currency: Currency;
  onUpdateDayDate?: (dayId: string, newDate: string) => void;
  onImportItinerary?: (aiDays: any[], currencySuggestion: 'BRL' | 'USD') => void;
}

export default function ItineraryPanel({
  days,
  selectedDay,
  onToggleVisited,
  onAddPlace,
  onUpdatePlace,
  onRemovePlace,
  currency,
  onUpdateDayDate,
  onImportItinerary,
}: ItineraryPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState<TouristPlace | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('10:00');
  const [estimatedCost, setEstimatedCost] = useState('0');
  
  // Location and map states
  const [locationName, setLocationName] = useState('');
  const [locationUrl, setLocationUrl] = useState('');

  // State for AI recommendations per place id
  const [aiRecommendations, setAiRecommendations] = useState<Record<string, { name: string; description: string; type: string }[]>>({});
  const [loadingAi, setLoadingAi] = useState<Record<string, boolean>>({});
  const [expandedRecommendations, setExpandedRecommendations] = useState<Record<string, boolean>>({});
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});
  
  // States for Global GPS discovery
  const [nearbyRecommendations, setNearbyRecommendations] = useState<{ name: string; description: string; type: string }[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [nearbyError, setNearbyError] = useState('');
  const [showNearby, setShowNearby] = useState(false);

  // States for AI Itinerary Planner
  const [aiPlannerPrompt, setAiPlannerPrompt] = useState('Dame itinerario que hacer desde las 8 am desde Sao Paulo y la costa de Brasil hasta llegar a Rio de Janeiro en 3 dias');
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState<{
    summary: string;
    approximateTotalCost: number;
    currency: 'BRL' | 'USD';
    days: any[];
  } | null>(null);
  const [aiPlannerError, setAiPlannerError] = useState('');
  const [showAiPlannerPanel, setShowAiPlannerPanel] = useState(false);

  const handleGenerateItinerary = async () => {
    if (!aiPlannerPrompt.trim()) return;
    setIsGeneratingItinerary(true);
    setAiPlannerError('');
    setGeneratedItinerary(null);
    try {
      const res = await fetch('/api/ai-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPlannerPrompt.trim() })
      });
      if (!res.ok) {
        throw new Error('No se pudo generar el itinerario. Compruebe la conexión o sus llaves de API.');
      }
      const data = await res.json();
      if (data.itinerary) {
        setGeneratedItinerary(data.itinerary);
      } else {
        throw new Error('Respuesta inválida del servidor de IA o JSON mal formado.');
      }
    } catch (err: any) {
      setAiPlannerError(err.message || 'Error desconocido al invocar la IA.');
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  const fetchNearbyDiscovery = async () => {
    setShowNearby(true);
    if (nearbyRecommendations.length > 0) return;
    
    setLoadingNearby(true);
    setNearbyError('');

    let lat = null;
    let lon = null;

    try {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: 10000, timeout: 5000, enableHighAccuracy: true });
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
      } catch (err) {
        console.warn("Navegador GPS falló, intentando IP API...", err);
      }

      if (lat === null || lon === null) {
        // Fallback to ipapi.co if abstract fails or browser gps fails
        const ipRes = await fetch('https://ipapi.co/json/');
        if (!ipRes.ok) throw new Error('IP fallback failed');
        const ipData = await ipRes.json();
        lat = ipData.latitude;
        lon = ipData.longitude;
      }

      if (lat === null || lon === null) {
        throw new Error('No se pudo determinar tu ubicación.');
      }
      
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userLocation: {
            latitude: lat,
            longitude: lon
          }
        }),
      });

      if (!response.ok) throw new Error('Fallo al obtener destinos cercanos');
      
      const data = await response.json();
      setNearbyRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error(err);
      setNearbyError('Asegúrate de permitir el acceso a GPS para descubrir lugares cerca de ti.');
    } finally {
      setLoadingNearby(false);
    }
  };

  const fetchAiRecommendations = async (placeId: string, placeName: string, locName?: string) => {
    if (expandedRecommendations[placeId]) {
      setExpandedRecommendations(prev => ({ ...prev, [placeId]: false }));
      return;
    }

    setExpandedRecommendations(prev => ({ ...prev, [placeId]: true }));

    if (aiRecommendations[placeId]) {
      return;
    }

    setLoadingAi(prev => ({ ...prev, [placeId]: true }));
    setAiErrors(prev => ({ ...prev, [placeId]: '' }));

    let userLocation: { latitude: number; longitude: number } | null = null;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (err) {
      console.warn("Could not get location, continuing without it", err);
    }

    // Fallback if offline
    if (!navigator.onLine) {
      setTimeout(() => {
        const localRecs = [
          {
            name: `Mirador natural cerca de ${placeName}`,
            description: "Un mirador espectacular sin filas, ideal para fotos y contemplar el paisaje regional.",
            type: "Mirador 🌅"
          },
          {
            name: `Café Boutique tradicional`,
            description: "Acogedor rincón cercano con el mejor café local espresso y pastelería fina.",
            type: "Comida ☕"
          },
          {
            name: `Pasaje de Artesanos locales`,
            description: "Tiendas típicas para comprar recuerdos auténticos y conocer artesanos de la zona.",
            type: "Cercano 🛍️"
          }
        ];
        setAiRecommendations(prev => ({ ...prev, [placeId]: localRecs }));
        setLoadingAi(prev => ({ ...prev, [placeId]: false }));
      }, 700);
      return;
    }

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeName,
          locationName: locName || '',
          userLocation,
        }),
      });

      if (!response.ok) {
        throw new Error('Fallo al obtener sugerencias de la IA');
      }

      const data = await response.json();
      setAiRecommendations(prev => ({ ...prev, [placeId]: data.recommendations || [] }));
    } catch (err: any) {
      console.error(err);
      setAiErrors(prev => ({ ...prev, [placeId]: 'No se pudieron cargar recomendaciones en este momento.' }));
    } finally {
      setLoadingAi(prev => ({ ...prev, [placeId]: false }));
    }
  };

  if (!selectedDay) {
    const allMappedPlaces = days.flatMap(d => d.touristPlaces).filter(p => !!p.locationName);
    const totalPlaces = days.flatMap(d => d.touristPlaces).length;
    const visitedPlaces = days.flatMap(d => d.touristPlaces).filter(p => p.isVisited).length;

    // Construct full global multi-point Google Maps URL for all days
    let globalMapsUrl = '';
    if (allMappedPlaces.length > 0) {
      if (allMappedPlaces.length === 1) {
        globalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(allMappedPlaces[0].locationName || '')}`;
      } else {
        const origin = allMappedPlaces[0].locationName || '';
        const destination = allMappedPlaces[allMappedPlaces.length - 1].locationName || '';
        const waypoints = allMappedPlaces
          .slice(1, -1)
          .map(p => p.locationName || '')
          .join('|');
        
        globalMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
        if (waypoints) {
          globalMapsUrl += `&waypoints=${encodeURIComponent(waypoints)}`;
        }
      }
    }

    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-50 bg-gradient-to-br from-teal-50/30 to-indigo-50/15 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-100/60 flex items-center justify-center text-teal-600 shadow-3xs">
              <Compass className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-850 text-base font-display leading-tight">
                Resumen GPS y Hoja de Ruta del Viaje
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Consolidado de todas las atracciones turísticas y ubicaciones del viaje completo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchNearbyDiscovery}
              className="px-4 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <Compass className="w-4 h-4 text-white" />
              <span>¿Qué hay cerca? 📍</span>
            </button>

            <button
              onClick={() => setShowAiPlannerPanel(!showAiPlannerPanel)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Armar mi recorrido ✨</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          {/* AI PLANNER MAIN PANEL */}
          {showAiPlannerPanel && (
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border-2 border-dashed border-indigo-200 rounded-3xl p-5 space-y-4 animate-fade-in shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-extrabold text-indigo-900 text-sm font-display">Planificador de Itinerarios Premium con IA (Gemini 3.5)</h4>
                </div>
                <button 
                  onClick={() => setShowAiPlannerPanel(false)}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Escribe tu consulta o instrucción (por ejemplo: puntos de partida, paradas preferidas por la costa, transporte y horas) y nuestra Inteligencia Artificial especializada diseñará la ruta por ti e identificará los costos aproximados de cada visita.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">¿Cuál es tu idea de viaje o recorrido?</label>
                <textarea
                  value={aiPlannerPrompt}
                  onChange={(e) => setAiPlannerPrompt(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 bg-white"
                  placeholder='Por ejemplo: "DAME ITINEARIO QUE HACER DESDE LAS 8 AM DESDE SAO PAULO Y LA COSTA DE BRASIL HASTA LLEGAR A RIO DE JANEIRO EN 3 DIAS"'
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAiPlannerPrompt('Dame itinerario que hacer desde las 8 am desde Sao Paulo y la costa de Brasil hasta llegar a Rio de Janeiro en 3 dias')}
                  className="px-3 py-1.5 bg-white border border-slate-150 hover:bg-slate-50 text-[10px] text-slate-500 font-bold rounded-lg transition-all cursor-pointer"
                >
                  Ejemplo Sugerido 🗺️
                </button>
                <button
                  type="button"
                  onClick={handleGenerateItinerary}
                  disabled={isGeneratingItinerary || !aiPlannerPrompt.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isGeneratingItinerary ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Armando Ruta con Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                      <span>Armar Recorrido con IA</span>
                    </>
                  )}
                </button>
              </div>

              {aiPlannerError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-xs text-rose-600 rounded-xl font-bold">
                  ⚠️ {aiPlannerError}
                </div>
              )}

              {generatedItinerary && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 mt-2 space-y-4 shadow-3xs max-h-[420px] overflow-y-auto">
                  <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                    <div className="max-w-[70%]">
                      <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit">
                        ✨ RECORRIDO PROPUESTO POR GEMINI IA
                      </span>
                      <h5 className="text-slate-800 text-xs font-bold mt-1.5 leading-relaxed italic">"{generatedItinerary.summary}"</h5>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase">COSTO TOTAL ESTIMADO</span>
                      <span className="text-sm font-black text-emerald-600 font-display">
                        {generatedItinerary.currency === 'USD' ? '$' : 'R$'} {generatedItinerary.approximateTotalCost}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {generatedItinerary.days?.map((day: any, dIdx: number) => (
                      <div key={dIdx} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
                          Día {day.dayNumber} {day.dateOffset !== undefined ? `(+${day.dateOffset} día)` : ''}
                        </span>
                        <div className="space-y-3 pl-2 border-l-2 border-indigo-200">
                          {day.touristPlaces?.map((p: any, pIdx: number) => (
                            <div key={pIdx} className="text-xs flex items-start justify-between gap-3">
                              <div>
                                <span className="font-extrabold text-slate-700">[{p.timeOfDay}] {p.name}</span>
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">{p.description}</p>
                                {p.locationName && (
                                  <span className="text-[9px] text-teal-650 font-bold bg-teal-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-teal-100/50">
                                    📍 Parada: {p.locationName}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {generatedItinerary.currency === 'USD' ? '$' : 'R$'} {p.estimatedCost}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {onImportItinerary && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          onImportItinerary(generatedItinerary.days, generatedItinerary.currency || 'BRL');
                          setShowAiPlannerPanel(false);
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Aplicar Itinerario e Importar Todo al Viaje ✈️</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Global GPS Nearby Discovery Section for Consolidated View */}
          {showNearby && (
            <div className="bg-indigo-50/40 rounded-2xl border border-indigo-100 p-4 space-y-3 animate-fade-in relative">
              <button 
                onClick={() => setShowNearby(false)}
                className="absolute top-3 right-3 text-indigo-400 hover:text-indigo-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-indigo-900 text-xs uppercase tracking-wider">Descubrimiento cercano (GPS Real)</h4>
              </div>

              {loadingNearby ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] text-indigo-600 font-bold">Consultando a la IA sobre tu ubicación actual...</span>
                </div>
              ) : nearbyError ? (
                <div className="p-3 text-[10px] text-rose-600 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{nearbyError}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {nearbyRecommendations.map((rec, idx) => (
                    <div key={idx} className="bg-white border border-indigo-100 rounded-xl p-3 shadow-3xs flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black text-indigo-900">{rec.name}</span>
                          <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 uppercase font-black">{rec.type}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{rec.description}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] font-bold text-indigo-600 hover:underline"
                        >
                          Ver Mapa 🌐
                        </a>
                        <button
                          onClick={() => {
                            const targetDayId = selectedDay?.id || days[0]?.id;
                            if (targetDayId) {
                              onAddPlace(targetDayId, {
                                name: rec.name,
                                description: rec.description,
                                timeOfDay: 'Sugerido por IA',
                                estimatedCost: 0,
                                locationName: rec.name,
                                locationUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.name)}`
                              });
                            }
                          }}
                          className="p-1 px-2 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-bold hover:bg-indigo-100 transition-colors"
                        >
                          + Itinerario
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Duración</span>
              <span className="text-sm font-black text-slate-700 font-display mt-0.5">{days.length} Días</span>
            </div>
            <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Atracciones</span>
              <span className="text-sm font-black text-slate-700 font-display mt-0.5">{totalPlaces} Paradas</span>
            </div>
            <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Progreso Visitas</span>
              <span className="text-sm font-black text-emerald-700 font-display mt-0.5">{visitedPlaces}/{totalPlaces}</span>
            </div>
          </div>

          {/* GPS Route Consolidation */}
          <div className="bg-gradient-to-br from-teal-50/20 via-indigo-50/15 to-white rounded-2xl p-4.5 border border-teal-100/50 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-650" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-display">Trazado Completo del Viaje en Carretera</h4>
            </div>

            {allMappedPlaces.length === 0 ? (
              <p className="text-xs text-slate-450 italic leading-relaxed bg-white/70 p-4 rounded-xl border border-dashed border-slate-150">
                Aún no has especificado una dirección exacta o ubicación física en tus atracciones turísticas. Añade direcciones a los lugares turísticos de tus días para trazar la ruta de viaje GPS en carretera.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="bg-white border border-slate-105 rounded-xl p-3.5 space-y-3 shadow-3xs">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-700 font-medium">
                    {allMappedPlaces.map((place, idx) => (
                      <React.Fragment key={place.id}>
                        {idx > 0 && <span className="text-slate-300 font-bold shrink-0">➔</span>}
                        <span className="px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg text-[10px] font-bold flex items-center gap-1">
                          <span className="text-teal-650">#{idx + 1}</span>
                          <span className="truncate max-w-[125px]">{place.name}</span>
                          <span className="text-slate-400 text-[9px] font-normal">({place.locationName})</span>
                        </span>
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="bg-teal-50/40 p-3 rounded-lg border border-teal-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3">
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed max-w-md">
                      📍 <b>¡Ruta Consolidada Lista!</b> Tienes un total de <b>{allMappedPlaces.length} paradas GPS registradas</b> en el itinerario. Pulsa el botón de abajo para lanzar el enlace dinámico integrado de Google Maps con la secuencia de viaje optimizada.
                    </p>
                    
                    <a
                      href={globalMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                      Lanzar Mapa GPS Consolidado 🌐
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sequential Day-by-Day Breakdown Summary */}
          <div className="space-y-3">
            <h4 id="itinerario-general-title" className="font-extrabold text-white text-[10px] uppercase tracking-[0.15em] font-display bg-emerald-600 px-4 py-2.5 rounded-xl shadow-sm text-center mb-4">
              ITINERARIO GENERAL DIA POR DIA
            </h4>
            
            <div className="space-y-4">
              {days.map((day, dIdx) => {
                const isSelected = selectedDay?.id === day.id;
                
                // Color cycle for non-selected days
                const colors = [
                  { bg: 'bg-blue-50/60', border: 'border-blue-100', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-700' },
                  { bg: 'bg-amber-50/60', border: 'border-amber-100', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-700' },
                  { bg: 'bg-rose-50/60', border: 'border-rose-100', text: 'text-rose-800', badge: 'bg-rose-100 text-rose-700' },
                  { bg: 'bg-purple-50/60', border: 'border-purple-100', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-700' },
                  { bg: 'bg-cyan-50/60', border: 'border-cyan-100', text: 'text-cyan-800', badge: 'bg-cyan-100 text-cyan-700' },
                ];
                const dayColor = isSelected 
                  ? { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900', badge: 'bg-emerald-600 text-white' }
                  : colors[dIdx % colors.length];

                return (
                  <div 
                    key={day.id} 
                    className={`border-2 rounded-2xl p-4 transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-98 ${dayColor.bg} ${dayColor.border}`}
                    onClick={() => {
                      // Triggering a programmatic selection if needed, but the current UI suggests 
                      // individual days are already manageable in the main view.
                      // For now, we focus on the visual representation requested.
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[13px] font-black font-display uppercase tracking-wider flex items-center gap-2 ${dayColor.text}`}>
                        DIA {day.dayNumber} — {(() => {
                          try {
                            const d = new Date(day.date);
                            const dd = d.getDate().toString().padStart(2, '0');
                            const mm = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"][d.getMonth()];
                            return `${dd} ${mm}`;
                          } catch { return day.date; }
                        })()}
                        {isSelected && (
                          <span className="flex items-center gap-1 animate-pulse">
                            <CheckCircle className="w-4 h-4 ml-1" />
                            <span className="text-[9px] bg-emerald-700 text-white px-2 py-0.5 rounded-full">ACTIVO</span>
                          </span>
                        )}
                      </span>
                      <span className={`text-[10px] font-black rounded-lg px-2.5 py-1 uppercase tracking-tight shadow-3xs ${dayColor.badge}`}>
                        {day.touristPlaces.length} {day.touristPlaces.length === 1 ? 'Lugar' : 'Lugares'}
                      </span>
                    </div>

                  {day.touristPlaces.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic mt-1.5 px-1">Sin visitas registradas todavía para este día de viaje.</p>
                  ) : (
                    <div className="mt-2 pl-3 border-l-2 border-teal-500/50 space-y-2">
                      {day.touristPlaces.map((pl) => (
                        <div key={pl.id} className="flex items-center justify-between gap-2 text-xs">
                          <span className={`font-semibold ${pl.isVisited ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                            • [{pl.timeOfDay}] {pl.name}
                          </span>
                          {pl.locationName && (
                            <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0">
                              <MapPin className="w-2.5 h-2.5" />
                              {pl.locationName}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    if (editingPlace && selectedDay) {
      onUpdatePlace(selectedDay.id, editingPlace.id, {
        name: name.trim(),
        description: description.trim(),
        timeOfDay: timeOfDay || 'Todo el día',
        estimatedCost: parseFloat(estimatedCost) || 0,
        locationName: locationName.trim(),
        locationUrl: locationUrl.trim(),
      });
      setEditingPlace(null);
    } else if (selectedDay) {
      onAddPlace(selectedDay.id, {
        name: name.trim(),
        description: description.trim(),
        timeOfDay: timeOfDay || 'Todo el día',
        estimatedCost: parseFloat(estimatedCost) || 0,
        locationName: locationName.trim(),
        locationUrl: locationUrl.trim(),
      });
    }

    setName('');
    setDescription('');
    setTimeOfDay('10:00');
    setEstimatedCost('0');
    setLocationName('');
    setLocationUrl('');
    setShowAddForm(false);
  };

  const totalBudgetForSights = selectedDay.touristPlaces.reduce(
    (sum, place) => sum + (place.estimatedCost || 0),
    0
  );

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-50 bg-gradient-to-br from-emerald-50/40 to-teal-50/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100/60 flex items-center justify-center text-emerald-600 shadow-3xs">
            <Compass className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 text-[13px] font-display leading-tight">
              Día {selectedDay.dayNumber} — Itinerario Activo 🇧🇷
            </h3>
            
            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center gap-1 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50">
                <span className="font-bold text-slate-500 tracking-tighter">
                  {(() => {
                    try {
                      const date = new Date(selectedDay.date);
                      const day = date.getDate().toString().padStart(2, '0');
                      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                      return `${day}/${months[date.getMonth()]}`;
                    } catch { return selectedDay.date; }
                  })()}
                </span>
                {onUpdateDayDate && (
                  <div className="relative w-3.5 h-3.5 ml-0.5">
                    <input
                      type="date"
                      title="Cambiar fecha del día"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                      value={selectedDay.date}
                      onChange={(e) => {
                        if (e.target.value) {
                          onUpdateDayDate(selectedDay.id, e.target.value);
                        }
                      }}
                    />
                    <Pencil className="w-3 h-3 text-slate-400 group-hover:text-teal-600 transition-colors" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowAiPlannerPanel(!showAiPlannerPanel)}
            className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer uppercase tracking-wider"
          >
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>Armar mi recorrido</span>
          </button>

          <button
            id={`btn-add-place-day-${selectedDay.id}`}
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-3 h-3" />
            <span>Lugar</span>
          </button>

          <button
            onClick={fetchNearbyDiscovery}
            className="flex items-center gap-1 bg-sky-700 hover:bg-sky-800 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer uppercase tracking-wider"
          >
            <Compass className="w-3 h-3 text-white" />
            <span>¿Qué hay cerca?</span>
          </button>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-4">
        {/* AI PLANNER DYNAMIC PANEL */}
        {showAiPlannerPanel && (
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 border-2 border-dashed border-indigo-200 rounded-3xl p-5 space-y-4 animate-fade-in shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-indigo-900 text-sm font-display">Planificador de Itinerarios Premium con IA (Gemini 3.5)</h4>
              </div>
              <button 
                onClick={() => setShowAiPlannerPanel(false)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed font-semibold">
              Escribe tu consulta o instrucción (por ejemplo: puntos de partida, paradas preferidas por la costa, transporte y horas) y nuestra Inteligencia Artificial especializada diseñará la ruta por ti e identificará los costos aproximados de cada visita.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">¿Cuál es tu idea de viaje o recorrido?</label>
              <textarea
                value={aiPlannerPrompt}
                onChange={(e) => setAiPlannerPrompt(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 bg-white"
                placeholder='Por ejemplo: "DAME ITINEARIO QUE HACER DESDE LAS 8 AM DESDE SAO PAULO Y LA COSTA DE BRASIL HASTA LLEGAR A RIO DE JANEIRO EN 3 DIAS"'
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAiPlannerPrompt('Dame itinerario que hacer desde las 8 am desde Sao Paulo y la costa de Brasil hasta llegar a Rio de Janeiro en 3 dias')}
                className="px-3 py-1.5 bg-white border border-slate-150 hover:bg-slate-50 text-[10px] text-slate-500 font-bold rounded-lg transition-all cursor-pointer"
              >
                Ejemplo Sugerido 🗺️
              </button>
              <button
                type="button"
                onClick={handleGenerateItinerary}
                disabled={isGeneratingItinerary || !aiPlannerPrompt.trim()}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isGeneratingItinerary ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Armando Ruta con Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>Armar Recorrido con IA</span>
                  </>
                )}
              </button>
            </div>

            {aiPlannerError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-xs text-rose-600 rounded-xl font-bold">
                ⚠️ {aiPlannerError}
              </div>
            )}

            {generatedItinerary && (
              <div className="bg-white border border-slate-200 rounded-2xl p-4 mt-2 space-y-4 shadow-3xs max-h-[420px] overflow-y-auto">
                <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
                  <div className="max-w-[70%]">
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-black px-2 py-0.5 rounded-md uppercase tracking-wider block w-fit">
                      ✨ RECORRIDO PROPUESTO POR GEMINI IA
                    </span>
                    <h5 className="text-slate-800 text-xs font-bold mt-1.5 leading-relaxed italic">"{generatedItinerary.summary}"</h5>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">COSTO TOTAL ESTIMADO</span>
                    <span className="text-sm font-black text-emerald-600 font-display">
                      {generatedItinerary.currency === 'USD' ? '$' : 'R$'} {generatedItinerary.approximateTotalCost}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {generatedItinerary.days?.map((day: any, dIdx: number) => (
                    <div key={dIdx} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
                        Día {day.dayNumber} {day.dateOffset !== undefined ? `(+${day.dateOffset} día)` : ''}
                      </span>
                      <div className="space-y-3 pl-2 border-l-2 border-indigo-200">
                        {day.touristPlaces?.map((p: any, pIdx: number) => (
                          <div key={pIdx} className="text-xs flex items-start justify-between gap-3">
                            <div>
                                <span className="font-extrabold text-slate-700">[{p.timeOfDay}] {p.name}</span>
                                <p className="text-[11px] text-slate-500 font-normal mt-0.5">{p.description}</p>
                                {p.locationName && (
                                  <span className="text-[9px] text-teal-650 font-bold bg-teal-50 px-1.5 py-0.5 rounded mt-1 inline-block border border-teal-100/50">
                                    📍 Parada: {p.locationName}
                                  </span>
                                )}
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {generatedItinerary.currency === 'USD' ? '$' : 'R$'} {p.estimatedCost}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {onImportItinerary && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onImportItinerary(generatedItinerary.days, generatedItinerary.currency || 'BRL');
                        setShowAiPlannerPanel(false);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Aplicar Itinerario e Importar Todo al Viaje ✈️</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Global GPS Nearby Discovery Section */}
        {showNearby && (
          <div className="bg-indigo-50/40 rounded-2xl border border-indigo-100 p-4 space-y-3 animate-fade-in relative">
            <button 
              onClick={() => setShowNearby(false)}
              className="absolute top-3 right-3 text-indigo-400 hover:text-indigo-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-indigo-900 text-xs uppercase tracking-wider">Descubrimiento cercano (GPS Real)</h4>
            </div>

            {loadingNearby ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] text-indigo-600 font-bold">Consultando a la IA sobre tu ubicación actual...</span>
              </div>
            ) : nearbyError ? (
              <div className="p-3 text-[10px] text-rose-600 bg-rose-50 rounded-xl border border-rose-100 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{nearbyError}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {nearbyRecommendations.map((rec, idx) => (
                  <div key={idx} className="bg-white border border-indigo-100 rounded-xl p-3 shadow-3xs flex flex-col justify-between group">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-indigo-900">{rec.name}</span>
                        <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 uppercase font-black">{rec.type}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{rec.description}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-bold text-indigo-600 hover:underline"
                      >
                        Ver Mapa 🌐
                      </a>
                      <button
                        onClick={() => {
                          onAddPlace(selectedDay.id, {
                            name: rec.name,
                            description: rec.description,
                            timeOfDay: 'Sugerido por IA',
                            estimatedCost: 0,
                            locationName: rec.name,
                            locationUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.name)}`
                          });
                        }}
                        className="p-1 px-2 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-bold hover:bg-indigo-100 transition-colors"
                      >
                        + Itinerario
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Bar for tourist places */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Presupuesto Actividades Estimado
          </div>
          <div className="font-mono text-xs font-black text-slate-705 bg-white py-1 px-2.5 rounded-lg border border-slate-100 shadow-2xs">
            {CURRENCY_SYMBOLS[currency]} {totalBudgetForSights.toFixed(2)}
          </div>
        </div>

        {/* GPS Route summary card for Single Day */}
        {selectedDay.touristPlaces.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50/20 via-teal-50/15 to-white rounded-2xl p-4 border border-teal-100/40 shadow-3xs space-y-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-100/40 text-teal-600 rounded-lg flex items-center justify-center">
                <Map className="w-4 h-4 text-teal-605" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider font-display">Ruta GPS del Día</h4>
                <p className="text-[10px] text-slate-400 font-medium">Secuencia de visitas turísticas para hoy</p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2.5">
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-750 font-semibold">
                {selectedDay.touristPlaces.map((place, idx) => {
                  const hasLoc = !!place.locationName;
                  return (
                    <React.Fragment key={place.id}>
                      {idx > 0 && <span className="text-slate-300 font-bold shrink-0">➔</span>}
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                        hasLoc 
                          ? 'bg-teal-50 text-teal-850 hover:bg-teal-100/80 border border-teal-100/50' 
                          : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        <span>{idx + 1}.</span>
                        <span className="truncate max-w-[120px]">{place.name}</span>
                        {hasLoc && <MapPin className="w-2.5 h-2.5 text-teal-650" />}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>

              {(() => {
                const mappedPlaces = selectedDay.touristPlaces.filter(p => !!p.locationName);
                if (mappedPlaces.length === 0) {
                  return (
                    <p className="text-[10px] text-slate-450 italic leading-snug">
                      💡 <b>Tip de Ruta:</b> Añade una "Ubicación física / Ciudad" en el formulario del lugar para habilitar el trazado automático de carreteras GPS y mapas del día.
                    </p>
                  );
                }

                let dayMapsUrl = '';
                if (mappedPlaces.length === 1) {
                  dayMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mappedPlaces[0].locationName || '')}`;
                } else {
                  const origin = mappedPlaces[0].locationName || '';
                  const destination = mappedPlaces[mappedPlaces.length - 1].locationName || '';
                  const waypoints = mappedPlaces
                    .slice(1, -1)
                    .map(p => p.locationName || '')
                    .join('|');
                  
                  dayMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
                  if (waypoints) {
                    dayMapsUrl += `&waypoints=${encodeURIComponent(waypoints)}`;
                  }
                }

                return (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2.5 border-t border-slate-100/80">
                    <div className="text-[10px] text-slate-550 leading-none">
                      Secuencia con <span className="font-bold text-teal-700">{mappedPlaces.length} ubicaciones</span> geolocalizables.
                    </div>
                    
                    <a
                      href={dayMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white font-black text-[10px] rounded-lg shadow-sm transition-all cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 select-none" />
                      Navegar Ruta GPS del Día 🗺
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Create / Edit Place Form inline */}
        {(showAddForm || editingPlace) && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className={`p-4 rounded-2xl border space-y-3 overflow-hidden ${editingPlace ? 'bg-indigo-50/40 border-indigo-100' : 'bg-teal-50/40 border-teal-100/80'}`}
            onSubmit={handleFormSubmit}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold flex items-center gap-1 ${editingPlace ? 'text-indigo-800' : 'text-teal-800'}`}>
                {editingPlace ? <Pencil className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                {editingPlace ? `Editando: ${editingPlace.name}` : 'Nueva Parada Turística'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPlace(null);
                  setName('');
                  setDescription('');
                  setTimeOfDay('10:00');
                  setEstimatedCost('0');
                  setLocationName('');
                  setLocationUrl('');
                }}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <input
                  id="place-name-input"
                  type="text"
                  placeholder="Nombre de la atracción (Ej: Templo del Sol 🏛️)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <textarea
                  id="place-desc-input"
                  placeholder="Breve descripción o planes aquí..."
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Hora Programada</label>
                  <input
                    type="text"
                    placeholder="Ej: 10:00 | Atardecer"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white font-medium"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Gasto Estimado ({CURRENCY_SYMBOLS[currency]})</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Ej: 15"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white font-mono font-semibold"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                  />
                </div>
              </div>

              {/* Map Location and Google Maps search queries linking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-dashed border-teal-100">
                <div>
                  <label className="text-[9px] font-bold text-slate-450 uppercase">Ubicación física / Ciudad</label>
                  <input
                    id="map-loc-name"
                    type="text"
                    placeholder="Ej: Machu Picchu, Cusco"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white text-xs text-slate-700"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-450 uppercase">Google Maps Link (Opcional)</label>
                  <input
                    id="map-loc-url"
                    type="text"
                    placeholder="Ej: https://maps.app.goo.gl/..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-teal-500 focus:outline-none bg-white text-xs text-teal-800"
                    value={locationUrl}
                    onChange={(e) => setLocationUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Guardar e Incluir en el Itinerario
            </button>
          </motion.form>
        )}

        {/* Tourist place items */}
        <div className="space-y-3 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
          {selectedDay.touristPlaces.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Smile className="w-10 h-10 text-slate-300 stroke-1" />
              <p className="text-xs text-slate-400 mt-2 font-medium">
                No hay actividades de turismo apuntadas todavía.
              </p>
              <p className="text-[10px] text-slate-400 max-w-xs px-4">
                ¡Añade templos, playas, museos o espectáculos usando el botón superior!
              </p>
            </div>
          ) : (
            selectedDay.touristPlaces.map((place) => (
              <div
                key={place.id}
                className={`relative pl-10 group transition-all rounded-2xl p-3 border hover:border-slate-200 hover:shadow-2xs ${
                  place.isVisited
                    ? 'bg-emerald-50/20 border-emerald-100/40 opacity-80'
                    : 'bg-white border-slate-105'
                }`}
              >
                {/* Timeline ball/checkbox */}
                <button
                  id={`btn-toggle-visited-${place.id}`}
                  onClick={() => onToggleVisited(selectedDay.id, place.id)}
                  className="absolute left-2.5 top-4 cursor-pointer focus:outline-none"
                  title={place.isVisited ? 'Marcar como pendiente' : 'Marcar como completado'}
                >
                  {place.isVisited ? (
                    <CheckCircle className="w-5 h-5 text-emerald-500 bg-white rounded-full shadow-2xs" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 hover:text-teal-400 bg-white rounded-full transition-colors" />
                  )}
                </button>

                {/* Content block */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-bold block leading-tight ${
                      place.isVisited ? 'text-emerald-850 line-through' : 'text-slate-800'
                    }`}>
                      {place.name}
                    </span>
                    
                    <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        id={`btn-edit-place-${place.id}`}
                        onClick={() => {
                          setEditingPlace(place);
                          setName(place.name);
                          setDescription(place.description || '');
                          setTimeOfDay(place.timeOfDay || '10:00');
                          setEstimatedCost(place.estimatedCost.toString());
                          setLocationName(place.locationName || '');
                          setLocationUrl(place.locationUrl || '');
                          setShowAddForm(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="p-2 md:p-1.5 bg-indigo-100 md:bg-transparent hover:bg-indigo-200 border border-indigo-200 md:border-transparent text-indigo-700 md:text-slate-300 md:hover:text-indigo-600 rounded-xl shadow-md md:shadow-none transition-all cursor-pointer ring-2 ring-white/50 md:ring-0"
                        title="Editar parada"
                      >
                        <Pencil className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </button>

                      <button
                        id={`btn-remove-place-${place.id}`}
                        onClick={() => onRemovePlace(selectedDay.id, place.id)}
                        className="p-2 md:p-1.5 bg-rose-100 md:bg-transparent hover:bg-rose-200 border border-rose-200 md:border-transparent text-rose-600 md:text-slate-300 md:hover:text-rose-500 rounded-xl shadow-md md:shadow-none transition-all cursor-pointer ring-2 ring-white/50 md:ring-0"
                        title="Eliminar parada turística"
                      >
                        <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
                      </button>
                    </div>
                  </div>

                  {place.description && (
                    <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                      {place.description}
                    </p>
                  )}

                  {/* Metadata line */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-medium text-slate-450">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-350" />
                      {place.timeOfDay || 'Cualquier hora'}
                    </span>
                    {place.estimatedCost > 0 && (
                      <span className="flex items-center gap-0.5 font-mono text-teal-800 bg-teal-50 py-0.5 px-2 rounded-md font-bold shadow-3xs">
                        {CURRENCY_SYMBOLS[currency]} {place.estimatedCost.toFixed(2)} est.
                      </span>
                    )}

                    {/* DYNAMIC MAP PIN AND LINKING EXPERIENCES */}
                    {place.locationName && (
                      <div className="flex items-center gap-1.5 text-slate-600 bg-slate-100/80 py-0.5 px-2 rounded-md max-w-xs truncate border border-slate-150 shadow-3xs">
                        <MapPin className="w-3 h-3 text-teal-605 shrink-0" />
                        <span className="truncate max-w-[120px]">{place.locationName}</span>
                        <a
                          href={place.locationUrl && place.locationUrl.trim() ? place.locationUrl : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.locationName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 font-extrabold hover:underline ml-1 inline-flex items-center gap-0.5 shrink-0"
                          title="Ver dirección exacta en Google Maps"
                        >
                          Mapa 🌐
                        </a>
                      </div>
                    )}
                  </div>

                  {/* AI RECOMMENDATION EXPANDABLE BLOCK */}
                  <div className="mt-3 pt-3 border-t border-slate-100/60">
                    <button
                      id={`btn-ai-spots-${place.id}`}
                      type="button"
                      onClick={() => fetchAiRecommendations(place.id, place.name, place.locationName)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-750 hover:text-indigo-850 text-[10px] font-bold rounded-xl border border-indigo-100/65 transition-all cursor-pointer shadow-3xs"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span>{expandedRecommendations[place.id] ? 'Ocultar atracciones recomendadas por IA' : '✨ Lugares que podría conocer cerca según IA'}</span>
                    </button>

                    <AnimatePresence>
                      {expandedRecommendations[place.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden mt-2.5"
                        >
                          {loadingAi[place.id] ? (
                            <div className="py-4 flex flex-col items-center justify-center gap-1.5 bg-slate-50/50 rounded-2xl border border-slate-100 ml-1">
                              <div className="w-4.5 h-4.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              <span className="text-[10px] text-slate-400 font-bold animate-pulse">
                                Consultando a Gemini sobre atractivos cercanos...
                              </span>
                            </div>
                          ) : aiErrors[place.id] ? (
                            <div className="p-2.5 text-[10px] text-rose-500 bg-rose-50/60 rounded-xl border border-rose-100 font-medium ml-1">
                              ⚠️ {aiErrors[place.id]}
                            </div>
                          ) : aiRecommendations[place.id] && aiRecommendations[place.id].length > 0 ? (
                            <div className="space-y-2 ml-1">
                              <p className="text-[9px] text-indigo-600/90 font-extrabold uppercase tracking-wide px-1">
                                🌟 RECOMENDADOS CERCA DE {place.name.toUpperCase()}:
                              </p>
                              
                              <div className="grid grid-cols-1 gap-2">
                                {aiRecommendations[place.id].map((rec, rIdx) => (
                                  <div 
                                    key={rIdx} 
                                    className="bg-gradient-to-br from-indigo-50/15 to-white hover:from-indigo-50/25 border border-indigo-100/35 hover:border-indigo-100/70 rounded-xl p-2.5 transition-all flex items-start justify-between gap-2.5"
                                  >
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[11px] font-bold text-slate-800">
                                          {rec.name}
                                        </span>
                                        <span className="text-[8px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded-md border border-indigo-100/50 uppercase tracking-widest shrink-0">
                                          {rec.type || 'CERCANO'}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 leading-normal font-normal">
                                        {rec.description}
                                      </p>
                                    </div>

                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rec.name + ' ' + (place.locationName || ''))}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 bg-white border border-slate-150 hover:bg-indigo-50 hover:border-indigo-150 text-[9px] text-indigo-700 hover:text-indigo-805 font-bold rounded-lg transition-colors shadow-4xs cursor-pointer shrink-0"
                                      title="Buscar en Google Maps"
                                    >
                                      Ubicación 🌍
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 text-[10px] italic text-slate-400 bg-slate-50 rounded-xl border border-slate-100 text-center ml-1">
                              No se encontraron sugerencias IA adicionales para esta ubicación.
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
