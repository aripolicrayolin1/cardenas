"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Snowflake,
  Bug,
  Droplets,
  StickyNote,
  Activity,
  Camera,
  Plus,
  Loader2,
  Trash2,
  Cpu,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { useBitacora } from "@/hooks/bitacora/use-bitacora";
import { DiarioNarrado } from "@/components/bitacora/diario-narrado";
import type { EntradaBitacora, TipoEntrada } from "@/services/bitacora";

/**
 * @fileOverview Bitácora de la parcela: el diario de la finca.
 *
 * Reúne en una línea de tiempo lo que la app detecta sola (helada, riego,
 * plagas) y lo que el agricultor apunta a mano. Es el historial real de la
 * parcela y, con el tiempo, el dataset propio para el modelo local.
 */

const ICONO_TIPO: Record<TipoEntrada, { icono: typeof Snowflake; color: string; bg: string }> = {
  helada: { icono: Snowflake, color: "text-cyan-600", bg: "bg-cyan-500/10" },
  plaga: { icono: Bug, color: "text-red-600", bg: "bg-red-500/10" },
  riego: { icono: Droplets, color: "text-sky-600", bg: "bg-sky-500/10" },
  sensor: { icono: Activity, color: "text-violet-600", bg: "bg-violet-500/10" },
  diagnostico: { icono: Camera, color: "text-primary", bg: "bg-primary/10" },
  nota: { icono: StickyNote, color: "text-amber-600", bg: "bg-amber-500/10" },
};

function fechaLegible(entrada: EntradaBitacora): string {
  const ms = entrada.createdAt?.toMillis?.();
  if (!ms) return "Ahora";
  return new Date(ms).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BitacoraPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { entradas, cargando, guardando, anotar, eliminar } = useBitacora();

  const [nota, setNota] = useState("");

  const handleAnotar = async () => {
    if (!nota.trim()) return;
    const { valor, error } = await anotar({ tipo: "nota", texto: nota, automatica: false });
    if (!valor) {
      toast({ title: "No se pudo guardar", description: error ?? undefined, variant: "destructive" });
      return;
    }
    setNota("");
    toast({ title: "Anotado", description: "Tu nota quedó en la bitácora." });
  };

  const handleEliminar = async (id: string) => {
    const { valor, error } = await eliminar(id);
    if (!valor) {
      toast({ title: "No se pudo eliminar", description: error ?? undefined, variant: "destructive" });
    }
  };

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white/40 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <SidebarTrigger />
          <h1 className="text-xl font-black text-primary tracking-tight" suppressHydrationWarning>{t('logbook')}</h1>
        </header>

        <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 w-full pb-16">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tighter text-foreground/80" suppressHydrationWarning>{t('logbook_title')}</h2>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground" suppressHydrationWarning>{t('logbook_desc')}</p>
          </div>

          {/* Narración semanal (diario que habla) */}
          <DiarioNarrado entradas={entradas} />

          {/* Composer de nota manual */}
          <div className="glass-card rounded-3xl p-4 flex gap-2 items-center">
            <Input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !guardando && handleAnotar()}
              placeholder={t('logbook_placeholder')}
              className="rounded-2xl h-12 font-medium bg-white/50 border-primary/10"
              maxLength={500}
            />
            <Button
              onClick={handleAnotar}
              disabled={guardando || !nota.trim()}
              className="rounded-2xl h-12 px-5 font-black shrink-0"
            >
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
            </Button>
          </div>

          {/* Línea de tiempo */}
          {cargando ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
            </div>
          ) : entradas.length === 0 ? (
            <div className="glass-card rounded-3xl p-10 flex flex-col items-center gap-3 text-center">
              <BookOpen className="h-10 w-10 text-primary/20" />
              <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-sm" suppressHydrationWarning>
                {t('logbook_empty')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entradas.map((entrada) => {
                const estilo = ICONO_TIPO[entrada.tipo] ?? ICONO_TIPO.nota;
                const Icono = estilo.icono;
                return (
                  <div key={entrada.id} className="glass-card rounded-2xl p-4 flex gap-3 items-start group">
                    <div className={`p-2.5 rounded-2xl ${estilo.bg} ${estilo.color} shrink-0`}>
                      <Icono className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground/85 leading-snug">{entrada.texto}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {fechaLegible(entrada)}
                        </span>
                        {entrada.automatica && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-primary/60 uppercase tracking-widest">
                            <Cpu className="h-2.5 w-2.5" /> Auto
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleEliminar(entrada.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Eliminar entrada"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
