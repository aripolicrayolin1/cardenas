'use server';
/**
 * @fileOverview Diagnóstico de enfermedades con logs de depuración detallados.
 */

import { aiInstances, ai } from '@/ai/genkit';
import { z } from 'genkit';

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
      localStores: z.string(),
      locationLink: z.string().optional()
    })),
    homeMadeRemedies: z.array(z.object({
      name: z.string(),
      ingredients: z.array(z.string()),
      instructions: z.string()
    })),
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
  const promptText = `Eres un experto agrónomo en el estado de Hidalgo, México. 
  Analiza los síntomas reportados por el agricultor: ${input.description || 'Sin descripción, analizar imagen.'}
  
  Debes proporcionar un diagnóstico preciso, severidad del problema, acciones inmediatas y productos disponibles localmente en Hidalgo.
  Si identificas una plaga común en el Valle del Mezquital, menciona su nombre técnico y tradicional.`;

  const instancesToTry = aiInstances.length > 0 ? aiInstances : [ai];

  for (let i = 0; i < instancesToTry.length; i++) {
    try {
      const currentAi = instancesToTry[i];
      
      const parts: any[] = [{ text: promptText }];
      if (input.photoDataUri) {
        parts.push({ 
          media: { 
            url: input.photoDataUri, 
            contentType: getMimeType(input.photoDataUri) 
          } 
        });
      }

      const { output } = await currentAi.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: parts,
        output: { schema: CropDiagnosisOutputSchema },
      });

      if (output && output.diagnosis) {
        console.log(`[EXITO] Diagnóstico generado con llave ${i + 1}`);
        return { diagnosis: { ...output.diagnosis, isFallback: false } };
      }
    } catch (e: any) {
      console.error(`[ERROR-IA] Intento ${i + 1} falló.`);
      console.error(`Mensaje: ${e.message}`);
    }
  }

  console.log(`[FALLBACK] Activando diagnóstico local de respaldo.`);
  return {
    diagnosis: {
      isProblemDetected: true,
      identifiedProblem: "Motor Local de Respaldo (IA desconectada)",
      severity: "Medium",
      confidence: "Medium",
      recommendedActions: ["Revisar el envés de las hojas", "Consultar con un agrónomo local"],
      commercialProducts: [{
        name: "Consulta Técnica",
        description: "Lleva una muestra a tu tienda agropecuaria más cercana.",
        localStores: "Región Hidalgo",
      }],
      homeMadeRemedies: [{
        name: "Aislamiento preventivo",
        ingredients: ["Espacio"],
        instructions: "Evita que la planta enferma toque a las sanas."
      }],
      isFallback: true
    }
  };
}
