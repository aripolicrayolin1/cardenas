"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Camera, 
  CheckCircle2, 
  Loader2, 
  X, 
  RefreshCcw, 
  ShieldCheck, 
  Zap, 
  FileText, 
  Mic, 
  MicOff, 
  MapPin, 
  ShoppingBag, 
  Users,
  ScanSearch,
  BrainCircuit,
  Eye,
  Leaf
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { diagnoseCropDisease, type CropDiagnosisOutput } from "@/ai/flows/crop-disease-photo-diagnosis-flow";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";

export default function DiagnosisPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<CropDiagnosisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'es-MX';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription((prev) => prev + " " + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: 'destructive',
        title: 'Acceso Denegado',
        description: 'Por favor permite el uso de la cámara.',
      });
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Asegurar que el video esté listo y tenga dimensiones
      if (video.videoWidth === 0) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setSelectedImage(dataUrl);
        stopCamera();
        setDiagnosis(null);
      }
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

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
    if (!selectedImage && !description.trim()) {
      toast({
        title: "Faltan datos",
        description: "Captura una foto o describe el problema.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);

    try {
      const result = await diagnoseCropDisease({
        photoDataUri: selectedImage || undefined,
        description: description
      });
      setDiagnosis(result);
    } catch (error: any) {
      console.error("Diagnosis Error:", error);
      toast({ 
        title: "Error de IA Real", 
        description: error.message || "No se pudo realizar el diagnóstico. Revisa la consola.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const translateSeverity = (sev: string) => {
    switch(sev) {
      case 'High': return "Alta";
      case 'Medium': return "Media";
      case 'Low': return "Baja";
      default: return "No Aplica";
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setDiagnosis(null);
    setDescription("");
    stopCamera();
  };

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-black text-primary tracking-tight">Diagnóstico Digital</h1>
          </div>
          <Badge variant="outline" className="font-black text-[10px] tracking-widest bg-primary/10 text-primary border-primary/20 px-3 uppercase">
            <BrainCircuit className="h-3 w-3 mr-2" /> IA PURA ACTIVA
          </Badge>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {!diagnosis ? (
              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-primary/5 pb-8">
                  <CardTitle className="text-3xl font-black flex items-center gap-3 text-primary">
                    <ScanSearch className="h-8 w-8" />
                    Identificador de Plagas
                  </CardTitle>
                  <CardDescription className="font-bold text-muted-foreground">
                    Captura una foto de la zona afectada para que la IA la analice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Eye className="h-4 w-4" /> Muestra Visual
                      </Label>
                      
                      {showCamera ? (
                        <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black">
                          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                          <div className="absolute inset-0 border-2 border-primary/40 pointer-events-none rounded-3xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary/60 animate-scan"></div>
                          </div>
                          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                            <Button variant="destructive" size="sm" onClick={stopCamera} className="rounded-full px-6 font-bold shadow-lg">
                              Cancelar
                            </Button>
                            <Button size="lg" onClick={capturePhoto} className="rounded-full h-16 w-16 p-0 bg-white hover:bg-white/90 text-primary shadow-2xl border-4 border-primary/20">
                              <div className="h-8 w-8 rounded-full bg-primary animate-pulse" />
                            </Button>
                          </div>
                        </div>
                      ) : selectedImage ? (
                        <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden shadow-2xl group ring-4 ring-primary/10 transition-all">
                           <Image src={selectedImage} alt="Preview" fill className="object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full" onClick={() => setSelectedImage(null)}>
                                <X className="h-6 w-6" />
                              </Button>
                           </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 h-full min-h-[250px]">
                          <button 
                            onClick={startCamera}
                            className="border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center p-6 bg-white/40 hover:bg-primary/5 transition-all group"
                          >
                            <div className="bg-primary/10 p-5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                              <Camera className="h-8 w-8 text-primary" />
                            </div>
                            <p className="font-black text-xs text-primary uppercase tracking-widest">Usar Cámara</p>
                          </button>
                          
                          <div className="border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center p-6 bg-white/40 hover:bg-primary/5 transition-all group relative">
                            <Input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                            <div className="bg-primary/10 p-5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                              <ScanSearch className="h-8 w-8 text-primary" />
                            </div>
                            <p className="font-black text-xs text-primary uppercase tracking-widest">Subir Imagen</p>
                          </div>
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Mic className="h-4 w-4" /> Descripción / Voz
                      </Label>
                      <Textarea 
                        className="min-h-[200px] text-base border-primary/10 rounded-2xl bg-white/50 shadow-inner p-6 focus-visible:ring-primary"
                        placeholder="Describe los síntomas que observas..." 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      <Button 
                        variant={isListening ? "destructive" : "outline"} 
                        className={`w-full gap-2 rounded-xl font-bold transition-all ${isListening ? 'animate-pulse' : ''}`}
                        onClick={toggleListening}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        {isListening ? 'Escuchando...' : 'Dictar Síntomas'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-primary/5 border-t p-8">
                  <Button className="w-full h-16 text-xl font-black rounded-2xl shadow-xl transition-all" disabled={loading} onClick={startDiagnosis}>
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin" /> PROCESANDO CON IA...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 fill-white" /> IDENTIFICAR AHORA
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1 glass-card border-none shadow-2xl h-fit overflow-hidden">
                   <div className="relative aspect-square bg-muted">
                      {selectedImage ? (
                        <Image src={selectedImage} alt="Preview" fill className="object-cover" />
                      ) : (
                        <FileText className="h-16 w-16 opacity-10" />
                      )}
                   </div>
                   <CardContent className="p-6 space-y-4">
                     <Button variant="outline" className="w-full font-black uppercase text-[10px] tracking-widest border-primary/20" onClick={reset}>
                       <RefreshCcw className="h-4 w-4 mr-2" /> Nueva Consulta
                     </Button>
                   </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                  <Card className="glass-card border-none shadow-2xl overflow-hidden">
                    <CardHeader className="border-b bg-white/50">
                      <CardTitle className="text-3xl font-black text-primary tracking-tighter">
                        {diagnosis.diagnosis.identifiedProblem}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-8">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1">Severidad</p>
                            <p className="text-xl font-black">{translateSeverity(diagnosis.diagnosis.severity)}</p>
                         </div>
                         <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Confianza IA</p>
                            <p className="text-xl font-black">{diagnosis.diagnosis.confidence === 'High' ? 'ALTA' : 'MEDIA'}</p>
                         </div>
                      </div>

                      <Tabs defaultValue="actions" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/20 rounded-xl">
                          <TabsTrigger value="actions" className="font-bold text-xs">Acciones</TabsTrigger>
                          <TabsTrigger value="commercial" className="font-bold text-xs">Tienda</TabsTrigger>
                          <TabsTrigger value="homemade" className="font-bold text-xs">Bio</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="actions" className="mt-6 space-y-4">
                          {diagnosis.diagnosis.recommendedActions.map((action, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 bg-white/60 rounded-xl border border-primary/10 shadow-sm">
                              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              <span className="font-bold text-base text-foreground/80">{action}</span>
                            </div>
                          ))}
                        </TabsContent>
                        
                        <TabsContent value="commercial" className="mt-6 space-y-4">
                          {diagnosis.diagnosis.commercialProducts.map((product, idx) => (
                            <div key={idx} className="p-6 bg-white rounded-2xl border border-primary/10 shadow-sm">
                              <h5 className="font-black text-xl text-primary mb-2">{product.name}</h5>
                              <p className="text-sm font-medium text-muted-foreground mb-4">{product.description}</p>
                              <Button className="w-full font-bold gap-2" variant="outline" asChild>
                                <a href={product.locationLink || "#"} target="_blank" rel="noopener noreferrer">
                                  <MapPin className="h-4 w-4" /> Buscar en Hidalgo
                                </a>
                              </Button>
                            </div>
                          ))}
                        </TabsContent>

                        <TabsContent value="homemade" className="mt-6 space-y-4">
                          {diagnosis.diagnosis.homeMadeRemedies.map((remedy, idx) => (
                            <div key={idx} className="p-6 bg-green-50/50 rounded-2xl border border-green-200">
                              <h5 className="font-black text-xl text-green-800 mb-3 flex items-center gap-2">
                                <Leaf className="h-5 w-5" /> {remedy.name}
                              </h5>
                              <p className="text-xs font-black text-green-700 uppercase tracking-widest mb-1">Preparación</p>
                              <p className="text-sm font-medium text-green-900/70">{remedy.instructions}</p>
                            </div>
                          ))}
                        </TabsContent>
                      </Tabs>
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
