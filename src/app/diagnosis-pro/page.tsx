
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
  BrainCircuit,
  Eye,
  Microscope,
  Target,
  FlaskConical,
  Beaker,
  ShieldAlert,
  Dna,
  Facebook,
  MessageCircle,
  Share2
} from "lucide-react";
import { useState, useRef } from "react";
import { diagnoseCropDiseasePro, type CropDiagnosisProOutput } from "@/ai/flows/crop-disease-photo-diagnosis-flow";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/use-translation";

export default function DiagnosisProPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<CropDiagnosisProOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error Cámara', description: 'Acceso denegado.' });
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast({ title: "Cámara no lista", description: "Espera a que el video cargue." });
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        setSelectedImage(canvas.toDataURL('image/jpeg', 0.8));
        setShowCamera(false);
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    }
  };

  const startAnalysis = async () => {
    if (!selectedImage && !description.trim()) {
      toast({ title: "Datos Insuficientes", description: "Sube una foto para el análisis Pro.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const result = await diagnoseCropDiseasePro({ photoDataUri: selectedImage || undefined, description });
      setDiagnosis(result);
    } catch (error: any) {
      toast({ title: "Error en Servidor IA", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const shareToFacebook = () => {
    try {
      if (!diagnosis?.diagnosis?.identifiedProblem) {
        toast({ title: 'Error', description: 'No hay datos de diagnóstico para compartir.', variant: 'destructive' });
        console.error("Share Error: Diagnosis data is incomplete.", diagnosis);
        return;
      }
      const textToShare = `AgroTech Hidalgo IA Verdict: Mi cultivo presenta ${diagnosis.diagnosis.identifiedProblem}. IA-Verified severity: ${diagnosis.diagnosis.severity}. #AgroTech #Hidalgo #Bioseguridad`;
      const encodedText = encodeURIComponent(textToShare);
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodedText}`;
      
      console.log("Facebook Share URL:", shareUrl);

      const newWindow = window.open(shareUrl, '_blank');
      if (!newWindow) {
        toast({ title: 'Error', description: 'No se pudo abrir la ventana para compartir. Revisa si tu navegador está bloqueando las ventanas emergentes.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error("Failed to share to Facebook:", error);
      toast({ title: 'Error al compartir en Facebook', description: error.message, variant: 'destructive' });
    }
  };

  const shareToWhatsApp = () => {
    try {
      if (!diagnosis?.diagnosis?.identifiedProblem || !diagnosis?.diagnosis?.severity || !diagnosis?.diagnosis?.expertNotes) {
        toast({ title: 'Error', description: 'Los datos del diagnóstico están incompletos para compartir.', variant: 'destructive' });
        console.error("Share Error: Diagnosis data is incomplete.", diagnosis);
        return;
      }

      const textParts = [
        '🚨 *DIAGNÓSTICO IA AGROTECH* 🚨',
        '',
        `*Problema:* ${diagnosis.diagnosis.identifiedProblem}`,
        `*Severidad:* ${diagnosis.diagnosis.severity}`,
        `*Recomendación:* ${diagnosis.diagnosis.expertNotes}`,
        '',
        '_Validado por AgroTech Hidalgo_'
      ];
      const textToShare = textParts.join('\n');
      const encodedText = encodeURIComponent(textToShare);
      const shareUrl = `https://wa.me/?text=${encodedText}`;
      
      console.log("WhatsApp Share URL:", shareUrl);

      const newWindow = window.open(shareUrl, '_blank');
      if (!newWindow) {
        toast({ title: 'Error', description: 'No se pudo abrir la ventana para compartir. Revisa si tu navegador está bloqueando las ventanas emergentes.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error("Failed to share to WhatsApp:", error);
      toast({ title: 'Error al compartir en WhatsApp', description: error.message, variant: 'destructive' });
    }
  };


  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-slate-950 text-white">
        <header className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="text-white" />
            <h1 className="text-xl font-black tracking-tighter text-primary">ANÁLISIS IA PRO</h1>
          </div>
          <Badge className="bg-primary/20 text-primary border-primary/40 px-4 py-1 animate-pulse">
            LABORATORIO VIRTUAL ACTIVO
          </Badge>
        </header>

        <main className="flex-1 p-6 md:p-12 space-y-8 max-w-7xl mx-auto w-full">
          {!diagnosis ? (
            <div className="grid lg:grid-cols-2 gap-12 items-center">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <h2 className="text-5xl font-black tracking-tighter">Diagnóstico Científico <span className="text-primary italic">Avanzado</span></h2>
                     <p className="text-slate-400 font-medium text-lg leading-relaxed">
                       Nuestro motor Pro utiliza visión multiespectral simulada para detectar patógenos, analizar el ciclo de vida y proponer estrategias de erradicación bioseguras.
                     </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <Dna className="h-6 w-6 text-primary mb-2" />
                        <p className="text-[10px] font-black uppercase text-slate-500">Tecnología</p>
                        <p className="font-bold">Análisis Genómico</p>
                     </div>
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <FlaskConical className="h-6 w-6 text-primary mb-2" />
                        <p className="text-[10px] font-black uppercase text-slate-500">Precisión</p>
                        <p className="font-bold">98.4% IA-Verified</p>
                     </div>
                  </div>

                  <div className="space-y-4 pt-4">
                     <Label className="text-xs font-black uppercase tracking-widest text-primary">Notas del Campo (Opcional)</Label>
                     <Textarea 
                       className="bg-white/5 border-white/10 rounded-2xl h-32 focus:ring-primary text-white" 
                       placeholder="Describe manchas, insectos o comportamiento detectado..."
                       value={description}
                       onChange={(e) => setDescription(e.target.value)}
                     />
                  </div>
               </div>

               <Card className="bg-white/5 border-white/10 overflow-hidden shadow-2xl relative">
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                  <CardHeader className="border-b border-white/10">
                     <CardTitle className="flex items-center gap-2 text-white">
                        <Microscope className="h-5 w-5 text-primary" /> Muestra de Laboratorio
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                     {showCamera ? (
                        <div className="relative aspect-video rounded-3xl overflow-hidden bg-black ring-2 ring-primary">
                           <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                           <div className="absolute inset-0 border border-primary/20 pointer-events-none">
                              <div className="absolute top-0 left-0 w-full h-1 bg-primary/60 animate-scan"></div>
                           </div>
                           <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4">
                              <Button variant="destructive" className="rounded-full px-6" onClick={() => setShowCamera(false)}>Cerrar</Button>
                              <Button size="lg" className="rounded-full h-16 w-16 p-0 bg-white text-primary" onClick={capturePhoto}>
                                 <div className="h-8 w-8 rounded-full bg-primary animate-pulse" />
                              </Button>
                           </div>
                        </div>
                     ) : selectedImage ? (
                        <div className="relative aspect-video rounded-3xl overflow-hidden ring-2 ring-primary group">
                           <Image src={selectedImage} alt="Muestra" fill className="object-cover" />
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="destructive" className="rounded-full" onClick={() => setSelectedImage(null)}>Eliminar</Button>
                           </div>
                        </div>
                     ) : (
                        <div className="aspect-video border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-6 hover:bg-white/5 transition-all group">
                           <div className="flex gap-4">
                              <Button onClick={startCamera} className="h-20 w-20 rounded-2xl bg-primary text-white hover:scale-110 transition-transform">
                                 <Camera className="h-8 w-8" />
                              </Button>
                              <div className="relative">
                                 <Input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if(file){
                                       const reader = new FileReader();
                                       reader.onload = () => setSelectedImage(reader.result as string);
                                       reader.readAsDataURL(file);
                                    }
                                 }} />
                                 <Button variant="outline" className="h-20 w-20 rounded-2xl border-white/20 text-white hover:bg-white/10">
                                    <Target className="h-8 w-8" />
                                 </Button>
                              </div>
                           </div>
                           <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Sincronizar Muestra con Nube</p>
                        </div>
                     )}
                  </CardContent>
                  <CardFooter className="p-8 pt-0">
                     <Button className="w-full h-16 text-lg font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20" disabled={loading} onClick={startAnalysis}>
                        {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Zap className="h-6 w-6 fill-white mr-2" />}
                        {loading ? 'PROCESANDO CON IA PRO...' : 'INICIAR ANÁLISIS CIENTÍFICO'}
                     </Button>
                  </CardFooter>
               </Card>
               <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-700">
               <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10 overflow-hidden">
                     <div className="relative aspect-square">
                        <Image src={selectedImage!} alt="Original" fill className="object-cover" />
                        <div className="absolute top-4 left-4 bg-primary text-white font-black text-[10px] px-3 py-1 rounded-full shadow-2xl">MUESTRA ANALIZADA</div>
                     </div>
                  </Card>
                  
                  {/* Share Section */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                       <Share2 className="h-4 w-4" /> {t('actions')}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={shareToFacebook} variant="outline" className="bg-[#1877F2]/10 border-[#1877F2]/20 hover:bg-[#1877F2] text-white gap-2 font-bold text-[10px] rounded-xl">
                        <Facebook className="h-4 w-4" /> FACEBOOK
                      </Button>
                      <Button onClick={shareToWhatsApp} variant="outline" className="bg-[#25D366]/10 border-[#25D366]/20 hover:bg-[#25D366] text-white gap-2 font-bold text-[10px] rounded-xl">
                        <MessageCircle className="h-4 w-4" /> WHATSAPP
                      </Button>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5" onClick={() => setDiagnosis(null)}>
                     <RefreshCcw className="h-4 w-4 mr-2" /> Nueva Captura
                  </Button>
               </div>

               <div className="lg:col-span-2 space-y-6">
                  <div className="p-8 rounded-3xl bg-primary/10 border border-primary/20 shadow-2xl relative overflow-hidden">
                     <div className="absolute -top-12 -right-12 opacity-10">
                        <Microscope className="h-48 w-48 text-primary" />
                     </div>
                     <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-primary text-white font-black uppercase">IA Pro Verdict</Badge>
                        <Badge variant="outline" className="text-primary border-primary/40">Severidad: {diagnosis.diagnosis.severity}</Badge>
                     </div>
                     <h2 className="text-4xl font-black tracking-tighter mb-4">{diagnosis.diagnosis.identifiedProblem}</h2>
                     <p className="text-slate-300 font-medium leading-relaxed italic border-l-4 border-primary pl-6">
                        "{diagnosis.diagnosis.expertNotes}"
                     </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                           <CardTitle className="text-sm font-black text-primary flex items-center gap-2">
                              <Beaker className="h-4 w-4" /> CICLO BIOLÓGICO
                           </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-slate-400 font-medium leading-relaxed">
                           {diagnosis.diagnosis.biologicalCycle}
                        </CardContent>
                     </Card>
                     <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                           <CardTitle className="text-sm font-black text-primary flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4" /> PREVENCIÓN PRO
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <ul className="space-y-2">
                              {diagnosis.diagnosis.preventionTips.map((tip, i) => (
                                 <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                                    {tip}
                                 </li>
                              ))}
                           </ul>
                        </CardContent>
                     </Card>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                     <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all">
                        <h4 className="font-black text-xs text-slate-300 uppercase mb-3 flex items-center gap-2">
                           <Target className="h-4 w-4 text-blue-400" /> Mecánico
                        </h4>
                        <ul className="text-[11px] space-y-2 text-slate-400">
                           {diagnosis.diagnosis.controlStrategies.mechanical.map((s, i) => <li key={i}>- {s}</li>)}
                        </ul>
                     </div>
                     <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all">
                        <h4 className="font-black text-xs text-slate-300 uppercase mb-3 flex items-center gap-2">
                           <FlaskConical className="h-4 w-4 text-green-400" /> Biológico
                        </h4>
                        <ul className="text-[11px] space-y-2 text-slate-400">
                           {diagnosis.diagnosis.controlStrategies.biological.map((s, i) => <li key={i}>- {s}</li>)}
                        </ul>
                     </div>
                     <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all">
                        <h4 className="font-black text-xs text-slate-300 uppercase mb-3 flex items-center gap-2">
                           <Beaker className="h-4 w-4 text-red-400" /> Químico
                        </h4>
                        <ul className="text-[11px] space-y-2 text-slate-400">
                           {diagnosis.diagnosis.controlStrategies.chemical.map((s, i) => <li key={i}>- {s}</li>)}
                        </ul>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
