
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit con la API Key de Google AI Studio.
 */

const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDaCIrKjEp7VudNePBRNSQvMbxCpAs4lUU';

/**
 * Instancia principal de Genkit optimizada para Gemini 1.5 Flash.
 */
export const ai = genkit({
  plugins: [googleAI({ apiKey: API_KEY })],
});
