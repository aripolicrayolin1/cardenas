/**
 * @fileOverview Geocodificación con Nominatim (OpenStreetMap). Sin API key.
 *
 * Nominatim convierte coordenadas GPS en un nombre de lugar legible ("Rancho
 * Alamoxtitla, Tulancingo de Bravo") y viceversa. Es gratuito y sin clave, con
 * una condición de uso que sí importa respetar: máximo una petición por segundo
 * y un `User-Agent` que identifique la app. Abusar hace que bloqueen la IP.
 *
 * Por eso los resultados se cachean en memoria: la ubicación de una finca no
 * cambia, así que se resuelve una vez y no se vuelve a pedir.
 */

const UA = 'AgroTech-Hidalgo/1.0 (proyecto agrícola educativo)';

const cache = new Map<string, string>();

function clave(lat: number, lng: number): string {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/**
 * Nombre de lugar a partir de coordenadas. Devuelve `null` si no hay red o
 * Nominatim no resuelve; el llamador debe mostrar entonces las coordenadas o la
 * ubicación escrita a mano.
 */
export async function nombreDeLugar(lat: number, lng: number): Promise<string | null> {
  const k = clave(lat, lng);
  const enCache = cache.get(k);
  if (enCache !== undefined) return enCache;

  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
      zoom: '14',
      'accept-language': 'es',
    });

    const respuesta = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { 'User-Agent': UA },
    });
    if (!respuesta.ok) return null;

    const data: { address?: Record<string, string>; display_name?: string } = await respuesta.json();

    // Se arma un nombre corto y útil en vez del `display_name` completo, que
    // suele ser larguísimo (incluye código postal y país).
    const a = data.address ?? {};
    const partes = [
      a.village || a.hamlet || a.town || a.suburb || a.neighbourhood,
      a.city || a.municipality || a.county,
    ].filter(Boolean);

    const nombre = partes.length > 0 ? partes.join(', ') : (data.display_name ?? null);
    cache.set(k, nombre ?? '');
    return nombre;
  } catch {
    return null;
  }
}

export interface LugarSugerido {
  nombre: string;
  lat: number;
  lng: number;
}

/**
 * Busca lugares por nombre (geocodificación directa), acotado a México.
 * Útil para que el agricultor fije su parcela escribiendo el nombre del pueblo
 * en vez de depender del GPS. Devuelve `[]` si no hay red o sin resultados.
 */
export async function buscarLugar(texto: string): Promise<LugarSugerido[]> {
  const consulta = texto.trim();
  if (consulta.length < 3) return [];

  try {
    const params = new URLSearchParams({
      q: consulta,
      format: 'json',
      countrycodes: 'mx',
      limit: '5',
      'accept-language': 'es',
    });

    const respuesta = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': UA },
    });
    if (!respuesta.ok) return [];

    const data: Array<{ display_name: string; lat: string; lon: string }> = await respuesta.json();

    return data.map((d) => ({
      nombre: d.display_name,
      lat: Number(d.lat),
      lng: Number(d.lon),
    }));
  } catch {
    return [];
  }
}
