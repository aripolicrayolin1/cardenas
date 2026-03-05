'use server';
/**
 * @fileOverview Diagnóstico de enfermedades: IA Real con rotación de llaves agresiva.
 */

import {aiInstances, getAIInstance} from '@/ai/genkit';
import {z} from 'genkit';

const CropDiagnosisInputSchema = z.object({
  photoDataUri: z.string().optional().describe("A photo of a crop as a data URI."),
  description: z.string().optional().describe('Description of the symptoms.'),
});
export type CropDiagnosisInput = z.infer<typeof CropDiagnosisInputSchema>;

const CropDiagnosisOutputSchema = z.object({
  diagnosis: z.object({
    isProblemDetected: z.boolean(),
    identifiedProblem: z.string(),
    severity: z.enum(['Low', 'Medium', 'High', 'Not Applicable']),
    confidence: z.enum(['Low', 'Medium', 'High']),
    recommendedActions: z.array(z.string()),
    commercialProducts: z.array(z.object({
      name: z.string(),
      description: z.string(),
      localStores: z.string(),
      locationLink: z.string().optional()
    })),
    homeMadeRemedies: z.array(z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      instructions: z.string()
    })),
    additionalNotes: z.string().optional(),
    isFallback: z.boolean().optional(),
  }),
});
export type CropDiagnosisOutput = z.infer<typeof CropDiagnosisOutputSchema>;

export async function diagnoseCropDisease(input: CropDiagnosisInput): Promise<CropDiagnosisOutput> {
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  if (!input.description && !input.photoDataUri) {
    throw new Error("Se requiere descripción o foto.");
  }

  // Intentamos con todas las llaves de Gemini
  for (let i = 0; i < aiInstances.length; i++) {
    try {
      const ai = getAIInstance(i);
      const prompt = ai.definePrompt({
        name: `cropDiagnosisPrompt_v15_rot_${i}`,
        input: {schema: CropDiagnosisInputSchema},
        output: {schema: CropDiagnosisOutputSchema},
        prompt: `Eres un experto agrónomo en el estado de Hidalgo, México. 
        Analiza los síntomas reportados por el agricultor: {{#if description}}{{{description}}}{{/if}}
        {{#if photoDataUri}}Foto adjunta: {{media url=photoDataUri}}{{/if}}
        
        Debes proporcionar un diagnóstico preciso, severidad del problema, acciones inmediatas y productos disponibles localmente en Hidalgo.
        Si identificas una plaga común en el Valle del Mezquital, menciona su nombre técnico y tradicional.`,
      });

      const {output} = await prompt(input);
      if (output) return { ...output, diagnosis: { ...output.diagnosis, isFallback: false } };
    } catch (e: any) {
      console.warn(`Error en llave Gemini ${i + 1}: ${e.message}`);
      if (i < aiInstances.length - 1) await sleep(1500);
    }
  }

  // Diagnóstico local experto solo como último recurso
  return {
    diagnosis: {
      isProblemDetected: true,
      identifiedProblem: "Problema identificado por motor local (Fallback)",
      severity: "Medium",
      confidence: "Medium",
      recommendedActions: ["Revisar el envés de las hojas", "Consultar con un agrónomo local", "Evitar el riego excesivo"],
      commercialProducts: [{
        name: "Consulta en tienda",
        description: "Lleva una muestra a tu tienda agropecuaria más cercana.",
        localStores: "Región Hidalgo",
        locationLink: "https://www.google.com/maps/search/agroquimicas+hidalgo"
      }],
      homeMadeRemedies: [{
        name: "Aislamiento preventivo",
        ingredients: ["Espacio"],
        instructions: "Evita que la planta enferma toque a las sanas."
      }],
      additionalNotes: "Modo de respaldo activado debido a saturación en los servidores de Google.",
      isFallback: true
    }
  };
}
