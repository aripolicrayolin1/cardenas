'use server';
/**
 * @fileOverview Flujo de IA para Alertas Predictivas de Plagas y Enfermedades.
 * 
 * ATENCIÓN: La llamada real a la IA está temporalmente desactivada debido a un problema de
 * configuración de la API Key en Google Cloud. Se utiliza la simulación local en su lugar.
 * Para reactivar, elimina la línea de importación de la simulación y el bloque de 
 * 'SIMULACIÓN LOCAL' y descomenta el bloque 'CÓDIGO REAL'.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getSimulatedAlert } from '@/lib/ai-simulation'; // Importar la simulación local

const PredictiveAlertsOutputSchema = z.object({
  alert: z.object({
    titulo: z.string().describe('Un título llamativo y corto para la alerta (ej. "RIESGO DE ROYA").'),
    otomi: z.string().describe('El mismo título, traducido al idioma Otomí del Valle del Mezquital.'),
    desc: z.string().describe('Una explicación detallada (2-3 frases) de la condición detectada y por qué es un riesgo.'),
    accion: z.string().describe('Una recomendación clara y accionable para el agricultor.'),
    riesgo: z.enum(['Low', 'Medium', 'High']).describe('El nivel de riesgo cuantificado.'),
  }),
});

export type PredictiveAlertsInput = {
  temperatura: number;
  humedad: number;
  humedadSuelo: number;
  evapotranspiracion: number;
};

export type PredictiveAlertsOutput = {
  alert: z.infer<typeof PredictiveAlertsOutputSchema>['alert'];
};

export async function predictivePestDiseaseAlerts(input: PredictiveAlertsInput): Promise<PredictiveAlertsOutput> {

  // ===================== SIMULACIÓN LOCAL =====================
  // Se utiliza la lógica de simulación del archivo ai-simulation.ts.
  console.warn('Respuesta de alerta predictiva SIMULADA. Verifica la configuración de tu API Key.');
  const simulatedAlert = getSimulatedAlert(input.temperatura, input.humedad, input.humedadSuelo, input.evapotranspiracion);
  return { alert: simulatedAlert };
  // ============================================================

  /*
  // ======================== CÓDIGO REAL ========================
  // Descomenta este bloque y elimina la simulación de arriba cuando la API Key funcione.
  const prompt = `
    Eres el Agente de Alertas Predictivas de AgroTech Hidalgo, un experto en agronomía y meteorología.
    Tu misión es analizar los datos de sensores en tiempo real para predecir riesgos de plagas y enfermedades en cultivos de maíz y frijol en la región de Hidalgo, México.
    Proporciona una alerta clara, concisa y culturalmente relevante, incluyendo una traducción al Otomí del Valle del Mezquital.

    DATOS DE SENSORES:
    - Temperatura: ${input.temperatura}°C
    - Humedad Relativa: ${input.humedad}%
    - Humedad del Suelo (escala de 0 a 1024): ${input.humedadSuelo}
    - Evapotranspiración (ET, mm/día): ${input.evapotranspiracion}

    Considera las siguientes condiciones para generar la alerta más crítica que aplique:
    - Roya (Puccinia sorghi): requiere alta humedad (>85%) y temperaturas entre 16-24°C.
    - Gusano Cogollero (Spodoptera frugiperda): su actividad aumenta con temperaturas >25°C y baja humedad.
    - Estrés Hídrico: ocurre cuando la ET es alta y la humedad del suelo es baja.
    - Tizón Común (Exserohilum turcicum): prolifera con humedad >90% y noches frescas.

    Analiza los datos y genera la alerta más relevante. Si no hay un riesgo claro, genera una alerta de 'Condiciones Normales'.
  `;

  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    prompt,
    output: { schema: PredictiveAlertsOutputSchema, format: 'json' },
  });

  if (!output || !output.alert) {
    throw new Error('La IA Predictiva no pudo generar una alerta.');
  }

  return { alert: output.alert };
  // =============================================================
  */
}
