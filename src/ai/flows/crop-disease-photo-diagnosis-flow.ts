'use server';
/**
 * @fileOverview This file implements a Genkit flow for diagnosing crop diseases or pests from a photo.
 * Now includes Multi-Key Rotation logic to handle Quota Exhausted errors.
 */

import {getAIInstance} from '@/ai/genkit';
import {z} from 'genkit';

const CropDiagnosisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a crop as a data URI."
    ),
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

/**
 * Función principal que intenta el diagnóstico.
 * Si falla por cuota, rota a la siguiente llave API disponible.
 */
export async function diagnoseCropDisease(input: CropDiagnosisInput): Promise<CropDiagnosisOutput> {
  const maxRetries = 3;
  let lastError = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const ai = getAIInstance(i);
      
      const prompt = ai.definePrompt({
        name: `cropDiagnosisPrompt_${i}`,
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
      if (!isQuotaError) break; // Si no es error de cuota, no reintentamos con otra llave
      console.warn(`Llave ${i + 1} agotada, rotando...`);
    }
  }

  // Si llegamos aquí, todas las llaves fallaron o hubo un error fatal
  return {
    diagnosis: {
      isProblemDetected: true,
      identifiedProblem: "IA en Mantenimiento Regional",
      severity: "Medium",
      confidence: "Low",
      recommendedActions: [
        "El servicio de Google Gemini ha alcanzado el límite en todas las llaves configuradas.",
        "Por favor, intenta de nuevo en 60 segundos.",
        "Asegúrate de haber configurado GEMINI_API_KEY_2 y GEMINI_API_KEY_3 en tu entorno."
      ],
      commercialProducts: [],
      homeMadeRemedies: [],
      additionalNotes: `Error técnico: ${lastError?.message || 'Límite de cuota excedido'}`,
      isWaiting: true
    }
  };
}
