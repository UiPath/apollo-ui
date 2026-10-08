import type { Meta, StoryObj } from '@storybook/react-vite';
import { CircleAlert, CircleCheck } from 'lucide-react';
import * as React from 'react';
import { Button } from './button';
import type { JsonTreeViewStrings } from './json-tree-view';
import {
  ToolCall,
  ToolCallContent,
  ToolCallError,
  ToolCallHeader,
  ToolCallInput,
  ToolCallOutput,
  ToolCallSection,
  type ToolCallStatus,
} from './tool-call';

const meta: Meta<typeof ToolCall> = {
  title: 'Chat/Components/Tool Call',
  component: ToolCall,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'One agent tool call, laid out like the Material ApToolCall. The status line reads "Running \'name\'" or "Ran \'name\' for 1.23 seconds" and toggles an indented body. The body holds collapsible sections: ToolCallInput, ToolCallError and ToolCallOutput, plus any ToolCallSection such as traces or escalation. Every section starts closed. Objects and arrays render as a read-only JSON tree with nested values folded, strings as wrapped text. Pass renderValue to plug in a code block instead. Leave out ToolCallContent for a name-only line.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-120 bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const SEARCH_INPUT = { query: 'invoices overdue more than 30 days', limit: 20 };
const SEARCH_OUTPUT = {
  total: 3,
  items: [
    { id: 'INV-2041', customer: 'Northwind', amountDue: 1280.5, daysOverdue: 42 },
    { id: 'INV-2057', customer: 'Contoso', amountDue: 310, daysOverdue: 35 },
    { id: 'INV-2063', customer: 'Fabrikam', amountDue: 9020.75, daysOverdue: 31 },
  ],
};

export const Executing: Story = {
  render: () => (
    <ToolCall status="executing">
      <ToolCallHeader name="search invoices" />
      <ToolCallContent>
        <ToolCallInput value={SEARCH_INPUT} />
      </ToolCallContent>
    </ToolCall>
  ),
};

export const Completed: Story = {
  render: () => (
    <ToolCall status="completed" defaultOpen>
      <ToolCallHeader name="search invoices" duration="1.40 seconds" />
      <ToolCallContent>
        <ToolCallInput defaultOpen value={SEARCH_INPUT} />
        <ToolCallOutput value={SEARCH_OUTPUT} />
      </ToolCallContent>
    </ToolCall>
  ),
};

export const Failed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'ToolCallError takes a value like the other sections, so a structured error renders as a JSON tree.',
      },
    },
  },
  render: () => (
    <ToolCall status="failed" defaultOpen>
      <ToolCallHeader name="send reminder" duration="0.30 seconds" />
      <ToolCallContent>
        <ToolCallInput value={{ to: 'ap@northwind.example', invoiceId: 'INV-2041' }} />
        <ToolCallError
          defaultOpen
          value={{
            code: 'CONNECTOR_UNAUTHORISED',
            message: 'The email connector is not authorised. Reconnect it and retry.',
          }}
        />
      </ToolCallContent>
    </ToolCall>
  ),
};

export const Pending: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A call that is queued but not started shows a clock instead of the spinner.',
      },
    },
  },
  render: () => (
    <ToolCall status="pending">
      <ToolCallHeader name="search invoices" />
      <ToolCallContent>
        <ToolCallInput value={SEARCH_INPUT} />
      </ToolCallContent>
    </ToolCall>
  ),
};

export const OpenState: Story = {
  name: 'Open state',
  parameters: {
    docs: {
      description: {
        story:
          'The open prop is controlled here, so an outside button and the status line stay in sync through onOpenChange. Without a ToolCallContent there is no toggle, which covers a name-only display.',
      },
    },
  },
  render: function Render() {
    const [open, setOpen] = React.useState(false);
    return (
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          size="xs"
          className="self-start"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Open'} from outside
        </Button>
        <ToolCall status="completed" open={open} onOpenChange={setOpen}>
          <ToolCallHeader name="search invoices" duration="1.40 seconds" />
          <ToolCallContent>
            <ToolCallInput value={SEARCH_INPUT} />
            <ToolCallOutput value={SEARCH_OUTPUT} />
          </ToolCallContent>
        </ToolCall>
        <ToolCall status="completed">
          <ToolCallHeader name="get exchange rate" duration="0.20 seconds" />
        </ToolCall>
      </div>
    );
  },
};

const LONG_OUTPUT = {
  total: 40,
  items: Array.from({ length: 40 }, (_, i) => ({
    id: `INV-${2000 + i}`,
    customer: ['Northwind', 'Contoso', 'Fabrikam', 'Tailspin'][i % 4],
    amountDue: Math.round((i + 1) * 137.25 * 100) / 100,
  })),
  nextPage: null,
};

export const Payloads: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Nested objects and arrays stay folded until opened, and each value scrolls past a maximum height. Strings keep their line breaks and wrap. The last call passes renderValue to swap in a custom renderer for string values.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="list invoices" duration="3.80 seconds" />
        <ToolCallContent>
          <ToolCallOutput defaultOpen value={LONG_OUTPUT} />
        </ToolCallContent>
      </ToolCall>
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="summarise document" duration="2.10 seconds" />
        <ToolCallContent>
          <ToolCallInput value="contracts/northwind-msa-2024.pdf" />
          <ToolCallOutput
            defaultOpen
            value={
              'The master services agreement runs for 24 months from 1 March 2024 and renews automatically for 12 month terms unless either party gives 60 days written notice.\n\nPayment terms are net 45. Late payments accrue interest at 1% per month.'
            }
          />
        </ToolCallContent>
      </ToolCall>
      <ToolCall status="completed" defaultOpen>
        <ToolCallHeader name="run sql" duration="0.60 seconds" />
        <ToolCallContent>
          <ToolCallInput
            defaultOpen
            value="SELECT customer, SUM(amount_due) FROM invoices GROUP BY customer;"
            renderValue={(value) =>
              typeof value === 'string' ? (
                <code className="my-2 block rounded bg-muted px-3 py-2 font-mono text-xs">
                  {value}
                </code>
              ) : undefined
            }
          />
          <ToolCallOutput value={[{ customer: 'Northwind', total: 1280.5 }]} />
        </ToolCallContent>
      </ToolCall>
    </div>
  ),
};

const TRACES = ['check policy', 'call email connector', 'record audit entry'];
const TASKS = [
  { url: 'https://cloud.uipath.example/tasks/4182', done: true },
  { url: 'https://cloud.uipath.example/tasks/4190', done: false },
];

export const CustomSections: Story = {
  name: 'Custom sections',
  parameters: {
    docs: {
      description: {
        story:
          'ToolCallSection adds sections the primitive does not render itself, such as the traces and escalation that the chat renderer builds from a span. Sections follow the ApToolCall order: input, traces, escalation, errors, output. Escalation passes defaultOpen so pending tasks are visible.',
      },
    },
  },
  render: () => (
    <ToolCall status="completed" defaultOpen>
      <ToolCallHeader name="request approval" duration="4.20 seconds" />
      <ToolCallContent>
        <ToolCallInput value={{ invoiceId: 'INV-2063', approver: 'finance-leads' }} />
        <ToolCallSection title="Traces">
          <ul className="my-1 flex flex-col gap-2">
            {TRACES.map((trace) => (
              <li key={trace}>{trace}</li>
            ))}
          </ul>
        </ToolCallSection>
        <ToolCallSection title="Escalation" defaultOpen>
          <ul className="my-2 flex flex-col gap-2 rounded bg-muted px-3 py-2 text-xs">
            {TASKS.map((task) => (
              <li key={task.url} className="flex items-center gap-2">
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground-link hover:underline"
                >
                  {task.url}
                </a>
                {task.done ? (
                  <CircleCheck role="img" aria-label="Completed" className="size-4 text-success" />
                ) : (
                  <CircleAlert role="img" aria-label="Waiting" className="size-4 text-warning" />
                )}
              </li>
            ))}
          </ul>
        </ToolCallSection>
        <ToolCallOutput value={{ approved: true }} />
      </ToolCallContent>
    </ToolCall>
  ),
};

const STEPS: { status: ToolCallStatus; delay: number }[] = [
  { status: 'pending', delay: 1200 },
  { status: 'executing', delay: 2000 },
  { status: 'completed', delay: 3000 },
];

export const Sequence: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Walks a call from pending to executing to completed, adding the output when it finishes. The body is open so the output section appears in place.',
      },
    },
  },
  render: function Render() {
    const [step, setStep] = React.useState(0);
    React.useEffect(() => {
      const timer = setTimeout(
        () => setStep((s) => (s + 1) % STEPS.length),
        STEPS[step]?.delay ?? 1000
      );
      return () => clearTimeout(timer);
    }, [step]);
    const status = STEPS[step]?.status ?? 'pending';
    const done = status === 'completed';
    return (
      <ToolCall status={status} defaultOpen>
        <ToolCallHeader name="search invoices" duration={done ? '2.00 seconds' : undefined} />
        <ToolCallContent>
          <ToolCallInput value={SEARCH_INPUT} />
          <ToolCallOutput value={done ? SEARCH_OUTPUT : undefined} />
        </ToolCallContent>
      </ToolCall>
    );
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {(['sm', 'md'] as const).map((size) => (
        <ToolCall key={size} size={size} status="completed" defaultOpen>
          <ToolCallHeader name={`size ${size}`} duration="1.40 seconds" />
          <ToolCallContent>
            <ToolCallInput defaultOpen value={SEARCH_INPUT} />
          </ToolCallContent>
        </ToolCall>
      ))}
    </div>
  ),
};

// Every string the read-only tree shows; editing and toolbar strings are not reachable here.
const GERMAN_JSON_TREE_STRINGS: Partial<JsonTreeViewStrings> = {
  arrayItem: 'Eintrag',
  emptyDefault: 'Keine Felder vorhanden.',
  expandKey: (key) => `${key} aufklappen`,
  collapseKey: (key) => `${key} zuklappen`,
  itemCount: (count) => (count === 1 ? '1 Eintrag' : `${count} Einträge`),
  keyCount: (count) => (count === 1 ? '1 Schlüssel' : `${count} Schlüssel`),
  pathCopied: 'Pfad kopiert',
  copyPathHint: 'Klicken, um diesen Pfad zu kopieren',
  copyPathFor: (path) => `Pfad ${path} kopieren`,
  wrapValue: 'Wert umbrechen',
  unwrapValue: 'Umbruch aufheben',
  wrapValueOf: (key) => `Wert von ${key} umbrechen`,
  unwrapValueOf: (key) => `Umbruch von ${key} aufheben`,
  copyValue: 'Wert kopieren',
  copyValueOf: (key) => `Wert von ${key} kopieren`,
  moreActions: 'Weitere Aktionen',
};

export const Strings: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The status line, the spoken status and the section titles come from the strings prop. Any key left out falls back to English. The toggles and copy buttons of the JSON tree take their copy from jsonTreeStrings, merged over any outer JsonTreeViewProvider.',
      },
    },
  },
  render: () => (
    <ToolCall
      status="completed"
      defaultOpen
      jsonTreeStrings={GERMAN_JSON_TREE_STRINGS}
      strings={{
        pending: 'Ausstehend',
        executing: 'Läuft',
        completed: 'Abgeschlossen',
        failed: 'Fehlgeschlagen',
        running: (name) => `'${name}' wird ausgeführt`,
        ran: (name, duration) =>
          duration ? `'${name}' in ${duration} ausgeführt` : `'${name}' ausgeführt`,
        input: 'Eingabe',
        output: 'Ausgabe',
        errors: 'Fehler',
      }}
    >
      <ToolCallHeader name="rechnungen suchen" duration="1,40 Sekunden" />
      <ToolCallContent>
        <ToolCallInput
          defaultOpen
          value={{
            suche: 'überfällig',
            filter: { tage: 30, kunden: ['Northwind', 'Contoso'] },
            notiz:
              'Nur Rechnungen mit offenem Betrag berücksichtigen und Gutschriften aus dem laufenden Quartal ausschließen.',
          }}
        />
        <ToolCallOutput value={{ treffer: 3 }} />
      </ToolCallContent>
    </ToolCall>
  ),
};
