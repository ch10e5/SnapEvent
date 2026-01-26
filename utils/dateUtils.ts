import { EventDetails } from '../types';

/**
 * Formats a date string into Google Calendar's required format: YYYYMMDDTHHMMSSZ
 * Assumes the input date string is parseable by Date constructor.
 */
export const formatToGCalDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
};

/**
 * Generates the Google Calendar "Add Event" URL.
 */
export const generateGoogleCalendarUrl = (event: EventDetails): string => {
  const { title, location, description, startDateTime, endDateTime } = event;

  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title || "New Event",
    details: description || "",
    location: location || "",
  });

  // Handle dates
  // If dates are missing, GCal will default to current time, but we try to format valid ones.
  const start = formatToGCalDate(startDateTime);
  let end = formatToGCalDate(endDateTime);

  // If start exists but end doesn't, default end to 1 hour after start
  if (start && !end) {
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour
    end = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
  }

  if (start && end) {
    params.set("dates", `${start}/${end}`);
  }

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Formats a date for display in input fields (datetime-local compatible: YYYY-MM-DDThh:mm)
 */
export const toInputDateTime = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  
  // datetime-local expects local time YYYY-MM-DDThh:mm
  // We need to account for timezone offset to show correct local time in the input
  const offset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
  return localISOTime;
};

/**
 * Converts input datetime-local value back to ISO string
 */
export const fromInputDateTime = (localString: string): string => {
    if(!localString) return '';
    const date = new Date(localString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString();
}
