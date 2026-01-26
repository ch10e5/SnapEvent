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

export const extractEventDetails = async (base64Image: string, mimeType: string): Promise<EventDetails> => {
  const ai = getClient();
  
  // Using gemini-2.5-flash-image for image analysis as per guidelines.
  // Note: This model does not support responseMimeType: 'application/json'.
  const modelId = "gemini-2.5-flash-image";

  const prompt = `
    Analyze this image which is an event invitation or flyer.
    Extract the following details into a JSON object:
    - title: The name of the event.
    - startDateTime: The start date and time in ISO 8601 format (YYYY-MM-DDTHH:mm:ss). If year is missing, assume the next occurrence of that date.
    - endDateTime: The end date and time in ISO 8601 format. If not explicitly stated, estimate it to be 2 hours after start, or null if completely unknown.
    - location: The full address or venue name.
    - description: A brief summary of event details, instructions, or RSVP info found in the text.
    
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
      // Removed config: { responseMimeType: "application/json" } to fix INVALID_ARGUMENT error
    });

    const responseText = response.text;
    if (!responseText) {
        throw new Error("No response from AI");
    }

    // Parse the JSON. 
    // We find the first '{' and the last '}' to ensure we extract just the JSON object
    // in case the model includes conversational text or markdown.
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');
    
    let jsonString = responseText;
    if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = responseText.substring(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(jsonString);

    return {
      title: data.title || "",
      location: data.location || "",
      description: data.description || "",
      startDateTime: data.startDateTime || "",
      endDateTime: data.endDateTime || "",
    };

  } catch (error) {
    console.error("Error extracting event details:", error);
    throw error;
  }
};