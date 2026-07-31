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
  Loader2, 
  X, 
  RefreshCcw, 
  Zap, 
  Mic, 
  MicOff, 
  ScanSearch,
  BrainCircuit,
  Eye,
  ShieldCheck,
  Bug,
  Sprout,
  Share2,
  Facebook,
  MessageCircle
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { diagnoseCropDiseasePro, type CropDiagnosisProOutput } from "@/ai/flows/crop-disease-photo-diagnosis-flow";
import { identificarPlanta, type ResultadoPlantNet } from "@/ai/flows/plantnet-identify";
import { modeloDisponible } from "@/lib/vision/clasificador";
import { clasificarComoDiagnostico } from "@/lib/vision/diagnostico-local";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";
import { capturarDeVideo, prepararArchivo, ImagenInvalidaError } from "@/lib/imagen";

export default function DiagnosisPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<CropDiagnosisProOutput | null>(null);
  const [segundaOpinion, setSegundaOpinion] = useState<ResultadoPlantNet | null>(null);
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
    if (!videoRef.current) return;

    try {
      // Reescala a 1280 px: una captura a resolución nativa supera el límite de
      // 1 MB de las Server Actions y gasta datos móviles a lo tonto.
      setSelectedImage(capturarDeVideo(videoRef.current));
      stopCamera();
      setDiagnosis(null);
    } catch (error) {
      toast({
        title: "Cargando Cámara",
        description: error instanceof ImagenInvalidaError
          ? error.message
          : "Espera un momento a que la cámara inicie.",
      });
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSelectedImage(await prepararArchivo(file));
      setDiagnosis(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No pudimos usar esa foto",
        description: error instanceof ImagenInvalidaError
          ? error.message
          : "Prueba con otra imagen.",
      });
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
      // 1. Modelo de visión LOCAL primero: si está entrenado y reconoce la foto
      //    con confianza, resuelve sin conexión y sin coste. Mientras no exista
      //    modelo, `clasificarComoDiagnostico` devuelve null y se pasa a Gemini.
      //    Así la migración "entra sola" al copiar el modelo entrenado.
      if (selectedImage && modeloDisponible()) {
        const local = await clasificarComoDiagnostico(selectedImage);
        if (local) {
          setDiagnosis(local);
          setLoading(false);
          return;
        }
      }

      // 2. Respaldo: Gemini. Requiere conexión y clave de API.
      const result = await diagnoseCropDiseasePro({
        photoDataUri: selectedImage || undefined,
        description: description
      });
      setDiagnosis(result);

      // 3. Segunda opinión especializada (Pl@ntNet), solo si hay foto. Corre
      //    aparte y no bloquea: si falla o no hay llave, no se muestra.
      if (selectedImage) {
        identificarPlanta(selectedImage)
          .then((r) => setSegundaOpinion(r.disponible ? r : null))
          .catch(() => setSegundaOpinion(null));
      }
    } catch (error: any) {
      console.error("Diagnosis Error:", error);
      // Se distingue la causa real en vez de culpar siempre a la señal: un 429
      // (cuota diaria agotada) no es lo mismo que estar sin internet, y mandar a
      // "revisa tu conexión" cuando sí hay red confunde al agricultor.
      const msg = String(error?.message ?? "").toLowerCase();
      const esCuota = msg.includes("429") || msg.includes("quota") || msg.includes("exceeded");

      toast({
        title: "No pudimos analizar la foto",
        description: esCuota
          ? "Se agotó por hoy el límite gratuito de análisis por imagen. Vuelve a intentarlo mañana, o usa el análisis por sensores del panel."
          : "El diagnóstico por imagen necesita conexión a internet. Sin señal, usa el análisis por sensores del panel, que funciona sin conexión.",
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
      default: return "Normal";
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setDiagnosis(null);
    setSegundaOpinion(null);
    setDescription("");
    stopCamera();
  };

  // Compartir el diagnóstico es la forma más directa de que un aviso llegue a
  // los vecinos: WhatsApp y Facebook son lo que ya usa la comunidad.
  const shareToWhatsApp = () => {
    if (!diagnosis) return;
    const texto =
      `🚨 *DIAGNÓSTICO AGROTECH HIDALGO* 🚨\n\n` +
      `*Problema:* ${diagnosis.diagnosis.identifiedProblem}\n` +
      `*Severidad:* ${translateSeverity(diagnosis.diagnosis.severity)}\n` +
      `*Recomendación:* ${diagnosis.diagnosis.expertNotes}\n\n` +
      `_Análisis orientativo generado con IA. Ante la duda, consulta a un agrónomo._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  const shareToFacebook = () => {
    if (!diagnosis) return;
    const texto =
      `AgroTech Hidalgo: mi cultivo presenta ${diagnosis.diagnosis.identifiedProblem} ` +
      `(severidad ${translateSeverity(diagnosis.diagnosis.severity)}). ` +
      `#AgroTech #Hidalgo #Bioseguridad`;
    const url =
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}` +
      `&quote=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <h1 className="text-xl font-black text-primary tracking-tight" suppressHydrationWarning>{t('diagnosis')}</h1>
          </div>
          <Badge variant="outline" className="font-black text-[10px] tracking-widest bg-primary/10 text-primary border-primary/20 px-3 uppercase">
            <BrainCircuit className="h-3 w-3 mr-2" />
            {modeloDisponible() ? "Modelo local + Gemini" : "Gemini · requiere conexión"}
          </Badge>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {!diagnosis ? (
              <Card className="glass-card border-none shadow-2xl overflow-hidden">
                <CardHeader className="bg-primary/5 pb-8">
                  <CardTitle className="text-3xl font-black flex items-center gap-3 text-primary" suppressHydrationWarning>
                    <ScanSearch className="h-8 w-8" />
                    {t('visual_analyzer')}
                  </CardTitle>
                  <CardDescription className="font-bold text-muted-foreground" suppressHydrationWarning>
                    {t('analyzer_desc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2" suppressHydrationWarning>
                        <Eye className="h-4 w-4" /> {t('visual_sample')}
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
                            <p className="font-black text-xs text-primary uppercase tracking-widest" suppressHydrationWarning>{t('use_camera')}</p>
                          </button>
                          
                          <div className="border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center p-6 bg-white/40 hover:bg-primary/5 transition-all group relative">
                            <Input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                            <div className="bg-primary/10 p-5 rounded-full mb-3 group-hover:scale-110 transition-transform">
                              <ScanSearch className="h-8 w-8 text-primary" />
                            </div>
                            <p className="font-black text-xs text-primary uppercase tracking-widest" suppressHydrationWarning>{t('upload_image')}</p>
                          </div>
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2" suppressHydrationWarning>
                        <Mic className="h-4 w-4" /> {t('description_voice')}
                      </Label>
                      <Textarea
                        className="min-h-[200px] text-base border-primary/10 rounded-2xl bg-white/50 shadow-inner p-6 focus-visible:ring-primary"
                        placeholder={t('placeholder_symptoms')}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                      <Button 
                        variant={isListening ? "destructive" : "outline"} 
                        className={`w-full gap-2 rounded-xl font-bold transition-all ${isListening ? 'animate-pulse' : ''}`}
                        onClick={toggleListening}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        <span suppressHydrationWarning>{isListening ? t('listening') : t('dictate_symptoms')}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-primary/5 border-t p-8">
                  <Button className="w-full h-16 text-xl font-black rounded-2xl shadow-xl transition-all" disabled={loading} onClick={startDiagnosis}>
                    {loading ? (
                      <div className="flex items-center gap-3" suppressHydrationWarning>
                        <Loader2 className="h-6 w-6 animate-spin" /> {t('analyzing')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-3" suppressHydrationWarning>
                        <Zap className="h-6 w-6 fill-white" /> {t('get_diagnosis')}
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-700">
                <Card className="lg:col-span-1 glass-card border-none shadow-2xl h-fit overflow-hidden">
                   <div className="relative aspect-square bg-muted">
                      {selectedImage ? (
                        <Image src={selectedImage} alt="Preview" fill className="object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-10"><ScanSearch className="h-20 w-20" /></div>
                      )}
                   </div>
                   <CardContent className="p-6 space-y-4">
                     <div className="space-y-3">
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2" suppressHydrationWarning>
                         <Share2 className="h-4 w-4" /> {t('notify_community')}
                       </p>
                       <div className="grid grid-cols-2 gap-2">
                         <Button onClick={shareToWhatsApp} variant="outline" className="gap-2 font-bold text-[10px] rounded-xl border-primary/20">
                           <MessageCircle className="h-4 w-4" /> WHATSAPP
                         </Button>
                         <Button onClick={shareToFacebook} variant="outline" className="gap-2 font-bold text-[10px] rounded-xl border-primary/20">
                           <Facebook className="h-4 w-4" /> FACEBOOK
                         </Button>
                       </div>
                     </div>

                     <Button variant="outline" className="w-full font-black uppercase text-[10px] tracking-widest border-primary/20" onClick={reset} suppressHydrationWarning>
                       <RefreshCcw className="h-4 w-4 mr-2" /> {t('new_query')}
                     </Button>
                   </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                  <Card className="glass-card border-none shadow-2xl overflow-hidden">
                    <CardHeader className="border-b bg-white/50">
                      <div className="flex items-center justify-between mb-2">
                         <Badge variant="destructive" className="font-black px-3">{translateSeverity(diagnosis.diagnosis.severity)}</Badge>
                         <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                            <ShieldCheck className="h-4 w-4" /> Análisis orientativo
                         </div>
                      </div>
                      <CardTitle className="text-3xl font-black text-primary tracking-tighter">
                        {diagnosis.diagnosis.identifiedProblem}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                         <p className="text-[10px] font-black uppercase text-primary mb-2 flex items-center gap-2" suppressHydrationWarning>
                           <Bug className="h-4 w-4" /> {t('biological_cycle')}
                         </p>
                         <p className="text-sm font-medium leading-relaxed italic text-foreground/80">
                           {diagnosis.diagnosis.biologicalCycle}
                         </p>
                      </div>

                      <Tabs defaultValue="control" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/20 rounded-xl">
                          <TabsTrigger value="control" className="font-black text-[10px] uppercase" suppressHydrationWarning>{t('tab_control')}</TabsTrigger>
                          <TabsTrigger value="prev" className="font-black text-[10px] uppercase" suppressHydrationWarning>{t('tab_prevention')}</TabsTrigger>
                          <TabsTrigger value="notes" className="font-black text-[10px] uppercase" suppressHydrationWarning>{t('tab_notes')}</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="control" className="mt-6 space-y-4">
                          <div className="grid gap-4">
                             <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                <h5 className="font-black text-xs text-blue-700 uppercase mb-2" suppressHydrationWarning>{t('ctrl_mechanical')}</h5>
                                <ul className="text-xs space-y-1">
                                  {diagnosis.diagnosis.controlStrategies.mechanical.map((s, i) => <li key={i}>• {s}</li>)}
                                </ul>
                             </div>
                             <div className="p-4 bg-green-50/50 rounded-xl border border-green-100">
                                <h5 className="font-black text-xs text-green-700 uppercase mb-2" suppressHydrationWarning>{t('ctrl_biological')}</h5>
                                <ul className="text-xs space-y-1">
                                  {diagnosis.diagnosis.controlStrategies.biological.map((s, i) => <li key={i}>• {s}</li>)}
                                </ul>
                             </div>
                             <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                                <h5 className="font-black text-xs text-red-700 uppercase mb-2" suppressHydrationWarning>{t('ctrl_chemical')}</h5>
                                <ul className="text-xs space-y-1">
                                  {diagnosis.diagnosis.controlStrategies.chemical.map((s, i) => <li key={i}>• {s}</li>)}
                                </ul>
                             </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="prev" className="mt-6">
                          <div className="p-5 bg-white rounded-2xl border border-primary/10 shadow-sm space-y-3">
                             {diagnosis.diagnosis.preventionTips.map((tip, i) => (
                               <div key={i} className="flex items-start gap-3">
                                 <Sprout className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                 <p className="text-sm font-medium">{tip}</p>
                               </div>
                             ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="notes" className="mt-6">
                           <p className="text-sm font-medium p-4 bg-muted/20 rounded-xl border italic">
                             {diagnosis.diagnosis.expertNotes}
                           </p>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  {/* Segunda opinión especializada (Pl@ntNet) */}
                  {segundaOpinion && segundaOpinion.especies.length > 0 && (
                    <Card className="glass-card border-none mt-4">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                            <Sprout className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
                              Segunda opinión · Pl@ntNet
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              IA botánica especializada, independiente de Gemini
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {segundaOpinion.especies.map((e, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 text-sm">
                              <div className="min-w-0">
                                <span className="font-bold italic text-foreground/85">{e.cientifico}</span>
                                {e.comunes[0] && (
                                  <span className="text-muted-foreground"> — {e.comunes[0]}</span>
                                )}
                              </div>
                              <span className="text-[10px] font-black text-emerald-700 tabular-nums shrink-0">
                                {Math.round(e.confianza * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
