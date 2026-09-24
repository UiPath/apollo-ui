import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@uipath/apollo-wind';
import { type ComponentProps, useMemo, useState } from 'react';
import { ApI18nProvider } from '../../../../i18n';
import type { GuardrailScopeSelectorErrors, GuardrailSelector } from '../builder-types';
import { getGuardrailSelectorErrorFields } from '../builder-utils';
import { GUARDRAIL_BUILDER_EN_LABELS } from '../i18n';
import { GuardrailScopeSelector } from './guardrail-scope-selector';

const meta = {
  title: 'Components/UiPath/Guardrail Scope Selector',
  component: GuardrailScopeSelector,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Where a guardrail applies: the Agent, LLM calls and Tools scopes, and once Tools is on, the tools
it targets. The value is a GuardrailSelector, and every change emits the whole next one.

Rendered inside GuardrailBuilder for agent-level guardrails, and usable on its own with selector
and onChange alone. The Tools scope is offered only when availableToolNames has entries, and
turning it on targets every tool in the list.
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[480px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GuardrailScopeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

const TOOLS = ['Send email', 'Create ticket', 'Search knowledge base'];

const agentOnly: GuardrailSelector = { scopes: ['Agent'] };

type HostProps = { initial: GuardrailSelector } & Omit<
  ComponentProps<typeof GuardrailScopeSelector>,
  'selector' | 'onChange'
>;

/** Keeps the selector in state so the chips move. */
function ScopeSelectorHost({ initial, ...props }: HostProps) {
  const [selector, setSelector] = useState(initial);
  return (
    <div className="space-y-4">
      <GuardrailScopeSelector {...props} selector={selector} onChange={setSelector} />
      <pre className="text-xs bg-muted rounded-md p-2 overflow-x-auto">
        {JSON.stringify(selector, null, 2)}
      </pre>
    </div>
  );
}

/** The host side of validation: which fields fail, worded with the builder's messages. */
function getSelectorErrors(selector: GuardrailSelector): GuardrailScopeSelectorErrors {
  const errors: GuardrailScopeSelectorErrors = {};
  for (const field of getGuardrailSelectorErrorFields(selector)) {
    errors[field] =
      field === 'scopes'
        ? GUARDRAIL_BUILDER_EN_LABELS.scopesRequiredError
        : GUARDRAIL_BUILDER_EN_LABELS.toolsRequiredError;
  }
  return errors;
}

/** The default: all three scopes, no labels. Turning Tools on targets every tool. */
export const AllScopes: Story = {
  args: { selector: agentOnly, onChange: () => {} },
  render: () => <ScopeSelectorHost initial={agentOnly} availableToolNames={TOOLS} />,
};

/**
 * Tools mode. Targeted tools are pressed and carry a check; the rest of availableToolNames are
 * offered with a plus.
 */
export const ToolTargeting: Story = {
  args: { selector: { scopes: ['Agent', 'Tool'], matchNames: ['Send email'] }, onChange: () => {} },
  render: () => (
    <ScopeSelectorHost
      initial={{ scopes: ['Agent', 'Tool'], matchNames: ['Send email'] }}
      availableToolNames={TOOLS}
    />
  ),
};

/** Without availableToolNames the Tools scope is not offered at all. */
export const WithoutAvailableTools: Story = {
  args: { selector: { scopes: ['Agent', 'Llm'] }, onChange: () => {} },
  render: () => <ScopeSelectorHost initial={{ scopes: ['Agent', 'Llm'] }} />,
};

/** allowedScopes narrows the offer to what a definition supports, here no tool calls. */
export const AllowedScopes: Story = {
  args: { selector: { scopes: ['Llm'] }, onChange: () => {} },
  render: () => (
    <ScopeSelectorHost
      initial={{ scopes: ['Llm'] }}
      allowedScopes={['Agent', 'Llm']}
      availableToolNames={TOOLS}
    />
  ),
};

/**
 * Errors are host-owned and render as soon as they are present. These are recomputed on every
 * change: deselect Tools to swap the tools message for the scopes one.
 */
export const WithErrors: Story = {
  args: { selector: { scopes: ['Tool'], matchNames: [] }, onChange: () => {} },
  render: () => {
    function ErrorsExample() {
      const [selector, setSelector] = useState<GuardrailSelector>({
        scopes: ['Tool'],
        matchNames: [],
      });
      const errors = useMemo(() => getSelectorErrors(selector), [selector]);
      return (
        <GuardrailScopeSelector
          selector={selector}
          onChange={setSelector}
          availableToolNames={TOOLS}
          errors={errors}
        />
      );
    }
    return <ErrorsExample />;
  },
};

/** A host that shows errors only after a save attempt withholds the errors prop until then. */
export const ErrorsAfterSaveAttempt: Story = {
  args: { selector: { scopes: [] }, onChange: () => {} },
  render: () => {
    function SaveAttemptExample() {
      const [selector, setSelector] = useState<GuardrailSelector>({ scopes: [] });
      const [attempted, setAttempted] = useState(false);
      const errors = useMemo(() => getSelectorErrors(selector), [selector]);
      return (
        <div className="space-y-4">
          <GuardrailScopeSelector
            selector={selector}
            onChange={setSelector}
            availableToolNames={TOOLS}
            errors={attempted ? errors : undefined}
          />
          <Button type="button" onClick={() => setAttempted(true)}>
            Save
          </Button>
        </div>
      );
    }
    return <SaveAttemptExample />;
  },
};

/** Per-string overrides win over the catalog. */
export const LabelOverrides: Story = {
  args: { selector: agentOnly, onChange: () => {} },
  render: () => (
    <ScopeSelectorHost
      initial={agentOnly}
      availableToolNames={TOOLS}
      labels={{ scopesLabel: 'Applies to', scopeLlmLabel: 'Model calls' }}
    />
  ),
};

/** Chrome strings resolved from the canvas lingui catalog (Japanese). */
export const Localized: Story = {
  args: { selector: agentOnly, onChange: () => {} },
  decorators: [
    (Story) => (
      <ApI18nProvider component="canvas" locale="ja">
        <Story />
      </ApI18nProvider>
    ),
  ],
  render: () => (
    <ScopeSelectorHost
      initial={{ scopes: ['Agent', 'Tool'], matchNames: ['Send email'] }}
      availableToolNames={TOOLS}
    />
  ),
};
