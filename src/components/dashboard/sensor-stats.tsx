
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Thermometer, Wind, RefreshCw, Wifi, WifiOff, CloudRain, Snowflake, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";

interface SensorValues {
  humidity_soil: number;
  temp: number;
  uv: number;
  humidity_air: number;
  et: number;
  dew_point: number;
  status_text: string;
}

interface SensorStatsProps {
  sensorValues: SensorValues;
  isOnline: boolean;
  lastUpdate: Date | null;
}

export function SensorStats({ sensorValues, isOnline, lastUpdate }: SensorStatsProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = [
    { 
      label: t('soil_humidity'), 
      displayValue: sensorValues.humidity_soil > 100 
        ? Math.max(0, Math.min(100, (sensorValues.humidity_soil / 4095) * 100)) 
        : sensorValues.humidity_soil,
      unit: "%", 
      icon: Droplets, 
      color: "text-blue-600", 
      max: 100,
      isAnalog: sensorValues.humidity_soil > 100
    },
    { 
      label: "Hum. Aire", 
      displayValue: sensorValues.humidity_air,
      unit: "%", 
      icon: Wind, 
      color: "text-teal-500", 
      max: 100 
    },
    { 
      label: t('air_temp'), 
      displayValue: sensorValues.temp,
      unit: "°C", 
      icon: Thermometer, 
      color: "text-orange-500", 
      max: 50 
    },
    { 
      label: "Punto Rocío", 
      displayValue: sensorValues.dew_point,
      unit: "°C", 
      icon: Snowflake, 
      color: "text-cyan-500", 
      max: 40 
    },
    { 
      label: "Evapotransp. (ET)", 
      displayValue: sensorValues.et,
      unit: " mm", 
      icon: CloudRain, 
      color: "text-purple-500", 
      max: 10 
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2">
          <Badge variant={isOnline ? "default" : "secondary"} className="gap-1.5 py-1 px-3">
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-white animate-pulse" />
                Estación en Línea
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                Desconectado
              </>
            )}
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1 px-3 bg-white/50 border-primary/20">
            <Zap className={`h-3.5 w-3.5 ${isOnline ? 'text-primary' : 'text-muted-foreground'}`} />
            Estado: {sensorValues.status_text}
          </Badge>
        </div>
        {mounted && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <RefreshCw className={`h-3 w-3 ${isOnline ? 'animate-spin-slow' : ''}`} />
            Sincronizado: {lastUpdate ? lastUpdate.toLocaleTimeString() : "--:--:--"}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {sensors.map((sensor) => (
          <Card key={sensor.label} className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {sensor.label}
              </CardTitle>
              <sensor.icon className={`h-4 w-4 ${sensor.color} ${isOnline ? 'animate-pulse' : 'opacity-40'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-baseline gap-1">
                {sensor.displayValue.toFixed(1)}
                <span className="text-xs font-normal text-muted-foreground">
                  {sensor.unit}
                </span>
              </div>
              {sensor.isAnalog && (
                 <p className="text-[9px] text-blue-500 font-medium mt-1">Dato Crudo: {sensorValues.humidity_soil}</p>
              )}
              <Progress 
                value={Math.max(0, Math.min(100, (sensor.displayValue / sensor.max) * 100))} 
                className="mt-3 h-1.5" 
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
