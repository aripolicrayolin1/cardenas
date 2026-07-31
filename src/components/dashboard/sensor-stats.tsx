"use client";

import { Droplets, Thermometer, Wind, RefreshCw, WifiOff, CloudRain, Snowflake, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { isRawAdcReading, normalizeSoilPercent } from "@/lib/sensors";

interface SensorValues {
  humidity_soil: number;
  temp: number;
  /** % de luz visible (fotorresistencia). No es radiación UV. */
  luz: number;
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

/**
 * Tarjetas de lectura en vivo del ESP32.
 *
 * El valor se muestra en tipografía grande con la unidad reducida al lado: es
 * el dato que el agricultor lee de un vistazo desde el celular, a veces bajo el
 * sol y con el teléfono en una mano. La barra inferior sitúa la lectura dentro
 * del rango del sensor sin necesidad de leer el número.
 */
export function SensorStats({ sensorValues, isOnline, lastUpdate }: SensorStatsProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sensors = [
    {
      label: 'soil_humidity',
      displayValue: normalizeSoilPercent(sensorValues.humidity_soil),
      unit: "%",
      icon: Droplets,
      tint: "text-sky-600",
      tintBg: "bg-sky-500/10",
      bar: "bg-sky-500",
      max: 100,
      isAnalog: isRawAdcReading(sensorValues.humidity_soil),
    },
    {
      label: 'humidity_air',
      displayValue: sensorValues.humidity_air,
      unit: "%",
      icon: Wind,
      tint: "text-teal-600",
      tintBg: "bg-teal-500/10",
      bar: "bg-teal-500",
      max: 100,
    },
    {
      label: 'air_temp',
      displayValue: sensorValues.temp,
      unit: "°C",
      icon: Thermometer,
      tint: "text-orange-600",
      tintBg: "bg-orange-500/10",
      bar: "bg-orange-500",
      max: 50,
    },
    {
      label: 'dew_point',
      displayValue: sensorValues.dew_point,
      unit: "°C",
      icon: Snowflake,
      tint: "text-cyan-600",
      tintBg: "bg-cyan-500/10",
      bar: "bg-cyan-500",
      max: 40,
    },
    {
      label: 'evapotranspiration',
      displayValue: sensorValues.et,
      unit: "mm",
      icon: CloudRain,
      tint: "text-violet-600",
      tintBg: "bg-violet-500/10",
      bar: "bg-violet-500",
      max: 10,
    },
    {
      // Luz visible del LDR (GPIO35). El campo llegaba del ESP32 pero nunca se
      // mostraba; siendo un sensor real, tiene su propia tarjeta.
      label: 'light_level',
      displayValue: sensorValues.luz,
      unit: "%",
      icon: Sun,
      tint: "text-amber-600",
      tintBg: "bg-amber-500/10",
      bar: "bg-amber-500",
      max: 100,
    },
  ];

  if (!mounted) {
    return (
      <div className="space-y-4 min-h-[200px] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary/30" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Barra de estado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`pill text-white shadow-lg ${
              isOnline ? 'bg-primary shadow-primary/25' : 'bg-slate-400 shadow-slate-400/20'
            }`}
          >
            {isOnline ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-white" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span suppressHydrationWarning>
              {(t(isOnline ? 'online' : 'offline') || "").toUpperCase()}
            </span>
          </div>

          <div className="pill bg-white/60 backdrop-blur-sm border border-white/70 text-primary">
            <span suppressHydrationWarning>
              {(sensorValues.status_text || "").toUpperCase()}
            </span>
          </div>
        </div>

        <div className="pill bg-white/50 backdrop-blur-sm border border-white/60 text-muted-foreground normal-case tracking-normal">
          <RefreshCw className={`h-3 w-3 text-primary ${isOnline ? 'animate-spin-slow' : ''}`} />
          <span className="font-bold" suppressHydrationWarning>
            {lastUpdate ? lastUpdate.toLocaleTimeString() : "--:--:--"}
          </span>
        </div>
      </div>

      {/* Lecturas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {sensors.map((sensor) => {
          const porcentaje = Math.max(0, Math.min(100, (sensor.displayValue / sensor.max) * 100));

          return (
            <div key={sensor.label} className="stat-tile p-5 group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-2xl ${sensor.tintBg} ${sensor.tint}`}>
                  <sensor.icon className={`h-4 w-4 ${isOnline ? '' : 'opacity-40'}`} />
                </div>
                {sensor.isAnalog && (
                  <span
                    className="text-[8px] font-black text-sky-600/70 uppercase tracking-widest bg-sky-500/10 px-2 py-0.5 rounded-full"
                    suppressHydrationWarning
                  >
                    ADC {sensorValues.humidity_soil}
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black tracking-tighter text-foreground/85 leading-none tabular-nums">
                  {sensor.displayValue.toFixed(1)}
                </span>
                <span className="text-sm font-black text-muted-foreground/70">{sensor.unit}</span>
              </div>

              <p
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-2 leading-tight"
                suppressHydrationWarning
              >
                {t(sensor.label as any)}
              </p>

              <div className="mt-4 h-1.5 w-full rounded-full bg-foreground/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full ${sensor.bar} transition-all duration-700 ease-out ${
                    isOnline ? 'opacity-80' : 'opacity-30'
                  }`}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
