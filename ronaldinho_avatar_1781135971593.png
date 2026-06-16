import React, { useState } from 'react';
import { Friend, TravelDocument } from '../types';
import { 
  FileText, 
  Upload, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Plane, 
  Clock, 
  Eye, 
  User, 
  CheckCircle2, 
  AlertCircle,
  FileImage,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Avatar from './Avatar';

interface EmergencyDocumentsPanelProps {
  friends: Friend[];
  onUpdateFriend: (id: string, updatedFields: Partial<Friend>) => void;
}

export default function EmergencyDocumentsPanel({
  friends,
  onUpdateFriend
}: EmergencyDocumentsPanelProps) {
  const [selectedFriendId, setSelectedFriendId] = useState<string>(friends[0]?.id || '');
  const [docName, setDocName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [base64File, setBase64File] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; value: string } | null>(null);

  // Pagination for traveler list (5 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(friends.length / itemsPerPage);
  const paginatedFriends = friends.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Active friend model reference
  const activeFriend = friends.find(f => f.id === selectedFriendId) || friends[0];

  const handleUpdateCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFriend) return;
    onUpdateFriend(activeFriend.id, {
      checkInCode: customCode.trim().toUpperCase()
    });
  };

  // Turn real file load into Base64 format securely
  const processFile = (file: File) => {
    if (!file) return;
    
    // Check file is an image or document
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Por favor selecciona un archivo de imagen (PNG, JPG, JPEG) o código visual.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setBase64File(e.target.result as string);
        if (!docName) {
          // prefill doc name based on file name or generic
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          setDocName(baseName);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFriend || !docName.trim() || !base64File) return;

    const newDoc: TravelDocument = {
      id: `doc_${Date.now()}`,
      name: docName.trim(),
      value: base64File,
      uploadedAt: new Date().toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    const updatedDocuments = [...(activeFriend.documents || []), newDoc];
    onUpdateFriend(activeFriend.id, {
      documents: updatedDocuments
    });

    // Reset fields
    setDocName('');
    setBase64File('');
  };

  const handleDeleteDocument = (docId: string) => {
    if (!activeFriend) return;
    if (window.confirm('¿Deseas eliminar este documento del viajero? Ya no estará guardado en offline.')) {
      const updatedDocuments = (activeFriend.documents || []).filter(d => d.id !== docId);
      onUpdateFriend(activeFriend.id, {
        documents: updatedDocuments
      });
    }
  };

  // Quick preset loader mock documents for quick testing
  const handleLoadDemoDocument = (type: 'boarding' | 'passport') => {
    if (!activeFriend) return;
    
    let demoName = '';
    let demoBase = '';
    
    if (type === 'boarding') {
      demoName = 'Pase de Abordar Rio GIG';
      // A small light purple SVG pattern to act as a mock airline ticket
      demoBase = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="350" height="150" viewBox="0 0 350 150"><rect width="350" height="150" fill="%231e293b" rx="10"/><text x="20" y="35" fill="%2310b981" font-family="monospace" font-size="20" font-weight="bold">BOARDING PASS</text><text x="20" y="70" fill="%23ffffff" font-family="sans-serif" font-size="14">${activeFriend.name.toUpperCase()}</text><text x="20" y="100" fill="%2394a3b8" font-family="sans-serif" font-size="11">VUELO: LN-2026 | SEAT: 12A</text><text x="20" y="125" fill="%2310b981" font-family="monospace" font-size="12">AIRLINE CODE: ${activeFriend.checkInCode || 'GIG441'}</text><rect x="250" y="20" width="80" height="80" fill="%23ffffff" rx="5"/><path d="M 260 30 h 10 v 10 h -10 z M 280 30 h 10 v 10 h -10 z M 260 50 h 20 v 10 h -20 z M 290 60 h 10 v 30 h -10 z M 260 80 h 30 v 10 h -30 z" fill="%230f172a"/><text x="255" y="115" fill="%23ffffff" font-family="monospace" font-size="9">CHECK-IN OK</text></svg>`;
    } else {
      demoName = 'Identificación / Pasaporte Emergencia';
      demoBase = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="350" height="150" viewBox="0 0 350 150"><rect width="350" height="150" fill="%230f766e" rx="10"/><text x="20" y="40" fill="%23e2e8f0" font-family="sans-serif" font-size="16" font-weight="bold">PASAPORTE / ID DE VIAJE</text><text x="20" y="70" fill="%23ffffff" font-family="sans-serif" font-size="16">${activeFriend.name.toUpperCase()}</text><text x="20" y="100" fill="%239cf" font-family="sans-serif" font-size="12">Nro Pasaporte: BR-${activeFriend.id.replace('u_','')}-2026</text><text x="20" y="125" fill="%235eead4" font-family="sans-serif" font-size="10">Seguro Médico Activo: SÍ | Viaje Brasil</text><circle cx="280" cy="80" r="30" fill="%23ffffff" opacity="0.15"/><path d="M 280 65 A 15 15 0 0 0 265 80 h 30 A 15 15 0 0 0 280 65 z M 280 85 A 10 10 0 0 0 270 95 h 20 A 10 10 0 0 0 280 85 z" fill="%23ffffff"/></svg>`;
    }

    const newDoc: TravelDocument = {
      id: `doc_${Date.now()}`,
      name: demoName,
      value: demoBase,
      uploadedAt: new Date().toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };

    const updatedDocuments = [...(activeFriend.documents || []), newDoc];
    onUpdateFriend(activeFriend.id, {
      documents: updatedDocuments
    });
  };

  // Sync check-in code input to currently selected traveler whenever selectedFriendId shifts
  React.useEffect(() => {
    if (activeFriend) {
      setCustomCode(activeFriend.checkInCode || '');
    }
  }, [selectedFriendId, friends]);

  return (
    <div id="emergency-documents-center" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT COLUMN: Traveler Selection Index (Compact lists selector) */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 font-sans flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <span>Seleccionar Viajero</span>
          </h3>
          <div className="space-y-2">
            {paginatedFriends.map((f) => {
              const docCount = f.documents?.length || 0;
              const hasCode = !!f.checkInCode;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFriendId(f.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedFriendId === f.id
                      ? 'border-teal-500 bg-teal-50/40 shadow-xs ring-1 ring-teal-500'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Avatar friend={f} size="xs" className="w-8 h-8" />
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-700 block truncate">
                        {f.name}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {docCount} documentos guardados
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {hasCode ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Check-in registrado" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" title="Código pendiente" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer text-[10px] border border-slate-200"
              >
                ◀
              </button>
              <span className="text-[10px] font-bold text-slate-500 px-3">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer text-[10px] border border-slate-200"
              >
                ▶
              </button>
            </div>
          )}

          <div className="mt-5 p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[10px] leading-relaxed text-indigo-900 font-medium">
              <span className="font-bold block text-indigo-950">Privacidad y Seguridad Offline</span>
              Sube capturas de pantalla de tus pasaportes, seguros de viaje y pases. Todos los archivos se guardan localmente en tu navegador para emergencias.
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Document Board & Check-in codes */}
      <div className="lg:col-span-9 space-y-6">
        {activeFriend ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Box 1: Airline Booking / Check-In Locator block */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display">
                    <Plane className="w-4 h-4 text-teal-605" />
                    Código Airline Check-In / Vuelo
                  </h4>
                  <p className="text-[10px] text-slate-400">Introduce la confirmación o localizador de vuelo de {activeFriend.name}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                  activeFriend.checkInCode 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {activeFriend.checkInCode ? 'Registrado' : 'Pendiente'}
                </span>
              </div>

              <form onSubmit={handleUpdateCheckIn} className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Ej: LA8104, RG4021..."
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      className="w-full pl-3.5 pr-20 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs font-bold uppercase transition-all"
                    />
                    <div className="absolute right-2.5 top-1.5 text-[9px] font-mono text-slate-400 font-bold bg-slate-50 px-1.5 py-1 rounded-md border border-slate-100">
                      Código
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    Guardar
                  </button>
                </div>

                {activeFriend.checkInCode && (
                  <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Localizador Actual</span>
                      <span className="text-base font-extrabold font-mono text-slate-800 uppercase tracking-widest">{activeFriend.checkInCode}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Listo para el Vuelo
                    </div>
                  </div>
                )}
              </form>

              {/* Quick load presets helper */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Simular Documentos de Demostración:</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleLoadDemoDocument('boarding')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded-xl border border-slate-150 border-dashed text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Cargar Demostración: Pase de Abordar
                  </button>
                  <button
                    onClick={() => handleLoadDemoDocument('passport')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-xl border border-slate-150 border-dashed text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Cargar Demostración: Identificación de Emergencia Presupuestos
                  </button>
                </div>
              </div>
            </div>

            {/* Box 2: Secure File Drag & Drop Base64 Loader */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display border-b border-slate-50 pb-3">
                <Upload className="w-4 h-4 text-teal-605" />
                Agregar Documento Nuevo
              </h4>

              <form onSubmit={handleUploadDocumentSubmit} className="space-y-4.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nombre descriptivo:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Pasaporte Sofía, Seguro de Viaje, Ticket de Copacabana..."
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs text-slate-700 transition-all font-semibold"
                  />
                </div>

                {/* Drag and drop zone */}
                <div 
                  className={`border-2 border-dashed rounded-2xl p-4.5 text-center transition-all relative ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-50/20' 
                      : base64File 
                        ? 'border-teal-400 bg-teal-50/10' 
                        : 'border-slate-200 hover:border-slate-350 bg-slate-50/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="travel-document-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {base64File ? (
                    <div className="space-y-2">
                      <div className="w-20 h-14 mx-auto border border-teal-200 rounded-lg overflow-hidden bg-white shadow-xs flex items-center justify-center">
                        <img src={base64File} className="w-full h-full object-cover" alt="Loaded Preview" />
                      </div>
                      <p className="text-[10px] text-teal-600 font-extrabold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        ¡Archivo cargado con éxito!
                      </p>
                      <button 
                        type="button" 
                        onClick={() => setBase64File('')}
                        className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer"
                      >
                        Quitar archivo
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="travel-document-upload" className="cursor-pointer space-y-1 block">
                      <FileImage className="w-7 h-7 text-slate-400 mx-auto" />
                      <span className="text-[10px] font-extrabold text-teal-600 block hover:underline">Selecciona una imagen</span>
                      <span className="text-[9px] text-slate-400 block font-medium">o suelta el archivo aquí</span>
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!base64File || !docName.trim()}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                    base64File && docName.trim()
                      ? 'bg-gradient-to-r from-teal-600 to-indigo-700 text-white hover:opacity-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Almacenar Documento Seguro
                </button>
              </form>
            </div>

            {/* LOWER PORTION: Display Traveler's Saved Documents List */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-display">
                    <FileText className="w-4 h-4 text-teal-605" />
                    Documentos y Fotos Registradas para {activeFriend.name}
                  </h4>
                  <p className="text-[10px] text-slate-400">Accede a las imágenes y códigos cargados de este viajero</p>
                </div>
                <span className="text-[11px] font-mono font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg text-slate-550">
                  Total: {activeFriend.documents?.length || 0}
                </span>
              </div>

              {!activeFriend.documents || activeFriend.documents.length === 0 ? (
                <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-150 space-y-2">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-500">¿No hay fotos ni códigos guardados todavía?</p>
                    <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed mt-0.5">Sube billetes aéreos, seguros de viajero o códigos QR para asegurar que estén listos ante una pérdida de cobertura de red móvil (offline).</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeFriend.documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3 flex flex-col justify-between hover:border-slate-200 transition-all text-left"
                    >
                      <div className="space-y-2.5">
                        <div className="h-28 rounded-xl overflow-hidden border border-slate-100 background-slate-100 relative group bg-white shadow-xs">
                          <img 
                            src={doc.value} 
                            onError={(e)=>{ (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="10" y="50" fill="%2364748b">No image</text></svg>'; }}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" 
                            alt={doc.name} 
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewDoc({ name: doc.name, value: doc.value })}
                              className="p-1.5 bg-white hover:bg-slate-100 rounded-lg text-slate-700 transition-all font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Ver a tamaño completo"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Saturar
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] font-extrabold text-slate-700 block line-clamp-1" title={doc.name}>
                            {doc.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-350" />
                            {doc.uploadedAt}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                        <button
                          onClick={() => setPreviewDoc({ name: doc.name, value: doc.value })}
                          className="text-[10px] font-bold text-teal-650 hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          Ampliar Foto
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Eliminar este documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-3xs space-y-3">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-500">No hay ningún viajero registrado</p>
            <p className="text-xs text-slate-400">Por favor, agrega un compañero de viaje en la barra lateral para empezar.</p>
          </div>
        )}
      </div>

      {/* POPUP FULLVIEW MODAL: ZOOM DOCUMENT PHOTO */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col items-center justify-center z-55 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 relative"
            >
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-black uppercase text-indigo-950 font-sans tracking-wide block truncate max-w-[80%]">
                  {previewDoc.name}
                </span>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-extrabold transition-all cursor-pointer"
                >
                  Cerrar Zoom
                </button>
              </div>
              <div className="p-6 flex items-center justify-center bg-slate-900 overflow-auto min-h-[250px] max-h-[500px]">
                <img 
                  src={previewDoc.value} 
                  onError={(e)=>{ (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="10" y="50" fill="%2364748b">No image</text></svg>'; }}
                  className="max-w-full max-h-[440px] rounded-lg shadow-lg border border-white/10 object-contain" 
                  alt="Zoomed" 
                />
              </div>
              <div className="p-3.5 bg-slate-50 text-center font-display text-[10px] text-slate-500 font-bold border-t border-slate-100">
                Guardado sin conexión para cualquier emergencia o control fronterizo ✈️
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
