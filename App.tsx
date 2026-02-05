import React, { useState, useEffect } from 'react';
import ImageDropzone from './components/ImageDropzone.tsx';
import EventForm from './components/EventForm.tsx';
import { EventDetails, AppState } from './types.ts';
import { fileToGenerativePart, extractEventDetails } from './services/geminiService.ts';
import { CalendarCheck, Loader2, AlertCircle, CheckCircle, Eye, X, ChevronLeft, Menu, ShieldCheck, Lock } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [stackOrder, setStackOrder] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const processImage = async (file: File) => {
    setAppState(AppState.PROCESSING);
    setErrorMessage('');
    
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);

    try {
      const base64Data = await fileToGenerativePart(file);
      const extractedEvents = await extractEventDetails(base64Data, file.type);
      
      setEvents(extractedEvents);
      setStackOrder(extractedEvents.map((_, i) => i));
      setAppState(AppState.REVIEW);
    } catch (error) {
      console.error(error);
      setErrorMessage("Sorry, we couldn't read the event details. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setEvents([]);
    setStackOrder([]);
    setErrorMessage('');
    setIsImageModalOpen(false);
    setIsMobileMenuOpen(false);
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  };

  const dismissCurrentCard = () => {
    setStackOrder(prev => {
        const newOrder = [...prev];
        newOrder.shift();
        return newOrder;
    });
  };

  const handleCardSaved = () => {
    setTimeout(dismissCurrentCard, 500);
  };

  const navLinks = [
    { label: 'New Scan', icon: CalendarCheck, action: resetApp },
  ];

  return (
    <div className="grid grid-rows-[auto_1fr] h-[100dvh] w-full bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 overflow-hidden">
      <header className="px-4 md:px-8 py-4 flex items-center justify-between z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center gap-2 text-indigo-700 z-50">
           {appState === AppState.REVIEW ? (
             <button 
                onClick={resetApp} 
                className="w-[48px] h-[48px] -ml-3 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                aria-label="Go Back"
             >
               <ChevronLeft size={32} />
             </button>
           ) : (
             <div className="w-[48px] h-[48px] flex items-center justify-center bg-indigo-600 rounded-xl shadow-sm shrink-0">
                <CalendarCheck className="w-8 h-8 text-white" />
             </div>
           )}
           {appState !== AppState.REVIEW && (
             <span className="font-bold text-2xl md:text-3xl tracking-tight text-slate-800 hidden xs:inline">
               EventSnap
             </span>
           )}
        </div>

        <div className="flex items-center gap-2 md:gap-6 z-50">
            <nav className="hidden md:flex items-center gap-1 bg-white p-1.5 rounded-full border border-slate-200 shadow-sm">
                {navLinks.map((link) => (
                    <button 
                        key={link.label} 
                        onClick={link.action}
                        className="px-5 py-2.5 text-base font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all flex items-center gap-2"
                    >
                        <link.icon size={20} />
                        {link.label}
                    </button>
                ))}
                <button 
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="px-5 py-2.5 text-base font-medium text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all flex items-center gap-2"
                >
                    <ShieldCheck size={20} />
                    Privacy
                </button>
            </nav>

            {appState === AppState.REVIEW && stackOrder.length > 0 && (
            <div className="flex items-center gap-2 md:gap-3 mr-2 md:mr-0">
                <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-100 text-indigo-700 whitespace-nowrap border border-indigo-200">
                    {stackOrder.length} Left
                </span>
                <button 
                    onClick={() => setIsImageModalOpen(true)}
                    className="w-[48px] h-[48px] flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-600 hover:text-indigo-600 hover:border-indigo-300 shadow-sm active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    title="View Original Image"
                    aria-label="View Original Image"
                >
                    <Eye size={24} />
                </button>
            </div>
            )}

            <button 
                className="md:hidden w-[48px] h-[48px] flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle Menu"
            >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
        </div>
      </header>

      <div 
        className={`
            fixed inset-x-0 top-[80px] bg-white border-b border-slate-200 shadow-xl z-30 
            transition-all duration-300 ease-in-out origin-top md:hidden
            ${isMobileMenuOpen ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-0 -translate-y-4 pointer-events-none'}
        `}
      >
          <div className="p-4 flex flex-col gap-2">
            {navLinks.map((link) => (
                <button 
                    key={link.label} 
                    onClick={() => {
                        link.action();
                        setIsMobileMenuOpen(false);
                    }}
                    className="w-full h-[60px] flex items-center gap-3 px-4 rounded-xl hover:bg-slate-50 text-left text-slate-700 font-medium active:bg-slate-100 transition-colors text-lg"
                >
                    <link.icon size={24} className="text-indigo-600" />
                    {link.label}
                </button>
            ))}
             <button 
                onClick={() => {
                    setIsPrivacyModalOpen(true);
                    setIsMobileMenuOpen(false);
                }}
                className="w-full h-[60px] flex items-center gap-3 px-4 rounded-xl hover:bg-slate-50 text-left text-slate-500 font-medium active:bg-slate-100 transition-colors text-lg"
            >
                <ShieldCheck size={24} />
                Data Privacy
            </button>
          </div>
      </div>

      <main className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center p-5 md:p-8">
        <div className="w-full max-w-lg h-full flex flex-col justify-center">
            {(appState === AppState.IDLE || appState === AppState.ERROR) && (
              <div className="animate-fade-in space-y-4 md:space-y-8 w-full max-w-md mx-auto">
                <div className="text-center space-y-2 md:mb-8">
                   <h1 className="text-3xl md:text-5xl font-bold text-slate-900 tracking-tight">Scan Invitation</h1>
                   <p className="text-slate-500 text-base md:text-xl max-w-xs mx-auto mt-4">Upload an image to magically create calendar events.</p>
                </div>
                <ImageDropzone onImageSelected={processImage} disabled={false} />
                {appState === AppState.ERROR && (
                  <div className="p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake shadow-sm border border-red-100">
                    <AlertCircle size={20} className="shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                )}
              </div>
            )}

            {appState === AppState.PROCESSING && (
              <div className="flex flex-col items-center justify-center space-y-8 animate-fade-in">
                <div className="relative">
                  {previewImage && (
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white border-4 border-white transform rotate-3 bg-white">
                      <img src={previewImage} alt="Processing" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-6 bg-white rounded-full shadow-lg ring-1 ring-slate-100">
                      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    </div>
                  </div>
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-3xl font-bold text-slate-800">Reading details...</h3>
                    <p className="text-slate-400 text-lg">This might take a moment</p>
                </div>
              </div>
            )}

            {appState === AppState.REVIEW && events.length > 0 && (
              <div className="w-full h-full max-h-[850px] flex flex-col justify-center relative pb-2">
                  {stackOrder.length === 0 ? (
                     <div className="flex flex-col items-center justify-center text-center space-y-8 h-full py-12">
                        <div className="relative">
                            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-16 h-16 text-green-600" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-bold text-slate-900">All Done!</h3>
                            <p className="text-slate-500 text-lg">Your calendar is up to date.</p>
                        </div>
                        <button 
                            onClick={resetApp}
                            className="w-full max-w-xs h-[64px] flex items-center justify-center bg-indigo-600 active:bg-indigo-700 text-white font-bold text-xl rounded-2xl shadow-md transition-all transform active:scale-95"
                        >
                            Scan Another
                        </button>
                     </div>
                  ) : (
                    <div className="relative w-full h-full">
                        {events.map((event, originalIndex) => {
                          const visualIndex = stackOrder.indexOf(originalIndex);
                          const isVisible = visualIndex > -1 && visualIndex < 3;
                          if (!isVisible && visualIndex !== -1) return null;
                          return (
                            <div 
                                key={originalIndex}
                                className="absolute inset-0 transition-all duration-500 ease-out"
                                style={{
                                    zIndex: 30 - visualIndex * 10,
                                    transform: `translateY(${visualIndex * 12}px) scale(${1 - visualIndex * 0.04})`,
                                    opacity: isVisible ? 1 : 0,
                                    pointerEvents: visualIndex === 0 ? 'auto' : 'none',
                                }}
                            >
                               <div className={`h-full w-full shadow-xl rounded-3xl ${visualIndex > 0 ? 'brightness-95 grayscale-[0.2]' : ''}`}>
                                    <EventForm 
                                        initialData={event} 
                                        onReset={dismissCurrentCard} 
                                        onComplete={handleCardSaved}
                                    />
                               </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
              </div>
            )}
        </div>
      </main>

      {isImageModalOpen && previewImage && (
         <div className="fixed inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex flex-col">
            <div className="p-4 flex justify-end shrink-0">
               <button 
                 onClick={() => setIsImageModalOpen(false)} 
                 className="w-[56px] h-[56px] flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                 aria-label="Close Preview"
               >
                  <X size={32} />
               </button>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
               <img src={previewImage} alt="Original" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            </div>
         </div>
      )}

      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPrivacyModalOpen(false)} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6 text-indigo-700">
                    <div className="p-3 bg-indigo-50 rounded-xl">
                        <Lock size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Data Privacy</h2>
                        <p className="text-sm text-slate-500">Your security is our priority</p>
                    </div>
                </div>
                <div className="space-y-4 text-slate-600 leading-relaxed text-sm md:text-base">
                    <p><strong>1. Transient Processing:</strong> Your images are processed entirely in memory.</p>
                    <p><strong>2. No Storage:</strong> We do not store your images or personal data.</p>
                    <p><strong>3. Secure AI Analysis:</strong> Images are sent securely to Google's Gemini AI solely for extraction.</p>
                </div>
                <div className="mt-8">
                    <button 
                        onClick={() => setIsPrivacyModalOpen(false)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                    >
                        Understood
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;