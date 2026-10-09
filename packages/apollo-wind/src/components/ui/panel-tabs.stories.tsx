import type { Meta } from '@storybook/react-vite';
import { ChevronsUpDown, Eye, Search } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Button } from './button';
import {
  PanelTabs,
  PanelTabsContent,
  PanelTabsList,
  PanelTabsStrip,
  PanelTabsTrigger,
} from './panel-tabs';

const meta: Meta<typeof PanelTabs> = {
  title: 'Components/Navigation/Panel Tabs',
  component: PanelTabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'The tab shell of a side panel: a pinned row of pill tabs and a scrolling content area. It owns the panel spacing, so every panel lines up. Sides follow the host panel inset (`--mf-content-inset`), the tab row sits 12px below what is above it, and content starts 12px below the tabs. MetadataForm renders its tabs with it.',
      },
    },
  },
};

export default meta;

/** A stand-in panel: a bordered column with the 16px content inset a panel sets. */
function Frame({ children, width = 380 }: { children: ReactNode; width?: number }) {
  return (
    <div
      className="flex h-[320px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-raised pt-4"
      style={{ width, '--mf-content-inset': '1rem' } as CSSProperties}
    >
      {children}
    </div>
  );
}

function Fields() {
  return (
    <div className="grid gap-4 text-sm text-foreground-muted">
      <p>Content starts 12px below the tabs and follows the panel inset.</p>
      <p>The content area scrolls on its own, so the tab row stays pinned.</p>
    </div>
  );
}

// ============================================================================
// Basic
// ============================================================================

export const Basic = {
  name: 'Basic',
  render: () => (
    <Frame>
      <PanelTabs defaultValue="parameters">
        <PanelTabsList>
          <PanelTabsTrigger value="parameters">Parameters</PanelTabsTrigger>
          <PanelTabsTrigger value="error-handling">Error handling</PanelTabsTrigger>
          <PanelTabsTrigger value="advanced">Advanced</PanelTabsTrigger>
        </PanelTabsList>
        <PanelTabsContent value="parameters">
          <Fields />
        </PanelTabsContent>
        <PanelTabsContent value="error-handling">
          <p className="text-sm text-foreground-muted">Retry and fallback settings.</p>
        </PanelTabsContent>
        <PanelTabsContent value="advanced">
          <p className="text-sm text-foreground-muted">Timeouts and identifiers.</p>
        </PanelTabsContent>
      </PanelTabs>
    </Frame>
  ),
};

// ============================================================================
// Trailing slot
// ============================================================================

export const Trailing = {
  name: 'Trailing controls',
  parameters: {
    docs: {
      description: {
        story: 'Pass controls in `trailing` to place them at the end of the tab row.',
      },
    },
  },
  render: () => (
    <Frame>
      <PanelTabs defaultValue="components">
        <PanelTabsList
          trailing={
            <>
              <Button variant="ghost" size="4xs" icon aria-label="Show notes">
                <Eye size={13} />
              </Button>
              <Button variant="ghost" size="4xs" icon aria-label="Expand all sections">
                <ChevronsUpDown size={13} />
              </Button>
            </>
          }
        >
          <PanelTabsTrigger value="components">Components</PanelTabsTrigger>
          <PanelTabsTrigger value="layout">Layout</PanelTabsTrigger>
        </PanelTabsList>
        <PanelTabsContent value="components">
          <Fields />
        </PanelTabsContent>
        <PanelTabsContent value="layout">
          <Fields />
        </PanelTabsContent>
      </PanelTabs>
    </Frame>
  ),
};

// ============================================================================
// Overflow
// ============================================================================

export const Overflow = {
  name: 'Overflow in a narrow panel',
  parameters: {
    docs: {
      description: {
        story:
          'When the tabs do not fit, the strip reveals previous and next buttons and keeps the active tab in view.',
      },
    },
  },
  render: () => (
    <Frame width={260}>
      <PanelTabs defaultValue="parameters">
        <PanelTabsList>
          <PanelTabsTrigger value="parameters">Parameters</PanelTabsTrigger>
          <PanelTabsTrigger value="branching">Branching</PanelTabsTrigger>
          <PanelTabsTrigger value="error-handling">Error handling</PanelTabsTrigger>
          <PanelTabsTrigger value="advanced">Advanced</PanelTabsTrigger>
        </PanelTabsList>
        {['parameters', 'branching', 'error-handling', 'advanced'].map((value) => (
          <PanelTabsContent key={value} value={value}>
            <Fields />
          </PanelTabsContent>
        ))}
      </PanelTabs>
    </Frame>
  ),
};

// ============================================================================
// Strip in a shared row
// ============================================================================

export const SharedRow = {
  name: 'Strip in a toolbar row',
  parameters: {
    docs: {
      description: {
        story:
          'Use `PanelTabsStrip` alone when the tabs share a row with other controls, such as a tree toolbar. The strip is sized to its tabs and has no vertical padding, so the row keeps its height.',
      },
    },
  },
  render: () => (
    <Frame>
      <PanelTabs defaultValue="schema">
        <div className="flex shrink-0 items-center gap-1.5 [padding-inline:var(--mf-content-inset)]">
          <PanelTabsStrip>
            <PanelTabsTrigger value="schema">Schema</PanelTabsTrigger>
            <PanelTabsTrigger value="json">JSON</PanelTabsTrigger>
          </PanelTabsStrip>
          <div className="flex-1" />
          <Button variant="ghost" size="4xs" icon aria-label="Search fields and values">
            <Search size={12} />
          </Button>
        </div>
        <PanelTabsContent value="schema">
          <Fields />
        </PanelTabsContent>
        <PanelTabsContent value="json">
          <Fields />
        </PanelTabsContent>
      </PanelTabs>
    </Frame>
  ),
};

// ============================================================================
// Self-padded content
// ============================================================================

export const SelfPadded = {
  name: 'Self-padded content',
  parameters: {
    docs: {
      description: {
        story:
          'Set `padded={false}` for content that pads itself, such as full-width sections with dividers. Its first block should start with `pt-1.5` to keep the 12px gap under the tabs.',
      },
    },
  },
  render: () => (
    <Frame>
      <PanelTabs defaultValue="sections">
        <PanelTabsList>
          <PanelTabsTrigger value="sections">Sections</PanelTabsTrigger>
        </PanelTabsList>
        <PanelTabsContent value="sections" padded={false}>
          {['Connection', 'Options'].map((title, index) => (
            <section
              key={title}
              className={
                index === 0
                  ? 'pt-1.5 pb-4 [padding-inline:var(--mf-content-inset)]'
                  : 'border-t border-border-subtle py-4 [padding-inline:var(--mf-content-inset)]'
              }
            >
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-foreground-muted">
                Full-width divider, content on the panel inset.
              </p>
            </section>
          ))}
        </PanelTabsContent>
      </PanelTabs>
    </Frame>
  ),
};
