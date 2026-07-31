/**
 * @fileOverview Preparación de fotos antes de mandarlas a la IA.
 *
 * El diagnóstico envía la imagen como data URI en base64 dentro de una Server
 * Action. Next.js limita el cuerpo a 1 MB por defecto, y una foto de móvil
 * (4000×3000) pesa varios MB en base64: la acción fallaba precisamente en el
 * dispositivo del agricultor, que es el caso de uso principal.
 *
 * Reescalar en el cliente resuelve las dos mitades del problema: el envío entra
 * de sobra en el límite y se gasta muchísimos menos datos móviles. Para
 * identificar una plaga en una hoja, 1280 px de lado mayor son suficientes:
 * Gemini reduce internamente las imágenes de todos modos.
 */

/** Lado mayor al que se reescala la foto antes de enviarla. */
export const LADO_MAXIMO = 1280;

/** Calidad JPEG del reescalado. 0.82 es un buen punto entre nitidez y peso. */
export const CALIDAD_JPEG = 0.82;

/** Tamaño máximo aceptado del archivo de origen, antes de reescalar. */
export const TAMANO_MAXIMO_ORIGEN = 25 * 1024 * 1024;

export class ImagenInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'ImagenInvalidaError';
  }
}

/** Peso aproximado en bytes de un data URI base64. */
export function pesoAproximado(dataUri: string): number {
  const base64 = dataUri.slice(dataUri.indexOf(',') + 1);
  return Math.floor((base64.length * 3) / 4);
}

/**
 * Reescala un elemento ya cargado (imagen o vídeo) a un data URI JPEG.
 * Si ya cabe en {@link LADO_MAXIMO}, no lo amplía.
 */
function dibujarReescalado(
  fuente: CanvasImageSource,
  anchoOriginal: number,
  altoOriginal: number
): string {
  const escala = Math.min(1, LADO_MAXIMO / Math.max(anchoOriginal, altoOriginal));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(anchoOriginal * escala);
  canvas.height = Math.round(altoOriginal * escala);

  const contexto = canvas.getContext('2d');
  if (!contexto) {
    throw new ImagenInvalidaError('Tu navegador no pudo procesar la imagen.');
  }

  contexto.drawImage(fuente, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', CALIDAD_JPEG);
}

/** Captura el fotograma actual de un `<video>` ya reproduciéndose. */
export function capturarDeVideo(video: HTMLVideoElement): string {
  if (!video.videoWidth || !video.videoHeight) {
    throw new ImagenInvalidaError('La cámara todavía no está lista. Espera un momento.');
  }

  return dibujarReescalado(video, video.videoWidth, video.videoHeight);
}

/** Lee un archivo elegido por el usuario y devuelve un data URI ya reescalado. */
export async function prepararArchivo(archivo: File): Promise<string> {
  if (!archivo.type.startsWith('image/')) {
    throw new ImagenInvalidaError('Ese archivo no es una imagen. Elige una foto.');
  }

  if (archivo.size > TAMANO_MAXIMO_ORIGEN) {
    throw new ImagenInvalidaError('La foto es demasiado grande. Prueba con una de menos de 25 MB.');
  }

  const url = URL.createObjectURL(archivo);

  try {
    const imagen = await cargarImagen(url);
    return dibujarReescalado(imagen, imagen.naturalWidth, imagen.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () =>
      rechazar(new ImagenInvalidaError('No pudimos abrir esa imagen. Prueba con otra.'));
    imagen.src = url;
  });
}
