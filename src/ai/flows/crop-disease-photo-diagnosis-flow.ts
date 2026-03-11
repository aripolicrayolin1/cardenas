'use server';
/**
 * @fileOverview Diagnóstico avanzado de enfermedades y plagas (IA Visual Pura).
 * Procesa imágenes reales utilizando Gemini 1.5 Flash.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CropDiagnosisOutputSchema = z.object({
  diagnosis: z.object({
    isProblemDetected: z.boolean(),
    identifiedProblem: z.string().describe('Nombre técnico y común de la plaga o enfermedad.'),
    severity: z.enum(['Low', 'Medium', 'High', 'Not Applicable']),
    confidence: z.enum(['Low', 'Medium', 'High']),
    recommendedActions: z.array(z.string()).describe('Pasos técnicos a seguir de inmediato.'),
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
    })).describe('Remedios biológicos y caseros para control orgánico.'),
    additionalNotes: z.string().optional(),
  }),
});

export type CropDiagnosisInput = {
  photoDataUri?: string;
  description?: string;
};

export type CropDiagnosisOutput = {
  diagnosis: z.infer<typeof CropDiagnosisOutputSchema>['diagnosis'];
};

function getMimeType(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}

export async function diagnoseCropDisease(input: CropDiagnosisInput): Promise<CropDiagnosisOutput> {
  const promptText = `Eres el Agente Experto en Fitopatología de AgroTech Hidalgo. 
  Tu misión es analizar la imagen proporcionada (y la descripción si existe) para identificar plagas o enfermedades agrícolas.
  
  SÍNTOMAS REPORTADOS: ${input.description || 'Analizar visualmente la imagen proporcionada.'}
  
  Analiza la imagen con cuidado buscando daños en hojas, tallos o frutos. Proporciona una respuesta técnica que incluya:
  1. Identificación precisa.
  2. Severidad del problema.
  3. Acciones inmediatas.
  4. Productos comerciales recomendados.
  5. Remedios biológicos (bio-preparados) tradicionales de la región.`;

  const promptParts: any[] = [{ text: promptText }];
  
  if (input.photoDataUri) {
    promptParts.push({ 
      media: { 
        url: input.photoDataUri, 
        contentType: getMimeType(input.photoDataUri) 
      } 
    });
  }

  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    prompt: promptParts,
    output: { schema: CropDiagnosisOutputSchema },
  });

  if (!output || !output.diagnosis) {
    throw new Error('La IA no pudo procesar la muestra. Verifica la imagen o la API Key.');
  }
  
  return { diagnosis: output.diagnosis };
}
