'use server';
/**
 * @fileOverview Diagnóstico de enfermedades: IA Real con definiciones estáticas.
 */

import {aiInstances, getAIInstance, ai} from '@/ai/genkit';
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

// DEFINICIÓN ESTÁTICA DEL PROMPT (Fuera del loop para evitar 404)
const diagnosisPrompt = ai.definePrompt({
  name: 'cropDiagnosisPrompt_v20',
  input: {schema: CropDiagnosisInputSchema},
  output: {schema: CropDiagnosisOutputSchema},
  prompt: `Eres un experto agrónomo en el estado de Hidalgo, México. 
  Analiza los síntomas reportados por el agricultor: {{#if description}}{{{description}}}{{/if}}
  {{#if photoDataUri}}Foto adjunta: {{media url=photoDataUri}}{{/if}}
  
  Debes proporcionar un diagnóstico preciso, severidad del problema, acciones inmediatas y productos disponibles localmente en Hidalgo.
  Si identificas una plaga común en el Valle del Mezquital, menciona su nombre técnico y tradicional.`,
});

export async function diagnoseCropDisease(input: CropDiagnosisInput): Promise<CropDiagnosisOutput> {
  if (!input.description && !input.photoDataUri) {
    throw new Error("Se requiere descripción o foto.");
  }

  // Intentamos con las instancias de IA (rotación de llaves)
  for (let i = 0; i < aiInstances.length; i++) {
    try {
      const currentAi = getAIInstance(i);
      
      // Llamamos directamente al modelo de la instancia actual para forzar el uso de la llave
      const {output} = await currentAi.generate({
        prompt: `Eres un experto agrónomo en Hidalgo. 
        Analiza: ${input.description || 'Imagen adjunta'}
        Proporciona un diagnóstico estructurado en JSON.`,
        output: {schema: CropDiagnosisOutputSchema},
      });

      if (output) return { ...output, diagnosis: { ...output.diagnosis, isFallback: false } };
    } catch (e: any) {
      console.warn(`Intento de IA ${i + 1} fallido: ${e.message}`);
    }
  }

  // Fallback solo si todo lo anterior falla
  return {
    diagnosis: {
      isProblemDetected: true,
      identifiedProblem: "Motor Experto Local (Modo Respaldo)",
      severity: "Medium",
      confidence: "Medium",
      recommendedActions: ["Revisar el envés de las hojas", "Consultar con un agrónomo local"],
      commercialProducts: [{
        name: "Consulta Técnica",
        description: "Lleva una muestra a tu tienda agropecuaria más cercana.",
        localStores: "Región Hidalgo",
      }],
      homeMadeRemedies: [{
        name: "Aislamiento preventivo",
        ingredients: ["Espacio"],
        instructions: "Evita que la planta enferma toque a las sanas."
      }],
      isFallback: true
    }
  };
}
