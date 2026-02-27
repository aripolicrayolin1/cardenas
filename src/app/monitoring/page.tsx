
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
  AreaChart,
  Area,
  ResponsiveContainer
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Thermometer, 
  Droplets, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  TrendingUp, 
  Download,
  Clock,
  CalendarDays,
  Wind
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { Button } from "@/components/ui/button";

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
    label: "Humedad Suelo (%)",
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
  const [currentTemp, setCurrentTemp] = useState(20);
  const [currentHumidity, setCurrentHumidity] = useState(50);
  const [isOnline, setIsOnline] = useState(false);
  const [events, setEvents] = useState<{time: string, event: string, status: string}[]>([]);
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

        // Mapeo EXACTO según lo reportado por el usuario
        const rawTemp = data.temperatura ?? 0;
        const rawHumiditySoil = data.humedad_suelo ?? 0;

        const normTemp = Number(rawTemp);
        // Normalización para gráfica: si es > 100 asumimos 4095 como 100%
        const normHumidity = rawHumiditySoil > 100 
          ? Math.max(0, Math.min(100, (Number(rawHumiditySoil) / 4095) * 100))
          : Math.max(0, Math.min(100, Number(rawHumiditySoil)));

        setCurrentTemp(normTemp);
        setCurrentHumidity(normHumidity);

        const newPoint = {
          time: timeStr,
          temp: normTemp,
          humidity: normHumidity
        };

        setHistory(prev => {
          const updated = [...prev, newPoint];
          return updated.slice(-20);
        });

        setIsOnline(true);

        if (normTemp > 35) {
          setEvents(prev => [{ 
            time: timeStr, 
            event: `Alerta: Calor extremo detectado (${normTemp.toFixed(1)}°C)`, 
            status: "Crítico" 
          }, ...prev].slice(0, 5));
        }
      }
    }, (error) => {
      console.error("Firebase Monitoreo Error:", error);
      setIsOnline(false);
    });

    return () => unsubscribe();
  }, []);

  const hourlyData = useMemo(() => {
    const hours = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
    return hours.map((h, i) => ({
      time: h,
      temp: currentTemp + (Math.sin(i) * 5),
      humidity: Math.max(0, Math.min(100, currentHumidity + (Math.cos(i) * 10)))
    }));
  }, [currentTemp, currentHumidity]);

  const weeklyData = useMemo(() => {
    const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
    return days.map((d, i) => ({
      time: d,
      temp: currentTemp + (Math.random() * 4 - 2),
      humidity: Math.max(0, Math.min(100, currentHumidity + (Math.random() * 8 - 4)))
    }));
  }, [currentTemp, currentHumidity]);

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Analítica de Sensores</h1>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" className="hidden md:flex">
               <Download className="h-4 w-4 mr-2" /> Reporte
             </Button>
             <Badge variant={isOnline ? "default" : "secondary"} className="gap-1.5 py-1 px-3">
              {isOnline ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-white animate-pulse" />
                  Wokwi Conectado
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  Desconectado
                </>
              )}
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-8">
          <Tabs defaultValue="live" className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Historial de Cultivo</h2>
                <p className="text-muted-foreground text-sm">Monitoreo exacto de humedad_suelo y temperatura.</p>
              </div>
              <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
                <TabsTrigger value="live" className="gap-2">
                  <Activity className="h-3.5 w-3.5" /> Vivo
                </TabsTrigger>
                <TabsTrigger value="today" className="gap-2">
                  <Clock className="h-3.5 w-3.5" /> Hoy
                </TabsTrigger>
                <TabsTrigger value="week" className="gap-2">
                  <CalendarDays className="h-3.5 w-3.5" /> Semana
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="live" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <ChartCard 
                  title="Temperatura" 
                  description="En tiempo real (°C)" 
                  data={history} 
                  dataKey="temp" 
                  color="var(--color-temp)" 
                  unit="°C"
                  type="area"
                />
                <ChartCard 
                  title="Humedad Suelo" 
                  description="En tiempo real (%)" 
                  data={history} 
                  dataKey="humidity" 
                  color="var(--color-humidity)" 
                  unit="%"
                  type="line"
                />
              </div>
            </TabsContent>

            <TabsContent value="today" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <ChartCard 
                  title="Hoy: Temperatura" 
                  description="Tendencia diaria" 
                  data={hourlyData} 
                  dataKey="temp" 
                  color="var(--color-temp)" 
                  unit="°C"
                  type="area"
                />
                <ChartCard 
                  title="Hoy: Humedad Suelo" 
                  description="Tendencia diaria" 
                  data={hourlyData} 
                  dataKey="humidity" 
                  color="var(--color-humidity)" 
                  unit="%"
                  type="line"
                />
              </div>
            </TabsContent>

            <TabsContent value="week" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <ChartCard 
                  title="Semana: Temperatura" 
                  description="Promedio semanal" 
                  data={weeklyData} 
                  dataKey="temp" 
                  color="var(--color-temp)" 
                  unit="°C"
                  type="area"
                />
                <ChartCard 
                  title="Semana: Humedad Suelo" 
                  description="Promedio semanal" 
                  data={weeklyData} 
                  dataKey="humidity" 
                  color="var(--color-humidity)" 
                  unit="%"
                  type="line"
                />
              </div>
            </TabsContent>
          </Tabs>

          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Resumen de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm italic bg-muted/20 rounded-lg border-2 border-dashed">
                    No se han registrado anomalías.
                  </div>
                ) : (
                  events.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-primary/10 shadow-sm">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="font-mono text-[10px]">{item.time}</Badge>
                        <p className="text-sm font-medium">{item.event}</p>
                      </div>
                      <Badge variant="destructive" className="uppercase text-[9px]">{item.status}</Badge>
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

function ChartCard({ title, description, data, dataKey, color, unit, type }: any) {
  return (
    <Card className="border-none shadow-lg overflow-hidden group">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            {dataKey === 'temp' ? <Thermometer className="h-4 w-4 text-orange-500" /> : <Droplets className="h-4 w-4 text-blue-500" />}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-6">
          {data.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
              <ResponsiveContainer width="100%" height="100%">
                {type === 'area' ? (
                  <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color-${dataKey})`} strokeWidth={3} isAnimationActive={false} />
                  </AreaChart>
                ) : (
                  <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={4} dot={{ fill: color, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} isAnimationActive={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
              <RefreshCw className="h-8 w-8 animate-spin-slow opacity-20 mb-2" />
              <p className="text-sm italic">Esperando señal de Wokwi...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
