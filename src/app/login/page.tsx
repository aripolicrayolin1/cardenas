"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Mail, AlertCircle, ShieldCheck } from "lucide-react";
import { auth } from "@/firebase/config";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        toast({ 
          title: "Acceso Exitoso", 
          description: `Bienvenido, ${result.user.displayName}` 
        });
        router.push("/");
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      let message = "Error al conectar con Google.";
      
      if (error.code === 'auth/popup-blocked') {
        message = "El navegador bloqueó la ventana. Por favor, actívala.";
      } else if (error.code === 'auth/unauthorized-domain') {
        message = "Dominio no autorizado. Asegúrate de añadir el dominio actual en la consola de Firebase > Authentication > Ajustes.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        message = "Cerraste la ventana antes de terminar el acceso.";
      }
      
      setError(message);
      toast({ 
        title: "Error de Acceso", 
        description: message, 
        variant: "destructive" 
      });
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Bienvenido", description: "Has iniciado sesión correctamente." });
      router.push("/");
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          toast({ title: "Cuenta creada", description: "Te hemos registrado exitosamente." });
          router.push("/");
        } catch (regError: any) {
          setError("Error al crear cuenta: " + regError.message);
        }
      } else {
        setError("Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <Image 
          src="/fotos campo/CAMPO DE AGRICULTOR.png" 
          alt="Background" 
          fill 
          className="object-cover"
        />
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none relative z-10 overflow-hidden">
        <div className="bg-primary h-2 w-full" />
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full ring-8 ring-primary/5">
              <Leaf className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black tracking-tighter text-primary">AgroTech</CardTitle>
          <CardDescription className="text-sm font-medium uppercase tracking-widest">
            Hidalgo • Región Valle del Mezquital
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atención</AlertTitle>
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            variant="outline" 
            className="w-full h-12 gap-3 border-primary/20 hover:bg-primary/5 text-base font-bold transition-all hover:scale-[1.02]" 
            onClick={handleGoogleLogin}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar con Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-background px-3 text-muted-foreground font-bold tracking-widest">O accede por correo</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="usuario@ejemplo.com" 
                className="h-11 border-primary/10" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-xs font-bold uppercase text-muted-foreground">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                className="h-11 border-primary/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full font-bold h-11 shadow-lg shadow-primary/20" type="submit" disabled={loading}>
              {loading ? "Verificando..." : "Acceder al Sistema"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-center pb-6 space-y-2">
          <div className="flex items-center gap-1 text-[9px] text-primary font-bold uppercase tracking-tighter">
            <ShieldCheck className="h-3 w-3" />
            Conexión Segura con Firebase Hidalgo
          </div>
          <p className="text-[9px] text-muted-foreground max-w-[200px] leading-tight">
            Al acceder, autorizas el uso de sensores y diagnósticos IA para tu finca.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
