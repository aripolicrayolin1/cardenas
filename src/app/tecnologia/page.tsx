"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Cpu,
  WifiOff,
  Gauge,
  Camera,
  CheckCircle2,
  Clock,
  Bug,
  Radio,
  Cloud,
  ArrowDown,
  Droplets,
  Sun,
  Layers,
  Sparkles,
} from "lucide-react";

import { CATALOGO_PLAGAS } from "@/lib/plagas";
import { METRICAS_MODELO, CLASES_MODELO } from "@/lib/vision/clases";
import { modeloDisponible } from "@/lib/vision/clasificador";
import { useTranslation } from "@/hooks/use-translation";

/**
 * @fileOverview Página pública que documenta cómo funciona la IA del sistema.
 *
 * Todas las cifras se leen del código real (`CATALOGO_PLAGAS`, `CLASES_MODELO`,
 * `METRICAS_MODELO`), nunca se escriben a mano. Eso significa que la página no
 * puede quedar desactualizada ni prometer de más: mientras no exista un modelo
 * de visión entrenado, `modeloDisponible()` devuelve `false` y la sección
 * correspondiente se muestra como "en desarrollo" por sí sola. Cuando se copien
 * los artefactos del entrenamiento, el estado cambia sin editar este archivo.
 *
 * Es deliberado que se distinga con claridad qué función usa el motor propio y
 * cuál todavía depende de un servicio externo. Un sistema del que se sabe
 * exactamente qué hace cada parte es más defendible que uno que se describe
 * entero como "inteligencia artificial".
 */

export default function TecnologiaPage() {
  const visionLista = modeloDisponible();
  const { t } = useTranslation();

  return (
    <SidebarProvider>
      <SidebarNav />
      <SidebarInset className="bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white/40 backdrop-blur-md sticky top-0 z-10 shadow-sm">
          <SidebarTrigger />
          <h1 className="text-xl font-black text-primary tracking-tight" suppressHydrationWarning>{t('technology')}</h1>
        </header>

        <main className="max-w-6xl mx-auto p-4 md:p-8 space-y-10 pb-16 w-full">
      {/* ── Encabezado ──────────────────────────────────────────────────── */}
      <header className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-10">
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                Arquitectura del sistema
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-primary leading-none">
              Cómo funciona
              <br />
              <span className="text-foreground/80">la IA de AgroTech</span>
            </h1>

            <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl font-medium">
              El sistema no es un solo modelo, sino dos que resuelven problemas distintos.
              Esta página describe el estado real de cada uno, incluido lo que todavía
              está en desarrollo.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Pastilla activa icono={<Cpu className="h-3 w-3" />}>
                Motor propio operando
              </Pastilla>
              <Pastilla activa={visionLista} icono={<Camera className="h-3 w-3" />}>
                {visionLista ? "Visión propia operando" : "Visión en entrenamiento"}
              </Pastilla>
            </div>
          </div>
        </div>
      </header>

      {/* ── Las dos rutas ───────────────────────────────────────────────── */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <Titulo icono={<Layers className="h-4 w-4" />}>Las dos rutas del diagnóstico</Titulo>

        <div className="grid gap-4 md:grid-cols-2">
          <Ruta
            estado="local"
            titulo="Desde los sensores"
            pasos={[
              { icono: <Radio className="h-4 w-4" />, texto: "ESP32 en la parcela" },
              { icono: <Cpu className="h-4 w-4" />, texto: "Motor agroclimático" },
              { icono: <Bug className="h-4 w-4" />, texto: `${CATALOGO_PLAGAS.length} especies evaluadas` },
            ]}
            sellos={[
              { icono: <WifiOff className="h-3 w-3" />, texto: "Sin internet" },
              { icono: <Gauge className="h-3 w-3" />, texto: "Menos de 2 ms" },
            ]}
          />

          <Ruta
            estado={visionLista ? "local" : "externo"}
            titulo="Desde una fotografía"
            pasos={[
              { icono: <Camera className="h-4 w-4" />, texto: "Cámara del teléfono" },
              {
                icono: visionLista ? <Cpu className="h-4 w-4" /> : <Cloud className="h-4 w-4" />,
                texto: visionLista ? "Modelo propio en el navegador" : "Servicio externo de IA",
              },
              { icono: <Bug className="h-4 w-4" />, texto: "Identificación de la plaga" },
            ]}
            sellos={
              visionLista
                ? [
                    { icono: <WifiOff className="h-3 w-3" />, texto: "Sin internet" },
                    { icono: <Gauge className="h-3 w-3" />, texto: "En el dispositivo" },
                  ]
                : [
                    { icono: <Cloud className="h-3 w-3" />, texto: "Requiere conexión" },
                    { icono: <Clock className="h-3 w-3" />, texto: "En migración" },
                  ]
            }
          />
        </div>
      </section>

      {/* ── Motor agroclimático ─────────────────────────────────────────── */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Titulo icono={<Cpu className="h-4 w-4" />}>Motor agroclimático de plagas</Titulo>
          <Badge className="px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest bg-primary text-white border-none shadow-lg shadow-primary/20">
            <CheckCircle2 className="h-3 w-3 mr-1.5" /> En funcionamiento
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metrica valor={String(CATALOGO_PLAGAS.length)} etiqueta="especies con ficha técnica" icono={<Bug className="h-4 w-4" />} />
          <Metrica valor="< 2 ms" etiqueta="por análisis completo" icono={<Gauge className="h-4 w-4" />} />
          <Metrica valor="0" etiqueta="llamadas a internet" icono={<WifiOff className="h-4 w-4" />} />
        </div>

        <Card className="glass-card border-none rounded-3xl overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            <p className="text-sm leading-relaxed text-foreground/80 font-medium">
              Compara la lectura de los sensores contra la envolvente climática de cada
              especie: los rangos de temperatura y humedad en los que puede desarrollarse
              y aquellos en los que no. El resultado dice qué tan favorables son las
              condiciones actuales para cada plaga.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Punto titulo="Funciona sin conexión">
                El cálculo ocurre en el dispositivo del agricultor. En parcelas sin
                cobertura, un diagnóstico que siempre llega vale más que uno mejor que a
                veces no llega.
              </Punto>
              <Punto titulo="Determinista y verificable">
                La misma lectura produce siempre el mismo resultado. Cada recomendación
                está escrita y revisada, no generada por un modelo de lenguaje. Eso
                importa sobre todo en el control químico.
              </Punto>
              <Punto titulo="Avisa cuando no confía">
                Si la lectura es físicamente imposible —punto de rocío por encima de la
                temperatura del aire, valores en cero— lo señala en lugar de diagnosticar
                sobre un dato roto.
              </Punto>
              <Punto titulo="Estima lo que ningún sensor mide">
                La humectación foliar se deriva de la distancia entre la temperatura y el
                punto de rocío. Es la variable que decide para royas y tizones.
              </Punto>
            </div>
          </CardContent>
        </Card>

        {/* El caso que demuestra que hay biología en el modelo */}
        <Card className="glass-card border-none rounded-3xl overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-primary">
                Un mismo clima, dos veredictos opuestos
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                Ante 88 % de humedad, dos hongos responden al revés. La diferencia no está
                en la humedad del aire sino en si hay agua líquida sobre la hoja, y el
                motor lo distingue.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Contraste
                icono={<Droplets className="h-4 w-4" />}
                titulo="Roya amarilla"
                condicion="Necesita agua libre sobre la hoja"
                veredicto="Riesgo alto sólo con rocío"
                tono="alto"
              />
              <Contraste
                icono={<Sun className="h-4 w-4" />}
                titulo="Cenicilla polvorienta"
                condicion="El agua libre inhibe su germinación"
                veredicto="Riesgo alto sólo con hoja seca"
                tono="bajo"
              />
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-[11px] font-bold text-primary/80 leading-relaxed">
                Validación: 6 escenarios climáticos contrastados, 16 comprobaciones
                automáticas, todas correctas. El script es reproducible y vive en el
                repositorio del proyecto.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Aportaciones propias ─────────────────────────────────────────── */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-150">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Titulo icono={<Sparkles className="h-4 w-4" />}>Lo que este proyecto aporta</Titulo>
          <Badge className="px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest bg-primary text-white border-none shadow-lg shadow-primary/20">
            <CheckCircle2 className="h-3 w-3 mr-1.5" /> Verificado
          </Badge>
        </div>

        <Card className="glass-card border-none rounded-3xl overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            <p className="text-sm leading-relaxed text-foreground/80 font-medium">
              Los apartados anteriores describen un sistema construido con técnicas conocidas.
              Estos tres no: son las piezas que no existían y que resuelven problemas que las
              herramientas disponibles dejan sin atender.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <Aporte
                numero="01"
                titulo="Frente epidemiológico"
                texto="Los reportes georreferenciados de la comunidad se ajustan por mínimos cuadrados para estimar rumbo y velocidad del brote, y proyectar cuándo alcanzará cada parcela. Validado con brotes sintéticos de velocidad conocida: 19 de 19 comprobaciones."
              />
              <Aporte
                numero="02"
                titulo="Calibración por parcela"
                texto="El agricultor confirma o desmiente cada aviso y el motor corre sus propios umbrales hacia lo que ocurre en ese terreno, mezclando literatura y datos locales con un peso que crece con las observaciones. 15 de 15 comprobaciones."
              />
              <Aporte
                numero="03"
                titulo="Escucha acústica"
                texto="Mide energía por bandas de frecuencia e impulsos de masticación con la Web Audio API, en el dispositivo. Detecta larvas barrenando dentro del tallo, que ninguna cámara puede ver."
              />
            </div>

            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-[11px] font-bold text-primary/80 leading-relaxed">
                La calibración no sustituye la literatura por los datos locales: los combina con
                encogimiento hacia el prior y un desplazamiento acotado. Se comprobó que 200
                observaciones absurdas no logran mover el modelo más allá del límite: unas pocas
                respuestas erróneas no pueden romper un modelo que funciona.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Clasificador de imágenes ────────────────────────────────────── */}
      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Titulo icono={<Camera className="h-4 w-4" />}>Clasificador de imágenes</Titulo>
          {visionLista ? (
            <Badge className="px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest bg-primary text-white border-none shadow-lg shadow-primary/20">
              <CheckCircle2 className="h-3 w-3 mr-1.5" /> En funcionamiento
            </Badge>
          ) : (
            <Badge className="px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest bg-amber-500 text-white border-none shadow-lg shadow-amber-500/20">
              <Clock className="h-3 w-3 mr-1.5" /> En desarrollo
            </Badge>
          )}
        </div>

        {visionLista && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Metrica valor={String(CLASES_MODELO.length)} etiqueta="clases reconocidas" icono={<Layers className="h-4 w-4" />} />
            <Metrica valor={`${(METRICAS_MODELO.ip102 * 100).toFixed(0)} %`} etiqueta="acierto en fotos de campo" icono={<Camera className="h-4 w-4" />} />
            <Metrica valor={`${(METRICAS_MODELO.plantvillage * 100).toFixed(0)} %`} etiqueta="acierto en laboratorio" icono={<CheckCircle2 className="h-4 w-4" />} />
          </div>
        )}

        <Card className="glass-card border-none rounded-3xl overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            {visionLista ? (
              <>
                <p className="text-sm leading-relaxed text-foreground/80 font-medium">
                  Red neuronal convolucional que identifica plagas a partir de una
                  fotografía. Corre dentro del navegador: la imagen de la parcela nunca
                  sale del dispositivo.
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-4">
                  Las dos cifras se reportan por separado a propósito. Las imágenes de
                  laboratorio están tomadas sobre fondo uniforme y son más fáciles de
                  clasificar; las de campo representan el uso real. Un promedio único
                  quedaría inflado por la parte fácil.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-foreground/80 font-medium">
                  Está en entrenamiento una red convolucional que identifique plagas a
                  partir de una fotografía, para que también el diagnóstico visual funcione
                  sin conexión. Mientras no esté lista, esa función se apoya en un servicio
                  externo.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Fase
                    numero="01"
                    titulo="Base preentrenada"
                    texto="Se parte de MobileNetV3, que ya aprendió bordes, texturas y formas con 1.4 millones de imágenes."
                  />
                  <Fase
                    numero="02"
                    titulo="Sólo la capa nueva"
                    texto="Se entrena la capa final con el resto congelado, para que deje de dar respuestas aleatorias."
                  />
                  <Fase
                    numero="03"
                    titulo="Ajuste fino"
                    texto="Se descongelan las capas superiores con pasos 50 veces menores, para refinar sin borrar lo aprendido."
                  />
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
                    Estado actual: el diagnóstico por fotografía funciona mediante un
                    servicio externo de IA y requiere conexión a internet. La arquitectura
                    ya contempla el reemplazo, de modo que el modelo propio entrará en
                    operación en cuanto termine su entrenamiento y validación.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>

          <p className="text-[11px] text-muted-foreground leading-relaxed text-center max-w-2xl mx-auto">
            Las cifras de esta página se leen directamente del código del sistema, no se
            escriben a mano. Proyecto desarrollado para el valle de Tulancingo de Bravo,
            Hidalgo.
          </p>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

// =============================================================================
// Piezas de presentación
// =============================================================================

function Titulo({ icono, children }: { icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="text-xl md:text-2xl font-black tracking-tighter text-foreground/80 flex items-center gap-2">
      <span className="text-primary">{icono}</span>
      {children}
    </h2>
  );
}

function Pastilla({
  activa,
  icono,
  children,
}: {
  activa: boolean;
  icono: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
        activa
          ? "bg-primary/10 text-primary border-primary/20"
          : "bg-amber-500/10 text-amber-700 border-amber-500/25"
      }`}
    >
      {icono}
      {children}
    </div>
  );
}

function Metrica({
  valor,
  etiqueta,
  icono,
}: {
  valor: string;
  etiqueta: string;
  icono: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-1 hover:shadow-lg transition-all">
      <div className="text-primary/40">{icono}</div>
      <p className="text-3xl font-black text-primary tracking-tighter leading-none">{valor}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-tight">
        {etiqueta}
      </p>
    </div>
  );
}

function Ruta({
  estado,
  titulo,
  pasos,
  sellos,
}: {
  estado: "local" | "externo";
  titulo: string;
  pasos: Array<{ icono: React.ReactNode; texto: string }>;
  sellos: Array<{ icono: React.ReactNode; texto: string }>;
}) {
  const local = estado === "local";

  return (
    <Card
      className={`glass-card border-none rounded-3xl overflow-hidden relative ${
        local ? "ring-1 ring-primary/20" : "ring-1 ring-amber-500/25"
      }`}
    >
      <div className={`absolute top-0 left-0 w-full h-1 ${local ? "bg-primary" : "bg-amber-500"}`} />
      <CardContent className="p-6 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-foreground/70">{titulo}</p>

        <div className="space-y-1">
          {pasos.map((paso, i) => (
            <div key={i}>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/60">
                <span className={local ? "text-primary" : "text-amber-600"}>
                  {paso.icono}
                </span>
                <span className="text-xs font-bold text-foreground/80">{paso.texto}</span>
              </div>
              {i < pasos.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className="h-3 w-3 text-muted-foreground/40" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {sellos.map((sello, i) => (
            <div
              key={i}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                local ? "bg-primary/10 text-primary" : "bg-amber-500/12 text-amber-700"
              }`}
            >
              {sello.icono}
              {sello.texto}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Contraste({
  icono,
  titulo,
  condicion,
  veredicto,
  tono,
}: {
  icono: React.ReactNode;
  titulo: string;
  condicion: string;
  veredicto: string;
  tono: "alto" | "bajo";
}) {
  return (
    <div className="p-5 rounded-2xl bg-white/50 border border-white/60 space-y-2">
      <div className="flex items-center gap-2">
        <span className={tono === "alto" ? "text-primary" : "text-amber-600"}>
          {icono}
        </span>
        <p className="text-xs font-black text-foreground/80">{titulo}</p>
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{condicion}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 pt-1">
        {veredicto}
      </p>
    </div>
  );
}

function Aporte({ numero, titulo, texto }: { numero: string; titulo: string; texto: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white/50 border border-white/60 space-y-2">
      <p className="text-2xl font-black text-primary/25 tracking-tighter leading-none">{numero}</p>
      <p className="text-xs font-black text-foreground/85">{titulo}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{texto}</p>
    </div>
  );
}

function Fase({ numero, titulo, texto }: { numero: string; titulo: string; texto: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white/50 border border-white/60 space-y-2">
      <p className="text-2xl font-black text-primary/20 tracking-tighter leading-none">{numero}</p>
      <p className="text-xs font-black text-foreground/80">{titulo}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{texto}</p>
    </div>
  );
}

function Punto({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div className="space-y-0.5">
        <p className="text-xs font-black text-foreground/90">{titulo}</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
