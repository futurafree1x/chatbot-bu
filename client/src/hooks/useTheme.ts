/**
 * @file `useTheme`: which colour theme is showing, and a function to switch it (FR 4.6, FR 4.7).
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

/** The two colour themes. */
export type Theme = 'light' | 'dark';

/** What {@link useTheme} gives the component that calls it. */
export interface ThemeControls {
  /** The theme on screen now. */
  theme: Theme;
  /** Switches to the other theme. */
  toggleTheme: () => void;
}

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** The OS "dark mode" media query, or `undefined` where the browser can't report it. */
function darkQuery(): MediaQueryList | undefined {
  return typeof window.matchMedia === 'function' ? window.matchMedia(DARK_QUERY) : undefined;
}

/**
 * Tells React when the device setting changes, so the theme follows it live.
 * @param onChange - React's callback to re-read the setting.
 */
function subscribe(onChange: () => void): () => void {
  const query = darkQuery();
  query?.addEventListener('change', onChange);
  return () => query?.removeEventListener('change', onChange);
}

/** The device's current setting. Light when the browser can't tell us. */
function getDeviceTheme(): Theme {
  return darkQuery()?.matches ? 'dark' : 'light';
}

/**
 * Tracks the colour theme.
 *
 * - It starts from the device's light/dark setting (FR 4.7) and follows it if it changes.
 * - `toggleTheme` overrides the device setting (FR 4.6).
 * - The override lives in React state only, so a refresh goes back to the device setting.
 *   Nothing is written to browser storage (NFR-23).
 *
 * It also sets `data-theme` on <html>, which tokens.css uses to switch every colour.
 */
export function useTheme(): ThemeControls {
  const deviceTheme = useSyncExternalStore(subscribe, getDeviceTheme);
  const [override, setOverride] = useState<Theme | null>(null);
  const theme = override ?? deviceTheme;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setOverride(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  return { theme, toggleTheme };
}
