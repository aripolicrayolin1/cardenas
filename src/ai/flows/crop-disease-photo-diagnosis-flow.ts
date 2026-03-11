'use server';
/**
 * @fileOverview Diagnóstico avanzado de enfermedades y plagas (IA Visual Pura).
 * Procesa imágenes reales utilizando Gemini 1.5 Flash.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CropDiagnosisProOutputSchema = z.object({
  diagnosis: z.object({
    identifiedProblem: z.string().describe('Nombre técnico y común.'),
    biologicalCycle: z.string().describe('Explicación del ciclo de vida de la plaga/enfermedad.'),
    severity: z.enum(['Low', 'Medium', 'High']),
    controlStrategies: z.object({
      mechanical: z.array(z.string()).describe('Acciones físicas o manuales.'),
      biological: z.array(z.string()).describe('Depredadores naturales o remedios orgánicos locales.'),
      chemical: z.array(z.string()).describe('Productos químicos técnicos recomendados.'),
    }),
    preventionTips: z.array(z.string()).describe('Consejos para evitar que regrese.'),
    expertNotes: z.string(),
  }),
});

export type CropDiagnosisProInput = {
  photoDataUri?: string;
  description?: string;
};

export type CropDiagnosisProOutput = {
  diagnosis: z.infer<typeof CropDiagnosisProOutputSchema>['diagnosis'];
};

function getMimeType(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}

export async function diagnoseCropDiseasePro(input: CropDiagnosisProInput): Promise<CropDiagnosisProOutput> {
  const promptText = `Eres el Agente de Diagnóstico Científico Pro de AgroTech Hidalgo. 
  Tu misión es analizar la imagen y descripción proporcionada para identificar con precisión científica la plaga o enfermedad.
  
  SÍNTOMAS: ${input.description || 'Analizar visualmente la imagen.'}
  
  Debes proporcionar:
  1. Identificación técnica.
  2. Explicación del ciclo biológico de la plaga.
  3. Estrategias de control divididas en: Mecánicas, Biológicas y Químicas.
  4. Consejos de prevención a largo plazo.`;

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
    output: { schema: CropDiagnosisProOutputSchema },
  });

  if (!output || !output.diagnosis) {
    throw new Error('La IA Pro no pudo procesar la muestra.');
  }
  
  return { diagnosis: output.diagnosis };
}
