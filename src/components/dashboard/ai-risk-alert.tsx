
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, ShieldCheck, Zap, Info, WifiOff, Loader2, RefreshCw } from "lucide-react";
import { predictivePestDiseaseAlerts, type PredictiveAlertOutput } from "@/ai/flows/predictive-pest-disease-alerts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

interface AIRiskAlertProps {
  sensorValues: {
    humidity_soil: number;
    temp: number;
    uv: number;
    humidity_air: number;
  };
}

export function AIRiskAlert({ sensorValues }: AIRiskAlertProps) {
  const { t } = useTranslation();
  
  // Estado inicial con un diagnóstico simulado de alta calidad para el video
  const [prediction, setPrediction] = useState<PredictiveAlertOutput | null>({
    alertNeeded: true,
    alertMessage: "Análisis inteligente detecta condiciones de riesgo por exceso de humedad en el suelo (Hñähñu: De’mthe Hoi) y temperatura estable. Existe posibilidad de proliferación de hongos en la raíz.",
    predictedRisk: 'Medium',
    potentialProblem: "Hongo por humedad",
    recommendation: "Se recomienda suspender el riego automático por las próximas 12 horas y verificar el drenaje en la zona norte de la parcela.",
    isFallback: false
  });
  
  const [loading, setLoading] = useState(false);
  const [hasAutoScanned, setHasAutoScanned] = useState(false);

  // Efecto para auto-escanear cuando lleguen datos reales (útil para el video)
  useEffect(() => {
    if (!hasAutoScanned && sensorValues.humidity_soil > 0) {
      handleManualScan();
      setHasAutoScanned(true);
    }
  }, [sensorValues, hasAutoScanned]);

  const handleManualScan = async () => {
    setLoading(true);
    
    const normalizedHumidity = sensorValues.humidity_soil > 100 
      ? Math.max(0, Math.min(100, (sensorValues.humidity_soil / 4095) * 100))
      : Math.max(0, Math.min(100, sensorValues.humidity_soil));
    
    const normalizedTemp = Math.max(-10, Math.min(60, sensorValues.temp));
    
    try {
      const result = await predictivePestDiseaseAlerts({
        soilHumidity: normalizedHumidity,
        temperature: normalizedTemp,
        uvRadiation: sensorValues.uv,
        cropType: "Maíz",
        region: "Hidalgo"
      });
      setPrediction(result);
    } catch (error) {
      console.error("Failed to fetch AI prediction", error);
    } finally {
      setLoading(false);
    }
  };

  const isRisk = prediction?.alertNeeded;
  const isFallback = prediction?.isFallback;

  const translateRisk = (risk: string) => {
    switch (risk) {
      case 'High': return t('risk_high');
      case 'Medium': return t('risk_medium');
      case 'Low': return t('risk_low');
      case 'None': return t('risk_none');
      default: return risk;
    }
  };

  return (
    <Card className={`glass-card border-none shadow-xl transition-all duration-700 relative overflow-hidden group ${isRisk ? 'ring-2 ring-accent/50' : 'ring-1 ring-primary/20'}`}>
      {/* Efecto visual de escaneo para el video */}
      {loading && (
        <div className="absolute inset-0 bg-primary/5 z-10">
          <div className="w-full h-1 bg-primary/40 animate-scan shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
        </div>
      )}
      
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black flex items-center gap-2 text-primary">
            {isFallback ? (
              <WifiOff className="text-orange-500 h-5 w-5" />
            ) : isRisk ? (
              <AlertCircle className="text-accent h-5 w-5 animate-pulse" />
            ) : (
              <ShieldCheck className="text-primary h-5 w-5" />
            )}
            {t('risk_analysis')}
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t('risk_prediction')}
          </CardDescription>
        </div>
        {prediction && (
          <Badge variant={prediction.predictedRisk === 'High' ? 'destructive' : 'default'} className="uppercase font-black text-[9px] px-3 py-1 rounded-full shadow-lg">
            {t('risk')}: {translateRisk(prediction.predictedRisk)}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4 pt-2">
        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <div className="relative">
              <RefreshCw className="h-10 w-10 animate-spin text-primary opacity-20" />
              <Zap className="h-5 w-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
            </div>
            <p className="text-xs font-black uppercase tracking-tighter animate-pulse">Sincronizando con Red Neuronal Hidalgo...</p>
          </div>
        ) : prediction ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-inner group-hover:bg-white/60 transition-colors">
              <h4 className="font-black text-[10px] mb-2 flex items-center gap-2 text-primary uppercase tracking-widest">
                <Zap className="h-3 w-3 fill-primary" />
                Diagnóstico de Inteligencia Artificial
              </h4>
              <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
                "{prediction?.alertMessage}"
              </p>
            </div>
            
            <div className="bg-primary/10 backdrop-blur-sm p-4 rounded-2xl border border-primary/20 shadow-sm">
              <h4 className="font-black text-[10px] mb-2 text-primary flex items-center gap-2 uppercase tracking-widest">
                <Info className="h-3 w-3" />
                {t('recommended_action')}
              </h4>
              <p className="text-xs font-bold leading-snug text-primary/80">
                {prediction?.recommendation}
              </p>
            </div>

            <Button variant="ghost" size="sm" onClick={handleManualScan} className="w-full text-[9px] h-7 font-black uppercase tracking-widest text-muted-foreground hover:text-primary rounded-xl hover:bg-white/50 transition-all">
              <RefreshCw className="h-3 w-3 mr-2" /> Actualizar Predicción
            </Button>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Button onClick={handleManualScan} className="gap-2 font-black rounded-xl px-8 py-6 text-lg shadow-xl hover:scale-105 transition-all">
               <Zap className="h-5 w-5 fill-white" /> {t('analyze_ai')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
