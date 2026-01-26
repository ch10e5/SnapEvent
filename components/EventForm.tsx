import React, { useState, useEffect } from 'react';
import { EventDetails } from '../types';
import { generateGoogleCalendarUrl, toInputDateTime, fromInputDateTime } from '../utils/dateUtils';
import { Calendar, MapPin, AlignLeft, Clock, ArrowRight, ExternalLink } from 'lucide-react';

interface EventFormProps {
  initialData: EventDetails;
  onReset: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ initialData, onReset }) => {
  const [formData, setFormData] = useState<EventDetails>(initialData);
  const [calendarUrl, setCalendarUrl] = useState('');

  // Update calendar URL whenever form data changes
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

  return (
    <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
        <h2 className="text-white font-semibold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Review Event Details
        </h2>
        <button 
          onClick={onReset}
          className="text-indigo-100 hover:text-white text-sm underline decoration-indigo-300 hover:decoration-white transition-all"
        >
          Scan Another
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Event Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Event Name"
            className="w-full text-xl font-bold text-slate-900 border-b-2 border-slate-200 focus:border-indigo-500 outline-none py-2 transition-colors placeholder:font-normal placeholder:text-slate-300"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Time */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Clock size={14} /> Start Time
            </label>
            <input
              type="datetime-local"
              name="startDateTime"
              value={toInputDateTime(formData.startDateTime)}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Clock size={14} /> End Time
            </label>
            <input
              type="datetime-local"
              name="endDateTime"
              value={toInputDateTime(formData.endDateTime)}
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <MapPin size={14} /> Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Add location"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <AlignLeft size={14} /> Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Add details..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
          />
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Add to Google Calendar</span>
            <ExternalLink size={20} />
          </a>
          <p className="text-center text-slate-400 text-xs mt-3">
            Opens in a new tab. You can save the event there.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventForm;
