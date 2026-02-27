
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
    community_network: "Red Comunitaria (Local)",
    radar_active: "RADAR ACTIVO",
    hands_free: "Dictar Síntomas",
    get_solution: "OBTENER SOLUCIÓN",
    recent_alerts: "Alertas Recientes",
    report_outbreak: "Reportar Brote Local",
    pest_identifier: "Identificador de Plagas",
    new_query: "Nueva Consulta",
    report_brote: "Reportar Brote",
    risk_prediction: "Predicción de Riesgo",
    recommended_action: "Acción Recomendada",
    analyze_ai: "Analizar con IA"
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
    get_solution: "HYANDI XI’ÑO",
    recent_alerts: "Hyandi xi’ño",
    report_outbreak: "Ma̱ n’u",
    pest_identifier: "Pa̱di n’u",
    new_query: "N’ra hyandi",
    report_brote: "Ma̱ n’u",
    risk_prediction: "Hyandi n’u n’e",
    recommended_action: "Hahni ja’i",
    analyze_ai: "Pa̱di ko IA"
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
