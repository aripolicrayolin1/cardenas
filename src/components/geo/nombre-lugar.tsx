"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { nombreDeLugar } from "@/services/geo";
import { esCoordenadaValida } from "@/services/fincas";

/**
 * @fileOverview Muestra el nombre de lugar de unas coordenadas (Nominatim).
 *
 * Mientras resuelve —o si no hay red— muestra el texto de respaldo (la ubicación
 * que el agricultor escribió). Así la tarjeta siempre dice algo útil, con o sin
 * conexión.
 */

interface NombreLugarProps {
  lat?: number;
  lng?: number;
  /** Texto a mostrar mientras carga o si Nominatim no resuelve. */
  respaldo: string;
  className?: string;
}

export function NombreLugar({ lat, lng, respaldo, className }: NombreLugarProps) {
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    if (!esCoordenadaValida(lat, lng)) return;

    nombreDeLugar(lat as number, lng as number).then((n) => {
      if (vivo && n) setNombre(n);
    });

    return () => {
      vivo = false;
    };
  }, [lat, lng]);

  return (
    <span className={className}>
      <MapPin className="h-3 w-3 text-primary inline shrink-0" /> {nombre || respaldo}
    </span>
  );
}
