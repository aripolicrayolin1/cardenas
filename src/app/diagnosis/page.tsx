
"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, CheckCircle2, AlertTriangle, Loader2, X, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { diagnoseCropDisease, type CropDiagnosisOutput } from "@/ai/flows/crop-disease-photo-diagnosis-flow";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export default function DiagnosisPage() {
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
    } catch (error) {
      console.error("Diagnosis failed", error);
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
        <header className="flex h-16 shrink-0 items-center justify-between px-6 transition-[width,height] ease-linear border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Diagnóstico IA</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {!diagnosis ? (
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Identificador de Plagas y Enfermedades</CardTitle>
                  <CardDescription>
                    Sube una foto clara de las hojas o el tallo afectado para un análisis instantáneo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!selectedImage ? (
                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl aspect-video flex flex-col items-center justify-center p-12 bg-muted/10 group hover:bg-muted/20 transition-all cursor-pointer relative">
                      <Input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={handleImageChange}
                      />
                      <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Camera className="h-10 w-10 text-primary" />
                      </div>
                      <p className="font-bold text-lg">Subir o Tomar Foto</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG hasta 10MB</p>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-xl overflow-hidden group shadow-inner bg-black">
                       <Image 
                         src={selectedImage} 
                         alt="Uploaded crop" 
                         fill 
                         className="object-contain"
                       />
                       <Button 
                         variant="destructive" 
                         size="icon" 
                         className="absolute top-4 right-4 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                         onClick={reset}
                       >
                         <X className="h-4 w-4" />
                       </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="symptoms">Describe los síntomas (opcional)</Label>
                    <Input 
                      id="symptoms" 
                      placeholder="Ej: manchas amarillas en las hojas inferiores..." 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full h-12 text-lg font-bold shadow-lg" 
                    disabled={!selectedImage || loading}
                    onClick={startDiagnosis}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analizando Cultivo...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Iniciar Análisis IA
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 border-none shadow-lg overflow-hidden h-fit">
                   <div className="relative aspect-square">
                      <Image src={selectedImage!} alt="Preview" fill className="object-cover" />
                   </div>
                   <CardContent className="p-4 bg-muted/50">
                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Imagen Analizada</p>
                     <Button variant="outline" size="sm" className="w-full" onClick={reset}>
                       <RefreshCcw className="h-3 w-3 mr-2" /> Nueva Consulta
                     </Button>
                   </CardContent>
                </Card>

                <Card className="md:col-span-2 border-none shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {diagnosis.diagnosis.isProblemDetected ? (
                          <AlertTriangle className="text-accent-foreground h-7 w-7 fill-accent" />
                        ) : (
                          <CheckCircle2 className="text-primary h-7 w-7" />
                        )}
                        Resultados del Análisis
                      </CardTitle>
                      <CardDescription>
                        Diagnóstico generado mediante IA avanzada
                      </CardDescription>
                    </div>
                    <Badge variant={diagnosis.diagnosis.confidence === 'High' ? 'default' : 'secondary'}>
                      Confianza: {diagnosis.diagnosis.confidence}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Identificación</h4>
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                         <p className="text-xl font-bold text-primary">{diagnosis.diagnosis.identifiedProblem}</p>
                         <div className="flex items-center gap-2 mt-2">
                           <Badge variant="outline">Severidad: {diagnosis.diagnosis.severity}</Badge>
                         </div>
                      </div>
                    </div>

                    {diagnosis.diagnosis.recommendedActions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">Acciones Recomendadas</h4>
                        <ul className="space-y-2">
                          {diagnosis.diagnosis.recommendedActions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm p-3 bg-white rounded-lg border shadow-sm">
                              <div className="mt-0.5 bg-primary/10 rounded-full p-1">
                                <CheckCircle2 className="h-3 w-3 text-primary" />
                              </div>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {diagnosis.diagnosis.additionalNotes && (
                      <div className="p-4 bg-muted/30 rounded-lg text-sm italic border-l-4 border-primary/40">
                        {diagnosis.diagnosis.additionalNotes}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="bg-muted/20 border-t p-6 flex flex-col sm:flex-row gap-4">
                    <Button className="flex-1 font-bold">Enviar Alerta Regional</Button>
                    <Button variant="outline" className="flex-1 font-bold">Contactar Agrónomo</Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
