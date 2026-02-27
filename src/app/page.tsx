
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SensorStats } from "@/components/dashboard/sensor-stats";
import { AIRiskAlert } from "@/components/dashboard/ai-risk-alert";
import { CommunityAlerts } from "@/components/dashboard/community-alerts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Bell, Info, TrendingUp, AlertTriangle, CheckCircle2, Droplets, Thermometer, User, Radio, Zap, X } from "lucide-react";
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
import { useUser } from "@/firebase/auth/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";

const firebaseConfig = {
  databaseURL: "https://studio-3066950614-ac5b0-default-rtdb.firebaseio.com",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

const chartConfig = {
  health: { label: "Salud del Cultivo (%)", color: "hsl(var(--primary))" },
};

export default function Home() {
  const { user, loading: userLoading } = useUser();
  const { t } = useTranslation();
  const [sensorValues, setSensorValues] = useState({
    humidity_soil: 0, temp: 0, uv: 0, humidity_air: 0, et: 0, dew_point: 0, status_text: "Conectando..."
  });
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [proximityAlert, setProximityAlert] = useState<any | null>(null);
  const [showRadar, setShowRadar] = useState(true);
  
  const notifiedEvents = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkProximity = () => {
      const savedAlerts = localStorage.getItem("community_alerts");
      if (savedAlerts) {
        const alerts = JSON.parse(savedAlerts);
        const nearby = alerts.find((a: any) => a.severity === "Alta");
        if (nearby) {
          setProximityAlert(nearby);
        }
      }
    };
    
    checkProximity();
    const interval = setInterval(checkProximity, 10000);
    return () => clearInterval(interval);
  }, []);

  const performanceData = useMemo(() => {
    return [
      { month: "Ene", health: 85 },
      { month: "Feb", health: 88 },
      { month: "Mar", health: 92 },
      { month: "Abr", health: 80 },
      { month: "May", health: 85 },
      { month: "Jun", health: 90 },
    ];
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
            <h1 className="text-xl font-bold">{t('dashboard')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full"></span>
                </button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader className="pb-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Notificaciones
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  <div className="space-y-4">
                    {proximityAlert && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                        <p className="text-xs font-bold text-destructive mb-1">{t('radar_active')}</p>
                        <p className="text-sm font-bold">{proximityAlert.problem}</p>
                        <p className="text-[10px] text-muted-foreground">{proximityAlert.region} • {proximityAlert.distance}</p>
                      </div>
                    )}
                    <div className="text-center py-10 text-xs text-muted-foreground italic">No hay más avisos hoy</div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2 border-l pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{user?.displayName || t('farmer')}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Hidalgo, MX</p>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL ?? undefined} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-8 p-4 md:p-8 pt-6">
          {proximityAlert && showRadar && (
            <Alert className="bg-destructive border-none text-white shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 relative">
              <Radio className="h-5 w-5 text-white animate-pulse" />
              <button 
                onClick={() => setShowRadar(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <AlertTitle className="font-black text-lg">⚠️ {t('radar_active')}</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 pr-8">
                <p className="font-medium">
                  Se ha reportado <span className="underline">{proximityAlert.problem}</span> en <span className="font-black">{proximityAlert.region}</span>. 
                  ¡Tu campo está en el radio de riesgo!
                </p>
                <Link href="/diagnosis">
                  <Button variant="secondary" size="sm" className="font-bold gap-2">
                    <Zap className="h-4 w-4" /> {t('get_solution')}
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">{t('iot_station')}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Activity className="h-4 w-4 text-primary animate-pulse" /> Live
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
                    <TrendingUp className="h-5 w-5 text-primary" /> Historial de Salud
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="health" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorHealth)" />
                      </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <CommunityAlerts />
              
              <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Info className="h-24 w-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Dato del Sensor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm opacity-90 leading-relaxed">
                    Evapotranspiración actual: {sensorValues.et.toFixed(2)} mm. 
                    Tus cultivos están perdiendo humedad a un ritmo {sensorValues.et > 4 ? 'alto' : 'normal'}. 
                    Ajusta tu sistema de riego.
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
