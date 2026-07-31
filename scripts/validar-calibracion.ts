/**
 * Validación de la calibración local del motor.
 *
 *   npx tsx scripts/validar-calibracion.ts
 *
 * Comprueba las propiedades que hacen que este método sea seguro de usar con
 * pocos datos, que es la situación real de una parcela:
 *
 *   1. Sin observaciones, el modelo NO se mueve (manda la literatura).
 *   2. El desplazamiento crece con el número de observaciones, no de golpe.
 *   3. Nunca supera el límite, por muchas observaciones raras que haya.
 *   4. Las envolventes conservan su forma al desplazarse.
 *   5. Tras calibrar, el motor cambia de veredicto donde debe.
 */

import { CATALOGO_PLAGAS, buscarPlaga } from '../src/lib/plagas/catalogo';
import { analizarRiesgoPlagas } from '../src/lib/plagas/motor';
import {
  calcularCalibracion,
  aplicarCalibracion,
  calibrarCatalogo,
  FUERZA_PRIOR,
  DESPLAZAMIENTO_MAXIMO,
  type Observacion,
} from '../src/lib/plagas/calibracion';

const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const GRIS = '\x1b[90m';
const NEGRITA = '\x1b[1m';
const FIN = '\x1b[0m';

let fallos = 0;
let pruebas = 0;

function comprobar(desc: string, cond: boolean, detalle = '') {
  pruebas++;
  if (cond) console.log(`  ${VERDE}✓${FIN} ${GRIS}${desc}${FIN}`);
  else {
    fallos++;
    console.log(`  ${ROJO}✗ ${desc}${detalle ? ` — ${detalle}` : ''}${FIN}`);
  }
}

/** Observaciones de presencia confirmada a una temperatura dada. */
function obs(plagaId: string, n: number, temperatura: number, humedadAire = 70): Observacion[] {
  return Array.from({ length: n }, () => ({
    plagaId,
    presente: true,
    temperatura,
    humedadAire,
    humedadSuelo: 50,
    puntajePredicho: 0.8,
  }));
}

const cogollero = buscarPlaga('gusano-cogollero')!;
const centroTempLibro = (cogollero.temperatura.optimoMin + cogollero.temperatura.optimoMax) / 2;

console.log(`\n${NEGRITA}Validación de la calibración local${FIN}`);
console.log(`${GRIS}Gusano cogollero — óptimo de literatura: ${cogollero.temperatura.optimoMin}–${cogollero.temperatura.optimoMax} °C (centro ${centroTempLibro} °C)${FIN}\n`);

// ─── 1. Sin datos, no se mueve ────────────────────────────────────────────
{
  console.log(`${NEGRITA}Sin observaciones${FIN}`);
  const e = calcularCalibracion(cogollero, []);
  comprobar('el peso local es 0', e.peso === 0);
  comprobar('no hay desplazamiento de temperatura', e.ajusteTempC === 0);
  comprobar('la precisión es null (nada que medir)', e.precision === null);
  comprobar('la ficha vuelve intacta', aplicarCalibracion(cogollero, e) === cogollero);
  console.log();
}

// ─── 2. El desplazamiento crece de forma gradual ──────────────────────────
{
  console.log(`${NEGRITA}Aparece a 21 °C (la literatura dice ${centroTempLibro} °C)${FIN}`);
  const ajustes: number[] = [];

  for (const n of [1, 3, 5, 10, 30]) {
    const e = calcularCalibracion(cogollero, obs('gusano-cogollero', n, 21));
    ajustes.push(e.ajusteTempC);
    console.log(
      `${GRIS}    n=${String(n).padStart(2)} → peso ${(e.peso * 100).toFixed(0).padStart(2)} % · desplazamiento ${e.ajusteTempC.toFixed(2)} °C${FIN}`
    );
  }

  comprobar('el desplazamiento es negativo (hacia el frío)', ajustes.every((a) => a < 0));
  comprobar(
    'crece de forma monótona con las observaciones',
    ajustes.every((a, i) => i === 0 || Math.abs(a) >= Math.abs(ajustes[i - 1]))
  );
  // Propiedad del encogimiento: con n observaciones, el desplazamiento es
  // n/(n+K) de la discrepancia. Con n=1 y K=5 debe ser exactamente un sexto.
  // Se comprueba la fórmula, no un número elegido a ojo.
  const discrepancia = Math.abs(21 - centroTempLibro);
  const fraccionEsperada = 1 / (1 + FUERZA_PRIOR);
  comprobar(
    `con 1 observación mueve ${(fraccionEsperada * 100).toFixed(0)} % de la discrepancia`,
    Math.abs(Math.abs(ajustes[0]) - discrepancia * fraccionEsperada) < 1e-9,
    `esperado ${(discrepancia * fraccionEsperada).toFixed(2)}, dio ${Math.abs(ajustes[0]).toFixed(2)}`
  );

  const e5 = calcularCalibracion(cogollero, obs('gusano-cogollero', FUERZA_PRIOR, 21));
  comprobar(
    `con n = K (${FUERZA_PRIOR}) el peso local es 50 %`,
    Math.abs(e5.peso - 0.5) < 0.001,
    `dio ${(e5.peso * 100).toFixed(1)} %`
  );
  console.log();
}

// ─── 3. El límite se respeta ──────────────────────────────────────────────
{
  console.log(`${NEGRITA}Observaciones absurdas: 200 reportes a 60 °C${FIN}`);
  const e = calcularCalibracion(cogollero, obs('gusano-cogollero', 200, 60));
  console.log(`${GRIS}    desplazamiento ${e.ajusteTempC.toFixed(2)} °C (límite ${DESPLAZAMIENTO_MAXIMO.temperatura})${FIN}`);

  comprobar(
    'no supera el desplazamiento máximo',
    Math.abs(e.ajusteTempC) <= DESPLAZAMIENTO_MAXIMO.temperatura + 1e-9
  );

  const calibrada = aplicarCalibracion(cogollero, e);
  comprobar(
    'el óptimo sigue siendo biológicamente razonable',
    calibrada.temperatura.optimoMax <= cogollero.temperatura.optimoMax + DESPLAZAMIENTO_MAXIMO.temperatura + 1e-9,
    `${calibrada.temperatura.optimoMin.toFixed(1)}–${calibrada.temperatura.optimoMax.toFixed(1)}`
  );
  console.log();
}

// ─── 4. La forma de la envolvente se conserva ─────────────────────────────
{
  console.log(`${NEGRITA}Forma de la envolvente tras desplazar${FIN}`);
  const e = calcularCalibracion(cogollero, obs('gusano-cogollero', 10, 20));
  const c = aplicarCalibracion(cogollero, e);
  const o = cogollero.temperatura;

  console.log(
    `${GRIS}    ${o.min}–${o.optimoMin}–${o.optimoMax}–${o.max}  →  ${c.temperatura.min.toFixed(1)}–${c.temperatura.optimoMin.toFixed(1)}–${c.temperatura.optimoMax.toFixed(1)}–${c.temperatura.max.toFixed(1)}${FIN}`
  );

  const anchoOriginal = o.max - o.min;
  const anchoNuevo = c.temperatura.max - c.temperatura.min;
  comprobar('conserva el ancho total', Math.abs(anchoNuevo - anchoOriginal) < 1e-9);
  comprobar(
    'conserva el orden min < optimoMin < optimoMax < max',
    c.temperatura.min < c.temperatura.optimoMin &&
      c.temperatura.optimoMin < c.temperatura.optimoMax &&
      c.temperatura.optimoMax < c.temperatura.max
  );
  console.log();
}

// ─── 5. Precisión del modelo ──────────────────────────────────────────────
{
  console.log(`${NEGRITA}Medición de precisión${FIN}`);
  const mezcla: Observacion[] = [
    // 3 aciertos: predijo alto y estaba
    ...Array.from({ length: 3 }, () => ({ plagaId: 'gusano-cogollero', presente: true, temperatura: 26, humedadAire: 75, humedadSuelo: 50, puntajePredicho: 0.9 })),
    // 1 fallo: predijo alto y no estaba
    { plagaId: 'gusano-cogollero', presente: false, temperatura: 26, humedadAire: 75, humedadSuelo: 50, puntajePredicho: 0.9 },
  ];
  const e = calcularCalibracion(cogollero, mezcla);
  console.log(`${GRIS}    precisión ${(e.precision! * 100).toFixed(0)} % sobre ${e.total} observaciones${FIN}`);
  comprobar('calcula 3 de 4 = 75 %', Math.abs(e.precision! - 0.75) < 1e-9);
  comprobar('cuenta bien las confirmadas', e.confirmadas === 3);
  console.log();
}

// ─── 6. Efecto real en el veredicto del motor ─────────────────────────────
{
  console.log(`${NEGRITA}Efecto sobre el diagnóstico${FIN}`);
  // Condición fresca: 19 °C. La literatura pone el óptimo del cogollero en
  // 24-30 °C, así que sin calibrar el riesgo debe ser modesto.
  const condiciones = {
    temperatura: 19,
    humedadAire: 75,
    humedadSuelo: 45,
    puntoRocio: 14,
    evapotranspiracion: 3,
  };

  const sinCalibrar = analizarRiesgoPlagas(condiciones);
  const antes = sinCalibrar.evaluaciones.find((e) => e.plaga.id === 'gusano-cogollero')!;

  // La parcela reporta el cogollero repetidamente a 19-20 °C.
  const { plagas } = calibrarCatalogo(CATALOGO_PLAGAS, obs('gusano-cogollero', 12, 19.5));
  const conCalibrar = analizarRiesgoPlagas({ ...condiciones, catalogo: plagas });
  const despues = conCalibrar.evaluaciones.find((e) => e.plaga.id === 'gusano-cogollero')!;

  console.log(
    `${GRIS}    a 19 °C → sin calibrar ${(antes.puntaje * 100).toFixed(0)} % (${antes.nivel}) · calibrado ${(despues.puntaje * 100).toFixed(0)} % (${despues.nivel})${FIN}`
  );
  comprobar(
    'tras aprender, el riesgo sube en esas condiciones',
    despues.puntaje > antes.puntaje,
    `${antes.puntaje.toFixed(2)} → ${despues.puntaje.toFixed(2)}`
  );
  console.log();
}

console.log(
  fallos === 0
    ? `${VERDE}${NEGRITA}${pruebas}/${pruebas} comprobaciones correctas.${FIN}\n`
    : `${ROJO}${NEGRITA}${fallos} de ${pruebas} fallaron.${FIN}\n`
);

process.exit(fallos === 0 ? 0 : 1);
