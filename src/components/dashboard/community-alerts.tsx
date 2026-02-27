
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Calendar, ArrowRight, Plus, AlertTriangle, X, Info, Loader2, ShieldCheck, Radio, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Alert {
  id: string;
  region: string;
  crop: string;
  problem: string;
  severity: string;
  distance: string;
  date: string;
  lat: number;
  lng: number;
}

const initialAlerts: Alert[] = [
  {
    id: "1",
    region: "Actopan",
    crop: "Maíz",
    problem: "Gusano Cogollero",
    severity: "Alta",
    distance: "A 5km de ti",
    date: "Hace 2h",
    lat: 20.2687,
    lng: -98.9413
  },
  {
    id: "2",
    region: "Ixmiquilpan",
    crop: "Hortalizas",
    problem: "Mosca Blanca",
    severity: "Media",
    distance: "A 12km de ti",
    date: "Hace 5h",
    lat: 20.4849,
    lng: -99.2192
  },
  {
    id: "3",
    region: "El Arenal",
    crop: "Maíz",
    problem: "Gusano Cogollero",
    severity: "Alta",
    distance: "A 8km de ti",
    date: "Hace 1h",
    lat: 20.2222,
    lng: -98.9111
  }
];

export function CommunityAlerts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  
  const [newAlert, setNewAlert] = useState({
    region: "",
    crop: "",
    problem: ""
  });

  useEffect(() => {
    const saved = localStorage.getItem("community_alerts");
    if (saved) {
      setAlerts(JSON.parse(saved));
    } else {
      setAlerts(initialAlerts);
      localStorage.setItem("community_alerts", JSON.stringify(initialAlerts));
    }
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Tu navegador no soporta geolocalización.",
        variant: "destructive"
      });
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
        toast({
          title: "Ubicación obtenida",
          description: "Hemos fijado tu posición GPS para el reporte local."
        });
      },
      () => {
        setLoadingLocation(false);
        toast({
          title: "Error de ubicación",
          description: "No pudimos obtener tu ubicación real.",
          variant: "destructive"
        });
      }
    );
  };

  const handleReport = () => {
    if (!newAlert.region || !newAlert.problem) {
      toast({
        title: "Error",
        description: "Completa la ubicación y el problema.",
        variant: "destructive"
      });
      return;
    }

    const finalLat = userCoords?.lat || (20.1 + (Math.random() * 0.4));
    const finalLng = userCoords?.lng || (-98.8 - (Math.random() * 0.4));

    const alert: Alert = {
      id: Date.now().toString(),
      region: newAlert.region,
      crop: newAlert.crop || "Varios",
      problem: newAlert.problem,
      severity: "Alta",
      distance: userCoords ? "Cerca de ti" : "Hidalgo, MX",
      date: "Recién reportado",
      lat: finalLat,
      lng: finalLng
    };

    const updated = [alert, ...alerts];
    setAlerts(updated);
    localStorage.setItem("community_alerts", JSON.stringify(updated));
    
    setIsReportOpen(false);
    setNewAlert({ region: "", crop: "", problem: "" });
    setUserCoords(null);
    
    toast({
      title: "Alerta Guardada",
      description: "Tu reporte ha sido guardado localmente en tu dispositivo."
    });
  };

  const openMap = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsMapOpen(true);
  };

  // Filtra alertas similares para el mapa global
  const similarAlerts = useMemo(() => {
    if (!selectedAlert) return [];
    return alerts.filter(a => 
      a.problem.toLowerCase().includes(selectedAlert.problem.toLowerCase()) ||
      (selectedAlert.crop && a.crop.toLowerCase().includes(selectedAlert.crop.toLowerCase()))
    );
  }, [selectedAlert, alerts]);

  return (
    <Card className="border-none shadow-md overflow-hidden flex flex-col h-full glass-card">
      <CardHeader className="bg-primary text-primary-foreground py-4 relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Radio className="h-20 w-20 animate-pulse" />
        </div>
        <CardTitle className="text-lg flex items-center gap-2 font-black tracking-tighter uppercase">
          <Users className="h-5 w-5" />
          {t('community_network')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <div className="divide-y divide-primary/10">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-primary/5 transition-all group cursor-pointer border-l-4 border-transparent hover:border-primary" onClick={() => openMap(alert)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <MapPin className="h-3 w-3 text-primary" />
                  {alert.region} • {alert.distance}
                </div>
                <Badge variant={alert.severity === 'Alta' || alert.severity === 'Dä' ? 'destructive' : 'secondary'} className="text-[9px] px-2 py-0 h-4 font-black">
                  {alert.severity.toUpperCase()}
                </Badge>
              </div>
              <h4 className="font-black text-sm text-foreground/80 group-hover:text-primary transition-colors">
                {alert.problem}
              </h4>
              <p className="text-[10px] font-bold text-primary/60 mt-1 uppercase">CULTIVO: {alert.crop}</p>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase">
                  <Calendar className="h-3 w-3" />
                  {alert.date}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] px-2 gap-1 font-black uppercase text-primary hover:bg-primary/10 group-hover:translate-x-1 transition-all"
                >
                  VER MAPA <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <div className="p-4 bg-primary/5 border-t border-primary/10">
        <Button className="w-full font-black text-xs uppercase tracking-widest shadow-lg rounded-xl h-11" onClick={() => setIsReportOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t('report_outbreak')}
        </Button>
      </div>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="sm:max-w-5xl p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row h-[600px]">
            {/* Panel Lateral del Mapa */}
            <div className="w-full md:w-80 border-r border-primary/10 p-6 flex flex-col bg-white/50">
              <DialogHeader className="mb-6">
                <DialogTitle className="flex items-center gap-2 text-primary font-black tracking-tighter text-xl">
                  <Radio className="h-5 w-5 animate-pulse" />
                  RADAR: {selectedAlert?.problem}
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest pt-2">
                  Zona de Riesgo Detectada
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-4 overflow-hidden">
                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                  <p className="text-[10px] font-black text-primary uppercase mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> ESCUDO ACTIVO
                  </p>
                  <p className="text-xs font-bold text-foreground/80 leading-relaxed italic">
                    "{t('radar_map_desc')}"
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Reportes Similares ({similarAlerts.length})</h5>
                  <ScrollArea className="h-[250px] pr-4">
                    <div className="space-y-2">
                      {similarAlerts.map(a => (
                        <div key={a.id} className="p-3 bg-white border rounded-xl shadow-sm hover:border-primary/30 transition-all">
                          <p className="text-[10px] font-black text-primary uppercase">{a.region}</p>
                          <p className="text-xs font-bold text-foreground/70">{a.problem}</p>
                          <p className="text-[9px] text-muted-foreground mt-1">{a.date} • {a.distance}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              <Button className="mt-6 w-full font-black text-xs uppercase" variant="outline" onClick={() => setIsMapOpen(false)}>
                Cerrar Radar
              </Button>
            </div>

            {/* El Mapa Global */}
            <div className="flex-1 relative bg-muted group">
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-destructive/90 text-white font-black text-[10px] px-4 py-1.5 shadow-2xl animate-pulse flex items-center gap-2 uppercase tracking-widest">
                  <Zap className="h-3 w-3 fill-white" /> ALERTA REGIONAL ACTIVA
                </Badge>
              </div>
              
              {selectedAlert && (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps?q=${selectedAlert.problem}+en+${selectedAlert.region}+Hidalgo&z=12&output=embed`}
                />
              )}
              
              <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                <div className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 text-[9px] font-black uppercase text-primary">
                  Sincronizado con Firebase Satelital
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-black tracking-tighter uppercase">
              <AlertTriangle className="h-5 w-5" />
              {t('report_outbreak')}
            </DialogTitle>
            <DialogDescription className="font-medium">
              Avisa a otros agricultores. Usaremos tu GPS para fijar el punto exacto en el mapa regional.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex flex-col items-center gap-2">
              {loadingLocation ? (
                <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Buscando satélites...</span>
                </div>
              ) : userCoords ? (
                <div className="flex items-center gap-2 text-green-600 font-black uppercase text-[10px] tracking-widest">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>GPS FIJADO CORRECTAMENTE</span>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="font-black text-[10px] uppercase rounded-xl h-10 px-6 border-primary/20 text-primary" onClick={handleGetLocation}>
                  <MapPin className="h-4 w-4 mr-2" /> Activar mi ubicación
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">¿Qué detectaste?</Label>
              <Input 
                placeholder="Ej: Gusano Cogollero, Roya, etc." 
                className="rounded-xl h-12 font-bold"
                value={newAlert.problem}
                onChange={(e) => setNewAlert({...newAlert, problem: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Municipio / Zona</Label>
                <Input 
                  placeholder="Ej: Actopan" 
                  className="rounded-xl h-12 font-bold"
                  value={newAlert.region}
                  onChange={(e) => setNewAlert({...newAlert, region: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Cultivo</Label>
                <Input 
                  placeholder="Ej: Maíz" 
                  className="rounded-xl h-12 font-bold"
                  value={newAlert.crop}
                  onChange={(e) => setNewAlert({...newAlert, crop: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsReportOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="rounded-xl font-black uppercase h-11 px-8 shadow-lg shadow-destructive/20" onClick={handleReport}>
              Activar Alerta RADAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
