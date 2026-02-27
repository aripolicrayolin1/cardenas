
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, MapPin, Save, Bell, Shield, Loader2, Phone, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase/auth/use-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, loading } = useUser();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    location: "Actopan, Hidalgo",
    bio: "Agricultor dedicado al cultivo de maíz y leguminosas."
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true
  });

  useEffect(() => {
    const savedProfile = localStorage.getItem("user_profile");
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setProfile(prev => ({
        ...prev,
        ...parsed
      }));
    }

    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.displayName || prev.name || "Agricultor",
        email: user.email || prev.email || ""
      }));
    }
  }, [user]);

  const handleSave = () => {
    localStorage.setItem("user_profile", JSON.stringify(profile));
    toast({
      title: "Configuración Guardada",
      description: "Tus preferencias han sido actualizadas correctamente."
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Ajustes del Sistema</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>Mi Perfil</CardTitle>
                  <CardDescription>Información del agricultor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center mb-6">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                      <AvatarImage src={user?.photoURL ?? undefined} alt={profile.name} />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                        {profile.name.charAt(0) || <User className="h-10 w-10" />}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nombre</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-10" 
                        value={profile.name} 
                        onChange={(e) => setProfile({...profile, name: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ubicación</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-10" 
                        value={profile.location} 
                        onChange={(e) => setProfile({...profile, location: e.target.value})} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" /> Notificaciones
                  </CardTitle>
                  <CardDescription>Recibe alertas de plagas en tu zona.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-base">Correo Electrónico</Label>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Recibe reportes técnicos semanales.</p>
                    </div>
                    <Switch 
                      checked={notifications.email} 
                      onCheckedChange={(v) => setNotifications({...notifications, email: v})} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-base">Alertas SMS (Celular)</Label>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Avisos urgentes de plagas cercanas.</p>
                    </div>
                    <Switch 
                      checked={notifications.sms} 
                      onCheckedChange={(v) => setNotifications({...notifications, sms: v})} 
                    />
                  </div>

                  {notifications.sms && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs">Número de Teléfono</Label>
                      <Input placeholder="+52 771 123 4567" className="h-9" />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-base">Notificaciones Push</Label>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Alertas en tiempo real en el navegador.</p>
                    </div>
                    <Switch 
                      checked={notifications.push} 
                      onCheckedChange={(v) => setNotifications({...notifications, push: v})} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Privacidad y Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tus datos de sensores y ubicación están protegidos por Firebase Hidalgo. 
                  Solo tú puedes ver los datos históricos de tus fincas.
                </p>
                <Button variant="outline" size="sm">Ver términos de servicio</Button>
              </CardContent>
              <CardFooter className="border-t bg-muted/5 flex justify-end p-4">
                <Button className="font-bold w-full sm:w-auto" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" /> Guardar Todo
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
