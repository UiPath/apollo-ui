import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from './clipboard';

describe('copyTextToClipboard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('keeps focus where it was when it falls back to execCommand', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
    // jsdom's select() leaves focus alone; a browser's moves it into the textarea.
    const execCommand = vi.fn(() => {
      document.querySelector('textarea')?.focus();
      return true;
    });
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true });
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    await expect(copyTextToClipboard('a.b')).resolves.toBe(true);

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(document.activeElement).toBe(button);
    expect(document.querySelector('textarea')).toBeNull();
  });
});
