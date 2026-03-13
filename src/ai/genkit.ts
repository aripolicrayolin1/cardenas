
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit con la API Key de Google AI Studio.
 * Optimizado para Gemini 1.5 Flash en AgroTech Hidalgo.
 */

// Clave API de Gemini obtenida de forma segura desde variables de entorno.
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  throw new Error('La variable de entorno GOOGLE_API_KEY no está definida. Por favor, añádela a tu archivo .env.local');
}

/**
 * Instancia principal de Genkit configurada con el plugin de Google AI.
 * Se especifica la apiVersion: "v1" para compatibilidad con Gemini 1.5 Flash.
 */
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: API_KEY,
      apiVersion: "v1", // Forza el uso de la API v1
    })
  ],
});
