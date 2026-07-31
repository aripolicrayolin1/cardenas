"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

export type { MarcadorMapa, TipoMarcador, TrazoBrote } from "./mapa-satelital";

/**
 * @fileOverview Punto de entrada del mapa. Importa SIEMPRE desde aquí.
 *
 * Leaflet toca el DOM y lee `window` en tiempo de módulo, así que revienta
 * durante el render del servidor de Next.js. `dynamic(..., { ssr: false })`
 * difiere la carga hasta que el componente está en el navegador.
 *
 * Ese aplazamiento tiene un efecto colateral bienvenido: los ~150 KB de Leaflet
 * sólo se descargan en las pantallas que muestran mapa, no en toda la
 * aplicación. En una conexión rural eso importa.
 */

export const MapaSatelital = dynamic(() => import("./mapa-satelital"), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-[2rem] bg-deep flex items-center justify-center" style={{ height: "420px" }}>
      <div className="flex flex-col items-center gap-3 text-deep-foreground/50">
        <MapPin className="h-6 w-6 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest">
          Cargando vista satelital
        </span>
      </div>
    </div>
  ),
});
