/**
 * @fileOverview Clases del clasificador de imagenes. GENERADO AUTOMATICAMENTE.
 *
 * ⚠️ ESTE ES UN MARCADOR DE POSICION. Todavía no hay modelo entrenado.
 *
 * Ejecuta `notebooks/entrenar_clasificador.ipynb` en Google Colab. Su última
 * celda descarga un `modelo_web.zip` que contiene la versión real de este
 * archivo; al copiarla encima, la lista deja de estar vacía y la app empieza a
 * usar el clasificador local en lugar de Gemini.
 *
 * Mientras `CLASES_MODELO` esté vacío, `modeloDisponible()` devuelve `false` y
 * el diagnóstico por foto sigue funcionando contra Gemini. No se rompe nada: es
 * una migración progresiva.
 */

export interface ClaseModelo {
  indice: number;
  /** Nombre de la carpeta original del dataset. */
  clase: string;
  /** Texto que se muestra al agricultor. */
  etiqueta: string;
  origen: 'plantvillage' | 'ip102';
  /** id de src/lib/plagas/catalogo.ts, si esta clase tiene ficha. */
  plagaId?: string;
}

/** Metricas del modelo entrenado, para mostrarlas en la interfaz. */
export const METRICAS_MODELO = {
  global: 0,
  plantvillage: 0,
  ip102: 0,
  totalClases: 0,
} as const;

export const CLASES_MODELO: readonly ClaseModelo[] = [];

/** Busca una clase por su indice de salida del modelo. */
export function claseporIndice(indice: number): ClaseModelo | undefined {
  return CLASES_MODELO[indice];
}
