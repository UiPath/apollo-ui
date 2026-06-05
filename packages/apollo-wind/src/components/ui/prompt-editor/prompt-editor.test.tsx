import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PromptEditor, type PromptEditorRef } from './prompt-editor';
import type { PromptEditorAutoCompleteOption, PromptEditorMode, PromptEditorToken } from './types';

const OPTIONS: PromptEditorAutoCompleteOption[] = [
  { type: 'input', value: 'vars.firstName' },
  { type: 'output', value: 'vars.result' },
];

describe('PromptEditor', () => {
  describe('rendering', () => {
    it('renders an editable textbox with the given aria-label', () => {
      render(<PromptEditor ariaLabel="Prompt" />);
      const editor = screen.getByRole('textbox', { name: 'Prompt' });
      expect(editor).toBeInTheDocument();
      expect(editor).toHaveAttribute('contenteditable', 'true');
    });

    it('shows the placeholder while empty', () => {
      render(<PromptEditor placeholder="Type your prompt…" />);
      expect(screen.getByText('Type your prompt…')).toBeInTheDocument();
    });

    it('marks the editor non-editable when disabled', async () => {
      render(<PromptEditor ariaLabel="Prompt" disabled />);
      await waitFor(() =>
        expect(screen.getByRole('textbox', { name: 'Prompt' })).toHaveAttribute(
          'contenteditable',
          'false'
        )
      );
    });
  });

  describe('toolbar', () => {
    it('renders the formatting toolbar when showToolbar is set', () => {
      render(<PromptEditor showToolbar />);
      expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Numbered List' })).toBeInTheDocument();
    });

    it('does not render the toolbar by default', () => {
      render(<PromptEditor />);
      expect(screen.queryByTestId('editor-toolbar')).not.toBeInTheDocument();
    });

    it('switches to preview mode via the toolbar (controlled value, uncontrolled mode)', async () => {
      const user = userEvent.setup();
      const value: PromptEditorToken[] = [{ type: 'text', value: '# Heading' }];
      render(<PromptEditor showToolbar value={value} />);
      await user.click(screen.getByRole('button', { name: 'Preview' }));
      const heading = await screen.findByText('Heading');
      expect(heading.tagName.toLowerCase()).toBe('h1');
    });

    it('toggles edit↔preview in controlled mode via the toolbar', async () => {
      const user = userEvent.setup();
      const ControlledMode = () => {
        const [mode, setMode] = useState<PromptEditorMode>('edit');
        return (
          <PromptEditor
            showToolbar
            mode={mode}
            onModeChange={setMode}
            value={[{ type: 'text', value: '# Hi' }]}
          />
        );
      };
      const { container } = render(<ControlledMode />);
      // edit mode: no preview pane
      expect(container.querySelector('.prompt-editor-preview')).toBeNull();
      // → preview
      await user.click(screen.getByRole('button', { name: 'Preview' }));
      await waitFor(() => expect(container.querySelector('.prompt-editor-preview')).not.toBeNull());
      // → back to edit
      await user.click(screen.getByRole('button', { name: 'Edit' }));
      await waitFor(() => expect(container.querySelector('.prompt-editor-preview')).toBeNull());
    });
  });

  describe('preview', () => {
    it('renders markdown from controlled tokens', () => {
      const value: PromptEditorToken[] = [{ type: 'text', value: '**bold**' }];
      render(<PromptEditor value={value} mode="preview" />);
      const strong = screen.getByText('bold');
      expect(strong.tagName.toLowerCase()).toBe('strong');
    });

    it('renders a variable token as a pill in preview', () => {
      const value: PromptEditorToken[] = [{ type: 'input', value: 'vars.firstName' }];
      render(<PromptEditor value={value} mode="preview" />);
      expect(screen.getByText('vars.firstName')).toBeInTheDocument();
    });

    it('shows the empty message when there are no tokens', () => {
      render(<PromptEditor value={[]} mode="preview" />);
      expect(screen.getByText('Nothing to preview')).toBeInTheDocument();
    });
  });

  describe('tokens', () => {
    it('mounts with an initial variable token without throwing', () => {
      const initialValue: PromptEditorToken[] = [
        { type: 'text', value: 'Hi ' },
        { type: 'input', value: 'vars.firstName' },
      ];
      expect(() =>
        render(<PromptEditor ariaLabel="Prompt" initialValue={initialValue} />)
      ).not.toThrow();
      // Token→pill rendering is asserted in the preview tests; Lexical decorator painting is not
      // reliable under jsdom, so here we only assert the editor mounts with the seeded value.
      expect(screen.getByRole('textbox', { name: 'Prompt' })).toBeInTheDocument();
    });

    it('exposes an imperative ref without throwing', () => {
      const ref = createRef<PromptEditorRef>();
      render(<PromptEditor ariaLabel="Prompt" editorRef={ref} autoCompleteOptions={OPTIONS} />);
      expect(ref.current).toBeTruthy();
      expect(() => ref.current?.insertVariableToken(OPTIONS[0])).not.toThrow();
    });
  });

  it('mounts cleanly with autocomplete options enabled', () => {
    const onChange = vi.fn();
    expect(() =>
      render(<PromptEditor ariaLabel="Prompt" autoCompleteOptions={OPTIONS} onChange={onChange} />)
    ).not.toThrow();
    expect(screen.getByRole('textbox', { name: 'Prompt' })).toBeInTheDocument();
  });

  it('tolerates a non-array autoCompleteOptions without crashing', () => {
    // Storybook's "Set object" control can inject `{}` for the autoCompleteOptions arg; the token
    // plugins must not iterate a non-iterable and throw. The editor should still render.
    const malformed = {} as unknown as PromptEditorAutoCompleteOption[];
    expect(() =>
      render(<PromptEditor ariaLabel="Prompt" autoCompleteOptions={malformed} />)
    ).not.toThrow();
    expect(screen.getByRole('textbox', { name: 'Prompt' })).toBeInTheDocument();
  });

  it('tolerates a non-array value/initialValue without crashing (edit + preview)', () => {
    const badTokens = {} as unknown as PromptEditorToken[];
    // edit mode, controlled value
    expect(() => render(<PromptEditor ariaLabel="Prompt" value={badTokens} />)).not.toThrow();
    expect(screen.getByRole('textbox', { name: 'Prompt' })).toBeInTheDocument();
    // preview mode treats the malformed value as empty rather than rendering junk
    const { getByText } = render(
      <PromptEditor value={badTokens} initialValue={badTokens} mode="preview" />
    );
    expect(getByText('Nothing to preview')).toBeInTheDocument();
  });
});
