
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  MapPin, 
  ArrowRight, 
  Plus, 
  AlertTriangle, 
  Loader2, 
  ShieldCheck, 
  Radio, 
  Zap, 
  Target, 
  CheckCircle2,
  Navigation,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
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
  description: string;
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
    description: "Detección de larvas en el envés de las hojas jóvenes. Se recomienda Bacillus thuringiensis.",
    severity: "Alta",
    distance: "A 5km de ti",
    date: "Hace 2h",
    lat: 20.2687,
    lng: -98.9413
  },
  {
    id: "2",
    region: "Tulancingo",
    crop: "Hortalizas",
    problem: "Plaga de Hoja con Bicho",
    description: "Manchas necróticas y presencia de insectos masticadores en parcelas del centro.",
    severity: "Media",
    distance: "Región Tulancingo",
    date: "Hace 4h",
    lat: 20.0811,
    lng: -98.3664
  },
  {
    id: "3",
    region: "Ixmiquilpan",
    crop: "Maíz",
    problem: "Piojo Blanco",
    description: "Colonias algodonosas en la base de la mazorca detectadas en el Valle del Mezquital.",
    severity: "Alta",
    distance: "Valle del Mezquital",
    date: "Hace 1h",
    lat: 20.4849,
    lng: -99.2192
  }
];

export function CommunityAlerts() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  
  const [newAlert, setNewAlert] = useState({
    region: "",
    crop: "",
    problem: "",
    description: ""
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

  const openRadar = (alert?: Alert) => {
    setSelectedAlert(alert || alerts[0]);
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
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
        toast({ title: "GPS Listo", description: "Ubicación fijada automáticamente." });
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
      crop: newAlert.crop || "Maíz",
      problem: newAlert.problem,
      description: newAlert.description || "Reporte ciudadano preventivo.",
      severity: "Alta",
      distance: userCoords ? "Aquí mismo" : "Hidalgo, MX",
      date: "Recién reportado",
      lat: userCoords?.lat || (20.1 + (Math.random() * 0.4)),
      lng: userCoords?.lng || (-98.5 - (Math.random() * 0.4))
    };

    const updated = [alert, ...alerts];
    setAlerts(updated);
    localStorage.setItem("community_alerts", JSON.stringify(updated));
    
    setIsReportOpen(false);
    setNewAlert({ region: "", crop: "", problem: "", description: "" });
    setUserCoords(null);
    toast({ title: "Radar Actualizado", description: "Tu reporte ya es visible para toda la comunidad." });
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
        <div className="divide-y divide-primary/10">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className="p-4 hover:bg-primary/5 transition-all group cursor-pointer border-l-4 border-transparent hover:border-primary"
              onClick={() => openRadar(alert)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <MapPin className="h-3 w-3 text-primary" />
                  {alert.region} • {alert.distance}
                </div>
                <Badge variant="destructive" className="text-[9px] px-2 py-0 h-4 font-black">ALTA</Badge>
              </div>
              <h4 className="font-black text-sm text-foreground/80">{alert.problem}</h4>
              <div className="flex items-center justify-between mt-3">
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{alert.date}</span>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2 gap-1 font-black text-primary group-hover:bg-primary group-hover:text-white rounded-lg">
                  VER RADAR <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      <div className="p-4 bg-primary/5 border-t border-primary/10">
        <Button className="w-full font-black text-xs uppercase tracking-widest rounded-xl h-11 shadow-lg shadow-primary/20" onClick={() => setIsReportOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t('report_outbreak')}
        </Button>
      </div>

      {/* MODAL DEL RADAR UNIFICADO (CENTRO DE MANDO) */}
      <Dialog open={isRadarOpen} onOpenChange={setIsRadarOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl p-0 overflow-hidden border-none bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col lg:flex-row h-[85vh] lg:h-[700px]">
            {/* PANEL IZQUIERDO: LISTA DE AMENAZAS */}
            <div className="w-full lg:w-96 border-r border-primary/10 p-6 flex flex-col bg-white/90 z-10 shadow-xl">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase tracking-widest mb-1">
                  <Target className="h-4 w-4 animate-pulse" /> VIGILANCIA COMUNITARIA
                </div>
                <DialogTitle className="text-2xl font-black text-primary tracking-tighter uppercase">
                  Radar de Brotes
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-muted-foreground">
                  Visualiza la ola de contagios en tiempo real en todo Hidalgo.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="space-y-3 pb-4">
                  {alerts.map(a => (
                    <div 
                      key={a.id} 
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${selectedAlert?.id === a.id ? 'border-primary bg-primary/5 shadow-md scale-[1.02]' : 'border-transparent bg-white hover:border-primary/20'}`}
                      onClick={() => setSelectedAlert(a)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-primary uppercase flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {a.region}
                        </span>
                        <Badge variant="outline" className="text-[8px] h-4 font-black">{a.date}</Badge>
                      </div>
                      <p className="text-sm font-black text-foreground/80 mb-2">{a.problem}</p>
                      {selectedAlert?.id === a.id && (
                        <div className="mt-2 pt-2 border-t border-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
                          <p className="text-[10px] font-bold text-muted-foreground italic leading-relaxed">
                            "{a.description}"
                          </p>
                          <div className="mt-3 flex gap-2">
                            <Badge className="bg-destructive text-[8px] font-black">RIESGO DÄ</Badge>
                            <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary">{a.crop.toUpperCase()}</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <Button className="mt-6 w-full font-black text-xs uppercase rounded-xl h-12 shadow-lg" onClick={() => setIsRadarOpen(false)}>
                Cerrar Centro de Mando
              </Button>
            </div>

            {/* PANEL DERECHO: EL MAPA UNIFICADO */}
            <div className="flex-1 relative bg-slate-100 overflow-hidden min-h-[400px]">
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-destructive/90 text-white font-black text-[10px] px-4 py-2 shadow-2xl animate-pulse flex items-center gap-2 rounded-full border-none">
                  <Activity className="h-3.5 w-3.5" /> ESCUDO REGIONAL ACTIVO
                </Badge>
              </div>

              {selectedAlert && (
                <iframe
                  width="100%"
                  height="100%"
                  className="absolute inset-0 border-0 grayscale-[0.2] contrast-[1.1]"
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${selectedAlert.lat},${selectedAlert.lng}&z=13&t=m&output=embed`}
                />
              )}
              
              <div className="absolute bottom-6 left-6 right-6 z-10">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-white/50 flex items-center justify-between animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-xl">
                      <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-widest">Sincronización Regional</p>
                      <p className="text-xs font-bold text-foreground/70">Vigilando {alerts.length} Amenazas Comunitarias</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[9px] font-black text-muted-foreground uppercase">
                    <Radio className="h-3 w-3 animate-pulse text-destructive" /> DATOS GPS VIVOS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE REPORTE INTELIGENTE */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md glass-card border-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive font-black tracking-tighter uppercase text-xl">
              <AlertTriangle className="h-6 w-6" /> REPORTAR AMENAZA
            </DialogTitle>
            <DialogDescription className="font-bold">Ayuda a proteger el Valle del Mezquital.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${userCoords ? 'bg-green-50 border-green-400 shadow-inner' : 'bg-primary/5 border-primary/20'}`}>
              {loadingLocation ? (
                <div className="flex items-center gap-2 text-primary font-black text-[11px] tracking-widest py-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> OBTENIENDO GPS...
                </div>
              ) : userCoords ? (
                <div className="flex flex-col items-center gap-1 text-green-700 font-black text-[11px] tracking-widest">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> GPS FIJADO CORRECTAMENTE
                  </div>
                  <p className="text-[8px] font-bold opacity-60 uppercase">Ubicación capturada automáticamente</p>
                </div>
              ) : (
                <Button variant="outline" className="w-full font-black text-[11px] uppercase rounded-xl border-primary/30 text-primary h-12 hover:bg-primary hover:text-white transition-all" onClick={handleGetLocation}>
                  <Navigation className="h-5 w-5 mr-2" /> USAR MI POSICIÓN REAL (GPS)
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">¿Qué plaga detectaste?</Label>
              <Input 
                placeholder="Ej: Gusano Cogollero o Piojo Blanco" 
                className="rounded-xl h-12 font-bold bg-white/50 border-primary/10"
                value={newAlert.problem}
                onChange={(e) => setNewAlert({...newAlert, problem: e.target.value})}
              />
            </div>

            {/* OCULTAR MUNICIPIO SI HAY GPS PARA EVITAR DOBLE ENTRADA */}
            {!userCoords && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Municipio / Localidad</Label>
                <Input 
                  placeholder="Ej: Tulancingo o Actopan" 
                  className="rounded-xl h-12 font-bold bg-white/50 border-primary/10"
                  value={newAlert.region}
                  onChange={(e) => setNewAlert({...newAlert, region: e.target.value})}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Descripción del Daño</Label>
              <Input 
                placeholder="Ej: Hojas comidas, manchas en tallo..." 
                className="rounded-xl h-12 font-bold bg-white/50 border-primary/10"
                value={newAlert.description}
                onChange={(e) => setNewAlert({...newAlert, description: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsReportOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="rounded-xl font-black uppercase h-12 px-8 shadow-lg shadow-destructive/20" onClick={handleReport}>
              ACTIVAR ALERTA EN RADAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
