"use client";

import { useEffect, useMemo } from "react";
import {
  Snowflake,
  CloudRain,
  Sun,
  Cloud,
  Bug,
  CalendarClock,
  WifiOff,
  ShieldAlert,
  Loader2,
  Droplets,
  History,
} from "lucide-react";
import { useClima } from "@/hooks/clima/use-clima";
import { useAgroclima } from "@/hooks/clima/use-agroclima";
import { useBitacora } from "@/hooks/bitacora/use-bitacora";
import { analizarRiesgoPlagas } from "@/lib/plagas";
import { compararConNormal } from "@/services/agroclima";
import { dewPoint } from "@/lib/sensors";
import type { DiaPronostico } from "@/services/clima";

/**
 * @fileOverview Pronóstico agroclimático del dashboard.
 *
 * Junta tres cosas que un agricultor usa para planificar, no para describir el
 * presente:
 *  1. Aviso ANTICIPADO de helada (el evento que arruina una cosecha aquí).
 *  2. El pronóstico de 3 días (temperatura, lluvia, humedad).
 *  3. Qué plagas se van a FAVORECER mañana, corriendo el motor local sobre las
 *     condiciones pronosticadas en vez de sobre la lectura actual.
 *
 * Todo esto necesita red (el pronóstico viene de Open-Meteo). Si no hay señal se
 * muestra un estado honesto: el diagnóstico por sensores sigue funcionando.
 *
 * Además, cuando detecta riesgo alto de helada, lo anota UNA vez al día en la
 * bitácora, para que quede en el historial de la parcela.
 */

interface PronosticoClimaProps {
  /** Humedad de suelo actual (del sensor), para el pronóstico de plagas. */
  humedadSueloActual: number;
  /** Temperatura actual (del sensor), para comparar con la normal histórica. */
  tempActual?: number;
  /** `true` si el sensor está transmitiendo (habilita la comparación histórica). */
  sensorEnLinea?: boolean;
  /** Coordenadas de la finca; si no hay, se usa Tulancingo. */
  coords?: { lat: number; lng: number } | null;
}

function iconoDia(dia: DiaPronostico) {
  if (dia.probLluvia >= 50) return CloudRain;
  if (dia.humedadMedia >= 75) return Cloud;
  return Sun;
}

function nombreDia(fecha: string, indice: number): string {
  if (indice === 0) return "Hoy";
  if (indice === 1) return "Mañana";
  return new Date(fecha + "T12:00:00").toLocaleDateString([], { weekday: "short" });
}

export function PronosticoClima({ humedadSueloActual, tempActual, sensorEnLinea, coords }: PronosticoClimaProps) {
  const { pronostico, helada, cargando, error } = useClima(coords);
  const { normales } = useAgroclima(coords);
  const { registrarEvento, puedeEscribir } = useBitacora();

  // Comparación de la temperatura actual contra la normal histórica del mes.
  const contexto =
    sensorEnLinea && tempActual !== undefined && normales
      ? compararConNormal(tempActual, normales, new Date().getMonth())
      : null;

  // Registrar la helada en la bitácora, una vez por día.
  useEffect(() => {
    if (!puedeEscribir || helada?.riesgo !== "alto" || !helada.dia) return;
    registrarEvento(
      {
        tipo: "helada",
        texto: `Riesgo de helada previsto para la noche del ${helada.dia.fecha} (mínima de ${helada.dia.tempMin.toFixed(0)} °C). Conviene cubrir las plantas o preparar riego.`,
      },
      helada.dia.fecha
    );
  }, [helada, puedeEscribir, registrarEvento]);

  // Pronóstico de plagas: motor local sobre las condiciones de mañana.
  const plagasManana = useMemo(() => {
    const dia = pronostico?.dias[1] ?? pronostico?.dias[0];
    if (!dia) return null;

    const temperatura = (dia.tempMax + dia.tempMin) / 2;
    const cond = {
      temperatura,
      humedadAire: dia.humedadMedia,
      humedadSuelo: humedadSueloActual,
      puntoRocio: dewPoint(temperatura, dia.humedadMedia),
      evapotranspiracion: 3,
    };
    return analizarRiesgoPlagas(cond);
  }, [pronostico, humedadSueloActual]);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-black tracking-tighter text-foreground/80">Pronóstico</h2>
      </div>

      {cargando ? (
        <div className="glass-card rounded-3xl p-10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
        </div>
      ) : error || !pronostico ? (
        <div className="glass-card rounded-3xl p-6 flex items-start gap-3">
          <WifiOff className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-foreground/80">Sin conexión al pronóstico</p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              El pronóstico necesita internet. Tu diagnóstico por sensores sigue funcionando sin conexión.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Aviso de helada */}
          {helada && helada.riesgo !== "ninguno" && helada.dia && (
            <div
              className={`rounded-3xl p-5 flex items-start gap-4 border ${
                helada.riesgo === "alto"
                  ? "bg-cyan-500/10 border-cyan-500/30"
                  : "bg-amber-500/10 border-amber-500/30"
              }`}
            >
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  helada.riesgo === "alto" ? "bg-cyan-500/20 text-cyan-700" : "bg-amber-500/20 text-amber-700"
                }`}
              >
                <Snowflake className="h-6 w-6" />
              </div>
              <div>
                <p
                  className={`text-sm font-black uppercase tracking-widest ${
                    helada.riesgo === "alto" ? "text-cyan-800" : "text-amber-800"
                  }`}
                >
                  {helada.riesgo === "alto" ? "Riesgo de helada esta noche" : "Posible helada"}
                </p>
                <p className="text-xs text-foreground/70 leading-relaxed mt-1">
                  Se prevé una mínima de <strong>{helada.dia.tempMin.toFixed(0)} °C</strong> el{" "}
                  {nombreDia(helada.dia.fecha, pronostico.dias.indexOf(helada.dia)).toLowerCase()}.{" "}
                  {helada.riesgo === "alto"
                    ? "Cubre tus plantas o prepara riego por aspersión antes del anochecer."
                    : "Mantente atento: un microclima local puede bajar más la temperatura."}
                </p>
              </div>
            </div>
          )}

          {/* Tira de 3 días */}
          <div className="grid grid-cols-3 gap-3">
            {pronostico.dias.map((dia, i) => {
              const Icono = iconoDia(dia);
              return (
                <div key={dia.fecha} className="stat-tile p-4 flex flex-col items-center gap-2 text-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {nombreDia(dia.fecha, i)}
                  </span>
                  <Icono className="h-6 w-6 text-primary/70" />
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-foreground/85 tabular-nums">{dia.tempMax.toFixed(0)}°</span>
                    <span className="text-xs font-bold text-muted-foreground tabular-nums">{dia.tempMin.toFixed(0)}°</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-sky-600">
                      <CloudRain className="h-3 w-3" /> {dia.probLluvia}%
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600" title="Humedad de suelo pronosticada">
                      <Droplets className="h-3 w-3" /> {dia.humedadSueloPct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contexto histórico (NASA POWER): ¿está siendo un mes normal? */}
          {contexto && (
            <div
              className={`rounded-2xl px-4 py-3 flex items-center gap-3 border ${
                contexto.anomalia === "normal"
                  ? "bg-primary/5 border-primary/10"
                  : contexto.anomalia.includes("frio")
                    ? "bg-cyan-500/5 border-cyan-500/15"
                    : "bg-orange-500/5 border-orange-500/15"
              }`}
            >
              <History className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-[11px] font-medium text-foreground/70 leading-snug">
                {contexto.descripcion}{" "}
                <span className="text-muted-foreground">Fuente: NASA POWER (promedio histórico).</span>
              </p>
            </div>
          )}

          {/* Pronóstico de plagas de mañana */}
          {plagasManana && plagasManana.relevantes.length > 0 && (
            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Bug className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary">Riesgo de plagas mañana</p>
                  <p className="text-[10px] text-muted-foreground">Motor local sobre las condiciones pronosticadas</p>
                </div>
              </div>
              <div className="space-y-2">
                {plagasManana.relevantes.slice(0, 3).map((ev) => (
                  <div key={ev.plaga.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-foreground/80">{ev.plaga.nombreComun}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        ev.nivel === "alto"
                          ? "bg-destructive/10 text-destructive"
                          : ev.nivel === "medio"
                            ? "bg-amber-500/10 text-amber-700"
                            : "bg-slate-400/10 text-slate-500"
                      }`}
                    >
                      <ShieldAlert className="h-2.5 w-2.5" /> {ev.nivel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-center">
            Pronóstico de <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline">Open-Meteo</a>, sin costo. Requiere conexión.
          </p>
        </div>
      )}
    </section>
  );
}
