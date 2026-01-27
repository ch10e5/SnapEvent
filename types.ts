export interface EventDetails {
  title: string;
  location: string;
  description: string;
  startDateTime: string; // ISO 8601 format preferred
  endDateTime: string;   // ISO 8601 format preferred
  recurrence?: string;   // RFC 5545 RRULE string (e.g., RRULE:FREQ=WEEKLY;BYDAY=MO)
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  REVIEW = 'REVIEW',
  ERROR = 'ERROR',
}