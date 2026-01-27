import { GoogleGenAI } from "@google/genai";
import { EventDetails } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Converts a File object to a Base64 string required by Gemini
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractEventDetails = async (base64Image: string, mimeType: string): Promise<EventDetails[]> => {
  const ai = getClient();
  
  // Using gemini-2.5-flash-image for image analysis as per guidelines.
  const modelId = "gemini-2.5-flash-image";
  const currentDateTime = new Date().toString();

  const prompt = `
    Analyze this image which is an event invitation, flyer, schedule, or timetable.
    CONTEXT: The current date and time is ${currentDateTime}.
    
    Goal: Extract all event information into a JSON ARRAY of event objects.

    TABLE / SCHEDULE PARSING INSTRUCTIONS:
    - Check if the content is organized in a table, grid, or columnar format.
    - If a table is detected:
      1. Identify column headers (e.g., "Time", "Session", "Room", "Speaker").
      2. Iterate through each row as a separate event.
      3. Map columns to the appropriate fields below (e.g. "Session" -> title, "Room" -> location).
      4. Handle row spans or section headers: if a date applies to a group of rows, apply it to all of them.
      5. Any extra columns not fitting title/time/location should be added to the 'description'.

    For each event object, extract the following:
    - title: The name of the event.
    - startDateTime: The start date and time in ISO 8601 format (YYYY-MM-DDTHH:mm:ss).
      RULE FOR DAYS OF WEEK: If the image mentions a day (e.g. "Monday") without a specific date (e.g. "Nov 12"), use the context date provided above to calculate the timestamp for the NEXT occurrence of that day.
    - endDateTime: The end date and time in ISO 8601 format. If not explicitly stated, estimate it to be 1-2 hours after start.
    - location: The full address or venue name.
    - description: A brief summary of event details. Include extra table columns here (e.g. Speaker names).
    - recurrence: If the event implies recurrence (e.g. "Weekly", "Every Monday") OR if only a day of the week is mentioned without a specific date, set this to a valid RFC 5545 RRULE string (e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO").

    CRITICAL INSTRUCTIONS FOR MULTIPLE EVENTS:
    - If the image contains a schedule or multiple distinct events (e.g. "Monday 10am" and "Tuesday 11am"), output a separate object for EACH event entry.
    - For recurring weekly schedules (e.g. "Mon 10am, Wed 2pm"), create separate event objects for each day/time pair with the appropriate RRULE.
    
    If a field is not found or unclear, leave it as an empty string.
    Return ONLY valid JSON. Do not use markdown code blocks.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error("No response from AI");
    }

    // Parse the JSON. 
    // Look for array brackets first
    const firstBracket = responseText.indexOf('[');
    const lastBracket = responseText.lastIndexOf(']');
    
    let jsonString = "";
    
    if (firstBracket !== -1 && lastBracket !== -1) {
        jsonString = responseText.substring(firstBracket, lastBracket + 1);
    } else {
        // Fallback: Check for single object and wrap in array
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonString = `[${responseText.substring(firstBrace, lastBrace + 1)}]`;
        } else {
            // Last resort: try parsing the whole text
            jsonString = responseText;
        }
    }

    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON Parse Error", e, jsonString);
        throw new Error("Failed to parse AI response");
    }

    const dataArray = Array.isArray(data) ? data : [data];

    return dataArray.map((item: any) => ({
      title: item.title || "",
      location: item.location || "",
      description: item.description || "",
      startDateTime: item.startDateTime || "",
      endDateTime: item.endDateTime || "",
      recurrence: item.recurrence || "",
    }));

  } catch (error) {
    console.error("Error extracting event details:", error);
    throw error;
  }
};