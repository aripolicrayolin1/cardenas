"use client";

import Link from "next/link";
import { ArrowUpRight, Cpu, WifiOff, Radio, Bug } from "lucide-react";

import type { LecturaSensores } from "@/config/sensor-schema";
import { CATALOGO_PLAGAS, analizarDesdeLectura, type NivelRiesgo } from "@/lib/plagas";

/**
 * @fileOverview Franja de estado en superficie oscura, encabezado del panel.
 *
 * Concentra en un solo bloque lo que el agricultor necesita saber antes que
 * nada: si hay riesgo sanitario hoy y sobre qué especie. El resto del panel
 * está en superficies claras, así que este bloque oscuro se lee como el punto
 * de entrada natural sin necesidad de flechas ni instrucciones.
 *
 * El veredicto lo calcula el mismo motor local que usa la herramienta de
 * análisis: no es un resumen escrito aparte que pueda contradecirla.
 */

interface HeroEstadoProps {
  lectura: LecturaSensores;
  isOnline: boolean;
  nombre?: string | null;
}

const ESTILO_RIESGO: Record<NivelRiesgo, { texto: string; punto: string; etiqueta: string }> = {
  alto: { texto: "text-accent", punto: "bg-accent", etiqueta: "Riesgo alto" },
  medio: { texto: "text-accent/85", punto: "bg-accent/85", etiqueta: "Riesgo moderado" },
  bajo: { texto: "text-deep-foreground/70", punto: "bg-deep-foreground/50", etiqueta: "Presión baja" },
  nulo: { texto: "text-deep-foreground/70", punto: "bg-deep-foreground/40", etiqueta: "Sin presión" },
};

export function HeroEstado({ lectura, isOnline, nombre }: HeroEstadoProps) {
  // Sin conexión la lectura es de ceros y el análisis no significaría nada.
  const analisis = isOnline ? analizarDesdeLectura(lectura) : null;
  const principal = analisis?.relevantes[0];
  const nivel: NivelRiesgo = analisis?.riesgoGeneral ?? "nulo";
  const estilo = ESTILO_RIESGO[nivel];

  return (
    <div className="surface-deep rounded-[2rem] p-7 md:p-10 relative overflow-hidden">
      <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="pill bg-white/10 border border-white/15 text-deep-foreground/80">
              {isOnline ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-accent" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {isOnline ? "Estación transmitiendo" : "Estación sin señal"}
            </div>

            <div className="pill bg-white/10 border border-white/15 text-deep-foreground/80">
              <Cpu className="h-3 w-3" />
              Motor local
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-deep-foreground/60">
              {nombre ? `Hola, ${nombre}` : "Panel de la finca"}
            </p>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.95]">
              {!isOnline ? (
                <>Esperando datos de tu estación</>
              ) : principal ? (
                <>
                  Hoy hay condiciones para
                  <br />
                  <span className={estilo.texto}>{principal.plaga.nombreComun.toLowerCase()}</span>
                </>
              ) : (
                <>
                  Sin presión sanitaria
                  <br />
                  <span className="text-accent">en tu parcela</span>
                </>
              )}
            </h1>
            <p className="text-sm text-deep-foreground/65 leading-relaxed max-w-lg font-medium">
              {!isOnline
                ? "El ESP32 no está publicando lecturas. En cuanto se conecte, el análisis se ejecuta solo."
                : principal
                  ? principal.explicacion
                  : `Ninguna de las ${CATALOGO_PLAGAS.length} especies del catálogo encuentra condiciones para desarrollarse con la lectura actual.`}
            </p>
          </div>

          <Link
            href="/tecnologia"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-accent-foreground hover:brightness-105 transition-all shadow-lg shadow-accent/20"
          >
            Cómo funciona el motor
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Resumen numérico */}
        <div className="grid grid-cols-3 gap-3">
          <DatoHero
            valor={isOnline ? `${lectura.temperatura.toFixed(0)}°` : "--"}
            etiqueta="Temperatura"
          />
          <DatoHero
            valor={isOnline ? `${lectura.humedadAire.toFixed(0)}%` : "--"}
            etiqueta="Hum. aire"
          />
          <DatoHero
            valor={isOnline ? `${lectura.humedadSuelo.toFixed(0)}%` : "--"}
            etiqueta="Suelo"
          />

          <div className="col-span-3 rounded-3xl bg-white/[0.07] border border-white/10 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-deep-foreground/50">
                Veredicto del motor
              </span>
              <Bug className="h-3.5 w-3.5 text-deep-foreground/40" />
            </div>

            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${estilo.punto}`} />
              <span className="text-lg font-black tracking-tighter">
                {isOnline ? estilo.etiqueta : "Sin datos"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold text-deep-foreground/45">
              <Radio className="h-3 w-3" />
              {CATALOGO_PLAGAS.length} especies evaluadas · sin conexión
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DatoHero({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-3xl bg-white/[0.07] border border-white/10 p-4 space-y-1">
      <p className="text-2xl md:text-3xl font-black tracking-tighter tabular-nums leading-none">
        {valor}
      </p>
      <p className="text-[9px] font-black uppercase tracking-widest text-deep-foreground/50 leading-tight">
        {etiqueta}
      </p>
    </div>
  );
}
