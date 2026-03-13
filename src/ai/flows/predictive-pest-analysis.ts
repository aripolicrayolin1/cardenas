'use server';
/**
 * @fileOverview Un agente de IA para el análisis predictivo de plagas.
 *
 * - analyzePestRisk - Función que maneja el proceso de análisis predictivo.
 * - PredictivePestAnalysisInput - Tipo de entrada para la función.
 * - PredictivePestAnalysisOutput - Tipo de salida para la función.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PredictivePestAnalysisInputSchema = z.object({
  humidity: z.number().describe('Nivel de humedad actual en porcentaje (0-100).'),
  temperature: z.number().describe('Temperatura actual en grados Celsius.'),
  dewPoint: z.number().describe('Punto de rocío actual en grados Celsius.'),
  evapotranspiration: z.number().describe('Tasa de evapotranspiración actual en mm/día.'),
});
export type PredictivePestAnalysisInput = z.infer<typeof PredictivePestAnalysisInputSchema>;

const PestTypeSchema = z.object({
  name: z.string().describe('Nombre común de la plaga potencial (ej. "Pulgones", "Araña Roja").'),
  riskLevel: z.enum(['bajo', 'medio', 'alto']).describe('El nivel de riesgo para esta plaga específica.'),
  description: z.string().describe('Una breve descripción de la plaga y por qué podría aparecer bajo las condiciones actuales.'),
});

const RecommendationSchema = z.object({
  type: z.enum(['insecticida', 'tratamiento_suelo', 'preventivo']).describe('El tipo de recomendación (insecticida, tratamiento_suelo o preventivo).'),
  details: z.string().describe('Recomendación técnica detallada (ej. nombre específico del insecticida, método de aplicación, técnica de tratamiento del suelo).'),
  rationale: z.string().describe('La razón de esta recomendación basada en los datos de los sensores y las plagas potenciales.'),
});

const PredictivePestAnalysisOutputSchema = z.object({
  pestSuitability: z.object({
    isSuitable: z.boolean().describe('Verdadero si el entorno es actualmente adecuado para el desarrollo de plagas, falso de lo contrario.'),
    overallRisk: z.enum(['bajo', 'medio', 'alto', 'muy_alto']).describe('Evaluación de riesgo general de infestación de plagas según las condiciones actuales.'),
    summary: z.string().describe('Un resumen que explica la idoneidad actual para las plagas.'),
  }),
  potentialPests: z.array(PestTypeSchema).describe('Un conjunto de posibles tipos de plagas que podrían aparecer bajo las condiciones actuales.'),
  recommendations: z.array(RecommendationSchema).describe('Recomendaciones técnicas para insecticidas y tratamientos de tierras.'),
});
export type PredictivePestAnalysisOutput = z.infer<typeof PredictivePestAnalysisOutputSchema>;

export async function analyzePestRisk(input: PredictivePestAnalysisInput): Promise<PredictivePestAnalysisOutput> {
  return predictivePestAnalysisFlow(input);
}

const predictivePestAnalysisPrompt = ai.definePrompt({
  name: 'predictivePestAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: PredictivePestAnalysisInputSchema },
  output: { schema: PredictivePestAnalysisOutputSchema },
  prompt: `Eres un experto asistente agrícola de IA especializado en predicción de plagas y protección de cultivos. Tu tarea es analizar datos de sensores y proporcionar información detallada y recomendaciones a los agricultores.

Analiza los siguientes datos de sensores para determinar la idoneidad de las plagas, identificar tipos de plagas potenciales y proporcionar recomendaciones técnicas para insecticidas y tratamiento de tierras.

Datos de los Sensores:
- Humedad: {{{humidity}}}%
- Temperatura: {{{temperature}}}°C
- Punto de Rocío: {{{dewPoint}}}°C
- Evapotranspiración: {{{evapotranspiration}}} mm/día

Basándote en estos datos, proporciona lo siguiente:
1.  **Idoneidad de Plagas**: Determina si el entorno es actualmente adecuado para el desarrollo de plagas. Proporciona un nivel de riesgo general (bajo, medio, alto, muy_alto) y un resumen explicativo.
2.  **Plagas Potenciales**: Identifica tipos específicos de plagas que probablemente prosperen o aparezcan en estas condiciones. Para cada plaga, indica su nombre común, un nivel de riesgo (bajo, medio, alto) y una breve descripción.
3.  **Recomendaciones**: Ofrece recomendaciones técnicas concretas que incluyan insecticidas específicos (si corresponde) y métodos de tratamiento de tierras. Para cada recomendación, indica su tipo (insecticida, tratamiento_suelo, preventivo), instrucciones detalladas y su justificación técnica.

Considera las plagas agrícolas comunes en el estado de Hidalgo, México, para tu análisis y recomendaciones. Responde siempre en español.`,
});

const predictivePestAnalysisFlow = ai.defineFlow(
  {
    name: 'predictivePestAnalysisFlow',
    inputSchema: PredictivePestAnalysisInputSchema,
    outputSchema: PredictivePestAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await predictivePestAnalysisPrompt(input);
    return output!;
  }
);
