"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Mic, MicOff, Volume2, X, MessageCircleQuestion } from "lucide-react";
import { useSensores } from "@/hooks/sensores/use-sensores";
import { useClima } from "@/hooks/clima/use-clima";
import { analizarDesdeLectura } from "@/lib/plagas";
import { hablar, callar, soportaReconocimiento } from "@/lib/voz";

/**
 * @fileOverview Asistente por voz del agricultor.
 *
 * Botón flotante en toda la app. El agricultor pregunta en voz alta ("¿riego
 * hoy?", "¿hay riesgo de helada?", "¿qué plaga hay?") y la app le responde
 * HABLANDO, apoyándose en la lectura de sus sensores, el pronóstico y el motor
 * local de plagas. Pensado para quien no se sienta a leer una pantalla.
 *
 * No usa un modelo de lenguaje: reconoce la intención por palabras clave, así la
 * respuesta es predecible y verificable. La respuesta se habla en español (la
 * síntesis del navegador no tiene voz en hñähñu; ver `lib/voz.ts`) y también se
 * muestra escrita.
 *
 * Se oculta en /login: sin sesión no hay parcela sobre la que responder.
 */

type Intencion = "riego" | "helada" | "plaga" | "clima" | "ayuda" | "desconocido";

function detectarIntencion(texto: string): Intencion {
  const t = texto.toLowerCase();
  if (/(riego|riega|agua|regar|humedad)/.test(t)) return "riego";
  if (/(helada|frío|frio|congel|hiela)/.test(t)) return "helada";
  if (/(plaga|bicho|gusano|insecto|hongo|enferm)/.test(t)) return "plaga";
  if (/(clima|tiempo|lluvia|llover|pronóstic|pronostic|temperatura)/.test(t)) return "clima";
  if (/(ayuda|qué puedo|que puedo|hola|preguntar)/.test(t)) return "ayuda";
  return "desconocido";
}

export function AsistenteVoz() {
  const pathname = usePathname();
  const { lectura, conectado } = useSensores();
  const { pronostico, helada } = useClima();

  const [abierto, setAbierto] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!soportaReconocimiento()) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "es-MX";

    rec.onresult = (event: any) => {
      const texto = event.results[0][0].transcript as string;
      setPregunta(texto);
      responder(texto);
    };
    rec.onerror = () => setEscuchando(false);
    rec.onend = () => setEscuchando(false);

    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const responder = (texto: string) => {
    const intencion = detectarIntencion(texto);
    const r = construirRespuesta(intencion);
    setRespuesta(r);
    hablar(r);
  };

  const construirRespuesta = (intencion: Intencion): string => {
    if (!conectado && (intencion === "riego" || intencion === "plaga")) {
      return "Todavía no recibo datos de tus sensores. Revisa que la estación esté encendida y vuelve a preguntarme.";
    }

    switch (intencion) {
      case "riego": {
        const suelo = lectura.humedadSuelo;
        if (suelo < 20) {
          return `Tu suelo está al ${suelo.toFixed(0)} por ciento de humedad, muy seco. Sí, conviene regar hoy.`;
        }
        if (suelo > 85) {
          return `Tu suelo está al ${suelo.toFixed(0)} por ciento, muy húmedo. No riegues hoy: podrías ahogar las raíces.`;
        }
        return `Tu suelo está al ${suelo.toFixed(0)} por ciento de humedad, en buen nivel. Por ahora no hace falta regar.`;
      }
      case "helada": {
        if (helada && helada.riesgo === "alto" && helada.dia) {
          return `Sí, cuidado: se prevé una mínima de ${helada.dia.tempMin.toFixed(0)} grados. Cubre tus plantas esta noche o prepara riego.`;
        }
        if (helada && helada.riesgo === "posible" && helada.dia) {
          return `Hay posible helada: la mínima podría llegar a ${helada.dia.tempMin.toFixed(0)} grados. Mantente atento.`;
        }
        return "No se prevé helada en las próximas noches. Puedes estar tranquilo por ahora.";
      }
      case "plaga": {
        const analisis = analizarDesdeLectura(lectura);
        const top = analisis.relevantes[0];
        if (!top) {
          return "Con las condiciones actuales, ninguna plaga del catálogo encuentra ambiente para desarrollarse. Buen momento.";
        }
        return `Con tus condiciones actuales, la plaga con más riesgo es ${top.plaga.nombreComun}, en nivel ${top.nivel}. Revisa tu cultivo para confirmarlo.`;
      }
      case "clima": {
        const hoy = pronostico?.dias[0];
        if (!hoy) return "Ahora mismo no tengo el pronóstico. Necesito conexión a internet para consultarlo.";
        return `Hoy la temperatura irá de ${hoy.tempMin.toFixed(0)} a ${hoy.tempMax.toFixed(0)} grados, con ${hoy.probLluvia} por ciento de probabilidad de lluvia.`;
      }
      case "ayuda":
        return "Puedes preguntarme si conviene regar, si hay riesgo de helada, qué plaga hay o cómo estará el clima. Pregúntame en voz alta.";
      default:
        return "No entendí bien. Prueba preguntándome sobre el riego, la helada, las plagas o el clima.";
    }
  };

  const toggleEscucha = () => {
    if (!recognitionRef.current) return;
    if (escuchando) {
      recognitionRef.current.stop();
      setEscuchando(false);
    } else {
      callar();
      setRespuesta("");
      setPregunta("");
      setEscuchando(true);
      try {
        recognitionRef.current.start();
      } catch {
        setEscuchando(false);
      }
    }
  };

  // Oculto en login; y si el navegador no soporta reconocimiento, no aparece.
  if (pathname === "/login" || !soportaReconocimiento()) return null;

  return (
    <>
      {/* Botón flotante */}
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform animate-float"
          aria-label="Asistente por voz"
        >
          <MessageCircleQuestion className="h-6 w-6" />
        </button>
      )}

      {/* Panel */}
      {abierto && (
        <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-3rem)] sm:w-80 glass-card rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                <Volume2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-primary">Asistente</span>
            </div>
            <button onClick={() => { setAbierto(false); callar(); }} className="text-muted-foreground hover:text-foreground" aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>

          {pregunta && (
            <div className="mb-2 text-right">
              <span className="inline-block bg-primary/10 text-primary text-xs font-bold rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                {pregunta}
              </span>
            </div>
          )}

          {respuesta ? (
            <div className="mb-4 text-left">
              <span className="inline-block bg-white/60 text-foreground/85 text-sm font-medium rounded-2xl rounded-tl-sm px-3 py-2 leading-snug border border-white">
                {respuesta}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Pregúntame en voz alta: <em>¿riego hoy?</em>, <em>¿hay helada?</em>, <em>¿qué plaga hay?</em>
            </p>
          )}

          <button
            onClick={toggleEscucha}
            className={`w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
              escuchando ? "bg-destructive text-white animate-pulse" : "bg-primary text-white"
            }`}
          >
            {escuchando ? (
              <>
                <MicOff className="h-4 w-4" /> Escuchando...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" /> Preguntar por voz
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}
