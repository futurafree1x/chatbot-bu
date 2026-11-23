import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('is a switch named "Dark theme" that is off in the light theme', () => {
    render(<ThemeToggle theme="light" onToggle={() => {}} />);
    const toggle = screen.getByRole('switch', { name: 'Dark theme' });
    expect(toggle).not.toBeChecked();
  });

  it('is on in the dark theme', () => {
    render(<ThemeToggle theme="dark" onToggle={() => {}} />);
    expect(screen.getByRole('switch', { name: 'Dark theme' })).toBeChecked();
  });

  it('calls onToggle when clicked (FR 4.6)', async () => {
    const onToggle = vi.fn();
    render(<ThemeToggle theme="light" onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('can be reached with Tab and used with Enter or Space (NFR-2)', async () => {
    const onToggle = vi.fn();
    render(<ThemeToggle theme="light" onToggle={onToggle} />);

    await userEvent.tab();
    expect(screen.getByRole('switch')).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});
