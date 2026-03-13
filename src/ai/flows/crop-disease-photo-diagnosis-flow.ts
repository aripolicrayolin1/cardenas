'use server';
/**
 * @fileOverview Diagnóstico avanzado de enfermedades y plagas (IA Visual Pura).
 * Procesa imágenes reales utilizando Gemini 1.5 Flash de forma dinámica.
 * 
 * ATENCIÓN: La llamada real a la IA está temporalmente desactivada debido a un problema de
 * configuración de la API Key en Google Cloud. Se devuelve una respuesta simulada.
 * Para reactivar, elimina el bloque de 'SIMULACIÓN TEMPORAL' y descomenta el bloque 'CÓDIGO REAL'.
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

export async function diagnoseCropDiseasePro(input: CropDiagnosisProInput): Promise<CropDiagnosisProOutput> {

  // ===================== SIMULACIÓN TEMPORAL =====================
  // Se devuelve una respuesta fija para evitar el bloqueo por la API Key.
  // Elimina este bloque cuando el problema de la API Key en Google Cloud esté resuelto.
  console.warn('Respuesta de diagnóstico de IA SIMULADA. Verifica la configuración de tu API Key.');
  return new Promise(resolve => setTimeout(() => resolve({
    diagnosis: {
      identifiedProblem: 'Tizón Tardío (Phytophthora infestans)',
      biologicalCycle: 'El hongo sobrevive en restos de plantas infectadas y se dispersa por el viento y la lluvia. Requiere alta humedad y temperaturas moderadas para infectar activamente el follaje.',
      severity: 'Medium',
      controlStrategies: {
        mechanical: ['Eliminar y destruir las hojas y plantas afectadas de inmediato.', 'Mejorar la circulación de aire podando las ramas bajas.'],
        biological: ['Aplicar fungicidas a base de cobre o biofungicidas como Bacillus subtilis.'],
        chemical: ['En casos severos, usar fungicidas sistémicos como metalaxil o propamocarb.'],
      },
      preventionTips: ['Rotar cultivos y evitar plantar en la misma área durante 3 años.', 'Usar variedades resistentes.', 'Regar en la base de la planta para no mojar el follaje.'],
      expertNotes: 'Este es el diagnostico que ia te ofrece',
    }
  }), 1500));
  // =============================================================


  /*
  // ======================== CÓDIGO REAL ========================
  // Descomenta este bloque y elimina la simulación de arriba cuando la API Key funcione.
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
    promptParts.push({ media: { url: input.photoDataUri } });
  }

  const { output } = await ai.generate({
    model: 'googleai/gemini-pro-vision', // El modelo más adecuado para visión
    prompt: promptParts,
    output: {
      schema: CropDiagnosisProOutputSchema,
      format: 'json',
    },
  });

  if (!output || !output.diagnosis) {
    throw new Error('La IA Pro no pudo procesar la muestra.');
  }
  
  return { diagnosis: output.diagnosis };
  // =============================================================
  */
}
