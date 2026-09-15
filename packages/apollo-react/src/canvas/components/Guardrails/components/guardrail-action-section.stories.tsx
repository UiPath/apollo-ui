import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  FormField,
  FormFieldError,
  FormFieldLabel,
  Input,
  Label,
  MultiSelect,
  RequiredIndicator,
  Switch,
  TooltipProvider,
} from '@uipath/apollo-wind';
import { type ComponentProps, useState } from 'react';
import { ApI18nProvider } from '../../../../i18n';
import {
  type GuardrailAction,
  type GuardrailEscalateAction,
  type GuardrailEscalateRecipient,
  GuardrailRecipientType,
} from '../builder-types';
import { EscalateActionFields } from './escalate-action-fields';
import { GuardrailActionSection } from './guardrail-action-section';

const meta = {
  title: 'Components/UiPath/Guardrail Action Section',
  component: GuardrailActionSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
The action half of a guardrail: an action-type select plus the field that type needs. Log
takes a severity, Block a reason, Filter a host-supplied field picker, and Escalate expands
into the full escalation layout (recipient type, recipient, action app).

Rendered inside GuardrailBuilder, and exported for hosts that compose their own builder. The
escalation target is slot-driven: the directory search, the static/asset recipient editor and
the app picker are host capabilities injected as render props, each falling back to a plain
input or a note when absent. Filter stays host territory through showFilter and filterContent.
Labels resolve from the canvas lingui catalog, so a standalone caller passes action and
onActionChange only.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <div className="w-[560px]">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof GuardrailActionSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const logAction: GuardrailAction = { $actionType: 'log', severityLevel: 'Warning' };

const escalateAction: GuardrailEscalateAction = {
  $actionType: 'escalate',
  app: { id: '', version: '', name: '' },
  recipient: { type: GuardrailRecipientType.User, value: '', displayName: '' },
};

const DIRECTORY = [
  { value: 'u1', displayName: 'Ada Lovelace' },
  { value: 'u2', displayName: 'Grace Hopper' },
];

type HostProps = { initial: GuardrailAction } & Omit<
  ComponentProps<typeof GuardrailActionSection>,
  'action' | 'onActionChange'
>;

/** A stateful host around the section, so the selects and inputs actually move. */
function ActionSectionHost({ initial, ...props }: HostProps) {
  const [action, setAction] = useState(initial);
  return (
    <div className="space-y-4">
      <GuardrailActionSection {...props} action={action} onActionChange={setAction} />
      <pre className="text-xs bg-muted rounded-md p-2 overflow-x-auto">
        {JSON.stringify(action, null, 2)}
      </pre>
    </div>
  );
}

/** A stand-in directory search. The real one is the host's people picker. */
function mockRecipientSearch(ctx: {
  displayValue: string;
  placeholder: string;
  invalid: boolean;
  onSelect: (selection: { value: string; displayName: string }) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-1">
      {DIRECTORY.map((entry) => (
        <Button
          key={entry.value}
          type="button"
          size="sm"
          variant={ctx.displayValue === entry.displayName ? 'default' : 'outline'}
          className="w-full justify-start"
          onClick={() => ctx.onSelect(entry)}
        >
          {entry.displayName}
        </Button>
      ))}
      {ctx.displayValue ? (
        <Button type="button" size="sm" variant="ghost" onClick={ctx.onClear}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}

/** A stand-in app picker. The real one is the host's solution-resource control. */
function mockAppPicker(ctx: {
  app: { name: string } | null;
  label: string;
  error?: string;
  onChange: (app: { id: string; version: string; name: string } | null) => void;
}) {
  return (
    <FormField>
      <FormFieldLabel required>{ctx.label}</FormFieldLabel>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start"
        onClick={() =>
          ctx.app
            ? ctx.onChange(null)
            : ctx.onChange({ id: 'app-1', version: '1.0', name: 'Guardrail escalation app' })
        }
      >
        {ctx.app?.name ?? 'Select an app'}
      </Button>
      <FormFieldError>{ctx.error}</FormFieldError>
    </FormField>
  );
}

const marketplaceHelp = (
  <p className="text-xs text-muted-foreground">
    Escalation can only use apps compatible with the guardrails app template. You can{' '}
    <a
      href="https://marketplace.uipath.com"
      target="_blank"
      rel="noopener noreferrer"
      className="underline"
    >
      import one from Marketplace
    </a>
    .
  </p>
);

/** The default: a log action, no labels, no slots. */
export const Log: Story = {
  args: { action: logAction, onActionChange: () => {} },
  render: () => <ActionSectionHost initial={logAction} />,
};

/** Block takes a reason, and shows the host message from errors.blockReason. */
export const BlockWithError: Story = {
  args: { action: { $actionType: 'block', reason: '' }, onActionChange: () => {} },
  render: () => (
    <ActionSectionHost
      initial={{ $actionType: 'block', reason: '' }}
      errors={{ blockReason: 'Block reason is required' }}
    />
  ),
};

/**
 * Filter is custom-guardrail territory: the option appears only with showFilter, and the
 * field picker itself is host content passed as filterContent.
 */
export const FilterWithHostFieldPicker: Story = {
  args: { action: { $actionType: 'filter', fields: [] }, onActionChange: () => {} },
  render: () => {
    function FilterExample() {
      const [action, setAction] = useState<GuardrailAction>({ $actionType: 'filter', fields: [] });
      const selected = action.$actionType === 'filter' ? (action.fields as string[]) : [];
      return (
        <GuardrailActionSection
          action={action}
          onActionChange={setAction}
          showFilter
          errors={{ filterFields: selected.length ? undefined : 'Fields selection is required' }}
          filterContent={
            <>
              <Label htmlFor="filter-fields">
                Fields to filter
                <RequiredIndicator />
              </Label>
              <MultiSelect
                id="filter-fields"
                options={[
                  { label: 'input.email', value: 'input.email' },
                  { label: 'output.summary', value: 'output.summary' },
                ]}
                selected={selected}
                placeholder="Choose fields"
                onChange={(fields) => setAction({ $actionType: 'filter', fields })}
              />
            </>
          }
        />
      );
    }
    return <FilterExample />;
  },
};

/** Escalate with every slot filled, which is how both hosts mount it. */
export const EscalateWithSlots: Story = {
  args: { action: escalateAction, onActionChange: () => {} },
  render: () => (
    <ActionSectionHost
      initial={escalateAction}
      renderRecipientSearch={mockRecipientSearch}
      renderAppPicker={mockAppPicker}
      escalateHelp={marketplaceHelp}
    />
  ),
};

/**
 * Escalate with no slots at all: the recipient falls back to a plain input and the app picker
 * to a note. This is what a host sees before it wires its capabilities in.
 */
export const EscalateFallbacks: Story = {
  args: { action: escalateAction, onActionChange: () => {} },
  render: () => <ActionSectionHost initial={escalateAction} />,
};

/** Both escalation errors at once, as a save attempt would surface them. */
export const EscalateWithErrors: Story = {
  args: { action: escalateAction, onActionChange: () => {} },
  render: () => (
    <ActionSectionHost
      initial={escalateAction}
      renderRecipientSearch={mockRecipientSearch}
      renderAppPicker={mockAppPicker}
      errors={{ recipient: 'Recipient is required', actionApp: 'Action app is required' }}
      escalateHelp={marketplaceHelp}
    />
  ),
};

/**
 * The renderStaticRecipient slot owns the email and group-name editors, which is where Agents
 * puts its text-or-asset toggle. Returning undefined falls back to the plain input.
 */
export const EscalateStaticRecipientSlot: Story = {
  args: { action: escalateAction, onActionChange: () => {} },
  render: () => {
    function StaticRecipientExample() {
      const [assetMode, setAssetMode] = useState(false);
      return (
        <ActionSectionHost
          initial={{
            ...escalateAction,
            recipient: { type: GuardrailRecipientType.StaticEmail, value: '' },
          }}
          renderAppPicker={mockAppPicker}
          escalateHelp={marketplaceHelp}
          renderStaticRecipient={(ctx) => {
            const assetType =
              ctx.kind === 'email'
                ? GuardrailRecipientType.AssetEmail
                : GuardrailRecipientType.AssetGroupName;
            const staticType =
              ctx.kind === 'email'
                ? GuardrailRecipientType.StaticEmail
                : GuardrailRecipientType.StaticGroupName;
            const next = (value: string): GuardrailEscalateRecipient =>
              assetMode ? { type: assetType, assetName: value } : { type: staticType, value };
            const current =
              'assetName' in ctx.recipient ? ctx.recipient.assetName : ctx.recipient.value;
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="asset-mode"
                    checked={assetMode}
                    onCheckedChange={(checked) => {
                      setAssetMode(checked);
                      ctx.onChange(
                        checked
                          ? { type: assetType, assetName: '' }
                          : { type: staticType, value: '' }
                      );
                    }}
                  />
                  <Label htmlFor="asset-mode">Read from an asset</Label>
                </div>
                <Input
                  value={current}
                  placeholder={assetMode ? 'Asset name' : 'Enter a value'}
                  aria-label={ctx.label}
                  onChange={(e) => ctx.onChange(next(e.target.value))}
                />
              </div>
            );
          }}
        />
      );
    }
    return <StaticRecipientExample />;
  },
};

/**
 * EscalateActionFields on its own, with no leading action-type cell: for a host whose action
 * type lives somewhere else entirely.
 */
export const EscalateFieldsAlone: Story = {
  args: { action: escalateAction, onActionChange: () => {} },
  render: () => {
    function AloneExample() {
      const [action, setAction] = useState(escalateAction);
      return (
        <EscalateActionFields
          action={action}
          onChange={setAction}
          renderRecipientSearch={mockRecipientSearch}
          renderAppPicker={mockAppPicker}
          escalateHelp={marketplaceHelp}
        />
      );
    }
    return <AloneExample />;
  },
};

/**
 * asGridItems hands the three cells to a grid the host owns, here a three-column one. The
 * help line is the host's to place in this layout.
 */
export const EscalateFieldsInHostGrid: Story = {
  args: { action: escalateAction, onActionChange: () => {} },
  render: () => {
    function HostGridExample() {
      const [action, setAction] = useState(escalateAction);
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 items-start">
            <EscalateActionFields
              action={action}
              onChange={setAction}
              asGridItems
              renderRecipientSearch={mockRecipientSearch}
              renderAppPicker={mockAppPicker}
            />
          </div>
          {marketplaceHelp}
        </div>
      );
    }
    return <HostGridExample />;
  },
};

/** Per-string overrides win over the catalog; anything omitted still resolves. */
export const LabelOverrides: Story = {
  args: { action: logAction, onActionChange: () => {} },
  render: () => (
    <ActionSectionHost
      initial={logAction}
      labels={{ actionTypeLabel: 'What happens on a hit', actionLogLabel: 'Record only' }}
    />
  ),
};

/** Chrome strings resolved from the canvas lingui catalog (Japanese). */
export const Localized: Story = {
  args: { action: escalateAction, onActionChange: () => {} },
  decorators: [
    (Story) => (
      <ApI18nProvider component="canvas" locale="ja">
        <Story />
      </ApI18nProvider>
    ),
  ],
  render: () => (
    <ActionSectionHost
      initial={escalateAction}
      renderRecipientSearch={mockRecipientSearch}
      renderAppPicker={mockAppPicker}
    />
  ),
};
