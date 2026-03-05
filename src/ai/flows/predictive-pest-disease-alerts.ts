'use server';
/**
 * @fileOverview Alertas predictivas: Definiciones estables para evitar 404.
 */

import {aiInstances, getAIInstance, ai} from '@/ai/genkit';
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
  // Intentamos con todas las instancias de IA
  for (let i = 0; i < aiInstances.length; i++) {
    try {
      const currentAi = getAIInstance(i);
      
      const {output} = await currentAi.generate({
        prompt: `Eres un experto agrónomo en el Valle del Mezquital, Hidalgo.
        Analiza estos datos de sensores:
        - Humedad: ${input.soilHumidity}%
        - Temp: ${input.temperature}°C
        - Cultivo: ${input.cropType}
        Determina riesgos de plagas.`,
        output: {schema: PredictiveAlertOutputSchema},
      });

      if (output) return { ...output, isFallback: false };
    } catch (e: any) {
      console.warn(`Error en llave ${i + 1}: ${e.message}`);
    }
  }

  return {
    alertNeeded: input.soilHumidity > 75,
    alertMessage: "Aviso: Sensores detectan niveles de alerta. (Análisis Local)",
    predictedRisk: input.soilHumidity > 75 ? "High" : "Low",
    potentialProblem: input.soilHumidity > 75 ? "Humedad Excesiva" : "Normal",
    recommendation: "Monitorea el drenaje de tu parcela.",
    isFallback: true
  };
}
