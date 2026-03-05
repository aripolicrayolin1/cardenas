
/**
 * @fileOverview Motor de diagnóstico experto para AgroTech Hidalgo.
 * Simula el razonamiento de una IA basado en reglas agronómicas reales para la región.
 * Genera mensajes dinámicos que integran los valores de los sensores para el concurso.
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
  
  // 1. Prioridad Crítica: Helada y Sequía Extrema (Combinado para el concurso)
  if (t < 7 && suelo < 600) {
    return {
      titulo: "RIESGO DE HELADA Y DESHIDRATACIÓN", 
      otomi: "¡Xue t'o̲ho̲!",
      desc: `Análisis térmico crítico: La temperatura de ${t.toFixed(1)}°C indica un riesgo inminente de helada advectiva. Con un suelo al ${suelo.toFixed(1)}% de humedad, las raíces carecen de inercia térmica, lo que acelerará el daño celular por frío en los tejidos vasculares.`,
      accion: "Activar riego por aspersión inmediatamente. El agua liberará calor latente al cambiar de fase, creando una capa protectora que mantendrá la temperatura de la planta cerca de los 0°C, evitando el punto de congelación letal.",
      riesgo: 'High'
    };
  }

  // 2. Prioridad: Calor Extremo y Sequía
  if (t > 35 && suelo < 600) {
    return {
      titulo: "ESTRÉS TÉRMICO CRÍTICO", 
      otomi: "¡Däthä hñei xat'i!",
      desc: `Demanda evaporativa extrema detectada: Con ${t.toFixed(1)}°C y humedad de suelo en ${suelo.toFixed(1)}%, la tasa de evapotranspiración de ${et.toFixed(2)} mm/día es insostenible. El balance hídrico negativo sugiere una posible muerte térmica de tejidos apicales.`,
      accion: "Activar riego de enfriamiento inmediato y establecer sombreado temporal. Priorizar la turgencia celular sobre la fertilización.",
      riesgo: 'High'
    };
  }

  // 3. Riesgo de Hongos por Condensación
  if (h > 90 && t < puntoRocio + 2) {
    return {
      titulo: "ALERTA DE CONDENSACIÓN", 
      otomi: "¡M'e̲di ar dehe hñäki!",
      desc: `Saturación atmosférica detectada: La temperatura de ${t.toFixed(1)}°C ha convergido con el punto de rocío (${puntoRocio.toFixed(1)}°C). Detecto agua líquida persistente en el follaje, condición ideal para la germinación de esporas de hongos.`,
      accion: "Incrementar la ventilación y realizar una aplicación preventiva de fungicida para romper la película de agua en las hojas.",
      riesgo: 'High'
    };
  }

  // 4. Saturación Hídrica / Asfixia Radicular
  if (suelo > 3800) {
    return {
      titulo: "SATURACIÓN / ANOXIA RADICULAR", 
      otomi: "¡Dä dehe / M'e̲di ar ndähi!",
      desc: `Estado de anoxia detectado: Humedad de suelo elevada (${suelo.toFixed(0)}%). Las raíces se asfixian por falta de oxígeno, lo que detiene el intercambio gaseoso en la rizosfera.`,
      accion: "Suspender cualquier programa de irrigación. Abrir drenajes de emergencia para favorecer la aireación del suelo.",
      riesgo: 'High'
    };
  }

  // 5. Riesgo de Roya / Tizón
  if (h > 75 && t >= 18 && t <= 24) {
    return {
      titulo: "RIESGO DE ROYA / TIZÓN", 
      otomi: "¡Nts'o hñäki yä xi!",
      desc: `Microclima de incubación: Los niveles de humedad (${h.toFixed(1)}%) y temperatura (${t.toFixed(1)}°C) coinciden con patrones históricos de esporas de hongos fitopatógenos en el Valle del Mezquital.`,
      accion: "Inspección visual de manchas y aplicación de bio-fungicida. Mantener vigilancia en el envés de las hojas.",
      riesgo: 'Medium'
    };
  }

  // 6. Estrés por Desequilibrio Hídrico (Viento Seco)
  if (t > 32 && h < 15) {
    return {
      titulo: "DESEQUILIBRIO HÍDRICO", 
      otomi: "¡Ar ndähi xat'i!",
      desc: `Diferencial de presión de vapor elevado: Con aire al ${h.toFixed(1)}% de humedad, la raíz no bombea agua tan rápido como la hoja la pierde por el aire seco del Valle.`,
      accion: "Reducir exposición al viento y usar nebulizadores para restaurar la humedad relativa local.",
      riesgo: 'Medium'
    };
  }

  // 7. Bloqueo Nutricional por Frío
  if (t < 14 && suelo > 1500) {
    return {
      titulo: "BLOQUEO POR FRÍO", 
      otomi: "¡Ar tse̲ häi!",
      desc: `Ralentización metabólica: La temperatura de ${t.toFixed(1)}°C ha bloqueado la absorción de Fósforo, a pesar de que el suelo tiene humedad (${suelo.toFixed(0)}).`,
      accion: "Evitar el riego frío. Se recomienda nutrición foliar de emergencia hasta que el suelo recupere temperatura térmica.",
      riesgo: 'Medium'
    };
  }

  // 8. Ventana de Polinización (Ideal)
  if (t >= 22 && t <= 26 && h >= 40 && h <= 60) {
    return {
      titulo: "VENTANA DE POLINIZACIÓN", 
      otomi: "¡Hño m'u̲i ar ndonni!",
      desc: `Optimización biológica: Las condiciones actuales (${t.toFixed(1)}°C, ${h.toFixed(1)}% HR) garantizan la máxima viabilidad del polen y la actividad de polinizadores.`,
      accion: "Proteger polinizadores y abejas. Restricción total de aplicaciones químicas durante las próximas horas.",
      riesgo: 'None'
    };
  }

  // 9. Gasto Energético Nocturno
  if (t > 22 && h > 80) {
    return {
      titulo: "GASTO NOCTURNO ALTO", 
      otomi: "¡Nxui xat'i!",
      desc: `Respiración acelerada detectada: La planta consume sus reservas de azúcar demasiado rápido debido al calor nocturno de ${t.toFixed(1)}°C.`,
      accion: "Asegurar ventilación constante para bajar la temperatura del follaje y estabilizar el metabolismo.",
      riesgo: 'Medium'
    };
  }

  // 10. Demanda Evaporativa Extrema
  if (et > 6.0) {
    return {
      titulo: "DEMANDA EVAPORATIVA MÁXIMA", 
      otomi: "¡Dä nt'o̲ni ar nuni!",
      desc: `La atmósfera extrae agua a una tasa crítica de ${et.toFixed(2)} mm/día según el modelo de Penman-Monteith.`,
      accion: "Realizar riego de auxilio para compensar la transpiración excesiva del mediodía.",
      riesgo: 'High'
    };
  }

  // 11. Estomas Cerrados (Supervivencia)
  if (et < 1.0 && suelo < 700) {
    return {
      titulo: "ESTOMAS CERRADOS", 
      otomi: "¡Ar nuni otho ar dehe!",
      desc: `Modo de supervivencia activado: La planta ha detenido su crecimiento para no morir por deshidratación ante la falta de agua en el suelo.`,
      accion: "Riego profundo urgente. La planta requiere recuperación hídrica inmediata para salir del modo ahorro.",
      riesgo: 'High'
    };
  }

  // 12. Fotosíntesis Óptima
  if (t >= 20 && t <= 28 && h >= 50 && h <= 70) {
    return {
      titulo: "FOTOSÍNTESIS ÓPTIMA", 
      otomi: "¡Hño m'u̲i ar nuni!",
      desc: `Estado metabólico máximo: Balance térmico (${t.toFixed(1)}°C) y hídrico ideal para el máximo crecimiento vegetativo.`,
      accion: "Momento ideal para la aplicación de bioestimulantes o fertilizantes foliares para potenciar el rendimiento.",
      riesgo: 'None'
    };
  }

  // 13. Aire Extremadamente Seco
  if (h < 20) {
    return {
      titulo: "SEQUEDAD ATMOSFÉRICA", 
      otomi: "¡Dä nt'o̲ni ar ndähi!",
      desc: `Humedad del aire crítica (${h.toFixed(1)}%). Riesgo de marchitamiento foliar inminente por falta de humedad ambiental.`,
      accion: "Pulverización foliar para elevar la humedad relativa local y proteger el follaje.",
      riesgo: 'Medium'
    };
  }

  // 14. Riesgo de Bacteriosis
  if (t < 12 && h > 85) {
    return {
      titulo: "RIESGO DE BACTERIOSIS", 
      otomi: "¡Ar tse̲ hñäki!",
      desc: `Condiciones pro-bacterianas: El frío (${t.toFixed(1)}°C) y la alta humedad favorecen la proliferación de bacterias y mohos grises.`,
      accion: "Eliminar restos vegetales y evitar realizar podas o heridas en los tallos durante este periodo.",
      riesgo: 'Medium'
    };
  }

  // 15. Capacidad de Campo (Perfecto)
  if (suelo > 1500 && suelo < 2500 && t < 30) {
    return {
      titulo: "CAPACIDAD DE CAMPO", 
      otomi: "¡Hño dehe ar häi!",
      desc: `Balance hídrico perfecto: El suelo (${suelo.toFixed(0)}) retiene la cantidad justa de agua y aire. Nutrición fluyendo correctamente.`,
      accion: "Mantener el monitoreo pasivo. No se requiere intervención de riego adicional en las próximas 24 horas.",
      riesgo: 'None'
    };
  }

  // 16. Baja Actividad (Día Nublado)
  if (et < 2.0 && h > 70 && t < 22) {
    return {
      titulo: "BAJA ACTIVIDAD", 
      otomi: "¡Nts'u̲ n'u̲i!",
      desc: `Ralentización fotosintética: Baja tasa de evaporación (${et.toFixed(2)}). El consumo hídrico de la planta es mínimo hoy.`,
      accion: "Reducir la frecuencia de riego para evitar posibles encharcamientos o enfermedades radiculares.",
      riesgo: 'Low'
    };
  }

  // 17. Saturación por Rocío
  if (t > 10 && t < 16 && h > 90) {
    return {
      titulo: "SATURACIÓN POR ROCÍO", 
      otomi: "¡Ar dehe n'u̲i!",
      desc: `Humedad foliar persistente: Se ha detectado rocío sobre las hojas, lo que puede lavar los nutrientes recién aplicados.`,
      accion: "Posponer aplicaciones foliares hasta que el sol seque el follaje por completo.",
      riesgo: 'Low'
    };
  }

  // 18. Salinidad / Conductividad Alta
  if (suelo > 3500) {
    return {
      titulo: "RIESGO DE SALINIDAD", 
      otomi: "¡U̲gi ar häi!",
      desc: `Análisis de sustrato: Posible acumulación excesiva de sales en la zona radicular (suelo en ${suelo.toFixed(0)}).`,
      accion: "Realizar un riego de lavado (leaching) con agua limpia para desplazar las sales fuera del área radicular.",
      riesgo: 'Medium'
    };
  }

  // 19. Madrugada Húmeda
  if (h > 80 && t < 15) {
    return {
      titulo: "RECUPERACIÓN NOCTURNA", 
      otomi: "¡Ts'u̲ dehe nxui!",
      desc: `Restauración de turgencia: La planta está recuperando agua eficientemente bajo estas condiciones estables.`,
      accion: "Continuar con el monitoreo de rutina. Sistema en estado de equilibrio hídrico.",
      riesgo: 'None'
    };
  }

  // 20. Viento Seco / Deshidratación
  if (h < 30 && t > 25) {
    return {
      titulo: "BAJA HUMEDAD RELATIVA", 
      otomi: "¡Ot'i ndähi!",
      desc: `Diferencial de vapor elevado: Deshidratación rápida detectada por el aire seco a ${t.toFixed(1)}°C.`,
      accion: "Aumentar la frecuencia de riego y considerar el uso de barreras cortavientos.",
      riesgo: 'Medium'
    };
  }

  // 21. Estrés por Frío Húmedo
  if (t < 10 && h > 70) {
    return {
      titulo: "ESTRÉS POR FRÍO HÚMEDO", 
      otomi: "¡Tse̲ dehe!",
      desc: `Debilitamiento inmune: La combinación de frío (${t.toFixed(1)}°C) y humedad compromete la resistencia natural del cultivo.`,
      accion: "Revisar signos de pudrición en la base del tallo y asegurar drenaje óptimo.",
      riesgo: 'Medium'
    };
  }

  // 22. Sistema Estable (Default)
  return {
    titulo: "SISTEMA ESTABLE", 
    otomi: "¡Hño m'u̲i!",
    desc: `Monitoreo de rutina: Todas las variables (${t.toFixed(1)}°C, suelo en ${suelo.toFixed(0)}) están dentro de los umbrales de seguridad.`,
    accion: "Mantener el cronograma de manejo preventivo estándar para la región.",
    riesgo: 'None'
  };
};
