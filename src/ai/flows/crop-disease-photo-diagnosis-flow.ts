'use server';
/**
 * @fileOverview Diagnóstico de enfermedades de cultivos con rotación de llaves y delays.
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

  for (let i = 0; i < 3; i++) {
    try {
      const ai = getAIInstance(i);
      
      const prompt = ai.definePrompt({
        name: `cropDiagnosisPrompt_v3_${i}`,
        input: {schema: CropDiagnosisInputSchema},
        output: {schema: CropDiagnosisOutputSchema},
        prompt: `Eres un experto fitopatólogo en Hidalgo, México. Analiza la imagen y diagnostica el problema.
        Si hay un problema: Identifica el patógeno y sugiere productos comerciales en Hidalgo o remedios caseros.
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
      const isQuotaError = e.message?.includes('RESOURCE_EXHAUSTED') || e.status === 429;
      if (isQuotaError) {
        console.warn(`Llave ${i + 1} agotada. Esperando 1.5s antes de rotar...`);
        await sleep(1500);
        continue;
      }
      break; 
    }
  }

  return {
    diagnosis: {
      isProblemDetected: true,
      identifiedProblem: "IA en Relevo Tecnológico",
      severity: "Medium",
      confidence: "Low",
      recommendedActions: [
        "Google ha limitado temporalmente el acceso por alta demanda.",
        "Estamos rotando tus 3 llaves de acceso para procesar la solicitud.",
        "Por favor, espera 10 segundos y presiona 'Iniciar Análisis' de nuevo."
      ],
      commercialProducts: [],
      homeMadeRemedies: [],
      additionalNotes: `Error Técnico: ${lastError?.message || 'Límite de cuota excedido'}`,
      isWaiting: true
    }
  };
}
