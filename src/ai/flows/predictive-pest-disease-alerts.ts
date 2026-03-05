'use server';
/**
 * @fileOverview Alertas predictivas usando Gemini 1.5 Flash con rotación forzada.
 */

import {aiInstances, getAIInstance} from '@/ai/genkit';
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

  // Intentamos con todas las llaves disponibles, priorizando Gemini
  for (let i = 0; i < aiInstances.length; i++) {
    try {
      const ai = getAIInstance(i);
      
      const prompt = ai.definePrompt({
        name: `predictiveAlertPrompt_v10_rot_${i}`,
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
      console.warn(`Intento ${i + 1} fallido: ${e.message}`);
      if (i < aiInstances.length - 1) await sleep(1500); 
    }
  }

  // Fallback solo si ABSOLUTAMENTE todas las llaves de Gemini fallan
  return {
    alertNeeded: input.soilHumidity > 75,
    alertMessage: input.soilHumidity > 75 
      ? "Alerta Crítica: Exceso de humedad detectado (De’mthe Hoi). Riesgo inminente de pudrición radicular y hongos fitopatógenos."
      : "Condiciones estables. Se recomienda mantener el monitoreo preventivo habitual.",
    predictedRisk: input.soilHumidity > 75 ? "High" : "None",
    potentialProblem: input.soilHumidity > 75 ? "Hongo por exceso de agua" : "Saludable",
    recommendation: input.soilHumidity > 75 
      ? "Suspender riego inmediato y revisar drenaje del suelo."
      : "No se requieren acciones correctivas de emergencia.",
    isFallback: true
  };
}
