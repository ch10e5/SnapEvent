import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Fail fast if API key is missing on server start
if (!API_KEY) {
  console.error("FATAL: API_KEY environment variable is missing.");
  process.exit(1);
}

// 1. Security: CORS
// in production, replace '*' with your frontend domain (e.g., 'https://myapp.vercel.app')
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['POST']
}));

// 2. Performance: Parse JSON bodies (limit 10mb for large images)
app.use(express.json({ limit: '10mb' }));

// 3. Cost Control: Rate Limiting
// Limit each IP to 10 requests per minute
const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10, 
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again in a minute." }
});

// Apply rate limiting to the extract route
app.use('/api', limiter);

// Initialize Gemini SDK on the server
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * PROXY ENDPOINT
 * Receives image data from frontend -> Calls Gemini -> Returns JSON
 */
app.post('/api/extract', async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;

    if (!base64Image || !mimeType) {
      return res.status(400).json({ error: "Missing image data" });
    }

    const currentDateTime = new Date().toString();
    const modelId = "gemini-3-flash-preview";

    const prompt = `
    You are an expert event extraction assistant. Your task is to perform high-fidelity OCR and layout analysis on the provided image (event invitation, flyer, schedule, or timetable) and extract structured event data.

    CONTEXT: The current date and time is ${currentDateTime}.

    GOAL: Return a pure JSON ARRAY of event objects.

    INSTRUCTIONS:
    1. **Text Extraction**: Read all text carefully. Pay close attention to dates, times (AM/PM), and venue names.
    2. **Layout Analysis**: 
       - If the image contains a table or grid, identify headers and map rows to events correctly.
       - Handle multi-line rows or grouped events.
    3. **Date Inference**:
       - If the year is missing, assume the event is in the near future relative to ${currentDateTime}.
       - If a day name is given without a specific date, calculate the next occurrence.
    4. **Output Format**:
       Return a JSON array where each object has:
       - title: (string) Event name.
       - startDateTime: (string) ISO 8601 (YYYY-MM-DDTHH:mm:ss).
       - endDateTime: (string) ISO 8601. Estimate duration (1-2h) if not found.
       - location: (string) Full venue address or name.
       - description: (string) Any other details.
       - recurrence: (string) RFC 5545 RRULE if recurring.

    CRITICAL:
    - If multiple events are listed, extract ALL of them as separate objects.
    - Do not hallucinate information not present in the image.
    - Return ONLY valid JSON.
    `;

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

    const responseText = response.text;
    
    // Sanitize and Parse JSON
    let jsonString = responseText || "";
    if (jsonString.includes('```json')) {
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '');
    }

    // Isolate the JSON array/object from the string
    const firstBracket = jsonString.indexOf('[');
    const lastBracket = jsonString.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
        jsonString = jsonString.substring(firstBracket, lastBracket + 1);
    } else {
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
             jsonString = `[${jsonString.substring(firstBrace, lastBrace + 1)}]`;
        }
    }

    const parsedData = JSON.parse(jsonString);
    res.json(parsedData);

  } catch (error) {
    console.error("Proxy Server Error:", error);
    res.status(500).json({ error: "Failed to process image via backend.", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});