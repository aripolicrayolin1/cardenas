
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
  const lastAnalyzedValues = useRef<string>("");

  useEffect(() => {
    async function getPrediction() {
      // Evitar análisis redundantes si los valores no han cambiado significativamente
      const currentValuesKey = `${Math.round(sensorValues.humidity_soil)}-${Math.round(sensorValues.temp)}`;
      if (lastAnalyzedValues.current === currentValuesKey && prediction) return;

      setUpdating(true);
      try {
        const result = await predictivePestDiseaseAlerts({
          soilHumidity: sensorValues.humidity_soil,
          temperature: sensorValues.temp,
          uvRadiation: sensorValues.uv,
          cropType: "Maíz",
          region: "Hidalgo"
        });
        setPrediction(result);
        lastAnalyzedValues.current = currentValuesKey;
      } catch (error) {
        console.error("Failed to fetch AI prediction", error);
      } finally {
        setLoading(false);
        setUpdating(false);
      }
    }

    // Debounce de 2 segundos para no agotar la cuota de IA en cambios rápidos de Wokwi
    const timeout = setTimeout(getPrediction, 2000);
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
        <div className="absolute top-2 right-2 opacity-50">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            {isFallback ? (
              <WifiOff className="text-muted-foreground h-5 w-5" />
            ) : isRisk ? (
              <AlertCircle className="text-destructive h-5 w-5" />
            ) : (
              <ShieldCheck className="text-primary h-5 w-5" />
            )}
            {isFallback ? 'Análisis de Emergencia' : 'IA Analizando Datos de Wokwi'}
          </CardTitle>
          <CardDescription>
            Diagnóstico basado en sensores actuales
          </CardDescription>
        </div>
        {prediction && (
          <Badge variant={prediction.predictedRisk === 'High' ? 'destructive' : prediction.predictedRisk === 'Medium' ? 'secondary' : 'default'} className="uppercase">
            Riesgo: {prediction.predictedRisk}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/60 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent-foreground" />
            Resumen en Tiempo Real
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {prediction?.alertMessage}
          </p>
        </div>
        
        {isRisk && (
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <h4 className="font-semibold text-sm mb-1 text-destructive">Problema Detectado</h4>
            <p className="text-sm font-medium">{prediction?.potentialProblem}</p>
          </div>
        )}

        <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
          <h4 className="font-semibold text-sm mb-1 text-primary flex items-center gap-2">
            <Info className="h-4 w-4" />
            Recomendación para tu Finca
          </h4>
          <p className="text-sm italic">{prediction?.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
