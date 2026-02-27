
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Thermometer, Sun, Wind, RefreshCw, Wifi, WifiOff, CloudRain } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface SensorValues {
  humidity_soil: number;
  temp: number;
  uv: number;
  humidity_air: number;
  et: number;
}

interface SensorStatsProps {
  sensorValues: SensorValues;
  isOnline: boolean;
  lastUpdate: Date | null;
}

interface SensorData {
  label: string;
  value: number;
  displayValue: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  max: number;
  key: string;
}

export function SensorStats({ sensorValues, isOnline, lastUpdate }: SensorStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lógica de mapeo EXACTO con lo que envía el ESP32
  const sensors: SensorData[] = [
    { 
      label: "Humedad Suelo", 
      value: sensorValues.humidity_soil, 
      // Si el valor es > 100, asumimos que es analógico (0-4095) y lo normalizamos
      displayValue: sensorValues.humidity_soil > 100 
        ? Math.max(0, Math.min(100, (sensorValues.humidity_soil / 4095) * 100)) 
        : sensorValues.humidity_soil,
      unit: "%", 
      icon: Droplets, 
      color: "text-blue-600", 
      max: 100, 
      key: "humedad_suelo" 
    },
    { 
      label: "Humedad Aire", 
      value: sensorValues.humidity_air, 
      displayValue: sensorValues.humidity_air,
      unit: "%", 
      icon: Wind, 
      color: "text-teal-500", 
      max: 100, 
      key: "humedad_aire" 
    },
    { 
      label: "Temperatura", 
      value: sensorValues.temp, 
      displayValue: sensorValues.temp,
      unit: "°C", 
      icon: Thermometer, 
      color: "text-orange-500", 
      max: 50, 
      key: "temperatura" 
    },
    { 
      label: "Evapotransp. (ET)", 
      value: sensorValues.et, 
      displayValue: sensorValues.et,
      unit: " mm", 
      icon: CloudRain, 
      color: "text-purple-500", 
      max: 10, 
      key: "et" 
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <Badge variant={isOnline ? "default" : "secondary"} className="gap-1.5 py-1 px-3">
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-white animate-pulse" />
              Estación en Línea (Wokwi Activo)
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              Estación Desconectada
            </>
          )}
        </Badge>
        {mounted && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <RefreshCw className={`h-3 w-3 ${isOnline ? 'animate-spin-slow' : ''}`} />
            Sincronizado: {lastUpdate ? lastUpdate.toLocaleTimeString() : "--:--:--"}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sensors.map((sensor) => (
          <Card key={sensor.label} className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {sensor.label}
              </CardTitle>
              <sensor.icon className={`h-4 w-4 ${sensor.color} ${isOnline ? 'animate-pulse' : 'opacity-40'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-baseline gap-1">
                {sensor.displayValue.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground">
                  {sensor.unit}
                </span>
                {sensor.value > 100 && sensor.label === "Humedad Suelo" && (
                   <span className="text-[10px] text-blue-500 font-normal ml-auto">(Normalizado)</span>
                )}
              </div>
              <Progress 
                value={(sensor.displayValue / sensor.max) * 100} 
                className="mt-3 h-1.5" 
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
