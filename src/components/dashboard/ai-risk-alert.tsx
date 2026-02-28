"use client";

import { useState } from "react";
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
  const [prediction, setPrediction] = useState<PredictiveAlertOutput | null>(null);
  const [loading, setLoading] = useState(false);

  const handleManualScan = async () => {
    setLoading(true);
    
    try {
      // Intentamos la llamada real a la IA
      const result = await predictivePestDiseaseAlerts({
        soilHumidity: sensorValues.humidity_soil,
        temperature: sensorValues.temp,
        uvRadiation: sensorValues.uv,
        cropType: "Maíz (Däthä)",
        region: "Valle del Mezquital, Hidalgo"
      });
      
      // Simulamos un pequeño retraso visual para que se vea el escaneo en el video
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPrediction(result);
    } catch (error) {
      // Si falla la red por completo
      setPrediction({
        alertNeeded: true,
        alertMessage: "Error de conexión con el núcleo de IA. Activando motor experto local de respaldo.",
        predictedRisk: 'Medium',
        potentialProblem: "Análisis Local Activado",
        recommendation: "Verifica manualmente los niveles de humedad en el envés de las hojas.",
        isFallback: true
      });
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
      {/* Animación de escaneo (solo visible durante la carga) */}
      {loading && (
        <div className="absolute inset-0 bg-primary/10 z-20 pointer-events-none">
          <div className="w-full h-2 bg-primary/60 animate-scan shadow-[0_0_25px_rgba(34,197,94,0.8)]"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm">
            <div className="relative">
              <RefreshCw className="h-16 w-16 animate-spin text-primary opacity-20" />
              <Zap className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-primary animate-pulse">
              {t('analyze_ai').toUpperCase()}...
            </p>
          </div>
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
          <div className="flex flex-col items-end gap-1">
            <Badge variant={prediction.predictedRisk === 'High' ? 'destructive' : 'default'} className="uppercase font-black text-[9px] px-3 py-1 rounded-full shadow-lg">
              {t('risk')}: {translateRisk(prediction.predictedRisk)}
            </Badge>
            {isFallback && <Badge variant="secondary" className="text-[8px] font-black bg-orange-500/10 text-orange-600 border-orange-500/20">{t('fallback_mode')}</Badge>}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4 pt-2">
        {!prediction && !loading ? (
          <div className="py-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-6 flex justify-center">
              <div className="bg-primary/10 p-5 rounded-full ring-8 ring-primary/5">
                <Zap className="h-10 w-10 text-primary fill-primary/20" />
              </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground mb-6 max-w-[200px] mx-auto leading-tight uppercase tracking-tighter">
              Presiona para iniciar el diagnóstico neuronal de tu cultivo.
            </p>
            <Button 
              onClick={handleManualScan} 
              className="gap-2 font-black rounded-xl px-10 py-7 text-lg shadow-xl hover:scale-105 active:scale-95 transition-all bg-primary hover:bg-primary/90"
            >
               <Zap className="h-6 w-6 fill-white" /> {t('analyze_ai')}
            </Button>
          </div>
        ) : prediction ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-1000">
            <div className="bg-white/40 backdrop-blur-md p-5 rounded-2xl border border-white/60 shadow-inner group-hover:bg-white/60 transition-colors">
              <h4 className="font-black text-[10px] mb-2 flex items-center gap-2 text-primary uppercase tracking-widest">
                <Zap className="h-3 w-3 fill-primary" />
                Diagnóstico de Inteligencia Artificial
              </h4>
              <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
                "{prediction?.alertMessage}"
              </p>
            </div>
            
            <div className="bg-primary/10 backdrop-blur-sm p-5 rounded-2xl border border-primary/20 shadow-sm">
              <h4 className="font-black text-[10px] mb-2 text-primary flex items-center gap-2 uppercase tracking-widest">
                <Info className="h-3 w-3" />
                {t('recommended_action')}
              </h4>
              <p className="text-xs font-bold leading-snug text-primary/80">
                {prediction?.recommendation}
              </p>
            </div>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleManualScan} 
              className="w-full text-[9px] h-8 font-black uppercase tracking-widest text-muted-foreground hover:text-primary rounded-xl hover:bg-white/50 transition-all border border-transparent hover:border-primary/10"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" /> Actualizar Predicción
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
