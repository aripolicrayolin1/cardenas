/**
 * @fileOverview Motor de diagnóstico experto para AgroTech Hidalgo.
 * Simula el razonamiento de una IA basado en reglas agronómicas reales para la región.
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
  
  // 1. Prioridad: Calor Extremo y Sequía
  if (t > 35 && suelo < 600) return {
    titulo: "ESTRÉS TÉRMICO CRÍTICO", 
    otomi: "¡Däthä hñei xat'i!",
    desc: `Evapotranspiración crítica (${et.toFixed(2)}). Riesgo de muerte térmica.`,
    accion: "Riego de enfriamiento inmediato y sombreado.",
    riesgo: 'High'
  };

  // 2. Riesgo de Hongos por Condensación
  if (h > 90 && t < puntoRocio + 2) return {
    titulo: "ALERTA DE CONDENSACIÓN", 
    otomi: "¡M'e_di ar dehe hñäki!",
    desc: "Temperatura cerca al punto de rocío. El agua en hojas favorece hongos.",
    accion: "Aumentar ventilación y aplicar fungicida preventivo.",
    riesgo: 'High'
  };

  // 3. Riesgo de Helada
  if (t < 5) return {
    titulo: "RIESGO DE HELADA", 
    otomi: "¡Xue t'o_ho_!",
    desc: "Bajo umbral de seguridad. Riesgo de cristalización celular.",
    accion: "Activar riego por aspersión para generar calor latente.",
    riesgo: 'High'
  };

  // 4. Saturación Hídrica / Asfixia
  if (suelo > 4000) return {
    titulo: "SATURACIÓN / ANOXIA", 
    otomi: "¡Dä dehe / M'e_di ar ndähi!",
    desc: "Suelo anóxico. Las raíces se asfixian por falta de oxígeno.",
    accion: "Suspender riego y drenar surcos inmediatamente.",
    riesgo: 'High'
  };

  // 5. Riesgo de Roya / Tizón
  if (h > 75 && t >= 18 && t <= 24) return {
    titulo: "RIESGO DE ROYA / TIZÓN", 
    otomi: "¡Nts'o hñäki yä xi!",
    desc: "Humedad y temperatura ideales para esporas de hongos.",
    accion: "Inspección visual de manchas y aplicación de bio-fungicida.",
    riesgo: 'Medium'
  };

  // 6. Estrés por Desequilibrio Hídrico (Viento Seco)
  if (t > 32 && h < 15) return {
    titulo: "DESEQUILIBRIO HÍDRICO", 
    otomi: "¡Ar ndähi xat'i!",
    desc: "La raíz no bombea agua tan rápido como la hoja la pierde.",
    accion: "Reducir exposición al viento y usar nebulizadores.",
    riesgo: 'Medium'
  };

  // 7. Bloqueo Nutricional por Frío
  if (t < 14 && suelo > 1500) return {
    titulo: "BLOQUEO POR FRÍO", 
    otomi: "¡Ar tse_ häi!",
    desc: "Raíces inactivas. La planta no absorbe nutrientes clave.",
    accion: "Evitar riego frío. Esperar a que el suelo caliente.",
    riesgo: 'Medium'
  };

  // 8. Ventana de Polinización (Ideal)
  if (t >= 22 && t <= 26 && h >= 40 && h <= 60) return {
    titulo: "VENTANA DE POLINIZACIÓN", 
    otomi: "¡Hño m'u_i ar ndonni!",
    desc: "Clima perfecto para polinizadores y viabilidad del polen.",
    accion: "Proteger polinizadores. No aplicar pesticidas ahora.",
    riesgo: 'None'
  };

  // 9. Gasto Energético Nocturno
  if (t > 22 && h > 80) return {
    titulo: "GASTO NOCTURNO ALTO", 
    otomi: "¡Nxui xat'i!",
    desc: "La planta respira demasiado rápido, consumiendo reservas.",
    accion: "Asegurar ventilación para bajar temperatura nocturna.",
    riesgo: 'Low'
  };

  // 10. Demanda Evaporativa Extrema
  if (et > 7.0) return {
    titulo: "DEMANDA EVAPORATIVA MÁXIMA", 
    otomi: "¡Dä nt'o_ni ar nuni!",
    desc: `La atmósfera extrae agua a tasa elevada (${et.toFixed(2)} mm/día).`,
    accion: "Riego de auxilio al mediodía para compensar.",
    riesgo: 'Medium'
  };

  // 11. Estomas Cerrados (Supervivencia)
  if (et < 1.0 && suelo < 700) return {
    titulo: "ESTOMAS CERRADOS", 
    otomi: "¡Ar nuni otho ar dehe!",
    desc: "La planta detuvo su crecimiento para evitar la deshidratación.",
    accion: "Riego profundo urgente. La planta está en modo ahorro.",
    riesgo: 'High'
  };

  // 12. Fotosíntesis Óptima
  if (t >= 20 && t <= 28 && h >= 50 && h <= 70) return {
    titulo: "FOTOSÍNTESIS ÓPTIMA", 
    otomi: "¡Hño m'u_i ar nuni!",
    desc: "Balance térmico y hídrico ideal. Máximo crecimiento vegetativo.",
    accion: "Momento ideal para aplicación de biofertilizantes foliares.",
    riesgo: 'None'
  };

  // 13. Aire Extremadamente Seco
  if (h < 20) return {
    titulo: "SEQUEDAD ATMOSFÉRICA", 
    otomi: "¡Dä nt'o_ni ar ndähi!",
    desc: "Humedad del aire crítica. Marchitamiento foliar inminente.",
    accion: "Pulverización foliar para subir humedad ambiental.",
    riesgo: 'Medium'
  };

  // 14. Riesgo de Bacteriosis
  if (t < 12 && h > 85) return {
    titulo: "RIESGO DE BACTERIOSIS", 
    otomi: "¡Ar tse_ hñäki!",
    desc: "Frío y humedad favorecen bacterias y moho gris.",
    accion: "Eliminar restos vegetales y evitar heridas en tallos.",
    riesgo: 'Medium'
  };

  // 15. Capacidad de Campo (Perfecto)
  if (suelo > 1500 && suelo < 2500 && t < 30) return {
    titulo: "CAPACIDAD DE CAMPO", 
    otomi: "¡Hño dehe ar häi!",
    desc: "El suelo retiene la cantidad justa de agua y aire.",
    accion: "Mantener monitoreo. No requiere riego adicional.",
    riesgo: 'None'
  };

  // 16. Baja Actividad (Día Nublado)
  if (et < 2.0 && h > 70 && t < 22) return {
    titulo: "BAJA ACTIVIDAD", 
    otomi: "¡Nts'u_ n'u_i!",
    desc: "Baja evaporación. El consumo de agua es mínimo hoy.",
    accion: "Reducir frecuencia de riego para evitar encharcamientos.",
    riesgo: 'Low'
  };

  // 17. Saturación por Rocío
  if (t > 10 && t < 16 && h > 90) return {
    titulo: "SATURACIÓN POR ROCÍO", 
    otomi: "¡Ar dehe n'u_i!",
    desc: "Humedad foliar persistente. Riesgo de lavado de nutrientes.",
    accion: "Posponer aplicaciones foliares hasta que salga el sol.",
    riesgo: 'Low'
  };

  // 18. Salinidad / Conductividad Alta
  if (suelo > 3500) return {
    titulo: "RIESGO DE SALINIDAD", 
    otomi: "¡U_gi ar häi!",
    desc: "Posible exceso de sales acumuladas en la zona radicular.",
    accion: "Realizar riego de lavado con agua limpia.",
    riesgo: 'Medium'
  };

  // 19. Madrugada Húmeda
  if (h > 80 && t < 15) return {
    titulo: "RECUPERACIÓN NOCTURNA", 
    otomi: "¡Ts'u_ dehe nxui!",
    desc: "La planta recupera turgencia. Sistema estable.",
    accion: "Continuar monitoreo pasivo de la estación.",
    riesgo: 'None'
  };

  // 20. Viento Seco / Deshidratación
  if (h < 30 && t > 25) return {
    titulo: "BAJA HUMEDAD RELATIVA", 
    otomi: "¡Ot'i ndähi!",
    desc: "Diferencial de presión de vapor elevado. Deshidratación.",
    accion: "Aumentar frecuencia de riego y usar cortavientos.",
    riesgo: 'Medium'
  };

  // 21. Estrés por Frío Húmedo
  if (t < 10 && h > 70) return {
    titulo: "ESTRÉS POR FRÍO HÚMEDO", 
    otomi: "¡Tse_ dehe!",
    desc: "Combinación que debilita el sistema inmune de la planta.",
    accion: "Revisar signos de pudrición en la base del tallo.",
    riesgo: 'Medium'
  };

  // 22. Sistema Estable (Default)
  return {
    titulo: "SISTEMA ESTABLE", 
    otomi: "¡Hño m'u_i!",
    desc: "Variables dentro del rango óptimo para la región.",
    accion: "Mantener cronograma de monitoreo estándar.",
    riesgo: 'None'
  };
};