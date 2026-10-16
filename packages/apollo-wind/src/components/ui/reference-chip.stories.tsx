import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check, Database, Mail, Variable, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { Button } from './button';
import { ReferenceChip } from './reference-chip';
import { getReferenceChipColors } from './reference-chip-colors';

const meta = {
  title: 'Components/Data Display/Reference Chip',
  component: ReferenceChip,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="p-6">
        <Story />
      </div>
    ),
  ],
  args: { label: 'vars.firstName', icon: <Variable /> },
  parameters: {
    docs: {
      description: {
        component: `A compact reference to a variable, resource or connection. PromptEditor uses this primitive through TokenPill. The connection picker owns its popup and selection behavior; ReferenceChip owns the selected value's appearance.

Colors come from existing semantic tokens, always as a pair from one family. Valid references use --color-info-background with --color-info-text and --color-info-icon. Invalid references use --color-error-background with --color-error-text and --color-error-icon. The selected outline uses the icon token of the same family. getReferenceChipColors() returns these values for hosts that cannot render the component. Do not fill a chip with a primary or accent color and pick a foreground separately: that is how low-contrast chips happen. Branded icons may retain their colors. The Themes story shows every theme side by side.

Pass onRemove to expose a keyboard-accessible remove button and removeLabel for localization. readOnly hides removal; disabled disables it. selected is visual only: the host owns selection semantics. Keep a removable chip outside other buttons. Inside a picker trigger, omit onRemove and provide a separate clear button.

Import { ReferenceChip } from '@uipath/apollo-wind'. Existing PromptEditor consumers inherit this treatment without changing their API. Product connection fields must adopt the component; this does not update external product repositories.`,
      },
    },
  },
} satisfies Meta<typeof ReferenceChip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const States: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <ReferenceChip label="vars.firstName" icon={<Variable />} onRemove={() => {}} />
      <ReferenceChip label="Selected reference" icon={<Variable />} selected onRemove={() => {}} />
      <ReferenceChip
        label="Unavailable reference"
        icon={<Variable />}
        invalid
        onRemove={() => {}}
      />
      <ReferenceChip label="Disabled reference" icon={<Database />} disabled onRemove={() => {}} />
      <ReferenceChip label="Read-only reference" icon={<Database />} readOnly onRemove={() => {}} />
      <ReferenceChip
        className="max-w-60"
        label="a.very.long.reference.that.should.truncate.without.hiding.the.remove.button"
        icon={<Variable />}
        onRemove={() => {}}
      />
    </div>
  ),
};

function ConnectionExample() {
  const [connection, setConnection] = useState('alex@example.com');
  return (
    <div className="w-full max-w-md space-y-3">
      <p id="reference-connection-label" className="text-sm font-medium">
        Microsoft Outlook 365 connection
      </p>
      <fieldset
        aria-labelledby="reference-connection-label"
        className="min-h-10 rounded-md border border-border bg-background px-3 py-2"
      >
        {connection ? (
          <ReferenceChip
            label={connection}
            icon={<Mail />}
            removeLabel="Remove Outlook connection"
            onRemove={() => setConnection('')}
          />
        ) : (
          <span className="text-sm text-muted-foreground">No connection selected</span>
        )}
      </fieldset>
      {!connection && (
        <Button variant="outline" onClick={() => setConnection('alex@example.com')}>
          Restore example connection
        </Button>
      )}
      <p className="text-sm text-muted-foreground">
        The same chip used by prompt variables, with a connection icon and accessible removal.
      </p>
    </div>
  );
}
export const Connection: Story = { render: () => <ConnectionExample /> };

function GuidanceCard({
  kind,
  note,
  children,
}: {
  kind: 'do' | 'dont';
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        {kind === 'do' ? (
          <Check aria-hidden="true" className="size-4 text-primary" />
        ) : (
          <X aria-hidden="true" className="size-4 text-destructive" />
        )}
        {kind === 'do' ? 'Do' : 'Don\u2019t'}
      </div>
      <div className="flex min-h-10 items-center">{children}</div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{note}</p>
    </div>
  );
}

function PickerTrigger({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-9 w-full items-center gap-2 rounded-md border border-border bg-background px-2">
      {children}
    </div>
  );
}

export const UsageGuidance: Story = {
  name: 'Usage guidance',
  parameters: {
    // The Don't example fails contrast on purpose; keep the check on for every real chip.
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', selector: '*:not([data-dont-example])' }],
      },
    },
  },
  render: () => (
    <div className="grid max-w-3xl gap-4 md:grid-cols-2">
      <GuidanceCard
        kind="do"
        note="Use ReferenceChip for any selected variable, resource or connection. It pairs the info background, text and icon tokens, so it stays readable in every theme."
      >
        <ReferenceChip label="alex@example.com" icon={<Mail />} onRemove={() => {}} />
      </GuidanceCard>
      <GuidanceCard
        kind="dont"
        note="Don't fill the chip with a primary or accent color and choose the text color separately. Light text on a bright fill fails contrast."
      >
        {/* Deliberately wrong: approximates a product chip reported with low contrast. */}
        <span
          data-dont-example
          className="inline-flex h-5 items-center gap-[3px] rounded bg-[#6fd0fb] px-1 text-[13px] text-[#e8f6ff]"
        >
          <Mail aria-hidden="true" className="size-3.5" />
          alex@example.com
          <X aria-hidden="true" className="size-3" />
        </span>
      </GuidanceCard>
      <GuidanceCard
        kind="do"
        note="Inside a picker trigger, omit onRemove and put a separate clear button next to the chip. The trigger stays one control, and clearing stays keyboard accessible."
      >
        <div className="flex w-full items-center gap-1">
          <PickerTrigger>
            <ReferenceChip label="alex@example.com" icon={<Mail />} />
          </PickerTrigger>
          <Button variant="ghost" size="icon" aria-label="Clear connection">
            <X />
          </Button>
        </div>
      </GuidanceCard>
      <GuidanceCard
        kind="dont"
        note="Don't put a removable chip inside a button. A button inside a button is invalid, and the remove action becomes unreachable for keyboard and screen reader users."
      >
        <PickerTrigger>
          <ReferenceChip label="alex@example.com" icon={<Mail />} onRemove={() => {}} />
        </PickerTrigger>
      </GuidanceCard>
    </div>
  ),
};

const THEMES = [
  { className: 'light', label: 'Light' },
  { className: 'light-hc', label: 'Light high contrast' },
  { className: 'dark', label: 'Dark' },
  { className: 'dark-hc', label: 'Dark high contrast' },
  { className: 'future-light', label: 'Future light' },
  { className: 'future-dark', label: 'Future dark' },
] as const;

export const Themes: Story = {
  parameters: {
    docs: {
      description: {
        story: `Every theme on one page, for review and visual comparison. Valid chips use ${getReferenceChipColors().valid.background}; invalid chips use ${getReferenceChipColors().invalid.background}.`,
      },
    },
  },
  render: () => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {THEMES.map((theme) => (
        <div
          key={theme.className}
          className={`${theme.className} flex flex-col items-start gap-3 rounded-lg border border-border bg-background p-4 text-foreground`}
        >
          <p className="text-xs font-medium text-muted-foreground">{theme.label}</p>
          <ReferenceChip label="vars.firstName" icon={<Variable />} onRemove={() => {}} />
          <ReferenceChip label="alex@example.com" icon={<Mail />} selected onRemove={() => {}} />
          <ReferenceChip label="vars.missing" icon={<Variable />} invalid onRemove={() => {}} />
        </div>
      ))}
    </div>
  ),
};
