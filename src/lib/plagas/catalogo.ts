/**
 * @fileOverview CATÁLOGO DE PLAGAS — los datos del modelo.
 *
 * Este archivo es el "dataset" del sistema. Cada plaga se describe con su
 * envolvente climática: los rangos de temperatura y humedad en los que la
 * especie se desarrolla, y los que no. Con eso el motor de `motor.ts` puede
 * calcular, sin red y sin IA generativa, qué tan favorables son las condiciones
 * actuales para cada organismo.
 *
 * ── Por qué una envolvente y no un LLM ──────────────────────────────────────
 * Un modelo de lenguaje inventa dosis de agroquímicos: son texto plausible, no
 * una recomendación verificada. Aquí las estrategias de control están escritas
 * a mano, siguen el orden del Manejo Integrado de Plagas (primero mecánico y
 * biológico, el químico al final) y nombran GRUPOS de ingrediente activo, nunca
 * dosis. La dosis vive en la etiqueta del producto y la decide un técnico.
 *
 * ── Calibración ─────────────────────────────────────────────────────────────
 * Los umbrales provienen de literatura entomológica y fitopatológica general
 * (fichas técnicas de SENASICA/SINAVEF, CABI, EPPO). Son un punto de partida
 * regional, NO una verdad local. El campo `fuente` de cada ficha dice sobre qué
 * se apoya. Conforme `/historico` y los reportes de la comunidad acumulen
 * observaciones reales de Tulancingo, estos rangos deben reajustarse: ese
 * reajuste es justamente la aportación del proyecto.
 *
 * ── Cómo se leen los rangos ─────────────────────────────────────────────────
 * Cada variable usa una función de pertenencia trapezoidal:
 *
 *      aptitud
 *        1 |        ┌───────────┐
 *          |       /             \
 *        0 |______/               \______
 *            min  optimoMin  optimoMax  max
 *
 * Fuera de [min, max] el desarrollo es nulo. Entre optimoMin y optimoMax es
 * máximo. En medio, interpolación lineal. Es el enfoque estándar de los modelos
 * de aptitud agroclimática y se puede defender y citar.
 */

export type TipoPlaga = 'insecto' | 'acaro' | 'hongo' | 'oomiceto' | 'suelo';

/** Función de pertenencia trapezoidal. Ver diagrama en la cabecera. */
export interface RangoOptimo {
  /** Por debajo de este valor el desarrollo se detiene. */
  min: number;
  /** Inicio del rango óptimo. */
  optimoMin: number;
  /** Fin del rango óptimo. */
  optimoMax: number;
  /** Por encima de este valor el desarrollo se detiene. */
  max: number;
}

/**
 * Modelo de grados-día (GDD). Los insectos son poiquilotermos: acumulan
 * desarrollo en proporción al calor recibido por encima de una temperatura
 * base. Sumando (T_media − tempBase) cada día se predice cuándo emerge la
 * siguiente generación, que es cuando conviene monitorear.
 */
export interface ModeloGradosDia {
  /** °C por debajo de los cuales no hay desarrollo. */
  tempBase: number;
  /** Grados-día acumulados para completar huevo → adulto. */
  porGeneracion: number;
}

export interface Plaga {
  id: string;
  nombreComun: string;
  nombreCientifico: string;
  tipo: TipoPlaga;
  /** Cultivos de la región de Tulancingo a los que afecta. */
  cultivos: string[];

  temperatura: RangoOptimo;
  humedadAire: RangoOptimo;
  /** Sólo plagas de suelo: humedad del sustrato en % que las favorece. */
  humedadSuelo?: RangoOptimo;

  /** Sólo artrópodos: permite estimar generaciones a partir de `/historico`. */
  gradosDia?: ModeloGradosDia;

  /**
   * Sólo hongos y oomicetos: horas de agua libre sobre la hoja necesarias para
   * que la espora germine e infecte. Se estima por convergencia entre la
   * temperatura del aire y el punto de rocío.
   */
  humectacionFoliarHoras?: number;

  /**
   * `true` en hongos cuya espora NO germina con agua libre encima (las
   * cenicillas). Necesitan humedad alta pero hoja seca — es lo que las
   * distingue de royas y tizones ante la misma lectura de sensores.
   */
  inhibidaPorAguaLibre?: boolean;

  cicloBiologico: string;
  danos: string;
  /** Qué buscar en campo para confirmar. El modelo sugiere; el ojo confirma. */
  senalesEnCampo: string[];

  control: {
    mecanico: string[];
    biologico: string[];
    /** Grupos de ingrediente activo. NUNCA dosis: eso lo dice la etiqueta. */
    quimico: string[];
  };
  prevencion: string[];
  fuente: string;
}

// =============================================================================
// El catálogo
// =============================================================================
// Doce organismos escogidos porque (a) afectan cultivos reales del valle de
// Tulancingo —maíz, cebada, avena, alfalfa, frijol, papa y hortalizas— y (b)
// responden de forma DISTINTA al mismo clima. Ese contraste es lo que hace útil
// al modelo: un día caluroso y seco dispara araña roja y chapulín mientras
// apaga roya y tizón. Un catálogo donde todo sube y baja junto no informa nada.

export const CATALOGO_PLAGAS: readonly Plaga[] = [
  // ───────────────────────────────────────────────────────────── INSECTOS ───
  {
    id: 'gusano-cogollero',
    nombreComun: 'Gusano cogollero',
    nombreCientifico: 'Spodoptera frugiperda',
    tipo: 'insecto',
    cultivos: ['maíz', 'sorgo', 'avena', 'pastos'],
    temperatura: { min: 10, optimoMin: 24, optimoMax: 30, max: 38 },
    humedadAire: { min: 30, optimoMin: 60, optimoMax: 90, max: 100 },
    gradosDia: { tempBase: 10.9, porGeneracion: 450 },
    cicloBiologico:
      'La palomilla deposita masas de 100 a 200 huevos en el envés de las hojas, ' +
      'cubiertas de escamas. Eclosionan en 3 a 5 días. Las larvas pasan por seis ' +
      'estadios en dos a tres semanas y se refugian en el cogollo, donde el ' +
      'insecticida no las alcanza. Pupan en el suelo entre 8 y 12 días. El ciclo ' +
      'completo dura de 30 a 40 días en clima cálido, y se alarga con el frío.',
    danos:
      'Raspaduras traslúcidas en hojas jóvenes que avanzan a perforaciones ' +
      'alineadas al desplegarse el cogollo. En ataques severos destruye el punto ' +
      'de crecimiento y la planta no forma mazorca.',
    senalesEnCampo: [
      'Aserrín húmedo (excremento) acumulado en el cogollo',
      'Perforaciones en hilera al desenrollarse la hoja',
      'Larva con "Y" invertida clara en la cápsula cefálica',
      'Cuatro puntos negros en cuadro en el penúltimo segmento abdominal',
    ],
    control: {
      mecanico: [
        'Muestreo de 100 plantas en cinco puntos del terreno; se justifica actuar con más del 20 % de cogollos dañados',
        'Aplicar un puño de arena o aserrín seco en el cogollo: abrasiona a la larva sin químico',
        'Destruir socas y residuos de cosecha para eliminar pupas invernantes',
      ],
      biologico: [
        'Liberación de Trichogramma pretiosum contra los huevos',
        'Aspersión de Bacillus thuringiensis var. kurstaki, más eficaz sobre larvas pequeñas',
        'Baculovirus de Spodoptera (nucleopoliedrovirus), específico y compatible con fauna benéfica',
        'Conservar avispas Chelonus y Campoletis: no aplicar de amplio espectro en floración',
      ],
      quimico: [
        'Diamidas antranílicas (IRAC grupo 28) — buena penetración al cogollo',
        'Espinosinas (IRAC grupo 5) — de origen biológico, bajo impacto en polinizadores',
        'Rotar grupo IRAC cada generación: esta especie desarrolla resistencia con rapidez',
        'Aplicar al atardecer, dirigido al cogollo, con volumen suficiente para que escurra',
      ],
    },
    prevencion: [
      'Adelantar la siembra para escapar del pico poblacional',
      'Trampas de feromona para detectar el vuelo de palomillas antes de la infestación',
      'Evitar el exceso de nitrógeno: el follaje suculento atrae a la palomilla',
    ],
    fuente:
      'Umbrales de desarrollo y modelo de grados-día de literatura entomológica general ' +
      '(SENASICA/SINAVEF, CABI). Requiere calibración con observación local.',
  },
  {
    id: 'pulgon-del-maiz',
    nombreComun: 'Pulgón del cogollo',
    nombreCientifico: 'Rhopalosiphum maidis',
    tipo: 'insecto',
    cultivos: ['maíz', 'cebada', 'avena', 'sorgo'],
    temperatura: { min: 5, optimoMin: 20, optimoMax: 25, max: 32 },
    humedadAire: { min: 20, optimoMin: 50, optimoMax: 75, max: 95 },
    gradosDia: { tempBase: 4.6, porGeneracion: 120 },
    cicloBiologico:
      'Se reproduce por partenogénesis: las hembras paren ninfas vivas sin ' +
      'necesidad de macho, y una generación se completa en 7 a 10 días de calor ' +
      'templado. Esa velocidad explica que una colonia pase de discreta a masiva ' +
      'en dos semanas. Al saturarse la colonia nacen formas aladas que migran.',
    danos:
      'Succiona savia del cogollo y de la espiga. Secreta mielecilla que favorece ' +
      'fumagina, un hongo negro que reduce la fotosíntesis. Transmite virus del ' +
      'mosaico enanizante del maíz.',
    senalesEnCampo: [
      'Colonias densas en el cogollo y en la base de las hojas nuevas',
      'Brillo pegajoso (mielecilla) sobre el follaje inferior',
      'Polvo negro (fumagina) sobre la mielecilla',
      'Presencia de hormigas subiendo por el tallo',
    ],
    control: {
      mecanico: [
        'Chorro de agua a presión sobre el cogollo: desaloja colonias jóvenes',
        'Eliminar maleza gramínea del borde, donde el pulgón se refugia entre ciclos',
      ],
      biologico: [
        'Conservar catarinas (Hippodamia convergens) y larvas de syrphidos',
        'Liberar Chrysoperla carnea en focos detectados',
        'Hongos entomopatógenos: Beauveria bassiana, Lecanicillium lecanii',
        'Jabón potásico o extracto de neem para infestaciones incipientes',
      ],
      quimico: [
        'Aplicar sólo con más del 30 % de plantas colonizadas y sin fauna benéfica presente',
        'Sales de ácidos grasos o aceites minerales — de contacto, bajo impacto residual',
        'Evitar piretroides de amplio espectro: eliminan a los depredadores y provocan rebrote de la plaga',
      ],
    },
    prevencion: [
      'Franjas de flores en los bordes para sostener poblaciones de depredadores',
      'Fertilización nitrogenada equilibrada',
      'Monitorear después de periodos secos y templados prolongados',
    ],
    fuente: 'Rangos térmicos de literatura general sobre áfidos de cereales (CABI, EPPO).',
  },
  {
    id: 'chapulin',
    nombreComun: 'Chapulín',
    nombreCientifico: 'Sphenarium purpurascens',
    tipo: 'insecto',
    cultivos: ['maíz', 'frijol', 'alfalfa', 'avena', 'hortalizas'],
    temperatura: { min: 15, optimoMin: 25, optimoMax: 32, max: 40 },
    humedadAire: { min: 10, optimoMin: 30, optimoMax: 55, max: 75 },
    gradosDia: { tempBase: 12, porGeneracion: 700 },
    cicloBiologico:
      'Una sola generación al año. Los huevos pasan la sequía enterrados en ' +
      'suelos compactos de bordes y caminos, y eclosionan con las primeras ' +
      'lluvias. Las ninfas pasan por cinco o seis estadios; en los primeros se ' +
      'concentran en manchones, y ahí es donde el control resulta barato y eficaz. ' +
      'El adulto se dispersa y ya es mucho más difícil de contener.',
    danos:
      'Defoliación desde los bordes de la parcela hacia el centro. En años de ' +
      'alta población puede consumir el follaje por completo. Es plaga de ' +
      'importancia histórica en el estado de Hidalgo.',
    senalesEnCampo: [
      'Daño concentrado en las orillas del terreno y junto a caminos',
      'Hojas comidas desde el margen, con mordidas irregulares',
      'Manchones densos de ninfas sin alas en terrenos baldíos vecinos',
    ],
    control: {
      mecanico: [
        'Barreras físicas y zanjas trampa en el perímetro durante la etapa de ninfa',
        'Captura manual organizada en manchones: en la región es además alimento tradicional con valor de mercado',
        'Laboreo del suelo en bordes y baldíos para exponer los huevos al sol y a los depredadores',
      ],
      biologico: [
        'Hongo entomopatógeno Metarhizium acridum, específico de acrídidos',
        'Conservar aves insectívoras y no destruir sus refugios',
      ],
      quimico: [
        'Aplicación dirigida sólo a las franjas perimetrales donde se concentran las ninfas, no a toda la parcela',
        'Cebos envenenados a base de salvado, que reducen la deriva y el impacto sobre fauna no blanco',
        'Coordinar con parcelas vecinas: el control aislado se reinfesta desde el terreno de al lado',
      ],
    },
    prevencion: [
      'Detectar y tratar los sitios de ovipostura en la temporada seca',
      'Vigilancia comunitaria coordinada, ya que la plaga se mueve entre predios',
    ],
    fuente:
      'Especie de importancia regional en el altiplano mexicano; umbrales aproximados a partir de ' +
      'literatura sobre acrídidos. Es la ficha que más se beneficiará de la observación local.',
  },
  {
    id: 'gusano-trozador',
    nombreComun: 'Gusano trozador',
    nombreCientifico: 'Agrotis ipsilon',
    tipo: 'insecto',
    cultivos: ['maíz', 'frijol', 'hortalizas'],
    temperatura: { min: 10, optimoMin: 20, optimoMax: 27, max: 33 },
    humedadAire: { min: 40, optimoMin: 65, optimoMax: 90, max: 100 },
    gradosDia: { tempBase: 10, porGeneracion: 500 },
    cicloBiologico:
      'La palomilla ovipone en suelo húmedo con maleza. La larva es nocturna: ' +
      'de día permanece enrollada bajo terrones a pocos centímetros de la planta ' +
      'dañada, y de noche corta las plántulas a la altura del cuello. Una sola ' +
      'larva puede derribar varias plantas por noche.',
    danos:
      'Plántulas cortadas a ras de suelo en las primeras semanas del cultivo. ' +
      'Genera fallas de población que ya no se recuperan.',
    senalesEnCampo: [
      'Plántulas tumbadas y cortadas limpiamente en el cuello',
      'Fallas en la línea de siembra que aparecen de un día para otro',
      'Larva gris oscura y grasosa al escarbar junto a la planta dañada',
    ],
    control: {
      mecanico: [
        'Escarbar alrededor de la planta dañada y eliminar la larva a mano: es el método más efectivo en superficies chicas',
        'Barbecho dos a tres semanas antes de sembrar para eliminar maleza y exponer larvas',
        'Riego pesado previo a la siembra para forzar la emergencia y dejarla sin alimento',
      ],
      biologico: [
        'Nematodos entomopatógenos (Steinernema carpocapsae) aplicados con el riego',
        'Bacillus thuringiensis en cebo de salvado colocado al pie de la planta',
        'Conservar escarabajos carábidos, depredadores nocturnos de la larva',
      ],
      quimico: [
        'Cebos al pie de la planta aplicados al atardecer, cuando la larva sale a alimentarse',
        'Tratamiento a la semilla como medida preventiva en lotes con historial del problema',
        'La aspersión foliar es poco útil: la larva no está en la hoja, está en el suelo',
      ],
    },
    prevencion: [
      'Mantener el terreno limpio de maleza antes de sembrar',
      'Evitar sembrar inmediatamente después de un barbecho con mucha materia verde incorporada',
    ],
    fuente: 'Umbrales de literatura general sobre noctuidos de suelo.',
  },
  {
    id: 'mosquita-blanca',
    nombreComun: 'Mosquita blanca',
    nombreCientifico: 'Bemisia tabaci',
    tipo: 'insecto',
    cultivos: ['frijol', 'hortalizas', 'jitomate', 'calabaza'],
    temperatura: { min: 10, optimoMin: 25, optimoMax: 32, max: 40 },
    humedadAire: { min: 20, optimoMin: 40, optimoMax: 70, max: 90 },
    gradosDia: { tempBase: 10.2, porGeneracion: 340 },
    cicloBiologico:
      'Los huevos se depositan en el envés de hojas jóvenes. Tras el primer ' +
      'estadio móvil, las ninfas se fijan y ya no se desplazan, lo que las ' +
      'protege de aplicaciones dirigidas al haz. El ciclo se completa en 18 a 30 ' +
      'días según temperatura, y las generaciones se traslapan: se encuentran ' +
      'todos los estados a la vez.',
    danos:
      'Succión de savia, mielecilla y fumagina. Su daño principal no es directo ' +
      'sino la transmisión de geminivirus, que provocan enchinamiento y ' +
      'amarillamiento irreversibles.',
    senalesEnCampo: [
      'Nube de adultos blancos al mover el follaje',
      'Ninfas traslúcidas fijas en el envés, visibles con lupa',
      'Hojas nuevas enchinadas o con mosaico amarillo, indicio de virus',
    ],
    control: {
      mecanico: [
        'Trampas amarillas pegajosas para monitoreo y captura masiva',
        'Acolchado plástico reflejante, que desorienta al adulto en su vuelo de aterrizaje',
        'Eliminar plantas con síntomas de virus: ya no se recuperan y son fuente de contagio',
        'Barreras vivas de maíz o sorgo en el perímetro',
      ],
      biologico: [
        'Parasitoides Encarsia formosa y Eretmocerus spp.',
        'Beauveria bassiana e Isaria fumosorosea sobre ninfas',
        'Jabón potásico y aceites vegetales dirigidos al envés',
      ],
      quimico: [
        'Rotación estricta de grupos IRAC: es de las especies que más rápido genera resistencia',
        'Aplicar dirigido al ENVÉS; la aspersión al haz no alcanza a las ninfas fijas',
        'Evitar aplicaciones calendarizadas sin muestreo previo',
      ],
    },
    prevencion: [
      'Periodo libre de hospedero entre ciclos, para romper la continuidad de la población',
      'Mallas antiáfidos en almácigos y viveros',
      'Eliminar maleza hospedera del entorno',
    ],
    fuente: 'Umbrales de literatura general sobre aleyródidos (CABI, EPPO).',
  },
  {
    id: 'trips',
    nombreComun: 'Trips',
    nombreCientifico: 'Frankliniella occidentalis',
    tipo: 'insecto',
    cultivos: ['hortalizas', 'frijol', 'cebolla', 'jitomate'],
    temperatura: { min: 8, optimoMin: 25, optimoMax: 30, max: 35 },
    humedadAire: { min: 20, optimoMin: 40, optimoMax: 70, max: 85 },
    gradosDia: { tempBase: 9.4, porGeneracion: 230 },
    cicloBiologico:
      'La hembra inserta los huevos dentro del tejido vegetal, donde quedan ' +
      'protegidos. Dos estadios larvales se alimentan en la planta; luego cae al ' +
      'suelo para dos estadios de pupa. Que parte del ciclo ocurra en el suelo ' +
      'explica que las aplicaciones foliares aisladas den resultados parciales.',
    danos:
      'Raspa la epidermis y succiona el contenido celular: deja plateado ' +
      'característico con puntos negros de excremento. Transmite tospovirus ' +
      'como el virus del marchitamiento manchado del jitomate.',
    senalesEnCampo: [
      'Plateado en hojas con puntitos negros de excremento',
      'Deformación y cicatrices en frutos jóvenes',
      'Adultos visibles al sacudir flores sobre una hoja blanca',
    ],
    control: {
      mecanico: [
        'Trampas azules pegajosas, más atractivas que las amarillas para esta especie',
        'Eliminar flores y maleza florida del entorno, donde se concentra',
        'Acolchado reflejante',
      ],
      biologico: [
        'Ácaros depredadores Amblyseius swirskii y Neoseiulus cucumeris',
        'Chinche depredadora Orius insidiosus',
        'Beauveria bassiana dirigida al follaje y Metarhizium al suelo, para alcanzar las pupas',
      ],
      quimico: [
        'Espinosinas (IRAC grupo 5), de las pocas con buena actividad sobre trips',
        'Alto volumen de agua: se esconde en flores y brotes cerrados',
        'Tratar suelo y follaje en conjunto, o los estadios de pupa reinfestan',
      ],
    },
    prevencion: [
      'Manejo de maleza florida en el perímetro',
      'Mallas en estructuras protegidas',
      'Muestreo en floración, la etapa de mayor riesgo de transmisión de virus',
    ],
    fuente: 'Umbrales de literatura general sobre tisanópteros.',
  },

  // ─────────────────────────────────────────────────────────────── ÁCAROS ───
  {
    id: 'arana-roja',
    nombreComun: 'Araña roja',
    nombreCientifico: 'Tetranychus urticae',
    tipo: 'acaro',
    cultivos: ['frijol', 'alfalfa', 'hortalizas', 'jitomate'],
    // Es el contrapunto de los hongos: prospera con calor y aire SECO. Cuando el
    // motor da riesgo alto de roya, esta debe estar baja. Si suben las dos a la
    // vez, hay que sospechar de la lectura del sensor.
    temperatura: { min: 12, optimoMin: 28, optimoMax: 34, max: 40 },
    humedadAire: { min: 0, optimoMin: 20, optimoMax: 45, max: 65 },
    gradosDia: { tempBase: 10.7, porGeneracion: 110 },
    cicloBiologico:
      'Con calor seco completa una generación en menos de una semana, y una ' +
      'hembra deposita más de cien huevos. Esa combinación produce explosiones ' +
      'poblacionales muy rápidas y es la razón de que desarrolle resistencia a ' +
      'acaricidas en pocas aplicaciones. La lluvia y la humedad alta la frenan ' +
      'físicamente.',
    danos:
      'Punteado clorótico fino en el haz por succión celular. En ataques ' +
      'avanzados aparece telaraña en brotes y la hoja se broncea y cae.',
    senalesEnCampo: [
      'Punteado amarillo muy fino, como salpicado, en el haz de la hoja',
      'Telaraña delgada entre brotes y en el envés',
      'Puntos móviles al observar el envés con lupa',
      'Focos iniciales en las orillas polvorientas y junto a caminos',
    ],
    control: {
      mecanico: [
        'Elevar la humedad relativa con aspersión de agua: la humedad alta es adversa para el ácaro',
        'Eliminar hojas basales con focos iniciales antes de que se dispersen',
        'Controlar el polvo en caminos y bordes, que favorece la infestación',
      ],
      biologico: [
        'Ácaro depredador Phytoseiulus persimilis, muy eficaz en focos localizados',
        'Neoseiulus californicus, más tolerante a condiciones secas',
        'Azufre mojable en condiciones frescas, respetando el margen con aplicaciones de aceite',
      ],
      quimico: [
        'Acaricidas específicos: los insecticidas de amplio espectro eliminan a sus depredadores y agravan el problema',
        'Rotar modo de acción cada aplicación',
        'Mojar bien el envés, que es donde se aloja la colonia',
      ],
    },
    prevencion: [
      'Evitar el estrés hídrico prolongado: la planta estresada es más susceptible',
      'No abusar de piretroides, que provocan rebrote de ácaros',
      'Monitoreo intensivo en rachas de calor seco',
    ],
    fuente: 'Umbrales de literatura general sobre tetraníquidos (CABI).',
  },

  // ─────────────────────────────────────────────────── HONGOS Y OOMICETOS ───
  {
    id: 'roya-amarilla',
    nombreComun: 'Roya amarilla',
    nombreCientifico: 'Puccinia striiformis',
    tipo: 'hongo',
    cultivos: ['cebada', 'trigo', 'avena'],
    // La cebada es cultivo mayor en Hidalgo: esta ficha es de las más relevantes
    // para el valle de Tulancingo.
    temperatura: { min: 2, optimoMin: 10, optimoMax: 15, max: 22 },
    humedadAire: { min: 70, optimoMin: 90, optimoMax: 100, max: 100 },
    humectacionFoliarHoras: 6,
    cicloBiologico:
      'La espora necesita agua libre sobre la hoja y temperatura fresca para ' +
      'germinar. Penetra por los estomas y en una o dos semanas forma pústulas ' +
      'que liberan esporas nuevas, dispersadas por el viento a gran distancia. ' +
      'Ese ciclo corto y repetido convierte un foco pequeño en epidemia si el ' +
      'clima fresco y húmedo se sostiene. Temperaturas sobre 22 °C lo detienen.',
    danos:
      'Pústulas amarillas alineadas en franjas entre las nervaduras. Reduce el ' +
      'área fotosintética y el llenado de grano; en ataques tempranos y severos ' +
      'las mermas de rendimiento son cuantiosas.',
    senalesEnCampo: [
      'Pústulas amarillo-anaranjadas en líneas paralelas a la nervadura',
      'Polvo amarillo que se desprende al pasar el dedo por la hoja',
      'Focos iniciales en manchones, luego dispersión a favor del viento',
    ],
    control: {
      mecanico: [
        'Eliminar hospederos voluntarios y gramíneas silvestres entre ciclos',
        'Evitar densidades excesivas de siembra, que impiden que el follaje seque',
      ],
      biologico: [
        'Variedades con resistencia genética: es la herramienta más rentable frente a esta enfermedad',
        'Bacillus subtilis como preventivo en presión baja',
      ],
      quimico: [
        'Triazoles y estrobilurinas (FRAC grupos 3 y 11), aplicados de forma preventiva o al primer foco',
        'Rotar grupo FRAC: las estrobilurinas pierden eficacia con el uso repetido',
        'La aplicación tardía, con la epidemia ya establecida, no recupera el rendimiento perdido',
      ],
    },
    prevencion: [
      'Sembrar variedades resistentes según la recomendación regional vigente',
      'Vigilancia intensiva en periodos frescos con rocío persistente',
      'Fertilización nitrogenada equilibrada: el exceso aumenta la susceptibilidad',
    ],
    fuente:
      'Requisitos de infección de literatura fitopatológica general sobre royas de cereales (CABI, EPPO).',
  },
  {
    id: 'cenicilla-cereales',
    nombreComun: 'Cenicilla polvorienta',
    nombreCientifico: 'Blumeria graminis',
    tipo: 'hongo',
    cultivos: ['cebada', 'trigo', 'avena'],
    // Caso interesante: necesita humedad ALTA pero hoja SECA. Es lo que la
    // separa de la roya ante la misma lectura, y por eso existe el campo
    // `inhibidaPorAguaLibre`.
    temperatura: { min: 5, optimoMin: 15, optimoMax: 22, max: 30 },
    humedadAire: { min: 50, optimoMin: 70, optimoMax: 90, max: 98 },
    inhibidaPorAguaLibre: true,
    cicloBiologico:
      'A diferencia de la roya, su espora germina sin agua libre; de hecho el ' +
      'agua sobre la hoja la inhibe. Se desarrolla con humedad ambiental alta y ' +
      'follaje seco, condición típica de cultivos densos y sombreados. El micelio ' +
      'crece sobre la superficie de la hoja y produce esporas en pocos días.',
    danos:
      'Micelio blanco algodonoso sobre haz y vainas, que después se torna gris ' +
      'con puntos negros. Reduce fotosíntesis y peso de grano.',
    senalesEnCampo: [
      'Polvo blanco superficial que se desprende al frotar',
      'Comienza en hojas bajas y sombreadas, y avanza hacia arriba',
      'Puntos negros (cleistotecios) en lesiones viejas',
    ],
    control: {
      mecanico: [
        'Reducir densidad de siembra para mejorar la circulación de aire',
        'Eliminar residuos infectados del ciclo anterior',
      ],
      biologico: [
        'Azufre mojable, eficaz y de bajo costo en presión baja o moderada',
        'Bicarbonato potásico como alternativa de contacto',
        'Bacillus subtilis en programa preventivo',
      ],
      quimico: [
        'Inhibidores de la desmetilación (FRAC grupo 3)',
        'Aplicar al detectar los primeros focos en hojas bajas, no cuando ya cubrió el follaje',
      ],
    },
    prevencion: [
      'Variedades resistentes',
      'Evitar el exceso de nitrógeno, que produce follaje denso y susceptible',
      'Orientar surcos favoreciendo la ventilación',
    ],
    fuente: 'Requisitos de literatura fitopatológica general sobre erisifáceas.',
  },
  {
    id: 'tizon-tardio',
    nombreComun: 'Tizón tardío',
    nombreCientifico: 'Phytophthora infestans',
    tipo: 'oomiceto',
    cultivos: ['papa', 'jitomate'],
    temperatura: { min: 4, optimoMin: 15, optimoMax: 21, max: 27 },
    humedadAire: { min: 75, optimoMin: 90, optimoMax: 100, max: 100 },
    humectacionFoliarHoras: 8,
    cicloBiologico:
      'Con humedad relativa por encima de 90 % y temperaturas de 15 a 21 °C, el ' +
      'esporangio germina y libera zoosporas móviles que nadan en la película de ' +
      'agua sobre la hoja. Un ciclo de infección se completa en menos de una ' +
      'semana. Es la enfermedad que causó la hambruna irlandesa: bajo condiciones ' +
      'favorables sostenidas, arrasa un cultivo en días.',
    danos:
      'Manchas acuosas verde oscuro que se vuelven necróticas, con un fieltro ' +
      'blanquecino en el envés al amanecer. Avanza a tallos y tubérculos.',
    senalesEnCampo: [
      'Manchas irregulares que empiezan en el borde de la hoja, con halo amarillento',
      'Vello blanco en el envés en las primeras horas del día',
      'Olor a descomposición en focos avanzados',
      'Lesiones pardas hundidas en tubérculo al corte',
    ],
    control: {
      mecanico: [
        'Eliminar y enterrar plantas enfermas fuera de la parcela; no dejarlas en el borde',
        'Aporque alto para proteger los tubérculos de las esporas que se lavan desde el follaje',
        'Riego por goteo en lugar de aspersión: no mojar el follaje',
        'Regar temprano para que la hoja seque antes de la noche',
      ],
      biologico: [
        'Caldo bordelés y productos cúpricos, de acción preventiva',
        'Bacillus subtilis y Trichoderma como complemento en presión baja',
      ],
      quimico: [
        'Programa PREVENTIVO en cuanto el clima entra en zona favorable: en curativo la enfermedad ya ganó',
        'Alternar contacto y sistémico, rotando grupo FRAC',
        'Acortar el intervalo entre aplicaciones mientras persistan las condiciones favorables',
      ],
    },
    prevencion: [
      'Semilla certificada libre del patógeno',
      'Rotación de cultivo, evitando solanáceas consecutivas',
      'Vigilancia estrecha cuando coinciden noches frescas y humedad alta sostenida',
    ],
    fuente:
      'Condiciones de infección de literatura fitopatológica general; el criterio se apoya en el ' +
      'concepto clásico de "periodo Smith" (temperatura mínima ≥ 10 °C y HR ≥ 90 % durante horas consecutivas).',
  },

  // ────────────────────────────────────────────────────── PLAGAS DE SUELO ───
  {
    id: 'gallina-ciega',
    nombreComun: 'Gallina ciega',
    nombreCientifico: 'Phyllophaga spp.',
    tipo: 'suelo',
    cultivos: ['maíz', 'avena', 'pastos', 'alfalfa'],
    temperatura: { min: 10, optimoMin: 18, optimoMax: 26, max: 33 },
    humedadAire: { min: 0, optimoMin: 40, optimoMax: 90, max: 100 },
    humedadSuelo: { min: 20, optimoMin: 40, optimoMax: 70, max: 90 },
    cicloBiologico:
      'Ciclo largo, de uno a tres años según la especie. Los adultos emergen con ' +
      'las primeras lluvias, se aparean y la hembra ovipone en suelo húmedo con ' +
      'materia orgánica. La larva vive bajo tierra alimentándose de raíces, y es ' +
      'en el segundo y tercer estadio cuando causa el daño económico.',
    danos:
      'Consume raíces. La planta se marchita sin causa aparente en el follaje y ' +
      'se desprende con facilidad al jalarla. El daño aparece en manchones.',
    senalesEnCampo: [
      'Marchitez en manchones sin lesión visible en la parte aérea',
      'La planta sale sin resistencia al jalarla, con raíz comida',
      'Larvas blancas en forma de C al escarbar 10 a 20 cm',
      'Vuelo masivo de adultos alrededor de luces tras las primeras lluvias',
    ],
    control: {
      mecanico: [
        'Barbecho profundo para exponer larvas a aves y a la desecación solar',
        'Muestreo con calicatas antes de sembrar para decidir si el lote lo amerita',
        'Trampas de luz para capturar adultos durante el vuelo',
      ],
      biologico: [
        'Nematodos entomopatógenos (Heterorhabditis spp.) aplicados con humedad suficiente',
        'Metarhizium anisopliae incorporado al suelo',
        'Favorecer la presencia de aves durante el barbecho',
      ],
      quimico: [
        'Tratamiento a la semilla, medida más eficiente que la aplicación al voleo',
        'La aplicación foliar no sirve: la plaga está bajo tierra',
      ],
    },
    prevencion: [
      'Evitar incorporar estiércol fresco antes de sembrar, que atrae la ovipostura',
      'Rotación con cultivos no hospederos',
      'Llevar registro de los lotes con historial: el problema es persistente por lote',
    ],
    fuente: 'Umbrales aproximados de literatura general sobre melolóntidos.',
  },
  {
    id: 'pudricion-radicular',
    nombreComun: 'Pudrición radicular',
    nombreCientifico: 'Fusarium spp.',
    tipo: 'suelo',
    cultivos: ['maíz', 'frijol', 'hortalizas', 'cebada'],
    temperatura: { min: 10, optimoMin: 22, optimoMax: 30, max: 37 },
    humedadAire: { min: 0, optimoMin: 50, optimoMax: 100, max: 100 },
    humedadSuelo: { min: 60, optimoMin: 80, optimoMax: 100, max: 100 },
    cicloBiologico:
      'El hongo persiste en el suelo por años como clamidosporas. Germina y ' +
      'penetra por raíces cuando el suelo se mantiene saturado y la planta está ' +
      'estresada por falta de oxígeno. Coloniza el sistema vascular y bloquea el ' +
      'ascenso de agua, de modo que la planta se marchita aun con suelo húmedo: ' +
      'ese contraste es el signo más característico.',
    danos:
      'Marchitez que no responde al riego, amarillamiento ascendente y ' +
      'estrangulamiento pardo en el cuello. Al cortar el tallo se ve el anillo ' +
      'vascular oscurecido.',
    senalesEnCampo: [
      'Planta marchita en suelo húmedo o encharcado',
      'Lesión parda hundida en la base del tallo',
      'Anillo vascular café al cortar el tallo longitudinalmente',
      'Raíces oscuras y quebradizas, sin raicillas blancas',
    ],
    control: {
      mecanico: [
        'Corregir el drenaje: es la medida de fondo, sin ella lo demás es paliativo',
        'Siembra en camas altas para que la corona no quede encharcada',
        'Eliminar plantas afectadas junto con el cepellón, sin sacudir el suelo infestado',
      ],
      biologico: [
        'Trichoderma harzianum incorporado al suelo o aplicado a la semilla',
        'Bacillus subtilis en drench al cuello',
        'Incorporar materia orgánica bien composteada para favorecer la microbiota antagonista',
      ],
      quimico: [
        'Tratamiento a la semilla como medida preventiva',
        'Los fungicidas en drench dan resultado limitado si no se corrige el exceso de agua',
      ],
    },
    prevencion: [
      'No regar en exceso: revisar la lectura de humedad de suelo antes de cada riego',
      'Rotación con cultivos no hospederos',
      'Evitar heridas en el cuello durante las labores de cultivo',
    ],
    fuente:
      'Condiciones generales de literatura fitopatológica sobre pudriciones radiculares asociadas a ' +
      'saturación hídrica.',
  },
] as const;

/** Búsqueda por identificador. `undefined` si no existe. */
export function buscarPlaga(id: string): Plaga | undefined {
  return CATALOGO_PLAGAS.find((p) => p.id === id);
}

/**
 * Plagas que afectan a un cultivo dado. Sin filtro devuelve el catálogo completo.
 *
 * `fuente` permite pasar un catálogo distinto del que trae el proyecto —por
 * ejemplo el ya calibrado con las observaciones de la parcela— sin que el
 * filtrado por cultivo tenga que duplicarse.
 */
export function plagasPorCultivo(
  cultivo?: string,
  fuente: readonly Plaga[] = CATALOGO_PLAGAS
): readonly Plaga[] {
  if (!cultivo) return fuente;

  const buscado = cultivo.trim().toLowerCase();
  const coincidencias = fuente.filter((p) =>
    p.cultivos.some((c) => c.toLowerCase() === buscado)
  );

  // Un cultivo que no está en el catálogo no debe dejar al agricultor sin
  // análisis: es preferible evaluarlo todo a no devolver nada.
  return coincidencias.length > 0 ? coincidencias : fuente;
}
