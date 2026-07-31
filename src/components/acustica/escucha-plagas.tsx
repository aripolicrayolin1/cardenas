"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, AudioWaveform, Info, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBitacora } from "@/hooks/bitacora/use-bitacora";
import {
  analizarEspectros,
  BANDAS,
  type ResultadoAcustico,
} from "@/lib/acustica";

/**
 * @fileOverview Escucha acústica de plagas con el micrófono del dispositivo.
 *
 * Captura unos segundos de audio, calcula su espectro con la Web Audio API y
 * mide energía en las bandas asociadas a insectos. Detecta lo que ninguna
 * cámara ve: una larva barrenando dentro del tallo.
 *
 * ── Por qué se analiza en el navegador y no en un servidor ─────────────────
 * El audio nunca sale del dispositivo. Además de ser lo correcto en privacidad
 * —un micrófono abierto en una parcela capta conversaciones—, permite que
 * funcione sin conexión, igual que el motor de plagas.
 *
 * ── Honestidad del método ──────────────────────────────────────────────────
 * Esto MIDE señal; no clasifica especies. Se dice explícitamente en la interfaz
 * porque la tentación de escribir "gusano cogollero detectado" sobre un
 * espectro sería inventar una certeza que el método no da.
 */

const DURACION_S = 8;
const FFT_SIZE = 2048;
/** Cada cuánto se toma un espectro. 20/s basta para separar impulsos de masticación. */
const INTERVALO_MUESTREO_MS = 50;

const COLOR_NIVEL = {
  nula: { texto: "text-muted-foreground", fondo: "bg-foreground/5", barra: "bg-muted-foreground/40" },
  baja: { texto: "text-primary", fondo: "bg-primary/10", barra: "bg-primary" },
  media: { texto: "text-amber-700", fondo: "bg-amber-500/10", barra: "bg-amber-500" },
  alta: { texto: "text-destructive", fondo: "bg-destructive/10", barra: "bg-destructive" },
} as const;

export function EscuchaPlagas() {
  const { toast } = useToast();
  const { anotar, puedeEscribir } = useBitacora();

  const [grabando, setGrabando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultado, setResultado] = useState<ResultadoAcustico | null>(null);
  const [nivelVivo, setNivelVivo] = useState(0);

  const contextoRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timersRef = useRef<number[]>([]);

  const limpiar = useCallback(() => {
    timersRef.current.forEach((t) => clearInterval(t));
    timersRef.current = [];
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    contextoRef.current?.close().catch(() => {});
    contextoRef.current = null;
  }, []);

  // Cerrar el micrófono al salir: dejarlo abierto mantendría el indicador de
  // grabación encendido después de cambiar de pantalla.
  useEffect(() => limpiar, [limpiar]);

  const escuchar = async () => {
    setResultado(null);
    setProgreso(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Estos filtros están pensados para voz y se comen justamente los
          // impulsos cortos que queremos medir. Se desactivan.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch {
      toast({
        title: "Sin acceso al micrófono",
        description: "Da permiso de micrófono al navegador para usar la escucha.",
        variant: "destructive",
      });
      return;
    }

    streamRef.current = stream;
    const contexto = new AudioContext();
    contextoRef.current = contexto;

    const fuente = contexto.createMediaStreamSource(stream);
    const analizador = contexto.createAnalyser();
    analizador.fftSize = FFT_SIZE;
    analizador.smoothingTimeConstant = 0; // sin suavizado: borraría los impulsos
    fuente.connect(analizador);

    const espectros: Float32Array[] = [];
    const buffer = new Float32Array(analizador.frequencyBinCount);

    setGrabando(true);

    const muestreo = window.setInterval(() => {
      analizador.getFloatFrequencyData(buffer);
      espectros.push(new Float32Array(buffer));

      // Nivel para la barra en vivo: media de la parte audible.
      const media = buffer.reduce((s, v) => s + (Number.isFinite(v) ? v : -100), 0) / buffer.length;
      setNivelVivo(Math.max(0, Math.min(1, (media + 100) / 60)));
    }, INTERVALO_MUESTREO_MS);

    const avance = window.setInterval(() => {
      setProgreso((p) => Math.min(100, p + 100 / (DURACION_S * 10)));
    }, 100);

    timersRef.current = [muestreo, avance];

    window.setTimeout(() => {
      limpiar();
      setGrabando(false);
      setProgreso(100);
      setNivelVivo(0);

      const r = analizarEspectros(espectros, contexto.sampleRate, FFT_SIZE, DURACION_S);
      setResultado(r);

      // Sólo se anota lo que amerita: registrar cada escucha en silencio
      // llenaría la bitácora de ruido.
      if (puedeEscribir && (r.nivel === "media" || r.nivel === "alta")) {
        anotar({
          tipo: "plaga",
          texto: `Escucha acústica — actividad ${r.nivel}: ${r.impulsosPorSegundo.toFixed(1)} impulsos/s en la banda de masticación. Conviene revisar tallos y mazorcas.`,
          automatica: true,
        });
      }
    }, DURACION_S * 1000);
  };

  const detener = () => {
    limpiar();
    setGrabando(false);
    setProgreso(0);
    setNivelVivo(0);
  };

  const estilo = resultado ? COLOR_NIVEL[resultado.nivel] : COLOR_NIVEL.nula;

  return (
    <div className="space-y-4">
      {/* Captura */}
      <div className="surface-deep rounded-[2rem] p-6 md:p-8 space-y-5">
        <div className="pill bg-white/10 border border-white/15 text-deep-foreground/80 w-fit">
          <AudioWaveform className="h-3 w-3" /> Escucha del cultivo
        </div>

        <p className="text-sm text-deep-foreground/80 leading-relaxed max-w-lg">
          Acerca el teléfono al tallo o a la mazorca y graba {DURACION_S} segundos en silencio.
          Las larvas que barrenan por dentro <strong>suenan</strong> aunque no se vean.
        </p>

        {/* Nivel en vivo */}
        {grabando && (
          <div className="space-y-2">
            <div className="h-16 flex items-end gap-1">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-accent transition-all duration-75"
                  style={{
                    height: `${Math.max(4, nivelVivo * 100 * (0.5 + Math.abs(Math.sin(i * 0.7)) * 0.5))}%`,
                    opacity: 0.35 + nivelVivo * 0.65,
                  }}
                />
              ))}
            </div>
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-accent transition-all" style={{ width: `${progreso}%` }} />
            </div>
          </div>
        )}

        <Button
          onClick={grabando ? detener : escuchar}
          className={`rounded-full px-6 py-2.5 text-[11px] font-black uppercase tracking-widest gap-2 ${
            grabando
              ? "bg-destructive text-white hover:bg-destructive/90"
              : "bg-accent text-accent-foreground hover:brightness-105"
          }`}
        >
          {grabando ? (
            <>
              <Square className="h-3.5 w-3.5 fill-current" /> Detener
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" /> Escuchar {DURACION_S} s
            </>
          )}
        </Button>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className={`rounded-3xl p-5 ${estilo.fondo}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Bug className={`h-4 w-4 ${estilo.texto}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${estilo.texto}`}>
                  Actividad {resultado.nivel}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground tabular-nums">
                {resultado.impulsosPorSegundo.toFixed(1)} impulsos/s
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-foreground/[0.06] overflow-hidden mb-3">
              <div
                className={`h-full rounded-full ${estilo.barra} transition-all duration-700`}
                style={{ width: `${resultado.actividad * 100}%` }}
              />
            </div>

            <p className="text-xs text-foreground/75 leading-relaxed">{resultado.interpretacion}</p>
          </div>

          {/* Bandas */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Energía por banda de frecuencia
            </p>

            {resultado.bandas
              .filter((b) => b.banda.id !== "ambiente")
              .map(({ banda, sobreFondo }) => {
                const destaca = sobreFondo > 6;
                return (
                  <div key={banda.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-foreground/80">{banda.nombre}</span>
                      <span
                        className={`text-[10px] font-black tabular-nums ${
                          destaca ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {sobreFondo > 0 ? "+" : ""}
                        {sobreFondo.toFixed(0)} dB
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-foreground/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          destaca ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                        style={{ width: `${Math.max(2, Math.min(100, (sobreFondo / 25) * 100))}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {banda.desde}–{banda.hasta} Hz · {banda.descripcion}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Honestidad del método */}
      <div className="glass-card rounded-2xl p-4 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Esto <strong>mide sonido</strong>, no identifica especies. Detecta que hay actividad
          acústica compatible con insectos y en qué banda; decir qué plaga es requeriría un
          clasificador entrenado con grabaciones etiquetadas, que no existe para las plagas de esta
          región. El audio se analiza en tu dispositivo y no se guarda.
        </p>
      </div>
    </div>
  );
}
