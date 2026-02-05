import { GoogleGenAI } from "@google/genai";
import { EventDetails } from '../types.ts';

const USE_BACKEND_PROXY = false; 
const BACKEND_URL = 'http://localhost:3000/api/extract';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please ensure it is set in your environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractEventDetails = async (base64Image: string, mimeType: string): Promise<EventDetails[]> => {
    if (USE_BACKEND_PROXY) {
        return extractEventDetailsViaProxy(base64Image, mimeType);
    } else {
        return extractEventDetailsDirect(base64Image, mimeType);
    }
};

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

const extractEventDetailsViaProxy = async (base64Image: string, mimeType: string): Promise<EventDetails[]> => {
    try {
        const response = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image, mimeType }),
        });
        if (!response.ok) throw new Error('Backend request failed');
        const data = await response.json();
        return mapToEventDetails(data);
    } catch (error) {
        console.error("Proxy Error:", error);
        throw error;
    }
};

const extractEventDetailsDirect = async (base64Image: string, mimeType: string): Promise<EventDetails[]> => {
  const ai = getClient();
  const modelId = "gemini-3-flash-preview";
  const currentDateTime = new Date().toString();

  const prompt = `Extract all events from this image. Current date is ${currentDateTime}. Output a JSON array of event objects with properties: title, startDateTime (ISO 8601), endDateTime (ISO 8601), location, description, recurrence (RRULE).`;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    let jsonString = response.text || "[]";
    if (jsonString.includes('```json')) jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
    const firstBracket = jsonString.indexOf('[');
    const lastBracket = jsonString.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) jsonString = jsonString.substring(firstBracket, lastBracket + 1);

    return mapToEventDetails(JSON.parse(jsonString));
  } catch (error) {
    console.error("Extraction Error:", error);
    throw error;
  }
};