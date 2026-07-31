import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

import { tryGetServerEnv } from '@/config/env';

/**
 * @fileOverview Configuración centralizada de Genkit para Gemini 2.0 Flash.
 *
 * Antes fijaba `apiVersion: 'v1'` para Gemini 1.5; ese modelo fue retirado por
 * Google (daba 404) y el pin de versión impedía resolver los modelos actuales.
 * Se deja que el plugin use su endpoint por defecto, que los mantenedores
 * actualizan a los modelos vigentes.
 *
 * La API key se lee de la variable de entorno GEMINI_API_KEY (ver .env.example).
 * Nunca debe hardcodearse aquí: este archivo se versiona.
 */

// `tryGetServerEnv` no lanza: `genkit()` se ejecuta en tiempo de módulo y una
// excepción aquí rompería `next build` en entornos donde las variables sólo
// existen en runtime. Si falta la clave, las llamadas fallarán con el error
// explícito de la API de Google.
const apiKey = tryGetServerEnv()?.geminiApiKey ?? '';

if (!apiKey) {
  console.error(
    '[genkit] Falta GEMINI_API_KEY. Configúrala en .env (local) o en el ' +
      'panel de Firebase App Hosting (producción). La IA no funcionará.'
  );
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey,
    })
  ],
});
