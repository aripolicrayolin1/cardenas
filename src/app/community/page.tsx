
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Store, 
  MessageSquare,
  Send,
  UserCheck,
  Star,
  Activity,
  Heart,
  Share2,
  Camera,
  MapPin
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useTranslation } from "@/hooks/use-translation";

const initialStores = [
  {
    id: 99,
    name: "Ing. Ricardo (Agrónomo)",
    location: "Soporte Especializado",
    specialty: "Asesoría en Plagas y Cultivos",
    rating: 5.0,
    phone: "771-555-0101",
    image: PlaceHolderImages.find(img => img.id === 'expert-agronomist')?.imageUrl || "https://picsum.photos/seed/agronomo/600/400",
    imageHint: PlaceHolderImages.find(img => img.id === 'expert-agronomist')?.imageHint || "agronomist",
    open: true,
    isExpert: true
  },
  {
    id: 1,
    name: "Agropecuaria El Valle",
    location: "Actopan, Centro",
    specialty: "Fertilizantes y Control de Plagas",
    rating: 4.8,
    phone: "772-123-4567",
    image: PlaceHolderImages.find(img => img.id === 'agro-store')?.imageUrl || "https://picsum.photos/seed/agroshop/600/400",
    imageHint: PlaceHolderImages.find(img => img.id === 'agro-store')?.imageHint || "agriculture shop",
    open: true
  },
  {
    id: 2,
    name: "Semillas e Insumos Hidalgo",
    location: "Pachuca, Centro",
    specialty: "Semillas e Implementos",
    rating: 4.5,
    phone: "771-987-6543",
    image: PlaceHolderImages.find(img => img.id === 'agro-seeds')?.imageUrl || "https://picsum.photos/seed/cornseeds/600/400",
    imageHint: PlaceHolderImages.find(img => img.id === 'agro-seeds')?.imageHint || "corn seeds",
    open: true
  }
];

const successStories = [
  {
    id: 1,
    user: "Don Pedro",
    location: "Actopan",
    image: "https://picsum.photos/seed/pedrocrop/800/800",
    caption: "¡Cosecha exitosa de maíz gracias al diagnóstico temprano de AgroTech! Sin plagas este año. 🌽✨",
    likes: 124,
    tags: ["#Hidalgo", "#AgroTech", "#MaizSano"]
  },
  {
    id: 2,
    user: "Mariana G.",
    location: "Pachuca",
    image: "https://picsum.photos/seed/marianacrop/800/800",
    caption: "Mis hortalizas nunca se vieron tan verdes. El monitoreo de humedad es la clave. 🥬🚜",
    likes: 89,
    tags: ["#Sustentable", "#Hidalgo", "#Hortalizas"]
  },
  {
    id: 3,
    user: "Rancho El Sol",
    location: "Ixmiquilpan",
    image: "https://picsum.photos/seed/rancho/800/800",
    caption: "Sincronizando nuestras 5 fincas. La tecnología llegó al Valle del Mezquital. 🛰️🌵",
    likes: 210,
    tags: ["#ValleDelMezquital", "#AgroTech", "#TechField"]
  }
];

export default function CommunityPage() {
  const { t } = useTranslation();
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const openChat = (store: any) => {
    setSelectedStore(store);
    const savedChat = localStorage.getItem(`chat_${store.id}`);
    if (savedChat) {
      setChatHistory(JSON.parse(savedChat));
    } else {
      setChatHistory([{ sender: "system", text: `Hola, soy ${store.name}. ¿En qué podemos ayudarte?` }]);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    const newMsg = { sender: "user", text: message };
    const updatedChat = [...chatHistory, newMsg];
    setChatHistory(updatedChat);
    localStorage.setItem(`chat_${selectedStore.id}`, JSON.stringify(updatedChat));
    setMessage("");

    setTimeout(() => {
      const responseText = selectedStore.isExpert 
        ? "He recibido tu consulta. Analizaré los síntomas que mencionas y te daré una recomendación técnica en breve."
        : "Gracias por tu mensaje. Un asesor de la tienda te atenderá en unos minutos.";
      
      const response = { sender: "store", text: responseText };
      const withResponse = [...updatedChat, response];
      setChatHistory(withResponse);
      localStorage.setItem(`chat_${selectedStore.id}`, JSON.stringify(withResponse));
    }, 2000);
  };

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">{t('community_commerce')}</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-12">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">{t('agro_directory')}</h2>
              <p className="text-muted-foreground">{t('contact_experts')}</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {initialStores.map((store) => (
                <Card key={store.id} className="overflow-hidden border-none shadow-lg group">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image 
                      src={store.image} 
                      alt={store.name} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      data-ai-hint={store.imageHint}
                    />
                    {store.isExpert && (
                      <Badge className="absolute top-3 right-3 bg-primary shadow-lg">{t('verified_expert')}</Badge>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {store.isExpert ? <UserCheck className="h-5 w-5 text-primary" /> : <Store className="h-5 w-5 text-primary" />}
                      {store.name}
                    </CardTitle>
                    <CardDescription>{store.location}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm font-medium text-primary mb-2">{store.specialty}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <span className="text-xs font-bold">{store.rating} (Hidalgo)</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant={store.isExpert ? "default" : "outline"} onClick={() => openChat(store)}>
                      <MessageSquare className="h-4 w-4 mr-2" /> 
                      {store.isExpert ? t('consult_expert') : t('send_message')}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Success Stories Section */}
            <div className="space-y-6 pt-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black flex items-center gap-2 text-primary uppercase tracking-tighter">
                    <Activity className="h-6 w-6" /> {t('success_stories')}
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('community_impact')}</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full gap-2 font-bold border-primary/20 text-primary">
                  <Camera className="h-4 w-4" /> Subir Historia
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {successStories.map((story) => (
                  <Card key={story.id} className="overflow-hidden border-none shadow-xl bg-white/50 backdrop-blur-sm group">
                    <div className="p-3 flex items-center justify-between border-b">
                       <div className="flex items-center gap-2">
                         <div className="h-8 w-8 rounded-full bg-primary/10 p-[2px]">
                           <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                             <span className="text-[10px] font-black">{story.user.charAt(0)}</span>
                           </div>
                         </div>
                         <div>
                           <p className="text-xs font-black">{story.user}</p>
                           <p className="text-[9px] text-muted-foreground flex items-center gap-0.5"><MapPin className="h-2 w-2" /> {story.location}</p>
                         </div>
                       </div>
                       <Share2 className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
                    </div>
                    <div className="relative aspect-square overflow-hidden">
                       <Image 
                         src={story.image} 
                         alt={story.user} 
                         fill 
                         className="object-cover group-hover:scale-105 transition-transform duration-700"
                       />
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-4">
                        <Heart className="h-5 w-5 text-primary fill-primary/20" />
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <Share2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-[10px] font-black">{story.likes} me gusta</p>
                      <p className="text-xs leading-relaxed">
                        <span className="font-black mr-2">{story.user}</span>
                        {story.caption}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {story.tags.map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-primary">{tag}</span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>

        <Dialog open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedStore?.isExpert ? <UserCheck className="h-5 w-5 text-primary" /> : <Store className="h-5 w-5 text-primary" />}
                {t('chat_with')} {selectedStore?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col h-[400px]">
              <div className="flex-1 overflow-y-auto space-y-4 p-2 border rounded-md bg-muted/10">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white border shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <Input 
                  placeholder={t('write_query')} 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
