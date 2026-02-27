'use server';
/**
 * @fileOverview Diagnóstico de enfermedades híbrido: IA + Lógica Local de Respaldo Avanzada.
 * Ahora soporta diagnósticos basados solo en descripción si la imagen no está disponible.
 */

import {getAIInstance} from '@/ai/genkit';
import {z} from 'genkit';

const CropDiagnosisInputSchema = z.object({
  photoDataUri: z.string().optional().describe("A photo of a crop as a data URI (Optional)."),
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
 * Lógica de diagnóstico local (Experto de Respaldo Avanzado)
 * Clasifica mejor según palabras clave para evitar el "siempre lo mismo".
 */
function getLocalDiagnosis(description: string = ""): CropDiagnosisOutput {
  const desc = description.toLowerCase();
  
  let problem = "Problema no identificado (Se requiere más detalle)";
  let actions = ["Observar el cultivo diariamente", "Evitar el riego nocturno"];
  let remedies = [{ name: "Aislamiento", ingredients: ["Ninguno"], instructions: "Separa la planta infectada." }];
  let products = [{ name: "Consulta en Agropecuaria", description: "Muestra esta descripción a un experto.", localStores: "Actopan/Pachuca" }];
  let severity: 'Low' | 'Medium' | 'High' | 'Not Applicable' = "Medium";

  // Lógica de palabras clave específica
  if (desc.includes("gusano") || desc.includes("comido") || desc.includes("agujero") || desc.includes("larva")) {
    problem = "Infestación de Gusano (posible Cogollero)";
    severity = "High";
    actions = ["Retirar gusanos manualmente", "Aplicar Bacillus thuringiensis", "Revisar el corazón de la planta"];
    remedies = [{ name: "Infusión de Ajo y Chile", ingredients: ["Ajo", "Chile picante", "Agua"], instructions: "Licuar, colar y pulverizar como repelente fuerte." }];
  } else if (desc.includes("roya") || desc.includes("naranja") || desc.includes("polvo cafe") || desc.includes("herrumbre")) {
    problem = "Roya (Hongo Puccinia)";
    severity = "High";
    actions = ["Eliminar hojas con pústulas naranjas", "Mejorar drenaje", "Evitar exceso de nitrógeno"];
    remedies = [{ name: "Cola de Caballo", ingredients: ["Planta cola de caballo", "Agua"], instructions: "Hervir y aplicar cada 3 días para secar el hongo." }];
  } else if (desc.includes("ceniza") || desc.includes("polvo blanco") || desc.includes("oidio") || desc.includes("blanquecino")) {
    problem = "Oidio (Cenicilla)";
    severity = "Medium";
    actions = ["Aumentar la exposición solar", "Podar zonas densas para ventilar", "Evitar mojar las hojas"];
    remedies = [{ name: "Mezcla de Leche", ingredients: ["Leche descremada", "Agua"], instructions: "Mezcla 1 parte de leche por 9 de agua. Pulverizar al sol." }];
  } else if (desc.includes("mosca") || desc.includes("blanca") || desc.includes("bichito") || desc.includes("palomilla")) {
    problem = "Plaga de Mosca Blanca";
    severity = "Medium";
    actions = ["Usar trampas amarillas con pegamento", "Limpiar el envés de las hojas", "Aplicar aceite de Neem"];
    remedies = [{ name: "Jabón Potásico", ingredients: ["Jabón neutro", "Agua"], instructions: "Pulverizar en las tardes para asfixiar a los insectos." }];
  } else if (desc.includes("araña") || desc.includes("telaraña") || desc.includes("puntos rojos")) {
    problem = "Araña Roja (Ácaros)";
    severity = "Medium";
    actions = ["Aumentar la humedad foliar", "Eliminar malezas cercanas", "Aplicar azufre si el clima es fresco"];
    remedies = [{ name: "Humidificación", ingredients: ["Agua limpia"], instructions: "Pulverizar agua sola frecuentemente, la araña odia la humedad." }];
  } else if (desc.includes("mancha") || desc.includes("amarill") || desc.includes("seco") || desc.includes("cafe")) {
    problem = "Tizón Foliar o Deficiencia Nutricional";
    severity = "Medium";
    actions = ["Aplicar fungicida cúprico", "Revisar niveles de potasio", "Retirar material seco"];
    remedies = [{ name: "Té de Ortiga", ingredients: ["Ortiga fresca", "Agua"], instructions: "Fermentar por 5 días y usar como abono foliar fortificante." }];
  }

  return {
    diagnosis: {
      isProblemDetected: true,
      identifiedProblem: problem,
      severity,
      confidence: "Medium",
      recommendedActions: actions,
      commercialProducts: products,
      homeMadeRemedies: remedies,
      additionalNotes: "Diagnóstico generado por el Motor Local de AgroTech (IA fuera de línea).",
      isFallback: true
    }
  };
}

export async function diagnoseCropDisease(input: CropDiagnosisInput): Promise<CropDiagnosisOutput> {
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  // Solo intentamos IA si hay descripción O imagen
  if (!input.description && !input.photoDataUri) {
    throw new Error("Se requiere al menos una descripción o una foto.");
  }

  for (let i = 0; i < 3; i++) {
    try {
      const ai = getAIInstance(i);
      const prompt = ai.definePrompt({
        name: `cropDiagnosisPrompt_v8_rotation_${i}`,
        input: {schema: CropDiagnosisInputSchema},
        output: {schema: CropDiagnosisOutputSchema},
        prompt: `Eres un experto fitopatólogo en la región de Hidalgo, México. 
        Analiza los siguientes datos del cultivo:
        
        {{#if description}}Descripción de síntomas: {{{description}}}{{/if}}
        {{#if photoDataUri}}Imagen del cultivo: {{media url=photoDataUri}}{{/if}}
        
        Proporciona un diagnóstico detallado, acciones inmediatas, productos comerciales comunes en México y remedios caseros orgánicos.`,
      });

      const {output} = await prompt(input);
      if (output) return { ...output, diagnosis: { ...output.diagnosis, isFallback: false } };
    } catch (e: any) {
      console.warn(`Intento ${i + 1} fallido por cuota o error. Rotando...`);
      if (i < 2) await sleep(2500); 
    }
  }

  // Fallback definitivo
  return getLocalDiagnosis(input.description);
}
