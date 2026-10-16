import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// What `useEditor` can hand back after the editor it created was destroyed (for example when a
// suspended tree remounts): the instance is still there, its schema is not.
const destroyedEditor = {
  schema: null,
  getText: () => {
    throw new TypeError("Cannot read properties of null (reading 'nodes')");
  },
  commands: { setContent: vi.fn() },
};

vi.mock('@tiptap/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tiptap/react')>()),
  useEditor: () => destroyedEditor,
  EditorContent: () => null,
}));

const { TipTapEditor } = await import('./tiptap-editor');

describe('TipTapEditor', () => {
  it('does not sync its value into a destroyed editor', () => {
    expect(() => render(<TipTapEditor value="hello" />)).not.toThrow();
    expect(destroyedEditor.commands.setContent).not.toHaveBeenCalled();
  });
});
