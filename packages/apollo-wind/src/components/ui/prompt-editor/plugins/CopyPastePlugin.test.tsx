import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { act, render, waitFor } from '@testing-library/react';
import {
  $getRoot,
  $selectAll,
  COPY_COMMAND,
  CUT_COMMAND,
  type LexicalEditor,
  PASTE_COMMAND,
} from 'lexical';
import { describe, expect, it, vi } from 'vitest';
import { PromptEditor } from '../prompt-editor';
import type { PromptEditorToken } from '../types';

const EditorCapture = ({ onEditor }: { onEditor: (editor: LexicalEditor) => void }) => {
  const [editor] = useLexicalComposerContext();
  onEditor(editor);
  return null;
};

const pasteText = (editor: LexicalEditor, text: string) => {
  act(() => {
    editor.update(() => $getRoot().selectEnd(), { discrete: true });
    const event = {
      clipboardData: { getData: (type: string) => (type === 'text/plain' ? text : '') },
      preventDefault: () => {},
    } as unknown as ClipboardEvent;
    editor.dispatchCommand(PASTE_COMMAND, event);
  });
};

const copyOrCut = async (
  editor: LexicalEditor,
  command: typeof COPY_COMMAND | typeof CUT_COMMAND
) => {
  // The initial value is seeded after mount.
  await waitFor(() =>
    expect(editor.getEditorState().read(() => $getRoot().getTextContent())).not.toBe('')
  );
  const written = new Map<string, string>();
  act(() => {
    editor.update(() => $selectAll(), { discrete: true });
    const event = {
      clipboardData: { setData: (type: string, data: string) => written.set(type, data) },
      preventDefault: () => {},
    } as unknown as ClipboardEvent;
    editor.dispatchCommand(command, event);
  });
  return written;
};

const renderEditor = (props: Partial<React.ComponentProps<typeof PromptEditor>> = {}) => {
  const onChange = vi.fn();
  let editor: LexicalEditor | undefined;
  render(
    <PromptEditor onChange={onChange} {...props}>
      <EditorCapture
        onEditor={(e) => {
          editor = e;
        }}
      />
    </PromptEditor>
  );
  return { onChange, editor: editor! };
};

const lastTokens = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.calls.at(-1)?.[0] as PromptEditorToken[];

describe('CopyPastePlugin', () => {
  it('pastes an escaped \\{{ … }} as literal text by default', async () => {
    const { onChange, editor } = renderEditor();
    pasteText(editor, String.raw`Pass \{{ vars.x }} on`);
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(lastTokens(onChange)).toEqual([{ type: 'text', value: 'Pass {{ vars.x }} on' }]);
  });

  it('delegates pasted plain text to parseClipboardText', async () => {
    const parseClipboardText = vi.fn((text: string): PromptEditorToken[] => [
      { type: 'text', value: text.toUpperCase() },
    ]);
    const { onChange, editor } = renderEditor({ parseClipboardText });
    pasteText(editor, 'Reply as {{name}}');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(parseClipboardText).toHaveBeenCalledWith('Reply as {{name}}');
    expect(lastTokens(onChange)).toEqual([{ type: 'text', value: 'REPLY AS {{NAME}}' }]);
  });

  it('writes the host serializer output on copy', async () => {
    const serializeClipboardTokens = vi.fn(() => 'HOST FORMAT');
    const { editor } = renderEditor({
      initialValue: [{ type: 'text', value: 'Hello' }],
      serializeClipboardTokens,
    });
    const written = await copyOrCut(editor, COPY_COMMAND);
    expect(serializeClipboardTokens).toHaveBeenCalledWith([{ type: 'text', value: 'Hello' }]);
    expect(written.get('text/plain')).toBe('HOST FORMAT');
  });

  it('writes the host serializer output on cut and removes the selection', async () => {
    const { editor } = renderEditor({
      initialValue: [{ type: 'text', value: 'Hello' }],
      serializeClipboardTokens: () => 'HOST FORMAT',
    });
    const written = await copyOrCut(editor, CUT_COMMAND);
    expect(written.get('text/plain')).toBe('HOST FORMAT');
    expect(editor.getEditorState().read(() => $getRoot().getTextContent())).toBe('');
  });
});
