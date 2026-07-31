"use client";

import { useMemo, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { PanelCalibracion } from "@/components/plagas/panel-calibracion";
import { useTranslation } from "@/hooks/use-translation";
import { useFincas } from "@/hooks/fincas/use-fincas";
import { useCalibracion } from "@/hooks/plagas/use-calibracion";

/**
 * @fileOverview Aprendizaje del motor: qué ha aprendido de cada parcela.
 *
 * La calibración es POR parcela —dos terrenos del mismo dueño pueden tener
 * microclimas distintos—, así que la página empieza por elegir cuál se mira.
 */
export default function AprendizajePage() {
  const { t } = useTranslation();
  const { fincas, cargando: cargandoFincas } = useFincas();

  const [fincaId, setFincaId] = useState<string | null>(null);
  const elegida = useMemo(
    () => fincaId ?? (fincas.length > 0 ? fincas[0].id : null),
    [fincaId, fincas]
  );

  const { estados, resumen, cargando } = useCalibracion(elegida);

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white/40 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <SidebarTrigger />
          <h1 className="text-xl font-black text-primary tracking-tight" suppressHydrationWarning>
            {t('learning')}
          </h1>
        </header>

        <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 w-full pb-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter text-foreground/80" suppressHydrationWarning>
                {t('learning_title')}
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground" suppressHydrationWarning>
                {t('learning_desc')}
              </p>
            </div>

            {fincas.length > 1 && (
              <select
                value={elegida ?? ""}
                onChange={(e) => setFincaId(e.target.value)}
                className="rounded-full bg-white/60 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-widest px-3 py-1.5 outline-none cursor-pointer"
                aria-label="Elegir parcela"
              >
                {fincas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!cargandoFincas && fincas.length === 0 ? (
            <div className="glass-card rounded-3xl p-8">
              <p className="text-sm font-black text-foreground/85 mb-2">Primero registra una parcela</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                La calibración es por parcela, porque cada terreno tiene su microclima. Da de alta
                una finca para que el motor pueda empezar a aprender de ella.
              </p>
            </div>
          ) : cargando ? (
            <div className="glass-card rounded-3xl p-10 flex justify-center">
              <span className="text-xs font-bold text-muted-foreground">Cargando observaciones…</span>
            </div>
          ) : (
            <PanelCalibracion estados={estados} resumen={resumen} />
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
