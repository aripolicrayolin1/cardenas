
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Activity, Thermometer, Droplets, Calendar, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Configuración de Firebase Realtime Database
const firebaseConfig = {
  databaseURL: "https://studio-3066950614-ac5b0-default-rtdb.firebaseio.com",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

const chartConfig = {
  temp: {
    label: "Temperatura (°C)",
    color: "hsl(var(--chart-4))",
  },
  humidity: {
    label: "Humedad (%)",
    color: "hsl(var(--chart-1))",
  },
};

interface SensorPoint {
  time: string;
  temp: number;
  humidity: number;
}

export default function MonitoringPage() {
  const [history, setHistory] = useState<SensorPoint[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [events, setEvents] = useState<{time: string, event: string, status: string}[]>([]);

  // Referencia para no añadir duplicados si el tiempo es el mismo
  const lastTimeRef = useRef<string>("");

  useEffect(() => {
    const sensorsRef = ref(db, 'sensores');
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        if (timeStr === lastTimeRef.current) return;
        lastTimeRef.current = timeStr;

        const newPoint = {
          time: timeStr.split(' ')[0], // Solo la parte de la hora
          temp: data.temperatura || 0,
          humidity: data.humedad_suelo || 0
        };

        setHistory(prev => {
          const updated = [...prev, newPoint];
          // Mantener los últimos 15 puntos para que el gráfico no se amontone
          return updated.slice(-15);
        });

        setIsOnline(true);
        setLastUpdate(now);

        // Lógica simple de eventos basada en umbrales
        if (data.temperatura > 30) {
          const newEvent = { 
            time: timeStr, 
            event: `Pico de calor detectado (${data.temperatura.toFixed(1)}°C)`, 
            status: "Atención" 
          };
          setEvents(prev => [newEvent, ...prev].slice(0, 5));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Monitoreo de Sensores</h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end mr-2">
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Sincronización</p>
                <p className="text-xs font-mono">{lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}</p>
             </div>
             <Badge variant={isOnline ? "default" : "secondary"} className="gap-1.5 py-1 px-3">
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-white animate-pulse" />
                  En Vivo
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  Estación Desconectada
                </>
              )}
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-none shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Thermometer className="h-24 w-24 text-orange-500" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-orange-500" />
                  Tendencia de Temperatura
                </CardTitle>
                <CardDescription>Lecturas en tiempo real (°C)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {history.length > 0 ? (
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                          <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-temp)" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="var(--color-temp)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                          <XAxis 
                            dataKey="time" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 60]}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area 
                            type="monotone" 
                            dataKey="temp" 
                            stroke="var(--color-temp)" 
                            fillOpacity={1} 
                            fill="url(#colorTemp)" 
                            strokeWidth={2}
                            animationDuration={300}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <RefreshCw className="h-8 w-8 animate-spin-slow opacity-20" />
                      <p className="text-sm italic">Esperando datos de Wokwi...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Droplets className="h-24 w-24 text-blue-500" />
              </div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-blue-500" />
                  Humedad del Suelo
                </CardTitle>
                <CardDescription>Lecturas en tiempo real (%)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {history.length > 0 ? (
                    <ChartContainer config={chartConfig}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                          <XAxis 
                            dataKey="time" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <YAxis 
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line 
                            type="monotone" 
                            dataKey="humidity" 
                            stroke="var(--color-humidity)" 
                            strokeWidth={3}
                            dot={{ fill: 'var(--color-humidity)', r: 3 }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                            animationDuration={300}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <RefreshCw className="h-8 w-8 animate-spin-slow opacity-20" />
                      <p className="text-sm italic">Esperando datos de Wokwi...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Resumen de Condiciones Críticas
              </CardTitle>
              <CardDescription>Eventos detectados automáticamente por los sensores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground italic text-sm">
                    No se han detectado anomalías recientes en las lecturas.
                  </div>
                ) : (
                  events.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-muted-foreground w-16">{item.time}</span>
                        <p className="text-sm font-medium">{item.event}</p>
                      </div>
                      <Badge variant={item.status === 'Atención' ? 'secondary' : 'outline'}>{item.status}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
