import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle } from '../dialog';
import { VARIABLE_DRAG_MIME } from './plugins/VariableDropPlugin';
import { PromptEditor } from './prompt-editor';
import type { PromptEditorAutoCompleteOption, PromptEditorMode, PromptEditorToken } from './types';
import { tokensToClipboardString } from './utils';

const meta = {
  title: 'Components/UiPath/Prompt Editor',
  component: PromptEditor,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  // Token arrays + options are editable as JSON object controls; the component normalizes malformed
  // input so a stray "Set object" can't crash it. Functions/refs have no meaningful control.
  argTypes: {
    value: { control: 'object' },
    initialValue: { control: 'object' },
    autoCompleteOptions: { control: 'object' },
    onChange: { control: false },
    onModeChange: { control: false },
    onFullscreen: { control: false },
    editorRef: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PromptEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const AUTOCOMPLETE_OPTIONS: PromptEditorAutoCompleteOption[] = [
  { type: 'input', value: 'vars.firstName' },
  { type: 'input', value: 'vars.lastName' },
  { type: 'output', value: 'vars.summary' },
  { type: 'state', value: 'state.retryCount' },
  { type: 'resource', value: 'resource.knowledgeBase' },
];

const SAMPLE_VALUE: PromptEditorToken[] = [
  { type: 'text', value: 'Greet ' },
  { type: 'input', value: 'vars.firstName' },
  { type: 'text', value: ' and summarize the request into ' },
  { type: 'output', value: 'vars.summary' },
  { type: 'text', value: '.' },
];

export const Default: Story = {
  args: {
    placeholder: 'Write your prompt…',
    ariaLabel: 'Prompt',
  },
};

export const WithInlineValidation: Story = {
  name: 'With inline validation',
  args: {
    placeholder: 'Write your prompt…',
    ariaLabel: 'Prompt',
    error: 'Enter a prompt before continuing.',
  },
};

export const SingleLine: Story = {
  args: {
    multiline: false,
    placeholder: 'Single-line prompt…',
    ariaLabel: 'Prompt',
  },
};

export const WithTokens: Story = {
  args: {
    initialValue: SAMPLE_VALUE,
    autoCompleteOptions: AUTOCOMPLETE_OPTIONS,
    ariaLabel: 'Prompt',
  },
};

export const WithToolbar: Story = {
  args: {
    showToolbar: true,
    initialValue: SAMPLE_VALUE,
    autoCompleteOptions: AUTOCOMPLETE_OPTIONS,
    ariaLabel: 'Prompt',
  },
};

/**
 * Expandable toolbar: the Expand button renders only when `onFullscreen` is supplied, and sits
 * beside the mode toggle at the right end. Expanding is the host's job: the editor only reports
 * the click, so this story stands in a modal where a host would mount its own fullscreen surface.
 */
export const WithFullscreen: Story = {
  render: () => {
    const FullscreenExample = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <PromptEditor
            showToolbar
            ariaLabel="Prompt"
            initialValue={SAMPLE_VALUE}
            autoCompleteOptions={AUTOCOMPLETE_OPTIONS}
            onFullscreen={() => setOpen(true)}
          />
          <Modal open={open} onOpenChange={setOpen}>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Fullscreen view shown here</ModalTitle>
                <ModalDescription>
                  `onFullscreen` fired. A host renders its own fullscreen editor at this point.
                </ModalDescription>
              </ModalHeader>
            </ModalContent>
          </Modal>
        </>
      );
    };
    return <FullscreenExample />;
  },
};

/**
 * Widget-style toolbar: no Edit/Preview switcher, formatting cluster left-aligned, and a
 * consumer-supplied control (here a "T" value-mode button) right-aligned via `toolbarTrailing`.
 */
export const WithTrailingModeControl: Story = {
  args: {
    showToolbar: true,
    showModeToggle: false,
    toolbarTrailing: (
      <button
        type="button"
        aria-label="Value mode"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--color-muted-foreground)',
        }}
      >
        T
      </button>
    ),
    initialValue: SAMPLE_VALUE,
    autoCompleteOptions: AUTOCOMPLETE_OPTIONS,
    ariaLabel: 'Body',
  },
};

/**
 * WYSIWYG mode: formatting renders live while editing (real bold/underline/strike, inline code and
 * lists, no Edit/Preview switcher: the editor IS the preview). Text tokens still carry markdown;
 * try typing `**bold**`, `` `code` `` or `- `. Underline is offered only here, and persists as `<u>`.
 */
export const RichText: Story = {
  args: {
    richText: true,
    showToolbar: true,
    initialValue: [
      { type: 'text', value: '**Hello** ' },
      { type: 'input', value: 'vars.firstName' },
      {
        type: 'text',
        value:
          ',\n\nYour order:\n- item one\n- item two\n\nRun <u>`npm install`</u> first.\n\nThanks, ~~the team~~ *us*',
      },
    ],
    autoCompleteOptions: AUTOCOMPLETE_OPTIONS,
    ariaLabel: 'Body',
  },
};

/** Type `$` in the editor to open the variable autocomplete menu. */
export const WithAutocomplete: Story = {
  args: {
    autoCompleteOptions: AUTOCOMPLETE_OPTIONS,
    placeholder: 'Type $ to insert a variable…',
    ariaLabel: 'Prompt',
  },
};

export const Preview: Story = {
  args: {
    showToolbar: true,
    mode: 'preview',
    initialValue: [
      { type: 'text', value: '# Summary\n\nGreet ' },
      { type: 'input', value: 'vars.firstName' },
      { type: 'text', value: ' then list:\n\n- item one\n- item two' },
    ],
    autoCompleteOptions: AUTOCOMPLETE_OPTIONS,
    ariaLabel: 'Prompt',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    initialValue: SAMPLE_VALUE,
    autoCompleteOptions: AUTOCOMPLETE_OPTIONS,
    ariaLabel: 'Prompt',
  },
};

/**
 * `borderless` drops the editor's own border/background so a parent can supply the field chrome;
 * the text color is inherited from that parent surface.
 */
export const Borderless: Story = {
  args: {
    borderless: true,
    initialValue: SAMPLE_VALUE,
    autoCompleteOptions: AUTOCOMPLETE_OPTIONS,
    ariaLabel: 'Prompt',
  },
};

/** Controlled editor whose value + preview-mode toggle are owned by the parent. */
export const Controlled: Story = {
  render: () => {
    const ControlledExample = () => {
      const [value, setValue] = useState<PromptEditorToken[]>(SAMPLE_VALUE);
      const [mode, setMode] = useState<PromptEditorMode>('edit');
      return (
        <PromptEditor
          showToolbar
          ariaLabel="Prompt"
          value={value}
          onChange={setValue}
          mode={mode}
          onModeChange={setMode}
          autoCompleteOptions={AUTOCOMPLETE_OPTIONS}
        />
      );
    };
    return <ControlledExample />;
  },
};

/**
 * Variable drag-drop. The chips above the editor are the drag *source* (the consumer's
 * responsibility): each sets the variable path on `dataTransfer` under `VARIABLE_DRAG_MIME` on
 * drag start. Dropping one onto the editor inserts a token at the drop point via `mapVarDropToToken`.
 * Drag a chip into the editor to try it.
 */
export const WithVariableDragDrop: Story = {
  render: () => {
    const DragDropExample = () => {
      const [value, setValue] = useState<PromptEditorToken[]>([]);
      const mapVarDropToToken = (path: string): PromptEditorAutoCompleteOption =>
        AUTOCOMPLETE_OPTIONS.find((o) => o.value === path) ?? {
          type: 'input',
          value: path,
        };
      return (
        <div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 12,
            }}
          >
            {AUTOCOMPLETE_OPTIONS.map((o) => (
              // biome-ignore lint/a11y/noStaticElementInteractions: demo drag source for the story; real consumers own the (accessible) drag affordance.
              <span
                key={o.value}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(VARIABLE_DRAG_MIME, o.value);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                style={{
                  cursor: 'grab',
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 13,
                  background: 'var(--color-muted)',
                }}
              >
                {o.value}
              </span>
            ))}
          </div>
          <PromptEditor
            ariaLabel="Prompt"
            value={value}
            onChange={setValue}
            autoCompleteOptions={AUTOCOMPLETE_OPTIONS}
            mapVarDropToToken={mapVarDropToToken}
            placeholder="Drag a variable here…"
          />
        </div>
      );
    };
    return <DragDropExample />;
  },
};

const clipboardSampleStyle = {
  display: 'block',
  marginBottom: 12,
  padding: '8px 12px',
  border: '1px solid var(--color-border)',
  borderRadius: 4,
  background: 'var(--color-muted)',
  fontFamily: 'monospace',
  fontSize: 13,
  userSelect: 'all' as const,
  whiteSpace: 'pre-wrap' as const,
};

const clipboardOutputStyle = {
  marginTop: 12,
  fontFamily: 'monospace',
  fontSize: 12,
  whiteSpace: 'pre-wrap' as const,
  color: 'var(--color-muted-foreground)',
};

const ClipboardExample = ({
  sample,
  parseClipboardText,
  serializeClipboardTokens,
}: {
  sample: string;
  parseClipboardText?: (text: string) => PromptEditorToken[];
  serializeClipboardTokens?: (tokens: PromptEditorToken[]) => string;
}) => {
  const [value, setValue] = useState<PromptEditorToken[]>([]);
  const serialize = serializeClipboardTokens ?? tokensToClipboardString;
  return (
    <div>
      <code style={clipboardSampleStyle}>{sample}</code>
      <PromptEditor
        ariaLabel="Prompt"
        value={value}
        onChange={setValue}
        autoCompleteOptions={AUTOCOMPLETE_OPTIONS}
        parseClipboardText={parseClipboardText}
        serializeClipboardTokens={serializeClipboardTokens}
        placeholder="Paste the text above here…"
      />
      <div style={clipboardOutputStyle}>Copies as: {serialize(value) || '(empty)'}</div>
    </div>
  );
};

/**
 * Escaping variables. Copy the sample and paste it into the editor: `{{ vars.firstName }}` becomes a
 * chip, while `\{{ vars.lastName }}` stays literal text (the backslash is dropped). Copying from
 * the editor writes the escape back, so a literal `{{` survives a copy and paste round trip.
 */
export const ClipboardEscaping: Story = {
  name: 'Clipboard escaping',
  render: () => (
    <ClipboardExample
      sample={String.raw`Greet {{ vars.firstName }}, then pass \{{ vars.lastName }} on verbatim.`}
    />
  ),
};

const HOST_VARIABLE_REF = /\{\{\s*(vars\.[\w.]+)\s*\}\}/g;

/**
 * Host clipboard format. `parseClipboardText` and `serializeClipboardTokens` let a host own the
 * plain text format. Here only `{{ vars.* }}` references become chips, so `{{name}}` and
 * `{{value}}` paste as literal text instead of invalid chips.
 */
export const WithHostClipboardFormat: Story = {
  name: 'With host clipboard format',
  render: () => {
    const parseClipboardText = (text: string): PromptEditorToken[] => {
      const tokens: PromptEditorToken[] = [];
      let lastIndex = 0;
      for (const match of text.matchAll(HOST_VARIABLE_REF)) {
        if (match.index > lastIndex)
          tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
        tokens.push({ type: 'input', value: match[1] });
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < text.length) tokens.push({ type: 'text', value: text.slice(lastIndex) });
      return tokens;
    };
    const serializeClipboardTokens = (tokens: PromptEditorToken[]) =>
      tokens.map((t) => (t.type === 'text' ? t.value : `{{ ${t.value} }}`)).join('');
    return (
      <ClipboardExample
        sample="Reply in the form {{name}}: {{value}} for {{ vars.firstName }}."
        parseClipboardText={parseClipboardText}
        serializeClipboardTokens={serializeClipboardTokens}
      />
    );
  },
};
