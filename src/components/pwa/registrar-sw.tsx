"use client";

import { useEffect } from "react";

/**
 * @fileOverview Registra el service worker que permite abrir la app sin conexión.
 *
 * Se registra tras la carga para no competir con el primer pintado. Solo en
 * producción: en desarrollo, un service worker cachearía los bundles y
 * estorbaría el hot-reload.
 */
export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const registrar = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((e) => console.warn("[pwa] no se pudo registrar el service worker:", e));
    };

    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
  }, []);

  return null;
}
