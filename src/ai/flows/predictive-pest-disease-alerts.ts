'use server';
/**
 * @fileOverview Alertas predictivas basadas en datos de sensores (IA Pura).
 * Analiza variables IoT en tiempo real usando Gemini 1.5 Flash.
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

export type PredictiveAlertOutput = z.infer<typeof PredictiveAlertOutputSchema>;

export async function predictivePestDiseaseAlerts(input: PredictiveAlertInput): Promise<PredictiveAlertOutput> {
  const promptText = `Eres un experto agrónomo en el Valle del Mezquital, Hidalgo.
  Analiza estos datos de sensores en tiempo real para un cultivo de ${input.cropType} en ${input.region}:
  - Humedad del Suelo: ${input.soilHumidity}%
  - Temperatura: ${input.temperature}°C
  - Radiación UV: ${input.uvRadiation}
  
  Determina si existe un riesgo inmediato de plagas, hongos o estrés hídrico. 
  Proporciona un mensaje de alerta claro y una recomendación técnica específica para el agricultor.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    prompt: promptText,
    output: { schema: PredictiveAlertOutputSchema },
  });

  if (!output) {
    throw new Error('La IA predictiva no respondió. Verifica la API Key.');
  }
  
  return output;
}
