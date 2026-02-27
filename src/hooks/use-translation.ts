
'use client';

import { useState, useEffect } from 'react';

export type Language = 'es' | 'hn';

const translations = {
  es: {
    dashboard: "Panel de Control",
    monitoring: "Monitoreo",
    diagnosis: "Diagnóstico IA",
    community: "Comunidad",
    farms: "Fincas",
    settings: "Configuración",
    welcome: "Bienvenido",
    farmer: "Agricultor",
    iot_station: "Estación IoT",
    soil_humidity: "Humedad Suelo",
    air_temp: "Temperatura",
    risk_analysis: "Análisis de Riesgo",
    community_network: "Red Comunitaria",
    radar_active: "RADAR ACTIVO",
    hands_free: "Dictar Síntomas",
    get_solution: "OBTENER SOLUCIÓN"
  },
  hn: {
    dashboard: "Ñut’i Ja’i",
    monitoring: "Hyandi",
    diagnosis: "Pa̱di IA",
    community: "Munthe",
    farms: "B’o̱za",
    settings: "Xo̱fo",
    welcome: "Xi’ño",
    farmer: "’Yomfeni",
    iot_station: "M’u̱i IoT",
    soil_humidity: "De’mthe Hoi",
    air_temp: "Pa",
    risk_analysis: "Hyandi n’u",
    community_network: "M’u̱i Munthe",
    radar_active: "SU’U",
    hands_free: "Ma̱ hñä",
    get_solution: "HYANDI XI’ÑO"
  }
};

export function useTranslation() {
  const [lang, setLang] = useState<Language>('es');

  useEffect(() => {
    const saved = localStorage.getItem('app_lang') as Language;
    if (saved) setLang(saved);
  }, []);

  const toggleLanguage = () => {
    const next = lang === 'es' ? 'hn' : 'es';
    setLang(next);
    localStorage.setItem('app_lang', next);
  };

  const t = (key: keyof typeof translations['es']) => {
    return translations[lang][key] || translations['es'][key];
  };

  return { t, lang, toggleLanguage };
}
