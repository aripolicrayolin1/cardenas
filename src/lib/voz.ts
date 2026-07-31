/**
 * @fileOverview Utilidades de voz del navegador (Web Speech API).
 *
 * ── Nota honesta sobre el hñähñu ────────────────────────────────────────────
 * La síntesis de voz del navegador NO tiene una voz en hñähñu (otomí): no
 * existe. Los navegadores traen voces en español, inglés y otros idiomas
 * mayoritarios, pero ninguna lengua indígena de México. Por eso el asistente y
 * el diario **hablan en español** aunque el texto en pantalla esté en el idioma
 * que el usuario eligió. Es una limitación real de la tecnología, no un olvido:
 * las lenguas originarias siguen sin voz sintética disponible.
 *
 * El reconocimiento de voz (dictado) sí funciona en español mexicano y ya se
 * usa en el diagnóstico.
 */

export function soportaSintesis(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function soportaReconocimiento(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

/** Elige una voz en español si el dispositivo tiene alguna. */
function vozEspanol(): SpeechSynthesisVoice | null {
  const voces = window.speechSynthesis.getVoices();
  return (
    voces.find((v) => v.lang === 'es-MX') ??
    voces.find((v) => v.lang.startsWith('es')) ??
    null
  );
}

/**
 * Lee un texto en voz alta, en español. Cancela cualquier lectura en curso para
 * no encimar frases. Devuelve una promesa que se resuelve al terminar.
 */
export function hablar(texto: string): Promise<void> {
  return new Promise((resolver) => {
    if (!soportaSintesis()) {
      resolver();
      return;
    }

    window.speechSynthesis.cancel();

    const emitir = () => {
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = 'es-MX';
      u.rate = 0.98;
      u.pitch = 1;
      const voz = vozEspanol();
      if (voz) u.voice = voz;
      u.onend = () => resolver();
      u.onerror = () => resolver();
      window.speechSynthesis.speak(u);
    };

    // Las voces se cargan de forma asíncrona la primera vez.
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = emitir;
      // Respaldo por si el evento no dispara.
      setTimeout(emitir, 250);
    } else {
      emitir();
    }
  });
}

/** Detiene cualquier lectura en curso. */
export function callar(): void {
  if (soportaSintesis()) window.speechSynthesis.cancel();
}
