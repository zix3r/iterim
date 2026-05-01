import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'iterim_theme';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function normalizeTheme(value: unknown): Theme | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return isTheme(normalized) ? normalized : null;
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

function applyThemeClass(theme: Theme): Theme {
  const resolved = theme;

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  }

  return resolved;
}

export function ThemeProvider({ children, serverTheme }: { children: ReactNode; serverTheme?: string }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getStoredTheme();
    if (stored) return stored;

    const normalizedServerTheme = normalizeTheme(serverTheme);
    if (normalizedServerTheme) return normalizedServerTheme;

    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => applyThemeClass(theme));

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
    return nextTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    const resolved = applyThemeClass(theme);
    setResolvedTheme(resolved);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors in private browsing or restricted environments.
    }
  }, [theme]);

  useEffect(() => {
    if (getStoredTheme()) return;

    const normalizedServerTheme = normalizeTheme(serverTheme);
    if (!normalizedServerTheme) return;

    setThemeState(normalizedServerTheme);
  }, [serverTheme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  }), [theme, resolvedTheme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
