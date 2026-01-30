import { GoogleGenAI } from "@google/genai";
import { EventDetails } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================
// Set this to TRUE when you have deployed the 'server.js' backend.
// Set this to FALSE to use the API Key directly in the browser (for development).
const USE_BACKEND_PROXY = false; 

// The URL of your deployed server (e.g., https://my-event-app-api.onrender.com/api/extract)
const BACKEND_URL = 'http://localhost:3000/api/extract';
// ============================================================================


const getClient = () => {
  // Only access process.env.API_KEY if we are NOT using the proxy.
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

/**
 * Main Entry Point: Decides whether to use Direct or Proxy mode
 */
export const extractEventDetails = async (base64Image: string, mimeType: string): Promise<EventDetails[]> => {
    if (USE_BACKEND_PROXY) {
        return extractEventDetailsViaProxy(base64Image, mimeType);
    } else {
        return extractEventDetailsDirect(base64Image, mimeType);
    }
};

/**
 * Helper: Normalizes raw JSON data into EventDetails objects
 */
const mapToEventDetails = (data: any): EventDetails[] => {
    const dataArray = Array.isArray(data) ? data : [data];

    return dataArray.map((item: any) => ({
      title: item.title || "Untitled Event",
      location: item.location || "",
      description: item.description || "",
      startDateTime: item.startDateTime || "",
      endDateTime: item.endDateTime || "",
      recurrence: item.recurrence || "",
    }));
};

/**
 * MODE A: Secure Proxy (Recommended for Production)
 * Sends image to backend, backend holds the key and handles rate limiting.
 */
const extractEventDetailsViaProxy = async (base64Image: string, mimeType: string): Promise<EventDetails[]> => {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64Image, mimeType }),
        });

        if (!response.ok) {
            let errorMsg = 'Backend request failed';
            try {
                const err = await response.json();
                errorMsg = err.error || errorMsg;
            } catch (e) {}
            throw new Error(errorMsg);
        }

        const data = await response.json();
        return mapToEventDetails(data);

    } catch (error) {
        console.error("Proxy Error:", error);
        throw error;
    }
};

/**
 * MODE B: Direct Client (Dev / Preview)
 * Uses API Key directly in browser. Not recommended for public deployment.
 */
const extractEventDetailsDirect = async (base64Image: string, mimeType: string): Promise<EventDetails[]> => {
  const ai = getClient();
  
  const modelId = "gemini-3-flash-preview";
  const currentDateTime = new Date().toString();

  const prompt = `
    You are an expert event extraction assistant. Your task is to perform high-fidelity OCR and layout analysis on the provided image (event invitation, flyer, schedule, or timetable) and extract structured event data.

    CONTEXT: The current date and time is ${currentDateTime}.

    GOAL: Return a pure JSON ARRAY of event objects.

    INSTRUCTIONS:
    1. **Text Extraction**: Read all text carefully. Pay close attention to dates, times (AM/PM), and venue names.
    2. **Layout Analysis**: 
       - If the image contains a table or grid, identify headers and map rows to events correctly.
       - Handle multi-line rows or grouped events (e.g., a date header applying to multiple time slots below it).
    3. **Date Inference**:
       - If the year is missing, assume the event is in the near future relative to ${currentDateTime}.
       - If a day name (e.g., "Friday") is given without a specific date, calculate the next occurrence of that day.
    4. **Output Format**:
       Return a JSON array where each object has:
       - title: (string) Event name.
       - startDateTime: (string) ISO 8601 (YYYY-MM-DDTHH:mm:ss).
       - endDateTime: (string) ISO 8601. Estimate duration (1-2h) if not found.
       - location: (string) Full venue address or name.
       - description: (string) Any other details (speakers, agenda, notes).
       - recurrence: (string) RFC 5545 RRULE if recurring (e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO").

    CRITICAL:
    - If multiple events are listed, extract ALL of them as separate objects.
    - Do not hallucinate information not present in the image.
    - Return ONLY valid JSON.
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
      },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: {
            thinkingBudget: 1024 
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error("No response from AI");
    }

    // Robust JSON parsing
    let jsonString = responseText;
    if (jsonString.includes('```json')) {
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
    }
    
    // Find the array bounds
    const firstBracket = jsonString.indexOf('[');
    const lastBracket = jsonString.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
        jsonString = jsonString.substring(firstBracket, lastBracket + 1);
    } else {
        // Fallback for single object
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
             jsonString = `[${jsonString.substring(firstBrace, lastBrace + 1)}]`;
        }
    }

    let data;
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON Parse Error", e, responseText);
        throw new Error("Failed to parse AI response as JSON");
    }

    return mapToEventDetails(data);

  } catch (error) {
    console.error("Error extracting event details:", error);
    throw error;
  }
};