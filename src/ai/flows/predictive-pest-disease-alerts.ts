'use server';
/**
 * @fileOverview Alertas predictivas basadas en datos de sensores.
 * Determina riesgos de plagas o enfermedades analizando variables IoT.
 */

import { ai } from '@/ai/genkit';
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

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: promptText,
      output: { schema: PredictiveAlertOutputSchema },
    });

    if (output) {
      return { ...output, isFallback: false };
    }
    
    throw new Error('No output from AI');
  } catch (e: any) {
    console.error(`[ERROR-IA-PREDICTIVA] ${e.message}`);
    
    return {
      alertNeeded: input.soilHumidity > 80 || input.temperature > 35,
      alertMessage: "Aviso: Sensores detectan niveles de alerta. Se recomienda inspección física preventiva. (Modo de Respaldo Local)",
      predictedRisk: input.soilHumidity > 80 ? "High" : "Medium",
      potentialProblem: "Estrés Ambiental Detectado",
      recommendation: "Verificar el estado del drenaje y la temperatura foliar directamente en la parcela.",
      isFallback: true
    };
  }
}
