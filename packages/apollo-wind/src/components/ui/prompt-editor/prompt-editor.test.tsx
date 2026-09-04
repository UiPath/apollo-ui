import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { VARIABLE_DRAG_MIME } from './plugins/VariableDropPlugin';
import { PromptEditor, type PromptEditorRef } from './prompt-editor';
import {
  getPromptEditorTokenColors,
  type PromptEditorAutoCompleteOption,
  type PromptEditorMode,
  type PromptEditorToken,
} from './types';

const OPTIONS: PromptEditorAutoCompleteOption[] = [
  { type: 'input', value: 'vars.firstName' },
  { type: 'output', value: 'vars.result' },
];

describe('PromptEditor', () => {
  it('uses semantic info and error tokens for token colors', () => {
    expect(getPromptEditorTokenColors()).toEqual({
      valid: {
        background: 'var(--color-info-background)',
        border: 'var(--color-info-icon)',
        text: 'var(--color-info-text)',
        icon: 'var(--color-info-icon)',
      },
      invalid: {
        background: 'var(--color-error-background)',
        border: 'var(--color-error-icon)',
        text: 'var(--color-error-text)',
        icon: 'var(--color-error-icon)',
      },
    });
  });

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

    it('associates inline validation feedback with the textbox', () => {
      render(
        <PromptEditor
          ariaLabel="Prompt"
          error="A prompt is required"
          errorId="prompt-error"
          aria-describedby="prompt-help"
        />
      );
      const editor = screen.getByRole('textbox', { name: 'Prompt' });
      expect(editor).toHaveAttribute('aria-invalid', 'true');
      expect(editor).toHaveAttribute('aria-describedby', 'prompt-help prompt-error');
      expect(editor).toHaveAttribute('aria-errormessage', 'prompt-error');
      expect(screen.getByText('A prompt is required')).toHaveAttribute('id', 'prompt-error');
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

    it('keeps validation styling visible in preview mode', () => {
      const { container } = render(
        <PromptEditor mode="preview" error="A prompt is required" errorId="prompt-error" />
      );
      const invalidPreview = container.querySelector('[data-invalid="true"]');
      expect(invalidPreview).toHaveClass('border-error', 'ring-1');
      expect(screen.getByText('A prompt is required')).toBeInTheDocument();
    });

    it('applies validation styling to the toolbar', () => {
      render(
        <PromptEditor
          mode="preview"
          showToolbar
          error="A prompt is required"
          errorId="prompt-error"
        />
      );
      expect(screen.getByTestId('editor-toolbar')).toHaveClass('border-error', 'ring-1');
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

  describe('variable drag-drop', () => {
    const mapVarDropToToken = (path: string): PromptEditorAutoCompleteOption => ({
      type: 'input',
      value: path,
    });

    it('mounts with mapVarDropToToken (drag-drop enabled) without throwing', () => {
      expect(() =>
        render(<PromptEditor ariaLabel="Prompt" mapVarDropToToken={mapVarDropToToken} />)
      ).not.toThrow();
      expect(screen.getByRole('textbox', { name: 'Prompt' })).toBeInTheDocument();
    });

    it('mounts the drop plugin and inserts a token when a variable is dropped', async () => {
      // Guards the prop wiring: if mapVarDropToToken weren't threaded through to EditorInner, the
      // VariableDropPlugin would never mount and this drop would do nothing. jsdom lacks
      // caretPositionFromPoint, so the drop falls back to inserting at the end of the editor.
      const onChange = vi.fn();
      render(
        <PromptEditor
          ariaLabel="Prompt"
          mapVarDropToToken={mapVarDropToToken}
          onChange={onChange}
        />
      );
      const editor = screen.getByRole('textbox', { name: 'Prompt' });

      const dataTransfer = {
        types: [VARIABLE_DRAG_MIME],
        getData: (type: string) => (type === VARIABLE_DRAG_MIME ? 'state.retryCount' : ''),
        dropEffect: 'none',
      };
      const dropEvent = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
      Object.defineProperty(dropEvent, 'clientX', { value: 0 });
      Object.defineProperty(dropEvent, 'clientY', { value: 0 });
      editor.dispatchEvent(dropEvent);

      await waitFor(() => expect(onChange).toHaveBeenCalled());
      const lastTokens = onChange.mock.calls.at(-1)?.[0] as PromptEditorToken[];
      expect(lastTokens.some((t) => t.type === 'input' && t.value === 'state.retryCount')).toBe(
        true
      );
    });
  });

  describe('extension points', () => {
    it('hides the Edit/Preview switcher with showModeToggle=false and keeps formatting enabled', () => {
      render(<PromptEditor showToolbar showModeToggle={false} />);
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Preview' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Bold' })).toBeEnabled();
    });

    it('never enters preview mode when showModeToggle=false, even with mode="preview"', () => {
      render(
        <PromptEditor
          showToolbar
          showModeToggle={false}
          mode="preview"
          value={[{ type: 'text', value: '# Hi' }]}
          ariaLabel="Prompt"
        />
      );
      // The editor (not the markdown preview) renders.
      expect(screen.getByRole('textbox', { name: 'Prompt' })).toBeInTheDocument();
    });

    it('renders toolbarTrailing at the toolbar right end', () => {
      render(
        <PromptEditor
          showToolbar
          showModeToggle={false}
          toolbarTrailing={<button type="button">T-mode</button>}
        />
      );
      const toolbar = screen.getByTestId('editor-toolbar');
      expect(toolbar).toContainElement(screen.getByRole('button', { name: 'T-mode' }));
    });

    it('applies overridden strings to toolbar labels', () => {
      render(
        <PromptEditor
          showToolbar
          strings={{
            bold: 'Fett',
            edit: 'Bearbeiten',
            numberedList: 'Nummerierte Liste',
          }}
        />
      );
      expect(screen.getByRole('button', { name: 'Fett' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Nummerierte Liste' })).toBeInTheDocument();
      // Unspecified keys keep the built-in English.
      expect(screen.getByRole('button', { name: 'Italic' })).toBeInTheDocument();
    });

    it('renders token pills through renderTokenPill', async () => {
      const initialValue: PromptEditorToken[] = [{ type: 'input', value: 'vars.firstName' }];
      render(
        <PromptEditor
          ariaLabel="Prompt"
          initialValue={initialValue}
          renderTokenPill={({ value, tokenType }) => (
            <span data-testid="custom-pill">
              {tokenType}:{value}
            </span>
          )}
        />
      );
      await waitFor(() =>
        expect(screen.getByTestId('custom-pill')).toHaveTextContent('input:vars.firstName')
      );
    });

    it('mounts the $-trigger flow with renderAutocompleteMenu even without options', () => {
      const renderMenu = vi.fn().mockReturnValue(null);
      render(<PromptEditor ariaLabel="Prompt" renderAutocompleteMenu={renderMenu} />);
      expect(renderMenu).toHaveBeenCalled();
      const props = renderMenu.mock.calls.at(-1)?.[0];
      expect(props).toMatchObject({ open: false, options: [] });
      expect(typeof props.onSelect).toBe('function');
      expect(typeof props.onClose).toBe('function');
    });

    it('validates chips against validationOptions instead of autoCompleteOptions', async () => {
      const seen: Array<{ value: string; isInvalid?: boolean }> = [];
      render(
        <PromptEditor
          ariaLabel="Prompt"
          initialValue={[
            { type: 'input', value: 'vars.firstName' },
            { type: 'input', value: 'vars.records[2].id' },
            { type: 'input', value: 'vars.notInEitherSet' },
          ]}
          autoCompleteOptions={[]}
          validationOptions={[
            { type: 'input', value: 'vars.firstName' },
            { type: 'input', value: 'vars.records[0].id' },
          ]}
          renderTokenPill={(pill) => {
            seen.push({ value: pill.value, isInvalid: pill.isInvalid });
            return (
              <span data-testid={`pill-${pill.value}`}>{String(Boolean(pill.isInvalid))}</span>
            );
          }}
        />
      );
      // Valid: exact match. Valid: index-normalized match. Invalid: in neither set.
      await waitFor(() => {
        expect(screen.getByTestId('pill-vars.firstName')).toHaveTextContent('false');
        expect(screen.getByTestId('pill-vars.records[2].id')).toHaveTextContent('false');
        expect(screen.getByTestId('pill-vars.notInEitherSet')).toHaveTextContent('true');
      });
    });

    it('mounts extra Lexical plugins passed as children inside the composer', () => {
      const Probe = () => <div data-testid="extra-plugin" />;
      render(
        <PromptEditor ariaLabel="Prompt">
          <Probe />
        </PromptEditor>
      );
      expect(screen.getByTestId('extra-plugin')).toBeInTheDocument();
    });
  });

  describe('focus chrome', () => {
    it('wraps toolbar + body in a focus frame when the toolbar is shown', () => {
      const { container } = render(<PromptEditor ariaLabel="Prompt" showToolbar />);
      expect(container.querySelector('.prompt-editor-frame')).not.toBeNull();
      // The focus ring targets the FRAME (one ring around toolbar + body); a shell-only ring drew
      // its top edge as a stray line under the toolbar.
      const css = [...container.querySelectorAll('style')].map((st) => st.textContent).join('');
      expect(css).toContain('.prompt-editor-frame:not([data-invalid="true"]):focus-within');
      expect(css).not.toContain('.prompt-editor-shell:not([data-invalid="true"]):focus-within {');
    });

    it('keeps the shell-based focus ring when there is no toolbar', () => {
      const { container } = render(<PromptEditor ariaLabel="Prompt" />);
      expect(container.querySelector('.prompt-editor-frame')).toBeNull();
      const css = [...container.querySelectorAll('style')].map((st) => st.textContent).join('');
      expect(css).toContain('.prompt-editor-shell:not([data-invalid="true"]):focus-within');
    });
  });

  describe('rich (WYSIWYG) mode', () => {
    it('renders markdown text tokens as formatted content while editing', async () => {
      render(
        <PromptEditor
          ariaLabel="Body"
          richText
          initialValue={[{ type: 'text', value: 'a **bold** word' }]}
        />
      );
      await waitFor(() => {
        const bold = document.querySelector('.prompt-editor-text-bold');
        expect(bold).not.toBeNull();
        expect(bold).toHaveTextContent('bold');
      });
      // The markers themselves are not visible content.
      expect(screen.getByRole('textbox', { name: 'Body' }).textContent).not.toContain('**');
    });

    it('renders list markdown as real list elements', async () => {
      render(
        <PromptEditor
          ariaLabel="Body"
          richText
          initialValue={[{ type: 'text', value: '- one\n- two' }]}
        />
      );
      await waitFor(() => {
        const list = document.querySelector('ul.prompt-editor-list-ul');
        expect(list).not.toBeNull();
        expect(list?.querySelectorAll('li')).toHaveLength(2);
      });
    });

    it('emits unchanged markdown tokens through setTokens → onChange (round trip)', async () => {
      const onChange = vi.fn();
      const ref = createRef<PromptEditorRef>();
      const tokens: PromptEditorToken[] = [
        { type: 'text', value: '**Hello** ' },
        { type: 'input', value: 'vars.firstName' },
        { type: 'text', value: '\n- a\n- b' },
      ];
      render(<PromptEditor ariaLabel="Body" richText editorRef={ref} onChange={onChange} />);
      act(() => {
        ref.current?.setTokens(tokens);
      });
      await waitFor(() => expect(onChange).toHaveBeenCalled());
      expect(onChange.mock.calls.at(-1)?.[0]).toEqual(tokens);
    });

    it('never renders the Edit/Preview switcher or the markdown preview', () => {
      render(
        <PromptEditor
          ariaLabel="Body"
          richText
          showToolbar
          mode="preview"
          value={[{ type: 'text', value: '# Hi' }]}
        />
      );
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Preview' })).not.toBeInTheDocument();
      // The editor renders (preview mode is inert in rich mode).
      expect(screen.getByRole('textbox', { name: 'Body' })).toBeInTheDocument();
    });

    it('marks toolbar formatting buttons with aria-pressed in rich mode', () => {
      render(<PromptEditor ariaLabel="Body" richText showToolbar />);
      expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: 'Bulleted List' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    it('falls back to the plain editor (with a warning) when multiline is false', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <PromptEditor
          ariaLabel="Body"
          richText
          multiline={false}
          initialValue={[{ type: 'text', value: '**b**' }]}
        />
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('richText requires multiline'));
      expect(document.querySelector('.prompt-editor-text-bold')).toBeNull();
      warn.mockRestore();
    });
  });
});
