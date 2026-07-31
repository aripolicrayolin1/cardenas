"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * @fileOverview Mapa satelital de parcelas sobre teselas de Esri.
 *
 * ── Por qué Esri y no Google ────────────────────────────────────────────────
 * El servicio World Imagery de Esri publica sus teselas sin llave de API y sin
 * costo, pidiendo únicamente atribución. Google Maps exige clave, tarjeta de
 * crédito y factura por encima de cierto uso. Para un proyecto que debe poder
 * seguir funcionando sin presupuesto, esa diferencia es determinante.
 *
 * ── Este componente NO se renderiza en el servidor ──────────────────────────
 * Leaflet manipula el DOM directamente y accede a `window` en tiempo de módulo,
 * de modo que revienta en el render del servidor de Next.js. Se importa siempre
 * a través de `components/mapa/index.tsx`, que lo carga con `ssr: false`.
 * Importarlo directo desde una página rompe la compilación.
 *
 * ── Degradación sin conexión ────────────────────────────────────────────────
 * Las teselas viajan por red: sin señal no hay imagen. El diagnóstico del
 * sistema sí funciona sin conexión, así que el mapa nunca debe dar la impresión
 * de que la aplicación se rompió. Cuando las teselas fallan se muestra un fondo
 * verde con un aviso y los marcadores siguen situados: se pierde la fotografía,
 * no la información.
 */

const TULANCINGO: [number, number] = [20.0833, -98.3667];

const ESRI_SATELITE =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

/** Capa de nombres de lugares y carreteras: sin ella el satélite es ilegible. */
const ESRI_ETIQUETAS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const ATRIBUCION =
  'Teselas &copy; <a href="https://www.esri.com/">Esri</a> — Source: Esri, Maxar, Earthstar Geographics';

export type TipoMarcador = "finca" | "alerta" | "usuario";

export interface MarcadorMapa {
  id: string;
  lat: number;
  lng: number;
  titulo: string;
  subtitulo?: string;
  tipo: TipoMarcador;
  /** Sólo alertas: tiñe el marcador. */
  severidad?: "alta" | "media" | "baja";
}

interface MapaSatelitalProps {
  marcadores?: MarcadorMapa[];
  centro?: [number, number];
  zoom?: number;
  /** Altura CSS del contenedor. */
  altura?: string;
  /** Desactiva zoom y arrastre: útil cuando el mapa es sólo fondo. */
  estatico?: boolean;
  /** Dibuja el frente de avance de un brote sobre el mapa. */
  brote?: TrazoBrote | null;
}

/**
 * Trazo del avance de un brote: por dónde pasó, dónde está y hacia dónde va.
 * Lo calcula `lib/epidemiologia`; aquí sólo se dibuja.
 */
export interface TrazoBrote {
  /** Reportes en orden cronológico. */
  recorrido: Array<{ lat: number; lng: number }>;
  /** Posición estimada del frente hoy. */
  frenteActual: { lat: number; lng: number };
  /** Rumbo de avance en grados (0 = norte). */
  rumboGrados: number;
  /** Rapidez en km/día, para proyectar hacia dónde llegará. */
  velocidadKmDia: number;
}

/** Desplaza una coordenada `km` en la dirección `rumboGrados`. */
function proyectar(
  origen: { lat: number; lng: number },
  rumboGrados: number,
  km: number
): [number, number] {
  const rad = (rumboGrados * Math.PI) / 180;
  const kmPorGradoLat = 111.32;
  const kmPorGradoLng = kmPorGradoLat * Math.cos((origen.lat * Math.PI) / 180);

  return [
    origen.lat + (km * Math.cos(rad)) / kmPorGradoLat,
    origen.lng + (km * Math.sin(rad)) / kmPorGradoLng,
  ];
}

// =============================================================================
// Marcadores
// =============================================================================

const COLOR_MARCADOR: Record<string, string> = {
  finca: "#16a34a",
  usuario: "#84cc16",
  "alerta-alta": "#dc2626",
  "alerta-media": "#f59e0b",
  "alerta-baja": "#64748b",
};

/**
 * Marcadores dibujados con `divIcon` en lugar de las imágenes por defecto.
 *
 * Los PNG que trae Leaflet se resuelven con rutas relativas al CSS y quedan
 * rotos en cualquier empaquetador moderno, incluido el de Next.js: es el
 * clásico marcador que aparece como imagen ausente. Generar el marcador como
 * HTML evita el problema por completo y además permite darle el aspecto del
 * resto de la interfaz.
 */
function crearIcono(marcador: MarcadorMapa): L.DivIcon {
  const clave =
    marcador.tipo === "alerta" ? `alerta-${marcador.severidad ?? "baja"}` : marcador.tipo;
  const color = COLOR_MARCADOR[clave] ?? COLOR_MARCADOR.finca;
  const pulso = marcador.tipo === "alerta" && marcador.severidad === "alta";

  return L.divIcon({
    className: "agrotech-marcador",
    html: `
      <span style="position:relative;display:flex;align-items:center;justify-content:center;width:22px;height:22px;">
        ${
          pulso
            ? `<span style="position:absolute;width:100%;height:100%;border-radius:9999px;background:${color};opacity:0.35;animation:agrotech-latido 2s ease-out infinite;"></span>`
            : ""
        }
        <span style="position:relative;width:14px;height:14px;border-radius:9999px;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.45);"></span>
      </span>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12],
  });
}

// =============================================================================
// Ajuste de encuadre
// =============================================================================

/**
 * Encuadra el mapa para que todos los marcadores queden visibles.
 * Con un solo marcador `fitBounds` haría un acercamiento absurdo, así que en
 * ese caso se centra con un zoom fijo.
 */
function AjustarEncuadre({ marcadores }: { marcadores: MarcadorMapa[] }) {
  const mapa = useMap();

  useEffect(() => {
    if (marcadores.length === 0) return;

    if (marcadores.length === 1) {
      mapa.setView([marcadores[0].lat, marcadores[0].lng], 15);
      return;
    }

    mapa.fitBounds(
      L.latLngBounds(marcadores.map((m) => [m.lat, m.lng] as [number, number])),
      { padding: [50, 50], maxZoom: 16 }
    );
  }, [mapa, marcadores]);

  return null;
}

// =============================================================================
// Mapa
// =============================================================================

export default function MapaSatelital({
  marcadores = [],
  centro = TULANCINGO,
  zoom = 13,
  altura = "420px",
  estatico = false,
  brote = null,
}: MapaSatelitalProps) {
  // Se considera que no hay imagen sólo tras varios fallos: una tesela suelta
  // que no carga es normal y no debe disparar el aviso.
  const [fallosTesela, setFallosTesela] = useState(0);
  const sinImagen = fallosTesela >= 4;

  const marcadoresValidos = useMemo(
    () =>
      marcadores.filter(
        (m) =>
          Number.isFinite(m.lat) &&
          Number.isFinite(m.lng) &&
          Math.abs(m.lat) <= 90 &&
          Math.abs(m.lng) <= 180
      ),
    [marcadores]
  );

  return (
    <div className="relative w-full overflow-hidden rounded-[2rem]" style={{ height: altura }}>
      {/* Fondo verde: es lo que queda a la vista si las teselas no llegan. */}
      <div className="absolute inset-0 bg-deep" />

      <MapContainer
        center={centro}
        zoom={zoom}
        scrollWheelZoom={!estatico}
        dragging={!estatico}
        zoomControl={!estatico}
        doubleClickZoom={!estatico}
        touchZoom={!estatico}
        attributionControl
        style={{ height: "100%", width: "100%", background: "transparent" }}
      >
        <TileLayer
          url={ESRI_SATELITE}
          attribution={ATRIBUCION}
          maxZoom={19}
          eventHandlers={{ tileerror: () => setFallosTesela((n) => n + 1) }}
        />
        <TileLayer url={ESRI_ETIQUETAS} maxZoom={19} />

        {/* Frente del brote: por dónde pasó, dónde está y a dónde va */}
        {brote && brote.recorrido.length >= 2 && (
          <>
            {/* Recorrido histórico: la traza que dejaron los reportes */}
            <Polyline
              positions={brote.recorrido.map((p) => [p.lat, p.lng] as [number, number])}
              pathOptions={{ color: "#f97316", weight: 2.5, opacity: 0.75, dashArray: "6 6" }}
            />

            {/* Vector de avance: del frente actual a donde estará en 7 días */}
            <Polyline
              positions={[
                [brote.frenteActual.lat, brote.frenteActual.lng],
                proyectar(brote.frenteActual, brote.rumboGrados, brote.velocidadKmDia * 7),
              ]}
              pathOptions={{ color: "#dc2626", weight: 3, opacity: 0.9 }}
            />

            {/* Anillos de tiempo: hasta dónde llega en 3 y 7 días.
                Se dibujan como círculos porque el frente no avanza sólo en la
                dirección media: el radio comunica la incertidumbre lateral. */}
            {[
              { dias: 3, color: "#f97316" },
              { dias: 7, color: "#dc2626" },
            ].map(({ dias, color }) => (
              <Circle
                key={dias}
                center={[brote.frenteActual.lat, brote.frenteActual.lng]}
                radius={brote.velocidadKmDia * dias * 1000}
                pathOptions={{ color, weight: 1.5, opacity: 0.5, fillOpacity: 0.05, dashArray: "4 8" }}
              />
            ))}

            {/* Posición actual del frente */}
            <Circle
              center={[brote.frenteActual.lat, brote.frenteActual.lng]}
              radius={300}
              pathOptions={{ color: "#dc2626", weight: 2, fillColor: "#dc2626", fillOpacity: 0.55 }}
            />
          </>
        )}

        {marcadoresValidos.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={crearIcono(m)}>
            <Popup>
              <span className="block text-xs font-black tracking-tight">{m.titulo}</span>
              {m.subtitulo && (
                <span className="block text-[11px] text-slate-600 mt-0.5">{m.subtitulo}</span>
              )}
            </Popup>
          </Marker>
        ))}

        <AjustarEncuadre marcadores={marcadoresValidos} />
      </MapContainer>

      {sinImagen && (
        <div className="absolute bottom-4 left-4 z-[500] pointer-events-none">
          <div className="pill bg-deep/85 backdrop-blur-md text-deep-foreground/80 border border-white/10">
            Sin imagen satelital · el diagnóstico sigue funcionando
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes agrotech-latido {
          0% { transform: scale(0.8); opacity: 0.45; }
          70% { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .agrotech-marcador { background: transparent; border: none; }
        .leaflet-container { font-family: inherit; }
        .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.75) !important;
          font-size: 9px !important;
          border-radius: 6px 0 0 0;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        }
        .leaflet-popup-content { margin: 10px 14px; }
        .leaflet-control-zoom a {
          border-radius: 10px !important;
          border: none !important;
          color: hsl(158 52% 11%) !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .agrotech-marcador span { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
