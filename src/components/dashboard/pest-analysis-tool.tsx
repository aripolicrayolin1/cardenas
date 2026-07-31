"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, BrainCircuit, RefreshCw, Zap, WifiOff, Gauge, AlertTriangle } from 'lucide-react';
import { PestAnalysisResult } from './pest-analysis-result';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSensores } from "@/hooks/sensores/use-sensores";
import { useHistorico } from "@/hooks/sensores/use-historico";
import { useCalibracion } from "@/hooks/plagas/use-calibracion";
import { ConfirmarObservacion } from "@/components/plagas/confirmar-observacion";
import {
  analizarDesdeLectura,
  comoAnalisisLegado,
  CATALOGO_PLAGAS,
  type AnalisisLegado,
  type AnalisisPlagas,
} from "@/lib/plagas";

/**
 * @fileOverview Herramienta de análisis predictivo de plagas.
 *
 * Antes llamaba a Gemini y caía en el motor local sólo cuando la red fallaba.
 * Ahora el motor local es el principal: el cálculo es determinista, ocurre en
 * el dispositivo y no necesita conexión. Eso importa en campo, donde la
 * cobertura es intermitente y una respuesta que a veces no llega no sirve.
 *
 * La serie de `/historico` se usa, cuando existe, para acumular grados-día y
 * estimar en qué punto de su generación va cada insecto.
 */

export function PestAnalysisTool({ fincaId }: { fincaId?: string | null } = {}) {
  const [calculando, setCalculando] = useState(false);
  const [result, setResult] = useState<AnalisisLegado | null>(null);
  const [analisis, setAnalisis] = useState<AnalisisPlagas | null>(null);
  const [duracionMs, setDuracionMs] = useState<number | null>(null);

  const { lectura, conectado } = useSensores();
  const { puntos: historico } = useHistorico('semana');
  const { catalogoCalibrado, resumen, registrar, puedeCalibrar } = useCalibracion(fincaId);

  const sensorData = conectado ? lectura : null;

  const handleAnalysis = () => {
    if (!sensorData) return;

    setCalculando(true);

    // El cálculo es síncrono y tarda menos de un milisegundo. Se mide y se
    // muestra porque es justamente el argumento del enfoque local: donde la
    // consulta a un modelo remoto tardaba segundos y podía no llegar, esto
    // resuelve al instante y siempre.
    //
    // Se evalúa con el catálogo YA CALIBRADO por las observaciones de esta
    // parcela: sin observaciones es idéntico al del proyecto, así que el
    // comportamiento por defecto no cambia.
    const inicio = performance.now();
    const evaluacion = analizarDesdeLectura(sensorData, {
      historico,
      catalogo: catalogoCalibrado,
    });
    const fin = performance.now();

    setAnalisis(evaluacion);
    setResult(comoAnalisisLegado(evaluacion));
    setDuracionMs(fin - inicio);
    setCalculando(false);
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <Card className="glass-card border-none shadow-xl overflow-hidden relative group">
          {calculando && (
            <div className="absolute inset-0 bg-primary/10 z-20 pointer-events-none">
              <div className="w-full h-2 bg-primary/60 animate-scan shadow-[0_0_25px_rgba(34,197,94,0.8)]"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md">
                <BrainCircuit className="h-16 w-16 animate-pulse text-primary mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-primary animate-bounce">
                  Evaluando el catálogo...
                </p>
              </div>
            </div>
          )}

          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black flex items-center gap-2 text-primary">
                  <Sparkles className="h-6 w-6 text-primary fill-primary/20" />
                  ANÁLISIS PREDICTIVO PRO
                </CardTitle>
                <CardDescription className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                  Motor agroclimático local · {CATALOGO_PLAGAS.length} especies
                </CardDescription>
              </div>
              <Zap className="h-10 w-10 text-primary opacity-10" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Compara la lectura de tus sensores contra la envolvente climática de{' '}
              <strong>{CATALOGO_PLAGAS.length} plagas y enfermedades</strong> de la región.
              El cálculo ocurre en tu dispositivo: no necesita internet.
            </p>

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
              <WifiOff className="h-4 w-4 text-primary shrink-0" />
              <p className="text-[11px] font-bold text-primary/80 leading-tight">
                Funciona sin conexión. Ningún dato de tu finca sale del dispositivo.
              </p>
            </div>

            {!sensorData ? (
              <div className="flex items-center justify-center py-10 gap-3 text-amber-600 bg-amber-50 rounded-2xl border border-amber-100">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-xs font-black uppercase tracking-tighter">Conectando con los sensores de tu finca...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <BadgeInfo label="Hum. Aire" value={sensorData.humedadAire.toFixed(1)} unit="%" />
                  <BadgeInfo label="Temp." value={sensorData.temperatura.toFixed(1)} unit="°C" />
                  <BadgeInfo label="N'yu" value={sensorData.puntoRocio.toFixed(1)} unit="°C" />
                  <BadgeInfo label="Suelo" value={sensorData.humedadSuelo.toFixed(1)} unit="%" />
                </div>

                {historico.length > 0 && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">
                    {historico.length} lecturas de historial disponibles para grados-día
                  </p>
                )}

                <Button
                  onClick={handleAnalysis}
                  disabled={calculando}
                  className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-base"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 fill-white" /> ANALIZAR RIESGO DE PLAGAS
                  </div>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {analisis?.confianza === 'baja' && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-700">
                  Lectura de sensores dudosa
                </p>
                <ul className="text-[11px] text-amber-800/80 leading-relaxed mt-1 list-disc pl-4 space-y-0.5">
                  {analisis.avisos.map((aviso, i) => (
                    <li key={i}>{aviso}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-black text-[9px] shadow-lg bg-primary">
                IA
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground/80 tracking-tighter uppercase leading-none">
                  Análisis Agroclimático
                </h2>
                {duracionMs !== null && (
                  <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Gauge className="h-3 w-3" />
                    {CATALOGO_PLAGAS.length} especies evaluadas en {duracionMs.toFixed(2)} ms · sin conexión
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary">
              <RefreshCw className="h-3 w-3 mr-2" /> Nuevo Análisis
            </Button>
          </div>
          <PestAnalysisResult data={result} />

          {/* Cierre del ciclo de aprendizaje: el agricultor confirma o desmiente
              las plagas con más riesgo, y el motor se calibra con su respuesta. */}
          {analisis && sensorData && puedeCalibrar && analisis.relevantes.length > 0 && (
            <div className="glass-card rounded-3xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <BrainCircuit className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-primary">
                    Enseña al modelo
                  </p>
                </div>
                {resumen.observaciones > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {resumen.observaciones} observaciones ·{" "}
                    {resumen.precisionMedia !== null
                      ? `${Math.round(resumen.precisionMedia * 100)}% de acierto`
                      : "sin medir"}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ve a la parcela y dinos qué encontraste. Con tus respuestas el motor corrige sus
                umbrales para este terreno.
              </p>

              {analisis.relevantes.slice(0, 3).map((ev) => (
                <div key={ev.plaga.id} className="rounded-2xl bg-white/50 border border-white/60 p-3">
                  <p className="text-xs font-black text-foreground/85">{ev.plaga.nombreComun}</p>
                  <ConfirmarObservacion
                    evaluacion={ev}
                    lectura={sensorData}
                    habilitado={puedeCalibrar}
                    onRegistrar={registrar}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BadgeInfo({ label, value, unit }: { label: string, value: any, unit: string }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl flex items-center justify-between border border-white shadow-inner">
      <span className="font-black text-[10px] text-muted-foreground uppercase tracking-widest">{label}:</span>
      <span className="font-black text-primary text-sm">{value}{unit}</span>
    </div>
  );
}
