'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useUser } from '@/firebase/auth/use-user';

/**
 * @fileOverview Guarda de rutas privadas.
 *
 * Equivale a `routes/RutaPrivada.jsx` de unus_v2: comprueba la sesión en un
 * solo sitio en lugar de repetir la condición en cada página.
 *
 * Antes no existía ninguna protección: `/farms` y `/settings` se renderizaban
 * sin sesión y cada componente decidía por su cuenta qué esconder.
 *
 * Sólo cubre las rutas que necesitan sesión de verdad. El panel, el monitoreo,
 * el diagnóstico y el mercado comunitario siguen siendo públicos a propósito:
 * un agricultor debería poder consultar los sensores y los precios sin
 * registrarse.
 *
 * Esto es comodidad de interfaz, no seguridad. Quien manda son
 * `firestore.rules` y `database.rules.json`.
 */
export function RutaPrivada({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading || user) return;

    // Se guarda el destino para volver aquí después de entrar.
    const destino = encodeURIComponent(pathname);
    router.replace(`/login?volverA=${destino}`);
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Ya se lanzó la redirección; no pintamos contenido privado entretanto.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Necesitas iniciar sesión
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
