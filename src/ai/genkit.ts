import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit con la API Key de Google AI Studio.
 * Optimizado para Gemini 1.5 Flash en AgroTech Hidalgo.
 */

// Nueva clave API de Gemini proporcionada por el usuario
const API_KEY = 'AIzaSyD4VAZALewzs5Tj1S17JaUUIFv9-u1loH0';

/**
 * Instancia principal de Genkit configurada con el plugin de Google AI.
 * Se fuerza el uso de apiVersion 'v1' para evitar errores 404 de versiones beta.
 */
export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: API_KEY,
      apiVersion: 'v1'
    })
  ],
});
