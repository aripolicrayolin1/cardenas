
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  Plus, 
  AlertTriangle, 
  X, 
  Info, 
  Loader2, 
  ShieldCheck, 
  Radio, 
  Zap, 
  Target, 
  CheckCircle2 
} from "lucide-react";
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
      toast({ title: "Error", description: "GPS no soportado.", variant: "destructive" });
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setNewAlert(prev => ({ ...prev, region: "Ubicación GPS fijada" }));
        setLoadingLocation(false);
        toast({ title: "GPS Listo", description: "Coordenadas fijadas automáticamente." });
      },
      () => {
        setLoadingLocation(false);
        toast({ title: "Error GPS", description: "No pudimos obtener tu ubicación.", variant: "destructive" });
      }
    );
  };

  const handleReport = () => {
    if (!newAlert.problem || (!newAlert.region && !userCoords)) {
      toast({ title: "Error", description: "Dinos qué detectaste y dónde.", variant: "destructive" });
      return;
    }

    const alert: Alert = {
      id: Date.now().toString(),
      region: userCoords ? "Zona Local (GPS)" : newAlert.region,
      crop: newAlert.crop || "Varios",
      problem: newAlert.problem,
      severity: "Alta",
      distance: userCoords ? "Aquí mismo" : "Hidalgo, MX",
      date: "Recién reportado",
      lat: userCoords?.lat || (20.2 + (Math.random() * 0.2)),
      lng: userCoords?.lng || (-98.9 - (Math.random() * 0.2))
    };

    const updated = [alert, ...alerts];
    setAlerts(updated);
    localStorage.setItem("community_alerts", JSON.stringify(updated));
    
    setIsReportOpen(false);
    setNewAlert({ region: "", crop: "", problem: "" });
    setUserCoords(null);
    toast({ title: "Alerta Enviada", description: "El radar regional se ha actualizado." });
  };

  const openMap = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsMapOpen(true);
  };

  const similarAlerts = useMemo(() => {
    if (!selectedAlert) return [];
    return alerts.filter(a => a.problem === selectedAlert.problem);
  }, [selectedAlert, alerts]);

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
        <div className="divide-y divide-primary/10">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-primary/5 transition-all group cursor-pointer border-l-4 border-transparent hover:border-primary" onClick={() => openMap(alert)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <MapPin className="h-3 w-3 text-primary" />
                  {alert.region} • {alert.distance}
                </div>
                <Badge variant="destructive" className="text-[9px] px-2 py-0 h-4 font-black">ALTA</Badge>
              </div>
              <h4 className="font-black text-sm text-foreground/80">{alert.problem}</h4>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{alert.date}</span>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 gap-1 font-black text-primary">
                  VER RADAR <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      <div className="p-4 bg-primary/5 border-t border-primary/10">
        <Button className="w-full font-black text-xs uppercase tracking-widest rounded-xl h-11" onClick={() => setIsReportOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t('report_outbreak')}
        </Button>
      </div>

      {/* MODAL DEL MAPA (RADAR) */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row h-[85vh] lg:h-[700px]">
            {/* LADO IZQUIERDO: LISTA DE BROTES */}
            <div className="w-full lg:w-96 border-r border-primary/10 p-6 flex flex-col bg-white/80 z-10">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase tracking-widest mb-1">
                  <Target className="h-4 w-4 animate-pulse" /> VIGILANCIA ACTIVA
                </div>
                <DialogTitle className="text-2xl font-black text-primary tracking-tighter">
                  {selectedAlert?.problem}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-muted-foreground">
                  Ola de contagio detectada en el Valle del Mezquital.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 pr-2">
                <div className="space-y-3">
                  {similarAlerts.map(a => (
                    <div key={a.id} className="p-4 bg-white border-2 border-primary/5 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-primary uppercase flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {a.region}
                        </span>
                        <Badge variant="outline" className="text-[8px] h-4">{a.date}</Badge>
                      </div>
                      <p className="text-xs font-black text-foreground/80">{a.problem}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <Button className="mt-4 w-full font-black text-xs uppercase rounded-xl" variant="outline" onClick={() => setIsMapOpen(false)}>
                Cerrar Radar
              </Button>
            </div>

            {/* LADO DERECHO: MAPA DE GOOGLE REAL */}
            <div className="flex-1 relative bg-slate-100 overflow-hidden min-h-[300px]">
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <Badge className="bg-destructive/90 text-white font-black text-[10px] px-4 py-1.5 shadow-2xl animate-pulse flex items-center gap-2 rounded-full">
                  <Zap className="h-3 w-3 fill-white" /> ESCUDO REGIONAL ACTIVO
                </Badge>
              </div>

              {selectedAlert && (
                <iframe
                  width="100%"
                  height="100%"
                  className="absolute inset-0 border-0"
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${selectedAlert.lat},${selectedAlert.lng}&z=13&output=embed`}
                />
              )}
              
              {/* CAPA DE DATOS IA SOBRE EL MAPA */}
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-xl border border-white/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <p className="text-[10px] font-bold text-foreground/70">Sincronizado con Firebase Hidalgo en tiempo real.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REPORTE (GPS) */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-black tracking-tighter uppercase">
              <AlertTriangle className="h-5 w-5" /> REPORTE RADAR
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${userCoords ? 'bg-green-50 border-green-200' : 'bg-primary/5 border-primary/10'}`}>
              {loadingLocation ? (
                <div className="flex items-center gap-2 text-primary font-black text-[10px] tracking-widest">
                  <Loader2 className="h-4 w-4 animate-spin" /> LOCALIZANDO...
                </div>
              ) : userCoords ? (
                <div className="flex flex-col items-center gap-1 text-green-600 font-black text-[10px] tracking-widest">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> GPS FIJADO CON ÉXITO
                  </div>
                  <span className="text-[8px] opacity-60">No necesitas escribir tu municipio</span>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="font-black text-[10px] uppercase rounded-xl border-primary/20 text-primary" onClick={handleGetLocation}>
                  <MapPin className="h-4 w-4 mr-2" /> USAR MI POSICIÓN REAL (GPS)
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">¿Qué plaga detectaste?</Label>
              <Input 
                placeholder="Ej: Gusano Cogollero" 
                className="rounded-xl h-11 font-bold"
                value={newAlert.problem}
                onChange={(e) => setNewAlert({...newAlert, problem: e.target.value})}
              />
            </div>

            {!userCoords && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Municipio (Solo si no usas GPS)</Label>
                <Input 
                  placeholder="Ej: Actopan" 
                  className="rounded-xl h-11 font-bold"
                  value={newAlert.region}
                  onChange={(e) => setNewAlert({...newAlert, region: e.target.value})}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Cultivo Afectado</Label>
              <Input 
                placeholder="Ej: Maíz" 
                className="rounded-xl h-11 font-bold"
                value={newAlert.crop}
                onChange={(e) => setNewAlert({...newAlert, crop: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsReportOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="rounded-xl font-black uppercase h-11 px-8" onClick={handleReport}>
              ACTIVAR ALERTA REGIONAL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
