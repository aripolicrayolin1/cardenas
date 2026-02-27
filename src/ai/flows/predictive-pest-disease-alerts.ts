'use server';
/**
 * @fileOverview Alertas predictivas usando Gemini 1.5 Flash para optimizar cuota.
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

  for (let i = 0; i < 3; i++) {
    try {
      const ai = getAIInstance(i);
      
      const prompt = ai.definePrompt({
        name: `predictiveAlertPrompt_v5_rotation_${i}`,
        input: {schema: PredictiveAlertInputSchema},
        output: {schema: PredictiveAlertOutputSchema},
        prompt: `Analiza como experto agrónomo en Hidalgo: Humedad Suelo: {{{soilHumidity}}}%, Temp: {{{temperature}}}°C. Indica riesgo de plagas brevemente.`,
      });

      const {output} = await prompt(input);
      if (output) return { ...output, isFallback: false };
    } catch (e: any) {
      console.warn(`Llave ${i + 1} agotada en predicción, esperando para rotar...`);
      if (i < 2) await sleep(3000); // Espera 3s para no saturar a Google
    }
  }

  // Fallback local si Google falla por completo
  return {
    alertNeeded: input.soilHumidity > 85,
    alertMessage: "IA pausada por alta demanda. Análisis de respaldo activado.",
    predictedRisk: input.soilHumidity > 85 ? "Medium" : "None",
    potentialProblem: input.soilHumidity > 85 ? "Exceso de humedad detectado" : "Normal",
    recommendation: "Espera 20 segundos para un nuevo análisis por IA.",
    isFallback: true
  };
}
