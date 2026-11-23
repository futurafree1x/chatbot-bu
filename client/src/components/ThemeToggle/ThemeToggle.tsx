/**
 * @file `ThemeToggle`: the light/dark switch in the header (FR 4.6, NFR-2).
 */
import type { Theme } from '../../hooks/useTheme';
import styles from './ThemeToggle.module.css';

/** Props for {@link ThemeToggle}. */
export interface ThemeToggleProps {
  /** The theme on screen now. */
  theme: Theme;
  /** Called when the user flips the switch. */
  onToggle: () => void;
}

/**
 * A switch that turns the dark theme on and off.
 *
 * It is a native `<button>`, so Tab, Enter and Space work without extra code (NFR-2).
 * `role="switch"` with `aria-checked` makes screen readers say "Dark theme, switch, on/off".
 * The label stays the same in both states; only the on/off state changes, which is the
 * pattern WAI-ARIA recommends for switches.
 *
 * There is no visible text: the sun and moon icons show what it does. `aria-label` still
 * gives it a name for screen readers and voice control (WCAG SC 4.1.2), and `title` shows the
 * same name as a tooltip on hover.
 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark theme"
      title="Dark theme"
      className={styles.toggle}
      onClick={onToggle}
    >
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb}>{isDark ? <MoonIcon /> : <SunIcon />}</span>
      </span>
    </button>
  );
}

/** Sun icon for the light state. Drawn by us, so there are no licence issues (NFR-22). */
function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" className={styles.icon} focusable="false">
      <circle cx="8" cy="8" r="3" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
      </g>
    </svg>
  );
}

/** Crescent moon icon for the dark state. */
function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" className={styles.icon} focusable="false">
      <path d="M10.5 2a6 6 0 1 0 3.5 10A5 5 0 0 1 10.5 2Z" fill="currentColor" />
    </svg>
  );
}
