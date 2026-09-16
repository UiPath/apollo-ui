import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PromptEditor } from '../prompt-editor';

const hostKeyDown = vi.fn();

// Lexical binds these to Cmd on Apple and Ctrl everywhere else, and the plugin mirrors
// that exactly, so the test has to press whatever this platform's chord actually is.
const MODIFIER = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
  ? { metaKey: true }
  : { ctrlKey: true };

function renderEditor(props: { richText?: boolean } = {}) {
  render(
    <PromptEditor ariaLabel="Body" initialValue={[{ type: 'text', value: 'text' }]} {...props} />
  );
  document.addEventListener('keydown', hostKeyDown);
  return screen.getByRole('textbox', { name: 'Body' });
}

afterEach(() => {
  document.removeEventListener('keydown', hostKeyDown);
  hostKeyDown.mockClear();
});

describe('ShortcutContainmentPlugin', () => {
  it.each([
    'b',
    'i',
    'u',
  ])('swallows the %s formatting chord in rich mode so the host never sees it', async (key) => {
    const editor = renderEditor({ richText: true });
    await waitFor(() => expect(editor.textContent).toContain('text'));

    fireEvent.keyDown(editor, { key, ...MODIFIER });

    expect(hostKeyDown).not.toHaveBeenCalled();
  });

  it('still lets Lexical consume the chord it swallows', async () => {
    const editor = renderEditor({ richText: true });
    await waitFor(() => expect(editor.textContent).toContain('text'));

    const event = new KeyboardEvent('keydown', {
      key: 'b',
      ...MODIFIER,
      bubbles: true,
      cancelable: true,
    });
    editor.dispatchEvent(event);

    // Lexical preventDefaults the chords it formats with. Seeing that here proves our
    // listener returned false and the default handler still ran after it.
    expect(event.defaultPrevented).toBe(true);
    expect(hostKeyDown).not.toHaveBeenCalled();
  });

  it('lets chords the editor does not consume reach the host', async () => {
    const editor = renderEditor({ richText: true });
    await waitFor(() => expect(editor.textContent).toContain('text'));

    fireEvent.keyDown(editor, { key: 'a', ...MODIFIER });
    fireEvent.keyDown(editor, { key: 's', ...MODIFIER });

    expect(hostKeyDown).toHaveBeenCalledTimes(2);
  });

  it('leaves the chords alone in plain mode, which applies none of these formats', async () => {
    const editor = renderEditor();
    await waitFor(() => expect(editor.textContent).toContain('text'));

    fireEvent.keyDown(editor, { key: 'b', ...MODIFIER });

    expect(hostKeyDown).toHaveBeenCalledTimes(1);
  });
});
