
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SensorStats } from "@/components/dashboard/sensor-stats";
import { AIRiskAlert } from "@/components/dashboard/ai-risk-alert";
import { CommunityAlerts } from "@/components/dashboard/community-alerts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Bell, Info, TrendingUp, AlertTriangle, CheckCircle2, Droplets, Thermometer } from "lucide-react";
import Image from "next/image";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useRef, useMemo } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://studio-3066950614-ac5b0-default-rtdb.firebaseio.com",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

const chartConfig = {
  health: {
    label: "Salud del Cultivo (%)",
    color: "hsl(var(--primary))",
  },
};

interface Notification {
  id: string | number;
  title: string;
  description: string;
  time: string;
  type: 'alert' | 'info' | 'message' | 'success';
  icon: any;
  color: string;
}

export default function Home() {
  const [sensorValues, setSensorValues] = useState({
    humidity_soil: 0,
    temp: 0,
    uv: 0,
    humidity_air: 0,
    et: 0,
    dew_point: 0,
    status_text: "Iniciando..."
  });
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const notifiedEvents = useRef<Set<string>>(new Set());

  // Función para calcular salud basada en sensores (Lógica agronómica simple)
  const calculateHealth = (values: typeof sensorValues) => {
    let score = 100;
    
    // Normalización de humedad de suelo (asumiendo 4095 como 100%)
    const normSoil = values.humidity_soil > 100 
      ? (values.humidity_soil / 4095) * 100 
      : values.humidity_soil;

    // Penalización por falta o exceso de agua (Ideal 60-85%)
    if (normSoil < 40) score -= 25;
    if (normSoil > 90) score -= 15;
    
    // Penalización por temperatura (Ideal 18-30°C)
    if (values.temp > 35) score -= 30;
    if (values.temp < 10) score -= 20;

    return Math.max(0, Math.min(100, score));
  };

  // Generar datos de salud dinámicos basados en la lectura actual
  const performanceData = useMemo(() => {
    const currentHealth = calculateHealth(sensorValues);
    const baseHealth = isOnline ? currentHealth : 85;
    
    return [
      { month: "Ene", health: 85 },
      { month: "Feb", health: 88 },
      { month: "Mar", health: 92 },
      { month: "Abr", health: 80 },
      { month: "May", health: 85 },
      { month: "Jun", health: baseHealth }, // El mes actual reacciona a los sensores
    ];
  }, [sensorValues, isOnline]);

  useEffect(() => {
    const staticNotifs: Notification[] = [
      {
        id: 'welcome',
        title: "Bienvenido a AgroTech",
        description: "Tu sistema de gestión agrícola está listo para monitorear.",
        time: "Ahora",
        type: "success",
        icon: CheckCircle2,
        color: "text-primary"
      }
    ];

    const savedCommunityAlerts = localStorage.getItem("community_alerts");
    if (savedCommunityAlerts) {
      const alerts = JSON.parse(savedCommunityAlerts);
      const communityNotifs = alerts.slice(0, 3).map((a: any) => ({
        id: `comm-${a.id}`,
        title: `Alerta Comunitaria: ${a.region}`,
        description: `${a.problem} en cultivo de ${a.crop}.`,
        time: a.date,
        type: "alert",
        icon: AlertTriangle,
        color: "text-destructive"
      }));
      setNotifications([...communityNotifs, ...staticNotifs]);
    } else {
      setNotifications(staticNotifs);
    }
  }, []);

  useEffect(() => {
    const sensorsRef = ref(db, 'sensores');
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const newValues = {
          humidity_soil: Number(data.humedad_suelo ?? 0),
          temp: Number(data.temperatura ?? 0),
          uv: Number(data.uv ?? 0),
          humidity_air: Number(data.humedad_aire ?? 0),
          et: Number(data.et ?? 0),
          dew_point: Number(data.punto_rocio ?? 0),
          status_text: String(data.estado ?? "SISTEMA NORMAL")
        };
        
        setSensorValues(newValues);
        setIsOnline(true);
        setLastUpdate(new Date());

        const dynamicNotifs: Notification[] = [];

        if (newValues.temp > 35 && !notifiedEvents.current.has('high_temp')) {
          dynamicNotifs.push({
            id: `temp-${Date.now()}`,
            title: "Alerta: Temperatura Crítica",
            description: `Se detectaron ${newValues.temp.toFixed(1)}°C. Riesgo de estrés hídrico.`,
            time: "Ahora",
            type: "alert",
            icon: Thermometer,
            color: "text-orange-600"
          });
          notifiedEvents.current.add('high_temp');
        } else if (newValues.temp <= 35) {
          notifiedEvents.current.delete('high_temp');
        }

        const isDry = newValues.humidity_soil < 500 && newValues.humidity_soil > 0;
        if (isDry && !notifiedEvents.current.has('low_soil_moisture')) {
          dynamicNotifs.push({
            id: `soil-${Date.now()}`,
            title: "Alerta: Suelo Seco",
            description: "La humedad del suelo está en niveles críticos. Se recomienda riego.",
            time: "Ahora",
            type: "alert",
            icon: Droplets,
            color: "text-blue-600"
          });
          notifiedEvents.current.add('low_soil_moisture');
        } else if (!isDry) {
          notifiedEvents.current.delete('low_soil_moisture');
        }

        if (dynamicNotifs.length > 0) {
          setNotifications(prev => [...dynamicNotifs, ...prev].slice(0, 10));
        }
      }
    }, (error) => {
      console.error("Firebase Read Error:", error);
      setIsOnline(false);
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
            <h1 className="text-xl font-bold">Resumen de Gestión</h1>
          </div>
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors group">
                  <Bell className="h-5 w-5 group-hover:shake" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full border-2 border-white"></span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-[350px] sm:w-[400px]">
                <SheetHeader className="pb-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notificaciones en Vivo
                  </SheetTitle>
                  <SheetDescription>
                    Alertas generadas por tus sensores y la comunidad.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-150px)] mt-4 pr-4">
                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground italic text-sm">
                        Sin notificaciones nuevas.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className="flex gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors animate-in fade-in slide-in-from-right-4 duration-300">
                          <div className={`mt-1 p-2 rounded-full bg-muted ${notif.color}`}>
                            <notif.icon className="h-4 w-4" />
                          </div>
                          <div className="space-y-1 flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-sm font-bold leading-none">{notif.title}</h4>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{notif.time}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {notif.description}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 border-l pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">Juan Pérez</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Agricultor Hidalgo</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 overflow-hidden">
                 <Image 
                   src="https://picsum.photos/seed/farmer/100/100" 
                   alt="Profile" 
                   width={32} 
                   height={32} 
                   className="object-cover"
                 />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-8 p-4 md:p-8 pt-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Monitoreo IoT</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Activity className="h-4 w-4 text-primary animate-pulse" /> Actualizado: {lastUpdate ? lastUpdate.toLocaleTimeString() : '---'}
              </p>
            </div>
            <SensorStats sensorValues={sensorValues} isOnline={isOnline} lastUpdate={lastUpdate} />
          </section>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <AIRiskAlert sensorValues={sensorValues} />
              
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Historial de Salud (Dinámico)
                  </CardTitle>
                  <CardDescription>
                    Bienestar del cultivo calculado en base a humedad y temperatura de Wokwi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-fit w-full pb-6">
                  <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} 
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          domain={[0, 100]}
                          tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area 
                          type="monotone" 
                          dataKey="health" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          fillOpacity={1} 
                          fill="url(#colorHealth)" 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <CommunityAlerts />
              
              <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Info className="h-24 w-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Tip del Día</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed opacity-90">
                    La evapotranspiración (ET) de tu campo es de {sensorValues.et.toFixed(2)}. Monitorea este valor para evitar el desperdicio de agua. El punto de rocío actual es de {sensorValues.dew_point.toFixed(1)}°C.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
