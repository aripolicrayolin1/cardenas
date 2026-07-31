"use client";

import { useMemo, useState } from "react";
import {
  Wind,
  Gauge,
  CalendarClock,
  MapPin,
  AlertTriangle,
  TrendingUp,
  Info,
} from "lucide-react";
import { MapaSatelital, type MarcadorMapa, type TrazoBrote } from "@/components/mapa";
import { useAlertas } from "@/hooks/comunidad/use-alertas";
import { useFincas } from "@/hooks/fincas/use-fincas";
import { esCoordenadaValida } from "@/services/fincas";
import {
  analizarBrotes,
  estimarLlegada,
  MINIMO_REPORTES,
  type BroteAnalizado,
} from "@/lib/epidemiologia";

/**
 * @fileOverview Panel del frente de avance de los brotes.
 *
 * Cruza los reportes georreferenciados de la comunidad para estimar hacia dónde
 * se mueve cada plaga, a qué velocidad y cuándo alcanzaría las parcelas del
 * usuario. El mapa dibuja la traza de los reportes, la posición del frente y
 * los anillos de alcance a 3 y 7 días.
 *
 * Todo el análisis vive en `lib/epidemiologia`, validado con brotes sintéticos
 * en `scripts/validar-epidemiologia.ts`.
 */

const ESTILO_CONFIANZA = {
  alta: { texto: "text-primary", fondo: "bg-primary/10", etiqueta: "confianza alta" },
  media: { texto: "text-amber-700", fondo: "bg-amber-500/10", etiqueta: "confianza media" },
  baja: { texto: "text-muted-foreground", fondo: "bg-foreground/5", etiqueta: "confianza baja" },
} as const;

export function PanelBrotes() {
  const { alertas, cargando } = useAlertas();
  const { fincas } = useFincas();
  const [seleccionado, setSeleccionado] = useState(0);

  const brotes = useMemo(() => analizarBrotes(alertas), [alertas]);
  const brote: BroteAnalizado | undefined = brotes[seleccionado];

  const parcelas = useMemo(
    () => fincas.filter((f) => esCoordenadaValida(f.lat, f.lng)),
    [fincas]
  );

  // Llegada del frente a cada parcela del usuario, de la más inminente a la que
  // más tarda. Sólo se muestran las que el frente realmente va a alcanzar.
  const llegadas = useMemo(() => {
    if (!brote) return [];
    return parcelas
      .map((f) => ({
        finca: f,
        llegada: estimarLlegada(brote.frente, { lat: f.lat as number, lng: f.lng as number }),
      }))
      .filter((x) => x.llegada && !x.llegada.seAleja && x.llegada.dias > 0)
      .sort((a, b) => (a.llegada!.dias ?? 0) - (b.llegada!.dias ?? 0));
  }, [brote, parcelas]);

  const marcadores: MarcadorMapa[] = useMemo(() => {
    if (!brote) return [];

    const reportes: MarcadorMapa[] = brote.puntos.map((p, i) => ({
      id: `r${i}`,
      lat: p.lat,
      lng: p.lng,
      titulo: brote.frente.plaga,
      subtitulo: new Date(p.ts).toLocaleDateString([], { day: "numeric", month: "short" }),
      tipo: "alerta" as const,
      severidad: "alta" as const,
    }));

    const misParcelas: MarcadorMapa[] = parcelas.map((f) => ({
      id: f.id,
      lat: f.lat as number,
      lng: f.lng as number,
      titulo: f.name,
      subtitulo: f.crop,
      tipo: "finca" as const,
    }));

    return [...reportes, ...misParcelas];
  }, [brote, parcelas]);

  const trazo: TrazoBrote | null = useMemo(() => {
    if (!brote) return null;
    return {
      recorrido: [...brote.puntos].sort((a, b) => a.ts - b.ts).map((p) => ({ lat: p.lat, lng: p.lng })),
      frenteActual: brote.frente.frenteActual,
      rumboGrados: brote.frente.rumboGrados,
      velocidadKmDia: brote.frente.velocidadKmDia,
    };
  }, [brote]);

  if (cargando) {
    return (
      <div className="glass-card rounded-3xl p-10 flex justify-center">
        <TrendingUp className="h-6 w-6 animate-pulse text-primary/30" />
      </div>
    );
  }

  // Sin suficientes reportes no se inventa un frente: se explica qué falta.
  if (brotes.length === 0) {
    const conGps = alertas.filter((a) => a.lat != null && a.lng != null).length;
    return (
      <div className="glass-card rounded-3xl p-8 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-sm font-black text-foreground/85">Aún no hay frente que seguir</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
          Para calcular hacia dónde avanza un brote hacen falta al menos{" "}
          <strong>{MINIMO_REPORTES} reportes de la misma plaga</strong> con ubicación y en días
          distintos. Ahora mismo la comunidad lleva <strong>{conGps}</strong>{" "}
          {conGps === 1 ? "reporte ubicado" : "reportes ubicados"}.
        </p>
        <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
          Cuando reportes un brote, pulsa "usar mi ubicación": sin coordenadas el reporte avisa,
          pero no se puede seguir el movimiento.
        </p>
      </div>
    );
  }

  const f = brote!.frente;
  const estilo = ESTILO_CONFIANZA[f.confianza];

  return (
    <div className="space-y-4">
      {/* Selector cuando hay varios brotes activos */}
      {brotes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {brotes.map((b, i) => (
            <button
              key={b.frente.plaga}
              onClick={() => setSeleccionado(i)}
              className={`pill transition-colors ${
                i === seleccionado
                  ? "bg-primary text-white"
                  : "bg-white/60 border border-white/70 text-muted-foreground hover:text-primary"
              }`}
            >
              {b.frente.plaga}
            </button>
          ))}
        </div>
      )}

      {/* Titular del frente */}
      <div className="surface-deep rounded-[2rem] p-6 md:p-7 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="pill bg-white/10 border border-white/15 text-deep-foreground/80">
            <AlertTriangle className="h-3 w-3" /> Frente activo
          </div>
          <div className="pill bg-white/10 border border-white/15 text-deep-foreground/60">
            {f.reportes} reportes · {f.diasObservados.toFixed(0)} días
          </div>
        </div>

        <h3 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight">
          {f.plaga} viene <span className="text-accent">{f.rumboTexto}</span> a{" "}
          <span className="text-accent">{f.velocidadKmDia.toFixed(1)} km/día</span>
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <DatoFrente icono={<Gauge className="h-3.5 w-3.5" />} valor={`${f.velocidadKmDia.toFixed(1)}`} unidad="km/día" etiqueta="Velocidad" />
          <DatoFrente icono={<Wind className="h-3.5 w-3.5" />} valor={`${f.rumboGrados.toFixed(0)}°`} unidad="" etiqueta="Rumbo" />
          <DatoFrente icono={<MapPin className="h-3.5 w-3.5" />} valor={`±${f.dispersionKm.toFixed(1)}`} unidad="km" etiqueta="Dispersión" />
        </div>
      </div>

      {/* Llegada a las parcelas del usuario */}
      {llegadas.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
            Llegada estimada a tus parcelas
          </p>
          {llegadas.map(({ finca, llegada }) => {
            const dias = llegada!.dias;
            const urgente = dias <= 3;
            return (
              <div
                key={finca.id}
                className={`glass-card rounded-2xl p-4 flex items-center justify-between gap-3 ${
                  urgente ? "ring-1 ring-destructive/30" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground/85 truncate">{finca.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    a {llegada!.distanciaKm.toFixed(1)} km del frente
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-xl font-black tracking-tighter tabular-nums ${urgente ? "text-destructive" : "text-foreground/80"}`}>
                    {dias < 1 ? "hoy" : `${Math.round(dias)} d`}
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {dias < 1 ? "inminente" : "estimado"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mapa con el frente dibujado */}
      <MapaSatelital marcadores={marcadores} brote={trazo} altura="440px" />

      {/* Leyenda y honestidad del modelo */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Leyenda color="#f97316" texto="Recorrido de los reportes" discontinua />
          <Leyenda color="#dc2626" texto="Avance previsto (7 días)" />
          <Leyenda color="#dc2626" texto="Alcance a 3 y 7 días" discontinua />
        </div>

        <div className={`flex items-start gap-2 rounded-xl px-3 py-2 ${estilo.fondo}`}>
          <Info className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${estilo.texto}`} />
          <p className="text-[11px] text-foreground/70 leading-relaxed">
            <strong className={estilo.texto}>{estilo.etiqueta}</strong>. El modelo extrapola en
            línea recta a partir de {f.reportes} reportes. Una plaga real sigue el viento, los
            cauces y la distribución del cultivo, así que la fecha es una guía para anticiparse,
            no una predicción exacta.
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================

function DatoFrente({
  icono, valor, unidad, etiqueta,
}: {
  icono: React.ReactNode; valor: string; unidad: string; etiqueta: string;
}) {
  return (
    <div className="rounded-2xl bg-white/[0.07] border border-white/10 p-3 space-y-1">
      <div className="text-deep-foreground/40">{icono}</div>
      <p className="text-xl font-black tracking-tighter tabular-nums leading-none">
        {valor}
        {unidad && <span className="text-[10px] opacity-55"> {unidad}</span>}
      </p>
      <p className="text-[9px] font-black uppercase tracking-widest text-deep-foreground/45">
        {etiqueta}
      </p>
    </div>
  );
}

function Leyenda({ color, texto, discontinua }: { color: string; texto: string; discontinua?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
      <span
        className="inline-block w-5 h-0.5 rounded"
        style={{
          background: discontinua
            ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)`
            : color,
        }}
      />
      {texto}
    </span>
  );
}
