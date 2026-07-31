/**
 * @fileOverview Punto ÚNICO donde el código conoce los nombres de las variables
 * de entorno. Ningún otro archivo debe leer `process.env` directamente.
 *
 * Se distinguen dos grupos:
 *
 *  - `publicEnv`  → variables `NEXT_PUBLIC_*`. Next.js las incrusta en el bundle
 *                   en tiempo de compilación, así que viajan al navegador y NO
 *                   son secretas. Se validan al importar el módulo: si falta una,
 *                   la app no arranca.
 *
 *  - `getServerEnv()` → secretos que sólo existen en el servidor y sólo en
 *                   runtime. Se validan de forma perezosa (la primera vez que se
 *                   piden) para no romper `next build` en entornos donde las
 *                   variables se inyectan al desplegar, no al compilar.
 *
 * Sin zod a propósito: este módulo entra en el bundle del navegador y no
 * merece la pena arrastrar ~14 kB para comprobar que siete cadenas no están
 * vacías. La validación de datos de verdad (los que llegan del ESP32 o de la
 * IA en runtime) sí usa esquemas, pero sólo en servidor.
 */

// =============================================================================
// Helpers
// =============================================================================

type Faltante = { nombre: string; motivo: string };

function texto(nombre: string, valor: string | undefined, faltantes: Faltante[]): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    faltantes.push({ nombre, motivo: 'ausente o vacía' });
    return '';
  }
  return valor;
}

function url(nombre: string, valor: string | undefined, faltantes: Faltante[]): string {
  const v = texto(nombre, valor, faltantes);
  if (v && !/^https?:\/\//i.test(v)) {
    faltantes.push({ nombre, motivo: `no es una URL válida ("${v}")` });
  }
  return v;
}

function describir(faltantes: Faltante[]): string {
  return faltantes.map((f) => `  - ${f.nombre}: ${f.motivo}`).join('\n');
}

// =============================================================================
// Público (navegador + servidor)
// =============================================================================

export interface PublicEnv {
  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

const faltantesPublicas: Faltante[] = [];

// Cada variable se referencia de forma literal a propósito: Next.js sólo
// sustituye `process.env.NEXT_PUBLIC_X` cuando el acceso es estático.
// Un `process.env[nombre]` dinámico llegaría como `undefined` al navegador.
const firebase = {
  apiKey: texto(
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    faltantesPublicas
  ),
  authDomain: texto(
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    faltantesPublicas
  ),
  databaseURL: url(
    'NEXT_PUBLIC_FIREBASE_DATABASE_URL',
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    faltantesPublicas
  ),
  projectId: texto(
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    faltantesPublicas
  ),
  storageBucket: texto(
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    faltantesPublicas
  ),
  messagingSenderId: texto(
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    faltantesPublicas
  ),
  appId: texto(
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    faltantesPublicas
  ),
};

if (faltantesPublicas.length > 0) {
  throw new Error(
    'Configuración pública inválida. Revisa las variables NEXT_PUBLIC_FIREBASE_* ' +
      'en tu .env (usa .env.example como plantilla).\n' +
      describir(faltantesPublicas)
  );
}

export const publicEnv: PublicEnv = { firebase };

// =============================================================================
// Servidor (nunca llega al navegador)
// =============================================================================

export interface ServerEnv {
  geminiApiKey: string;
  /** Llave de Pl@ntNet (opcional): identificación botánica especializada. */
  plantnetApiKey: string;
  telegram: {
    botToken: string;
    chatId: string;
  };
}

let serverEnvCache: ServerEnv | null = null;

function leerServerEnv(): { env: ServerEnv; faltantes: Faltante[] } {
  const faltantes: Faltante[] = [];

  const env: ServerEnv = {
    geminiApiKey: texto('GEMINI_API_KEY', process.env.GEMINI_API_KEY, faltantes),
    // Opcional: no se añade a `faltantes`, así que su ausencia no bloquea la app.
    // Pl@ntNet es una segunda opinión; si no hay llave, el diagnóstico usa Gemini.
    plantnetApiKey: (process.env.PLANTNET_API_KEY ?? '').trim(),
    telegram: {
      botToken: texto('TELEGRAM_BOT_TOKEN', process.env.TELEGRAM_BOT_TOKEN, faltantes),
      chatId: texto('TELEGRAM_CHAT_ID', process.env.TELEGRAM_CHAT_ID, faltantes),
    },
  };

  return { env, faltantes };
}

/**
 * Devuelve los secretos del servidor ya validados.
 * Lanza si falta alguno: es preferible fallar con un mensaje claro a hacer una
 * petición que devolverá un 401 opaco.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() no puede llamarse desde el navegador.');
  }

  if (serverEnvCache) return serverEnvCache;

  const { env, faltantes } = leerServerEnv();

  if (faltantes.length > 0) {
    throw new Error(
      'Faltan variables de entorno del servidor.\n' + describir(faltantes)
    );
  }

  serverEnvCache = env;
  return serverEnvCache;
}

/**
 * Variante que no lanza, para código que se ejecuta en tiempo de módulo
 * (donde una excepción rompería el build). Devuelve `null` si falta algo.
 */
export function tryGetServerEnv(): ServerEnv | null {
  if (typeof window !== 'undefined') return null;
  if (serverEnvCache) return serverEnvCache;

  const { env, faltantes } = leerServerEnv();
  if (faltantes.length > 0) return null;

  serverEnvCache = env;
  return serverEnvCache;
}
