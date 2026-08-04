import type { Meta, StoryObj } from '@storybook/react-vite';
import type React from 'react';

import { ModelTagChip } from './ModelTagChip';
import type { ModelTag } from './types';

// Demo-only showcase of the picker's badge system. Not part of the
// shipped component surface: kept out of the PR on purpose.

const meta: Meta<typeof ModelTagChip> = {
  title: 'Components/ModelPicker/Badges',
  component: ModelTagChip,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Every badge the ModelPicker can render, isolated from the picker. ' +
          'Lifecycle badges are derived automatically from the Discovery DTO ' +
          'and ship today. The second section is a proposal: badges a product ' +
          'could add through `customTagsFor`, reusing the five mini variants. ' +
          'No product ships these yet. Colors read from `--color-*` CSS ' +
          'variables, so the same chips adapt to the light and dark themes ' +
          'in the toolbar.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModelTagChip>;

const LIFECYCLE_TAGS: { tag: ModelTag; note: string }[] = [
  {
    tag: {
      kind: 'recommended',
      label: 'Recommended',
      tooltip: 'Based on evaluation runs for this product',
    },
    note: 'Discovery DTO: isRecommended',
  },
  {
    tag: { kind: 'preview', label: 'Preview' },
    note: 'Discovery DTO: isPreview',
  },
  {
    tag: {
      kind: 'deprecating',
      label: 'Deprecating Sep 2026',
      tooltip: 'Will be replaced by gpt-5-2025-08-07',
    },
    note: 'deprecationDetails.usageEndDate',
  },
  {
    tag: {
      kind: 'substituted',
      label: 'Routes to gpt-6-2026-03-15',
      tooltip: 'This model is retired. Your traffic is currently being routed to gpt-6-2026-03-15.',
    },
    note: 'effectiveModel differs from the selection',
  },
  {
    tag: {
      kind: 'out-of-region',
      label: 'Out of region (US)',
      tooltip: 'Routes traffic outside EU',
    },
    note: 'routingDetails.geography vs homeRegion',
  },
  {
    tag: { kind: 'custom', label: 'Custom' },
    note: 'BYO connection models',
  },
];

// Proposal material only: none of these ship in any product today. They
// illustrate what a product COULD stamp through `customTagsFor` and which
// mini variant each idea would map to.
const PROPOSED_TAGS: { tag: ModelTag; note: string }[] = [
  {
    tag: { kind: 'cost-basic', label: 'Basic' },
    note: 'cost tier idea, via the exported defaultCostTier helper',
  },
  {
    tag: { kind: 'cost-standard', label: 'Standard' },
    note: 'cost tier idea, via the exported defaultCostTier helper',
  },
  {
    tag: { kind: 'cost-premium', label: 'Premium' },
    note: 'cost tier idea, via the exported defaultCostTier helper',
  },
  {
    tag: { kind: 'long-context', label: 'Long context', variant: 'info-mini' },
    note: 'idea: flag 1M-token models (variant info-mini)',
  },
  {
    tag: {
      kind: 'onprem',
      label: 'On-prem',
      variant: 'warning-mini',
      tooltip: 'Routes to an on-prem connection',
    },
    note: 'idea: mark on-prem connections (variant warning-mini)',
  },
  {
    tag: { kind: 'fine-tuned', label: 'Fine-tuned', variant: 'success-mini' },
    note: 'idea: mark customer fine-tunes (variant success-mini)',
  },
  {
    tag: { kind: 'restricted', label: 'Restricted', variant: 'error-mini' },
    note: 'idea: compliance-restricted models (variant error-mini)',
  },
];

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 0.7,
  textTransform: 'uppercase',
  color: 'var(--color-foreground-de-emp, #526069)',
  margin: '24px 0 4px',
};

const row: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '10px 0',
  borderBottom: '1px solid var(--color-border-grid, #e3e5e8)',
};

const noteStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-foreground-de-emp, #526069)',
};

// Dashed container so the proposed badges read as a sketch, not as
// shipped product behavior.
const proposalPanel: React.CSSProperties = {
  border: '1.5px dashed var(--color-border, #cfd8dd)',
  borderRadius: 10,
  padding: '4px 16px 12px',
  marginTop: 8,
};

const proposalBadge: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.7,
  padding: '1px 6px',
  borderRadius: 4,
  marginLeft: 8,
  color: 'var(--color-info-foreground, #1665b3)',
  backgroundColor: 'var(--color-info-background, #e9f1fa)',
};

const BadgeGallery: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      padding: 40,
      boxSizing: 'border-box',
      background: 'var(--color-background, #ffffff)',
      color: 'var(--color-foreground, #273139)',
      fontFamily: 'noto sans, sans-serif',
    }}
  >
    <div style={{ maxWidth: 560 }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>ModelPicker badges</h3>
      <p style={{ ...noteStyle, marginTop: 4 }}>
        Hover a badge to see its tooltip. Flip the theme in the toolbar: every color reads from CSS
        variables, no ThemeProvider involved.
      </p>

      <div style={sectionTitle}>Lifecycle (derived from the Discovery DTO)</div>
      {LIFECYCLE_TAGS.map(({ tag, note }) => (
        <div key={tag.kind} style={row}>
          <div style={{ minWidth: 220 }}>
            <ModelTagChip tag={tag} />
          </div>
          <span style={noteStyle}>{note}</span>
        </div>
      ))}

      <div style={sectionTitle}>
        Product-defined (customTagsFor)
        <span style={proposalBadge}>PROPOSAL</span>
      </div>
      <div style={proposalPanel}>
        <p style={{ ...noteStyle, margin: '8px 0 4px' }}>
          Illustration only: no product renders these today. Each row is an idea a product team
          could ship with a single callback, shown here to demonstrate the extension point and the
          five variant colors.
        </p>
        {PROPOSED_TAGS.map(({ tag, note }) => (
          <div key={tag.kind} style={row}>
            <div style={{ minWidth: 220 }}>
              <ModelTagChip tag={tag} />
            </div>
            <span style={noteStyle}>{note}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const AllBadges: Story = {
  name: 'All badges',
  render: () => <BadgeGallery />,
};
