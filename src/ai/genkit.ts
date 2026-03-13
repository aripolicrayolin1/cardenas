import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit optimizada para Gemini 1.5 Flash.
 * Se utiliza la versión v1 de la API para máxima estabilidad en producción.
 */

const API_KEY = 'AIzaSyD4VAZALewzs5Tj1S17JaUUIFv9-u1loH0';

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: API_KEY,
      apiVersion: 'v1'
    })
  ],
});
