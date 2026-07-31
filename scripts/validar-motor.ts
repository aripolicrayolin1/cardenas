/**
 * Validación del motor agroclimático de plagas.
 *
 *   npx tsx scripts/validar-motor.ts
 *
 * No es una prueba unitaria: es una comprobación de que el modelo DISCRIMINA.
 * Un motor que subiera el riesgo de todas las especies a la vez ante cualquier
 * lectura no informaría nada, aunque nunca fallara. Lo que se verifica aquí es
 * que escenarios climáticos opuestos produzcan veredictos opuestos:
 *
 *   calor seco   → araña roja y chapulín arriba, roya y tizón en cero
 *   fresco húmedo → roya y tizón arriba, araña roja en cero
 *
 * Cada escenario declara qué espera, y el script marca ✓ o ✗. Sirve como
 * evidencia reproducible del comportamiento del modelo.
 */

import { analizarRiesgoPlagas, type CondicionesAmbientales } from '../src/lib/plagas/motor';
import { CATALOGO_PLAGAS } from '../src/lib/plagas/catalogo';

interface Escenario {
  nombre: string;
  descripcion: string;
  condiciones: CondicionesAmbientales;
  /** ids que deben salir con riesgo alto o medio. */
  esperaAlto: string[];
  /** ids que deben salir en nulo. */
  esperaNulo: string[];
}

const ESCENARIOS: Escenario[] = [
  {
    nombre: 'Mediodía cálido y seco',
    descripcion: 'Racha de calor en el valle, aire muy seco, sin rocío posible.',
    condiciones: {
      temperatura: 31,
      humedadAire: 28,
      humedadSuelo: 22,
      puntoRocio: 10.5,
      evapotranspiracion: 6.4,
    },
    esperaAlto: ['arana-roja', 'chapulin'],
    esperaNulo: ['roya-amarilla', 'tizon-tardio'],
  },
  {
    nombre: 'Amanecer fresco con rocío',
    descripcion: 'Temperatura pegada al punto de rocío: hay agua libre sobre la hoja.',
    condiciones: {
      temperatura: 13,
      humedadAire: 96,
      humedadSuelo: 55,
      puntoRocio: 12.6,
      evapotranspiracion: 0.8,
    },
    esperaAlto: ['roya-amarilla'],
    esperaNulo: ['arana-roja', 'chapulin'],
  },
  {
    nombre: 'Tarde templada y húmeda',
    descripcion: 'Condición típica de temporada de lluvias en el valle.',
    condiciones: {
      temperatura: 26,
      humedadAire: 78,
      humedadSuelo: 48,
      puntoRocio: 21.8,
      evapotranspiracion: 3.2,
    },
    esperaAlto: ['gusano-cogollero'],
    esperaNulo: ['roya-amarilla'],
  },
  {
    nombre: 'Suelo encharcado',
    descripcion: 'Tras riego excesivo: suelo saturado con temperatura templada.',
    condiciones: {
      temperatura: 24,
      humedadAire: 82,
      humedadSuelo: 95,
      puntoRocio: 20.8,
      evapotranspiracion: 2.1,
    },
    esperaAlto: ['pudricion-radicular'],
    esperaNulo: ['arana-roja'],
  },
  {
    nombre: 'Cenicilla contra roya',
    descripcion:
      'Humedad alta pero hoja seca (rocío lejano). La cenicilla debe subir y la roya no: ' +
      'es el caso que distingue los dos hongos ante una lectura parecida.',
    condiciones: {
      temperatura: 19,
      humedadAire: 88,
      humedadSuelo: 45,
      puntoRocio: 11.0,
      evapotranspiracion: 2.4,
    },
    esperaAlto: ['cenicilla-cereales'],
    esperaNulo: ['tizon-tardio'],
  },
  {
    nombre: 'Sensor desconectado',
    descripcion: 'Todo en cero. El motor debe avisar en vez de diagnosticar con confianza.',
    condiciones: {
      temperatura: 0,
      humedadAire: 0,
      humedadSuelo: 0,
      puntoRocio: 0,
      evapotranspiracion: 0,
    },
    esperaAlto: [],
    esperaNulo: ['gusano-cogollero', 'roya-amarilla', 'arana-roja'],
  },
];

// =============================================================================

const VERDE = '\x1b[32m';
const ROJO = '\x1b[31m';
const GRIS = '\x1b[90m';
const NEGRITA = '\x1b[1m';
const FIN = '\x1b[0m';

let fallos = 0;
let comprobaciones = 0;

console.log(`\n${NEGRITA}Validación del motor agroclimático${FIN}`);
console.log(`${GRIS}${CATALOGO_PLAGAS.length} especies en el catálogo${FIN}\n`);

for (const esc of ESCENARIOS) {
  const inicio = performance.now();
  const analisis = analizarRiesgoPlagas(esc.condiciones);
  const ms = performance.now() - inicio;

  console.log(`${NEGRITA}${esc.nombre}${FIN}`);
  console.log(`${GRIS}${esc.descripcion}${FIN}`);
  console.log(
    `${GRIS}  ${esc.condiciones.temperatura} °C · ${esc.condiciones.humedadAire} % HR · ` +
      `suelo ${esc.condiciones.humedadSuelo} % · rocío ${esc.condiciones.puntoRocio} °C${FIN}`
  );

  const top = analisis.evaluaciones.slice(0, 4);
  for (const ev of top) {
    const barra = '█'.repeat(Math.round(ev.puntaje * 20)).padEnd(20, '·');
    console.log(
      `  ${barra} ${(ev.puntaje * 100).toFixed(0).padStart(3)}%  ` +
        `${ev.plaga.nombreComun} ${GRIS}(${ev.nivel})${FIN}`
    );
  }

  // Comprobaciones
  for (const id of esc.esperaAlto) {
    comprobaciones++;
    const ev = analisis.evaluaciones.find((e) => e.plaga.id === id);
    const ok = ev !== undefined && (ev.nivel === 'alto' || ev.nivel === 'medio');
    if (!ok) {
      fallos++;
      console.log(`  ${ROJO}✗ se esperaba riesgo alto/medio en "${id}", salió "${ev?.nivel ?? 'ausente'}"${FIN}`);
    } else {
      console.log(`  ${VERDE}✓${FIN} ${GRIS}"${id}" en riesgo ${ev!.nivel}, como se esperaba${FIN}`);
    }
  }

  for (const id of esc.esperaNulo) {
    comprobaciones++;
    const ev = analisis.evaluaciones.find((e) => e.plaga.id === id);
    const ok = ev !== undefined && ev.nivel === 'nulo';
    if (!ok) {
      fallos++;
      console.log(`  ${ROJO}✗ se esperaba riesgo nulo en "${id}", salió "${ev?.nivel ?? 'ausente'}"${FIN}`);
    } else {
      console.log(`  ${VERDE}✓${FIN} ${GRIS}"${id}" descartada correctamente${FIN}`);
    }
  }

  if (analisis.confianza === 'baja') {
    console.log(`  ${GRIS}Confianza baja: ${analisis.avisos.join(' ')}${FIN}`);
  }

  console.log(`  ${GRIS}evaluado en ${ms.toFixed(3)} ms${FIN}\n`);
}

console.log(
  fallos === 0
    ? `${VERDE}${NEGRITA}${comprobaciones}/${comprobaciones} comprobaciones correctas.${FIN}\n`
    : `${ROJO}${NEGRITA}${fallos} de ${comprobaciones} comprobaciones fallaron.${FIN}\n`
);

process.exit(fallos === 0 ? 0 : 1);
