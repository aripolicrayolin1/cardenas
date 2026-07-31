/**
 * Validación del análisis de frente de brote.
 *
 *   npx tsx scripts/validar-epidemiologia.ts
 *
 * Se construyen brotes SINTÉTICOS con una velocidad y un rumbo conocidos, y se
 * comprueba que el ajuste los recupere. Es la forma de saber que la regresión
 * mide lo que dice medir antes de enseñar una fecha de llegada a un agricultor.
 *
 * También se prueban los casos en los que el modelo DEBE negarse a responder:
 * pocos reportes, todos el mismo día, o puntos dispersos sin dirección clara.
 */

import {
  analizarFrente,
  estimarLlegada,
  distanciaKm,
  normalizarPlaga,
  MINIMO_REPORTES,
  type PuntoBrote,
} from '../src/lib/epidemiologia';

const MS_DIA = 24 * 60 * 60 * 1000;
const KM_LAT = 111.32;

const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const GRIS = '\x1b[90m';
const NEGRITA = '\x1b[1m';
const FIN = '\x1b[0m';

let fallos = 0;
let pruebas = 0;

function comprobar(descripcion: string, condicion: boolean, detalle = '') {
  pruebas++;
  if (condicion) {
    console.log(`  ${VERDE}✓${FIN} ${GRIS}${descripcion}${FIN}`);
  } else {
    fallos++;
    console.log(`  ${ROJO}✗ ${descripcion}${detalle ? ` — ${detalle}` : ''}${FIN}`);
  }
}

/**
 * Genera un brote que avanza en línea recta desde un origen, con rumbo y
 * velocidad dados, un reporte por día.
 */
function broteSintetico(
  origen: { lat: number; lng: number },
  rumboGrados: number,
  kmPorDia: number,
  dias: number,
  ruidoKm = 0
): PuntoBrote[] {
  const rad = (rumboGrados * Math.PI) / 180;
  const kmLng = KM_LAT * Math.cos((origen.lat * Math.PI) / 180);
  const ahora = Date.now();
  const puntos: PuntoBrote[] = [];

  for (let d = 0; d < dias; d++) {
    const avance = kmPorDia * d;
    // Ruido determinista (alterna signo) para no depender del azar.
    const r = ruidoKm * (d % 2 === 0 ? 1 : -1);

    puntos.push({
      lat: origen.lat + ((avance * Math.cos(rad) + r) / KM_LAT),
      lng: origen.lng + ((avance * Math.sin(rad)) / kmLng),
      ts: ahora - (dias - 1 - d) * MS_DIA,
    });
  }
  return puntos;
}

const TULANCINGO = { lat: 20.0833, lng: -98.3667 };

console.log(`\n${NEGRITA}Validación del análisis epidemiológico${FIN}\n`);

// ─── 1. Recuperar una velocidad y un rumbo conocidos ──────────────────────
{
  console.log(`${NEGRITA}Brote limpio: 2 km/día hacia el sur, 8 días${FIN}`);
  // Rumbo 180 = avanza hacia el sur, así que VIENE del norte.
  const puntos = broteSintetico(TULANCINGO, 180, 2, 8);
  const f = analizarFrente('Gusano cogollero', puntos);

  comprobar('devuelve un frente', f !== null);
  if (f) {
    console.log(
      `${GRIS}    velocidad ${f.velocidadKmDia.toFixed(2)} km/día · rumbo ${f.rumboGrados.toFixed(0)}° (${f.rumboTexto}) · dispersión ${f.dispersionKm.toFixed(2)} km · confianza ${f.confianza}${FIN}`
    );
    comprobar(
      'recupera la velocidad (~2 km/día)',
      Math.abs(f.velocidadKmDia - 2) < 0.15,
      `midió ${f.velocidadKmDia.toFixed(2)}`
    );
    comprobar(
      'recupera el rumbo (~180°)',
      Math.abs(((f.rumboGrados - 180 + 540) % 360) - 180) < 8,
      `midió ${f.rumboGrados.toFixed(0)}°`
    );
    comprobar('lo describe como procedente del norte', f.rumboTexto === 'del norte', f.rumboTexto);
    comprobar('sin ruido, la dispersión es casi nula', f.dispersionKm < 0.2);
    comprobar('con 8 reportes alineados, confianza alta', f.confianza === 'alta', f.confianza);
  }
  console.log();
}

// ─── 2. Estimación de llegada ─────────────────────────────────────────────
{
  console.log(`${NEGRITA}Llegada a una parcela 10 km al sur del frente${FIN}`);
  const puntos = broteSintetico(TULANCINGO, 180, 2, 8);
  const f = analizarFrente('Gusano cogollero', puntos)!;

  // La parcela se coloca 10 km al sur de la posición actual del frente.
  const parcela = { lat: f.frenteActual.lat - 10 / KM_LAT, lng: f.frenteActual.lng };
  const llegada = estimarLlegada(f, parcela);

  comprobar('devuelve una estimación', llegada !== null);
  if (llegada) {
    console.log(
      `${GRIS}    distancia ${llegada.distanciaKm.toFixed(1)} km · llega en ${llegada.dias.toFixed(1)} días · se aleja: ${llegada.seAleja}${FIN}`
    );
    comprobar('la distancia es ~10 km', Math.abs(llegada.distanciaKm - 10) < 0.6);
    comprobar('a 2 km/día tarda ~5 días', Math.abs(llegada.dias - 5) < 0.5, `dio ${llegada.dias.toFixed(1)}`);
    comprobar('detecta que se acerca', !llegada.seAleja);
  }
  console.log();
}

// ─── 3. Frente que se aleja ───────────────────────────────────────────────
{
  console.log(`${NEGRITA}Parcela al norte: el frente se aleja${FIN}`);
  const puntos = broteSintetico(TULANCINGO, 180, 2, 8);
  const f = analizarFrente('Gusano cogollero', puntos)!;

  const parcela = { lat: f.frenteActual.lat + 10 / KM_LAT, lng: f.frenteActual.lng };
  const llegada = estimarLlegada(f, parcela)!;

  console.log(`${GRIS}    días ${llegada.dias.toFixed(1)} · se aleja: ${llegada.seAleja}${FIN}`);
  comprobar('marca que se aleja', llegada.seAleja);
  comprobar('los días salen negativos', llegada.dias < 0);
  console.log();
}

// ─── 4. Casos en los que debe negarse ─────────────────────────────────────
{
  console.log(`${NEGRITA}Datos insuficientes: debe devolver null${FIN}`);

  const dosPuntos = broteSintetico(TULANCINGO, 90, 3, 2);
  comprobar(
    `con menos de ${MINIMO_REPORTES} reportes no estima`,
    analizarFrente('X', dosPuntos.slice(0, 2)) === null
  );

  const ahora = Date.now();
  const mismoDia: PuntoBrote[] = [
    { lat: 20.08, lng: -98.36, ts: ahora },
    { lat: 20.09, lng: -98.37, ts: ahora + 1000 },
    { lat: 20.10, lng: -98.38, ts: ahora + 2000 },
  ];
  comprobar('con todos los reportes del mismo momento no estima', analizarFrente('X', mismoDia) === null);
  console.log();
}

// ─── 5. Ruido: la confianza debe bajar ────────────────────────────────────
{
  console.log(`${NEGRITA}Brote disperso: la confianza debe reflejarlo${FIN}`);
  const limpio = analizarFrente('X', broteSintetico(TULANCINGO, 90, 2, 8, 0))!;
  const ruidoso = analizarFrente('X', broteSintetico(TULANCINGO, 90, 2, 8, 6))!;

  console.log(
    `${GRIS}    limpio: dispersión ${limpio.dispersionKm.toFixed(2)} km (${limpio.confianza}) · ruidoso: ${ruidoso.dispersionKm.toFixed(2)} km (${ruidoso.confianza})${FIN}`
  );
  comprobar('el ruidoso tiene más dispersión', ruidoso.dispersionKm > limpio.dispersionKm);
  comprobar('el ruidoso no se reporta como alta confianza', ruidoso.confianza !== 'alta', ruidoso.confianza);
  console.log();
}

// ─── 6. Utilidades ────────────────────────────────────────────────────────
{
  console.log(`${NEGRITA}Utilidades${FIN}`);
  const d = distanciaKm({ lat: 20.0833, lng: -98.3667 }, { lat: 20.1733, lng: -98.3667 });
  console.log(`${GRIS}    0.09° de latitud = ${d.toFixed(2)} km${FIN}`);
  comprobar('la distancia de 0.09° de latitud es ~10 km', Math.abs(d - 10) < 0.2);

  comprobar(
    'agrupa variantes del mismo texto',
    normalizarPlaga('Gusano  Cogollero!!') === normalizarPlaga('gusano cogollero')
  );
  comprobar(
    'ignora acentos al agrupar',
    normalizarPlaga('Pulgón') === normalizarPlaga('pulgon')
  );
  console.log();
}

console.log(
  fallos === 0
    ? `${VERDE}${NEGRITA}${pruebas}/${pruebas} comprobaciones correctas.${FIN}\n`
    : `${ROJO}${NEGRITA}${fallos} de ${pruebas} fallaron.${FIN}\n`
);

process.exit(fallos === 0 ? 0 : 1);
