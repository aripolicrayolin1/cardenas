'use server';
/**
 * @fileOverview Agente de IA para el análisis predictivo de plagas en Hidalgo.
 * Analiza variables climatológicas IoT para predecir brotes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PredictivePestAnalysisInputSchema = z.object({
  humidity: z.number().describe('Nivel de humedad actual en porcentaje (0-100).'),
  temperature: z.number().describe('Temperatura actual en grados Celsius.'),
  dewPoint: z.number().describe('Punto de rocío actual en grados Celsius.'),
  evapotranspiration: z.number().describe('Tasa de evapotranspiración actual en mm/día.'),
});

const PestTypeSchema = z.object({
  name: z.string().describe('Nombre común de la plaga potencial.'),
  riskLevel: z.enum(['bajo', 'medio', 'alto']).describe('Nivel de riesgo específico.'),
  description: z.string().describe('Razón de la posible aparición.'),
});

const RecommendationSchema = z.object({
  type: z.enum(['insecticida', 'tratamiento_suelo', 'preventivo']).describe('Categoría de acción.'),
  details: z.string().describe('Instrucciones técnicas.'),
  rationale: z.string().describe('Justificación basada en datos.'),
});

const PredictivePestAnalysisOutputSchema = z.object({
  pestSuitability: z.object({
    isSuitable: z.boolean().describe('Idoneidad del entorno para plagas.'),
    overallRisk: z.enum(['bajo', 'medio', 'alto', 'muy_alto']).describe('Evaluación de riesgo general.'),
    summary: z.string().describe('Resumen explicativo del veredicto.'),
  }),
  potentialPests: z.array(PestTypeSchema).describe('Lista de plagas probables.'),
  recommendations: z.array(RecommendationSchema).describe('Acciones técnicas sugeridas.'),
});

export type PredictivePestAnalysisInput = z.infer<typeof PredictivePestAnalysisInputSchema>;
export type PredictivePestAnalysisOutput = z.infer<typeof PredictivePestAnalysisOutputSchema>;

export async function analyzePestRisk(input: PredictivePestAnalysisInput): Promise<PredictivePestAnalysisOutput> {
  return predictivePestAnalysisFlow(input);
}

const predictivePestAnalysisPrompt = ai.definePrompt({
  name: 'predictivePestAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: PredictivePestAnalysisInputSchema },
  output: { 
    schema: PredictivePestAnalysisOutputSchema,
    // Eliminamos format: 'json' para evitar el error de responseMimeType en v1
  },
  prompt: `Eres un experto asistente agrícola de IA especializado en predicción de plagas y protección de cultivos en Hidalgo, México.
  
  Analiza estos datos de sensores IoT:
  - Humedad: {{humidity}}%
  - Temperatura: {{temperature}}°C
  - Punto de Rocío: {{dewPoint}}°C
  - Evapotranspiración: {{evapotranspiration}} mm/día

  Basándote en estos datos, determina el riesgo de plagas (como Pulgones, Araña Roja o Gusano Cogollero) y proporciona recomendaciones técnicas específicas. 
  Responde estrictamente en formato JSON siguiendo el esquema proporcionado.`,
});

const predictivePestAnalysisFlow = ai.defineFlow(
  {
    name: 'predictivePestAnalysisFlow',
    inputSchema: PredictivePestAnalysisInputSchema,
    outputSchema: PredictivePestAnalysisOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await predictivePestAnalysisPrompt(input);
      if (!output) throw new Error('No se recibió respuesta estructurada de la IA.');
      return output;
    } catch (error: any) {
      console.error("Error en flujo predictivo:", error);
      throw new Error(`Falla en análisis predictivo: ${error.message}`);
    }
  }
);
