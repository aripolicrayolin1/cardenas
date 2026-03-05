'use server';
/**
 * @fileOverview Alertas predictivas: Limpieza de prompt y modelo explícito.
 */

import { aiInstances, ai } from '@/ai/genkit';
import { z } from 'genkit';

const PredictiveAlertOutputSchema = z.object({
  alertNeeded: z.boolean(),
  alertMessage: z.string(),
  predictedRisk: z.enum(['None', 'Low', 'Medium', 'High']),
  potentialProblem: z.string(),
  recommendation: z.string(),
});

export type PredictiveAlertInput = {
  soilHumidity: number;
  temperature: number;
  uvRadiation: number;
  cropType: string;
  region: string;
};

export type PredictiveAlertOutput = z.infer<typeof PredictiveAlertOutputSchema> & { isFallback?: boolean };

export async function predictivePestDiseaseAlerts(input: PredictiveAlertInput): Promise<PredictiveAlertOutput> {
  const promptText = `Eres un experto agrónomo en el Valle del Mezquital, Hidalgo.
  Analiza estos datos de sensores en tiempo real:
  - Humedad del Suelo: ${input.soilHumidity}%
  - Temperatura: ${input.temperature}°C
  - Radiación UV: ${input.uvRadiation}
  - Cultivo: ${input.cropType}
  - Región: ${input.region}
  
  Determina riesgos de plagas o enfermedades inminentes basándote en estas condiciones climáticas típicas de la zona.`;

  const instancesToTry = aiInstances.length > 0 ? aiInstances : [ai];

  for (let i = 0; i < instancesToTry.length; i++) {
    try {
      const currentAi = instancesToTry[i];
      
      const { output } = await currentAi.generate({
        model: 'googleAI/gemini-1.5-flash',
        prompt: promptText,
        output: { schema: PredictiveAlertOutputSchema },
      });

      if (output) return { ...output, isFallback: false };
    } catch (e: any) {
      console.error(`Error en alerta IA ${i + 1}:`, e.message);
    }
  }

  return {
    alertNeeded: input.soilHumidity > 75,
    alertMessage: "Aviso: Sensores detectan niveles de alerta. (Análisis Local de Respaldo)",
    predictedRisk: input.soilHumidity > 75 ? "High" : "Low",
    potentialProblem: input.soilHumidity > 75 ? "Humedad Excesiva" : "Normal",
    recommendation: "Monitorea el drenaje de tu parcela y busca signos de hongos.",
    isFallback: true
  };
}
