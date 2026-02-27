'use server';
/**
 * @fileOverview This file implements a Genkit flow for diagnosing crop diseases or pests from a photo.
 *
 * - diagnoseCropDisease - A function that handles the AI-powered crop disease diagnosis process.
 * - CropDiagnosisInput - The input type for the diagnoseCropDisease function.
 * - CropDiagnosisOutput - The return type for the diagnoseCropDisease function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CropDiagnosisInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a crop, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe('An optional description of the crop symptoms or observed issues.'),
});
export type CropDiagnosisInput = z.infer<typeof CropDiagnosisInputSchema>;

const CropDiagnosisOutputSchema = z.object({
  diagnosis: z.object({
    isProblemDetected: z.boolean().describe('True if a disease or pest is detected, false otherwise.'),
    identifiedProblem: z.string().describe('The name of the identified disease or pest, or "None" if no problem is detected.'),
    severity: z.enum(['Low', 'Medium', 'High', 'Not Applicable']).describe('The severity of the detected problem. "Not Applicable" if no problem is detected.'),
    confidence: z.enum(['Low', 'Medium', 'High']).describe('The confidence level of the diagnosis.'),
    recommendedActions: z.array(z.string()).describe('A list of recommended actions to address the detected problem.'),
    commercialProducts: z.array(z.object({
      name: z.string().describe('Nombre del producto o principio activo.'),
      description: z.string().describe('Breve explicación de para qué sirve.'),
      localStores: z.string().describe('Sugerencia de dónde encontrarlo en la región de Hidalgo (ej: "Agropecuarias en Actopan", "Tiendas especializadas en Pachuca").')
    })).describe('Productos comerciales recomendados para la venta.'),
    homeMadeRemedies: z.array(z.object({
      name: z.string().describe('Nombre del remedio casero.'),
      ingredients: z.array(z.string()).describe('Lista de ingredientes fáciles de conseguir.'),
      instructions: z.string().describe('Cómo prepararlo y aplicarlo.')
    })).describe('Alternativas caseras y naturales de bajo costo.'),
    additionalNotes: z.string().optional().describe('Any additional notes or observations regarding the diagnosis.'),
  }).describe('The detailed diagnosis of the crop.'),
});
export type CropDiagnosisOutput = z.infer<typeof CropDiagnosisOutputSchema>;

export async function diagnoseCropDisease(input: CropDiagnosisInput): Promise<CropDiagnosisOutput> {
  return cropDiagnosisFlow(input);
}

const cropDiagnosisPrompt = ai.definePrompt({
  name: 'cropDiagnosisPrompt',
  input: {schema: CropDiagnosisInputSchema},
  output: {schema: CropDiagnosisOutputSchema},
  prompt: `Eres un experto fitopatólogo con amplio conocimiento en enfermedades y plagas de cultivos, especialmente en la región de Hidalgo, México. 
Tu tarea es analizar la imagen y la descripción para diagnosticar el problema.

IMPORTANTE:
1. Si detectas un problema, debes proporcionar:
   - 'commercialProducts': Lista productos específicos indicando comercios o zonas en Hidalgo donde se suelen conseguir (ej: Actopan, Ixmiquilpan, Pachuca).
   - 'homeMadeRemedies': Proporciona al menos una alternativa ecológica o casera detallada para agricultores que prefieren no gastar o usar químicos.
2. Si el cultivo está sano, indica 'isProblemDetected: false' y deja las listas de recomendaciones vacías.

Detalles del caso:
{{#if description}}Descripción del agricultor: {{{description}}}{{/if}}
Foto del cultivo: {{media url=photoDataUri}}`,
});

const cropDiagnosisFlow = ai.defineFlow(
  {
    name: 'cropDiagnosisFlow',
    inputSchema: CropDiagnosisInputSchema,
    outputSchema: CropDiagnosisOutputSchema,
  },
  async input => {
    try {
      const {output} = await cropDiagnosisPrompt(input);
      return output!;
    } catch (e: any) {
      // Manejo de error de cuota agotada (429 Too Many Requests)
      if (e.message?.includes('RESOURCE_EXHAUSTED') || e.status === 429) {
        console.warn("IA Quota exhausted for diagnosis flow.");
        return {
          diagnosis: {
            isProblemDetected: false,
            identifiedProblem: "Servicio de IA en espera (Cuota alcanzada)",
            severity: "Not Applicable",
            confidence: "Low",
            recommendedActions: [
              "Por favor, espera unos 15-30 segundos antes de intentar de nuevo.",
              "El servicio gratuito de Google Gemini tiene un límite de peticiones por minuto."
            ],
            commercialProducts: [],
            homeMadeRemedies: [],
            additionalNotes: "Has alcanzado el límite de procesamiento de imágenes por minuto. No te preocupes, esto es normal en la versión de prueba gratuita. Intenta nuevamente en un momento."
          }
        };
      }
      
      // Si es otro tipo de error, lo lanzamos para que se vea en los logs
      throw e;
    }
  }
);