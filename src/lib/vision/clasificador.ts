import { buscarPlaga, type Plaga } from '@/lib/plagas';
import { CLASES_MODELO, METRICAS_MODELO, type ClaseModelo } from './clases';

/**
 * @fileOverview Clasificador de imagenes que corre EN EL NAVEGADOR.
 *
 * Carga el modelo exportado desde Colab con TensorFlow.js y clasifica una foto
 * sin enviarla a ningún servidor. Dos consecuencias que importan en campo:
 * funciona sin cobertura una vez descargado el modelo, y la foto de la parcela
 * nunca sale del dispositivo.
 *
 * ── Estrategia de migración ─────────────────────────────────────────────────
 * Mientras `clases.ts` esté vacío —es decir, mientras no se haya entrenado el
 * modelo— `modeloDisponible()` devuelve `false` y quien consuma este módulo
 * debe seguir usando Gemini. En cuanto se copien los artefactos del notebook,
 * el clasificador local toma el relevo sin tocar más código.
 *
 * ── Sobre la confianza ──────────────────────────────────────────────────────
 * Una red de clasificación SIEMPRE devuelve una respuesta: ante una plaga que
 * nunca vio, elige la clase más parecida y puede hacerlo con confianza alta.
 * Por eso existe `UMBRAL_CONFIANZA`: por debajo de él el resultado se marca
 * como incierto y la interfaz debe decir "no estoy seguro" en lugar de afirmar.
 * La celda 13 del notebook imprime la tabla de umbral contra acierto para
 * ajustar este número con datos y no a ojo.
 */

/** Ruta pública del modelo. La escribe el notebook en `public/modelo/`. */
const RUTA_MODELO = '/modelo/model.json';

/** Tamaño de entrada de MobileNetV3. Debe coincidir con `TAM` del notebook. */
const TAM_ENTRADA = 224;

/**
 * Por debajo de esta probabilidad el resultado se considera incierto.
 * Ajústalo con la tabla que imprime la celda 13 del notebook.
 */
export const UMBRAL_CONFIANZA = 0.6;

export interface Prediccion {
  clase: ClaseModelo;
  /** Probabilidad devuelta por la softmax, 0 a 1. */
  confianza: number;
  /** Ficha del catálogo, si esta clase está enlazada. */
  ficha?: Plaga;
}

export interface ResultadoClasificacion {
  /** Predicciones ordenadas de mayor a menor confianza. */
  predicciones: Prediccion[];
  /** La más probable. */
  principal: Prediccion;
  /** `false` cuando la confianza no alcanza el umbral: no afirmes nada. */
  confiable: boolean;
  /** Milisegundos que tardó la inferencia. */
  duracionMs: number;
}

/** `true` cuando hay un modelo entrenado disponible. */
export function modeloDisponible(): boolean {
  return CLASES_MODELO.length > 0;
}

export function metricasModelo() {
  return METRICAS_MODELO;
}

// =============================================================================
// Carga perezosa del modelo
// =============================================================================

// TensorFlow.js pesa bastante y sólo hace falta en la pantalla de diagnóstico.
// Se importa de forma dinámica para no cargarlo en el resto de la aplicación.
type ModeloTf = import('@tensorflow/tfjs').LayersModel;

let modeloCargado: ModeloTf | null = null;
let cargaEnCurso: Promise<ModeloTf> | null = null;

/**
 * Carga el modelo una sola vez. Las llamadas concurrentes comparten la misma
 * promesa: sin esto, dos componentes montándose a la vez lo descargarían dos
 * veces.
 */
export async function cargarModelo(
  alProgresar?: (fraccion: number) => void
): Promise<ModeloTf> {
  if (modeloCargado) return modeloCargado;
  if (cargaEnCurso) return cargaEnCurso;

  if (!modeloDisponible()) {
    throw new Error(
      'No hay modelo entrenado. Ejecuta notebooks/entrenar_clasificador.ipynb en ' +
        'Colab y copia los artefactos a public/modelo/ y src/lib/vision/clases.ts.'
    );
  }

  cargaEnCurso = (async () => {
    const tf = await import('@tensorflow/tfjs');

    const modelo = await tf.loadLayersModel(RUTA_MODELO, {
      onProgress: alProgresar,
    });

    // Primera inferencia con un tensor vacío para forzar la compilación de los
    // kernels de WebGL. Sin esto, la primera foto del usuario tarda visiblemente
    // más que las siguientes y parece que la app se trabó.
    const calentamiento = tf.zeros([1, TAM_ENTRADA, TAM_ENTRADA, 3]);
    const salida = modelo.predict(calentamiento) as import('@tensorflow/tfjs').Tensor;
    salida.dispose();
    calentamiento.dispose();

    modeloCargado = modelo;
    return modelo;
  })();

  try {
    return await cargaEnCurso;
  } finally {
    cargaEnCurso = null;
  }
}

/** Libera la memoria de GPU del modelo. */
export function descargarModelo(): void {
  modeloCargado?.dispose();
  modeloCargado = null;
}

// =============================================================================
// Inferencia
// =============================================================================

/**
 * Clasifica una imagen.
 *
 * `fuente` puede ser un elemento de imagen ya cargado o un data URI. El modelo
 * incluye su propio preprocesamiento (`include_preprocessing=True` en el
 * notebook), así que aquí sólo hace falta redimensionar a 224×224 y añadir la
 * dimensión de lote: NO hay que normalizar a 0-1, eso lo hace la red.
 */
export async function clasificarImagen(
  fuente: HTMLImageElement | HTMLCanvasElement | string,
  opciones: { maxResultados?: number } = {}
): Promise<ResultadoClasificacion> {
  const maxResultados = opciones.maxResultados ?? 3;

  const tf = await import('@tensorflow/tfjs');
  const modelo = await cargarModelo();

  const elemento = typeof fuente === 'string' ? await cargarImagen(fuente) : fuente;

  const inicio = performance.now();

  // `tidy` libera los tensores intermedios al salir. Sin él, cada foto deja
  // basura en la memoria de la GPU y el navegador acaba cayéndose.
  const probabilidades = tf.tidy(() => {
    const tensor = tf.browser
      .fromPixels(elemento)
      .resizeBilinear([TAM_ENTRADA, TAM_ENTRADA])
      .toFloat()
      .expandDims(0);

    return modelo.predict(tensor) as import('@tensorflow/tfjs').Tensor;
  });

  const valores = Array.from(await probabilidades.data());
  probabilidades.dispose();

  const duracionMs = performance.now() - inicio;

  const predicciones: Prediccion[] = valores
    .map((confianza, indice) => ({ confianza, indice }))
    .sort((a, b) => b.confianza - a.confianza)
    .slice(0, maxResultados)
    .map(({ confianza, indice }) => {
      const clase = CLASES_MODELO[indice];
      return {
        clase,
        confianza,
        ficha: clase?.plagaId ? buscarPlaga(clase.plagaId) : undefined,
      };
    })
    .filter((p) => p.clase !== undefined);

  if (predicciones.length === 0) {
    throw new Error(
      'El modelo devolvió un índice fuera del catálogo de clases. ' +
        'Es señal de que public/modelo/ y src/lib/vision/clases.ts no vienen del ' +
        'mismo entrenamiento: vuelve a copiar ambos del mismo modelo_web.zip.'
    );
  }

  return {
    predicciones,
    principal: predicciones[0],
    confiable: predicciones[0].confianza >= UMBRAL_CONFIANZA,
    duracionMs,
  };
}

/** Convierte un data URI en un elemento de imagen ya cargado. */
function cargarImagen(dataUri: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolver(img);
    img.onerror = () => rechazar(new Error('No se pudo leer la imagen.'));
    img.src = dataUri;
  });
}
