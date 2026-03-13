
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
  Briefcase,
  ShoppingBag,
  Plus,
  Loader2,
  Trash2,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { useFirestore, useUser, useCollection } from "@/firebase";
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const staticExperts = [
  {
    id: "exp1",
    name: "Ing. Ricardo (Agrónomo)",
    location: "Soporte Especializado",
    specialty: "Asesoría en Plagas y Cultivos",
    rating: 5.0,
    isExpert: true
  },
  {
    id: "store1",
    name: "Agropecuaria El Valle",
    location: "Actopan, Centro",
    specialty: "Fertilizantes y Control de Plagas",
    rating: 4.8,
  },
  {
    id: "store2",
    name: "Semillas e Insumos Hidalgo",
    location: "Pachuca, Centro",
    specialty: "Semillas e Implementos",
    rating: 4.5,
  }
];

export default function CommunityPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState("directory");
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Firestore Collections (Shared with the other app)
  const productsRef = useMemo(() => db ? collection(db, "marketplace_products") : null, [db]);
  const jobsRef = useMemo(() => db ? collection(db, "job_postings") : null, [db]);

  const { data: products, loading: productsLoading } = useCollection(productsRef);
  const { data: jobs, loading: jobsLoading } = useCollection(jobsRef);

  // Form states
  const [productForm, setProductProductForm] = useState({ name: "", price: "", description: "", category: "" });
  const [jobForm, setJobForm] = useState({ title: "", employer: "", salary: "", description: "", location: "" });

  const handleCreateProduct = async () => {
    if (!productsRef || !user) return;
    setLoading(true);
    try {
      await addDoc(productsRef, {
        ...productForm,
        price: Number(productForm.price),
        userId: user.uid,
        sellerName: user.displayName || "Agricultor de Hidalgo",
        createdAt: serverTimestamp(),
        imageUrl: "https://picsum.photos/seed/product/400/300"
      });
      setIsNewProductOpen(false);
      setProductProductForm({ name: "", price: "", description: "", category: "" });
      toast({ title: "Producto Publicado", description: "Ya es visible en ambas aplicaciones." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo publicar." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!jobsRef || !user) return;
    setLoading(true);
    try {
      await addDoc(jobsRef, {
        ...jobForm,
        userId: user.uid,
        employerName: jobForm.employer || user.displayName || "Rancho Local",
        createdAt: serverTimestamp()
      });
      setIsNewJobOpen(false);
      setJobForm({ title: "", employer: "", salary: "", description: "", location: "" });
      toast({ title: "Empleo Publicado", description: "Ya es visible en ambas aplicaciones." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo publicar." });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (coll: string, id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, coll, id));
      toast({ title: "Eliminado", description: "El registro ha sido borrado." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
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

        <main className="flex-1 p-4 md:p-8 space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <TabsList className="bg-primary/5 p-1 rounded-2xl border border-primary/10">
                <TabsTrigger value="directory" className="rounded-xl font-bold gap-2">
                  <Store className="h-4 w-4" /> {t('agro_directory')}
                </TabsTrigger>
                <TabsTrigger value="marketplace" className="rounded-xl font-bold gap-2">
                  <ShoppingBag className="h-4 w-4" /> {t('marketplace')}
                </TabsTrigger>
                <TabsTrigger value="jobs" className="rounded-xl font-bold gap-2">
                  <Briefcase className="h-4 w-4" /> {t('jobs')}
                </TabsTrigger>
              </TabsList>

              {activeTab === 'marketplace' && user && (
                <Button onClick={() => setIsNewProductOpen(true)} className="rounded-xl gap-2 font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> {t('post_product')}
                </Button>
              )}
              {activeTab === 'jobs' && user && (
                <Button onClick={() => setIsNewJobOpen(true)} className="rounded-xl gap-2 font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> {t('post_job')}
                </Button>
              )}
            </div>

            <TabsContent value="directory" className="animate-in fade-in duration-500">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {staticExperts.map((store) => (
                  <Card key={store.id} className="overflow-hidden border-none shadow-lg group">
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
                      <Button className="w-full" variant={store.isExpert ? "default" : "outline"}>
                        <MessageSquare className="h-4 w-4 mr-2" /> 
                        {store.isExpert ? t('consult_expert') : t('send_message')}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="marketplace" className="animate-in fade-in duration-500">
              {productsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {products.map((product: any) => (
                    <Card key={product.id} className="overflow-hidden border-none shadow-md group">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-primary text-white font-black">${product.price}</Badge>
                        </div>
                      </div>
                      <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-base font-black truncate">{product.name}</CardTitle>
                        <CardDescription className="text-[10px] uppercase font-bold flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" /> {product.sellerName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <p className="text-xs text-muted-foreground line-clamp-2 h-8">{product.description}</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex gap-2">
                        <Button size="sm" className="flex-1 font-bold text-xs h-8">Ver más</Button>
                        {user?.uid === product.userId && (
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete('marketplace_products', product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="animate-in fade-in duration-500">
              {jobsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" /></div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {jobs.map((job: any) => (
                    <Card key={job.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg font-black text-primary">{job.title}</CardTitle>
                            <CardDescription className="font-bold">{job.employerName} • {job.location}</CardDescription>
                          </div>
                          <Badge variant="outline" className="font-black text-xs text-green-600 border-green-200 bg-green-50">{job.salary}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground/80 leading-relaxed">{job.description}</p>
                      </CardContent>
                      <CardFooter className="justify-between border-t border-primary/5 pt-4">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">Sincronizado con AgroApp</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="secondary" className="font-bold text-xs">Postularme</Button>
                          {user?.uid === job.userId && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete('job_postings', job.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>

        {/* Dialogs for posting */}
        <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
          <DialogContent className="glass-card border-none">
            <DialogHeader><DialogTitle className="font-black uppercase tracking-tighter text-2xl text-primary">Vender Producto</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('farm_name_label')}</Label>
                <Input value={productForm.name} onChange={e => setProductProductForm({...productForm, name: e.target.value})} placeholder="Ej: Fertilizante Orgánico" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('price')} (MXN)</Label>
                  <Input type="number" value={productForm.price} onChange={e => setProductProductForm({...productForm, price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>{t('category')}</Label>
                  <Input value={productForm.category} onChange={e => setProductProductForm({...productForm, category: e.target.value})} placeholder="Insumos" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={productForm.description} onChange={e => setProductProductForm({...productForm, description: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateProduct} disabled={loading} className="w-full font-black uppercase h-12 shadow-lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sincronizar Producto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isNewJobOpen} onOpenChange={setIsNewJobOpen}>
          <DialogContent className="glass-card border-none">
            <DialogHeader><DialogTitle className="font-black uppercase tracking-tighter text-2xl text-primary">Publicar Empleo</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título del Puesto</Label>
                <Input value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} placeholder="Ej: Jornalero de Maíz" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('salary')}</Label>
                  <Input value={jobForm.salary} onChange={e => setJobForm({...jobForm, salary: e.target.value})} placeholder="Ej: $1,200 sem." />
                </div>
                <div className="space-y-2">
                  <Label>{t('location_label')}</Label>
                  <Input value={jobForm.location} onChange={e => setJobForm({...jobForm, location: e.target.value})} placeholder="Actopan" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Empresa / Rancho</Label>
                <Input value={jobForm.employer} onChange={e => setJobForm({...jobForm, employer: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Descripción de la Vacante</Label>
                <Textarea value={jobForm.description} onChange={e => setJobForm({...jobForm, description: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateJob} disabled={loading} className="w-full font-black uppercase h-12 shadow-lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sincronizar Empleo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
