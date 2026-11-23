import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from './useTheme';

/**
 * Replaces `window.matchMedia` (jsdom doesn't have one) with a fake OS setting that tests can
 * flip, firing a `change` event like a real browser does.
 */
function fakeDeviceSetting(startDark: boolean) {
  let dark = startDark;
  const listeners = new Set<() => void>();
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({
        media: query,
        get matches() {
          return dark;
        },
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      }) as unknown as MediaQueryList,
  );
  return {
    setDark(value: boolean) {
      dark = value;
      listeners.forEach((listener) => listener());
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

describe('useTheme', () => {
  it('starts dark when the device is set to dark (FR 4.7)', () => {
    fakeDeviceSetting(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('starts light when the device is set to light (FR 4.7)', () => {
    fakeDeviceSetting(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('falls back to light when the browser cannot report a setting', () => {
    vi.stubGlobal('matchMedia', undefined);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
  });

  it('switches theme each time it is toggled (FR 4.6)', () => {
    fakeDeviceSetting(false);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('follows the device setting live until the user toggles', () => {
    const device = fakeDeviceSetting(false);
    const { result } = renderHook(() => useTheme());

    act(() => device.setDark(true));
    expect(result.current.theme).toBe('dark');

    act(() => result.current.toggleTheme());
    act(() => device.setDark(false));
    act(() => device.setDark(true));
    expect(result.current.theme).toBe('light');
  });

  it('never writes the choice to browser storage (NFR-23)', () => {
    fakeDeviceSetting(false);
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggleTheme());
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
