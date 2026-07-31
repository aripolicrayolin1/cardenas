"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Video,
  VideoOff,
  Radar,
  Bug,
  PawPrint,
  User,
  Leaf,
  CircleSlash,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSensores } from "@/hooks/sensores/use-sensores";
import { useBitacora } from "@/hooks/bitacora/use-bitacora";
import { analizarVigilancia, type VigilanciaOutput } from "@/ai/flows/vigilancia-flow";
import { capturarDeVideo } from "@/lib/imagen";

/**
 * @fileOverview Modo vigilancia: el PIR dispara, la cámara mira, la IA decide.
 *
 * Flujo completo:
 *   PIR (GPIO 27) → Firebase → esta pantalla detecta el flanco de subida →
 *   captura un fotograma de la cámara → lo analiza → lo anota en la bitácora.
 *
 * ── Por qué la cámara del dispositivo y no una del ESP32 ────────────────────
 * Un ESP32-CAM sería lo ideal en la parcela, pero es hardware aparte y el
 * simulador no puede emular una cámara. Mientras tanto, el navegador SÍ tiene
 * acceso a la cámara del equipo, así que el nodo aporta la detección de
 * movimiento y el dispositivo del agricultor aporta los ojos. La arquitectura
 * es la misma: cuando exista el ESP32-CAM, sólo cambia de dónde sale la imagen.
 *
 * ── Cuidado con la privacidad ───────────────────────────────────────────────
 * La cámara sólo se enciende cuando el agricultor pulsa "Activar", y la captura
 * ocurre únicamente ante un movimiento detectado. No hay grabación continua ni
 * se guarda la imagen: se envía para clasificarla y se descarta. Lo que queda
 * en la bitácora es el texto del resultado, no la fotografía.
 */

const ICONO_TIPO: Record<VigilanciaOutput["tipo"], { icono: typeof Bug; color: string; bg: string }> = {
  plaga: { icono: Bug, color: "text-red-600", bg: "bg-red-500/10" },
  animal: { icono: PawPrint, color: "text-amber-600", bg: "bg-amber-500/10" },
  persona: { icono: User, color: "text-violet-600", bg: "bg-violet-500/10" },
  vegetacion: { icono: Leaf, color: "text-primary", bg: "bg-primary/10" },
  nada: { icono: CircleSlash, color: "text-muted-foreground", bg: "bg-foreground/5" },
};

interface Deteccion extends VigilanciaOutput {
  momento: Date;
  /** `true` si la disparó el sensor; `false` si fue una prueba manual. */
  porSensor: boolean;
}

export function ModoVigilancia({ deviceId }: { deviceId?: string }) {
  const { toast } = useToast();
  const { lectura, conectado } = useSensores(deviceId);
  const { anotar, puedeEscribir } = useBitacora();

  const [activo, setActivo] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [detecciones, setDetecciones] = useState<Deteccion[]>([]);
  /** Sólo cuenta las disparadas por el sensor, no las de prueba manual. */
  const [capturas, setCapturas] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Guarda el valor anterior para disparar sólo en el FLANCO de subida: sin
  // esto, mientras el PIR siga en alto se lanzaría un análisis por cada lectura.
  const movimientoPrevio = useRef(false);

  const detener = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActivo(false);
  }, []);

  const activar = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      movimientoPrevio.current = lectura.movimiento;
      setActivo(true);
    } catch {
      toast({
        title: "Sin acceso a la cámara",
        description: "Da permiso de cámara al navegador para usar la vigilancia.",
        variant: "destructive",
      });
    }
  };

  // Apagar la cámara al desmontar: dejar el stream vivo mantendría el LED de la
  // cámara encendido después de salir de la pantalla.
  useEffect(() => detener, [detener]);

  const analizar = useCallback(async (porSensor = false) => {
    if (!videoRef.current || analizando) return;

    setAnalizando(true);
    try {
      const foto = capturarDeVideo(videoRef.current);
      const resultado = await analizarVigilancia(foto);

      if (porSensor) setCapturas((n) => n + 1);
      setDetecciones((previas) =>
        [{ ...resultado, momento: new Date(), porSensor }, ...previas].slice(0, 8)
      );

      if (resultado.requiereAtencion) {
        toast({
          title: `Movimiento: ${resultado.tipo}`,
          description: resultado.descripcion,
          variant: resultado.tipo === "persona" ? "destructive" : "default",
        });
      }

      // Sólo se anota lo que amerita: registrar cada hoja movida por el viento
      // llenaría la bitácora de ruido y escondería lo importante.
      if (puedeEscribir && resultado.requiereAtencion) {
        await anotar({
          tipo: resultado.tipo === "plaga" ? "plaga" : "sensor",
          texto: `Vigilancia — se detectó movimiento y la cámara identificó: ${resultado.descripcion} (${resultado.tipo}, confianza ${resultado.confianza}).`,
          automatica: true,
        });
      }
    } catch (e: any) {
      const msg = String(e?.message ?? "").toLowerCase();
      toast({
        title: "No se pudo analizar",
        description:
          msg.includes("quota") || msg.includes("429")
            ? "Se agotó por hoy el límite gratuito de análisis por imagen."
            : "Revisa tu conexión e inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setAnalizando(false);
    }
  }, [analizando, anotar, puedeEscribir, toast]);

  // Disparo automático en el flanco de subida del PIR.
  useEffect(() => {
    if (!activo) return;

    const hayMovimiento = conectado && lectura.movimiento;
    if (hayMovimiento && !movimientoPrevio.current) {
      analizar(true);
    }
    movimientoPrevio.current = hayMovimiento;
  }, [activo, conectado, lectura.movimiento, analizar]);

  return (
    <div className="space-y-4">
      {/* Cabecera y estado del sensor */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl ${lectura.movimiento && conectado ? "bg-red-500/10 text-red-600" : "bg-primary/10 text-primary"}`}>
            <Radar className={`h-4 w-4 ${lectura.movimiento && conectado ? "animate-pulse" : ""}`} />
          </div>
          <div>
            <p className="text-sm font-black tracking-tight text-foreground/85">
              {activo ? "Vigilancia automática activa" : "Modo vigilancia"}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {!conectado
                ? "Sensor sin señal"
                : lectura.movimiento
                  ? "Movimiento detectado"
                  : "Sin movimiento"}
            </p>
          </div>
        </div>

        <Button
          onClick={activo ? detener : activar}
          variant={activo ? "outline" : "default"}
          className="rounded-2xl font-black uppercase tracking-widest text-xs gap-2"
        >
          {activo ? (
            <>
              <VideoOff className="h-4 w-4" /> Detener vigilancia
            </>
          ) : (
            <>
              <Video className="h-4 w-4" /> Iniciar vigilancia
            </>
          )}
        </Button>
      </div>

      {/* Confirmación de que la captura NO requiere intervención */}
      {activo && (
        <div className="flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/15 px-4 py-3">
          <Radar className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-foreground/75 leading-relaxed">
            No tienes que hacer nada más. En cuanto el sensor detecte movimiento, la cámara
            <strong> captura y analiza sola</strong>.
            {capturas > 0 && (
              <> Llevas <strong>{capturas}</strong> {capturas === 1 ? "captura automática" : "capturas automáticas"}.</>
            )}
          </p>
        </div>
      )}

      {/* Vista de la cámara */}
      <div className="relative rounded-3xl overflow-hidden bg-deep">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full object-cover ${activo ? "block" : "hidden"}`}
          style={{ maxHeight: "360px" }}
        />

        {!activo && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-8 text-center">
            <Video className="h-8 w-8 text-deep-foreground/30" />
            <p className="text-xs text-deep-foreground/50 leading-relaxed max-w-sm">
              Al activarla, la cámara toma una foto <strong>sólo</strong> cuando el sensor
              detecta movimiento. No se graba video ni se guardan las imágenes.
            </p>
          </div>
        )}

        {activo && analizando && (
          <div className="absolute inset-0 bg-deep/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
            <p className="text-xs font-black uppercase tracking-widest text-deep-foreground">
              Analizando la escena
            </p>
          </div>
        )}

        {activo && !analizando && (
          <div className="absolute top-3 left-3 pill bg-deep/80 backdrop-blur-md text-deep-foreground/80 border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-red-500" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Vigilando
          </div>
        )}
      </div>

      {/* Prueba manual: sólo para comprobar la cámara sin esperar al sensor. */}
      {activo && (
        <button
          onClick={() => analizar(false)}
          disabled={analizando}
          className="w-full text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors disabled:opacity-40 py-1"
        >
          Probar la cámara ahora, sin esperar al sensor
        </button>
      )}

      {/* Detecciones */}
      {detecciones.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
            Últimas detecciones
          </p>
          {detecciones.map((d, i) => {
            const estilo = ICONO_TIPO[d.tipo];
            const Icono = estilo.icono;
            return (
              <div key={i} className="glass-card rounded-2xl p-4 flex gap-3 items-start">
                <div className={`p-2.5 rounded-2xl ${estilo.bg} ${estilo.color} shrink-0`}>
                  <Icono className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground/85 leading-snug">
                    {d.descripcion}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {d.momento.toLocaleTimeString()}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${estilo.color}`}>
                      {d.tipo}
                    </span>
                    {d.porSensor && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primary/70">
                        <Radar className="h-2.5 w-2.5" /> automática
                      </span>
                    )}
                    {d.confianza === "baja" && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-600">
                        <AlertTriangle className="h-2.5 w-2.5" /> confianza baja
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground leading-relaxed px-1">
        El sistema distingue plaga, animal o persona. <strong>No identifica personas concretas</strong>{" "}
        ni puede saber si alguien es conocido o ajeno: eso requeriría reconocimiento facial,
        que no forma parte de este proyecto.
      </p>
    </div>
  );
}
