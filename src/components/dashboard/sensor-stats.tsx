
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Thermometer, Sun, Wind, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

interface SensorData {
  label: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  max: number;
}

export function SensorStats() {
  // Simulamos el estado de los sensores que vendría de una base de datos real
  const [sensorValues, setSensorValues] = useState({
    humidity: 68,
    temp: 24.5,
    uv: 6,
    air: 45
  });

  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Este efecto simula la "escucha" de un sensor real. 
  // En una conexión real, aquí usaríamos onSnapshot de Firebase.
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorValues(prev => ({
        humidity: Math.min(100, Math.max(0, prev.humidity + (Math.random() * 2 - 1))),
        temp: Math.min(50, Math.max(0, prev.temp + (Math.random() * 0.4 - 0.2))),
        uv: Math.min(12, Math.max(0, prev.uv + (Math.random() * 0.2 - 0.1))),
        air: Math.min(100, Math.max(0, prev.air + (Math.random() * 1 - 0.5))),
      }));
      setLastUpdate(new Date());
    }, 3000); // Se actualiza cada 3 segundos como un sensor real

    return () => clearInterval(interval);
  }, []);

  const sensors: SensorData[] = [
    { label: "Humedad Suelo", value: parseFloat(sensorValues.humidity.toFixed(1)), unit: "%", icon: Droplets, color: "text-blue-500", max: 100 },
    { label: "Temperatura", value: parseFloat(sensorValues.temp.toFixed(1)), unit: "°C", icon: Thermometer, color: "text-orange-500", max: 50 },
    { label: "Radiación UV", value: parseFloat(sensorValues.uv.toFixed(1)), unit: " UV", icon: Sun, color: "text-yellow-500", max: 12 },
    { label: "Humedad Aire", value: parseFloat(sensorValues.air.toFixed(1)), unit: "%", icon: Wind, color: "text-teal-500", max: 100 },
  ];

  return (
    <div className="space-y-2">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sensors.map((sensor) => (
          <Card key={sensor.label} className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {sensor.label}
              </CardTitle>
              <sensor.icon className={`h-4 w-4 ${sensor.color} animate-pulse`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sensor.value}
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
      <div className="flex justify-end items-center gap-1 text-[10px] text-muted-foreground px-1">
        <RefreshCw className="h-3 w-3 animate-spin-slow" />
        Sincronizado con estación local: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
}
