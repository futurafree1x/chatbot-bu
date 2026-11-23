/**
 * @file Root component of the client. It owns the colour theme. Later steps add the error
 * boundary, the full header, the hash route and the chat view.
 */
import styles from './App.module.css';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import { useTheme } from './hooks/useTheme';

/**
 * Top-level application component.
 *
 * The theme lives here, at the top, so every part of the app shares one setting (FR 4.6, 4.7).
 */
export function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Talk to Jimi Hendrix</h1>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>
      <main className={styles.main}>
        <p>The conversation will appear here.</p>
      </main>
    </div>
  );
}
