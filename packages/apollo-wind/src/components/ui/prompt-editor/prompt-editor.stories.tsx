import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { PromptEditor } from './prompt-editor';
import type { PromptEditorAutoCompleteOption, PromptEditorMode, PromptEditorToken } from './types';

const meta = {
  title: 'Components/PromptEditor',
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
