import { describe, expect, it } from 'vitest';
import tokensCss from './tokens.css?raw';

/**
 * NFR-1 / WCAG 2.2 AA contrast check for the theme tokens, in both themes.
 * - SC 1.4.3: text needs at least 4.5:1 against its background.
 * - SC 1.4.11: borders and focus rings need at least 3:1 against what is next to them.
 */

type Scheme = 'light' | 'dark';

/** Reads every `--name: light-dark(#light, #dark);` token out of tokens.css. */
function readTokens(css: string): Map<string, Record<Scheme, string>> {
  const tokens = new Map<string, Record<Scheme, string>>();
  const pattern = /--([\w-]+):\s*light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)/gi;
  for (const [, name, light, dark] of css.matchAll(pattern)) {
    tokens.set(name, { light, dark });
  }
  return tokens;
}

/** WCAG relative luminance of a 6-digit hex colour. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colours, from 1 to 21. */
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT = 4.5;
const NON_TEXT = 3;

/** [foreground token, background token, minimum ratio] for every pairing the UI uses. */
const PAIRS: [string, string, number][] = [
  ['color-text', 'color-surface', TEXT],
  ['color-text', 'color-surface-alt', TEXT],
  ['color-text-muted', 'color-surface', TEXT],
  ['color-text-muted', 'color-surface-alt', TEXT],
  ['color-error', 'color-surface', TEXT],
  ['color-accent', 'color-surface', TEXT],
  ['color-on-accent', 'color-accent', TEXT],
  ['color-on-header', 'color-header-bg', TEXT],
  ['color-on-user-bubble', 'color-user-bubble', TEXT],
  ['color-border', 'color-surface', NON_TEXT],
  ['color-focus', 'color-surface', NON_TEXT],
  ['color-focus', 'color-surface-alt', NON_TEXT],
  ['color-focus', 'color-header-bg', NON_TEXT],
  ['color-focus', 'color-page-bg', NON_TEXT],
];

const tokens = readTokens(tokensCss);

describe('theme tokens', () => {
  it('defines every token the contrast checks use', () => {
    const missing = PAIRS.flatMap(([fg, bg]) => [fg, bg]).filter((name) => !tokens.has(name));
    expect(missing).toEqual([]);
  });

  describe.each<Scheme>(['light', 'dark'])('%s theme', (scheme) => {
    it.each(PAIRS)('%s on %s is at least %s:1', (fg, bg, minimum) => {
      const ratio = contrast(tokens.get(fg)![scheme], tokens.get(bg)![scheme]);
      expect(ratio).toBeGreaterThanOrEqual(minimum);
    });
  });
});
