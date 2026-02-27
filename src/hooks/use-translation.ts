
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
    humidity_air: "Hum. Aire",
    air_temp: "Temperatura",
    dew_point: "Punto Rocío",
    evapotranspiration: "Evapotransp. (ET)",
    risk_analysis: "Análisis de Riesgo",
    community_network: "Red Comunitaria",
    radar_active: "RADAR ACTIVO",
    hands_free: "Dictar Síntomas",
    get_solution: "OBTENER SOLUCIÓN",
    recent_alerts: "Alertas Recientes",
    report_outbreak: "Reportar Brote",
    risk_prediction: "Predicción de Riesgo",
    recommended_action: "Acción Recomendada",
    analyze_ai: "Analizar con IA",
    online: "En Línea",
    offline: "Desconectado",
    status: "Estado",
    sync: "Sincronizado",
    health_history: "Historial de Salud",
    sensor_data: "Dato del Sensor",
    change_lang: "Cambiar a Hñähñu",
    logout: "Salir",
    live: "Vivo",
    today: "Hoy",
    week: "Semana",
    download_report: "Descargar Reporte",
    sensor_analytics: "Analítica de Sensores",
    crop_history: "Historial de Cultivo",
    measured_params: "Monitoreo de 5 parámetros en tiempo real.",
    no_anomalies: "No se han registrado anomalías."
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
    humidity_air: "De’mthe Ndähi",
    air_temp: "Pa",
    dew_point: "N’yu Dehe",
    evapotranspiration: "Hño Dehe",
    risk_analysis: "Hyandi n’u",
    community_network: "M’u̱i Munthe",
    radar_active: "SU’U",
    hands_free: "Ma̱ hñä",
    get_solution: "HYANDI XI’ÑO",
    recent_alerts: "Hyandi xi’ño",
    report_outbreak: "Ma̱ n’u",
    risk_prediction: "Hyandi n’u n’e",
    recommended_action: "Hahni ja’i",
    analyze_ai: "Pa̱di ko IA",
    online: "Ja nthe",
    offline: "Hotho",
    status: "M’u̱i",
    sync: "Hyandi",
    health_history: "M’u̱i b’o̱za",
    sensor_data: "Dato IoT",
    change_lang: "Mpengi ja Español",
    logout: "Poni",
    live: "Ja nthe",
    today: "Na’ya",
    week: "N’onda",
    download_report: "Xo̱fo Reporte",
    sensor_analytics: "Analítica IoT",
    crop_history: "M’u̱i b’o̱za",
    measured_params: "Hyandi 5 parámetros ja nthe.",
    no_anomalies: "Hotho n’u ja ya."
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
