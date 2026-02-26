"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, ShieldCheck, Zap, Info, WifiOff } from "lucide-react";
import { predictivePestDiseaseAlerts, type PredictiveAlertOutput } from "@/ai/flows/predictive-pest-disease-alerts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function AIRiskAlert() {
  const [prediction, setPrediction] = useState<PredictiveAlertOutput | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getPrediction() {
      try {
        const result = await predictivePestDiseaseAlerts({
          soilHumidity: 68,
          temperature: 24.5,
          uvRadiation: 6,
          cropType: "Maíz",
          region: "Hidalgo"
        });
        setPrediction(result);
      } catch (error) {
        console.error("Failed to fetch AI prediction", error);
      } finally {
        setLoading(false);
      }
    }
    getPrediction();
  }, []);

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
    <Card className={`border-none shadow-md transition-all duration-500 ${isRisk ? 'bg-accent/10 ring-1 ring-accent' : 'bg-primary/5 ring-1 ring-primary/20'}`}>
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
            {isFallback ? 'Análisis de Emergencia (Offline)' : 'Análisis Predictivo de IA'}
          </CardTitle>
          <CardDescription>
            Estado del cultivo de Maíz en Hidalgo
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
            Diagnóstico
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {prediction?.alertMessage}
          </p>
        </div>
        
        {isRisk && (
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <h4 className="font-semibold text-sm mb-1 text-destructive">Problema Potencial</h4>
            <p className="text-sm font-medium">{prediction?.potentialProblem}</p>
          </div>
        )}

        <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
          <h4 className="font-semibold text-sm mb-1 text-primary flex items-center gap-2">
            <Info className="h-4 w-4" />
            Recomendación Experta
          </h4>
          <p className="text-sm italic">{prediction?.recommendation}</p>
        </div>

        {isFallback && (
          <p className="text-[10px] text-muted-foreground text-center italic">
            * El servicio de IA está temporalmente ocupado. Mostrando resultados basados en umbrales de sensores locales.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
