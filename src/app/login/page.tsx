"use client";

import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, AlertCircle, ShieldCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/firebase/provider";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Sólo se aceptan rutas internas. Sin esta comprobación, un enlace del tipo
 * `/login?volverA=https://sitio-malo.example` convertiría la pantalla de acceso
 * en un redirector abierto.
 */
function sanearDestino(valor: string | null): string {
  if (!valor) return '/';
  if (!valor.startsWith('/') || valor.startsWith('//')) return '/';
  return valor;
}

/**
 * `useSearchParams()` obliga a que el árbol que lo usa quede bajo un límite de
 * Suspense: durante el prerender estático Next.js no conoce todavía la query
 * string. Sin esto, `next build` falla al generar /login.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<PantallaCargandoLogin />}>
      <FormularioLogin />
    </Suspense>
  );
}

function PantallaCargandoLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function FormularioLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const auth = useAuth();

  // `RutaPrivada` guarda aquí la página que el usuario intentaba abrir, para
  // devolverlo a ella tras entrar en vez de dejarlo siempre en el panel.
  const destino = sanearDestino(searchParams.get('volverA'));

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
        router.push(destino);
      }
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        return;
      }

      console.error("Google Login Error:", error);
      let message = "Error al conectar con Google.";
      
      if (error.code === 'auth/unauthorized-domain') {
        message = "Dominio no autorizado. Debes añadir el dominio actual en la consola de Firebase (Authentication > Settings > Authorized domains).";
      } else if (error.code === 'auth/popup-blocked') {
        message = "El navegador bloqueó la ventana. Por favor, actívala.";
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
      router.push(destino);
    } catch (error: any) {
      // Antes, un `auth/invalid-credential` creaba la cuenta automáticamente:
      // quien se equivocaba de contraseña acababa con una cuenta nueva y vacía
      // en lugar de un aviso. Ahora registrarse es una acción explícita.
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setError("Correo o contraseña incorrectos. Si aún no tienes cuenta, pulsa \"Crear cuenta\".");
      } else if (error.code === 'auth/user-not-found') {
        setError("No existe una cuenta con ese correo. Pulsa \"Crear cuenta\" para registrarte.");
      } else if (error.code === 'auth/too-many-requests') {
        setError("Demasiados intentos. Espera unos minutos antes de volver a probar.");
      } else {
        setError("No pudimos iniciar sesión. Revisa tu conexión e inténtalo de nuevo.");
        console.error("Login error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Escribe tu correo arriba y vuelve a pulsar para recibir el enlace de recuperación.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Correo enviado",
        description: `Te enviamos un enlace a ${email} para restablecer tu contraseña. Revisa tu bandeja y el spam.`,
      });
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        setError("Ese correo no tiene un formato válido.");
      } else if (error.code === 'auth/user-not-found') {
        // No revelamos si el correo existe o no: es una buena práctica de
        // seguridad. Mostramos el mismo mensaje de éxito.
        toast({
          title: "Correo enviado",
          description: `Si ${email} tiene cuenta, recibirás un enlace para restablecer la contraseña.`,
        });
      } else {
        setError("No pudimos enviar el correo. Revisa tu conexión e inténtalo de nuevo.");
        console.error("Password reset error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || password.length < 6) {
      setError("Escribe tu correo y una contraseña de al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast({ title: "Cuenta creada", description: "Te hemos registrado exitosamente." });
      router.push(destino);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError("Ese correo ya tiene cuenta. Escribe tu contraseña y pulsa \"Acceder\".");
      } else if (error.code === 'auth/weak-password') {
        setError("La contraseña es demasiado corta: usa al menos 6 caracteres.");
      } else {
        setError("No pudimos crear la cuenta. Inténtalo de nuevo.");
        console.error("Register error:", error);
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
            Hidalgo • Tulancingo de Bravo
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" title="password" className="text-xs font-bold uppercase text-muted-foreground">Contraseña</Label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="text-[10px] font-bold text-primary hover:underline disabled:opacity-50"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
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
            <Button
              type="button"
              variant="outline"
              className="w-full font-bold h-11 border-primary/20"
              onClick={handleRegister}
              disabled={loading}
            >
              Crear cuenta
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
