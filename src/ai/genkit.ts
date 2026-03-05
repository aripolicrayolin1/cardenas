import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuración de Genkit con soporte para rotación de llaves.
 * Se prioriza la llave más reciente proporcionada por el usuario.
 */

const keys = [
  "AIzaSyDdXZUpzQNtcANQgWjhAIMPvA2nr64q5Ho", // Llave principal (q5Ho)
  "AIzaSyDj_O26XGivdJQvjbLdhBK3woU-FRK3avg",
  "AIzaSyDaCIrKjEp7VudNePBRNSQvMbxCpAs4lUU",
  "AIzaSyAN_DszwX0FLg_25hacO8HJHSbqIn2L59s",
  "AIzaSyCvEPqyhH2lWBWZrhpZy_vWalAH9Yhc4Zc"
];

const envKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(Boolean) as string[];

const finalKeys = envKeys.length > 0 ? envKeys : keys;

// Creamos instancias distintas de Genkit, una por cada llave para evitar colisiones
export const aiInstances = finalKeys.map(key => genkit({
  plugins: [googleAI({apiKey: key})],
  model: 'googleai/gemini-1.5-flash',
}));

// Instancia por defecto (la primera es la más reciente)
export const ai = aiInstances[0];

/**
 * Helper para obtener una instancia específica para la rotación.
 */
export function getAIInstance(index: number) {
  return aiInstances[index % aiInstances.length];
}
