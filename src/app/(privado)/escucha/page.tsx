"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { EscuchaPlagas } from "@/components/acustica/escucha-plagas";
import { useTranslation } from "@/hooks/use-translation";

/**
 * @fileOverview Escucha acústica: detectar plagas por su sonido.
 *
 * Requiere sesión porque anota los hallazgos relevantes en la bitácora privada
 * de la parcela.
 */
export default function EscuchaPage() {
  const { t } = useTranslation();

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white/40 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <SidebarTrigger />
          <h1 className="text-xl font-black text-primary tracking-tight" suppressHydrationWarning>
            {t('acoustic')}
          </h1>
        </header>

        <main className="max-w-2xl mx-auto p-4 md:p-8 space-y-6 w-full pb-16">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter text-foreground/80" suppressHydrationWarning>
              {t('acoustic_title')}
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground" suppressHydrationWarning>
              {t('acoustic_desc')}
            </p>
          </div>

          <EscuchaPlagas />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
