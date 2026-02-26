
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Calendar, ArrowRight, Plus, AlertTriangle, X, Info, Store } from "lucide-react";
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

interface Alert {
  id: number;
  region: string;
  crop: string;
  problem: string;
  severity: string;
  distance: string;
  date: string;
  coords: { x: number; y: number }; // Posición relativa para el mapa simulado
}

export function CommunityAlerts() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [newAlert, setNewAlert] = useState({
    region: "",
    crop: "",
    problem: ""
  });

  useEffect(() => {
    const initialAlerts = [
      {
        id: 1,
        region: "Actopan",
        crop: "Cebada",
        problem: "Tizón Foliar Detectado",
        severity: "Alta",
        distance: "12km",
        date: "Hoy, 10:30 AM",
        coords: { x: 45, y: 55 }
      },
      {
        id: 2,
        region: "Pachuca",
        crop: "Tomate",
        problem: "Mosca Blanca",
        severity: "Media",
        distance: "25km",
        date: "Ayer",
        coords: { x: 55, y: 65 }
      },
      {
        id: 3,
        region: "Ixmiquilpan",
        crop: "Maíz",
        problem: "Gusano Cogollero",
        severity: "Alta",
        distance: "40km",
        date: "Hace 2 días",
        coords: { x: 35, y: 45 }
      }
    ];
    const saved = localStorage.getItem("community_alerts");
    setAlerts(saved ? JSON.parse(saved) : initialAlerts);
  }, []);

  const handleReport = () => {
    if (!newAlert.region || !newAlert.problem) {
      toast({
        title: "Error",
        description: "Completa la ubicación y el problema.",
        variant: "destructive"
      });
      return;
    }

    const alert: Alert = {
      id: Date.now(),
      region: newAlert.region,
      crop: newAlert.crop || "Varios",
      problem: newAlert.problem,
      severity: "Alta",
      distance: "Cerca de ti",
      date: "Recién reportado",
      coords: { x: 40 + Math.random() * 20, y: 40 + Math.random() * 20 }
    };

    const updated = [alert, ...alerts];
    setAlerts(updated);
    localStorage.setItem("community_alerts", JSON.stringify(updated));
    setIsReportOpen(false);
    setNewAlert({ region: "", crop: "", problem: "" });
    
    toast({
      title: "Alerta Enviada",
      description: "La comunidad ha sido notificada de tu reporte."
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
          Red Comunitaria Hidalgo
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
          <Plus className="h-4 w-4 mr-2" /> Reportar Brote Local
        </Button>
      </div>

      {/* Mapa Interactivo de Alertas */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Mapa de Alertas Regionales</DialogTitle>
            <DialogDescription>Visualización geográfica de brotes detectados en Hidalgo.</DialogDescription>
          </DialogHeader>
          <div className="relative h-[500px] bg-emerald-50 w-full p-4">
            <div className="absolute top-4 left-4 z-10 bg-white/90 p-3 rounded-lg shadow-md border max-w-[200px]">
               <h3 className="font-bold text-sm text-primary mb-1">Mapa de Riesgo: Hidalgo</h3>
               <p className="text-[10px] text-muted-foreground">Mostrando brotes confirmados en la región.</p>
            </div>

            {/* Representación Visual del Mapa de Hidalgo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
               <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] fill-primary">
                 <path d="M30,20 Q40,10 60,15 T80,30 T70,60 T40,80 T15,60 T20,30 Z" />
               </svg>
            </div>

            {/* Marcadores de Alerta */}
            {alerts.map((alert) => (
              <button
                key={alert.id}
                className={`absolute transition-all hover:scale-125 z-20 group`}
                style={{ left: `${alert.coords.x}%`, top: `${alert.coords.y}%` }}
                onClick={() => setSelectedAlert(alert)}
              >
                <div className={`relative flex items-center justify-center`}>
                  <div className={`absolute h-8 w-8 rounded-full animate-ping opacity-20 ${alert.severity === 'Alta' ? 'bg-destructive' : 'bg-accent'}`} />
                  <MapPin className={`h-6 w-6 ${alert.severity === 'Alta' ? 'text-destructive' : 'text-accent-foreground'} filter drop-shadow-md`} fill="currentColor" />
                  <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-[10px] p-2 rounded whitespace-nowrap z-30">
                    {alert.region}: {alert.problem}
                  </div>
                </div>
              </button>
            ))}

            {/* Panel de Detalle del Marcador Seleccionado */}
            {selectedAlert && (
              <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-2xl border-t-4 border-primary p-4 animate-in slide-in-from-bottom-4 duration-300 z-40">
                <div className="flex justify-between items-start mb-2">
                   <div>
                     <Badge variant={selectedAlert.severity === 'Alta' ? 'destructive' : 'secondary'} className="mb-1">
                       {selectedAlert.severity} Riesgo
                     </Badge>
                     <h4 className="font-bold text-lg">{selectedAlert.problem}</h4>
                   </div>
                   <Button variant="ghost" size="icon" onClick={() => setSelectedAlert(null)}>
                     <X className="h-4 w-4" />
                   </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div className="flex items-center gap-2 text-muted-foreground">
                     <MapPin className="h-4 w-4 text-primary" />
                     <span>{selectedAlert.region}</span>
                   </div>
                   <div className="flex items-center gap-2 text-muted-foreground">
                     <Calendar className="h-4 w-4 text-primary" />
                     <span>{selectedAlert.date}</span>
                   </div>
                   <div className="col-span-2 p-2 bg-primary/5 rounded border border-primary/10 flex items-center gap-2">
                     <Info className="h-4 w-4 text-primary" />
                     <span className="text-xs">Afectando cultivo de: <span className="font-bold">{selectedAlert.crop}</span></span>
                   </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reportar Problema en Campo
            </DialogTitle>
            <DialogDescription>
              Avisar a otros agricultores de la región sobre plagas o enfermedades.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>¿Qué detectaste?</Label>
              <Input 
                placeholder="Ej: Mancha de asfalto, Gusano cogollero..." 
                value={newAlert.problem}
                onChange={(e) => setNewAlert({...newAlert, problem: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Municipio</Label>
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
            <Button variant="destructive" onClick={handleReport}>Enviar Alerta Regional</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
