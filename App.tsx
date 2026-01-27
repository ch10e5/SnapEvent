import React, { useState } from 'react';
import ImageDropzone from './components/ImageDropzone';
import EventForm from './components/EventForm';
import { EventDetails, AppState } from './types';
import { fileToGenerativePart, extractEventDetails } from './services/geminiService';
import { CalendarCheck, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [events, setEvents] = useState<EventDetails[]>([]);
  const [stackOrder, setStackOrder] = useState<number[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const processImage = async (file: File) => {
    setAppState(AppState.PROCESSING);
    setErrorMessage('');
    
    // Create a local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);

    try {
      const base64Data = await fileToGenerativePart(file);
      const extractedEvents = await extractEventDetails(base64Data, file.type);
      
      setEvents(extractedEvents);
      // Initialize stack order: [0, 1, 2, ... length-1]
      setStackOrder(extractedEvents.map((_, i) => i));
      setAppState(AppState.REVIEW);
    } catch (error) {
      console.error(error);
      setErrorMessage("Sorry, we couldn't read the event details from this image. Please try another image or ensure the text is legible.");
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setEvents([]);
    setStackOrder([]);
    setErrorMessage('');
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  };

  const handleCardComplete = () => {
    // Dismiss the card after a short delay to allow for the "Added" visual feedback
    setTimeout(() => {
        setStackOrder(prev => {
            const newOrder = [...prev];
            newOrder.shift(); // Remove the top card
            return newOrder;
        });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-10 space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl shadow-lg mb-4">
          <CalendarCheck className="text-white w-8 h-8" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          EventSnap
        </h1>
        <p className="text-lg text-slate-600 max-w-lg mx-auto">
          Turn any invitation image into a Google Calendar event in seconds using AI.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">
        
        {/* State: IDLE or ERROR */}
        {(appState === AppState.IDLE || appState === AppState.ERROR) && (
          <div className="w-full max-w-xl animate-fade-in">
            <ImageDropzone onImageSelected={processImage} disabled={false} />
            
            {appState === AppState.ERROR && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-shake">
                <AlertCircle className="shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
                <button onClick={resetApp} className="ml-auto font-semibold underline hover:text-red-800">Retry</button>
              </div>
            )}
          </div>
        )}

        {/* State: PROCESSING */}
        {appState === AppState.PROCESSING && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-fade-in">
            <div className="relative">
              {/* Preview image behind loader */}
              {previewImage && (
                <div className="absolute inset-0 flex items-center justify-center opacity-30 blur-sm scale-90">
                  <img src={previewImage} alt="Processing" className="max-w-xs max-h-48 object-contain rounded-lg" />
                </div>
              )}
              <div className="relative z-10 p-4 bg-white rounded-full shadow-xl">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xl font-semibold text-slate-800">Analyzing Invitation...</h3>
              <p className="text-slate-500">Extracting events, time, and locations</p>
            </div>
          </div>
        )}

        {/* State: REVIEW */}
        {appState === AppState.REVIEW && events.length > 0 && (
          <div className="w-full flex flex-col lg:flex-row gap-8 items-start justify-center animate-slide-up">
             {/* Left Column: Image Preview */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4 lg:sticky lg:top-6">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Source Image</p>
                {previewImage && (
                  <img 
                    src={previewImage} 
                    alt="Original Invitation" 
                    className="w-full h-auto rounded-lg object-contain max-h-[500px]" 
                  />
                )}
              </div>
              
              <button 
                  onClick={resetApp}
                  className="w-full py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl shadow-sm transition-all"
              >
                  Scan New Image
              </button>
            </div>

            {/* Right Column: Stacked Cards or Success */}
            <div className="w-full lg:w-2/3 relative min-h-[600px] pb-20">
              
              {stackOrder.length === 0 ? (
                /* Success View */
                 <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in bg-white/50 rounded-3xl border-2 border-dashed border-slate-200 p-8 min-h-[400px]">
                    <div className="p-4 bg-green-100 text-green-600 rounded-full shadow-sm animate-bounce">
                        <CheckCircle className="w-12 h-12" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">All Caught Up!</h3>
                        <p className="text-slate-500 mt-2">
                           You've successfully processed all events from the image.
                        </p>
                    </div>
                    <button 
                        onClick={resetApp}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all transform hover:-translate-y-0.5"
                    >
                        Scan Another Image
                    </button>
                 </div>
              ) : (
                /* Cards Stack */
                <>
                  <div className="mb-6 flex justify-center animate-fade-in">
                      <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-white text-slate-600 shadow-sm border border-slate-200">
                        {stackOrder.length} event{stackOrder.length !== 1 ? 's' : ''} remaining
                      </span>
                  </div>

                  <div className="grid grid-cols-1 grid-rows-1 isolate">
                    {events.map((event, originalIndex) => {
                      // Find where this event sits in the visual stack
                      const visualIndex = stackOrder.indexOf(originalIndex);
                      
                      // We only render/animate the top 3 cards
                      const isVisible = visualIndex > -1 && visualIndex < 3;
                      
                      if (!isVisible && visualIndex !== -1) return null;

                      return (
                        <div 
                            key={originalIndex}
                            className="transition-all duration-500 ease-out bg-transparent"
                            style={{
                                gridArea: '1 / 1',
                                zIndex: 30 - visualIndex * 10,
                                transformOrigin: 'bottom center',
                                transform: `translateY(${visualIndex * 14}px) scale(${1 - visualIndex * 0.05})`,
                                opacity: isVisible ? 1 : 0,
                                pointerEvents: visualIndex === 0 ? 'auto' : 'none',
                            }}
                        >
                           {/* Wrapper to add dimming effect to back cards */}
                           <div className={`transition-all duration-500 rounded-xl ${visualIndex > 0 ? 'brightness-95 shadow-none' : 'shadow-xl'}`}>
                                <EventForm 
                                    initialData={event} 
                                    onReset={resetApp} 
                                    onComplete={handleCardComplete}
                                    index={originalIndex}
                                    total={events.length}
                                />
                           </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-slate-400 text-sm">
        <p>Powered by Google Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
};

export default App;