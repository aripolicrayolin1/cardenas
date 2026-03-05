"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, ShieldCheck, Zap, Info, RefreshCw, BrainCircuit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { obtenerDiagnosticoIA, type DiagnosticoResultado } from "@/lib/ai-simulation";

interface AIRiskAlertProps {
  sensorValues: {
    humidity_soil: number;
    temp: number;
    uv: number;
    humidity_air: number;
    et: number;
    dew_point: number;
  };
}

export function AIRiskAlert({ sensorValues }: AIRiskAlertProps) {
  const { t, lang } = useTranslation();
  const [prediction, setPrediction] = useState<DiagnosticoResultado | null>(null);
  const [loading, setLoading] = useState(false);

  const handleManualScan = () => {
    setLoading(true);
    // Simulamos un tiempo de procesamiento para que parezca una IA real
    setTimeout(() => {
      const result = obtenerDiagnosticoIA(
        sensorValues.temp,
        sensorValues.humidity_soil,
        sensorValues.humidity_air,
        sensorValues.et,
        sensorValues.dew_point
      );
      setPrediction(result);
      setLoading(false);
    }, 2500);
  };

  const translateRisk = (risk?: string) => {
    if (!risk) return "";
    switch (risk) {
      case 'High': return t('risk_high') || "Alto";
      case 'Medium': return t('risk_medium') || "Medio";
      case 'Low': return t('risk_low') || "Bajo";
      case 'None': return t('risk_none') || "Ninguno";
      default: return risk;
    }
  };

  const safeUpper = (str: any) => {
    if (typeof str !== 'string' || !str) return "";
    return str.toUpperCase();
  };

  return (
    <Card className={`glass-card border-none shadow-xl transition-all duration-700 relative overflow-hidden group ${prediction?.riesgo === 'High' ? 'ring-2 ring-destructive/50' : 'ring-1 ring-primary/20'}`}>
      {loading && (
        <div className="absolute inset-0 bg-primary/10 z-20 pointer-events-none">
          <div className="w-full h-2 bg-primary/60 animate-scan shadow-[0_0_25px_rgba(34,197,94,0.8)]"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md">
            <BrainCircuit className="h-16 w-16 animate-pulse text-primary mb-4" />
            <p className="text-sm font-black uppercase tracking-widest text-primary animate-bounce">
              PROCESANDO DATOS IoT CON IA...
            </p>
          </div>
        </div>
      )}
      
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black flex items-center gap-2 text-primary">
            {prediction?.riesgo === 'High' ? (
              <AlertCircle className="text-destructive h-5 w-5 animate-pulse" />
            ) : (
              <ShieldCheck className="text-primary h-5 w-5" />
            )}
            <span translate="no">IA AGROTECH HIDALGO</span>
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t('risk_prediction')}
          </CardDescription>
        </div>
        {prediction && (
          <div className="flex flex-col items-end gap-1">
            <Badge variant={prediction.riesgo === 'High' ? 'destructive' : 'default'} className="uppercase font-black text-[9px] px-3 py-1 rounded-full shadow-lg">
              {t('risk')}: {translateRisk(prediction.riesgo)}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4 pt-2">
        {!prediction && !loading ? (
          <div className="py-8 text-center">
            <div className="mb-6 flex justify-center">
              <Zap className="h-10 w-10 text-primary fill-primary/20" />
            </div>
            <p className="text-xs font-bold text-muted-foreground mb-6 uppercase tracking-tighter">
              Presiona para iniciar el análisis inteligente de tus sensores en tiempo real.
            </p>
            <Button onClick={handleManualScan} className="gap-2 font-black rounded-xl px-10 py-6 bg-primary hover:bg-primary/90 shadow-lg">
               <Zap className="h-5 w-5 fill-white" /> {safeUpper(t('analyze_ai'))}
            </Button>
          </div>
        ) : prediction ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/40 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-inner">
              <h4 className="font-black text-[10px] mb-2 flex items-center gap-2 text-primary uppercase tracking-widest">
                <BrainCircuit className="h-3 w-3" />
                {lang === 'hn' ? prediction.otomi : prediction.titulo}
              </h4>
              <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
                "{prediction.desc}"
              </p>
            </div>
            
            <div className="bg-primary/10 backdrop-blur-sm p-5 rounded-2xl border border-primary/20 shadow-sm">
              <h4 className="font-black text-[10px] mb-2 text-primary flex items-center gap-2 uppercase tracking-widest">
                <Info className="h-3 w-3" />
                {safeUpper(t('recommended_action'))}
              </h4>
              <p className="text-xs font-bold leading-snug text-primary/80">
                {prediction.accion}
              </p>
            </div>

            <Button variant="ghost" size="sm" onClick={handleManualScan} className="w-full text-[9px] h-8 font-black uppercase tracking-widest text-muted-foreground hover:text-primary rounded-xl">
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> RE-ESCANEAR PARCELA
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
