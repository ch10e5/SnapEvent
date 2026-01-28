import React, { useState, useEffect } from 'react';
import { EventDetails } from '../types';
import { generateGoogleCalendarUrl, toInputDateTime, fromInputDateTime } from '../utils/dateUtils';
import { MapPin, AlignLeft, Clock, Repeat, ChevronDown } from 'lucide-react';

interface EventFormProps {
  initialData: EventDetails;
  onReset: () => void;
  onComplete?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ initialData, onReset, onComplete }) => {
  const [formData, setFormData] = useState<EventDetails>(initialData);
  const [calendarUrl, setCalendarUrl] = useState('');
  const [isAdded, setIsAdded] = useState(false);
  const [isAllDay, setIsAllDay] = useState(false);

  // Recurrence State
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('WEEKLY');

  // Parse initial recurrence string (RRULE)
  useEffect(() => {
    if (initialData.recurrence) {
        setRecurrenceEnabled(true);
        // Simple regex to parse standard RRULE parts. e.g. RRULE:FREQ=WEEKLY;INTERVAL=2
        const freqMatch = initialData.recurrence.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/);
        const intervalMatch = initialData.recurrence.match(/INTERVAL=(\d+)/);

        if (freqMatch) {
            setRecurrenceUnit(freqMatch[1] as any);
        }
        if (intervalMatch) {
            setRecurrenceInterval(parseInt(intervalMatch[1], 10));
        }
    }
  }, [initialData.recurrence]);

  // Update formData.recurrence when local state changes
  useEffect(() => {
    if (!recurrenceEnabled) {
        setFormData(prev => ({ ...prev, recurrence: '' }));
    } else {
        const rrule = `RRULE:FREQ=${recurrenceUnit};INTERVAL=${recurrenceInterval}`;
        setFormData(prev => ({ ...prev, recurrence: rrule }));
    }
  }, [recurrenceEnabled, recurrenceInterval, recurrenceUnit]);

  useEffect(() => {
    setCalendarUrl(generateGoogleCalendarUrl(formData));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'startDateTime' || name === 'endDateTime') {
        setFormData(prev => ({ ...prev, [name]: fromInputDateTime(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddToCalendar = () => {
    setIsAdded(true);
    if (onComplete) {
        onComplete();
    } else {
        setTimeout(() => onReset(), 2000);
    }
    setTimeout(() => setIsAdded(false), 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-900 font-sans selection:bg-indigo-100 rounded-3xl overflow-hidden shadow-xl ring-1 ring-slate-200/50 border border-slate-100">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 bg-white shrink-0 z-10 border-b border-slate-100">
        <button
          onClick={onReset}
          className="min-w-[44px] min-h-[44px] flex items-center justify-start text-[17px] text-slate-500 hover:text-slate-800 font-medium transition-colors active:opacity-70"
        >
          Discard
        </button>
        <h1 className="text-[17px] font-bold tracking-tight text-slate-900">Edit Event</h1>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleAddToCalendar}
          className={`min-w-[44px] min-h-[44px] flex items-center justify-end text-[17px] font-bold transition-colors active:opacity-70 ${isAdded ? 'text-green-600' : 'text-indigo-600 hover:text-indigo-700'}`}
        >
          {isAdded ? "Saved" : "Save"}
        </a>
      </div>

      {/* Content Container - No Scroll, Flex Column */}
      <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
        
        {/* Title Card */}
        <div className="shrink-0 bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl shrink-0 text-indigo-600">
             ✨
           </div>
           <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="bg-transparent border-none text-[19px] font-bold text-slate-900 placeholder-slate-400 focus:ring-0 w-full p-0 h-10"
            placeholder="Event Title"
            aria-label="Event Title"
          />
        </div>

        {/* Time Card */}
        <div className="shrink-0 bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-200/50">
            {/* All Day */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 text-slate-700">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <span className="text-[17px] font-medium">All-day</span>
                </div>
                <button 
                  onClick={() => setIsAllDay(!isAllDay)}
                  className={`relative w-[51px] h-[31px] rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isAllDay ? 'bg-indigo-500' : 'bg-slate-300'}`}
                  aria-label="Toggle All-day"
                >
                    <span className={`absolute top-0.5 left-0.5 bg-white w-[27px] h-[27px] rounded-full shadow-sm transition-transform duration-200 ${isAllDay ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Starts */}
            <div className="flex items-center justify-between px-4 py-3 pl-12">
                <span className="text-[17px] text-slate-900 font-medium">Starts</span>
                <input
                    type={isAllDay ? "date" : "datetime-local"}
                    name="startDateTime"
                    value={isAllDay ? toInputDateTime(formData.startDateTime).split('T')[0] : toInputDateTime(formData.startDateTime)}
                    onChange={handleChange}
                    className="bg-transparent border-none text-right text-slate-600 focus:text-indigo-600 focus:ring-0 p-0 text-[17px] font-normal [color-scheme:light] h-8 cursor-pointer"
                    aria-label="Start Time"
                />
            </div>

            {/* Ends */}
            <div className="flex items-center justify-between px-4 py-3 pl-12">
                 <span className="text-[17px] text-slate-900 font-medium">Ends</span>
                 <input
                    type={isAllDay ? "date" : "datetime-local"}
                    name="endDateTime"
                    value={isAllDay ? toInputDateTime(formData.endDateTime).split('T')[0] : toInputDateTime(formData.endDateTime)}
                    onChange={handleChange}
                    className="bg-transparent border-none text-right text-slate-600 focus:text-indigo-600 focus:ring-0 p-0 text-[17px] font-normal [color-scheme:light] h-8 cursor-pointer"
                    aria-label="End Time"
                />
            </div>
        </div>

        {/* Recurrence Card */}
        <div className="shrink-0 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex flex-col gap-3 min-h-[60px] justify-center">
            {/* Top Row: Label and Toggle/Select */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-slate-700">
                    <Repeat className="w-5 h-5 text-indigo-500" />
                    <span className="text-[17px] font-medium">Repeat</span>
                </div>
                <div className="relative">
                     <select
                        value={recurrenceEnabled ? "CUSTOM" : "NEVER"}
                        onChange={(e) => setRecurrenceEnabled(e.target.value === "CUSTOM")}
                        className="appearance-none bg-transparent border-none text-right text-slate-600 hover:text-indigo-600 focus:ring-0 p-0 pr-6 text-[17px] font-normal cursor-pointer"
                        aria-label="Repeat Mode"
                     >
                        <option value="NEVER" className="bg-white text-slate-900">Never</option>
                        <option value="CUSTOM" className="bg-white text-slate-900">Custom</option>
                     </select>
                     <ChevronDown className="w-4 h-4 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>
            
            {/* Expanded Row: Custom Intervals */}
            {recurrenceEnabled && (
                <div className="flex items-center justify-end gap-2 animate-fade-in-down">
                    <span className="text-[17px] text-slate-500">Every</span>
                    <input 
                        type="number"
                        min="1"
                        max="999"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 h-10 bg-white rounded-lg border border-slate-200 text-center text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-[17px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <div className="relative">
                        <select
                            value={recurrenceUnit}
                            onChange={(e) => setRecurrenceUnit(e.target.value as any)}
                            className="h-10 appearance-none bg-white rounded-lg border border-slate-200 text-slate-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 pl-3 pr-8 text-[17px]"
                        >
                            <option value="DAILY">Day{recurrenceInterval > 1 ? 's' : ''}</option>
                            <option value="WEEKLY">Week{recurrenceInterval > 1 ? 's' : ''}</option>
                            <option value="MONTHLY">Month{recurrenceInterval > 1 ? 's' : ''}</option>
                            <option value="YEARLY">Year{recurrenceInterval > 1 ? 's' : ''}</option>
                        </select>
                         <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            )}
        </div>

        {/* Details Card - Flex Grow */}
        <div className="flex-1 min-h-0 flex flex-col bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-200/50">
            {/* Location */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3">
                <MapPin className="w-5 h-5 text-indigo-500 shrink-0" />
                <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Add Location"
                    className="bg-transparent border-none text-slate-900 placeholder-slate-400 focus:ring-0 w-full p-0 text-[17px] h-8"
                    aria-label="Location"
                />
            </div>

            {/* Notes */}
            <div className="flex-1 min-h-0 flex items-start gap-3 px-4 py-3">
                <AlignLeft className="w-5 h-5 text-indigo-500 shrink-0 mt-1" />
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add Notes"
                    className="bg-transparent border-none text-slate-900 placeholder-slate-400 focus:ring-0 w-full p-0 text-[17px] resize-none leading-relaxed h-full"
                    aria-label="Notes"
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default EventForm;