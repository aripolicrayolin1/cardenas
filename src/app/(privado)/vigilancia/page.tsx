"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ModoVigilancia } from "@/components/vigilancia/modo-vigilancia";
import { useTranslation } from "@/hooks/use-translation";
import { useFincas } from "@/hooks/fincas/use-fincas";
import { useMemo, useState } from "react";

/**
 * @fileOverview Vigilancia de la parcela.
 *
 * El sensor de movimiento del nodo dispara una captura de cámara que la IA
 * clasifica: plaga, animal o persona. Requiere sesión porque anota en la
 * bitácora privada del agricultor.
 */
export default function VigilanciaPage() {
  const { t } = useTranslation();
  const { fincas } = useFincas();
  const [fincaSelId, setFincaSelId] = useState<string | null>(null);

  const fincasConSensor = useMemo(() => fincas.filter((f) => f.deviceId), [fincas]);
  const deviceId = fincas.find((f) => f.id === fincaSelId)?.deviceId;

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white/40 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <SidebarTrigger />
          <h1 className="text-xl font-black text-primary tracking-tight" suppressHydrationWarning>
            {t('surveillance')}
          </h1>
        </header>

        <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 w-full pb-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter text-foreground/80" suppressHydrationWarning>
                {t('surveillance_title')}
              </h2>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground" suppressHydrationWarning>
                {t('surveillance_desc')}
              </p>
            </div>

            {/* Selector sólo si hay parcelas con sensor propio. */}
            {fincasConSensor.length > 0 && (
              <select
                value={fincaSelId ?? ""}
                onChange={(e) => setFincaSelId(e.target.value || null)}
                className="rounded-full bg-white/60 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-widest px-3 py-1.5 outline-none cursor-pointer"
                aria-label="Elegir parcela"
              >
                <option value="">Sensor principal</option>
                {fincasConSensor.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <ModoVigilancia deviceId={deviceId} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
