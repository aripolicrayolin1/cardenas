'use server';
/**
 * @fileOverview Alertas predictivas usando Gemini 1.5 Flash con rotación agresiva de llaves.
 */

import {getAIInstance} from '@/ai/genkit';
import {z} from 'genkit';

const PredictiveAlertInputSchema = z.object({
  soilHumidity: z.number(),
  temperature: z.number(),
  uvRadiation: z.number(),
  cropType: z.string(),
  region: z.string(),
});
export type PredictiveAlertInput = z.infer<typeof PredictiveAlertInputSchema>;

const PredictiveAlertOutputSchema = z.object({
  alertNeeded: z.boolean(),
  alertMessage: z.string(),
  predictedRisk: z.enum(['None', 'Low', 'Medium', 'High']),
  potentialProblem: z.string(),
  recommendation: z.string(),
  isFallback: z.boolean().optional(),
});
export type PredictiveAlertOutput = z.infer<typeof PredictiveAlertOutputSchema>;

export async function predictivePestDiseaseAlerts(input: PredictiveAlertInput): Promise<PredictiveAlertOutput> {
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Intentamos con las 3 llaves disponibles
  for (let i = 0; i < 3; i++) {
    try {
      const ai = getAIInstance(i);
      
      const prompt = ai.definePrompt({
        name: `predictiveAlertPrompt_v7_rotation_${i}`,
        input: {schema: PredictiveAlertInputSchema},
        output: {schema: PredictiveAlertOutputSchema},
        prompt: `Eres un experto agrónomo en el Valle del Mezquital, Hidalgo.
        Analiza estos datos de sensores:
        - Humedad del Suelo: {{{soilHumidity}}}%
        - Temperatura: {{{temperature}}}°C
        - Radiación UV: {{{uvRadiation}}}
        - Cultivo: {{{cropType}}}
        - Región: {{{region}}}

        Determina si hay riesgo de plagas o enfermedades. Sé específico pero conciso. 
        Si el riesgo es alto, menciona términos en Hñähñu para enfermedades (ej: De’mthe Hoi para humedad).`,
      });

      const {output} = await prompt(input);
      if (output) return { ...output, isFallback: false };
    } catch (e: any) {
      console.warn(`Llave ${i + 1} agotada o bloqueada, rotando...`);
      // Esperamos un poco antes de reintentar con la siguiente llave para evitar spam
      if (i < 2) await sleep(2500); 
    }
  }

  // Fallback de alta calidad si todas las llaves fallan (Optimizado para el video)
  const isHighHumidity = input.soilHumidity > 75;
  
  return {
    alertNeeded: isHighHumidity,
    alertMessage: isHighHumidity 
      ? "Análisis de respaldo detecta condiciones de riesgo por exceso de humedad (De’mthe Hoi). Existe posibilidad de proliferación de patógenos fúngicos en la base del tallo."
      : "Condiciones estables detectadas por el motor experto local. El riesgo de plagas es mínimo actualmente.",
    predictedRisk: isHighHumidity ? "Medium" : "None",
    potentialProblem: isHighHumidity ? "Hongo por humedad" : "Normal",
    recommendation: isHighHumidity 
      ? "Se recomienda suspender el riego automático y verificar el drenaje del terreno."
      : "Mantén el monitoreo preventivo diario.",
    isFallback: true
  };
}
