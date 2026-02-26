
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Thermometer, Sun, Wind, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SensorValues {
  humidity_soil: number;
  temp: number;
  uv: number;
  humidity_air: number;
}

interface SensorStatsProps {
  sensorValues: SensorValues;
  isOnline: boolean;
  lastUpdate: Date | null;
}

interface SensorData {
  label: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  max: number;
  key: string;
}

export function SensorStats({ sensorValues, isOnline, lastUpdate }: SensorStatsProps) {
  const sensors: SensorData[] = [
    { label: "Humedad Suelo", value: sensorValues.humidity_soil, unit: "%", icon: Droplets, color: "text-blue-500", max: 100, key: "h_soil" },
    { label: "Temperatura", value: sensorValues.temp, unit: "°C", icon: Thermometer, color: "text-orange-500", max: 50, key: "temp" },
    { label: "Radiación UV", value: sensorValues.uv, unit: " UV", icon: Sun, color: "text-yellow-500", max: 12, key: "uv" },
    { label: "Humedad Aire", value: sensorValues.humidity_air, unit: "%", icon: Wind, color: "text-teal-500", max: 100, key: "h_air" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <Badge variant={isOnline ? "default" : "secondary"} className="gap-1.5 py-1 px-3">
          {isOnline ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-white animate-pulse" />
              Estación en Línea (Wokwi)
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              Estación Desconectada
            </>
          )}
        </Badge>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <RefreshCw className={`h-3 w-3 ${isOnline ? 'animate-spin-slow' : ''}`} />
          Sincronizado: {lastUpdate ? lastUpdate.toLocaleTimeString() : "--:--:--"}
        </div>
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
              <div className="text-2xl font-bold">
                {sensor.value.toFixed(1)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {sensor.unit}
                </span>
              </div>
              <Progress 
                value={(sensor.value / sensor.max) * 100} 
                className="mt-3 h-1.5" 
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
