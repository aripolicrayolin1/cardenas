import type { ReactNode } from 'react';

import { RutaPrivada } from '@/routes/RutaPrivada';

/**
 * Layout del grupo de rutas privadas.
 *
 * `(privado)` es un grupo de rutas de Next.js: los paréntesis hacen que el
 * segmento NO aparezca en la URL. `/farms` y `/settings` siguen estando donde
 * estaban; lo único que cambia es que ahora comparten esta comprobación de
 * sesión.
 */
export default function LayoutPrivado({ children }: { children: ReactNode }) {
  return <RutaPrivada>{children}</RutaPrivada>;
}
