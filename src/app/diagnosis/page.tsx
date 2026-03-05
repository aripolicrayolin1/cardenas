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
  Users 
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { diagnoseCropDisease, type CropDiagnosisOutput } from "@/ai/flows/crop-disease-photo-diagnosis-flow";
import Image from "next/image";
import { Badge } from "@/badge";
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

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, [toast, t]);

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
    } catch (error) {
      toast({ title: "Error", description: "No se pudo realizar el diagnóstico.", variant: "destructive" });
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

  const translateConfidence = (conf: string) => {
    switch(conf) {
      case 'High': return t('conf_high');
      case 'Medium': return t('conf_medium');
      case 'Low': return t('conf_low');
      default: return conf;
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
            <h1 className="text-xl font-bold">{t('digital_diagnosis')}</h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 space-y-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {!diagnosis ? (
              <Card className="border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Camera className="h-6 w-6 text-primary" />
                    {t('pest_identifier')}
                  </CardTitle>
                  <CardDescription>
                    {t('diagnosis_prompt')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {!selectedImage ? (
                    <div className="border-2 border-dashed border-primary/20 rounded-xl aspect-video flex flex-col items-center justify-center p-12 bg-muted/10 group hover:bg-primary/5 transition-all cursor-pointer relative">
                      <Input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageChange} />
                      <div className="bg-primary/10 p-6 rounded-full mb-4">
                        <Camera className="h-12 w-12 text-primary" />
                      </div>
                      <p className="font-bold text-lg text-primary">{t('upload_photo')}</p>
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-black group">
                       <Image src={selectedImage} alt="Preview" fill className="object-contain" />
                       <Button variant="destructive" size="icon" className="absolute top-4 right-4 h-10 w-10 rounded-full" onClick={() => setSelectedImage(null)}>
                         <X className="h-5 w-5" />
                       </Button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="symptoms" className="text-base font-bold">{t('describe_dictate')}</Label>
                      <Button 
                        variant={isListening ? "destructive" : "outline"} 
                        size="sm" 
                        className={`gap-2 rounded-full px-4 ${isListening ? 'animate-pulse' : ''}`}
                        onClick={toggleListening}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        {isListening ? t('listening') : t('dictate_symptoms')}
                      </Button>
                    </div>
                    <Textarea 
                      id="symptoms" 
                      className="min-h-[120px] text-lg border-primary/20 rounded-2xl bg-white/50"
                      placeholder={t('placeholder_symptoms')} 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/5 border-t p-6">
                  <Button className="w-full h-14 text-xl font-black rounded-xl shadow-lg" disabled={loading} onClick={startDiagnosis}>
                    {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Zap className="mr-2 h-6 w-6 fill-white" />}
                    {t('obtaining_solution')}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-1 border-none shadow-lg h-fit">
                   <div className="relative aspect-square bg-muted flex items-center justify-center overflow-hidden rounded-t-lg">
                      {selectedImage ? (
                        <Image src={selectedImage} alt="Preview" fill className="object-cover" />
                      ) : (
                        <FileText className="h-16 w-16 opacity-10" />
                      )}
                      {diagnosis.diagnosis.isFallback && (
                        <Badge className="absolute top-2 left-2 bg-orange-600">{t('fallback_mode')}</Badge>
                      )}
                   </div>
                   <CardContent className="p-4 space-y-3">
                     <Button variant="outline" className="w-full font-bold" onClick={reset}>
                       <RefreshCcw className="h-4 w-4 mr-2" /> {t('new_query')}
                     </Button>
                     <Button className="w-full font-bold bg-destructive hover:bg-destructive/90 text-white">
                        <Users className="h-4 w-4 mr-2" /> {t('report_outbreak_btn')}
                     </Button>
                   </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-none shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="border-b">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase mb-2">
                        <ShieldCheck className="h-4 w-4" /> {t('precision_diagnosis')}
                      </div>
                      <CardTitle className="text-3xl font-black text-primary">
                        {diagnosis.diagnosis.identifiedProblem}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                            <p className="text-[10px] font-bold uppercase text-destructive">{t('severity')}</p>
                            <p className="text-xl font-black">{translateSeverity(diagnosis.diagnosis.severity)}</p>
                         </div>
                         <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <p className="text-[10px] font-bold uppercase text-primary">{t('confidence')}</p>
                            <p className="text-xl font-black">{translateConfidence(diagnosis.diagnosis.confidence)}</p>
                         </div>
                      </div>

                      <Tabs defaultValue="actions">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="actions" className="font-bold">{t('actions')}</TabsTrigger>
                          <TabsTrigger value="commercial" className="font-bold">{t('buy')}</TabsTrigger>
                          <TabsTrigger value="homemade" className="font-bold">{t('bio')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="actions" className="mt-6">
                          <ul className="space-y-3">
                            {diagnosis.diagnosis.recommendedActions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-3 p-4 bg-white rounded-xl border shadow-sm">
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                <span className="font-medium">{action}</span>
                              </li>
                            ))}
                          </ul>
                        </TabsContent>
                        <TabsContent value="commercial" className="mt-6 space-y-4">
                          {diagnosis.diagnosis.commercialProducts.map((product, idx) => (
                            <div key={idx} className="p-5 bg-white rounded-2xl border-2 border-primary/10 shadow-sm">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-black text-xl text-primary">{product.name}</h5>
                                <Badge variant="secondary">Localizado</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button className="flex-1 gap-2 bg-accent text-accent-foreground hover:bg-accent/80" asChild>
                                  <a href={product.locationLink || "#"} target="_blank" rel="noopener noreferrer">
                                    <MapPin className="h-4 w-4" /> {t('near_stores')}
                                  </a>
                                </Button>
                                <Button variant="outline" className="flex-1 gap-2" asChild>
                                  <a href={`https://listado.mercadolibre.com.mx/${product.name.replace(/\s/g, '+')}`} target="_blank" rel="noopener noreferrer">
                                    <ShoppingBag className="h-4 w-4" /> {t('online_quote')}
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ))}
                        </TabsContent>
                        <TabsContent value="homemade" className="mt-6 space-y-4">
                          {diagnosis.diagnosis.homeMadeRemedies.map((remedy, idx) => (
                            <div key={idx} className="p-6 bg-green-50 rounded-2xl border-2 border-green-200">
                              <h5 className="font-black text-xl text-green-800 mb-2">{remedy.name}</h5>
                              <p className="text-xs font-bold text-green-700 uppercase">{t('ingredients')}</p>
                              <p className="text-sm mb-3">{remedy.ingredients.join(", ")}</p>
                              <p className="text-xs font-bold text-green-700 uppercase">{t('instructions')}</p>
                              <p className="text-sm italic">{remedy.instructions}</p>
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
