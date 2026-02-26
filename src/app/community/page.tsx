
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Star, 
  Search, 
  Store, 
  ExternalLink,
  MessageSquare,
  Filter
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const stores = [
  {
    id: 1,
    name: "Agropecuaria El Valle",
    location: "Actopan, Centro",
    specialty: "Fertilizantes y Control de Plagas",
    rating: 4.8,
    phone: "772-123-4567",
    image: "https://picsum.photos/seed/store1/400/200",
    open: true
  },
  {
    id: 2,
    name: "Semillas y Equipos Hidalgo",
    location: "Pachuca, Centro",
    specialty: "Semillas e Implementos",
    rating: 4.5,
    phone: "771-987-6543",
    image: "https://picsum.photos/seed/store2/400/200",
    open: true
  },
  {
    id: 3,
    name: "Nutrición Vegetal Ixmiquilpan",
    location: "Ixmiquilpan",
    specialty: "Sistemas de Riego e Insumos",
    rating: 4.9,
    phone: "759-444-5555",
    image: "https://picsum.photos/seed/store3/400/200",
    open: false
  },
  {
    id: 4,
    name: "Ferre-Agro Tula",
    location: "Tula de Allende",
    specialty: "Herramientas y Proteccion",
    rating: 4.2,
    phone: "773-111-2222",
    image: "https://picsum.photos/seed/store4/400/200",
    open: true
  }
];

export default function CommunityPage() {
  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 transition-[width,height] ease-linear border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Comunidad y Comercios</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight">Directorio Agropecuario</h2>
                <p className="text-muted-foreground">Encuentra los insumos recomendados por la IA en tiendas cercanas en Hidalgo.</p>
              </div>
              <Button className="font-bold">
                <Store className="mr-2 h-4 w-4" /> Registrar mi Negocio
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por producto o tienda..." className="pl-10 h-12" />
              </div>
              <Button variant="outline" className="h-12 px-6">
                <Filter className="mr-2 h-4 w-4" /> Filtrar Región
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stores.map((store) => (
                <Card key={store.id} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all group">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image 
                      src={store.image} 
                      alt={store.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge 
                      className="absolute top-4 right-4" 
                      variant={store.open ? "default" : "secondary"}
                    >
                      {store.open ? "Abierto" : "Cerrado"}
                    </Badge>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{store.name}</CardTitle>
                      <div className="flex items-center text-yellow-500 text-sm font-bold">
                        <Star className="h-4 w-4 fill-current mr-1" />
                        {store.rating}
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {store.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-4">
                      Especialidad: <span className="text-foreground">{store.specialty}</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-primary font-bold">
                      <Phone className="h-4 w-4" /> {store.phone}
                    </div>
                  </CardContent>
                  <CardFooter className="grid grid-cols-2 gap-2 pt-0">
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageSquare className="h-4 w-4 mr-2" /> Mensaje
                    </Button>
                    <Button size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" /> Perfil
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <Card className="bg-accent/10 border-accent/20">
              <CardHeader className="text-center">
                <CardTitle>¿No encuentras lo que buscas?</CardTitle>
                <CardDescription>
                  Nuestra red comunitaria crece cada día. Si conoces una tienda que debería estar aquí, avísanos.
                </CardDescription>
                <div className="pt-4">
                  <Button variant="outline" className="border-accent text-accent-foreground hover:bg-accent/20">
                    Sugerir Tienda Local
                  </Button>
                </div>
              </CardHeader>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
