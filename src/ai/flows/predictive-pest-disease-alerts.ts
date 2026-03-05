'use server';
/**
 * @fileOverview Alertas predictivas basadas en datos de sensores.
 */

import { aiInstances } from '@/ai/genkit';
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

  for (let i = 0; i < aiInstances.length; i++) {
    try {
      const currentAi = aiInstances[i];
      
      const { output } = await currentAi.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: promptText,
        output: { schema: PredictiveAlertOutputSchema },
      });

      if (output) {
        return { ...output, isFallback: false };
      }
    } catch (e: any) {
      console.error(`[ERROR-IA] Intento con llave ${i + 1} falló: ${e.message}`);
    }
  }

  return {
    alertNeeded: input.soilHumidity > 80 || input.temperature > 35,
    alertMessage: "Aviso: Sensores detectan niveles de alerta. (Análisis Local de Respaldo por saturación de red)",
    predictedRisk: input.soilHumidity > 80 ? "High" : "Medium",
    potentialProblem: "Posible Estrés Térmico o Humedad Excesiva",
    recommendation: "Realiza una inspección manual de la parcela y verifica el drenaje.",
    isFallback: true
  };
}
