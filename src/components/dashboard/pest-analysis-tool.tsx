"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { analyzePestRisk, type PredictivePestAnalysisOutput } from '@/ai/flows/predictive-pest-analysis';
import { Sparkles, Loader2, AlertCircle, BrainCircuit, RefreshCw, Zap } from 'lucide-react';
import { PestAnalysisResult } from './pest-analysis-result';
import { useDatabase } from "@/firebase";
import { ref, onValue } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function PestAnalysisTool() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictivePestAnalysisOutput | null>(null);
  const [sensorData, setSensorData] = useState<any>(null);
  const database = useDatabase();

  // Escuchar los datos reales de los sensores para que la IA los use
  useEffect(() => {
    if (!database) return;

    const sensorsRef = ref(database, "sensores");

    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorData(data);
      }
    });

    return () => unsubscribe();
  }, [database]);

  const handleAnalysis = async () => {
    if (!sensorData) return;
    
    setLoading(true);
    try {
      const input = {
        humidity: Number(sensorData["Hum. Aire"] || sensorData["Humedad Aire"] || sensorData.humedad_aire || sensorData.humedad || sensorData.humidity || 0),
        temperature: Number(sensorData.Temperatura || sensorData.temperatura || sensorData.temperature || 0),
        dewPoint: Number(sensorData["Punto Rocío"] || sensorData["Punto Rocio"] || sensorData.punto_rocio || sensorData.dew_point || 0),
        evapotranspiration: Number(sensorData["Evapotranspiración"] || sensorData.Evapotranspiracion || sensorData.evapotranspiracion || sensorData.et || sensorData.evapotranspiration || 0)
      };
      
      const response = await analyzePestRisk(input);
      setResult(response);
    } catch (error) {
      console.error("Error al analizar plagas con IA:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <Card className="glass-card border-none shadow-xl overflow-hidden relative group">
          {loading && (
            <div className="absolute inset-0 bg-primary/10 z-20 pointer-events-none">
              <div className="w-full h-2 bg-primary/60 animate-scan shadow-[0_0_25px_rgba(34,197,94,0.8)]"></div>
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md">
                <BrainCircuit className="h-16 w-16 animate-pulse text-primary mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-primary animate-bounce">
                  Consultando con Gemini IA...
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
                  Motor de Bioseguridad Avanzada
                </CardDescription>
              </div>
              <Zap className="h-10 w-10 text-primary opacity-10" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              Utilice la Inteligencia Artificial de Gemini para analizar los datos reales de sus sensores (**Hum. Aire, Temperatura, Punto Rocío y Evapotranspiración**).
            </p>
            
            {!sensorData ? (
              <div className="flex items-center justify-center py-10 gap-3 text-amber-600 bg-amber-50 rounded-2xl border border-amber-100">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-xs font-black uppercase tracking-tighter">Conectando con los sensores de tu finca...</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <BadgeInfo label="Hum. Aire" value={sensorData["Hum. Aire"] || sensorData.humedad_aire || "--"} unit="%" />
                  <BadgeInfo label="Temp." value={sensorData.Temperatura || sensorData.temperatura || "--"} unit="°C" />
                  <BadgeInfo label="N'yu" value={sensorData["Punto Rocío"] || sensorData.punto_rocio || "--"} unit="°C" />
                  <BadgeInfo label="ET" value={sensorData["Evapotranspiración"] || sensorData.et || "--"} unit=" mm" />
                </div>
                
                <Button 
                  onClick={handleAnalysis} 
                  disabled={loading}
                  className="w-full h-14 bg-primary hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 font-black uppercase tracking-widest text-base"
                >
                  {loading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" /> CONSULTANDO IA...
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 fill-white" /> ANALIZAR RIESGO DE PLAGAS
                    </div>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shadow-lg">IA</div>
              <h2 className="text-lg font-black text-foreground/80 tracking-tighter uppercase">Resultados del Análisis IA</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary">
              <RefreshCw className="h-3 w-3 mr-2" /> Nuevo Análisis
            </Button>
          </div>
          <PestAnalysisResult data={result} />
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
