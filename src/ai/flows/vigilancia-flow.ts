'use server';

/**
 * @fileOverview Clasificación de lo que ve la cámara al detectarse movimiento.
 *
 * A diferencia del diagnóstico de cultivos —que asume una hoja enferma y busca
 * el patógeno—, aquí la pregunta es otra: ALGO se movió, ¿qué era? La respuesta
 * útil para el agricultor es de qué tipo se trata y si debe salir a mirar.
 *
 * ── Lo que este flujo NO hace ───────────────────────────────────────────────
 * NO identifica personas concretas ni distingue a un conocido de un extraño. Un
 * modelo de visión general puede decir "hay una persona"; para saber si esa
 * persona está autorizada haría falta reconocimiento facial contra un registro
 * de rostros, lo que es otra tecnología y tiene implicaciones legales de datos
 * personales. Por eso el resultado dice `persona`, nunca "intruso": afirmar lo
 * segundo sería una conclusión que el sistema no puede sostener.
 */

import { z } from 'genkit';
import { ai } from '@/ai/genkit';

const VigilanciaOutputSchema = z.object({
  tipo: z
    .enum(['plaga', 'animal', 'persona', 'vegetacion', 'nada'])
    .describe('Qué predomina en la escena.'),
  descripcion: z
    .string()
    .describe('Una frase corta y llana sobre lo que se ve, para el agricultor.'),
  requiereAtencion: z
    .boolean()
    .describe('true si conviene que el agricultor vaya a revisar.'),
  confianza: z
    .enum(['alta', 'media', 'baja'])
    .describe('Qué tan claro es lo que se observa en la imagen.'),
});

export type VigilanciaOutput = z.infer<typeof VigilanciaOutputSchema>;

export async function analizarVigilancia(photoDataUri: string): Promise<VigilanciaOutput> {
  const promptText = `Eres el sistema de vigilancia de una parcela agrícola en Tulancingo, Hidalgo.
El sensor de movimiento se activó y se capturó esta imagen. Di qué se observa.

Clasifica en "tipo":
- "plaga": insectos, gusanos, larvas u hongos visibles sobre las plantas.
- "animal": aves, roedores, perros, ganado u otra fauna.
- "persona": hay al menos una persona. NO intentes decir quién es ni si es
  conocida o desconocida: eso no se puede saber por la imagen.
- "vegetacion": sólo plantas, hojas o cultivo moviéndose (por ejemplo, viento).
- "nada": la escena está vacía, muy oscura o no se distingue nada.

En "descripcion" escribe UNA frase clara y sencilla, sin tecnicismos, como se la
dirías a un agricultor por radio.

"requiereAtencion" es true si hay una plaga, un animal que pueda dañar el
cultivo, o una persona. Es false para vegetación, escena vacía o imagen ilegible.

Sé honesto en "confianza": si la imagen está oscura, borrosa o dudosa, pon "baja"
y dilo en la descripción. Es preferible admitir la duda a inventar una certeza.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: [
      { text: promptText },
      {
        media: {
          url: photoDataUri,
          contentType: photoDataUri.match(/^data:([^;]+);base64,/)?.[1] || 'image/jpeg',
        },
      },
    ],
    output: { schema: VigilanciaOutputSchema },
  });

  if (!output) {
    throw new Error('El análisis de vigilancia no devolvió un resultado.');
  }

  return output;
}
