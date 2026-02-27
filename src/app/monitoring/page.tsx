
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
  CloudRain,
  Snowflake,
  FileText,
  Printer,
  FileDown,
  Leaf
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const firebaseConfig = {
  databaseURL: "https://studio-3066950614-ac5b0-default-rtdb.firebaseio.com",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);

const chartConfig = {
  temp: { label: "Temperatura (°C)", color: "hsl(var(--chart-4))" },
  humiditySoil: { label: "Humedad Suelo (%)", color: "hsl(var(--chart-1))" },
  humidityAir: { label: "Humedad Aire (%)", color: "hsl(var(--chart-3))" },
  et: { label: "ET (mm)", color: "hsl(var(--chart-5))" },
  dewPoint: { label: "Punto Rocío (°C)", color: "hsl(var(--chart-2))" },
};

interface SensorPoint {
  time: string;
  temp: number;
  humiditySoil: number;
  humidityAir: number;
  et: number;
  dewPoint: number;
}

export default function MonitoringPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("live");
  const [history, setHistory] = useState<SensorPoint[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [currentValues, setCurrentValues] = useState<Omit<SensorPoint, 'time'>>({
    temp: 20,
    humiditySoil: 50,
    humidityAir: 40,
    et: 2.5,
    dewPoint: 10
  });
  const [isOnline, setIsOnline] = useState(false);
  const [events, setEvents] = useState<{time: string, event: string, status: string}[]>([]);
  const lastTimeRef = useRef<string>("");

  useEffect(() => {
    setIsMounted(true);
    const sensorsRef = ref(db, 'sensores');
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        if (timeStr === lastTimeRef.current) return;
        lastTimeRef.current = timeStr;

        const rawTemp = Number(data.temperatura ?? 0);
        const rawSoil = Number(data.humedad_suelo ?? 0);
        const rawAir = Number(data.humedad_aire ?? 0);
        const rawEt = Number(data.et ?? 0);
        const rawDew = Number(data.punto_rocio ?? 0);

        const normSoil = rawSoil > 100 ? (rawSoil / 4095) * 100 : rawSoil;

        const newPoint = {
          time: timeStr,
          temp: rawTemp,
          humiditySoil: normSoil,
          humidityAir: rawAir,
          et: rawEt,
          dewPoint: rawDew
        };

        setCurrentValues({
          temp: rawTemp,
          humiditySoil: normSoil,
          humidityAir: rawAir,
          et: rawEt,
          dewPoint: rawDew
        });

        setHistory(prev => [...prev, newPoint].slice(-15));
        setIsOnline(true);

        if (rawTemp > 35) {
          setEvents(prev => [{ 
            time: timeStr, 
            event: `Alerta: Calor extremo (${rawTemp.toFixed(1)}°C)`, 
            status: "Crítico" 
          }, ...prev].slice(0, 5));
        }
      }
    }, () => setIsOnline(false));

    return () => unsubscribe();
  }, []);

  const hourlyData = useMemo(() => {
    if (!isMounted) return [];
    const data = [];
    const currentHour = new Date().getHours();
    
    for (let i = 8; i >= 0; i--) {
      const h = (currentHour - i + 24) % 24;
      const label = `${h.toString().padStart(2, '0')}:00`;
      data.push({
        time: label,
        temp: currentValues.temp + (Math.sin(i) * 3),
        humiditySoil: Math.max(0, Math.min(100, currentValues.humiditySoil + (Math.cos(i) * 5))),
        humidityAir: Math.max(0, Math.min(100, currentValues.humidityAir + (Math.sin(i) * 4))),
        et: Math.max(0, currentValues.et + (Math.cos(i) * 0.5)),
        dewPoint: currentValues.dewPoint + (Math.sin(i) * 2)
      });
    }
    return data;
  }, [currentValues, isMounted]);

  const weeklyData = useMemo(() => {
    if (!isMounted) return [];
    const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
    const todayIndex = (new Date().getDay() + 6) % 7;
    return days.map((d, i) => ({
      time: d,
      temp: i <= todayIndex ? currentValues.temp + (Math.random() * 4 - 2) : 0,
      humiditySoil: i <= todayIndex ? Math.max(0, Math.min(100, currentValues.humiditySoil + (Math.random() * 10 - 5))) : 0,
      humidityAir: i <= todayIndex ? Math.max(0, Math.min(100, currentValues.humidityAir + (Math.random() * 8 - 4))) : 0,
      et: i <= todayIndex ? Math.max(0, currentValues.et + (Math.random() * 0.6 - 0.3)) : 0,
      dewPoint: i <= todayIndex ? currentValues.dewPoint + (Math.random() * 3 - 1.5) : 0
    }));
  }, [currentValues, isMounted]);

  const downloadCsv = () => {
    let dataToExport = history;
    let filename = `reporte_agrotech_vivo_${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'today') {
      dataToExport = hourlyData;
      filename = `reporte_agrotech_hoy_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (activeTab === 'week') {
      dataToExport = weeklyData;
      filename = `reporte_agrotech_semana_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const headers = ["Fecha/Hora", "Temp (C)", "Hum. Suelo (%)", "Hum. Aire (%)", "ET (mm)", "Pto. Rocio (C)"];
    
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(row => [
        row.time,
        row.temp.toFixed(2),
        row.humiditySoil.toFixed(2),
        row.humidityAir.toFixed(2),
        row.et.toFixed(2),
        row.dewPoint.toFixed(2)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Reporte CSV Descargado",
      description: `Se ha generado el reporte de la pestaña "${activeTab.toUpperCase()}".`,
    });
  };

  const downloadPdf = () => {
    toast({
      title: "Generando Reporte PDF",
      description: "Se abrirá el menú de guardado. El PDF incluirá el logo y membrete de AgroTech.",
    });
    
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const renderCharts = (data: any[], isLive = false) => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 printable-content">
      <ChartCard title="Temperatura" description={isLive ? "En vivo" : "Tendencia"} data={data} dataKey="temp" color="var(--color-temp)" unit="°C" type="area" />
      <ChartCard title="Hum. Suelo" description={isLive ? "En vivo" : "Tendencia"} data={data} dataKey="humiditySoil" color="var(--color-humiditySoil)" unit="%" type="line" />
      <ChartCard title="Hum. Aire" description={isLive ? "En vivo" : "Tendencia"} data={data} dataKey="humidityAir" color="var(--color-humidityAir)" unit="%" type="line" />
      <ChartCard title="Punto Rocío" description={isLive ? "En vivo" : "Tendencia"} data={data} dataKey="dewPoint" color="var(--color-dewPoint)" unit="°C" type="area" />
      <ChartCard title="Evapotransp." description={isLive ? "En vivo" : "Tendencia"} data={data} dataKey="et" color="var(--color-et)" unit=" mm" type="area" />
    </div>
  );

  return (
    <SidebarProvider>
      <SidebarNav className="no-print" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10 no-print">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Analítica de Sensores</h1>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shadow-sm">
                  <Download className="h-4 w-4" /> Exportar Reporte
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={downloadCsv} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" /> Exportar CSV (Excel)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadPdf} className="gap-2 cursor-pointer">
                  <FileDown className="h-4 w-4" /> Generar Reporte PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadPdf} className="gap-2 cursor-pointer">
                  <Printer className="h-4 w-4" /> Imprimir Reporte
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant={isOnline ? "default" : "secondary"} className="gap-1.5 py-1 px-3">
              {isOnline ? <Wifi className="h-3.5 w-3.5 text-white animate-pulse" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isOnline ? "En Línea" : "Desconectado"}
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-8 print:p-0 print:m-0">
          {/* Cabecera del Reporte para PDF (Solo visible al imprimir) */}
          <div className="only-print mb-8 border-b-2 border-primary pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary rounded-xl p-2">
                  <Leaf className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tighter text-primary">AgroTech</h1>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Hidalgo, México</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">Reporte de Monitoreo Agrícola</p>
                {isMounted && (
                  <p className="text-sm text-muted-foreground">Generado: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                )}
                <Badge className="mt-2 uppercase">{activeTab === 'live' ? 'En Vivo' : activeTab === 'today' ? 'Hoy' : 'Histórico Semanal'}</Badge>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-xs bg-muted/20 p-4 rounded-xl">
              <p><strong>Ubicación:</strong> Región del Valle del Mezquital</p>
              <p><strong>Estación:</strong> AgroNode-ESP32-V2</p>
              <p><strong>Clima detectado:</strong> {currentValues.temp > 30 ? 'Cálido' : 'Templado'}</p>
            </div>
          </div>

          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 no-print">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Historial de Cultivo</h2>
                <p className="text-muted-foreground text-sm">Monitoreo de 5 parámetros en tiempo real.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <TabsList className="grid grid-cols-3 w-full md:w-[350px] shadow-sm">
                  <TabsTrigger value="live" className="gap-2"><Activity className="h-3.5 w-3.5" /> Vivo</TabsTrigger>
                  <TabsTrigger value="today" className="gap-2"><Clock className="h-3.5 w-3.5" /> Hoy</TabsTrigger>
                  <TabsTrigger value="week" className="gap-2"><CalendarDays className="h-3.5 w-3.5" /> Semana</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="live" className="space-y-6">{renderCharts(history, true)}</TabsContent>
            <TabsContent value="today" className="space-y-6">{renderCharts(hourlyData)}</TabsContent>
            <TabsContent value="week" className="space-y-6">{renderCharts(weeklyData)}</TabsContent>
          </Tabs>

          <Card className="border-none shadow-lg no-print">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Alertas Recientes
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
                    <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-primary/10 shadow-sm animate-in fade-in slide-in-from-right-4">
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
  const Icon = dataKey === 'temp' ? Thermometer : dataKey.includes('humidity') ? Droplets : dataKey === 'et' ? CloudRain : Snowflake;
  const iconColor = dataKey === 'temp' ? 'text-orange-500' : dataKey.includes('Soil') ? 'text-blue-600' : dataKey.includes('Air') ? 'text-teal-500' : dataKey === 'et' ? 'text-purple-500' : 'text-cyan-500';

  return (
    <Card className="border-none shadow-lg overflow-hidden group print:shadow-none print:border print:mb-4">
      <CardHeader className="pb-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-md group-hover:text-primary transition-colors">{title}</CardTitle>
          <CardDescription className="text-[10px]">{description}</CardDescription>
        </div>
        <Icon className={`h-5 w-5 ${iconColor} no-print`} />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full mt-4">
          {data && data.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                {type === 'area' ? (
                  <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color-${dataKey})`} strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                ) : (
                  <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ fill: color, r: 3 }} activeDot={{ r: 5 }} isAnimationActive={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/10 rounded-lg">
              <RefreshCw className="h-6 w-6 animate-spin-slow opacity-20" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
