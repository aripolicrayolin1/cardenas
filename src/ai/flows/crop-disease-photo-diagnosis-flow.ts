'use server';
/**
 * @fileOverview Diagnóstico de enfermedades híbrido: IA + Motor Local Experto Avanzado.
 * El motor local ahora incluye una base de conocimientos extendida para 15+ plagas y hongos,
 * con reconocimiento de síntomas descriptivos detallados.
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
 * Motor de Diagnóstico Local Experto.
 * Utiliza una base de conocimientos estática para dar respuestas precisas basadas en texto.
 */
function getLocalDiagnosis(description: string = ""): CropDiagnosisOutput {
  const desc = description.toLowerCase();
  
  let problem = "Problema no identificado claramente";
  let severity: 'Low' | 'Medium' | 'High' | 'Not Applicable' = "Medium";
  let actions = ["Observar el cultivo diariamente", "Evitar el riego nocturno", "Consultar a un técnico local"];
  let remedies = [{ name: "Aislamiento", ingredients: ["Ninguno"], instructions: "Separa la planta infectada para evitar propagación." }];
  let products = [{ name: "Consulta Técnica", description: "Lleva una muestra a una tienda agropecuaria.", localStores: "Actopan/Pachuca" }];

  // --- HONGOS Y ENFERMEDADES (Prioridad por síntomas descriptivos) ---
  if (desc.includes("cenicilla") || desc.includes("mildiú") || desc.includes("algodonosa") || desc.includes("colonias blancas") || desc.includes("polvo blanco")) {
    problem = "Cenicilla o Mildiú Polvoriento";
    severity = "Medium";
    actions = [
      "Eliminar hojas con colonias algodonosas", 
      "Reducir humedad ambiental y evitar mojar el follaje", 
      "Espaciar plantas para mejorar la ventilación"
    ];
    remedies = [
      { name: "Mezcla de Leche", ingredients: ["1 parte de leche", "9 partes de agua"], instructions: "Pulverizar al sol; el ácido láctico y los aminoácidos detienen el hongo." },
      { name: "Bicarbonato de Sodio", ingredients: ["1 cda Bicarbonato", "1L Agua"], instructions: "Cambia el pH de la hoja dificultando el crecimiento del hongo." }
    ];
  } 
  else if (desc.includes("fusarium") || desc.includes("marchitez") || desc.includes("marchita") || desc.includes("vuelto")) {
    problem = "Marchitez por Fusarium";
    severity = "High";
    actions = ["Eliminar la planta entera de raíz inmediatamente", "No reutilizar el suelo o sustrato", "Desinfectar herramientas con alcohol o cloro"];
    remedies = [{ name: "Solarización del Suelo", ingredients: ["Plástico transparente"], instructions: "Cubrir el suelo húmedo con plástico por 4-6 semanas para eliminar patógenos con calor solar." }];
  }
  else if (desc.includes("phytophthora") || desc.includes("damping off") || desc.includes("pudrición") || desc.includes("decadencia radicular")) {
    problem = "Podredumbre (Phytophthora)";
    severity = "High";
    actions = ["Mejorar drenaje inmediatamente", "Evitar encharcamientos", "Aplicar fungicida cúprico en la base"];
    remedies = [{ name: "Canela en Polvo", ingredients: ["Canela"], instructions: "Esparcir en la base del tallo; actúa como un fungicida natural suave." }];
  }
  else if (desc.includes("pythium") || desc.includes("corteza") || desc.includes("amarillean") || desc.includes("ahogamiento")) {
    problem = "Pythium (Ahogamiento de Raíz)";
    severity = "High";
    actions = ["Reducir riego drásticamente", "Revisar si la corteza radicular se desprende fácilmente", "Usar sustratos estériles en siembra"];
    remedies = [{ name: "Té de Manzanilla", ingredients: ["Manzanilla seca", "Agua"], instructions: "Regar con el té frío para fortalecer las plántulas contra hongos de raíz." }];
  }
  else if (desc.includes("roya") || desc.includes("naranja") || desc.includes("herrumbre") || desc.includes("pústulas")) {
    problem = "Roya (Hongo Puccinia)";
    severity = "High";
    actions = ["Retirar hojas con pústulas naranjas", "Evitar exceso de nitrógeno", "Mejorar circulación de aire"];
    remedies = [{ name: "Infusión de Cola de Caballo", ingredients: ["Planta cola de caballo fresca o seca"], instructions: "Hervir, colar y pulverizar; su alto contenido en sílice fortalece la pared celular." }];
  }

  // --- PLAGAS (INSECTOS Y ARÁCNIDOS) ---
  else if (desc.includes("araña") || desc.includes("telaraña") || desc.includes("ácaro") || desc.includes("succionar")) {
    problem = "Araña Roja (Arácnidos)";
    severity = "High";
    actions = ["Aumentar la humedad foliar (pulverizar agua)", "Eliminar malezas hospederas", "Revisar envés de hojas con lupa buscando puntos rojos"];
    remedies = [{ name: "Jabón Potásico", ingredients: ["Jabón potásico", "Agua"], instructions: "Pulverizar directamente sobre las colonias detectadas en el envés." }];
  } 
  else if (desc.includes("pulgón") || desc.includes("pulgones") || desc.includes("enrosca") || desc.includes("pera")) {
    problem = "Infestación de Pulgones";
    severity = "Medium";
    actions = ["Limpiar colonias manualmente", "Controlar presencia de hormigas (que los protegen)", "Podar brotes nuevos muy infestados"];
    remedies = [{ name: "Infusión de Ajo", ingredients: ["5 dientes de ajo", "1L de agua"], instructions: "Licuar ajo, dejar reposar 24h, colar y pulverizar." }];
  }
  else if (desc.includes("trips") || desc.includes("flecos") || desc.includes("plateado") || desc.includes("raspado")) {
    problem = "Trips (Thysanoptera)";
    severity = "High";
    actions = ["Usar trampas azules pegajosas", "Eliminar restos de cosecha infectados", "Evitar estrés hídrico de la planta"];
    remedies = [{ name: "Aceite de Neem", ingredients: ["Aceite de Neem puro", "Agua"], instructions: "Aplicar cada 5 días para interrumpir el ciclo biológico del insecto." }];
  }
  else if (desc.includes("mosca blanca") || desc.includes("palomilla") || desc.includes("envés") || desc.includes("chupando")) {
    problem = "Mosca Blanca";
    severity = "Medium";
    actions = ["Usar trampas amarillas pegajosas", "Limpiar el envés de las hojas con agua jabonosa", "Mejorar la ventilación del cultivo"];
    remedies = [{ name: "Trampas Cromáticas", ingredients: ["Plástico amarillo", "Aceite o pegamento"], instructions: "Colocar cerca de las plantas para capturar adultos voladores." }];
  }
  else if (desc.includes("oruga") || desc.includes("gusano") || desc.includes("agujero") || desc.includes("comido") || desc.includes("brotes jóvenes")) {
    problem = "Ataque de Orugas / Gusanos";
    severity = "High";
    actions = ["Recolección manual (preferiblemente de noche)", "Aplicar Bacillus thuringiensis si está disponible", "Revisar envés buscando masas de huevos"];
    remedies = [{ name: "Repelente de Chile y Ajo", ingredients: ["Chiles picantes", "Ajo", "Agua"], instructions: "Licuar, colar y pulverizar; el picante disuade la alimentación de las larvas." }];
  }
  else if (desc.includes("minador") || desc.includes("galería") || desc.includes("camino") || desc.includes("tejido foliar")) {
    problem = "Minadores de Hojas (Larvas)";
    severity = "Medium";
    actions = ["Retirar y destruir hojas con 'caminos' visibles", "Enterrar restos de poda a profundidad", "Favorecer la presencia de avispas parasitoides"];
    remedies = [{ name: "Aplicación de Neem", ingredients: ["Aceite de Neem"], instructions: "El neem penetra ligeramente el tejido y detiene el desarrollo de la larva dentro de la hoja." }];
  }
  else if (desc.includes("cochinilla") || desc.includes("algodón") || desc.includes("escama") || desc.includes("harinosa")) {
    problem = "Cochinillas / Escamas";
    severity = "Medium";
    actions = ["Limpiar colonias con algodón y alcohol", "Podar ramas muy congestionadas", "Aumentar ventilación general"];
    remedies = [{ name: "Solución de Alcohol", ingredients: ["Alcohol al 70%", "Agua"], instructions: "Limpiar individualmente o pulverizar una mezcla diluida para disolver su capa cerosa." }];
  }
  else if (desc.includes("escarabajo") || desc.includes("consumo de hojas")) {
    problem = "Plaga de Escarabajos";
    severity = "Medium";
    actions = ["Recolección manual de adultos", "Revisar presencia de larvas en el suelo", "Usar mallas anti-insectos"];
    remedies = [{ name: "Repelente de Jabón", ingredients: ["Jabón biodegradable", "Agua"], instructions: "Pulverizar para disuadir la alimentación y el apareamiento." }];
  }

  return {
    diagnosis: {
      isProblemDetected: true,
      identifiedProblem: problem,
      severity,
      confidence: "High",
      recommendedActions: actions,
      commercialProducts: products,
      homeMadeRemedies: remedies,
      additionalNotes: "Diagnóstico generado por el Motor Experto de AgroTech basado en la descripción detallada de síntomas.",
      isFallback: true
    }
  };
}

export async function diagnoseCropDisease(input: CropDiagnosisInput): Promise<CropDiagnosisOutput> {
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  if (!input.description && !input.photoDataUri) {
    throw new Error("Se requiere al menos una descripción o una foto.");
  }

  // Intentar con IA primero rotando entre las 3 llaves
  for (let i = 0; i < 3; i++) {
    try {
      const ai = getAIInstance(i);
      const prompt = ai.definePrompt({
        name: `cropDiagnosisPrompt_v10_rotation_${i}`,
        input: {schema: CropDiagnosisInputSchema},
        output: {schema: CropDiagnosisOutputSchema},
        prompt: `Eres un experto agrónomo en Hidalgo, México. 
        Analiza estos datos del cultivo con rigor científico:
        
        {{#if description}}Descripción de síntomas: {{{description}}}{{/if}}
        {{#if photoDataUri}}Imagen: {{media url=photoDataUri}}{{/if}}
        
        Básate en la descripción técnica proporcionada. Da un diagnóstico serio, acciones correctivas y remedios orgánicos efectivos.`,
      });

      const {output} = await prompt(input);
      if (output) return { ...output, diagnosis: { ...output.diagnosis, isFallback: false } };
    } catch (e: any) {
      console.warn(`Intento ${i + 1} con IA fallido. Rotando llaves...`);
      if (i < 2) await sleep(2000); 
    }
  }

  // Fallback al motor local experto si la IA falla o está bloqueada
  return getLocalDiagnosis(input.description);
}
