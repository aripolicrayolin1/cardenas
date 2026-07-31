
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Store,
  Send,
  UserCheck,
  ExternalLink,
  Briefcase,
  ShoppingBag,
  Plus,
  Loader2,
  Trash2,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/hooks/use-translation";
import { useComunidad } from "@/hooks/comunidad/use-comunidad";
import type { Producto } from "@/services/comunidad";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

/**
 * Instituciones agrícolas públicas REALES que atienden a Hidalgo.
 *
 * Antes aquí había tres negocios ficticios con calificaciones inventadas
 * ("Ing. Ricardo" 5.0 estrellas, etc.). Se sustituyen por organismos que
 * existen de verdad y ofrecen servicios oficiales al agricultor. No se
 * inventan teléfonos ni calificaciones: el botón abre una búsqueda web para
 * que el productor encuentre el contacto oficial vigente de cada institución.
 */
const institucionesAgricolas = [
  {
    id: "cesaveh",
    name: "Comité Estatal de Sanidad Vegetal de Hidalgo",
    sigla: "CESAVEH",
    specialty: "Vigilancia y manejo fitosanitario de plagas y enfermedades",
    oficial: true,
  },
  {
    id: "senasica",
    name: "SENASICA",
    sigla: "Federal",
    specialty: "Sanidad e inocuidad agroalimentaria (alertas fitosanitarias)",
    oficial: true,
  },
  {
    id: "sader-hidalgo",
    name: "SADER / Secretaría de Agricultura de Hidalgo",
    sigla: "Gobierno",
    specialty: "Apoyos, programas y asesoría técnica al productor",
    oficial: true,
  },
  {
    id: "inifap",
    name: "INIFAP",
    sigla: "Investigación",
    specialty: "Investigación agrícola, paquetes tecnológicos por cultivo",
    oficial: false,
  },
];

export default function CommunityPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("directory");
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);

  const {
    productos: products,
    empleos: jobs,
    cargandoProductos: productsLoading,
    cargandoEmpleos: jobsLoading,
    guardando: loading,
    errorMutacion,
    publicarProducto,
    publicarEmpleo,
    eliminar,
    puedePublicar,
    uid,
  } = useComunidad();

  // Form states
  const [productForm, setProductProductForm] = useState({ name: "", price: "", description: "", category: "", contact: "" });
  const [jobForm, setJobForm] = useState({ title: "", employer: "", salary: "", description: "", location: "", contact: "" });

  // Producto abierto en el diálogo de detalle ("Ver más").
  const [detalleProducto, setDetalleProducto] = useState<Producto | null>(null);

  /** Abre WhatsApp con un mensaje prellenado, o avisa si no hay contacto. */
  const contactar = (contact: string | undefined, mensaje: string) => {
    if (!contact) {
      toast({
        title: "Sin contacto",
        description: "Quien publicó no dejó un número. Revisa de nuevo más tarde.",
      });
      return;
    }
    window.open(
      `https://wa.me/52${contact}?text=${encodeURIComponent(mensaje)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleCreateProduct = async () => {
    // El motivo llega en el resultado. Leer `errorMutacion` tras el `await`
    // devolvía el valor del render anterior: normalmente `null`, así que el
    // aviso salía sin explicación.
    const { valor: id, error } = await publicarProducto(productForm);

    if (!id) {
      toast({ variant: "destructive", title: "No se pudo publicar", description: error ?? undefined });
      return;
    }

    setIsNewProductOpen(false);
    setProductProductForm({ name: "", price: "", description: "", category: "", contact: "" });
    toast({ title: "Producto Publicado", description: "Ya es visible en ambas aplicaciones." });
  };

  const handleCreateJob = async () => {
    const { valor: id, error } = await publicarEmpleo(jobForm);

    if (!id) {
      toast({ variant: "destructive", title: "No se pudo publicar", description: error ?? undefined });
      return;
    }

    setIsNewJobOpen(false);
    setJobForm({ title: "", employer: "", salary: "", description: "", location: "", contact: "" });
    toast({ title: "Empleo Publicado", description: "Ya es visible en ambas aplicaciones." });
  };

  const handleDelete = async (coll: 'marketplace_products' | 'job_postings', id: string) => {
    const { valor: ok, error } = await eliminar(coll, id);

    toast({
      title: ok ? "Eliminado" : "No se pudo eliminar",
      description: ok ? "El registro ha sido borrado." : error ?? undefined,
      variant: ok ? "default" : "destructive",
    });
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

              {activeTab === 'marketplace' && puedePublicar && (
                <Button onClick={() => setIsNewProductOpen(true)} className="rounded-xl gap-2 font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> {t('post_product')}
                </Button>
              )}
              {activeTab === 'jobs' && puedePublicar && (
                <Button onClick={() => setIsNewJobOpen(true)} className="rounded-xl gap-2 font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> {t('post_job')}
                </Button>
              )}
            </div>

            <TabsContent value="directory" className="animate-in fade-in duration-500">
              <p className="text-xs text-muted-foreground mb-6 max-w-2xl leading-relaxed">
                {t('directory_intro')}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {institucionesAgricolas.map((inst) => (
                  <Card key={inst.id} className="overflow-hidden border-none shadow-lg group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-start gap-2 leading-tight">
                        {inst.oficial ? <UserCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" /> : <Store className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
                        {inst.name}
                      </CardTitle>
                      <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                        {inst.sigla}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm font-medium text-muted-foreground">{inst.specialty}</p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            `https://www.google.com/search?q=${encodeURIComponent(inst.name + ' Hidalgo contacto')}`,
                            '_blank',
                            'noopener,noreferrer'
                          )
                        }
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {t('find_official_contact')}
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
                  {products.map((product) => (
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
                        <Button size="sm" className="flex-1 font-bold text-xs h-8" onClick={() => setDetalleProducto(product)}>
                          {t('see_more')}
                        </Button>
                        {uid === product.userId && (
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
                  {jobs.map((job) => (
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
                          <Button
                            size="sm"
                            variant="secondary"
                            className="font-bold text-xs gap-1.5"
                            onClick={() => contactar(job.contact, `Hola, vi tu vacante "${job.title}" en AgroTech y me interesa postularme.`)}
                          >
                            <Send className="h-3.5 w-3.5" /> {t('apply_job')}
                          </Button>
                          {uid === job.userId && (
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
              <div className="space-y-2">
                <Label>{t('contact_whatsapp')}</Label>
                <Input value={productForm.contact} onChange={e => setProductProductForm({...productForm, contact: e.target.value})} placeholder="771 000 0000" />
                <p className="text-[10px] text-muted-foreground">{t('contact_hint')}</p>
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
              <div className="space-y-2">
                <Label>{t('contact_whatsapp')}</Label>
                <Input value={jobForm.contact} onChange={e => setJobForm({...jobForm, contact: e.target.value})} placeholder="771 000 0000" />
                <p className="text-[10px] text-muted-foreground">{t('contact_hint')}</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateJob} disabled={loading} className="w-full font-black uppercase h-12 shadow-lg">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sincronizar Empleo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detalle de producto ("Ver más") */}
        <Dialog open={detalleProducto !== null} onOpenChange={(abierto) => !abierto && setDetalleProducto(null)}>
          <DialogContent className="glass-card border-none">
            {detalleProducto && (
              <>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden -mt-2">
                  <Image src={detalleProducto.imageUrl} alt={detalleProducto.name} fill className="object-cover" />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary text-white font-black text-base px-3 py-1">${detalleProducto.price}</Badge>
                  </div>
                </div>
                <DialogHeader>
                  <DialogTitle className="font-black tracking-tighter text-2xl text-primary">{detalleProducto.name}</DialogTitle>
                  <DialogDescription className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-widest">
                    <User className="h-3 w-3 text-primary" /> {detalleProducto.sellerName}
                    {detalleProducto.category && <span className="text-muted-foreground">· {detalleProducto.category}</span>}
                  </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {detalleProducto.description || t('no_description')}
                </p>
                <DialogFooter>
                  <Button
                    className="w-full font-black uppercase h-12 gap-2 shadow-lg"
                    onClick={() => contactar(detalleProducto.contact, `Hola, me interesa tu producto "${detalleProducto.name}" que vi en AgroTech.`)}
                  >
                    <Send className="h-4 w-4" /> {t('contact_seller')}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
