import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  isLanguage,
  translate,
  type Language,
  type TranslationKey,
} from '@/i18n/translations';

const LANGUAGE_STORAGE_KEY = 'iterim_language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  /** Perjungia tarp `lt` <-> `en` ir grąžina naują reikšmę. */
  toggleLanguage: () => Language;
  /** Vertimo funkcija. Naudokite trumpą `t` vardą komponentuose. */
  t: (key: TranslationKey) => string;
  /** Visos palaikomos kalbos — patogu generuoti meniu. */
  supportedLanguages: readonly Language[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getStoredLanguage(): Language | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(raw) ? raw : null;
  } catch {
    return null;
  }
}

function detectBrowserLanguage(): Language | null {
  if (typeof navigator === 'undefined') return null;
  const candidates: string[] = [];
  if (navigator.language) candidates.push(navigator.language);
  if (Array.isArray(navigator.languages)) candidates.push(...navigator.languages);

  for (const candidate of candidates) {
    const short = candidate.toLowerCase().split('-')[0];
    if (isLanguage(short)) return short;
  }
  return null;
}

function applyLanguageAttribute(language: Language) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language;
  }
}

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  /** Pasirinktinai — pvz., kalba iš serverio/vartotojo profilio. */
  initialLanguage?: string;
}) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = getStoredLanguage();
    if (stored) return stored;

    if (isLanguage(initialLanguage)) return initialLanguage;

    const browser = detectBrowserLanguage();
    if (browser) return browser;

    return DEFAULT_LANGUAGE;
  });

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
  }, []);

  const toggleLanguage = useCallback(() => {
    const next: Language = language === 'lt' ? 'en' : 'lt';
    setLanguageState(next);
    return next;
  }, [language]);

  const t = useCallback(
    (key: TranslationKey) => translate(language, key),
    [language],
  );

  // Sinchronizuojam su <html lang="..."> ir localStorage
  useEffect(() => {
    applyLanguageAttribute(language);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignoruojam — pvz., privačios sesijos atveju.
    }
  }, [language]);

  // Jei `initialLanguage` ateina vėliau (pvz., po prisijungimo) ir nieko neišsaugota
  useEffect(() => {
    if (getStoredLanguage()) return;
    if (!isLanguage(initialLanguage)) return;
    setLanguageState(initialLanguage);
  }, [initialLanguage]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, toggleLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
