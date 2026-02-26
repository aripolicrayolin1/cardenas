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
    recommendedActions: z.array(z.string()).describe('A list of recommended actions to address the detected problem. Empty array if no problem is detected.'),
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
  prompt: `Eres un experto fitopatólogo con amplio conocimiento en enfermedades y plagas de cultivos. Tu tarea es analizar la imagen y la descripción proporcionadas para diagnosticar posibles problemas en el cultivo. Identifica la enfermedad o plaga, estima su severidad, la confianza en el diagnóstico y sugiere acciones correctivas.

Si no se identifica ningún problema, indica que el cultivo parece sano con 'isProblemDetected: false', 'identifiedProblem: "None"', 'severity: "Not Applicable"', y una lista de acciones recomendadas vacía.

Aquí están los detalles:
{{#if description}}Descripción del problema: {{{description}}}{{/if}}
Foto del cultivo: {{media url=photoDataUri}}`,
});

const cropDiagnosisFlow = ai.defineFlow(
  {
    name: 'cropDiagnosisFlow',
    inputSchema: CropDiagnosisInputSchema,
    outputSchema: CropDiagnosisOutputSchema,
  },
  async input => {
    const {output} = await cropDiagnosisPrompt(input);
    return output!;
  }
);
