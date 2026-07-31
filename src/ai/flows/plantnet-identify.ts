'use server';

/**
 * @fileOverview Identificación botánica con Pl@ntNet (segunda opinión).
 *
 * Pl@ntNet (https://plantnet.org) es un proyecto científico de identificación
 * de plantas por imagen. A diferencia de Gemini —un modelo general—, está
 * ENTRENADO específicamente en botánica, con millones de observaciones
 * verificadas. Por eso se usa como segunda opinión: si Gemini dice "parece
 * roya" y Pl@ntNet confirma la especie de la planta, el agricultor tiene dos
 * fuentes independientes en vez de una.
 *
 * La API es gratuita con registro (https://my.plantnet.org). La llave se lee de
 * `PLANTNET_API_KEY`; si no está, `identificarPlanta` devuelve `null` y la
 * interfaz simplemente no muestra la segunda opinión. Nunca bloquea el
 * diagnóstico principal.
 */

import { tryGetServerEnv } from '@/config/env';

export interface EspecieIdentificada {
  /** Nombre científico. */
  cientifico: string;
  /** Nombres comunes, si Pl@ntNet los tiene. */
  comunes: string[];
  /** Confianza 0-1 devuelta por Pl@ntNet. */
  confianza: number;
}

export interface ResultadoPlantNet {
  especies: EspecieIdentificada[];
  /** `true` si hay llave configurada y la API respondió. */
  disponible: boolean;
  /** Motivo cuando no hay resultado (sin llave, sin red, sin coincidencias). */
  motivo?: string;
}

/** Convierte un data URI a Blob para enviarlo como multipart. */
function dataUriABlob(dataUri: string): { blob: Blob; tipo: string } {
  const m = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error('Imagen en formato inesperado.');
  const tipo = m[1];
  const binario = Buffer.from(m[2], 'base64');
  return { blob: new Blob([binario], { type: tipo }), tipo };
}

/**
 * Identifica la planta de una foto. `null`/`disponible:false` cuando no hay
 * llave o algo falla: es un extra, nunca un requisito.
 */
export async function identificarPlanta(photoDataUri: string): Promise<ResultadoPlantNet> {
  const apiKey = tryGetServerEnv()?.plantnetApiKey;

  if (!apiKey) {
    return { especies: [], disponible: false, motivo: 'sin_llave' };
  }

  try {
    const { blob } = dataUriABlob(photoDataUri);

    const form = new FormData();
    form.append('images', blob, 'planta.jpg');
    form.append('organs', 'auto');

    const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}&lang=es&nb-results=3`;
    const respuesta = await fetch(url, { method: 'POST', body: form });

    if (!respuesta.ok) {
      // 404 = sin coincidencias; otros = problema de llave/cuota/red.
      return {
        especies: [],
        disponible: false,
        motivo: respuesta.status === 404 ? 'sin_coincidencias' : `error_${respuesta.status}`,
      };
    }

    const data: {
      results?: Array<{
        score?: number;
        species?: { scientificNameWithoutAuthor?: string; commonNames?: string[] };
      }>;
    } = await respuesta.json();

    const especies: EspecieIdentificada[] = (data.results ?? [])
      .slice(0, 3)
      .map((r) => ({
        cientifico: r.species?.scientificNameWithoutAuthor ?? 'Desconocida',
        comunes: r.species?.commonNames ?? [],
        confianza: r.score ?? 0,
      }))
      .filter((e) => e.cientifico !== 'Desconocida');

    return { especies, disponible: especies.length > 0, motivo: especies.length ? undefined : 'sin_coincidencias' };
  } catch (e: any) {
    console.error('[plantnet]', e?.message);
    return { especies: [], disponible: false, motivo: 'error_red' };
  }
}
