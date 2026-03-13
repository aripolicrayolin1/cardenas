'use server';
/**
 * @fileOverview Diagnóstico avanzado de enfermedades y plagas (IA Visual Pura).
 * Procesa imágenes reales utilizando Gemini 1.5 Flash de forma dinámica.
 * Optimizado para Genkit v1.x con esquemas de salida estructurados.
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

const CropDiagnosisProInputSchema = z.object({
  photoDataUri: z.string().optional().describe("Foto en formato Data URI base64"),
  description: z.string().optional().describe("Descripción de síntomas dictada o escrita"),
});

export type CropDiagnosisProInput = z.infer<typeof CropDiagnosisProInputSchema>;
export type CropDiagnosisProOutput = z.infer<typeof CropDiagnosisProOutputSchema>;

/**
 * Función exportada para Next.js Server Actions
 */
export async function diagnoseCropDiseasePro(input: CropDiagnosisProInput): Promise<CropDiagnosisProOutput> {
  return diagnoseCropDiseaseFlow(input);
}

/**
 * Flujo centralizado de diagnóstico Genkit
 */
const diagnoseCropDiseaseFlow = ai.defineFlow(
  {
    name: 'diagnoseCropDiseaseFlow',
    inputSchema: CropDiagnosisProInputSchema,
    outputSchema: CropDiagnosisProOutputSchema,
  },
  async (input) => {
    const promptText = `Eres el Agente de Diagnóstico Científico Pro de AgroTech Hidalgo. 
    Tu misión es analizar la imagen y descripción proporcionada para identificar con precisión científica la plaga o enfermedad.
    
    SÍNTOMAS REPORTADOS: ${input.description || 'Analizar visualmente la muestra para detectar anomalías.'}
    
    Debes proporcionar un veredicto técnico que incluya:
    1. Identificación técnica del patógeno.
    2. Ciclo biológico detallado.
    3. Estrategias de control (Mecánicas, Biológicas y Químicas).
    4. Consejos de prevención de bioseguridad.
    
    Responde estrictamente en formato JSON siguiendo el esquema proporcionado.`;

    const promptParts: any[] = [{ text: promptText }];
    
    if (input.photoDataUri) {
      const mimeType = input.photoDataUri.match(/^data:([^;]+);base64,/)?.[1] || 'image/jpeg';
      promptParts.push({ 
        media: { 
          url: input.photoDataUri, 
          contentType: mimeType 
        } 
      });
    }

    try {
      const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: promptParts,
        output: { 
          schema: CropDiagnosisProOutputSchema,
          // Eliminamos format: 'json' para evitar el error de responseMimeType en v1
        },
      });

      if (!output) {
        throw new Error('La IA Pro no pudo generar un veredicto estructurado.');
      }
      
      return output;
    } catch (error: any) {
      console.error("Error en flujo Genkit:", error);
      throw new Error(`Error en el Laboratorio IA: ${error.message}`);
    }
  }
);
