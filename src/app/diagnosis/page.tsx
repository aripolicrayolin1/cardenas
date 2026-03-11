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
        toast({
          title: t('voice_captured'),
          description: t('voice_captured_desc'),
        });
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [toast, t]);

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
        description: 'Por favor permite el uso de la cámara en tu navegador.',
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
    if (!recognitionRef.current) {
      toast({
        title: t('not_compatible'),
        description: t('not_compatible_desc'),
        variant: "destructive"
      });
      return;
    }
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
        title: t('missing_data'),
        description: t('missing_data_desc'),
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
      toast({ 
        title: "Error de IA", 
        description: error.message || "No se pudo realizar el diagnóstico.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const translateSeverity = (sev: string) => {
    switch(sev) {
      case 'High': return t('sev_high');
      case 'Medium': return t('sev_medium');
      case 'Low': return t('sev_low');
      default: return t('sev_na');
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
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-black text-primary tracking-tight">{t('digital_diagnosis')}</h1>
          </div>
          <Badge variant="outline" className="font-black text-[10px] tracking-widest bg-primary/10 text-primary border-primary/20 px-3">
            <BrainCircuit className="h-3 w-3 mr-2" /> IA VISUAL ACTIVA
          </Badge>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {!diagnosis ? (
              <Card className="glass-card border-none shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                <CardHeader className="bg-primary/5 pb-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ScanSearch className="h-24 w-24" />
                  </div>
                  <CardTitle className="text-3xl font-black flex items-center gap-3 text-primary">
                    <ScanSearch className="h-8 w-8" />
                    {t('pest_identifier')}
                  </CardTitle>
                  <CardDescription className="font-bold text-muted-foreground max-w-lg">
                    {t('diagnosis_prompt')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Eye className="h-4 w-4" /> ENTRADA VISUAL
                      </Label>
                      
                      {showCamera ? (
                        <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black ring-4 ring-primary/20">
                          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                          <div className="absolute inset-0 border-2 border-primary/40 pointer-events-none rounded-3xl">
                            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary/40 animate-scan shadow-[0_0_15px_rgba(34,197,94,0.8)]"></div>
                          </div>
                          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
                            <Button variant="destructive" size="sm" onClick={stopCamera} className="rounded-full px-6 font-bold shadow-lg">
                              <X className="h-4 w-4 mr-2" /> Cancelar
                            </Button>
                            <Button size="lg" onClick={capturePhoto} className="rounded-full h-16 w-16 p-0 bg-white hover:bg-white/90 text-primary shadow-2xl ring-4 ring-primary/40">
                              <div className="h-10 w-10 rounded-full bg-primary/10 border-4 border-primary animate-pulse" />
                            </Button>
                          </div>
                        </div>
                      ) : selectedImage ? (
                        <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden shadow-2xl group ring-4 ring-primary/20 transition-all">
                           <Image src={selectedImage} alt="Preview" fill className="object-cover" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="destructive" size="icon" className="h-12 w-12 rounded-full shadow-2xl" onClick={() => setSelectedImage(null)}>
                                <X className="h-6 w-6" />
                              </Button>
                           </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 h-full min-h-[250px]">
                          <button 
                            onClick={startCamera}
                            className="border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center p-6 bg-white/40 hover:bg-primary/5 transition-all group relative overflow-hidden"
                          >
                            <div className="bg-primary/10 p-5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                              <Camera className="h-8 w-8 text-primary" />
                            </div>
                            <p className="font-black text-sm text-primary uppercase tracking-tighter">Cámara en Vivo</p>
                          </button>
                          
                          <div className="border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center p-6 bg-white/40 hover:bg-primary/5 transition-all group relative overflow-hidden">
                            <Input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                            <div className="bg-primary/10 p-5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                              <ScanSearch className="h-8 w-8 text-primary" />
                            </div>
                            <p className="font-black text-sm text-primary uppercase tracking-tighter">Subir Foto</p>
                          </div>
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <Mic className="h-4 w-4" /> RECONOCIMIENTO DE VOZ
                        </Label>
                        <Button 
                          variant={isListening ? "destructive" : "outline"} 
                          size="sm" 
                          className={`gap-2 rounded-full px-4 font-bold border-primary/20 transition-all ${isListening ? 'animate-pulse' : ''}`}
                          onClick={toggleListening}
                        >
                          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          {isListening ? 'Escuchando...' : 'Dictar Síntomas'}
                        </Button>
                      </div>
                      <Textarea 
                        className="min-h-[200px] text-lg border-primary/10 rounded-3xl bg-white/50 shadow-inner p-6 focus-visible:ring-primary"
                        placeholder={t('placeholder_symptoms')} 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-primary/5 border-t p-8">
                  <Button className="w-full h-16 text-2xl font-black rounded-2xl shadow-2xl group transition-all" disabled={loading} onClick={startDiagnosis}>
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin" /> 
                        PROCESANDO CON IA...
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Zap className="h-8 w-8 fill-white animate-float" />
                        IDENTIFICAR Y RESOLVER
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in zoom-in-95 duration-700">
                <Card className="lg:col-span-1 glass-card border-none shadow-2xl h-fit overflow-hidden">
                   <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {selectedImage ? (
                        <Image src={selectedImage} alt="Preview" fill className="object-cover" />
                      ) : (
                        <FileText className="h-16 w-16 opacity-10" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      <div className="absolute bottom-4 left-4 right-4">
                         <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">CAPTURA ANALIZADA</p>
                         <p className="text-white font-bold truncate">HIDALGO, MX • {new Date().toLocaleTimeString()}</p>
                      </div>
                   </div>
                   <CardContent className="p-6 space-y-4">
                     <Button variant="outline" className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest border-primary/20 hover:bg-primary/5" onClick={reset}>
                       <RefreshCcw className="h-4 w-4 mr-2" /> {t('new_query')}
                     </Button>
                     <Button className="w-full h-12 rounded-xl font-black uppercase text-xs tracking-widest bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20">
                        <Users className="h-4 w-4 mr-2" /> {t('report_outbreak_btn')}
                     </Button>
                   </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                  <Card className="glass-card border-none shadow-2xl overflow-hidden">
                    <CardHeader className="border-b bg-white/50">
                      <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest mb-2">
                        <ShieldCheck className="h-4 w-4" /> {t('precision_diagnosis')}
                      </div>
                      <CardTitle className="text-4xl font-black text-primary tracking-tighter">
                        {diagnosis.diagnosis.identifiedProblem}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-8">
                      <div className="grid grid-cols-2 gap-6">
                         <div className="p-5 rounded-3xl bg-destructive/5 border-2 border-destructive/10 shadow-inner">
                            <p className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1">{t('severity')}</p>
                            <p className="text-2xl font-black">{translateSeverity(diagnosis.diagnosis.severity)}</p>
                         </div>
                         <div className="p-5 rounded-3xl bg-primary/5 border-2 border-primary/10 shadow-inner">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{t('confidence')}</p>
                            <p className="text-2xl font-black">{diagnosis.diagnosis.confidence === 'High' ? 'ALTA' : diagnosis.diagnosis.confidence === 'Medium' ? 'MEDIA' : 'BAJA'}</p>
                         </div>
                      </div>

                      <Tabs defaultValue="actions" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 p-1 h-14 bg-muted/20 rounded-2xl">
                          <TabsTrigger value="actions" className="font-black text-xs uppercase rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">{t('actions')}</TabsTrigger>
                          <TabsTrigger value="commercial" className="font-black text-xs uppercase rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">{t('buy')}</TabsTrigger>
                          <TabsTrigger value="homemade" className="font-black text-xs uppercase rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">{t('bio')}</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="actions" className="mt-8">
                          <div className="space-y-4">
                            {diagnosis.diagnosis.recommendedActions.map((action, idx) => (
                              <div key={idx} className="flex items-start gap-4 p-5 bg-white/60 rounded-2xl border-2 border-primary/5 shadow-sm transition-all hover:translate-x-1">
                                <div className="bg-primary/20 p-2 rounded-full mt-0.5">
                                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                </div>
                                <span className="font-bold text-lg text-foreground/80">{action}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="commercial" className="mt-8 space-y-4">
                          {diagnosis.diagnosis.commercialProducts.map((product, idx) => (
                            <div key={idx} className="p-6 bg-white rounded-3xl border-2 border-primary/10 shadow-md relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                <ShoppingBag className="h-12 w-12" />
                              </div>
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h5 className="font-black text-2xl text-primary tracking-tighter">{product.name}</h5>
                                  <Badge variant="secondary" className="mt-1 font-bold text-[9px] uppercase">DISPONIBILIDAD: HIDALGO</Badge>
                                </div>
                              </div>
                              <p className="text-sm font-medium text-muted-foreground mb-6 leading-relaxed">{product.description}</p>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Button className="flex-1 h-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/80 font-black rounded-xl" asChild>
                                  <a href={product.locationLink || "#"} target="_blank" rel="noopener noreferrer">
                                    <MapPin className="h-4 w-4" /> {t('near_stores')}
                                  </a>
                                </Button>
                                <Button variant="outline" className="flex-1 h-12 gap-2 font-black rounded-xl border-primary/20 hover:bg-primary hover:text-white" asChild>
                                  <a href={`https://listado.mercadolibre.com.mx/${product.name.replace(/\s/g, '+')}`} target="_blank" rel="noopener noreferrer">
                                    <ShoppingBag className="h-4 w-4" /> {t('online_quote')}
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </TabsContent>

                        <TabsContent value="homemade" className="mt-8 space-y-4">
                          {diagnosis.diagnosis.homeMadeRemedies.map((remedy, idx) => (
                            <div key={idx} className="p-8 bg-green-50/50 rounded-3xl border-2 border-green-200 shadow-sm">
                              <h5 className="font-black text-2xl text-green-800 mb-4 tracking-tighter flex items-center gap-2">
                                <Leaf className="h-6 w-6" /> {remedy.name}
                              </h5>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">{t('ingredients')}</p>
                                  <p className="text-sm font-bold text-green-900/80">{remedy.ingredients.join(", ")}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">{t('instructions')}</p>
                                  <p className="text-sm font-medium leading-relaxed italic text-green-900/70">{remedy.instructions}</p>
                                </div>
                              </div>
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
