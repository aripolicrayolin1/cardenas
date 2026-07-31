'use client';

import { useLanguage } from '@/context/LanguageProvider';

export type { Language, TranslationKey } from '@/config/translations';

/**
 * Acceso a las traducciones.
 *
 * Mantiene la misma firma que la versión anterior — `{ t, lang, toggleLanguage }` —
 * para que los componentes que ya lo usaban no necesiten cambios. La diferencia
 * está debajo: el idioma ahora vive en un contexto compartido
 * ({@link useLanguage}) en lugar de un `useState` por componente.
 */
export function useTranslation() {
  const { t, lang, toggleLanguage, setLanguage, ready } = useLanguage();
  return { t, lang, toggleLanguage, setLanguage, ready };
}
