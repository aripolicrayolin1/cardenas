'use server';
/**
 * @fileOverview Alertas predictivas basadas en datos de sensores.
 */

import { aiInstances, ai } from '@/ai/genkit';
import { z } from 'genkit';

const PredictiveAlertOutputSchema = z.object({
  alertNeeded: z.boolean(),
  alertMessage: z.string().describe('Un análisis detallado basado en los sensores.'),
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
  Analiza estos datos de sensores en tiempo real para un cultivo de ${input.cropType} en ${input.region}:
  - Humedad del Suelo: ${input.soilHumidity}%
  - Temperatura: ${input.temperature}°C
  - Radiación UV: ${input.uvRadiation}
  
  Determina si existe un riesgo inmediato de plagas, hongos o estrés hídrico. 
  Proporciona un mensaje de alerta claro y una recomendación técnica específica para el agricultor.`;

  const instancesToTry = aiInstances.length > 0 ? aiInstances : [ai];

  for (let i = 0; i < instancesToTry.length; i++) {
    try {
      const currentAi = instancesToTry[i];
      
      const { output } = await currentAi.generate({
        model: 'googleAI/gemini-1.5-flash',
        prompt: promptText,
        output: { schema: PredictiveAlertOutputSchema },
      });

      if (output) {
        return { ...output, isFallback: false };
      }
    } catch (e: any) {
      console.error(`[ERROR-IA] Intento ${i + 1} falló: ${e.message}`);
    }
  }

  // Fallback local en caso de error de red o cuota
  return {
    alertNeeded: input.soilHumidity > 80 || input.temperature > 35,
    alertMessage: "El sistema de IA está saturado. Basado en el análisis local: Niveles de humedad/temperatura fuera de rango óptimo.",
    predictedRisk: input.soilHumidity > 80 ? "High" : "Medium",
    potentialProblem: "Posible Estrés Térmico o Humedad Excesiva",
    recommendation: "Realiza una inspección manual de la parcela y verifica el drenaje.",
    isFallback: true
  };
}
