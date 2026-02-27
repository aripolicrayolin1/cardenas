'use server';
/**
 * @fileOverview Diagnóstico de enfermedades usando Gemini 1.5 Flash para mayor estabilidad en cuota.
 */

import {getAIInstance} from '@/ai/genkit';
import {z} from 'genkit';

const CropDiagnosisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe("A photo of a crop as a data URI."),
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
      localStores: z.string()
    })),
    homeMadeRemedies: z.array(z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      instructions: z.string()
    })),
    additionalNotes: z.string().optional(),
    isWaiting: z.boolean().optional(),
  }),
});
export type CropDiagnosisOutput = z.infer<typeof CropDiagnosisOutputSchema>;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function diagnoseCropDisease(input: CropDiagnosisInput): Promise<CropDiagnosisOutput> {
  let lastError = null;

  // Rotación sobre las 3 llaves
  for (let i = 0; i < 3; i++) {
    try {
      // Forzamos el uso de Gemini 1.5 Flash que tiene límites de RPM más generosos
      const ai = getAIInstance(i);
      
      const prompt = ai.definePrompt({
        name: `cropDiagnosisPrompt_v5_flash_${i}`,
        input: {schema: CropDiagnosisInputSchema},
        output: {schema: CropDiagnosisOutputSchema},
        config: { model: 'googleai/gemini-1.5-flash' },
        prompt: `Eres un experto fitopatólogo en Hidalgo. Analiza la imagen y diagnostica. 
        Si hay problemas, identifica el patógeno y sugiere productos en Hidalgo o remedios caseros.
        Descripción: {{{description}}}
        Imagen: {{media url=photoDataUri}}`,
      });

      const {output} = await prompt(input);
      return {
        ...output!,
        diagnosis: { ...output!.diagnosis, isWaiting: false }
      };
    } catch (e: any) {
      lastError = e;
      console.error(`Error con llave ${i + 1}:`, e.message);
      
      // Si es un error de cuota, esperamos un poco y saltamos a la siguiente llave
      if (e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED')) {
        await sleep(3000); 
        continue;
      }
      break; 
    }
  }

  return {
    diagnosis: {
      isProblemDetected: true,
      identifiedProblem: "Límite de Google Alcanzado",
      severity: "Medium",
      confidence: "Low",
      recommendedActions: [
        "Todas las llaves han alcanzado el límite de peticiones gratuitas por minuto.",
        "Por favor, espera exactamente 30 segundos sin presionar nada.",
        "Google liberará tu conexión automáticamente tras ese tiempo."
      ],
      commercialProducts: [],
      homeMadeRemedies: [],
      additionalNotes: `Error técnico: ${lastError?.message?.substring(0, 60)}...`,
      isWaiting: true
    }
  };
}
