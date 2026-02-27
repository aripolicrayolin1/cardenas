'use server';
/**
 * @fileOverview A predictive AI agent with Multi-Key Rotation capability.
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
  const sanitizedInput = {
    ...input,
    soilHumidity: Math.max(0, Math.min(100, input.soilHumidity)),
    temperature: Math.max(-10, Math.min(60, input.temperature)),
  };

  for (let i = 0; i < 3; i++) {
    try {
      const ai = getAIInstance(i);
      
      const prompt = ai.definePrompt({
        name: `predictiveAlertPrompt_${i}`,
        input: {schema: PredictiveAlertInputSchema},
        output: {schema: PredictiveAlertOutputSchema},
        prompt: `Analiza sensores para {{cropType}} en {{region}}: Humedad Suelo: {{{soilHumidity}}}%, Temp: {{{temperature}}}°C. Genera alerta predictiva de plagas.`,
      });

      const {output} = await prompt(sanitizedInput);
      return { ...output!, isFallback: false };
    } catch (e: any) {
      const isQuotaError = e.message?.includes('RESOURCE_EXHAUSTED') || e.status === 429;
      if (!isQuotaError) break;
      console.warn(`Predicción: Llave ${i + 1} agotada, rotando...`);
    }
  }

  // Fallback heurístico si fallan todas las llaves
  return {
    alertNeeded: sanitizedInput.soilHumidity > 80,
    alertMessage: "Límite de IA alcanzado. Usando lógica de sensores local.",
    predictedRisk: sanitizedInput.soilHumidity > 80 ? "Medium" : "None",
    potentialProblem: sanitizedInput.soilHumidity > 80 ? "Riesgo de Hongos (Humedad Alta)" : "Ninguno",
    recommendation: "Monitoreo manual mientras se libera la cuota de la IA.",
    isFallback: true
  };
}
