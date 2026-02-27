'use server';
/**
 * @fileOverview Diagnóstico de enfermedades híbrido: IA + Lógica Local de Respaldo.
 */

import {aiInstances} from '@/ai/genkit';
import {z} from 'genkit';

const CropDiagnosisInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of a crop as a data URI."),
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
    isFallback: z.boolean().optional(),
  }),
});
export type CropDiagnosisOutput = z.infer<typeof CropDiagnosisOutputSchema>;

/**
 * Lógica de diagnóstico local (Experto de Respaldo)
 * Se activa si todas las llaves de IA fallan por cuota.
 */
function getLocalDiagnosis(description: string = ""): CropDiagnosisOutput {
  const desc = description.toLowerCase();
  
  let problem = "Problema no identificado (Requiere IA)";
  let actions = ["Mantener observación", "Evitar exceso de riego"];
  let remedies = [{ name: "Aislamiento", ingredients: ["Ninguno"], instructions: "Separa la planta afectada para evitar contagios." }];

  if (desc.includes("mancha") || desc.includes("cafe") || desc.includes("amarill")) {
    problem = "Posible Tizón o Hongo Foliar";
    actions = ["Reducir humedad en hojas", "Aplicar fungicida a base de cobre", "Podar partes secas"];
    remedies = [{ name: "Té de Manzanilla", ingredients: ["Manzanilla", "Agua"], instructions: "Rociar sobre las hojas para combatir hongos leves." }];
  } else if (desc.includes("mosca") || desc.includes("blanca") || desc.includes("bichito")) {
    problem = "Posible Infestación de Mosca Blanca";
    actions = ["Usar trampas cromáticas amarillas", "Limpiar envés de las hojas", "Revisar cultivos vecinos"];
    remedies = [{ name: "Solución Jabonosa", ingredients: ["Jabón potásico", "Agua"], instructions: "Pulverizar sobre las moscas para eliminarlas por contacto." }];
  } else if (desc.includes("gusano") || desc.includes("comido")) {
    problem = "Posible Plaga de Gusano Cogollero";
    actions = ["Retirada manual de larvas", "Aplicar Bacillus thuringiensis", "Monitorear el corazón de la planta"];
    remedies = [{ name: "Infusión de Ajo", ingredients: ["Ajo", "Alcohol"], instructions: "Repelente natural contra larvas y orugas." }];
  }

  return {
    diagnosis: {
      isProblemDetected: true,
      identifiedProblem: problem,
      severity: "Medium",
      confidence: "Medium",
      recommendedActions: actions,
      commercialProducts: [{ name: "Consulta en Agro-Tienda Local", description: "Muestra esta foto a un experto físico.", localStores: "Actopan/Pachuca" }],
      homeMadeRemedies: remedies,
      additionalNotes: "Diagnóstico generado por el Sistema Local (IA en mantenimiento).",
      isFallback: true
    }
  };
}

export async function diagnoseCropDisease(input: CropDiagnosisInput): Promise<CropDiagnosisOutput> {
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Intentamos con las 3 instancias de IA
  for (let i = 0; i < aiInstances.length; i++) {
    try {
      const ai = aiInstances[i];
      const prompt = ai.definePrompt({
        name: `cropDiagnosisPrompt_final_${i}`,
        input: {schema: CropDiagnosisInputSchema},
        output: {schema: CropDiagnosisOutputSchema},
        prompt: `Eres un experto fitopatólogo en Hidalgo. Analiza y diagnostica:
        Descripción: {{{description}}}
        Imagen: {{media url=photoDataUri}}`,
      });

      const {output} = await prompt(input);
      if (output) return { ...output, diagnosis: { ...output.diagnosis, isFallback: false } };
    } catch (e: any) {
      console.warn(`Llave ${i + 1} agotada, reintentando...`);
      if (i < aiInstances.length - 1) await sleep(2000); 
    }
  }

  // Si todo falla, usamos el experto local
  return getLocalDiagnosis(input.description);
}
