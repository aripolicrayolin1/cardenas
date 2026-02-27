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
      label: t('humidity_air'), 
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
      label: t('dew_point'), 
      displayValue: sensorValues.dew_point,
      unit: "°C", 
      icon: Snowflake, 
      color: "text-cyan-500", 
      max: 40 
    },
    { 
      label: t('evapotranspiration'), 
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
          <Badge variant={isOnline ? "default" : "secondary"} className={`gap-1.5 py-1.5 px-4 rounded-full font-black text-[10px] tracking-widest shadow-sm ${isOnline ? 'bg-primary/90' : 'bg-slate-400'}`}>
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-white animate-pulse" />
                {t('online').toUpperCase()}
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" />
                {t('offline').toUpperCase()}
              </>
            )}
          </Badge>
          <Badge variant="outline" className="gap-1.5 py-1.5 px-4 rounded-full bg-white/40 backdrop-blur-sm border-primary/20 font-black text-[10px] tracking-widest text-primary shadow-sm">
            <Zap className={`h-3.5 w-3.5 ${isOnline ? 'text-primary' : 'text-muted-foreground'}`} />
            {t('status').toUpperCase()}: {sensorValues.status_text.toUpperCase()}
          </Badge>
        </div>
        {mounted && (
          <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground shadow-sm">
            <RefreshCw className={`h-3 w-3 text-primary ${isOnline ? 'animate-spin-slow' : ''}`} />
            {t('sync').toUpperCase()}: {lastUpdate ? lastUpdate.toLocaleTimeString() : "--:--:--"}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {sensors.map((sensor) => (
          <Card key={sensor.label} className="glass-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">
                {sensor.label}
              </CardTitle>
              <div className={`p-2 rounded-xl bg-white/50 shadow-inner ${sensor.color} transition-all group-hover:scale-110`}>
                <sensor.icon className={`h-4 w-4 ${isOnline ? 'animate-pulse' : 'opacity-40'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black flex items-baseline gap-1 text-foreground/80">
                {sensor.displayValue.toFixed(1)}
                <span className="text-xs font-bold text-muted-foreground">
                  {sensor.unit}
                </span>
              </div>
              {sensor.isAnalog && (
                 <p className="text-[9px] text-blue-500 font-bold mt-1 uppercase tracking-tighter">CRUDO: {sensorValues.humidity_soil}</p>
              )}
              <div className="mt-4 relative">
                <Progress 
                  value={Math.max(0, Math.min(100, (sensor.displayValue / sensor.max) * 100))} 
                  className="h-2 bg-black/5" 
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}