"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  X, 
  RefreshCcw, 
  Leaf, 
  Clock,
  ShieldCheck,
  Zap
} from "lucide-react";
import { useState } from "react";
import { diagnoseCropDisease, type CropDiagnosisOutput } from "@/ai/flows/crop-disease-photo-diagnosis-flow";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function DiagnosisPage() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<CropDiagnosisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setDiagnosis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startDiagnosis = async () => {
    if (!selectedImage) return;
    setLoading(true);

    try {
      const result = await diagnoseCropDisease({
        photoDataUri: selectedImage,
        description: description
      });
      setDiagnosis(result);
      
      if (result.diagnosis.isFallback) {
        toast({
          title: "Diagnóstico Local Activado",
          description: "La IA está saturada, usamos el motor de respaldo.",
          variant: "default"
        });
      } else {
        toast({
          title: "Análisis IA Completado",
          description: "Diagnóstico generado con éxito.",
        });
      }
    } catch (error) {
      toast({
        title: "Error Crítico",
        description: "No se pudo realizar el diagnóstico.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setDiagnosis(null);
    setDescription("");
  };

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Diagnóstico Inteligente</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {!diagnosis ? (
              <Card className="border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Camera className="h-6 w-6 text-primary" />
                    Identificador de Problemas
                  </CardTitle>
                  <CardDescription>
                    Sube una foto y describe qué ves para obtener una solución.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {!selectedImage ? (
                    <div className="border-2 border-dashed border-primary/20 rounded-xl aspect-video flex flex-col items-center justify-center p-12 bg-muted/10 group hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={handleImageChange}
                      />
                      <div className="bg-primary/10 p-6 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Camera className="h-12 w-12 text-primary" />
                      </div>
                      <p className="font-bold text-lg text-primary">Haz clic para subir o tomar foto</p>
                      <p className="text-sm text-muted-foreground mt-2">Formatos aceptados: JPG, PNG</p>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-black group">
                       <Image src={selectedImage} alt="Preview" fill className="object-contain" />
                       <Button variant="destructive" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={reset}>
                         <X className="h-5 w-5" />
                       </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="symptoms" className="text-base font-bold">Describe lo que ves (Opcional)</Label>
                    <Input 
                      id="symptoms" 
                      className="h-12 text-lg border-primary/20 focus:ring-primary"
                      placeholder="Ej: manchas amarillas, bichitos blancos, hojas comidas..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground italic">
                      * Una descripción detallada ayuda si la conexión con Google es inestable.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/5 border-t p-6">
                  <Button 
                    className="w-full h-14 text-xl font-black shadow-xl rounded-xl"
                    disabled={!selectedImage || loading}
                    onClick={startDiagnosis}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-6 w-6 fill-white" />
                        OBTENER DIAGNÓSTICO
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1 border-none shadow-lg overflow-hidden h-fit">
                   <div className="relative aspect-square">
                      <Image src={selectedImage!} alt="Preview" fill className="object-cover" />
                      {diagnosis.diagnosis.isFallback && (
                        <div className="absolute top-0 left-0 w-full p-2 bg-orange-600/90 text-white text-[10px] text-center font-bold">
                          MODO RESPALDO ACTIVADO
                        </div>
                      )}
                   </div>
                   <CardContent className="p-4 bg-muted/50">
                     <Button variant="outline" className="w-full font-bold" onClick={reset}>
                       <RefreshCcw className="h-4 w-4 mr-2" /> Nueva Consulta
                     </Button>
                   </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-none shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="flex flex-row items-start justify-between border-b pb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {diagnosis.diagnosis.isFallback ? (
                            <ShieldCheck className="h-5 w-5 text-orange-500" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          )}
                          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            {diagnosis.diagnosis.isFallback ? "Diagnóstico de Respaldo" : "Diagnóstico IA Real"}
                          </span>
                        </div>
                        <CardTitle className="text-3xl font-black text-primary">
                          {diagnosis.diagnosis.identifiedProblem}
                        </CardTitle>
                      </div>
                      <Badge className="px-3 py-1 text-sm">{diagnosis.diagnosis.confidence} Confianza</Badge>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                            <p className="text-[10px] font-bold uppercase text-destructive mb-1">Severidad</p>
                            <p className="text-xl font-black">{diagnosis.diagnosis.severity}</p>
                         </div>
                         <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <p className="text-[10px] font-bold uppercase text-primary mb-1">Estado</p>
                            <p className="text-xl font-black">{diagnosis.diagnosis.isProblemDetected ? "Alerta" : "Normal"}</p>
                         </div>
                      </div>

                      <Tabs defaultValue="actions" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-12">
                          <TabsTrigger value="actions" className="text-sm font-bold">Acciones</TabsTrigger>
                          <TabsTrigger value="commercial" className="text-sm font-bold">Tratamiento</TabsTrigger>
                          <TabsTrigger value="homemade" className="text-sm font-bold">Orgánico</TabsTrigger>
                        </TabsList>
                        <TabsContent value="actions" className="mt-6 space-y-4">
                          <h4 className="font-black flex items-center gap-2 text-lg">
                            <Leaf className="h-5 w-5 text-primary" /> Pasos a seguir:
                          </h4>
                          <ul className="grid gap-3">
                            {diagnosis.diagnosis.recommendedActions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-base p-4 bg-white rounded-xl border shadow-sm group hover:border-primary transition-colors">
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span className="font-medium">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </TabsContent>
                        <TabsContent value="commercial" className="mt-6 space-y-4">
                          {diagnosis.diagnosis.commercialProducts.map((product, idx) => (
                            <div key={idx} className="p-5 bg-white rounded-2xl border-2 border-primary/10 shadow-sm">
                              <h5 className="font-black text-xl text-primary mb-1">{product.name}</h5>
                              <p className="text-base text-muted-foreground mb-3">{product.description}</p>
                              <div className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                                Disponible en: {product.localStores}
                              </div>
                            </div>
                          ))}
                        </TabsContent>
                        <TabsContent value="homemade" className="mt-6 space-y-4">
                          {diagnosis.diagnosis.homeMadeRemedies.map((remedy, idx) => (
                            <div key={idx} className="p-6 bg-green-50 rounded-2xl border-2 border-green-200 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Leaf className="h-12 w-12" />
                              </div>
                              <h5 className="font-black text-xl text-green-800 mb-2">{remedy.name}</h5>
                              <p className="text-sm font-bold text-green-700 mb-1">Ingredientes:</p>
                              <p className="text-sm mb-4">{remedy.ingredients.join(", ")}</p>
                              <p className="text-sm font-bold text-green-700 mb-1">Instrucciones:</p>
                              <p className="text-sm italic">{remedy.instructions}</p>
                            </div>
                          ))}
                        </TabsContent>
                      </Tabs>

                      {diagnosis.diagnosis.additionalNotes && (
                        <div className="p-4 bg-muted rounded-xl text-xs text-muted-foreground flex gap-3 items-center">
                          <Clock className="h-4 w-4 shrink-0" />
                          {diagnosis.diagnosis.additionalNotes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
