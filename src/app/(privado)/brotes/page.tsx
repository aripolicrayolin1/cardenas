"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { PanelBrotes } from "@/components/epidemiologia/panel-brotes";
import { useTranslation } from "@/hooks/use-translation";

/**
 * @fileOverview Mapa epidemiológico: seguimiento del frente de un brote.
 *
 * Requiere sesión porque cruza los reportes de la comunidad con las parcelas
 * del usuario para estimar cuándo le llegaría la plaga a cada una.
 */
export default function BrotesPage() {
  const { t } = useTranslation();

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white/40 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <SidebarTrigger />
          <h1 className="text-xl font-black text-primary tracking-tight" suppressHydrationWarning>
            {t('outbreaks')}
          </h1>
        </header>

        <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 w-full pb-16">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter text-foreground/80" suppressHydrationWarning>
              {t('outbreaks_title')}
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground" suppressHydrationWarning>
              {t('outbreaks_desc')}
            </p>
          </div>

          <PanelBrotes />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
