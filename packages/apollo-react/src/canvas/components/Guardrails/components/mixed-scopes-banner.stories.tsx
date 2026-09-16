import type { Meta, StoryObj } from '@storybook/react-vite';
import { GUARDRAIL_BUILDER_EN_LABELS } from '../i18n';
import { MixedScopesBanner } from './mixed-scopes-banner';

const labels = {
  mixedScopesAlsoApplied: GUARDRAIL_BUILDER_EN_LABELS.mixedScopesAlsoApplied,
  mixedScopesSaveAsNewHint: GUARDRAIL_BUILDER_EN_LABELS.mixedScopesSaveAsNewHint,
};

const meta = {
  title: 'Components/UiPath/Mixed Scopes Banner',
  component: MixedScopesBanner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Shown when the guardrail being edited also governs somewhere else: other scopes, other tools,
or both. Editing it there changes behaviour the user cannot see from here, which is why the
banner ends in a "Save as new" hint.

The scopes and tool names arrive pre-localized. This package does not know a host's tool
names, and scope labels are the host's wording.

Pass \`otherAppliedScopes: null\` and the banner renders nothing, so a caller can mount it
unconditionally.
        `,
      },
    },
  },
  tags: ['autodocs'],
  args: {
    otherAppliedScopes: { scopes: ['Agent'], tools: ['Search invoices', 'Send email'] },
    labels,
  },
} satisfies Meta<typeof MixedScopesBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Scopes only, which is what an Agent-level guardrail opened from a tool looks like. */
export const ScopesOnly: Story = {
  args: { otherAppliedScopes: { scopes: ['Agent', 'Tools'], tools: [] }, labels },
};

/** Nothing to warn about: the banner renders nothing rather than an empty box. */
export const Hidden: Story = {
  args: { otherAppliedScopes: null, labels },
};
