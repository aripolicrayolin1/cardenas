"use client";

import { useMemo, useState } from "react";
import { Volume2, Square, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hablar, callar, soportaSintesis } from "@/lib/voz";
import type { EntradaBitacora } from "@/services/bitacora";

/**
 * @fileOverview "El diario que habla": resume la semana y la narra en voz alta.
 *
 * Pensado para quien no se sienta a leer una pantalla. Junta las entradas de la
 * bitácora de los últimos 7 días en un párrafo natural y lo lee con la voz del
 * navegador. La narración es en español (ver la nota sobre hñähñu en
 * `lib/voz.ts`); el resumen también se muestra escrito.
 */

const ETIQUETA_TIPO: Record<string, string> = {
  helada: "avisos de helada",
  plaga: "reportes de plagas",
  riego: "eventos de riego",
  sensor: "notas de sensores",
  diagnostico: "diagnósticos",
  nota: "notas tuyas",
};

function construirResumen(entradas: EntradaBitacora[]): string {
  const semana = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recientes = entradas.filter((e) => (e.createdAt?.toMillis?.() ?? 0) >= semana);

  if (recientes.length === 0) {
    return "Esta semana no hay nada anotado en tu bitácora todavía. Cuando la app detecte un evento o tú apuntes una nota, aquí te lo resumiré.";
  }

  const porTipo = new Map<string, number>();
  for (const e of recientes) {
    porTipo.set(e.tipo, (porTipo.get(e.tipo) ?? 0) + 1);
  }

  const partes = [...porTipo.entries()].map(
    ([tipo, n]) => `${n} ${ETIQUETA_TIPO[tipo] ?? tipo}`
  );

  const lista =
    partes.length === 1
      ? partes[0]
      : `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;

  // Se destaca lo más importante: cualquier aviso de helada o plaga de la semana.
  const critica = recientes.find((e) => e.tipo === "helada" || e.tipo === "plaga");
  const cierre = critica
    ? ` Lo más importante: ${critica.texto}`
    : " No hubo alertas críticas: buena semana.";

  return `Esta semana tu parcela tuvo ${recientes.length} registros en la bitácora: ${lista}.${cierre}`;
}

interface DiarioNarradoProps {
  entradas: EntradaBitacora[];
}

export function DiarioNarrado({ entradas }: DiarioNarradoProps) {
  const [hablando, setHablando] = useState(false);
  const resumen = useMemo(() => construirResumen(entradas), [entradas]);

  const narrar = async () => {
    if (hablando) {
      callar();
      setHablando(false);
      return;
    }
    setHablando(true);
    await hablar(resumen);
    setHablando(false);
  };

  return (
    <div className="surface-deep rounded-[2rem] p-6 md:p-7 relative overflow-hidden">
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="pill bg-white/10 border border-white/15 text-deep-foreground/80">
            <Sparkles className="h-3 w-3" /> Diario de la semana
          </div>
        </div>

        <p className="text-sm md:text-base text-deep-foreground/90 leading-relaxed font-medium">
          {resumen}
        </p>

        {soportaSintesis() ? (
          <Button
            onClick={narrar}
            className="w-fit rounded-full bg-accent px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-accent-foreground hover:brightness-105 gap-2"
          >
            {hablando ? (
              <>
                <Square className="h-3.5 w-3.5 fill-current" /> Detener
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" /> Narrar mi semana
              </>
            )}
          </Button>
        ) : (
          <p className="text-[11px] text-deep-foreground/50">
            Tu navegador no puede leer en voz alta. El resumen queda arriba en texto.
          </p>
        )}
      </div>
    </div>
  );
}
