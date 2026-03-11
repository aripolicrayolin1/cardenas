import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit con la API Key de Google AI Studio.
 * Optimizado para Gemini 1.5 Flash en AgroTech Hidalgo.
 */

// Clave API de Gemini definitiva
const API_KEY = 'AIzaSyDaCIrKjEp7VudNePBRNSQvMbxCpAs4lUU';

/**
 * Instancia principal de Genkit configurada con el plugin de Google AI.
 */
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: API_KEY })
  ],
});
