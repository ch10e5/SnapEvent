import React, { useState } from 'react';
import ImageDropzone from './components/ImageDropzone';
import EventForm from './components/EventForm';
import { EventDetails, AppState } from './types';
import { fileToGenerativePart, extractEventDetails } from './services/geminiService';
import { CalendarCheck, Loader2, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [eventData, setEventData] = useState<EventDetails | null>(null);
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
      const extractedDetails = await extractEventDetails(base64Data, file.type);
      
      setEventData(extractedDetails);
      setAppState(AppState.REVIEW);
    } catch (error) {
      console.error(error);
      setErrorMessage("Sorry, we couldn't read the event details from this image. Please try another image or ensure the text is legible.");
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setEventData(null);
    setErrorMessage('');
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
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
              <p className="text-slate-500">Extracting time, location, and details</p>
            </div>
          </div>
        )}

        {/* State: REVIEW */}
        {appState === AppState.REVIEW && eventData && (
          <div className="w-full flex flex-col lg:flex-row gap-8 items-start justify-center animate-slide-up">
             {/* Left Column: Image Preview */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
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
            </div>

            {/* Right Column: Form */}
            <div className="w-full lg:w-2/3">
              <EventForm initialData={eventData} onReset={resetApp} />
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
