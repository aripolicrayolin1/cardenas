"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SensorStats } from "@/components/dashboard/sensor-stats";
import { PestAnalysisTool } from "@/components/dashboard/pest-analysis-tool";
import { CommunityAlerts } from "@/components/dashboard/community-alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bell, Info, TrendingUp, Radio, Zap, X, User } from "lucide-react";
import Link from "next/link";
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
  SheetTrigger 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, useMemo } from "react";
import { rtdb } from "@/firebase/config";
import { ref, onValue } from "firebase/database";
import { useUser } from "@/firebase/auth/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

const chartConfig = {
  health: { label: "Salud del Cultivo (%)", color: "hsl(var(--primary))" },
};

export default function Home() {
  const { user } = useUser();
  const { t } = useTranslation();
  const [sensorValues, setSensorValues] = useState({
    humidity_soil: 0, temp: 0, uv: 0, humidity_air: 0, et: 0, dew_point: 0, status_text: "Conectando..."
  });
  const [isOnline, setIsOnline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [proximityAlert, setProximityAlert] = useState<any | null>(null);
  const [showRadar, setShowRadar] = useState(true);

  useEffect(() => {
    const checkProximity = () => {
      const savedAlerts = localStorage.getItem("community_alerts");
      if (savedAlerts) {
        const alerts = JSON.parse(savedAlerts);
        const nearby = alerts.find((a: any) => a.severity === "Alta" || a.severity === "Dä");
        if (nearby) setProximityAlert(nearby);
      }
    };
    
    checkProximity();
    const interval = setInterval(checkProximity, 10000);
    return () => clearInterval(interval);
  }, []);

  const performanceData = useMemo(() => [
    { month: "Ene", health: 85 },
    { month: "Feb", health: 88 },
    { month: "Mar", health: 92 },
    { month: "Abr", health: 80 },
    { month: "May", health: 85 },
    { month: "Jun", health: 90 },
  ], []);

  useEffect(() => {
    if (!rtdb) return;
    
    const sensorsRef = ref(rtdb, 'sensores');
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSensorValues({
          humidity_soil: Number(data.humedad_suelo ?? 0),
          temp: Number(data.temperatura ?? 0),
          uv: Number(data.uv ?? 0),
          humidity_air: Number(data.humedad_aire ?? 0),
          et: Number(data.et ?? 0),
          dew_point: Number(data.punto_rocio ?? 0),
          status_text: String(data.estado ?? "SISTEMA NORMAL")
        });
        setIsOnline(true);
        setLastUpdate(new Date());
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/40 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-black tracking-tight text-primary" suppressHydrationWarning>{t('dashboard')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <button className="relative p-2 text-muted-foreground hover:text-primary transition-all hover:scale-110">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full border-2 border-white"></span>
                </button>
              </SheetTrigger>
              <SheetContent className="glass-card">
                <SheetHeader className="pb-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Notificaciones
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                  <div className="space-y-4">
                    {proximityAlert && (
                      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl shadow-inner">
                        <p className="text-[10px] font-black text-destructive uppercase tracking-widest mb-1" suppressHydrationWarning>{t('radar_active')}</p>
                        <p className="text-sm font-bold">{proximityAlert.problem}</p>
                        <p className="text-[10px] text-muted-foreground">{proximityAlert.region} • {proximityAlert.distance}</p>
                      </div>
                    )}
                    <div className="text-center py-10 text-xs text-muted-foreground italic">No hay más avisos hoy</div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-3 border-l pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black uppercase text-primary tracking-tighter" suppressHydrationWarning>{user?.displayName || t('farmer')}</p>
                <p className="text-[9px] text-muted-foreground font-bold">HIDALGO, MÉXICO</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-primary/20 shadow-md">
                <AvatarImage src={user?.photoURL ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold"><User className="h-5 w-5" /></AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-8 p-4 md:p-8 pt-6">
          {proximityAlert && showRadar && (
            <Alert className="bg-destructive/90 backdrop-blur-xl border-none text-white shadow-[0_20px_50px_rgba(239,68,68,0.3)] animate-in zoom-in-95 duration-700 relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <Radio className="h-6 w-6 text-white animate-pulse" />
              <button onClick={() => setShowRadar(false)} className="absolute top-4 right-4 text-white/70 hover:text-white transition-all"><X className="h-5 w-5" /></button>
              <AlertTitle className="font-black text-xl tracking-tighter" suppressHydrationWarning>⚠️ {t('radar_active')}</AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 pr-8">
                <p className="font-medium text-white/90" suppressHydrationWarning>
                  Se ha reportado <span className="font-black underline decoration-white/40">{proximityAlert.problem}</span> en <span className="font-black">{proximityAlert.region}</span>. 
                  ¡Tu campo está en el radio de riesgo!
                </p>
                <Link href="/diagnosis">
                  <Button variant="secondary" size="sm" className="font-bold gap-2 shadow-xl hover:scale-105 transition-all">
                    <Zap className="h-4 w-4" /> <span suppressHydrationWarning>{t('get_solution')}</span>
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black tracking-tighter text-foreground/80" suppressHydrationWarning>{t('iot_station')}</h2>
              <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                <Activity className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest" suppressHydrationWarning>{t('live')}</span>
              </div>
            </div>
            <SensorStats sensorValues={sensorValues} isOnline={isOnline} lastUpdate={lastUpdate} />
          </section>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <PestAnalysisTool />
              
              <Card className="glass-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2 text-primary" suppressHydrationWarning>
                    <TrendingUp className="h-5 w-5" /> {t('health_history')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] w-full pt-4">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={performanceData}>
                        <defs>
                          <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{fontSize: 10, fontWeight: 700}} />
                        <ChartTooltip content={<ChartTooltipContent className="glass-card border-none" />} />
                        <Area type="monotone" dataKey="health" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorHealth)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-right-12 duration-1000">
              <CommunityAlerts />
              
              <Card className="bg-primary shadow-[0_20px_40px_rgba(34,197,94,0.3)] text-primary-foreground border-none overflow-hidden relative group">
                <div className="absolute -bottom-6 -right-6 p-4 opacity-20 transition-transform group-hover:scale-110 duration-500">
                  <Info className="h-32 w-32" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg font-black tracking-tight" suppressHydrationWarning>{t('sensor_data')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium opacity-90 leading-relaxed relative z-10" suppressHydrationWarning>
                    {t('evapotranspiration')} actual: <span className="text-xl font-black">{sensorValues.et.toFixed(2)} mm</span>. 
                    Tus cultivos están perdiendo humedad a un ritmo {sensorValues.et > 4 ? 'alto' : 'normal'}. 
                    Se sugiere ajustar el riego.
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
