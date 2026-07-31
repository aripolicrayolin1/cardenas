"use client";

import { useMemo } from "react";
import { GraduationCap, Target, Thermometer, BookOpen, Info } from "lucide-react";
import { CATALOGO_PLAGAS, buscarPlaga } from "@/lib/plagas";
import { describirCalibracion, FUERZA_PRIOR, type EstadoCalibracion } from "@/lib/plagas/calibracion";

/**
 * @fileOverview Estado del aprendizaje del motor en una parcela.
 *
 * Muestra cuánto se ha corrido cada envolvente respecto a la literatura y con
 * cuántas observaciones. Es la vista que hace visible la aportación del
 * proyecto: el modelo deja de ser el del libro y pasa a ser el de esta parcela.
 */

interface PanelCalibracionProps {
  estados: ReadonlyMap<string, EstadoCalibracion>;
  resumen: {
    plagasCalibradas: number;
    observaciones: number;
    precisionMedia: number | null;
  };
}

export function PanelCalibracion({ estados, resumen }: PanelCalibracionProps) {
  // Sólo las plagas con observaciones, de la más calibrada a la menos.
  const calibradas = useMemo(
    () =>
      [...estados.values()]
        .filter((e) => e.total > 0)
        .sort((a, b) => b.total - a.total),
    [estados]
  );

  if (calibradas.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-8 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <p className="text-sm font-black text-foreground/85">El modelo aún no ha aprendido</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
          Los {CATALOGO_PLAGAS.length} umbrales vienen de literatura general. Cuando el análisis
          te avise de una plaga, ve a revisar y responde <strong>si estaba o no</strong>: con esas
          observaciones el motor irá corrigiendo sus rangos para el microclima de esta parcela.
        </p>
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          A partir de {FUERZA_PRIOR} observaciones tus datos pesan tanto como la literatura.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="surface-deep rounded-[2rem] p-6 space-y-4">
        <div className="pill bg-white/10 border border-white/15 text-deep-foreground/80 w-fit">
          <GraduationCap className="h-3 w-3" /> Modelo calibrado localmente
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Dato valor={String(resumen.observaciones)} etiqueta="observaciones" />
          <Dato valor={String(resumen.plagasCalibradas)} etiqueta="especies ajustadas" />
          <Dato
            valor={resumen.precisionMedia !== null ? `${Math.round(resumen.precisionMedia * 100)}%` : "—"}
            etiqueta="acierto del modelo"
          />
        </div>

        <p className="text-[11px] text-deep-foreground/55 leading-relaxed">
          Los umbrales ya no son sólo los del libro: se han corrido hacia lo que de verdad ocurre
          en esta parcela.
        </p>
      </div>

      {/* Detalle por plaga */}
      <div className="space-y-2">
        {calibradas.map((estado) => {
          const plaga = buscarPlaga(estado.plagaId);
          if (!plaga) return null;

          const desplazada = Math.abs(estado.ajusteTempC) >= 0.3;
          const origMin = plaga.temperatura.optimoMin;
          const origMax = plaga.temperatura.optimoMax;

          return (
            <div key={estado.plagaId} className="glass-card rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground/85">{plaga.nombreComun}</p>
                  <p className="text-[10px] text-muted-foreground italic">{plaga.nombreCientifico}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {estado.precision !== null && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary">
                      <Target className="h-2.5 w-2.5" />
                      {Math.round(estado.precision * 100)}% acierto
                    </span>
                  )}
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {estado.total} obs.
                  </span>
                </div>
              </div>

              {/* Barra: cuánto pesa el dato local frente a la literatura */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                  <span className="text-muted-foreground inline-flex items-center gap-1">
                    <BookOpen className="h-2.5 w-2.5" /> literatura
                  </span>
                  <span className="text-primary">tu parcela {Math.round(estado.peso * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-foreground/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${estado.peso * 100}%` }}
                  />
                </div>
              </div>

              {/* Desplazamiento del rango */}
              {desplazada && (
                <div className="flex items-center gap-2 text-[11px] rounded-xl bg-primary/5 px-3 py-2">
                  <Thermometer className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="text-foreground/75 tabular-nums">
                    <span className="text-muted-foreground line-through">
                      {origMin}–{origMax} °C
                    </span>
                    {" → "}
                    <strong className="text-primary">
                      {(origMin + estado.ajusteTempC).toFixed(1)}–{(origMax + estado.ajusteTempC).toFixed(1)} °C
                    </strong>
                  </span>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {describirCalibracion(estado)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Cómo funciona: honestidad del método */}
      <div className="glass-card rounded-2xl p-4 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          El modelo <strong>no sustituye</strong> la literatura por tus datos: los mezcla con un
          peso que crece con el número de observaciones, y el desplazamiento está acotado. Con
          pocas observaciones manda el libro; conforme se acumulan, manda tu parcela. Así unas
          pocas respuestas raras no pueden romper un modelo que funciona.
        </p>
      </div>
    </div>
  );
}

function Dato({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] border border-white/10 p-3 space-y-1">
      <p className="text-2xl font-black tracking-tighter tabular-nums leading-none">{valor}</p>
      <p className="text-[9px] font-black uppercase tracking-widest text-deep-foreground/45 leading-tight">
        {etiqueta}
      </p>
    </div>
  );
}
