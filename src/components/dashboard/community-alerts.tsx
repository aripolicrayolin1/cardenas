
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Calendar, ArrowRight, Plus, AlertTriangle, X, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
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
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, doc, setDoc, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

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
  userId?: string;
  createdAt?: any;
}

export function CommunityAlerts() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  
  const alertsCollectionRef = useMemo(() => {
    if (!db) return null;
    return collection(db, "community_alerts");
  }, [db]);

  const alertsQuery = useMemo(() => {
    // Solo permitimos la consulta si hay una referencia y el usuario está autenticado
    if (!alertsCollectionRef || !user) return null;
    return query(alertsCollectionRef, orderBy("createdAt", "desc"), limit(10));
  }, [alertsCollectionRef, user]);

  const { data: alerts, loading: alertsLoading } = useCollection(alertsQuery);

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
          description: "Hemos fijado tu posición GPS actual para el reporte."
        });
      },
      (error) => {
        console.error("Error getting location:", error);
        setLoadingLocation(false);
        toast({
          title: "Error de ubicación",
          description: "No pudimos obtener tu ubicación real.",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleReport = () => {
    if (!db || !alertsCollectionRef || !user) return;
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

    const alertId = Date.now().toString();
    const alertDocRef = doc(alertsCollectionRef, alertId);
    
    const alertData = {
      region: newAlert.region,
      crop: newAlert.crop || "Varios",
      problem: newAlert.problem,
      severity: "Alta",
      distance: userCoords ? "Cerca de ti" : "Hidalgo, MX",
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lat: finalLat,
      lng: finalLng,
      userId: user.uid,
      createdAt: serverTimestamp()
    };

    setDoc(alertDocRef, alertData)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: alertDocRef.path,
          operation: 'write',
          requestResourceData: alertData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    setIsReportOpen(false);
    setNewAlert({ region: "", crop: "", problem: "" });
    setUserCoords(null);
    
    toast({
      title: "Alerta Enviada",
      description: "Tu reporte ha sido compartido con toda la red de Hidalgo."
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
          {!user ? (
            <div className="p-8 text-center text-xs text-muted-foreground italic">
              Inicia sesión para ver las alertas de la comunidad.
            </div>
          ) : alertsLoading ? (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Cargando alertas...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground italic">
              No hay alertas recientes en la región.
            </div>
          ) : (
            alerts.map((alert: any) => (
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
            ))
          )}
        </div>
      </CardContent>
      <div className="p-4 bg-muted/20 border-t">
        <Button className="w-full font-semibold shadow-sm" size="sm" onClick={() => setIsReportOpen(true)} disabled={!user}>
          <Plus className="h-4 w-4 mr-2" /> Reportar Brote Local
        </Button>
      </div>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden border-none bg-background">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Ubicación: {selectedAlert?.region}
            </DialogTitle>
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
              Reportar Brote en Campo
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
            <Button variant="destructive" onClick={handleReport}>Enviar Alerta Regional</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
