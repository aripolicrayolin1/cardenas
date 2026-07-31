
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  MapPin, 
  Leaf, 
  Droplets, 
  Thermometer, 
  MoreVertical,
  Activity,
  Trash2,
  Loader2,
  RefreshCw,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/firebase";
import { useTranslation } from "@/hooks/use-translation";
import { useSensores } from "@/hooks/sensores/use-sensores";
import { useFincas } from "@/hooks/fincas/use-fincas";
import { MapaSatelital, type MarcadorMapa } from "@/components/mapa";
import { esCoordenadaValida } from "@/services/fincas";
import { NombreLugar } from "@/components/geo/nombre-lugar";

export default function FarmsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useUser();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newFarm, setNewFarm] = useState<{
    name: string;
    location: string;
    crop: string;
    area: string;
    lat?: number;
    lng?: number;
    deviceId?: string;
  }>({
    name: "",
    location: "",
    crop: "",
    area: ""
  });

  const [ubicando, setUbicando] = useState(false);

  const { lectura, ultimaActualizacion } = useSensores();
  const {
    fincas: farms,
    cargando: farmsLoading,
    error: farmsError,
    guardando,
    crear,
    eliminar,
  } = useFincas();

  const handleAddFarm = async () => {
    const { valor: id, error } = await crear(newFarm);

    if (!id) {
      // El motivo viene en el resultado, no del estado del hook: leerlo tras el
      // `await` daría el valor del render anterior. Antes se mostraba siempre
      // "revisa el nombre" aunque el fallo fuera de permisos o de red.
      toast({
        title: "No se pudo guardar",
        description: error ?? "Revisa el nombre, la ubicación y el cultivo.",
        variant: "destructive"
      });
      return;
    }

    setIsAddDialogOpen(false);
    setNewFarm({ name: "", location: "", crop: "", area: "" });
    toast({
      title: "Finca Registrada",
      description: `${newFarm.name} ha sido añadida a la nube.`
    });
  };

  /**
   * Captura la posición del dispositivo para situar la parcela en el mapa.
   *
   * El permiso puede negarse y el GPS puede fallar bajo techo o sin cielo
   * despejado, así que la finca se guarda igual sin coordenadas: es un extra,
   * no un requisito.
   */
  const capturarUbicacion = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Sin GPS",
        description: "Este dispositivo no permite obtener la ubicación.",
        variant: "destructive",
      });
      return;
    }

    setUbicando(true);

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setNewFarm((previo) => ({
          ...previo,
          lat: posicion.coords.latitude,
          lng: posicion.coords.longitude,
        }));
        setUbicando(false);
        toast({
          title: "Ubicación capturada",
          description: "La parcela aparecerá en el mapa satelital.",
        });
      },
      (error) => {
        setUbicando(false);
        toast({
          title: "No se pudo ubicar",
          description:
            error.code === error.PERMISSION_DENIED
              ? "Diste permiso denegado. Puedes registrar la finca sin ubicación."
              : "Sal a cielo abierto e inténtalo de nuevo.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const handleDeleteFarm = async (id: string) => {
    const { valor: ok, error } = await eliminar(id);

    toast({
      title: ok ? "Finca Eliminada" : "No se pudo eliminar",
      description: ok
        ? "El registro ha sido borrado de la nube."
        : error ?? "Inténtalo de nuevo en unos segundos.",
      variant: ok ? "default" : "destructive"
    });
  };

  const currentSoilHumidity = lectura.humedadSuelo.toFixed(1);
  const currentTemp = lectura.temperatura.toFixed(1);
  const lastUpdate = ultimaActualizacion?.toLocaleTimeString() ?? "";

  // Sólo las fincas con coordenadas se pueden dibujar. Las registradas antes de
  // que existiera el mapa no las tienen, y eso es normal.
  const marcadores: MarcadorMapa[] = useMemo(
    () =>
      farms
        .filter((f) => esCoordenadaValida(f.lat, f.lng))
        .map((f) => ({
          id: f.id,
          lat: f.lat as number,
          lng: f.lng as number,
          titulo: f.name,
          subtitulo: `${f.crop} · ${f.area}`,
          tipo: "finca" as const,
        })),
    [farms]
  );

  const sinUbicar = farms.length - marcadores.length;

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/40 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-black text-primary tracking-tight" suppressHydrationWarning>{t('my_farms')}</h1>
          </div>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)} disabled={!user} className="rounded-xl font-bold shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" /> {t('add_farm')}
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6 animate-in fade-in duration-700">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="space-y-1">
              <h2 className="text-3xl font-black tracking-tighter text-foreground/80" suppressHydrationWarning>{t('land_management')}</h2>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest" suppressHydrationWarning>{t('farms_desc')}</p>
            </div>

            {/* Vista satelital. Sólo tiene sentido con al menos una parcela ubicada. */}
            {!farmsLoading && marcadores.length > 0 && (
              <section className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Vista satelital
                  </h3>
                  {sinUbicar > 0 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {sinUbicar} {sinUbicar === 1 ? "finca sin ubicar" : "fincas sin ubicar"}
                    </span>
                  )}
                </div>
                <MapaSatelital marcadores={marcadores} altura="460px" />
              </section>
            )}

            {farmsError ? (
              // Sin esto la pantalla se quedaba girando en "Sincronizando" y el
              // agricultor no tenía forma de saber qué había pasado.
              <div className="glass-card rounded-3xl p-8 space-y-4 border-destructive/20">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-destructive/10 text-destructive">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-black tracking-tighter text-destructive uppercase">
                      No se pudieron cargar tus fincas
                    </p>
                    <p className="text-xs text-muted-foreground font-bold">
                      Firestore rechazó la lectura.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  La causa más habitual es que las reglas de seguridad no estén desplegadas
                  en el proyecto de Firebase. Desde la carpeta del proyecto:
                </p>

                <code className="block text-[11px] font-mono bg-foreground/5 rounded-xl px-4 py-3 text-foreground/70">
                  firebase deploy --only firestore:rules
                </code>

                <p className="text-[10px] text-muted-foreground/70 font-mono break-all">
                  {farmsError.message}
                </p>
              </div>
            ) : farmsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                <p className="text-muted-foreground font-black uppercase tracking-tighter" suppressHydrationWarning>{t('sync_firebase')}</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {farms.map((farm) => {
                  // Sólo hay UNA estación IoT, así que todas las fincas muestran
                  // su misma lectura. Aquí había valores fijos por nombre de finca
                  // ("LESLIE ARIANNA" → 42.8 %) puestos para grabar un vídeo.
                  // Cuando haya un sensor por parcela, esto se filtrará por finca.
                  const displayHumidity = currentSoilHumidity;
                  const displayTemp = currentTemp;
                  const displayStatus = farm.status || "Saludable";

                  return (
                    <Card key={farm.id} className="glass-card border-none overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl group relative">
                      <div className={`absolute top-0 left-0 w-1 h-full ${
                        displayStatus === 'Saludable' ? 'bg-primary' : 'bg-destructive'
                      }`} />
                      
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors">{farm.name}</CardTitle>
                            <CardDescription className="flex items-center gap-1 font-bold text-[10px] uppercase text-muted-foreground">
                              <NombreLugar lat={farm.lat} lng={farm.lng} respaldo={farm.location} />
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/50">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card border-none">
                              <DropdownMenuItem className="text-destructive font-bold cursor-pointer" onClick={() => handleDeleteFarm(farm.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar finca
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-6 pt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="gap-1.5 font-black text-[9px] uppercase tracking-widest bg-white/60">
                              <Leaf className="h-3 w-3 text-primary" /> {farm.crop}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{farm.area} HA</span>
                          </div>
                          <Badge variant={displayStatus === 'Saludable' ? 'default' : 'destructive'} className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                            {displayStatus === 'Saludable' ? t('healthy') : displayStatus}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-inner flex flex-col gap-1 group-hover:bg-white/60 transition-colors">
                            <div className="flex items-center gap-2">
                              <Droplets className="h-4 w-4 text-blue-500 animate-pulse" />
                              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">{t('soil_humidity')}</p>
                            </div>
                            <p className="text-2xl font-black text-foreground/80" suppressHydrationWarning>{displayHumidity}%</p>
                          </div>
                          <div className="bg-white/40 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-inner flex flex-col gap-1 group-hover:bg-white/60 transition-colors">
                            <div className="flex items-center gap-2">
                              <Thermometer className="h-4 w-4 text-orange-500 animate-pulse" />
                              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">{t('air_temp')}</p>
                            </div>
                            <p className="text-2xl font-black text-foreground/80" suppressHydrationWarning>{displayTemp}°C</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-primary tracking-widest">
                              <RefreshCw className="h-3 w-3 animate-spin-slow" />
                              <span suppressHydrationWarning>{t('sync')}: {lastUpdate || '--:--'}</span>
                           </div>
                           <Badge variant="outline" className="text-[8px] font-black border-primary/20 text-primary uppercase">DATOS IoT VIVOS</Badge>
                        </div>
                      </CardContent>

                      <CardFooter className="pt-2">
                        <Link href="/monitoring" className="w-full">
                          <Button variant="outline" className="w-full h-11 rounded-xl font-black uppercase text-xs tracking-widest border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm">
                            <Activity className="h-4 w-4 mr-2" /> {t('view_monitoring')}
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}

                <button 
                  className="glass-card border-2 border-dashed border-primary/20 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 transition-all group relative overflow-hidden"
                  onClick={() => setIsAddDialogOpen(true)}
                  disabled={!user}
                >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="bg-primary/10 p-6 rounded-full ring-8 ring-primary/5 group-hover:scale-110 transition-transform">
                    <Plus className="h-10 w-10 text-primary" />
                  </div>
                  <div className="text-center space-y-2 relative z-10">
                    <p className="font-black text-lg tracking-tighter text-primary uppercase" suppressHydrationWarning>{t('new_farm_btn')}</p>
                    {!user && <p className="text-[9px] text-destructive font-black uppercase tracking-widest">{t('inicia_sesion_anadir')}</p>}
                  </div>
                </button>
              </div>
            )}
          </div>
        </main>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="glass-card border-none">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tighter text-primary uppercase flex items-center gap-2">
                <Zap className="h-6 w-6 fill-primary" /> {t('add_new_farm_title')}
              </DialogTitle>
              <DialogDescription className="font-bold text-muted-foreground">{t('add_new_farm_desc')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('farm_name_label')}</Label>
                <Input 
                  id="name" 
                  className="rounded-xl h-12 font-bold bg-white/50"
                  placeholder="Ej: Rancho El Amanecer" 
                  value={newFarm.name}
                  onChange={(e) => setNewFarm({...newFarm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('location_label')}</Label>
                <Input 
                  id="location" 
                  className="rounded-xl h-12 font-bold bg-white/50"
                  placeholder="Ej: Tulancingo de Bravo, Hidalgo"
                  value={newFarm.location}
                  onChange={(e) => setNewFarm({...newFarm, location: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crop" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('main_crop_label')}</Label>
                  <Input 
                    id="crop" 
                    className="rounded-xl h-12 font-bold bg-white/50"
                    placeholder="Ej: Maíz" 
                    value={newFarm.crop}
                    onChange={(e) => setNewFarm({...newFarm, crop: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('area_label')}</Label>
                  <Input 
                    id="area" 
                    className="rounded-xl h-12 font-bold bg-white/50"
                    placeholder="Ej: 2.5" 
                    value={newFarm.area}
                    onChange={(e) => setNewFarm({...newFarm, area: e.target.value})}
                  />
                </div>
              </div>

              {/* Ubicación GPS: opcional, sólo para situar la parcela en el mapa. */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Ubicación en el mapa <span className="text-muted-foreground/50">· opcional</span>
                </Label>

                {esCoordenadaValida(newFarm.lat, newFarm.lng) ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 h-12">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-black text-primary tabular-nums truncate">
                        {newFarm.lat!.toFixed(5)}, {newFarm.lng!.toFixed(5)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewFarm({ ...newFarm, lat: undefined, lng: undefined })}
                      className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={capturarUbicacion}
                    disabled={ubicando}
                    className="w-full rounded-xl h-12 font-bold bg-white/50 border-primary/20 hover:bg-primary/5 gap-2"
                  >
                    {ubicando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        Obteniendo señal GPS...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 text-primary" />
                        Usar mi ubicación actual
                      </>
                    )}
                  </Button>
                )}

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Captúrala estando en la parcela para que aparezca en la vista satelital.
                  La finca se guarda igual si prefieres omitirla.
                </p>
              </div>

              {/* ID del sensor: vincula un ESP32 propio a esta parcela. */}
              <div className="space-y-2">
                <Label htmlFor="deviceId" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  ID del sensor <span className="text-muted-foreground/50">· opcional</span>
                </Label>
                <Input
                  id="deviceId"
                  className="rounded-xl h-12 font-bold bg-white/50 font-mono"
                  placeholder="Ej: esp32-norte-01"
                  value={newFarm.deviceId ?? ""}
                  onChange={(e) => setNewFarm({ ...newFarm, deviceId: e.target.value })}
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Si esta parcela tiene su propio ESP32, escribe aquí su identificador
                  (el que el dispositivo usa en <code className="font-mono">/dispositivos/…</code>).
                  Déjalo vacío para usar el sensor principal.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setIsAddDialogOpen(false)}>{t('cancel')}</Button>
              <Button onClick={handleAddFarm} className="rounded-xl font-black uppercase tracking-widest px-8 shadow-lg shadow-primary/20">{t('save_farm')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
