import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe('App', () => {
  it('renders the page heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Talk to Jimi Hendrix' })).toBeVisible();
  });

  it('switches the whole page theme from the toggle (FR 4.6)', async () => {
    render(<App />);
    expect(document.documentElement.dataset.theme).toBe('light');

    await userEvent.click(screen.getByRole('switch', { name: 'Dark theme' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
