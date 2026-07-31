/**
 * @fileOverview Análisis acústico para detectar actividad de insectos.
 *
 * Los insectos producen sonido, y algunos SÓLO se delatan por él: un barrenador
 * dentro del tallo no lo ve ninguna cámara, pero al masticar produce impulsos
 * característicos. La detección acústica de plagas es una línea de investigación
 * real, usada sobre todo en grano almacenado y en palma.
 *
 * ── Qué mide esto y qué NO ──────────────────────────────────────────────────
 * Mide ENERGÍA en bandas de frecuencia y cuenta EVENTOS IMPULSIVOS. Eso es
 * señal, no diagnóstico: NO identifica especies. Decir "esto es un gusano
 * cogollero" a partir de un espectro requeriría un clasificador entrenado con
 * miles de grabaciones etiquetadas, que no existe públicamente para las plagas
 * de esta región.
 *
 * Lo honesto —y lo que se muestra en la interfaz— es: "hay actividad acústica
 * compatible con insectos en la banda X". El agricultor decide si va a mirar.
 *
 * ── Las bandas ─────────────────────────────────────────────────────────────
 * - MASTICACIÓN / BARRENADO (0.2–2 kHz): impulsos cortos y separados que
 *   produce la larva al roer. Es la firma más útil porque delata lo invisible.
 * - ESTRIDULACIÓN (2–8 kHz): el canto de grillos, chapulines y cigarras, que
 *   frotan sus élitros. Continuo y tonal, no impulsivo.
 * - ALETEO (0.1–0.5 kHz): zumbido de vuelo, se solapa con el ruido ambiente y
 *   por eso pesa poco en el resultado.
 *
 * El ruido de fondo del campo —viento, hojas, motores lejanos— se concentra por
 * debajo de 200 Hz, así que esa zona se descarta al calcular la actividad.
 */

export interface BandaAcustica {
  id: 'barrenado' | 'estridulacion' | 'aleteo' | 'ambiente';
  nombre: string;
  /** Rango en Hz. */
  desde: number;
  hasta: number;
  descripcion: string;
}

export const BANDAS: readonly BandaAcustica[] = [
  {
    id: 'ambiente',
    nombre: 'Ruido de fondo',
    desde: 0,
    hasta: 200,
    descripcion: 'Viento, motores, movimiento de hojas. Se usa como referencia, no como señal.',
  },
  {
    id: 'barrenado',
    nombre: 'Masticación / barrenado',
    desde: 200,
    hasta: 2000,
    descripcion: 'Impulsos cortos de larvas royendo tallo o grano. Delata lo que no se ve.',
  },
  {
    id: 'estridulacion',
    nombre: 'Estridulación',
    desde: 2000,
    hasta: 8000,
    descripcion: 'Canto continuo de chapulines, grillos y cigarras.',
  },
  {
    id: 'aleteo',
    nombre: 'Aleteo',
    desde: 100,
    hasta: 500,
    descripcion: 'Zumbido de vuelo. Se solapa con el ruido ambiente, así que pesa poco.',
  },
] as const;

export interface EnergiaBanda {
  banda: BandaAcustica;
  /** Energía media en dB dentro de la banda (escala del analizador, −100..0). */
  db: number;
  /** Energía relativa al ruido de fondo, en dB. Positivo = destaca. */
  sobreFondo: number;
}

export interface ResultadoAcustico {
  bandas: EnergiaBanda[];
  /** Impulsos detectados por segundo en la banda de barrenado. */
  impulsosPorSegundo: number;
  /** Actividad global compatible con insectos, 0-1. */
  actividad: number;
  nivel: 'nula' | 'baja' | 'media' | 'alta';
  /** Segundos analizados. */
  duracionS: number;
  /** Frase honesta sobre lo que se midió. */
  interpretacion: string;
}

/** Umbral en dB sobre el fondo para contar un pico como impulso. */
const UMBRAL_IMPULSO_DB = 8;

/**
 * Convierte el índice de un bin de la FFT a su frecuencia central.
 * `fftSize` es el tamaño de la transformada; el analizador entrega
 * `fftSize / 2` bins que cubren de 0 a `sampleRate / 2`.
 */
export function frecuenciaDeBin(bin: number, sampleRate: number, fftSize: number): number {
  return (bin * sampleRate) / fftSize;
}

/** Energía media (dB) de los bins que caen dentro de un rango de frecuencia. */
function energiaEnBanda(
  espectro: Float32Array,
  desde: number,
  hasta: number,
  sampleRate: number,
  fftSize: number
): number {
  let suma = 0;
  let n = 0;

  for (let i = 0; i < espectro.length; i++) {
    const f = frecuenciaDeBin(i, sampleRate, fftSize);
    if (f < desde) continue;
    if (f > hasta) break;

    // Los valores muy bajos son silencio digital y hunden la media sin aportar.
    const v = espectro[i];
    if (Number.isFinite(v) && v > -120) {
      suma += v;
      n++;
    }
  }

  return n > 0 ? suma / n : -100;
}

/**
 * Analiza una serie de espectros capturados a lo largo del tiempo.
 *
 * Se trabaja sobre VARIOS espectros y no sobre uno: un solo instante no
 * distingue un impulso de masticación de un chasquido cualquiera. Lo que
 * caracteriza la actividad de un barrenador es la REPETICIÓN de impulsos, y eso
 * sólo se ve en el tiempo.
 */
export function analizarEspectros(
  espectros: Float32Array[],
  sampleRate: number,
  fftSize: number,
  duracionS: number
): ResultadoAcustico {
  if (espectros.length === 0) {
    return {
      bandas: [],
      impulsosPorSegundo: 0,
      actividad: 0,
      nivel: 'nula',
      duracionS,
      interpretacion: 'No se capturó audio suficiente para analizar.',
    };
  }

  // Energía media por banda a lo largo de toda la grabación.
  const medias = new Map<string, number>();
  for (const banda of BANDAS) {
    let suma = 0;
    for (const esp of espectros) {
      suma += energiaEnBanda(esp, banda.desde, banda.hasta, sampleRate, fftSize);
    }
    medias.set(banda.id, suma / espectros.length);
  }

  const fondo = medias.get('ambiente') ?? -100;

  const bandas: EnergiaBanda[] = BANDAS.map((banda) => {
    const db = medias.get(banda.id) ?? -100;
    return { banda, db, sobreFondo: db - fondo };
  });

  // Impulsos: cuadros en los que la banda de barrenado sobresale del fondo.
  // Se cuentan transiciones (silencio → pico) en vez de cuadros por encima del
  // umbral, para no contar un zumbido sostenido como cientos de impulsos.
  let impulsos = 0;
  let previoAlto = false;

  for (const esp of espectros) {
    const barrenado = energiaEnBanda(esp, 200, 2000, sampleRate, fftSize);
    const ambiente = energiaEnBanda(esp, 0, 200, sampleRate, fftSize);
    const alto = barrenado - ambiente > UMBRAL_IMPULSO_DB;

    if (alto && !previoAlto) impulsos++;
    previoAlto = alto;
  }

  const impulsosPorSegundo = duracionS > 0 ? impulsos / duracionS : 0;

  // Actividad global: combina cuánto destacan las bandas de insecto sobre el
  // fondo con la frecuencia de impulsos. El aleteo no entra porque su banda se
  // solapa con el ruido ambiente y aportaría falsos positivos.
  const destaqueBarrenado = Math.max(0, (bandas.find((b) => b.banda.id === 'barrenado')?.sobreFondo ?? 0) / 20);
  const destaqueEstridulacion = Math.max(0, (bandas.find((b) => b.banda.id === 'estridulacion')?.sobreFondo ?? 0) / 20);
  const ritmo = Math.min(1, impulsosPorSegundo / 5);

  const actividad = Math.min(1, destaqueBarrenado * 0.4 + destaqueEstridulacion * 0.3 + ritmo * 0.3);

  let nivel: ResultadoAcustico['nivel'] = 'nula';
  if (actividad >= 0.6) nivel = 'alta';
  else if (actividad >= 0.35) nivel = 'media';
  else if (actividad >= 0.15) nivel = 'baja';

  return {
    bandas,
    impulsosPorSegundo,
    actividad,
    nivel,
    duracionS,
    interpretacion: interpretar(nivel, bandas, impulsosPorSegundo),
  };
}

function interpretar(
  nivel: ResultadoAcustico['nivel'],
  bandas: EnergiaBanda[],
  impulsos: number
): string {
  if (nivel === 'nula') {
    return 'No se detecta actividad acústica destacable sobre el ruido de fondo.';
  }

  const barrenado = bandas.find((b) => b.banda.id === 'barrenado');
  const estridulacion = bandas.find((b) => b.banda.id === 'estridulacion');
  const partes: string[] = [];

  if (barrenado && barrenado.sobreFondo > 6) {
    partes.push(
      `hay energía en la banda de masticación (${barrenado.sobreFondo.toFixed(0)} dB sobre el fondo)`
    );
  }
  if (impulsos > 0.5) {
    partes.push(`se cuentan ${impulsos.toFixed(1)} impulsos por segundo`);
  }
  if (estridulacion && estridulacion.sobreFondo > 6) {
    partes.push(
      `y sonido continuo en la banda de estridulación (${estridulacion.sobreFondo.toFixed(0)} dB)`
    );
  }

  const detalle = partes.length > 0 ? partes.join(', ') : 'la señal destaca sobre el fondo';

  return `Actividad ${nivel}: ${detalle}. Esto indica presencia de sonido compatible con insectos, no identifica la especie: revisa el cultivo para confirmar.`;
}
