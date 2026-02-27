"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, ShieldCheck, Zap, Info, WifiOff, Loader2 } from "lucide-react";
import { predictivePestDiseaseAlerts, type PredictiveAlertOutput } from "@/ai/flows/predictive-pest-disease-alerts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AIRiskAlertProps {
  sensorValues: {
    humidity_soil: number;
    temp: number;
    uv: number;
    humidity_air: number;
  };
}

export function AIRiskAlert({ sensorValues }: AIRiskAlertProps) {
  const [prediction, setPrediction] = useState<PredictiveAlertOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    async function getPrediction() {
      // Actualizar máximo cada 120 segundos para ahorrar cuota de las llaves
      const now = Date.now();
      if (now - lastUpdateRef.current < 120000 && prediction) return;

      const normalizedHumidity = sensorValues.humidity_soil > 100 
        ? Math.max(0, Math.min(100, (sensorValues.humidity_soil / 4095) * 100))
        : Math.max(0, Math.min(100, sensorValues.humidity_soil));
      
      const normalizedTemp = Math.max(-10, Math.min(60, sensorValues.temp));
      
      setUpdating(true);
      try {
        const result = await predictivePestDiseaseAlerts({
          soilHumidity: normalizedHumidity,
          temperature: normalizedTemp,
          uvRadiation: sensorValues.uv,
          cropType: "Maíz",
          region: "Hidalgo"
        });
        setPrediction(result);
        lastUpdateRef.current = Date.now();
      } catch (error) {
        console.error("Failed to fetch AI prediction", error);
      } finally {
        setLoading(false);
        setUpdating(false);
      }
    }

    const timeout = setTimeout(getPrediction, 8000);
    return () => clearTimeout(timeout);
  }, [sensorValues, prediction]);

  if (loading) {
    return (
      <Card className="border-none shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isRisk = prediction?.alertNeeded;
  const isFallback = prediction?.isFallback;

  return (
    <Card className={`border-none shadow-md transition-all duration-500 relative ${isRisk ? 'bg-accent/10 ring-1 ring-accent' : 'bg-primary/5 ring-1 ring-primary/20'}`}>
      {updating && (
        <div className="absolute top-2 right-2 opacity-50 flex items-center gap-2 text-[10px] font-medium text-primary">
          <span className="animate-pulse">Sincronizando IA...</span>
          <Loader2 className="h-3 w-3 animate-spin" />
        </div>
      )}
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
            {isFallback ? 'Analítica Local' : 'IA de Sensores'}
          </CardTitle>
          <CardDescription>
            Análisis predictivo de cultivos
          </CardDescription>
        </div>
        {prediction && (
          <Badge variant={prediction.predictedRisk === 'High' ? 'destructive' : prediction.predictedRisk === 'Medium' ? 'secondary' : 'default'} className="uppercase text-[10px]">
            Riesgo: {prediction.predictedRisk}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/60 p-3 rounded-lg">
          <h4 className="font-semibold text-xs mb-1 flex items-center gap-2">
            <Zap className="h-3 w-3 text-accent-foreground" />
            Diagnóstico
          </h4>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {prediction?.alertMessage}
          </p>
        </div>
        
        {isRisk && (
          <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
            <h4 className="font-semibold text-xs mb-1 text-destructive">Amenaza</h4>
            <p className="text-xs font-medium">{prediction?.potentialProblem}</p>
          </div>
        )}

        <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
          <h4 className="font-semibold text-xs mb-1 text-primary flex items-center gap-2">
            <Info className="h-3 w-3" />
            Acción sugerida
          </h4>
          <p className="text-xs italic">{prediction?.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
