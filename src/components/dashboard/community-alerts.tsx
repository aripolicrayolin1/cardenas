
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Calendar, ArrowRight, Plus, AlertTriangle, X, Info, Loader2, ShieldCheck } from "lucide-react";
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
    problem: "Brote de Gusano Cogollero",
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
    problem: "Presencia de Mosca Blanca",
    severity: "Media",
    distance: "A 12km de ti",
    date: "Hace 5h",
    lat: 20.4849,
    lng: -99.2192
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

  return (
    <Card className="border-none shadow-md overflow-hidden flex flex-col h-full">
      <CardHeader className="bg-primary text-primary-foreground py-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('community_network')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <div className="divide-y">
          {alerts.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-muted/30 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {alert.region} • {alert.distance}
                </div>
                <Badge variant={alert.severity === 'Alta' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                  {alert.severity}
                </Badge>
              </div>
              <h4 className="font-bold text-sm group-hover:text-primary transition-colors">
                {alert.problem}
              </h4>
              <p className="text-xs text-muted-foreground mb-3">Cultivo: {alert.crop}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {alert.date}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs px-2 gap-1 group-hover:translate-x-1 transition-transform"
                  onClick={() => openMap(alert)}
                >
                  Ver mapa <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <div className="p-4 bg-muted/20 border-t">
        <Button className="w-full font-semibold shadow-sm" size="sm" onClick={() => setIsReportOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t('report_outbreak')}
        </Button>
      </div>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-none bg-background">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Ubicación: {selectedAlert?.region}
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-primary/80 italic flex items-start gap-2 pt-2" suppressHydrationWarning>
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              {t('radar_map_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-[450px] w-full bg-muted">
            {selectedAlert && (
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${selectedAlert.lat},${selectedAlert.lng}&z=14&output=embed`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('report_outbreak')}
            </DialogTitle>
            <DialogDescription>
              Avisa a otros agricultores. Usaremos tu GPS para fijar el punto exacto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/30 p-4 rounded-lg border flex flex-col items-center gap-2">
              {loadingLocation ? (
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Buscando satélites...</span>
                </div>
              ) : userCoords ? (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <MapPin className="h-4 w-4" />
                  <span>GPS Fijado Correctamente</span>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={handleGetLocation}>
                  <MapPin className="h-4 w-4 mr-2" /> Activar mi ubicación
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>¿Qué detectaste?</Label>
              <Input 
                placeholder="Ej: Mancha de asfalto, Roya, etc." 
                value={newAlert.problem}
                onChange={(e) => setNewAlert({...newAlert, problem: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Municipio / Zona</Label>
                <Input 
                  placeholder="Ej: Actopan" 
                  value={newAlert.region}
                  onChange={(e) => setNewAlert({...newAlert, region: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Cultivo</Label>
                <Input 
                  placeholder="Ej: Maíz" 
                  value={newAlert.crop}
                  onChange={(e) => setNewAlert({...newAlert, crop: e.target.value})}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReport}>Guardar Alerta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
