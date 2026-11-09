import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useId, useState } from 'react';
import { Button } from '../button';
import { FormField, FormFieldHeader } from '../form-field';
import { Input } from '../input';
import { InputGroup } from '../input-group';
import { Label } from '../label';
import { Textarea } from '../textarea';
import { TooltipProvider } from '../tooltip';
import type { RenderVariablePicker, VariablePickerItem } from '../variable-picker';
import { AiAssistAction, type AiAssistContentProps } from './ai-assist-action';
import { InsertVariableAction } from './insert-variable-action';

const meta = {
  title: 'Components/Core/Field Actions',
  component: InsertVariableAction,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Actions for a field's header row, passed to \`FormFieldHeader\`'s \`actions\`.

- **InsertVariableAction** opens a variable picker and reports the pick. It is disabled with nothing
  to insert or nowhere to insert it, and collapses to its icon below a 260px \`@container\`.
- **AiAssistAction** opens a prompt and reports it. It needs an ancestor \`TooltipProvider\`.

Either can render the host's own panel instead: \`renderPicker\` for Insert variable and
\`renderContent\` for AI assist. The action keeps its trigger, popover, collapse, focus return and
strings, and calls the slot only while the popover is open. A picker's \`onSelect\` commits and
closes; both slots get \`close\`.

A host that generates after closing the popover drives AI assist's trigger with \`loading\` and
\`error\`, and its popover with \`open\` and \`onOpenChange\`. While loading, the trigger glows and
reads as busy, and still opens. An error
tints the trigger, and its message replaces the tooltip. \`size\` fits the trigger to a toolbar.
`,
      },
    },
  },
  tags: ['autodocs'],
  args: { variables: [] },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof InsertVariableAction>;

export default meta;
type Story = StoryObj<typeof meta>;

// Rendered as supplied: the `$vars` root is this story's, not the action's.
const VARIABLES: VariablePickerItem[] = [
  {
    id: 'vars',
    label: '$vars',
    children: [
      { id: 'orderId', label: 'Order id', value: '$vars.orderId', type: 'string' },
      {
        id: 'customerEmail',
        label: 'Customer email',
        value: '$vars.customerEmail',
        type: 'string',
      },
    ],
  },
];

function Example({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

/** Enabled, disabled with no variables, compact, collapsed by a narrow container, and translated. */
export const InsertVariable: Story = {
  render: () => {
    const [inserted, setInserted] = useState<string | null>(null);
    return (
      <div className="grid w-80 gap-5">
        <Example label={inserted ? `Inserted ${inserted}` : 'Enabled'}>
          <InsertVariableAction variables={VARIABLES} onInsert={setInserted} />
        </Example>
        <Example label="No variables">
          <InsertVariableAction variables={[]} onInsert={setInserted} />
        </Example>
        <Example label="Compact">
          <InsertVariableAction variables={VARIABLES} onInsert={setInserted} compact />
        </Example>
        <Example label="In a container under 260px">
          <div className="@container w-56 rounded border border-dashed p-1">
            <InsertVariableAction variables={VARIABLES} onInsert={setInserted} />
          </div>
        </Example>
        <Example label="Translated">
          <InsertVariableAction
            variables={VARIABLES}
            onInsert={setInserted}
            strings={{ label: 'Insérer', ariaLabel: 'Insérer une variable' }}
          />
        </Example>
      </div>
    );
  },
};

/**
 * With a hint under the prompt, generating asynchronously (busy until the promise settles, then
 * closed), and with translated strings.
 */
export const AiAssist: Story = {
  render: () => {
    const [prompt, setPrompt] = useState<string | null>(null);
    return (
      <div className="grid w-80 gap-5">
        <Example label={prompt ? `Generated from "${prompt}"` : 'With a hint'}>
          <AiAssistAction hint="Output: string value" onGenerate={setPrompt} />
        </Example>
        <Example label="Asynchronous">
          <AiAssistAction
            onGenerate={(next) =>
              new Promise<void>((resolve) =>
                setTimeout(() => {
                  setPrompt(next);
                  resolve();
                }, 1500)
              )
            }
          />
        </Example>
        <Example label="Translated">
          <AiAssistAction
            onGenerate={setPrompt}
            strings={{
              trigger: 'Assistant IA',
              tooltip: 'Générer avec l’IA',
              prompt: 'Décrivez ce que vous voulez',
              promptPlaceholder: 'Afficher une valeur de l’étape précédente',
              generate: 'Générer',
              generating: 'Génération',
            }}
          />
        </Example>
      </div>
    );
  },
};

/** Both actions in a field's header row. Insert variable appends to the value. */
export const InHeader: Story = {
  render: () => {
    const [value, setValue] = useState('Order ');
    return (
      <FormField className="w-96">
        <FormFieldHeader
          label="Subject"
          htmlFor="actions-subject"
          actions={
            <>
              <AiAssistAction hint="Output: string value" onGenerate={() => {}} />
              <InsertVariableAction
                variables={VARIABLES}
                onInsert={(variable) => setValue((v) => (v ? `${v} ${variable}` : variable))}
              />
            </>
          }
        />
        <InputGroup>
          <Input id="actions-subject" value={value} onChange={(e) => setValue(e.target.value)} />
        </InputGroup>
      </FormField>
    );
  },
};

// Stand-ins for a host's own panels, such as a virtualized picker with live badges.
const HOST_ROWS = [
  { value: '$vars.orderId', label: 'Order id', live: true },
  { value: '$assets.apiKey', label: 'API key', live: false },
];

const hostPicker: RenderVariablePicker = ({ value, onSelect, close }) => (
  <div className="grid gap-1 p-2 text-xs">
    <span className="px-1 text-foreground-muted">Host picker</span>
    {HOST_ROWS.map((row) => (
      <button
        key={row.value}
        type="button"
        aria-current={row.value === value || undefined}
        onClick={() => onSelect(row.value)}
        className="flex items-center justify-between rounded px-2 py-1 text-left hover:bg-surface-overlay aria-[current]:font-semibold"
      >
        {row.label}
        {row.live && <span className="text-[10px] text-success">Live</span>}
      </button>
    ))}
    <button type="button" onClick={close} className="px-1 text-left text-foreground-muted">
      Cancel
    </button>
  </div>
);

function HostSuggestions({ close, onPick }: AiAssistContentProps & { onPick(text: string): void }) {
  return (
    <div className="grid gap-2 text-xs">
      <span className="text-foreground-muted">Suggestions from the host</span>
      {['Order received', 'Order shipped'].map((text) => (
        <button
          key={text}
          type="button"
          className="rounded border border-border px-2 py-1 text-left hover:bg-surface-overlay"
          onClick={() => {
            onPick(text);
            close();
          }}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Both actions rendering the host's own panel inside their popover. */
export const HostPanels: Story = {
  render: () => {
    const [value, setValue] = useState('Order ');
    return (
      <FormField className="w-96">
        <FormFieldHeader
          label="Subject"
          htmlFor="host-panels-subject"
          actions={
            <>
              <AiAssistAction
                renderContent={(props) => <HostSuggestions {...props} onPick={setValue} />}
              />
              <InsertVariableAction
                renderPicker={hostPicker}
                onInsert={(variable) => setValue((v) => (v ? `${v} ${variable}` : variable))}
              />
            </>
          }
        />
        <InputGroup>
          <Input
            id="host-panels-subject"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </InputGroup>
      </FormField>
    );
  },
};

/**
 * A host that controls the popover and drives the trigger: it closes the popover on submit, glows
 * while generating and turns to the error tone if generation fails. Opened while generating, the
 * panel says so, and closes on success. A failure shows the message and the last prompt for a
 * retry. Prompts containing "fail" reject.
 */
function HostGenerate() {
  const promptId = useId();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const submit = () => {
    const prompt = input.trim();
    if (!prompt || loading) return;
    setOpen(false);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (prompt.includes('fail')) {
        setError('The model is over its quota. Try again in a minute.');
      } else {
        setError(null);
        setInput('');
        setResult(prompt);
        setOpen(false);
      }
    }, 2000);
  };

  return (
    <Example label={result ? `Generated from "${result}"` : 'Closes on submit'}>
      <AiAssistAction
        open={open}
        onOpenChange={setOpen}
        loading={loading}
        error={error}
        className="data-[state=open]:bg-accent data-[state=open]:text-foreground"
        renderContent={() => (
          <div className="grid gap-3">
            {error && (
              <div role="alert" className="grid gap-1 rounded bg-error-background p-2 text-xs">
                <span className="text-error">{error}</span>
                <button
                  type="button"
                  className="w-fit text-foreground-muted underline hover:text-foreground"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}
            <div className="grid gap-1.5">
              <Label htmlFor={promptId} className="text-xs font-medium text-foreground-muted">
                Instructions
              </Label>
              <Textarea
                id={promptId}
                rows={3}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder="Describe what you want to generate"
                className="resize-none text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-subtle">⌘+Enter to submit</span>
              <Button
                size="sm"
                disabled={!input.trim() || loading}
                aria-busy={loading || undefined}
                onClick={submit}
              >
                {loading ? 'Generating' : 'Generate'}
              </Button>
            </div>
          </div>
        )}
      />
    </Example>
  );
}

/**
 * The trigger's loading and error states, set by the host, at the header size and a toolbar size,
 * and a host panel that drives them.
 */
export const AiAssistTriggerState: Story = {
  render: () => (
    <div className="grid w-80 gap-5">
      <Example label="Loading">
        <AiAssistAction loading />
      </Example>
      <Example label="Error">
        <AiAssistAction error="The model is over its quota. Try again in a minute." />
      </Example>
      <Example label="Toolbar size (xs)">
        <AiAssistAction size="xs" loading />
      </Example>
      <HostGenerate />
    </div>
  ),
};
