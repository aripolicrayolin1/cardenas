
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Thermometer, Sun, Wind } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SensorData {
  label: string;
  value: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  max: number;
}

const sensors: SensorData[] = [
  { label: "Humedad Suelo", value: 68, unit: "%", icon: Droplets, color: "text-blue-500", max: 100 },
  { label: "Temperatura", value: 24.5, unit: "°C", icon: Thermometer, color: "text-orange-500", max: 50 },
  { label: "Radiación UV", value: 6, unit: " UV", icon: Sun, color: "text-yellow-500", max: 12 },
  { label: "Humedad Aire", value: 45, unit: "%", icon: Wind, color: "text-teal-500", max: 100 },
];

export function SensorStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {sensors.map((sensor) => (
        <Card key={sensor.label} className="overflow-hidden border-none shadow-md bg-white/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {sensor.label}
            </CardTitle>
            <sensor.icon className={`h-4 w-4 ${sensor.color}`} />
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
  );
}
