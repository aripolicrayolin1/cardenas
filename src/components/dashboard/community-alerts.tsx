"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  MapPin,
  ArrowRight,
  Plus,
  AlertTriangle,
  Loader2,
  Radio,
  Target,
  CheckCircle2,
  Navigation,
  Activity,
  Send,
  MessageCircle,
  LogIn,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendTelegramAlert } from "@/app/actions/telegram";
import { MapaSatelital, type MarcadorMapa } from "@/components/mapa";
import { useAlertas } from "@/hooks/comunidad/use-alertas";
import type { AlertaComunidad, Severidad } from "@/services/comunidad";

/**
 * @fileOverview Radar comunitario de brotes, ahora sobre Firestore.
 *
 * Antes las alertas vivían en `localStorage`: cada agricultor solo veía las
 * suyas, así que el "radar" no compartía nada. Ahora se leen y escriben en la
 * colección `community_alerts` (reglas ya desplegadas), de modo que un brote
 * reportado por un productor aparece en el panel de los demás en tiempo real.
 *
 * El envío a Telegram se conserva como aviso adicional, pero ya no es lo que
 * "guarda" la alerta: la fuente de verdad es Firestore.
 */

const ESTILO_SEVERIDAD: Record<Severidad, { badge: string; etiqueta: string }> = {
  alta: { badge: "bg-destructive text-white", etiqueta: "ALTA" },
  media: { badge: "bg-amber-500 text-white", etiqueta: "MEDIA" },
  baja: { badge: "bg-slate-400 text-white", etiqueta: "BAJA" },
};

/** Tiempo relativo a partir del timestamp del servidor. */
function tiempoRelativo(alerta: AlertaComunidad): string {
  const ms = alerta.createdAt?.toMillis?.();
  if (!ms) return "Recién";

  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Recién";
  if (min < 60) return `Hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `Hace ${horas} h`;
  return `Hace ${Math.floor(horas / 24)} d`;
}

export function CommunityAlerts() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const { alertas, cargando, reportar, puedeReportar } = useAlertas();

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertaComunidad | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [sending, setSending] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [newAlert, setNewAlert] = useState<{
    crop: string;
    problem: string;
    description: string;
    severity: Severidad;
  }>({ crop: "", problem: "", description: "", severity: "media" });

  const marcadoresRadar: MarcadorMapa[] = useMemo(
    () =>
      alertas
        .filter((a) => a.lat != null && a.lng != null)
        .map((a) => ({
          id: a.id,
          lat: a.lat as number,
          lng: a.lng as number,
          titulo: a.problem,
          subtitulo: `${a.crop} · ${a.region} · ${tiempoRelativo(a)}`,
          tipo: "alerta" as const,
          severidad: a.severity,
        })),
    [alertas]
  );

  const openRadar = (alerta?: AlertaComunidad) => {
    setSelectedAlert(alerta || alertas[0] || null);
    setIsRadarOpen(true);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "GPS no soportado.", variant: "destructive" });
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLoadingLocation(false);
        toast({ title: "GPS Listo", description: "Ubicación fijada automáticamente." });
      },
      () => {
        setLoadingLocation(false);
        toast({ title: "Error GPS", description: "No pudimos obtener tu ubicación.", variant: "destructive" });
      }
    );
  };

  const handleReport = async () => {
    if (!newAlert.problem.trim()) {
      toast({ title: "Falta el problema", description: "Dinos qué detectaste.", variant: "destructive" });
      return;
    }

    setSending(true);

    // Fuente de verdad: Firestore (compartido con toda la comunidad).
    const { valor: id, error } = await reportar({
      problem: newAlert.problem,
      crop: newAlert.crop,
      region: userCoords ? "Mi Parcela (GPS)" : "Hidalgo",
      description: newAlert.description,
      severity: newAlert.severity,
      lat: userCoords?.lat ?? null,
      lng: userCoords?.lng ?? null,
    });

    if (!id) {
      setSending(false);
      toast({ title: "No se pudo reportar", description: error ?? undefined, variant: "destructive" });
      return;
    }

    // Aviso ADICIONAL a Telegram, best-effort: si falla, la alerta ya quedó
    // guardada y visible para la comunidad de todos modos.
    try {
      const tel = await sendTelegramAlert({
        problem: newAlert.problem,
        region: userCoords ? "Mi Parcela (GPS)" : "Hidalgo",
        severity: ESTILO_SEVERIDAD[newAlert.severity].etiqueta,
        distance: userCoords ? "Coordenadas compartidas" : "Sin ubicación exacta",
        description: newAlert.description,
      });
      toast({
        title: "Reporte publicado",
        description: tel.success
          ? "Visible para la comunidad y enviado al canal de Telegram."
          : "Visible para la comunidad. El canal de Telegram no está configurado.",
      });
    } catch {
      toast({ title: "Reporte publicado", description: "Ya es visible para la comunidad." });
    }

    setSending(false);
    setIsReportOpen(false);
    setNewAlert({ crop: "", problem: "", description: "", severity: "media" });
    setUserCoords(null);
  };

  return (
    <Card className="border-none shadow-md overflow-hidden flex flex-col h-full glass-card">
      <CardHeader className="bg-primary text-primary-foreground py-4 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Radio className="h-20 w-20 animate-pulse" />
        </div>
        <CardTitle className="text-lg flex items-center gap-2 font-black tracking-tighter uppercase">
          <Users className="h-5 w-5" /> {t('community_network')}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-auto max-h-[400px]">
        {cargando ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
          </div>
        ) : alertas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-2">
            <CheckCircle2 className="h-8 w-8 text-primary/20" />
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              Sin brotes reportados por la comunidad. Cuando alguien reporte uno, aparecerá aquí para todos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-primary/10">
            {alertas.map((alert) => {
              const sev = ESTILO_SEVERIDAD[alert.severity];
              return (
                <div
                  key={alert.id}
                  className="p-4 hover:bg-primary/5 transition-all group cursor-pointer border-l-4 border-transparent hover:border-primary"
                  onClick={() => openRadar(alert)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      <MapPin className="h-3 w-3 text-primary" />
                      {alert.region}
                    </div>
                    <Badge className={`text-[9px] px-2 py-0 h-4 font-black border-none ${sev.badge}`}>{sev.etiqueta}</Badge>
                  </div>
                  <h4 className="font-black text-sm text-foreground/80">{alert.problem}</h4>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{tiempoRelativo(alert)}</span>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-3 w-3 text-primary opacity-50" />
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 gap-1 font-black text-primary group-hover:bg-primary group-hover:text-white rounded-lg">
                        VER RADAR <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <div className="p-4 bg-primary/5 border-t border-primary/10">
        {puedeReportar ? (
          <Button className="w-full font-black text-xs uppercase tracking-widest rounded-xl h-11 shadow-lg shadow-primary/20" onClick={() => setIsReportOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> {t('report_outbreak')}
          </Button>
        ) : (
          <Link href="/login?volverA=/">
            <Button variant="outline" className="w-full font-black text-xs uppercase tracking-widest rounded-xl h-11 border-primary/20">
              <LogIn className="h-4 w-4 mr-2" /> Inicia sesión para reportar
            </Button>
          </Link>
        )}
      </div>

      {/* Radar */}
      <Dialog open={isRadarOpen} onOpenChange={setIsRadarOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row h-[85vh] lg:h-[700px]">
            <div className="w-full lg:w-96 border-r border-primary/10 p-6 flex flex-col bg-white/90 z-10 shadow-xl">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase tracking-widest mb-1">
                  <Target className="h-4 w-4 animate-pulse" /> VIGILANCIA COMUNITARIA
                </div>
                <DialogTitle className="text-2xl font-black text-primary tracking-tighter uppercase">
                  Radar Comunitario
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-muted-foreground">
                  Reportes compartidos por agricultores de la región.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-3 pb-4">
                  {alertas.map((a) => {
                    const sev = ESTILO_SEVERIDAD[a.severity];
                    return (
                      <div
                        key={a.id}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedAlert?.id === a.id ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-transparent bg-white hover:border-primary/20'}`}
                        onClick={() => setSelectedAlert(a)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black text-primary uppercase flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {a.region}
                          </span>
                          <Badge className={`text-[8px] h-4 font-black border-none ${sev.badge}`}>{sev.etiqueta}</Badge>
                        </div>
                        <p className="text-sm font-black text-foreground/80">{a.problem}</p>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{tiempoRelativo(a)}</span>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <Button className="mt-6 w-full font-black text-xs uppercase rounded-xl h-12 shadow-lg" onClick={() => setIsRadarOpen(false)}>
                Cerrar Radar
              </Button>
            </div>

            <div className="flex-1 relative bg-deep min-h-[400px]">
              {marcadoresRadar.length > 0 ? (
                <div className="absolute inset-0 [&>div]:h-full [&>div]:rounded-none">
                  <MapaSatelital
                    marcadores={marcadoresRadar}
                    centro={
                      selectedAlert?.lat != null && selectedAlert?.lng != null
                        ? [selectedAlert.lat, selectedAlert.lng]
                        : undefined
                    }
                    altura="100%"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
                  <MapPin className="h-10 w-10 text-primary/20" />
                  <p className="text-sm font-black uppercase tracking-widest text-deep-foreground/60">
                    Sin reportes ubicados
                  </p>
                  <p className="text-xs text-deep-foreground/50 max-w-sm leading-relaxed">
                    Ninguno de los avisos activos trae coordenadas, así que no hay nada que
                    situar en el mapa. Al reportar, pulsa "Usar mi posición" para que tus
                    vecinos sepan dónde está el riesgo.
                  </p>
                </div>
              )}
              <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
                <Badge className="bg-destructive/90 text-white font-black text-[10px] px-4 py-2 shadow-2xl animate-pulse rounded-full w-fit">
                  <Activity className="h-3.5 w-3.5 mr-2" /> RADAR ACTIVO
                </Badge>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reporte */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md glass-card border-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-black tracking-tighter uppercase text-xl">
              <AlertTriangle className="h-6 w-6" /> REPORTAR AMENAZA
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${userCoords ? 'bg-green-50 border-green-400' : 'bg-primary/5 border-primary/20'}`}>
              {loadingLocation ? (
                <div className="flex items-center gap-2 text-primary font-black text-[11px] py-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> OBTENIENDO GPS...
                </div>
              ) : userCoords ? (
                <div className="flex items-center gap-2 text-green-700 font-black text-[11px]">
                  <CheckCircle2 className="h-5 w-5" /> UBICACIÓN GPS FIJADA
                </div>
              ) : (
                <Button variant="outline" className="w-full font-black text-[11px] uppercase rounded-xl border-primary/30 text-primary h-12" onClick={handleGetLocation}>
                  <Navigation className="h-5 w-5 mr-2" /> USAR MI POSICIÓN (GPS)
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">¿Qué detectaste?</Label>
              <Input
                placeholder="Ej: Gusano Cogollero"
                className="rounded-xl h-12 font-bold bg-white/50"
                value={newAlert.problem}
                onChange={(e) => setNewAlert({ ...newAlert, problem: e.target.value })}
              />
            </div>

            {/* Selector de severidad real */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nivel de riesgo</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["alta", "media", "baja"] as Severidad[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setNewAlert({ ...newAlert, severity: sev })}
                    className={`h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                      newAlert.severity === sev
                        ? `${ESTILO_SEVERIDAD[sev].badge} border-transparent`
                        : "bg-white/50 border-primary/10 text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {ESTILO_SEVERIDAD[sev].etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Descripción del Daño</Label>
              <Input
                placeholder="Ej: Hojas comidas en el centro..."
                className="rounded-xl h-12 font-bold bg-white/50"
                value={newAlert.description}
                onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsReportOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="rounded-xl font-black uppercase h-12 px-8 shadow-lg shadow-destructive/20" onClick={handleReport} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {sending ? 'PUBLICANDO...' : 'PUBLICAR REPORTE'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
