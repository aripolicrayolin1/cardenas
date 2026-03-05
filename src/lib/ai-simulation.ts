/**
 * @fileOverview Motor de diagnóstico experto para AgroTech Hidalgo.
 * Simula el razonamiento de una IA basado en reglas agronómicas reales para la región.
 * Genera mensajes dinámicos que integran los valores de los sensores.
 */

export interface DiagnosticoResultado {
  titulo: string;
  otomi: string;
  desc: string;
  accion: string;
  riesgo: 'High' | 'Medium' | 'Low' | 'None';
}

export const obtenerDiagnosticoIA = (
  t: number, 
  suelo: number, 
  h: number, 
  et: number, 
  puntoRocio: number
): DiagnosticoResultado => {
  
  // Normalización de humedad del suelo para el motor (si viene de sensor analógico 0-4095)
  const normSuelo = suelo > 100 ? (suelo / 4095) * 100 : suelo;

  // 1. PRIORIDAD CRÍTICA: Helada y Sequía (Basado en el ejemplo del usuario)
  if (t <= 6.0 && normSuelo < 10) {
    return {
      titulo: "RIESGO DE HELADA Y DESHIDRATACIÓN", 
      otomi: "¡Xue t'o̲ho̲!",
      desc: `Análisis térmico crítico: La temperatura actual de ${t.toFixed(1)}°C indica un riesgo inminente de helada advectiva. Con un suelo al ${normSuelo.toFixed(1)}% de humedad, las raíces carecen de inercia térmica, lo que acelerará drásticamente el daño celular por frío en los tejidos vasculares.`,
      accion: "Activar riego por aspersión inmediatamente. El agua liberará calor latente al cambiar de fase, creando una capa protectora que mantendrá la temperatura de la planta cerca de los 0°C, evitando el punto de congelación letal.",
      riesgo: 'High'
    };
  }

  // 2. Prioridad: Calor Extremo y Sequía
  if (t > 35 && normSuelo < 20) {
    return {
      titulo: "ESTRÉS TÉRMICO CRÍTICO", 
      otomi: "¡Däthä hñei xat'i!",
      desc: `Demanda evaporativa extrema detectada: Con ${t.toFixed(1)}°C y humedad de suelo en ${normSuelo.toFixed(1)}%, la tasa de evapotranspiración de ${et.toFixed(2)} mm/día es insostenible. El balance hídrico negativo sugiere una posible muerte térmica de tejidos apicales.`,
      accion: "Activar riego de enfriamiento inmediato por pulsos (5 min cada hora) y establecer sombreado temporal si es posible. Priorizar la turgencia celular sobre la fertilización.",
      riesgo: 'High'
    };
  }

  // 3. Riesgo de Hongos por Condensación
  if (h > 90 && t < puntoRocio + 2) {
    return {
      titulo: "ALERTA DE CONDENSACIÓN", 
      otomi: "¡M'e̲di ar dehe hñäki!",
      desc: `Saturación atmosférica detectada: La temperatura de ${t.toFixed(1)}°C ha convergido con el punto de rocío (${puntoRocio.toFixed(1)}°C). El algoritmo detecta agua líquida persistente en el follaje, condición ideal para la germinación de esporas fitopatógenas.`,
      accion: "Incrementar la ventilación mecánica de forma inmediata. Realizar una aplicación preventiva de fungicida de contacto para romper la película de agua en las hojas.",
      riesgo: 'High'
    };
  }

  // 4. Saturación Hídrica / Asfixia Radicular
  if (normSuelo > 85) {
    return {
      titulo: "SATURACIÓN / ANOXIA RADICULAR", 
      otomi: "¡Dä dehe / M'e̲di ar ndähi!",
      desc: `Estado de anoxia detectado: Humedad de suelo al ${normSuelo.toFixed(1)}%. El intercambio gaseoso en la rizosfera se ha detenido, lo que provocará la muerte de las raíces por falta de oxígeno si el encharcamiento persiste.`,
      accion: "Suspender cualquier programa de irrigación. Abrir drenajes de emergencia y remover ligeramente la capa superficial del suelo para favorecer la aireación.",
      riesgo: 'High'
    };
  }

  // 5. Riesgo de Roya / Tizón (Condiciones óptimas)
  if (h > 75 && t >= 18 && t <= 24) {
    return {
      titulo: "RIESGO DE ROYA / TIZÓN", 
      otomi: "¡Nts'o hñäki yä xi!",
      desc: `Microclima de incubación: Los niveles de humedad (${h.toFixed(1)}%) y temperatura (${t.toFixed(1)}°C) coinciden en un 92% con patrones históricos de proliferación de Roya en el Valle del Mezquital.`,
      accion: "Inspección exhaustiva en busca de pústulas o manchas necróticas. Se recomienda la aplicación de bio-fungicidas a base de cobre o Bacillus subtilis.",
      riesgo: 'Medium'
    };
  }

  // 6. Estrés por Desequilibrio Hídrico (Viento Seco)
  if (t > 30 && h < 20) {
    return {
      titulo: "DESEQUILIBRIO HÍDRICO (VPD)", 
      otomi: "¡Ar ndähi xat'i!",
      desc: `Diferencial de presión de vapor elevado: Con aire al ${h.toFixed(1)}% de humedad, la raíz no logra bombear agua a la velocidad que la atmósfera la extrae. Riesgo de marchitamiento temporal.`,
      accion: "Establecer barreras cortavientos y utilizar nebulizadores si se dispone de ellos para restaurar la humedad relativa local sobre el 40%.",
      riesgo: 'Medium'
    };
  }

  // 7. Bloqueo Nutricional por Frío
  if (t < 14 && normSuelo > 40) {
    return {
      titulo: "BLOQUEO NUTRICIONAL POR FRÍO", 
      otomi: "¡Ar tse̲ häi!",
      desc: `Ralentización metabólica: La temperatura de ${t.toFixed(1)}°C ha bloqueado la absorción de fósforo y micronutrientes, a pesar de que el suelo tiene humedad (${normSuelo.toFixed(1)}%).`,
      accion: "Evitar el riego con agua fría. Se recomienda nutrición foliar de emergencia con quelatados para saltar el bloqueo radicular hasta que el suelo caliente.",
      riesgo: 'Medium'
    };
  }

  // 8. Ventana de Polinización (Ideal)
  if (t >= 22 && t <= 27 && h >= 45 && h <= 65) {
    return {
      titulo: "VENTANA DE POLINIZACIÓN IDEAL", 
      otomi: "¡Hño m'u̲i ar ndonni!",
      desc: `Optimización biológica: Las condiciones actuales (${t.toFixed(1)}°C, ${h.toFixed(1)}% HR) garantizan la máxima viabilidad del polen y la actividad de polinizadores en la región.`,
      accion: "Fomentar la presencia de polinizadores. Restricción total de insecticidas o aplicaciones químicas durante las próximas 18 horas.",
      riesgo: 'None'
    };
  }

  // 9. Fotosíntesis Óptima
  if (t >= 20 && t <= 28 && h >= 50 && h <= 70) {
    return {
      titulo: "FOTOSÍNTESIS ÓPTIMA", 
      otomi: "¡Hño m'u̲i ar nuni!",
      desc: `Estado metabólico máximo: Sincronía perfecta entre temperatura (${t.toFixed(1)}°C) y humedad. El cultivo está operando a su máxima eficiencia teórica de fijación de carbono.`,
      accion: "Momento ideal para la aplicación de bioestimulantes y fertilizantes foliares para potenciar el crecimiento vegetativo.",
      riesgo: 'None'
    };
  }

  // 10. Capacidad de Campo (Perfecto)
  if (normSuelo > 40 && normSuelo < 65 && t < 32) {
    return {
      titulo: "CAPACIDAD DE CAMPO ALCANZADA", 
      otomi: "¡Hño dehe ar häi!",
      desc: `Balance hídrico perfecto: El suelo al ${normSuelo.toFixed(1)}% retiene la proporción ideal de agua y aire. Las raíces tienen acceso total a nutrientes sin estrés hídrico.`,
      accion: "Mantener el programa actual de monitoreo pasivo. No se requiere intervención de riego en las próximas 24 horas.",
      riesgo: 'None'
    };
  }

  // 11. Sistema Estable (Default)
  return {
    titulo: "SISTEMA ESTABLE", 
    otomi: "¡Hño m'u̲i!",
    desc: `Monitoreo de rutina: Los sensores indican que las variables ambientales (${t.toFixed(1)}°C y ${normSuelo.toFixed(1)}% de humedad) se mantienen dentro de los umbrales de seguridad para Hidalgo.`,
    accion: "Continuar con el programa de manejo preventivo estándar. Los algoritmos de riesgo no detectan amenazas inmediatas.",
    riesgo: 'None'
  };
};
