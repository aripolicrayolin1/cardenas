import type { CropDiagnosisProOutput } from '@/ai/flows/crop-disease-photo-diagnosis-flow';
import { clasificarImagen, modeloDisponible } from './clasificador';

/**
 * @fileOverview Puente entre el clasificador de imágenes local y la tarjeta de
 * diagnóstico que hoy alimenta Gemini.
 *
 * El clasificador devuelve una clase con su confianza y, si esa clase está
 * enlazada al catálogo, la ficha técnica de la plaga. Esta función traduce esa
 * ficha —escrita y revisada a mano— al mismo esquema `CropDiagnosisProOutput`
 * que produce el flujo de Gemini, de modo que la interfaz de `/diagnosis` no
 * necesita cambiar para mostrar un resultado local.
 *
 * Devuelve `null` cuando no hay modelo entrenado, cuando la confianza no alcanza
 * el umbral, o cuando la clase predicha no tiene ficha en el catálogo. En esos
 * casos el llamador debe recurrir a Gemini: el modelo local sólo responde de lo
 * que conoce con seguridad, y para lo demás dice "no sé" en vez de inventar.
 */
export async function clasificarComoDiagnostico(
  fuente: HTMLImageElement | HTMLCanvasElement | string
): Promise<CropDiagnosisProOutput | null> {
  if (!modeloDisponible()) return null;

  const resultado = await clasificarImagen(fuente);
  const { principal, confiable } = resultado;

  // Sin confianza suficiente o sin ficha, no se fuerza un veredicto: mejor que
  // Gemini lo intente a afirmar algo dudoso sobre el cultivo del agricultor.
  if (!confiable || !principal.ficha) return null;

  const ficha = principal.ficha;
  const pct = Math.round(principal.confianza * 100);

  return {
    diagnosis: {
      identifiedProblem: `${ficha.nombreComun} (${ficha.nombreCientifico})`,
      biologicalCycle: ficha.cicloBiologico,
      // La imagen sola no revela severidad; se reporta como media y se pide
      // confirmar en campo. La severidad real la da el conteo, no la foto.
      severity: 'Medium',
      controlStrategies: {
        mechanical: ficha.control.mecanico,
        biological: ficha.control.biologico,
        chemical: ficha.control.quimico,
      },
      preventionTips: ficha.prevencion,
      expertNotes:
        `Identificación por el modelo de visión local (${pct}% de confianza), sin conexión. ` +
        `Qué confirmar en campo: ${ficha.senalesEnCampo.join('; ')}. ` +
        `Este resultado es orientativo; ante la duda, consulta a un técnico. Fuente de la ficha: ${ficha.fuente}`,
    },
  };
}
