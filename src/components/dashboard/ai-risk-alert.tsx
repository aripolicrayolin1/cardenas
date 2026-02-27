
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

  // Helper para traducir niveles de riesgo que vienen del backend en inglés
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
    <Card className={`border-none shadow-md transition-all duration-500 relative ${isRisk ? 'bg-accent/10 ring-1 ring-accent' : 'bg-primary/5 ring-1 ring-primary/20'}`}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            {isFallback ? (
              <WifiOff className="text-orange-500 h-5 w-5" />
            ) : isRisk ? (
              <AlertCircle className="text-destructive h-5 w-5" />
            ) : (
              <ShieldCheck className="text-primary h-5 w-5" />
            )}
            {t('risk_analysis')}
          </CardTitle>
          <CardDescription>
            {t('risk_prediction')}
          </CardDescription>
        </div>
        {!prediction && !loading && (
          <Button size="sm" onClick={handleManualScan} className="h-8 gap-2 font-bold shadow-sm">
            <Zap className="h-3.5 w-3.5" /> {t('analyze_ai')}
          </Button>
        )}
        {prediction && (
          <Badge variant={prediction.predictedRisk === 'High' ? 'destructive' : prediction.predictedRisk === 'Medium' ? 'secondary' : 'default'} className="uppercase text-[10px]">
            {t('risk')}: {translateRisk(prediction.predictedRisk)}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium animate-pulse">Consultando a los expertos virtuales...</p>
          </div>
        ) : prediction ? (
          <>
            <div className="bg-white/60 p-3 rounded-lg">
              <h4 className="font-semibold text-xs mb-1 flex items-center gap-2">
                <Zap className="h-3 w-3 text-accent-foreground" />
                Diagnóstico IA
              </h4>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {prediction?.alertMessage}
              </p>
            </div>
            
            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-xs mb-1 text-primary flex items-center gap-2">
                <Info className="h-3 w-3" />
                {t('recommended_action')}
              </h4>
              <p className="text-xs italic">{prediction?.recommendation}</p>
            </div>

            <Button variant="ghost" size="sm" onClick={handleManualScan} className="w-full text-[10px] h-6 text-muted-foreground hover:text-primary">
              <RefreshCw className="h-2 w-2 mr-1" /> Actualizar Análisis
            </Button>
          </>
        ) : (
          <div className="py-6 text-center text-xs text-muted-foreground italic border-2 border-dashed rounded-lg bg-muted/5">
            Haz clic en "{t('analyze_ai')}" para obtener una predicción basada en tus sensores.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
