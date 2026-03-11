'use server';
/**
 * @fileOverview Diagnóstico avanzado de enfermedades y plagas (IA Visual).
 * Optimizado para el contexto de Hidalgo y corregido para evitar fallbacks constantes.
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
  diagnosis: z.infer<typeof CropDiagnosisOutputSchema>['diagnosis'] & { isFallback?: boolean };
};

function getMimeType(dataUri: string): string {
  const match = dataUri.match(/^data:([^;]+);base64,/);
  return match ? match[1] : 'image/jpeg';
}

export async function diagnoseCropDisease(input: CropDiagnosisInput): Promise<CropDiagnosisOutput> {
  const promptText = `Eres el Agente Experto en Fitopatología de AgroTech Hidalgo. 
  Tu misión es analizar la imagen y/o descripción proporcionada por el agricultor para identificar plagas o enfermedades comunes en el estado de Hidalgo.
  
  SÍNTOMAS REPORTADOS: ${input.description || 'Analizar visualmente la imagen proporcionada.'}
  
  Proporciona soluciones que incluyan productos comerciales disponibles en tiendas agropecuarias locales y remedios biológicos/caseros (biopreparados).`;

  try {
    const parts: any[] = [{ text: promptText }];
    if (input.photoDataUri) {
      parts.push({ 
        media: { 
          url: input.photoDataUri, 
          contentType: getMimeType(input.photoDataUri) 
        } 
      });
    }

    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      prompt: parts,
      output: { schema: CropDiagnosisOutputSchema },
    });

    if (output && output.diagnosis) {
      return { diagnosis: { ...output.diagnosis, isFallback: false } };
    }
  } catch (e: any) {
    console.error(`[ERROR-IA-VISUAL] ${e.message}`);
  }

  // FALLBACK ESTRATÉGICO
  return {
    diagnosis: {
      isProblemDetected: true,
      identifiedProblem: "Posible Gusano Cogollero (Spodoptera frugiperda)",
      severity: "High",
      confidence: "Medium",
      recommendedActions: [
        "Realizar una inspección manual del envés de las hojas.",
        "Evitar el riego por aspersión durante el brote para no dispersar larvas.",
        "Aplicar control biológico de inmediato."
      ],
      commercialProducts: [{
        name: "Coragen 20 SC",
        description: "Insecticida altamente efectivo para control de larvas en maíz.",
        localStores: "Disponible en Agropecuaria El Valle (Actopan)",
        locationLink: "https://www.google.com/maps/search/tiendas+agropecuarias+hidalgo"
      }],
      homeMadeRemedies: [{
        name: "Biopreparado de Ajo y Chile",
        ingredients: ["200g Ajo", "100g Chile picante", "1L Agua"],
        instructions: "Licuar, dejar reposar 24h, filtrar y aplicar 100ml por cada 10L de agua."
      }],
      isFallback: true
    }
  };
}
