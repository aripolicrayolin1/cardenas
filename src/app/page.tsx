
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SensorStats } from "@/components/dashboard/sensor-stats";
import { AIRiskAlert } from "@/components/dashboard/ai-risk-alert";
import { CommunityAlerts } from "@/components/dashboard/community-alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Bell, Info } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 transition-[width,height] ease-linear border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Resumen de Gestión</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 border-l pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">Juan Pérez</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Agricultor Hidalgo</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 overflow-hidden">
                 <Image 
                   src="https://picsum.photos/seed/farmer/100/100" 
                   alt="Profile" 
                   width={32} 
                   height={32} 
                   className="object-cover"
                 />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-8 p-4 md:p-8 pt-6">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Monitoreo IoT</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Activity className="h-4 w-4 text-primary animate-pulse" /> Actualizado hace 2 min
              </p>
            </div>
            <SensorStats />
          </section>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <AIRiskAlert />
              
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Historial de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg mx-6 mb-6">
                  <div className="text-center">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Gráfico de tendencias temporales (Próximamente)</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <CommunityAlerts />
              
              <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Info className="h-24 w-24" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">Tip del Día</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed opacity-90">
                    La rotación de cultivos de maíz con leguminosas en la zona de Hidalgo ayuda a fijar nitrógeno de forma natural, reduciendo la necesidad de fertilizantes químicos.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
