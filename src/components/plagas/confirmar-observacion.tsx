"use client";

import { useState } from "react";
import { Check, X, Loader2, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { EvaluacionPlaga } from "@/lib/plagas";
import type { LecturaSensores } from "@/config/sensor-schema";

/**
 * @fileOverview Botones con los que el agricultor cierra el ciclo de aprendizaje.
 *
 * El motor predice; el agricultor va a la parcela y responde si la plaga estaba
 * o no. Esa respuesta, junto con las condiciones que medían los sensores en ese
 * momento, es lo que permite al modelo corregir sus umbrales para esa parcela
 * (ver `lib/plagas/calibracion`).
 *
 * Sin este paso el sistema nunca aprende: los umbrales se quedarían para
 * siempre en los de la literatura general.
 */

interface ConfirmarObservacionProps {
  evaluacion: EvaluacionPlaga;
  lectura: LecturaSensores;
  /** `false` cuando no hay sesión o no hay parcela elegida. */
  habilitado: boolean;
  onRegistrar: (datos: {
    plagaId: string;
    presente: boolean;
    temperatura: number;
    humedadAire: number;
    humedadSuelo: number;
    puntajePredicho: number;
  }) => Promise<{ valor: string | null; error: string | null }>;
}

export function ConfirmarObservacion({
  evaluacion,
  lectura,
  habilitado,
  onRegistrar,
}: ConfirmarObservacionProps) {
  const { toast } = useToast();
  const [enviando, setEnviando] = useState<"si" | "no" | null>(null);
  const [respondido, setRespondido] = useState<boolean | null>(null);

  const responder = async (presente: boolean) => {
    setEnviando(presente ? "si" : "no");

    const { valor, error } = await onRegistrar({
      plagaId: evaluacion.plaga.id,
      presente,
      temperatura: lectura.temperatura,
      humedadAire: lectura.humedadAire,
      humedadSuelo: lectura.humedadSuelo,
      puntajePredicho: evaluacion.puntaje,
    });

    setEnviando(null);

    if (!valor) {
      toast({
        title: "No se pudo guardar",
        description: error ?? undefined,
        variant: "destructive",
      });
      return;
    }

    setRespondido(presente);
    toast({
      title: "Gracias, el modelo aprendió",
      description: presente
        ? `Registrado: ${evaluacion.plaga.nombreComun} SÍ estaba con estas condiciones.`
        : `Registrado: ${evaluacion.plaga.nombreComun} NO estaba. El modelo ajustará su umbral.`,
    });
  };

  if (!habilitado) return null;

  if (respondido !== null) {
    return (
      <div className="flex items-center gap-2 text-[11px] font-bold text-primary/70 pt-2">
        <GraduationCap className="h-3.5 w-3.5" />
        Observación registrada — el modelo se ajustó con tu parcela
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-primary/5 mt-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        ¿Fuiste a revisar? ¿Estaba?
      </span>

      <button
        onClick={() => responder(true)}
        disabled={enviando !== null}
        className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 text-destructive px-3 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-destructive/20 transition-colors disabled:opacity-50"
      >
        {enviando === "si" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        Sí estaba
      </button>

      <button
        onClick={() => responder(false)}
        disabled={enviando !== null}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-colors disabled:opacity-50"
      >
        {enviando === "no" ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        No había
      </button>
    </div>
  );
}
