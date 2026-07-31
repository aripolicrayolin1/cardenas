import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Permite compilar a una carpeta distinta de `.next` (p. ej. para verificar
  // un build mientras el servidor de desarrollo sigue levantado, sin que ambos
  // procesos se pisen los artefactos):
  //   NEXT_DIST_DIR=.next-build npx next build
  distDir: process.env.NEXT_DIST_DIR || '.next',

  // TypeScript vuelve a bloquear el build. Estaba desactivado y ocultaba errores
  // reales: `calendar.tsx` seguía usando la API v8 de react-day-picker.

  eslint: {
    // Sigue desactivado, pero no por conveniencia: este proyecto NO tiene
    // configuración de ESLint ni la dependencia instalada, así que activarlo
    // rompería el build sin aportar nada. Para habilitarlo de verdad:
    //   npm i -D eslint eslint-config-next
    //   echo '{ "extends": "next/core-web-vitals" }' > .eslintrc.json
    // y luego quitar esta sección.
    ignoreDuringBuilds: true,
  },

  // Límite del cuerpo de las Server Actions. El diagnóstico envía la foto como
  // data URI en base64 y el valor por defecto de Next.js es 1 MB: una foto de
  // móvil lo supera y la acción falla justo en el dispositivo del usuario
  // objetivo. El cliente además reescala antes de enviar (ver lib/imagen.ts).
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },

  // `/diagnosis-pro` se fusionó con `/diagnosis`. La redirección vive aquí y no
  // en una página con `redirect()` porque esa forma rompía `next build`: Next
  // intenta prerenderizar la ruta estáticamente, el `redirect()` lanza durante
  // la generación y el módulo de página nunca llega a emitirse, de modo que el
  // export falla con `PageNotFoundError`. Resuelta en la configuración es un
  // 308 real, sin React de por medio y sin nada que empaquetar.
  async redirects() {
    return [
      {
        source: '/diagnosis-pro',
        destination: '/diagnosis',
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
