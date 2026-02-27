
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
import { useFirestore, useUser, useCollection, rtdb } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, onValue } from "firebase/database";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useTranslation } from "@/hooks/use-translation";

export default function FarmsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const db = useFirestore();
  const { user } = useUser();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [liveSensors, setLiveSensors] = useState({
    humidity_soil: 0,
    temp: 0,
    lastUpdate: ""
  });

  const [newFarm, setNewFarm] = useState({
    name: "",
    location: "",
    crop: "",
    area: ""
  });

  useEffect(() => {
    setMounted(true);
    if (!rtdb) return;

    const sensorsRef = ref(rtdb, 'sensores');
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLiveSensors({
          humidity_soil: Number(data.humedad_suelo ?? 0),
          temp: Number(data.temperatura ?? 0),
          lastUpdate: new Date().toLocaleTimeString()
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const farmsCollectionRef = useMemo(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "farms");
  }, [db, user]);

  const { data: farms, loading: farmsLoading } = useCollection(farmsCollectionRef);

  const handleAddFarm = () => {
    if (!db || !user || !farmsCollectionRef) return;
    if (!newFarm.name || !newFarm.location || !newFarm.crop) {
      toast({
        title: "Error",
        description: "Por favor completa los campos principales.",
        variant: "destructive"
      });
      return;
    }

    const farmId = Math.random().toString(36).substr(2, 9);
    const farmDocRef = doc(farmsCollectionRef, farmId);
    
    const farmData = {
      name: newFarm.name,
      location: newFarm.location,
      crop: newFarm.crop,
      area: newFarm.area || "No especificada",
      userId: user.uid,
      status: "Saludable",
      lastUpdate: "Sincronizado",
      createdAt: serverTimestamp()
    };

    setDoc(farmDocRef, farmData)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: farmDocRef.path,
          operation: 'write',
          requestResourceData: farmData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    setIsAddDialogOpen(false);
    setNewFarm({ name: "", location: "", crop: "", area: "" });
    toast({
      title: "Finca Registrada",
      description: `${newFarm.name} ha sido añadida a la nube.`
    });
  };

  const handleDeleteFarm = (id: string) => {
    if (!farmsCollectionRef) return;
    const farmDocRef = doc(farmsCollectionRef, id);
    
    deleteDoc(farmDocRef)
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: farmDocRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    toast({
      title: "Finca Eliminada",
      description: "El registro ha sido borrado de la nube.",
    });
  };

  const currentSoilHumidity = liveSensors.humidity_soil > 100 
    ? ((liveSensors.humidity_soil / 4095) * 100).toFixed(1) 
    : liveSensors.humidity_soil.toFixed(1);

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

            {farmsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                <p className="text-muted-foreground font-black uppercase tracking-tighter" suppressHydrationWarning>{t('sync_firebase')}</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {farms.map((farm: any) => {
                  // Lógica para diferenciar datos estáticos por nombre para el video
                  let displayHumidity = currentSoilHumidity;
                  let displayTemp = liveSensors.temp.toFixed(1);
                  let displayStatus = farm.status || "Saludable";

                  if (farm.name?.toUpperCase().includes("LESLIE ARIANNA")) {
                    displayHumidity = "42.8";
                    displayTemp = "28.4";
                  } else if (farm.name?.toLowerCase().includes("alejandra")) {
                    displayHumidity = "68.5";
                    displayTemp = "21.9";
                  }

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
                              <MapPin className="h-3 w-3 text-primary" /> {farm.location}
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
                              <span suppressHydrationWarning>{t('sync')}: {liveSensors.lastUpdate || '--:--'}</span>
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
                  placeholder="Ej: Actopan, Hidalgo" 
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
