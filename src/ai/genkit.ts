import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit con la API Key de Google AI Studio.
 * Optimizado para Gemini 1.5 Flash en AgroTech Hidalgo.
 */

// Clave API de Gemini proporcionada por el usuario
const API_KEY = 'AIzaSyD4VAZALewzs5Tj1S17JaUUIFv9-u1loH0';

/**
 * Instancia principal de Genkit configurada con el plugin de Google AI.
 * Se utiliza apiVersion 'v1beta' para soportar correctamente el modo de respuesta JSON (Structured Output).
 */
export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: API_KEY,
      apiVersion: 'v1beta'
    })
  ],
});
