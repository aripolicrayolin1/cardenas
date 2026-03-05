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
    desc: `Evapotranspiración crítica detectada (${et.toFixed(2)} mm). Los modelos predictivos sugieren una tasa de mortalidad celular elevada si no se interviene.`,
    accion: "Activar riego de enfriamiento inmediato por pulsos y establecer sombreado temporal.",
    riesgo: 'High'
  };

  // 2. Riesgo de Hongos por Condensación
  if (h > 90 && t < puntoRocio + 2) return {
    titulo: "ALERTA DE CONDENSACIÓN", 
    otomi: "¡M'e̲di ar dehe hñäki!",
    desc: "La temperatura ambiente ha convergido con el punto de rocío. El algoritmo detecta saturación foliar, ambiente óptimo para la proliferación de esporas.",
    accion: "Forzar ventilación mecánica en túneles y aplicar fungicida preventivo de contacto.",
    riesgo: 'High'
  };

  // 3. Riesgo de Helada
  if (t < 5) return {
    titulo: "RIESGO DE HELADA", 
    otomi: "¡Xue t'o̲ho̲!",
    desc: "Inminente caída por debajo del umbral de seguridad biológica. Riesgo sistémico de cristalización en tejidos vasculares.",
    accion: "Iniciar riego por aspersión superficial para liberar calor latente y proteger el cultivo.",
    riesgo: 'High'
  };

  // 4. Saturación Hídrica / Asfixia
  if (suelo > 4000) return {
    titulo: "SATURACIÓN / ANOXIA", 
    otomi: "¡Dä dehe / M'e̲di ar ndähi!",
    desc: "Suelo en estado de anoxia total. El balance de gases indica que las raíces han cesado el intercambio de oxígeno.",
    accion: "Cese total de irrigación y apertura de drenajes de emergencia para evacuar excedentes.",
    riesgo: 'High'
  };

  // 5. Riesgo de Roya / Tizón
  if (h > 75 && t >= 18 && t <= 24) return {
    titulo: "RIESGO DE ROYA / TIZÓN", 
    otomi: "¡Nts'o hñäki yä xi!",
    desc: "Análisis de microclima: Variables de humedad y temperatura coinciden en un 95% con patrones históricos de tizón tardío.",
    accion: "Inspección exhaustiva de parcelas. Aplicación preventiva de bio-fungicida a base de Bacillus subtilis.",
    riesgo: 'Medium'
  };

  // 6. Estrés por Desequilibrio Hídrico (Viento Seco)
  if (t > 32 && h < 15) return {
    titulo: "DESEQUILIBRIO HÍDRICO", 
    otomi: "¡Ar ndähi xat'i!",
    desc: "La tasa de transpiración estomática excede la capacidad de bombeo radicular debido a la extrema sequedad del aire.",
    accion: "Instalar barreras cortavientos y emplear nebulizadores para restaurar la humedad relativa local.",
    riesgo: 'Medium'
  };

  // 7. Bloqueo Nutricional por Frío
  if (t < 14 && suelo > 1500) return {
    titulo: "BLOQUEO POR FRÍO", 
    otomi: "¡Ar tse̲ häi!",
    desc: "Metabolismo radicular ralentizado. La absorción de fósforo y micronutrientes está bloqueada por baja temperatura del sustrato.",
    accion: "Suspender fertilización granulada. Utilizar quelatados foliares para nutrición de emergencia.",
    riesgo: 'Medium'
  };

  // 8. Ventana de Polinización (Ideal)
  if (t >= 22 && t <= 26 && h >= 40 && h <= 60) return {
    titulo: "VENTANA DE POLINIZACIÓN", 
    otomi: "¡Hño m'u̲i ar ndonni!",
    desc: "Condiciones bio-meteorológicas óptimas. Máxima viabilidad de polen detectada por el sensor de radiación y humedad.",
    accion: "Fomentar actividad de polinizadores. Restricción total de agroquímicos durante las próximas 12 horas.",
    riesgo: 'None'
  };

  // 9. Gasto Energético Nocturno
  if (t > 22 && h > 80) return {
    titulo: "GASTO NOCTURNO ALTO", 
    otomi: "¡Nxui xat'i!",
    desc: "Tasa respiratoria nocturna acelerada. El cultivo está degradando reservas de carbohidratos de forma ineficiente.",
    accion: "Implementar medidas de enfriamiento nocturno mediante ventilación forzada.",
    riesgo: 'Low'
  };

  // 10. Demanda Evaporativa Extrema
  if (et > 7.0) return {
    titulo: "DEMANDA EVAPORATIVA MÁXIMA", 
    otomi: "¡Dä nt'o̲ni ar nuni!",
    desc: `La atmósfera está extrayendo humedad a una tasa crítica de ${et.toFixed(2)} mm/día. Riesgo de marchitez temporal.`,
    accion: "Programar riego de auxilio durante el pico de radiación para compensar la pérdida.",
    riesgo: 'Medium'
  };

  // 11. Estomas Cerrados (Supervivencia)
  if (et < 1.0 && suelo < 700) return {
    titulo: "ESTOMAS CERRADOS", 
    otomi: "¡Ar nuni otho ar dehe!",
    desc: "Mecanismo de defensa activado: El cultivo ha cerrado estomas para conservar el potencial hídrico interno ante la sequía.",
    accion: "Riego profundo inmediato. La planta se encuentra en estado de latencia forzada.",
    riesgo: 'High'
  };

  // 12. Fotosíntesis Óptima
  if (t >= 20 && t <= 28 && h >= 50 && h <= 70) return {
    titulo: "FOTOSÍNTESIS ÓPTIMA", 
    otomi: "¡Hño m'u_i ar nuni!",
    desc: "Sincronía perfecta de variables ambientales. El índice de crecimiento vegetativo se encuentra en su punto máximo teórico.",
    accion: "Momento ideal para la aplicación de fertilizantes foliares y bioestimulantes.",
    riesgo: 'None'
  };

  // 13. Aire Extremadamente Seco
  if (h < 20) return {
    titulo: "SEQUEDAD ATMOSFÉRICA", 
    otomi: "¡Dä nt'o_ni ar ndähi!",
    desc: "La humedad del aire ha caído por debajo del umbral crítico. El gradiente de presión de vapor es peligroso para el follaje.",
    accion: "Pulverización foliar ligera para aumentar la humedad ambiental de forma inmediata.",
    riesgo: 'Medium'
  };

  // 14. Riesgo de Bacteriosis
  if (t < 12 && h > 85) return {
    titulo: "RIESGO DE BACTERIOSIS", 
    otomi: "¡Ar tse_ hñäki!",
    desc: "Clima frío y húmedo persistente. El análisis de riesgo indica alta probabilidad de desarrollo de Erwinia o moho gris.",
    accion: "Eliminar material vegetal en descomposición y desinfectar herramientas de poda.",
    riesgo: 'Medium'
  };

  // 15. Capacidad de Campo (Perfecto)
  if (suelo > 1500 && suelo < 2500 && t < 30) return {
    titulo: "CAPACIDAD DE CAMPO", 
    otomi: "¡Hño dehe ar häi!",
    desc: "Equilibrio hidrodinámico perfecto. El suelo retiene la proporción ideal de agua para una absorción de nutrientes sin estrés.",
    accion: "Mantener el programa actual. Sistema operando bajo parámetros ideales.",
    riesgo: 'None'
  };

  // 16. Baja Actividad (Día Nublado)
  if (et < 2.0 && h > 70 && t < 22) return {
    titulo: "BAJA ACTIVIDAD", 
    otomi: "¡Nts'u_ n'u_i!",
    desc: "Radiación y evaporación reducidas. El metabolismo de la planta se ha ajustado a un estado basal.",
    accion: "Reducir el volumen de riego diario para prevenir la saturación de raíces.",
    riesgo: 'Low'
  };

  // 17. Saturación por Rocío
  if (t > 10 && t < 16 && h > 90) return {
    titulo: "SATURACIÓN por ROCÍO", 
    otomi: "¡Ar dehe n'u_i!",
    desc: "Humedad foliar persistente. El exceso de agua superficial puede lixiviar aplicaciones de fertilizantes foliares recientes.",
    accion: "Retrasar aplicaciones de agroquímicos hasta que la luz solar evapore la película de agua.",
    riesgo: 'Low'
  };

  // 18. Salinidad / Conductividad Alta
  if (suelo > 3500) return {
    titulo: "RIESGO DE SALINIDAD", 
    otomi: "¡U_gi ar häi!",
    desc: "Acumulación anómala de sales en el bulbo húmedo. Riesgo de quemado de raíces por ósmosis inversa.",
    accion: "Realizar un riego de lavado (leaching) prolongado con agua de baja conductividad.",
    riesgo: 'Medium'
  };

  // 19. Madrugada Húmeda
  if (h > 80 && t < 15) return {
    titulo: "RECUPERACIÓN NOCTURNA", 
    otomi: "¡Ts'u_ dehe nxui!",
    desc: "Las células están recuperando turgencia. El sistema se encuentra en un estado de equilibrio homeostático.",
    accion: "No se requieren intervenciones. Continuar con el monitoreo pasivo de sensores.",
    riesgo: 'None'
  };

  // 20. Viento Seco / Deshidratación
  if (h < 30 && t > 25) return {
    titulo: "BAJA HUMEDAD RELATIVA", 
    otomi: "¡Ot'i ndähi!",
    desc: "El diferencial de presión de vapor (VPD) es elevado. Se detecta deshidratación acelerada en los bordes de la parcela.",
    accion: "Aumentar la frecuencia de los ciclos de riego y revisar cortavientos.",
    riesgo: 'Medium'
  };

  // 21. Estrés por Frío Húmedo
  if (t < 10 && h > 70) return {
    titulo: "ESTRÉS por FRÍO HÚMEDO", 
    otomi: "¡Tse_ dehe!",
    desc: "Combinación de baja temperatura y alta humedad. El sistema inmunitario de la planta se encuentra deprimido.",
    accion: "Monitorear la base de los tallos en busca de signos de pudrición por Phythium.",
    riesgo: 'Medium'
  };

  // 22. Sistema Estable (Default)
  return {
    titulo: "SISTEMA ESTABLE", 
    otomi: "¡Hño m'u_i!",
    desc: "La inteligencia de datos indica que todas las variables están dentro de los rangos óptimos para el Valle del Mezquital.",
    accion: "Continuar con el programa de manejo preventivo estándar.",
    riesgo: 'None'
  };
};
