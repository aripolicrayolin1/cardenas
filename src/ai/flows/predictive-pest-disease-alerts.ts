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
  for (let i = 0; i < 3; i++) {
    try {
      const ai = getAIInstance(i);
      
      const prompt = ai.definePrompt({
        name: `predictiveAlertPrompt_v4_flash_${i}`,
        input: {schema: PredictiveAlertInputSchema},
        output: {schema: PredictiveAlertOutputSchema},
        config: { model: 'googleai/gemini-1.5-flash' },
        prompt: `Analiza: Humedad Suelo: {{{soilHumidity}}}%, Temp: {{{temperature}}}°C. Indica riesgo de plagas en Hidalgo brevemente.`,
      });

      const {output} = await prompt(input);
      return { ...output!, isFallback: false };
    } catch (e: any) {
      console.warn(`Llave ${i+1} falló en predicción.`);
      continue; 
    }
  }

  return {
    alertNeeded: input.soilHumidity > 85,
    alertMessage: "IA pausada por alta demanda. Análisis local activado.",
    predictedRisk: input.soilHumidity > 85 ? "Medium" : "None",
    potentialProblem: input.soilHumidity > 85 ? "Posible exceso de humedad" : "Normal",
    recommendation: "Reintenta el análisis de IA en un minuto.",
    isFallback: true
  };
}
