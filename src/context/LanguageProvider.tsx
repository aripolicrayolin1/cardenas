'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  LANG_STORAGE_KEY,
  translations,
  type Language,
  type TranslationKey,
} from '@/config/translations';

/**
 * @fileOverview Estado global del idioma.
 *
 * ANTES: `useTranslation()` guardaba el idioma en un `useState` LOCAL, por lo
 * que cada componente tenía su propia copia. Pulsar "CAMBIAR A HÑÄHÑU" en el
 * sidebar sólo cambiaba el sidebar; el resto de la página seguía en español
 * hasta recargar. La función bilingüe, que es el diferenciador del proyecto,
 * estaba rota.
 *
 * AHORA: un único proveedor en `app/layout.tsx` mantiene el idioma y todos los
 * componentes lo comparten. Un cambio repinta la aplicación entera.
 */

interface LanguageContextValue {
  lang: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  /** `false` hasta que se lee `localStorage`. Útil para evitar parpadeos. */
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const IDIOMA_POR_DEFECTO: Language = 'es';

function esIdiomaValido(valor: unknown): valor is Language {
  return valor === 'es' || valor === 'hn';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // El servidor y el primer render del cliente usan siempre el idioma por
  // defecto: así el HTML coincide y no hay error de hidratación. La preferencia
  // guardada se aplica justo después, en un efecto.
  const [lang, setLang] = useState<Language>(IDIOMA_POR_DEFECTO);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (esIdiomaValido(guardado)) {
        setLang(guardado);
      }
    } catch {
      // localStorage puede fallar en modo privado o con cookies bloqueadas.
      // No es motivo para romper la app: nos quedamos con el idioma por defecto.
    } finally {
      setReady(true);
    }
  }, []);

  // Mantiene sincronizado el atributo `lang` del <html> con el idioma elegido:
  // lectores de pantalla y traductores automáticos se apoyan en él.
  // `ote` es el código ISO 639-3 del otomí del Valle del Mezquital.
  useEffect(() => {
    document.documentElement.lang = lang === 'hn' ? 'ote' : 'es';
  }, [lang]);

  const setLanguage = useCallback((siguiente: Language) => {
    setLang(siguiente);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, siguiente);
    } catch {
      // Persistir es best-effort: el cambio en memoria ya surtió efecto.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(lang === 'es' ? 'hn' : 'es');
  }, [lang, setLanguage]);

  const t = useCallback(
    (key: TranslationKey) => {
      if (!key) return '';
      // Si falta la traducción en hñähñu, caemos al español antes que mostrar
      // la clave cruda al agricultor.
      return translations[lang][key] || translations.es[key] || '';
    },
    [lang]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLanguage, toggleLanguage, t, ready }),
    [lang, setLanguage, toggleLanguage, t, ready]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage debe usarse dentro de <LanguageProvider>.');
  }

  return context;
}
