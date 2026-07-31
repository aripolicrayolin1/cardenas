
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
  FileEdit
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
import { LIVE_HISTORY_POINTS, TEMP } from "@/config/constants";
import { useSensores } from "@/hooks/sensores/use-sensores";
import { useHistorico } from "@/hooks/sensores/use-historico";
import { submuestrear, type RangoHistorico } from "@/services/sensores";
import type { PuntoHistorico } from "@/config/sensor-schema";

interface SensorPoint {
  time: string;
  temp: number;
  humiditySoil: number;
  humidityAir: number;
  et: number;
  dewPoint: number;
}

/** Convierte un punto de `/historico` al formato que consumen las gráficas. */
function aPuntoGrafica(punto: PuntoHistorico, formato: RangoHistorico): SensorPoint {
  const fecha = new Date(punto.ts);

  return {
    time:
      formato === 'hoy'
        ? fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : fecha.toLocaleDateString([], { weekday: 'short', day: 'numeric' }),
    temp: punto.temperatura,
    humiditySoil: punto.humedadSuelo,
    humidityAir: punto.humedadAire,
    et: punto.evapotranspiracion,
    dewPoint: punto.puntoRocio,
  };
}

export default function MonitoringPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("live");
  const [history, setHistory] = useState<SensorPoint[]>([]);
  const [events, setEvents] = useState<{time: string, event: string, status: string}[]>([]);
  const lastTimeRef = useRef<string>("");

  const { lectura, conectado: isOnline } = useSensores();

  // Series REALES leídas de /historico. Antes estas dos pestañas se rellenaban
  // con Math.sin() y Math.random() aplicados al valor actual del sensor, y se
  // presentaban al agricultor como "Historial de Cultivo".
  const historicoHoy = useHistorico('hoy');
  const historicoSemana = useHistorico('semana');

  const chartConfig = {
    temp: { label: t('air_temp'), color: "#f97316" },
    humiditySoil: { label: t('soil_humidity'), color: "#2563eb" },
    humidityAir: { label: t('humidity_air'), color: "#0d9488" },
    et: { label: t('evapotranspiration'), color: "#8b5cf6" },
    dewPoint: { label: t('dew_point'), color: "#06b6d4" },
  };

  const currentValues = useMemo(
    () => ({
      temp: lectura.temperatura,
      humiditySoil: lectura.humedadSuelo,
      humidityAir: lectura.humedadAire,
      et: lectura.evapotranspiracion,
      dewPoint: lectura.puntoRocio,
    }),
    [lectura]
  );

  // Acumula la traza "en vivo" en memoria, un punto por segundo distinto.
  useEffect(() => {
    if (!isOnline) return;

    const timeStr = lectura.recibidaEn.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    if (timeStr === lastTimeRef.current) return;
    lastTimeRef.current = timeStr;

    setHistory(prev => [...prev, { time: timeStr, ...currentValues }].slice(-LIVE_HISTORY_POINTS));

    if (lectura.temperatura > TEMP.CALOR_EXTREMO) {
      setEvents(prev => [{
        time: timeStr,
        event: `Calor extremo (${lectura.temperatura.toFixed(1)}°C)`,
        status: "CRÍTICO"
      }, ...prev].slice(0, 5));
    }
  }, [lectura, currentValues, isOnline]);

  const hourlyData = useMemo(
    () => submuestrear(historicoHoy.puntos, 48).map(p => aPuntoGrafica(p, 'hoy')),
    [historicoHoy.puntos]
  );

  const weeklyData = useMemo(
    () => submuestrear(historicoSemana.puntos, 56).map(p => aPuntoGrafica(p, 'semana')),
    [historicoSemana.puntos]
  );

  const downloadCsv = () => {
    if (history.length === 0) {
      toast({ title: "Sin datos", description: "No hay suficientes datos para exportar.", variant: "destructive" });
      return;
    }

    const headers = ["Hora", "Temperatura (°C)", "Humedad Suelo (%)", "Hum. Aire (%)", "Punto Rocio (°C)", "ET (mm)"];
    const rows = history.map(p => [
      p.time,
      p.temp.toFixed(2),
      p.humiditySoil.toFixed(2),
      p.humidityAir.toFixed(2),
      p.dewPoint.toFixed(2),
      p.et.toFixed(2)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_agrotech_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Excel Descargado", description: "El reporte CSV se ha generado con éxito." });
  };

  const downloadWord = () => {
    const reportContent = `
      AGROTECH HIDALGO - REPORTE DE ESTADO AGRÍCOLA
      -------------------------------------------
      Fecha de Emisión: ${new Date().toLocaleDateString()}
      Hora de Emisión: ${new Date().toLocaleTimeString()}
      Región: Tulancingo de Bravo, Hidalgo.
      
      ESTADO ACTUAL DE LA FINCA:
      - Temperatura del Aire: ${currentValues.temp.toFixed(1)}°C
      - Humedad del Suelo: ${currentValues.humiditySoil.toFixed(1)}%
      - Humedad del Aire: ${currentValues.humidityAir.toFixed(1)}%
      - Punto de Rocío: ${currentValues.dewPoint.toFixed(1)}°C
      - Evapotranspiración (ET): ${currentValues.et.toFixed(1)} mm
      
      RESUMEN TÉCNICO:
      El sistema se encuentra ${isOnline ? 'CONECTADO Y TRANSMITIENDO' : 'FUERA DE LÍNEA'}.
      Se han registrado ${events.length} alertas recientes en el último ciclo de monitoreo.
      
      Este documento sirve como bitácora de seguimiento para certificaciones agrícolas.
      -------------------------------------------
      AgroTech Hidalgo - Tecnología para el campo.
    `;
    
    // Se entrega como .txt porque eso es lo que realmente es: texto plano.
    // Antes se enviaba el mismo contenido con `type: 'application/msword'` y
    // extensión .doc, así que Word lo abría con una advertencia de formato no
    // válido. Un archivo honesto que se abre siempre es más útil para un
    // trámite que un .doc falso.
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_agrotech_${new Date().toISOString().slice(0,10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: "Reporte descargado", description: "Bitácora en texto, lista para imprimir o adjuntar." });
  };

  const renderCharts = (data: SensorPoint[], leyenda: string) => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ChartCard title={t('air_temp')} description={leyenda} data={data} dataKey="temp" color="#f97316" unit="°C" type="area" config={chartConfig} />
      <ChartCard title={t('soil_humidity')} description={leyenda} data={data} dataKey="humiditySoil" color="#2563eb" unit="%" type="line" config={chartConfig} />
      <ChartCard title={t('humidity_air')} description={leyenda} data={data} dataKey="humidityAir" color="#0d9488" unit="%" type="line" config={chartConfig} />
      <ChartCard title={t('dew_point')} description={leyenda} data={data} dataKey="dewPoint" color="#06b6d4" unit="°C" type="area" config={chartConfig} />
      <ChartCard title={t('evapotranspiration')} description={leyenda} data={data} dataKey="et" color="#8b5cf6" unit=" mm" type="area" config={chartConfig} />
    </div>
  );

  /**
   * Envuelve una pestaña histórica con sus estados de carga, error y vacío.
   * Cuando no hay datos se dice; no se rellena el hueco con números inventados.
   */
  const renderHistorico = (
    estado: { cargando: boolean; error: Error | null; vacio: boolean; recargar: () => void },
    data: SensorPoint[],
    leyenda: string
  ) => {
    if (estado.cargando) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-primary/30" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Leyendo el histórico de tu estación...
          </p>
        </div>
      );
    }

    if (estado.error) {
      return (
        <div className="py-20 text-center glass-card rounded-3xl space-y-4">
          <p className="text-sm font-black uppercase tracking-widest text-destructive">
            No se pudo leer el histórico
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{estado.error.message}</p>
          <Button variant="outline" size="sm" className="rounded-xl font-bold" onClick={estado.recargar}>
            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
          </Button>
        </div>
      );
    }

    if (estado.vacio) {
      return (
        <div className="py-20 text-center glass-card rounded-3xl border-2 border-dashed border-primary/20 space-y-3 px-6">
          <CalendarDays className="h-10 w-10 mx-auto text-primary/30" />
          <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            Todavía no hay histórico en este rango
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Tu estación guarda una medición por minuto en la nube. En cuanto lleve un rato
            encendida, aquí verás la evolución real de tu parcela.
          </p>
        </div>
      );
    }

    return renderCharts(data, leyenda);
  };

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/40 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-black text-primary tracking-tight" suppressHydrationWarning>{t('sensor_analytics')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 shadow-sm font-black border-primary/20 text-primary rounded-xl">
                  <Download className="h-4 w-4" /> <span suppressHydrationWarning>{t('download_report')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-card border-none">
                <DropdownMenuItem onClick={downloadCsv} className="gap-2 cursor-pointer font-bold">
                  <FileText className="h-4 w-4 text-green-600" /> HOJA DE CÁLCULO (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadWord} className="gap-2 cursor-pointer font-bold">
                  <FileEdit className="h-4 w-4 text-blue-600" /> BITÁCORA (TXT)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant={isOnline ? "default" : "secondary"} className={`gap-1.5 py-1 px-3 rounded-full font-black text-[10px] tracking-widest ${isOnline ? 'bg-primary' : 'bg-slate-400'}`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5 text-white animate-pulse" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span suppressHydrationWarning>{isOnline ? (t('online') || "").toUpperCase() : (t('offline') || "").toUpperCase()}</span>
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-foreground/80 tracking-tighter" suppressHydrationWarning>{t('crop_history')}</h2>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider" suppressHydrationWarning>{t('measured_params')}</p>
              </div>
              <TabsList className="grid grid-cols-3 w-full md:w-[350px] shadow-sm glass-card border-none p-1 rounded-2xl">
                <TabsTrigger value="live" className="gap-2 font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"><Activity className="h-3.5 w-3.5" /> <span suppressHydrationWarning>{t('live')}</span></TabsTrigger>
                <TabsTrigger value="today" className="gap-2 font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"><Clock className="h-3.5 w-3.5" /> <span suppressHydrationWarning>{t('today')}</span></TabsTrigger>
                <TabsTrigger value="week" className="gap-2 font-bold rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white"><CalendarDays className="h-3.5 w-3.5" /> <span suppressHydrationWarning>{t('week')}</span></TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="live" className="space-y-6">
              {renderCharts(history, t('live'))}
            </TabsContent>
            <TabsContent value="today" className="space-y-6">
              {renderHistorico(historicoHoy, hourlyData, t('today'))}
            </TabsContent>
            <TabsContent value="week" className="space-y-6">
              {renderHistorico(historicoSemana, weeklyData, t('week'))}
            </TabsContent>
          </Tabs>

          <Card className="glass-card border-none shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-black flex items-center gap-2 text-primary" suppressHydrationWarning>
                <TrendingUp className="h-5 w-5" />
                {t('recent_alerts')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm italic font-bold uppercase tracking-widest bg-white/30 rounded-3xl border-2 border-dashed border-white/40" suppressHydrationWarning>
                    {t('no_anomalies')}
                  </div>
                ) : (
                  events.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 glass-card rounded-2xl animate-in fade-in slide-in-from-right-4">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="font-black text-[10px] bg-white/60">{item.time}</Badge>
                        <p className="text-sm font-black text-foreground/80">{item.event.toUpperCase()}</p>
                      </div>
                      <Badge variant="destructive" className="font-black text-[9px] px-3 tracking-widest">{item.status}</Badge>
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

function ChartCard({ title, description, data, dataKey, color, unit, type, config }: any) {
  const Icon = dataKey === 'temp' ? Thermometer : dataKey.includes('humidity') ? Droplets : dataKey === 'et' ? CloudRain : Snowflake;

  return (
    <Card className="glass-card border-none overflow-hidden group transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors" suppressHydrationWarning>{title}</CardTitle>
          <CardDescription className="text-[10px] font-bold text-primary/60" suppressHydrationWarning>{(description || "").toUpperCase()}</CardDescription>
        </div>
        <div className="p-2 bg-white/60 rounded-xl shadow-inner">
          <Icon className={`h-5 w-5 text-primary`} />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[200px] w-full">
          {data && data.length > 0 ? (
            <ChartContainer config={config} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                {type === 'area' ? (
                  <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`color-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                    <ChartTooltip content={<ChartTooltipContent className="glass-card border-none" />} />
                    <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color-${dataKey})`} strokeWidth={3} isAnimationActive={false} />
                  </AreaChart>
                ) : (
                  <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700 }} />
                    <ChartTooltip content={<ChartTooltipContent className="glass-card border-none" />} />
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={4} dot={{ fill: color, r: 4, strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} isAnimationActive={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-white/20 rounded-2xl">
              <RefreshCw className="h-6 w-6 animate-spin text-primary/30" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
